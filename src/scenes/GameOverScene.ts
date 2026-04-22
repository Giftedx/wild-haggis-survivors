import Phaser from 'phaser';
import { COLORS, COLORS_CSS, UI } from '../config';
import { audio } from '../systems/AudioSystem';
import { musicEngine } from '../systems/music/ProceduralMusicEngine';
import { getVariantByKey, VariantKey } from '../data/variants';
import type { GameOverPayload } from './gameOverPayload';
import { t } from '../core/i18n';
import { getSettingsManager } from '../core/SettingsManager';
import { SaveManager } from '../core/SaveManager';
import type { DeathCause } from '../core/deathCauseClassifier';
import { getCurseByKey, setPendingCurse } from '../data/curses';
import {
  formatClockTime,
  computeGoldBreakdown,
  boundedLoadoutSummary,
  buildWeaponDamageRows,
  formatDeathInsightLine,
  resolveUnlockHeading,
  formatUnlockBodyText,
  formatRerunSeedLinkLabel,
  formatSeedReadoutLabel,
  buildPostcardPayloadFromGameOver,
} from './gameOverFormatting';
import { resolveGameOverPanelTheme, pickGameOverTitleKeys, ironmoorBannerStyle } from './gameOverPanelTheme';
import { renderVariantChip } from './gameOverVariantChip';
import { resolveCopyActionLinkPalette, resolveRerunLinkPalette } from './gameOverLinkPalette';
import { downloadPostcard } from '../utils/postcard';
import { copyTextToClipboard } from '../utils/clipboard';
import { saveScreenshot } from '../utils/screenshot';
import { buildCaptureFilename } from '../utils/captureFilename';
import { formatLocalYmd } from '../utils/formatDate';
import { TOAST_COLORS } from '../ui/toastPalette';
import { createGameButton } from '../ui/gameButton';
import { textStyle } from '../ui/typography';

// Shared text style for the small italic action links under the
// big result panel (seed copy, postcard download, rerun ↻). Each
// site varies the colour from its own palette.idle on hover/press,
// so the colour stays a per-call argument; everything else is fixed.
const COPY_ACTION_LINK_TEXT_BASE = textStyle('subtitle', { fontSize: '12px', align: 'center' });

/**
 * Run result screen — owns UI after GameScene tears down (macro lifecycle).
 */
export class GameOverScene extends Phaser.Scene {
  // Payload is optional because Phaser can restart a scene with no data
  // (e.g. during hot-reload in dev, or if a caller mis-uses scene.start).
  // We fall back to MainMenu in create() when it's missing rather than
  // asserting non-null here and crashing on the first field access.
  private payload: GameOverPayload | null = null;

  constructor() {
    super({ key: 'GameOver' });
  }

  init(data?: GameOverPayload): void {
    this.payload = data ?? null;
  }

  create(): void {
    if (!this.payload?.summary || !this.payload.runResult) {
      this.scene.start('MainMenu');
      return;
    }
    const { width, height } = this.scale;
    const d = 200;
    const { uiScale, highContrastUi } = getSettingsManager().load();
    const { mode, summary, runResult } = this.payload;
    const isVictory = this.payload.isVictory ?? (mode === 'victory');
    const weaponDamage = this.payload.weaponDamage ?? {};
    const theme = resolveGameOverPanelTheme(isVictory);
    const titleColor = theme.titleColor;
    const panelStroke = theme.panelStroke;
    const summaryTime = formatClockTime(summary.timeSurvivedSec);
    const gb = computeGoldBreakdown({
      timeSurvivedSec: summary.timeSurvivedSec,
      enemiesKilled: summary.enemiesKilled,
      bossGold: summary.bossGold,
      coinGold: summary.coinGold ?? 0,
      goldMult: summary.goldMult ?? 1,
    });
    const goldBreakdown = t('ui.gameOver.gold_breakdown', gb);

    // Responsive panel layout. Content positions are relative to the panel
    // top (not the screen top) so taller/narrower viewports don't leave the
    // title + subtitle dangling above the outline as a hardcoded
    // height/2 - 328 would do on screen sizes outside the original design
    // target (720px tall).
    const PANEL_W = Math.min(684, width - 24);
    const PANEL_H = Math.min(656, height - 24);
    // Clamp the panel so it stays fully visible even on viewports smaller
    // than PANEL_H. On small screens the panel becomes the clamp region;
    // on larger screens it centers naturally.
    const panelCenterX = width / 2;
    const panelCenterY = Math.max(PANEL_H / 2 + 8, Math.min(height - PANEL_H / 2 - 8, height / 2));
    const panelTop = panelCenterY - PANEL_H / 2;

    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, COLORS.BG_DARK, 0)
      .setScrollFactor(0)
      .setDepth(d)
      .setInteractive();
    const panel = this.add
      .rectangle(panelCenterX, panelCenterY, PANEL_W, PANEL_H, COLORS.PANEL, 0)
      .setScrollFactor(0)
      .setDepth(d + 1)
      .setStrokeStyle(2, highContrastUi ? 0x8fb4ff : panelStroke, 1);
    this.tweens.add({ targets: overlay, alpha: UI.OVERLAY_ALPHA, duration: 420 });
    this.tweens.add({ targets: panel, alpha: 0.98, duration: 420 });

    // Rotating death titles/subtitles — each death feels different
    const { titleKey: deathTitleKey, subKey: deathSubKey } = pickGameOverTitleKeys(
      isVictory,
      Phaser.Math.Between(0, 3),
      Phaser.Math.Between(0, 3),
    );

    const title = this.add
      .text(panelCenterX, panelTop + 54, t(deathTitleKey),
        textStyle('display', { color: titleColor }),
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setAlpha(0)
      .setScale(theme.titleStartScale);
    title.setScale(theme.titleStartScale * uiScale);
    const subtitle = this.add
      .text(panelCenterX, panelTop + 94, t(deathSubKey),
        textStyle('body', { color: COLORS_CSS.DUSTY_TAN, align: 'center', wordWrap: { width: (PANEL_W - 48) / Math.max(1, uiScale) } }),
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setAlpha(0);
    subtitle.setScale(uiScale);

    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: uiScale,
      duration: 480,
      delay: 180,
      ease: 'Back.easeOut',
    });
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 320, delay: 320 });

    // W66 Ironmoor amplification: an extra rose-pink banner on any
    // Ironmoor run (victory or death) so the posture is acknowledged
    // in the ceremony. Victory copy leans into the pride moment;
    // death copy keeps the Soul Charter compassionate register.
    if (this.payload.ironmoor) {
      const banner_ = ironmoorBannerStyle(isVictory);
      const banner = this.add
        .text(panelCenterX, panelTop + 118, t(banner_.key),
          textStyle('body', { color: banner_.color, align: 'center', wordWrap: { width: (PANEL_W - 48) / Math.max(1, uiScale) } }),
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(d + 2)
        .setAlpha(0)
        .setScale(uiScale);
      this.tweens.add({ targets: banner, alpha: 1, duration: 320, delay: 520 });
    }

    // "Whit got ye" insight — death only. Single compact line combining the
    // classified headline + takeaway tip, fit into the gap between subtitle
    // (+94) and variant chip (+140). Soul Charter: failure must be
    // *informative and compassionate, never shaming*.
    if (!isVictory && this.payload.deathCause) {
      this.renderDeathInsight(panelCenterX, panelTop + 116, d + 3, this.payload.deathCause, uiScale, PANEL_W);
    }

    // Variant chip — warm identity reminder with haggis sprite + flavor text
    const variantChipY = panelTop + 162;
    renderVariantChip(this, {
      centerX: panelCenterX,
      top: variantChipY,
      payload: this.payload,
      uiScale,
      reduceParticles: getSettingsManager().load().reduceParticles === true,
      depth: d,
    });

    // Curse chip — small one-liner acknowledging the curse the player bore.
    // Sits below the variant chip (one row), above the stats panel. Only
    // rendered if the run had a curse active.
    const curseDef = getCurseByKey(this.payload.curseKey ?? null);
    if (curseDef) {
      const curseChipY = variantChipY + 38;
      const curseChip = this.add
        .rectangle(panelCenterX, curseChipY, 560, 22, 0x2a1830, 0.96)
        .setScrollFactor(0)
        .setDepth(d + 2)
        .setStrokeStyle(1, 0xb35287, 0.9)
        .setAlpha(0);
      const curseText = this.add
        .text(panelCenterX, curseChipY, t('ui.gameOver.curse_chip', {
          curse: t(curseDef.nameKey),
          pct: curseDef.goldBonusPct,
        }),
          textStyle('label', { fontSize: '12px', color: COLORS_CSS.CURSE_MAUVE_BRIGHT }),
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(d + 3)
        .setAlpha(0);
      curseText.setScale(uiScale);
      this.tweens.add({ targets: [curseChip, curseText], alpha: 1, duration: 260, delay: 500 });
    }

    const innerW = PANEL_W - 88;
    // Panel heights scale with uiScale so the scaled text inside each one
    // (weaponBody, goldText, unlockContent) doesn't spill past the panel
    // border at uiScale 1.4. The weaponDamagePanel holds the most text
    // (loadoutSummary + heading + 3 weapon rows) so it gets full scale;
    // gold/unlock panels scale a touch less since their content is tighter.
    // When the panel stack would exceed the PANEL_H budget, lower panels
    // clamp so link/button rows at the panel bottom stay clickable.
    const panelScale = Math.max(1, uiScale);
    const weaponPanelH = Math.round(158 * panelScale);
    const goldPanelH = Math.round(70 * panelScale);
    const unlockPanelH = Math.round(94 * panelScale);
    // weaponDamagePanel: keep top anchored near stats panel bottom (+273)
    // so scaled content grows downward, not up into the variant/curse chips.
    const weaponPanelTop = panelTop + 273;
    const weaponPanelCenterY = weaponPanelTop + weaponPanelH / 2;
    const weaponPanelBottom = weaponPanelTop + weaponPanelH;
    // goldPanel: sits immediately under the weapon panel with a small gap.
    const goldPanelCenterY = weaponPanelBottom + 2 + goldPanelH / 2;
    const goldPanelBottom = goldPanelCenterY + goldPanelH / 2;
    // unlockPanel: clamped so it never leaks past canvas bottom on short
    // viewports (native 600 was pushing ~9px offscreen even at uiScale 1)
    // *and* keeps breathing room above the link/button rows that anchor
    // at PANEL_H - 44 / PANEL_H - 22. Without the PANEL_H clamp a 1.4x
    // panel would push its bottom edge behind the rerun link.
    const unlockPanelCenterYIdeal = goldPanelBottom + 2 + unlockPanelH / 2;
    const unlockPanelCenterYMax = Math.min(
      height - 8 - unlockPanelH / 2,
      panelTop + PANEL_H - Math.round(56 * panelScale) - unlockPanelH / 2,
    );
    const unlockPanelY = Math.min(unlockPanelCenterYIdeal, unlockPanelCenterYMax);
    const statsPanel = this.add
      .rectangle(panelCenterX, panelTop + 226, innerW, 92, 0x131d32, 0.95)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setStrokeStyle(1, 0x283a5f, 1)
      .setAlpha(0);
    const goldPanel = this.add
      .rectangle(panelCenterX, goldPanelCenterY, innerW, goldPanelH, 0x141d2f, 0.95)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setStrokeStyle(1, 0x2f435f, 1)
      .setAlpha(0);
    const weaponDamagePanel = this.add
      .rectangle(panelCenterX, weaponPanelCenterY, innerW, weaponPanelH, 0x0f1828, 0.95)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setStrokeStyle(1, 0x243552, 1)
      .setAlpha(0);
    const unlockPanel = this.add
      .rectangle(panelCenterX, unlockPanelY, innerW, unlockPanelH, 0x121a2a, 0.95)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setStrokeStyle(1, 0x283447, 1)
      .setAlpha(0);
    this.tweens.add({ targets: [statsPanel, weaponDamagePanel, goldPanel, unlockPanel], alpha: 1, duration: 260, delay: 520 });

    const statBaseY = panelTop + 200;
    const statGap = Math.min(142, Math.floor(PANEL_W * 0.21));
    const statRowGap = Math.round(42 * uiScale);
    const pb = this.payload.previousBests;
    this.createResultStat(panelCenterX - statGap, statBaseY, t('ui.gameOver.stat_time'), summaryTime, d + 3, 600, uiScale,
      pb && summary.timeSurvivedSec > pb.bestTime);
    this.createResultStat(panelCenterX, statBaseY, t('ui.gameOver.stat_kills'), `${summary.enemiesKilled}`, d + 3, 660, uiScale,
      pb && summary.enemiesKilled > pb.bestKills);
    this.createResultStat(panelCenterX + statGap, statBaseY, t('ui.gameOver.stat_level'), `${this.payload.xpLevel}`, d + 3, 720, uiScale,
      pb && this.payload.xpLevel > pb.bestLevel);
    this.createResultStat(panelCenterX - statGap, statBaseY + statRowGap, t('ui.gameOver.stat_bosses'), `${this.payload.bossKillCount}`, d + 3, 780, uiScale);
    this.createResultStat(panelCenterX, statBaseY + statRowGap, t('ui.gameOver.stat_passives'), `${this.payload.ownedPassiveCount}`, d + 3, 840, uiScale);
    this.createResultStat(panelCenterX + statGap, statBaseY + statRowGap, t('ui.gameOver.stat_combo'), `${summary.bestCombo ?? 0}x`, d + 3, 900, uiScale,
      pb && (summary.bestCombo ?? 0) > pb.bestCombo);

    const loadoutSummaryText = boundedLoadoutSummary(this.payload.buildSummary, 2);
    const weaponsHead =
      this.payload.weaponCount === 1
        ? t('ui.gameOver.weapons_line_one', { evolved: this.payload.evolvedCount })
        : t('ui.gameOver.weapons_line', { count: this.payload.weaponCount, evolved: this.payload.evolvedCount });
    const loadoutSummary = this.add
      .text(
        panelCenterX,
        weaponPanelTop + Math.round(15 * panelScale),
        `${weaponsHead}\n${loadoutSummaryText}`,
        {
          ...textStyle('label', { color: COLORS_CSS.TEXT_SECONDARY, align: 'center', wordWrap: { width: Math.min(560, PANEL_W - 48) / Math.max(1, uiScale) } }),
          lineSpacing: 6,
        }
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(d + 3)
      .setAlpha(0);
    loadoutSummary.setScale(uiScale);
    this.tweens.add({ targets: loadoutSummary, alpha: 1, duration: 260, delay: 900 });

    const weaponRows = buildWeaponDamageRows({
      weaponDamage,
      enemiesKilled: summary.enemiesKilled,
      timeSurvivedSec: summary.timeSurvivedSec,
      goldEarned: runResult.goldEarned,
      maxRows: 3,
    });
    // Use displayHeight (post-scale) so chained positions match visual bottom.
    // Previous plain `.height` under-measured at uiScale 1.4, letting weapon
    // rows overlap the goldPanel background.
    const loadoutBottom = loadoutSummary.y + loadoutSummary.displayHeight;
    const weaponHeading = this.add
      .text(panelCenterX, loadoutBottom + Math.round(10 * panelScale), t('ui.gameOver.damage_by_weapon'), {
        ...textStyle('label', { color: COLORS_CSS.TEXT_SUBTITLE }),
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 3)
      .setAlpha(0);
    weaponHeading.setScale(uiScale);
    const weaponBody = this.add
      .text(panelCenterX, weaponHeading.y + Math.round(16 * panelScale), weaponRows, {
        ...textStyle('label', { color: COLORS_CSS.TEXT_PRIMARY, align: 'center', wordWrap: { width: Math.min(560, PANEL_W - 48) / Math.max(1, uiScale) } }),
        lineSpacing: 4,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(d + 3)
      .setAlpha(0);
    weaponBody.setScale(uiScale);
    this.tweens.add({ targets: [weaponHeading, weaponBody], alpha: 1, duration: 260, delay: 940 });
    // goldTitleY anchors on the goldPanel centre (already shifted with scale)
    // rather than a fixed +420 offset, so it moves with the panel at 1.4x.
    const goldTitleY = goldPanelCenterY - Math.round(15 * panelScale);

    const goldTitle = this.add
      .text(panelCenterX, goldTitleY, t('ui.gameOver.gold_title', { amount: runResult.goldEarned }),
        textStyle('heading', { fontSize: '28px', color: COLORS_CSS.WHISKY_GOLD }),
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 3)
      .setAlpha(0);
    goldTitle.setScale(uiScale);
    const goldText = this.add
      .text(panelCenterX, goldTitleY + Math.round(30 * panelScale), goldBreakdown,
        textStyle('label', { fontSize: '12px', color: COLORS_CSS.LABEL_TAN, align: 'center' }),
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 3)
      .setAlpha(0);
    goldText.setScale(uiScale);
    this.tweens.add({
      targets: goldTitle,
      alpha: 1,
      scale: { from: 0.7, to: 1 },
      duration: 300,
      delay: 980,
      ease: 'Back.easeOut',
    });
    this.tweens.add({ targets: goldText, alpha: 1, duration: 240, delay: 1080 });

    // Unlock content sits inside the unlockPanel — anchor on panel centre
    // minus a small top-padding so scaled text stays visually contained at
    // uiScale 1.4 instead of using the old fixed `panelTop + 512`.
    this.addRunResultUnlockContent(panelCenterX, unlockPanelY - Math.round(38 * panelScale), d + 3, runResult.newlyUnlockedVariants, 1140);

    // Seed readout — sits just above the action buttons. For daily runs it
    // prefixes "DAILY" and shows the date; for seeded runs just the code.
    // Tapping copies the code to the clipboard so players can share.
    if (this.payload.seedCode) {
      // Clamp seed readout above canvas bottom — default offset assumes a
      // 720px-tall design target, but native 600 clips this by a couple px.
      // At uiScale 1.4 we also anchor it above the scaled unlock panel so
      // the seed code isn't swallowed by the unlock banner.
      const seedY = Math.min(
        Math.max(panelTop + 590, unlockPanelY + unlockPanelH / 2 + Math.round(14 * panelScale)),
        height - Math.round(42 * panelScale),
      );
      this.renderSeedReadout(panelCenterX, seedY, d + 3, this.payload.seedCode, this.payload.isDaily === true, 1160);
    }

    // Two small text links side-by-side under the seed readout. Postcard
    // saves the frame; rerun starts the exact seed again. Only render
    // rerun when the payload actually carries a numeric seed.
    const hasRerun = typeof this.payload.runSeed === 'number';
    const linkY = Math.min(panelTop + PANEL_H - Math.round(44 * panelScale), height - Math.round(56 * panelScale));
    if (hasRerun) {
      this.renderPostcardLink(panelCenterX - 100, linkY, d + 3, 1180);
      this.renderRerunSeedLink(panelCenterX + 100, linkY, d + 3, 1200);
    } else {
      this.renderPostcardLink(panelCenterX, linkY, d + 3, 1180);
    }
    // Save frame link — gated by captureEnabled setting; sits on a second
    // row directly below the postcard/rerun link row.
    if (getSettingsManager().load().captureEnabled) {
      const saveFrameLinkY = linkY + 16;
      this.renderSaveFrameLink(panelCenterX, saveFrameLinkY, d + 3, 1220);
    }

    const buttonsY = Math.min(panelTop + PANEL_H - Math.round(22 * panelScale), height - Math.round(32 * panelScale));
    // Responsive gap — default design target is ±196 between centre
    // buttons at 800px, but on narrow viewports the left button otherwise
    // clips the canvas edge. Floor keeps the 24px between-button breathing
    // room intact (172 button width + 24 gap = 196 centre-to-centre).
    const actionBtnW = 172;
    const actionSideGap = Math.min(196, Math.max(actionBtnW / 2 + 12, Math.floor((width - actionBtnW - 40) / 2)));
    this.createResultActionButton(panelCenterX - actionSideGap, buttonsY, actionBtnW, 42, t('ui.gameOver.play_again'), 'primary', 1240, uiScale, () => {
      audio.playClick();
      musicEngine.stop();
      // Match MenuScene: wipe any lingering suspended-run snapshot before
      // starting a fresh run. GameScene's end-of-run cleanup already clears
      // it, but swallowed storage errors could otherwise resurrect a ghost run.
      try { new SaveManager().clearActiveRun(); } catch { /* ignore */ }
      this.scene.start('Game');
    });
    this.createResultActionButton(panelCenterX, buttonsY, actionBtnW, 42, t('ui.gameOver.upgrades'), 'secondary', 1300, uiScale, () => {
      audio.playClick();
      musicEngine.stop();
      this.scene.start('Shop');
    }, { fillOverride: COLORS.WHISKY_GOLD, hoverOverride: 0xe0b830, textColorOverride: COLORS_CSS.BLACK });
    this.createResultActionButton(panelCenterX + actionSideGap, buttonsY, actionBtnW, 42, t('ui.gameOver.menu'), 'secondary', 1360, uiScale, () => {
      audio.playClick();
      musicEngine.stop();
      this.scene.start('MainMenu');
    });
  }

  /**
   * Renders a single italic line blending the classified headline + takeaway
   * tip for the death insight. `{source}` is interpolated with a
   * display-name-resolved enemy label when the classifier identified a
   * dominant source; otherwise "something" as a voice-appropriate fallback.
   */
  private renderDeathInsight(
    centerX: number,
    y: number,
    depth: number,
    cause: DeathCause,
    uiScale: number,
    panelWidth: number,
  ): void {
    const text = this.add
      .text(centerX, y, formatDeathInsightLine(cause),
        textStyle('subtitle', { color: COLORS_CSS.LABEL_TAN, align: 'center', wordWrap: { width: (panelWidth - 48) / Math.max(1, uiScale) } }),
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0);
    text.setScale(uiScale);
    this.tweens.add({ targets: text, alpha: 1, duration: 320, delay: 380 });
  }

  private addRunResultUnlockContent(
    centerX: number,
    y: number,
    depth: number,
    variantKeys: VariantKey[],
    delay: number
  ): void {
    const tips = [
      t('ui.tips.dash'),
      t('ui.tips.combo'),
      t('ui.tips.armor'),
      t('ui.tips.evolve'),
      t('ui.tips.piper'),
      t('ui.tips.kite'),
    ];
    const hasUnlocks = variantKeys.length > 0;
    const { text: headingText, color: headingColor } = resolveUnlockHeading(variantKeys);

    const heading = this.add
      .text(centerX, y, headingText, {
        ...textStyle('label', { fontSize: '12px', color: headingColor }),
        letterSpacing: 1,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0);
    this.tweens.add({ targets: heading, alpha: 1, duration: 260, delay });

    if (!hasUnlocks) {
      const tip = this.add
        .text(centerX, y + 34, tips[Math.floor(Math.random() * tips.length)],
          textStyle('subtitle', { color: COLORS_CSS.TEXT_SECONDARY, align: 'center', wordWrap: { width: Math.min(520, this.scale.width - 80) } }),
        )
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(depth)
        .setAlpha(0);
      this.tweens.add({ targets: tip, alpha: 1, duration: 260, delay: delay + 90 });
      return;
    }

    // Sparkle burst around the unlock heading — celebratory soul moment
    this.addUnlockSparkles(centerX, y + 20, depth + 1, delay + 60);

    if (variantKeys.length === 1) {
      const variant = getVariantByKey(variantKeys[0]);
      const nameText = this.add
        .text(centerX, y + 26, t(variant.nameKey),
          textStyle('heading', { fontSize: '26px', color: COLORS_CSS.WHISKY_GOLD, align: 'center' }),
        )
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(depth)
        .setAlpha(0);
      const flavorText = this.add
        .text(centerX, y + 58, t(variant.flavorKey),
          textStyle('label', { fontSize: '12px', color: COLORS_CSS.TEXT_SECONDARY, align: 'center', wordWrap: { width: Math.min(520, this.scale.width - 80) } }),
        )
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(depth)
        .setAlpha(0);
      this.tweens.add({ targets: [nameText, flavorText], alpha: 1, duration: 300, delay: delay + 90 });
      return;
    }

    // Invariant: variantKeys.length >= 2 here (length === 1 branch returned above).
    const bodyText = formatUnlockBodyText(variantKeys) ?? '';
    const unlockList = this.add
      .text(centerX, y + 30, bodyText, {
        ...textStyle('body', { fontSize: variantKeys.length === 2 ? '18px' : '14px', color: COLORS_CSS.WHISKY_GOLD, align: 'center', wordWrap: { width: Math.min(500, this.scale.width - 100) } }),
        lineSpacing: 6,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0);
    this.tweens.add({ targets: unlockList, alpha: 1, duration: 300, delay: delay + 90 });
  }

  /** Celebratory sparkle burst — 8 golden particles radiating outward from center. */
  private addUnlockSparkles(cx: number, cy: number, depth: number, delay: number): void {
    const { uiScale } = getSettingsManager().load();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const sparkle = this.add.circle(cx, cy, 3, 0xffdd44, 0)
        .setScrollFactor(0).setDepth(depth);
      this.tweens.add({
        targets: sparkle,
        x: cx + Math.cos(angle) * Math.round(60 * uiScale),
        y: cy + Math.sin(angle) * Math.round(40 * uiScale),
        alpha: { from: 0, to: 0.9 },
        scale: { from: 0.3, to: 1.5 },
        duration: 600,
        delay: delay + i * 50,
        ease: 'Power2',
        onComplete: () => {
          this.tweens.add({
            targets: sparkle,
            alpha: 0,
            scale: 0,
            duration: 400,
            onComplete: () => sparkle.destroy(),
          });
        },
      });
    }
  }

  private createResultStat(
    x: number,
    y: number,
    label: string,
    value: string,
    depth: number,
    delay: number,
    uiScale: number,
    isNewBest?: boolean
  ): void {
    const labelText = this.add
      .text(x, y, label,
        textStyle('label', { fontSize: '12px', color: COLORS_CSS.TEXT_SUBTITLE }),
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0)
      .setScale(uiScale);
    const valueText = this.add
      .text(x, y + Math.round(18 * uiScale), value,
        textStyle('body', { fontSize: '20px', color: isNewBest ? COLORS_CSS.WHISKY_GOLD : COLORS_CSS.WHITE }),
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0)
      .setScale(uiScale);

    this.tweens.add({ targets: [labelText, valueText], alpha: 1, duration: 220, delay });

    if (isNewBest) {
      const badge = this.add
        .text(x + Math.round(46 * uiScale), y + Math.round(10 * uiScale), t('ui.gameOver.new_best'),
          textStyle('small', { fontSize: '8px', color: COLORS_CSS.WHISKY_GOLD }),
        )
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(depth + 1)
        .setAlpha(0)
        .setScale(0.5 * uiScale);
      this.tweens.add({
        targets: badge,
        alpha: 1,
        scale: uiScale,
        duration: 360,
        delay: delay + 200,
        ease: 'Back.easeOut',
      });
    }
  }

  private createResultActionButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    tier: import('../ui/gameButton').ButtonTier,
    delay: number,
    uiScale: number,
    onClick: () => void,
    overrides?: { fillOverride?: number; hoverOverride?: number; textColorOverride?: string },
  ): void {
    // setInteractive is called at construction by the factory — alpha-0
    // fade-in still provides the visual delay without softlocking the
    // buttons if a tween is interrupted by tab-backgrounding.
    const { rect: button, label: text } = createGameButton(this, {
      x, y, width, height, label, tier, uiScale,
      fillOverride: overrides?.fillOverride,
      hoverOverride: overrides?.hoverOverride,
      textColorOverride: overrides?.textColorOverride,
    });
    button.setScrollFactor(0).setDepth(203).setAlpha(0);
    text.setScrollFactor(0).setDepth(204).setAlpha(0);

    this.tweens.add({
      targets: [button, text],
      alpha: 1,
      duration: 260,
      delay,
    });

    button.on('pointerdown', onClick);
  }

  /**
   * Renders the seed code with a clickable "copy" affordance. Clipboard
   * support varies (desktop: navigator.clipboard; older Safari: textarea +
   * execCommand); we fall back through them and update the label to
   * confirm when the copy worked.
   */
  private renderSeedReadout(
    centerX: number,
    y: number,
    depth: number,
    code: string,
    isDaily: boolean,
    delay: number,
  ): void {
    const label = formatSeedReadoutLabel(code, isDaily);
    const tail = t('ui.gameOver.seed_copy_hint');
    const palette = resolveCopyActionLinkPalette(isDaily);
    const text = this.add
      .text(centerX, y, `${label}  ·  ${tail}`, {
        ...COPY_ACTION_LINK_TEXT_BASE,
        color: palette.idle,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: text, alpha: 1, duration: 260, delay });

    let copied = false;
    const doCopy = () => {
      const ok = copyTextToClipboard(code);
      if (ok && !copied) {
        copied = true;
        text.setText(t('ui.gameOver.seed_copied', { code }));
        text.setColor(palette.success);
      }
    };
    text.on('pointerover', () => { if (!copied) text.setColor(palette.hover); });
    text.on('pointerout', () => { if (!copied) text.setColor(palette.idle); });
    text.on('pointerdown', doCopy);
  }

  /**
   * W27 Capture & Share: small "save postcard" text link that downloads
   * the current canvas as a PNG. Sits below the seed readout so it
   * doesn't crowd the main action buttons.
   */
  private renderPostcardLink(
    centerX: number,
    y: number,
    depth: number,
    delay: number,
  ): void {
    const hint = t('ui.gameOver.postcard_hint');
    const palette = resolveCopyActionLinkPalette(false);
    const text = this.add
      .text(centerX, y, `📮 ${hint}`, {
        ...COPY_ACTION_LINK_TEXT_BASE,
        color: palette.idle,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: text, alpha: 1, duration: 260, delay });

    let saved = false;
    const doSave = () => {
      if (saved) return;
      const p = this.payload;
      if (!p) return;
      const canvas = this.game.canvas as HTMLCanvasElement | undefined;
      const curseDef = getCurseByKey(p.curseKey ?? null);
      const ok = downloadPostcard(
        canvas,
        buildPostcardPayloadFromGameOver(p, curseDef ? t(curseDef.nameKey) : null),
      );
      if (ok) {
        saved = true;
        text.setText(`📮 ${t('ui.gameOver.postcard_saved')}`);
        text.setColor(palette.success);
        audio.playClick();
      }
    };
    text.on('pointerover', () => { if (!saved) text.setColor(palette.hover); });
    text.on('pointerout', () => { if (!saved) text.setColor(palette.idle); });
    text.on('pointerdown', doSave);
  }

  /**
   * W27 Phase 2 — "Save frame" text link. Downloads the current canvas as
   * a PNG named with run context. Only rendered when captureEnabled is true
   * (gate evaluated in create() before this method is called).
   */
  private renderSaveFrameLink(
    centerX: number,
    y: number,
    depth: number,
    delay: number,
  ): void {
    const hint = t('ui.gameOver.save_frame');
    const palette = resolveCopyActionLinkPalette(false);
    const text = this.add
      .text(centerX, y, `📷 ${hint}`, {
        ...COPY_ACTION_LINK_TEXT_BASE,
        color: palette.idle,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: text, alpha: 1, duration: 260, delay });

    let saving = false;
    const doSave = () => {
      if (saving) return;
      const p = this.payload;
      if (!p) return;
      saving = true;
      const filename = buildCaptureFilename('screenshot', {
        mode: p.mode,
        variantLabel: p.variantLabel,
        timeSurvivedSec: p.summary.timeSurvivedSec,
        seedCode: p.seedCode,
        dateYmd: formatLocalYmd(new Date()),
      });
      saveScreenshot(this.game.canvas as HTMLCanvasElement, filename).then((ok) => {
        if (ok) {
          text.setText(`📷 ${t('ui.toast.screenshot_saved')}`);
          text.setColor(palette.success);
        } else {
          text.setText(`📷 ${t('ui.toast.screenshot_failed')}`);
          text.setColor(TOAST_COLORS.warning);
          saving = false;
        }
        audio.playClick();
      });
    };
    text.on('pointerover', () => { if (!saving) text.setColor(palette.hover); });
    text.on('pointerout', () => { if (!saving) text.setColor(palette.idle); });
    text.on('pointerdown', doSave);
  }

  /**
   * "↻ same seed" text link that restarts the run with its exact seed
   * and variant. Mirrors the Chronicle rerun pattern. Only called when
   * the payload carries a numeric runSeed (see hasRerun gate above).
   */
  private renderRerunSeedLink(
    centerX: number,
    y: number,
    depth: number,
    delay: number,
  ): void {
    // Surface the curse on the link itself so the player knows the
    // rerun re-applies it (parallels the chronicle ↻ tooltip).
    const linkCurseDef = getCurseByKey(this.payload?.curseKey ?? null);
    const label = formatRerunSeedLinkLabel(linkCurseDef ? t(linkCurseDef.nameKey) : null);
    const palette = resolveRerunLinkPalette();
    const text = this.add
      .text(centerX, y, label, {
        ...COPY_ACTION_LINK_TEXT_BASE,
        color: palette.idle,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: text, alpha: 1, duration: 260, delay });

    text.on('pointerover', () => text.setColor(palette.hover));
    text.on('pointerout', () => text.setColor(palette.idle));
    text.on('pointerdown', () => {
      audio.playClick();
      musicEngine.stop();
      const p = this.payload;
      if (!p || typeof p.runSeed !== 'number') return;
      try { new SaveManager().clearActiveRun(); } catch { /* best-effort */ }
      // Rerun must carry the curse — otherwise the "same seed" replay
      // is silently easier than the original (and the boss/spawn cadence
      // diverges since several modifiers gate their flow on a curse).
      const def = getCurseByKey(p.curseKey ?? null);
      setPendingCurse(def ? def.key : null);
      this.scene.start('Game', { seed: p.runSeed, forceVariantKey: p.variantKey });
    });
  }

}
