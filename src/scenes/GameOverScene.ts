import Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../config';
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
import { createGameButton } from '../ui/gameButton';

// Shared text style for the small italic action links under the
// big result panel (seed copy, postcard download, rerun ↻). Each
// site varies the colour from its own palette.idle on hover/press,
// so the colour stays a per-call argument; everything else is fixed.
const COPY_ACTION_LINK_TEXT_BASE = {
  fontFamily: 'monospace',
  fontSize: '12px',
  fontStyle: 'italic',
  align: 'center',
} as const;

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
    const PANEL_W = 684;
    const PANEL_H = 656;
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
      .rectangle(panelCenterX, panelCenterY, PANEL_W, PANEL_H, highContrastUi ? 0x080d17 : 0x101729, 0)
      .setScrollFactor(0)
      .setDepth(d + 1)
      .setStrokeStyle(2, highContrastUi ? 0x8fb4ff : panelStroke, 1);
    this.tweens.add({ targets: overlay, alpha: 0.82, duration: 420 });
    this.tweens.add({ targets: panel, alpha: 0.98, duration: 420 });

    // Rotating death titles/subtitles — each death feels different
    const { titleKey: deathTitleKey, subKey: deathSubKey } = pickGameOverTitleKeys(
      isVictory,
      Phaser.Math.Between(0, 3),
      Phaser.Math.Between(0, 3),
    );

    const title = this.add
      .text(panelCenterX, panelTop + 54, t(deathTitleKey), {
        fontFamily: 'monospace',
        fontSize: theme.titleFontSize,
        color: titleColor,
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setAlpha(0)
      .setScale(theme.titleStartScale);
    title.setScale(theme.titleStartScale * uiScale);
    const subtitle = this.add
      .text(panelCenterX, panelTop + 94, t(deathSubKey), {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#b8a88a',
        align: 'center',
        // Wrap within the panel so the subtitle doesn't run past the yellow
        // outline on narrow viewports.
        wordWrap: { width: PANEL_W - 48 },
      })
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
        .text(panelCenterX, panelTop + 118, t(banner_.key), {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: banner_.color,
          fontStyle: 'bold',
          stroke: '#000',
          strokeThickness: 3,
          align: 'center',
          wordWrap: { width: PANEL_W - 48 },
        })
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
        }), {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#e8a0c6',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(d + 3)
        .setAlpha(0);
      curseText.setScale(uiScale);
      this.tweens.add({ targets: [curseChip, curseText], alpha: 1, duration: 260, delay: 500 });
    }

    const statsPanel = this.add
      .rectangle(panelCenterX, panelTop + 226, 596, 92, 0x131d32, 0.95)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setStrokeStyle(1, 0x283a5f, 1)
      .setAlpha(0);
    const goldPanel = this.add
      .rectangle(panelCenterX, panelTop + 468, 596, 70, 0x141d2f, 0.95)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setStrokeStyle(1, 0x2f435f, 1)
      .setAlpha(0);
    const weaponDamagePanel = this.add
      .rectangle(panelCenterX, panelTop + 352, 596, 158, 0x0f1828, 0.95)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setStrokeStyle(1, 0x243552, 1)
      .setAlpha(0);
    const unlockPanel = this.add
      .rectangle(panelCenterX, panelTop + 550, 596, 94, 0x121a2a, 0.95)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setStrokeStyle(1, 0x283447, 1)
      .setAlpha(0);
    this.tweens.add({ targets: [statsPanel, weaponDamagePanel, goldPanel, unlockPanel], alpha: 1, duration: 260, delay: 520 });

    const statBaseY = panelTop + 200;
    const statGap = 142;
    const pb = this.payload.previousBests;
    this.createResultStat(panelCenterX - statGap, statBaseY, t('ui.gameOver.stat_time'), summaryTime, d + 3, 600,
      pb && summary.timeSurvivedSec > pb.bestTime);
    this.createResultStat(panelCenterX, statBaseY, t('ui.gameOver.stat_kills'), `${summary.enemiesKilled}`, d + 3, 660,
      pb && summary.enemiesKilled > pb.bestKills);
    this.createResultStat(panelCenterX + statGap, statBaseY, t('ui.gameOver.stat_level'), `${this.payload.xpLevel}`, d + 3, 720,
      pb && this.payload.xpLevel > pb.bestLevel);
    this.createResultStat(panelCenterX - statGap, statBaseY + 42, t('ui.gameOver.stat_bosses'), `${this.payload.bossKillCount}`, d + 3, 780);
    this.createResultStat(panelCenterX, statBaseY + 42, t('ui.gameOver.stat_passives'), `${this.payload.ownedPassiveCount}`, d + 3, 840);
    this.createResultStat(panelCenterX + statGap, statBaseY + 42, t('ui.gameOver.stat_combo'), `${summary.bestCombo ?? 0}x`, d + 3, 900,
      pb && (summary.bestCombo ?? 0) > pb.bestCombo);

    const loadoutSummaryText = boundedLoadoutSummary(this.payload.buildSummary, 2);
    const weaponsHead =
      this.payload.weaponCount === 1
        ? t('ui.gameOver.weapons_line_one', { evolved: this.payload.evolvedCount })
        : t('ui.gameOver.weapons_line', { count: this.payload.weaponCount, evolved: this.payload.evolvedCount });
    const loadoutSummary = this.add
      .text(
        panelCenterX,
        panelTop + 288,
        `${weaponsHead}\n${loadoutSummaryText}`,
        {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#9ea8bb',
          align: 'center',
          lineSpacing: 6,
          wordWrap: { width: 560 },
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
    const loadoutBottom = loadoutSummary.y + loadoutSummary.height;
    const weaponHeading = this.add
      .text(panelCenterX, loadoutBottom + 10, t('ui.gameOver.damage_by_weapon'), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#7f8ca7',
        fontStyle: 'bold',
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 3)
      .setAlpha(0);
    weaponHeading.setScale(uiScale);
    const weaponBody = this.add
      .text(panelCenterX, weaponHeading.y + 16, weaponRows, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#c4cdd8',
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: 560 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(d + 3)
      .setAlpha(0);
    weaponBody.setScale(uiScale);
    this.tweens.add({ targets: [weaponHeading, weaponBody], alpha: 1, duration: 260, delay: 940 });
    const weaponBodyBottom = weaponBody.y + weaponBody.height;
    const goldTitleY = Math.max(panelTop + 420, weaponBodyBottom + 16);

    const goldTitle = this.add
      .text(panelCenterX, goldTitleY, t('ui.gameOver.gold_title', { amount: runResult.goldEarned }), {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: COLORS_CSS.WHISKY_GOLD,
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 3)
      .setAlpha(0);
    goldTitle.setScale(uiScale);
    const goldText = this.add
      .text(panelCenterX, goldTitleY + 30, goldBreakdown, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#b69643',
        align: 'center',
      })
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

    this.addRunResultUnlockContent(panelCenterX, panelTop + 512, d + 3, runResult.newlyUnlockedVariants, 1140);

    // Seed readout — sits just above the action buttons. For daily runs it
    // prefixes "DAILY" and shows the date; for seeded runs just the code.
    // Tapping copies the code to the clipboard so players can share.
    if (this.payload.seedCode) {
      this.renderSeedReadout(panelCenterX, panelTop + 590, d + 3, this.payload.seedCode, this.payload.isDaily === true, 1160);
    }

    // Two small text links side-by-side under the seed readout. Postcard
    // saves the frame; rerun starts the exact seed again. Only render
    // rerun when the payload actually carries a numeric seed.
    const hasRerun = typeof this.payload.runSeed === 'number';
    const linkY = panelTop + 612;
    if (hasRerun) {
      this.renderPostcardLink(panelCenterX - 100, linkY, d + 3, 1180);
      this.renderRerunSeedLink(panelCenterX + 100, linkY, d + 3, 1200);
    } else {
      this.renderPostcardLink(panelCenterX, linkY, d + 3, 1180);
    }

    const buttonsY = panelTop + 634;
    this.createResultActionButton(panelCenterX - 196, buttonsY, 172, 42, t('ui.gameOver.play_again'), 'primary', 1240, () => {
      audio.playClick();
      musicEngine.stop();
      // Match MenuScene: wipe any lingering suspended-run snapshot before
      // starting a fresh run. GameScene's end-of-run cleanup already clears
      // it, but swallowed storage errors could otherwise resurrect a ghost run.
      try { new SaveManager().clearActiveRun(); } catch { /* ignore */ }
      this.scene.start('Game');
    });
    this.createResultActionButton(panelCenterX, buttonsY, 172, 42, t('ui.gameOver.upgrades'), 'secondary', 1300, () => {
      audio.playClick();
      musicEngine.stop();
      this.scene.start('Shop');
    }, { fillOverride: COLORS.WHISKY_GOLD, hoverOverride: 0xe0b830, textColorOverride: '#000000' });
    this.createResultActionButton(panelCenterX + 196, buttonsY, 172, 42, t('ui.gameOver.menu'), 'secondary', 1360, () => {
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
      .text(centerX, y, formatDeathInsightLine(cause), {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#dcc38a',
        fontStyle: 'italic',
        align: 'center',
        wordWrap: { width: panelWidth - 48 },
      })
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
        fontFamily: 'monospace',
        fontSize: '12px',
        color: headingColor,
        fontStyle: 'bold',
        letterSpacing: 1,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0);
    this.tweens.add({ targets: heading, alpha: 1, duration: 260, delay });

    if (!hasUnlocks) {
      const tip = this.add
        .text(centerX, y + 34, tips[Math.floor(Math.random() * tips.length)], {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#a8b0c0',
          fontStyle: 'italic',
          align: 'center',
          wordWrap: { width: 520 },
        })
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
        .text(centerX, y + 26, t(variant.nameKey), {
          fontFamily: 'monospace',
          fontSize: '26px',
          color: COLORS_CSS.WHISKY_GOLD,
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(depth)
        .setAlpha(0);
      const flavorText = this.add
        .text(centerX, y + 58, t(variant.flavorKey), {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#9ea8bb',
          align: 'center',
          wordWrap: { width: 520 },
        })
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
        fontFamily: 'monospace',
        fontSize: variantKeys.length === 2 ? '18px' : '14px',
        color: COLORS_CSS.WHISKY_GOLD,
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: 500 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0);
    this.tweens.add({ targets: unlockList, alpha: 1, duration: 300, delay: delay + 90 });
  }

  /** Celebratory sparkle burst — 8 golden particles radiating outward from center. */
  private addUnlockSparkles(cx: number, cy: number, depth: number, delay: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const sparkle = this.add.circle(cx, cy, 3, 0xffdd44, 0)
        .setScrollFactor(0).setDepth(depth);
      this.tweens.add({
        targets: sparkle,
        x: cx + Math.cos(angle) * 60,
        y: cy + Math.sin(angle) * 40,
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
    isNewBest?: boolean
  ): void {
    const labelText = this.add
      .text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#7f8ca7',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0);
    const valueText = this.add
      .text(x, y + 18, value, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: isNewBest ? COLORS_CSS.WHISKY_GOLD : COLORS_CSS.WHITE,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0);

    this.tweens.add({ targets: [labelText, valueText], alpha: 1, duration: 220, delay });

    if (isNewBest) {
      const badge = this.add
        .text(x + 46, y + 10, t('ui.gameOver.new_best'), {
          fontFamily: 'monospace',
          fontSize: '8px',
          color: COLORS_CSS.WHISKY_GOLD,
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(depth + 1)
        .setAlpha(0)
        .setScale(0.5);
      this.tweens.add({
        targets: badge,
        alpha: 1,
        scale: 1,
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
    onClick: () => void,
    overrides?: { fillOverride?: number; hoverOverride?: number; textColorOverride?: string },
  ): void {
    // setInteractive is called at construction by the factory — alpha-0
    // fade-in still provides the visual delay without softlocking the
    // buttons if a tween is interrupted by tab-backgrounding.
    const { rect: button, label: text } = createGameButton(this, {
      x, y, width, height, label, tier,
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
