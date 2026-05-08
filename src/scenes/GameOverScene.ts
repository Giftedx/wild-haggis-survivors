import * as Phaser from 'phaser';
import { COLORS, COLORS_CSS, UI } from '../config';
import { audio } from '../systems/AudioSystem';
import { musicEngine } from '../systems/music/ProceduralMusicEngine';
import type { GameOverPayload } from './gameOverPayload';
import { t } from '../core/i18n';
import { getSettingsManager } from '../core/SettingsManager';
import { SaveManager } from '../core/SaveManager';
import {
  formatClockTime,
  computeGoldBreakdown,
  boundedLoadoutSummary,
  buildGameOverRunIdentityLines,
  buildWeaponDamageRows,
} from './gameOverFormatting';
import { resolveGameOverPanelTheme } from './gameOverPanelTheme';
import { renderVariantChip } from './gameOverVariantChip';
import type { GameScene } from './GameScene';
import { textStyle } from '../ui/typography';
import { createDomFocusLayer, type DomFocusLayer } from '../ui/domFocusLayer';
import { buildGameOverDomFocusActions } from './gameOverDomFocusActions';
import { GameOverFocusController } from './game-over/GameOverFocusController';
import {
  renderDeathInsight,
  addRunResultUnlockContent,
} from './game-over/runResultContent';
import {
  createResultStat,
  createResultActionButton,
} from './game-over/resultPanelBuilders';
import { renderGameOverTitleAndSubtitle } from './game-over/renderGameOverTitleAndSubtitle';
import { renderGameOverIronmoorBanner } from './game-over/renderGameOverIronmoorBanner';
import { renderGameOverCurseChip } from './game-over/renderGameOverCurseChip';
import { renderGameOverSeedReadout } from './game-over/gameOverSeedReadout';
import { renderGameOverPostcardLink } from './game-over/gameOverPostcardLink';
import { renderGameOverSaveFrameLink } from './game-over/gameOverSaveFrameLink';
import { renderGameOverCopyFrameLink } from './game-over/gameOverCopyFrameLink';
import { renderGameOverSaveClipLink } from './game-over/gameOverSaveClipLink';
import { renderGameOverRerunSeedLink } from './game-over/gameOverRerunSeedLink';

/**
 * W27 Phase 4 — feature-detect the modern image clipboard API.
 * Chrome 76+, Firefox 127+, Safari 16.4+ (write). Older browsers
 * fall back to the existing "Save frame" download path.
 */
function isImageClipboardAvailable(): boolean {
  const g = globalThis as unknown as {
    navigator?: { clipboard?: { write?: unknown } };
    ClipboardItem?: unknown;
  };
  return Boolean(g.navigator?.clipboard?.write && g.ClipboardItem);
}

/**
 * Run result screen — owns UI after GameScene tears down (macro lifecycle).
 */
export class GameOverScene extends Phaser.Scene {
  // Payload is optional because Phaser can restart a scene with no data
  // (e.g. during hot-reload in dev, or if a caller mis-uses scene.start).
  // We fall back to MainMenu in create() when it's missing rather than
  // asserting non-null here and crashing on the first field access.
  private payload: GameOverPayload | null = null;
  /**
   * T407 — DOM-visible focus mirror. Visually hidden (1×1 clipped div)
   * but readable by screen readers + Tab-focusable. Mirrors the Phaser
   * action-button focus state so assistive-tech users hear which post-run
   * action is selected and can activate any of PLAY AGAIN / GOLD SHOP /
   * TAE GRAN'S without a working pointer. The dialog is genuinely modal
   * (the overlay rectangle has `setInteractive()` blocking the playfield),
   * hence `role="dialog"` rather than `role="group"`.
   */
  private domFocusLayer: DomFocusLayer | null = null;
  private readonly focusController = new GameOverFocusController({
    scene: this,
    getDomFocusLayer: () => this.domFocusLayer,
  });

  constructor() {
    super({ key: 'GameOver' });
  }

  init(data?: GameOverPayload): void {
    this.payload = data ?? null;
  }

  create(): void {
    // Phaser scene reuse: create() runs again on the same instance. If a
    // prior shutdown didn't fire (e.g. mid-tween scene swap), tear down
    // the lingering DOM mirror first so we don't leak a hidden node.
    this.uninstallDomFocusLayer();
    this.focusController.reset();
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
    // Pre-fix ceiling 656 left only ~22 px between the unlock panel bottom
    // and the action buttons, so a multi-line variant-unlock paragraph
    // (e.g. Burns's Wee Beastie + flavor + Ironmoor banner + save-clip
    // link row) clipped THROUGH the PLAY AGAIN / GOLD SHOP / TAE GRAN'S
    // buttons. Raising to 712 (full 720p canvas minus margin) buys the
    // ~56 px the unlock + seed + double link-row stack actually needs.
    const PANEL_H = Math.min(712, height - 8);
    const compact = width < 600 || height < 680;
    // Clamp the panel so it stays fully visible even on viewports smaller
    // than PANEL_H. On small screens the panel becomes the clamp region;
    // on larger screens it centers naturally.
    const panelCenterX = width / 2;
    const panelCenterY = Math.max(PANEL_H / 2 + 8, Math.min(height - PANEL_H / 2 - 8, height / 2));
    const panelTop = panelCenterY - PANEL_H / 2;

    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, COLORS.BG_DARK, 1)
      .setScrollFactor(0)
      .setDepth(d)
      .setInteractive()
      .setAlpha(0);
    const panel = this.add
      .rectangle(panelCenterX, panelCenterY, PANEL_W, PANEL_H, COLORS.PANEL, 0.98)
      .setScrollFactor(0)
      .setDepth(d + 1)
      .setStrokeStyle(2, highContrastUi ? 0x8fb4ff : panelStroke, 1)
      .setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: UI.OVERLAY_ALPHA, duration: 420 });
    this.tweens.add({ targets: panel, alpha: 0.98, duration: 420 });

    // Rotating death titles/subtitles — each death feels different
    renderGameOverTitleAndSubtitle(this, {
      isVictory,
      panelCenterX,
      panelTop,
      PANEL_W,
      compact,
      uiScale,
      titleColor,
      titleStartScale: theme.titleStartScale,
      depthBase: d,
    });

    // W66 Ironmoor amplification: an extra rose-pink banner on any
    // Ironmoor run (victory or death) so the posture is acknowledged
    // in the ceremony. Victory copy leans into the pride moment;
    // death copy keeps the Soul Charter compassionate register.
    if (this.payload.ironmoor) {
      renderGameOverIronmoorBanner(this, {
        isVictory,
        panelCenterX,
        panelTop,
        PANEL_W,
        compact,
        uiScale,
        depthBase: d,
      });
    }

    // "Whit got ye" insight — death only. Single compact line combining the
    // classified headline + takeaway tip, fit into the gap between subtitle
    // (+94) and variant chip (+140). Soul Charter: failure must be
    // *informative and compassionate, never shaming*.
    if (!isVictory && this.payload.deathCause) {
      renderDeathInsight(this, panelCenterX, panelTop + (compact ? 104 : 116), d + 3, this.payload.deathCause, uiScale, PANEL_W);
    }

    // Run name epigraph — gentle "Here lies {name}" / "{name} walked home."
    // Sits just above the variant chip as a soft elegy line. Only shown when
    // the run had a generated name; absent on older saves that lack it.
    const runName = this.payload.name ?? '';
    if (runName) {
      const framingKey = isVictory
        ? 'ui.gameOver.name_framing.victory'
        : 'ui.gameOver.name_framing.death';
      const framingLine = this.add
        .text(panelCenterX, panelTop + (compact ? 116 : 142),
          t(framingKey, { name: runName }),
          textStyle('subtitle', { fontSize: '13px', color: COLORS_CSS.DUSTY_TAN, align: 'center' }),
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(d + 2)
        .setAlpha(0)
        .setScale(uiScale);
      this.tweens.add({ targets: framingLine, alpha: 1, duration: 320, delay: 400 });
    }

    // Variant chip — warm identity reminder with haggis sprite + flavor text
    const variantChipY = panelTop + (compact ? 132 : 162);
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
    // rendered if the run had a curse active (helper early-returns when null).
    renderGameOverCurseChip(this, {
      curseKey: this.payload.curseKey ?? null,
      panelCenterX,
      variantChipY,
      PANEL_W,
      uiScale,
      depthBase: d,
    });

    const innerW = compact ? PANEL_W - 32 : PANEL_W - 88;
    // Panel heights scale with uiScale so the scaled text inside each one
    // (weaponBody, goldText, unlockContent) doesn't spill past the panel
    // border at uiScale 1.4. The weaponDamagePanel holds the most text
    // (loadoutSummary + heading + 3 weapon rows) so it gets full scale;
    // gold/unlock panels scale a touch less since their content is tighter.
    // When the panel stack would exceed the PANEL_H budget, lower panels
    // clamp so link/button rows at the panel bottom stay clickable.
    const panelScale = Math.max(1, uiScale);
    const weaponPanelH = Math.round((compact ? 150 : 158) * panelScale);
    const goldPanelH = Math.round((compact ? 64 : 70) * panelScale);
    const unlockPanelH = Math.round((compact ? 90 : 94) * panelScale);
    // weaponDamagePanel: keep top anchored near stats panel bottom (+273)
    // so scaled content grows downward, not up into the variant/curse chips.
    const weaponPanelTop = panelTop + (compact ? 250 : 273);
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
      .rectangle(panelCenterX, panelTop + (compact ? 204 : 226), innerW, 92, 0x131d32, 0.95)
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

    const statBaseY = panelTop + (compact ? 178 : 200);
    const statGap = Math.min(142, Math.floor(PANEL_W * 0.21));
    const statRowGap = Math.round((compact ? 36 : 42) * uiScale);
    const pb = this.payload.previousBests;
    createResultStat(this,panelCenterX - statGap, statBaseY, t('ui.gameOver.stat_time'), summaryTime, d + 3, 600, uiScale,
      pb && summary.timeSurvivedSec > pb.bestTime);
    createResultStat(this,panelCenterX, statBaseY, t('ui.gameOver.stat_kills'), `${summary.enemiesKilled}`, d + 3, 660, uiScale,
      pb && summary.enemiesKilled > pb.bestKills);
    createResultStat(this,panelCenterX + statGap, statBaseY, t('ui.gameOver.stat_level'), `${this.payload.xpLevel}`, d + 3, 720, uiScale,
      pb && this.payload.xpLevel > pb.bestLevel);
    createResultStat(this,panelCenterX - statGap, statBaseY + statRowGap, t('ui.gameOver.stat_bosses'), `${this.payload.bossKillCount}`, d + 3, 780, uiScale);
    createResultStat(this,panelCenterX, statBaseY + statRowGap, t('ui.gameOver.stat_passives'), `${this.payload.ownedPassiveCount}`, d + 3, 840, uiScale);
    createResultStat(this,panelCenterX + statGap, statBaseY + statRowGap, t('ui.gameOver.stat_combo'), `${summary.bestCombo ?? 0}x`, d + 3, 900, uiScale,
      pb && (summary.bestCombo ?? 0) > pb.bestCombo);

    const loadoutSummaryText = boundedLoadoutSummary(this.payload.buildSummary, 2);
    const weaponsHead =
      this.payload.weaponCount === 1
        ? t('ui.gameOver.weapons_line_one', { evolved: this.payload.evolvedCount })
        : t('ui.gameOver.weapons_line', { count: this.payload.weaponCount, evolved: this.payload.evolvedCount });
    // T402 — run-identity radiator (parity with pause panel). Empty for
    // fresh act-1 runs with no routes/relics; otherwise appends gated
    // act/routes/relics lines so the summary reflects what shaped the run.
    // Variant chip is rendered separately above; we deliberately don't
    // duplicate it here. Reuses `ui.pause.stats_*` keys for locale parity.
    const runIdentityLines = buildGameOverRunIdentityLines({
      currentAct: this.payload.currentAct,
      routeLabels: this.payload.routeLabels,
      relicLabels: this.payload.relicLabels,
      runeLabels: this.payload.runeLabels,
    });
    const summaryBlock = runIdentityLines.length > 0
      ? `${weaponsHead}\n${loadoutSummaryText}\n${runIdentityLines.join('\n')}`
      : `${weaponsHead}\n${loadoutSummaryText}`;
    const loadoutSummary = this.add
      .text(
        panelCenterX,
        weaponPanelTop + Math.round(15 * panelScale),
        summaryBlock,
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
        textStyle('heading', {
          fontSize: compact ? '22px' : '28px',
          color: COLORS_CSS.WHISKY_GOLD,
          align: 'center',
          wordWrap: { width: (innerW - 24) / Math.max(1, uiScale) },
        }),
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
    addRunResultUnlockContent(this, panelCenterX, unlockPanelY - Math.round(38 * panelScale), d + 3, runResult.newlyUnlockedVariants, 1140);

    // Seed readout — sits just above the action buttons. For daily runs it
    // prefixes "DAILY" and shows the date; for seeded runs just the code.
    // Tapping copies the code to the clipboard so players can share.
    const buttonsY = Math.min(panelTop + PANEL_H - Math.round(22 * panelScale), height - Math.round(32 * panelScale));
    const linkY = Math.min(panelTop + PANEL_H - Math.round(44 * panelScale), height - Math.round(56 * panelScale), buttonsY - Math.round(compact ? 28 : 0));

    const getPayload = (): GameOverPayload | null => this.payload;

    if (this.payload.seedCode) {
      // Clamp seed readout above canvas bottom — default offset assumes a
      // 720px-tall design target, but native 600 clips this by a couple px.
      // At uiScale 1.4 we also anchor it above the scaled unlock panel so
      // the seed code isn't swallowed by the unlock banner.
      const seedY = Math.min(
        Math.max(panelTop + 590, unlockPanelY + unlockPanelH / 2 + Math.round(14 * panelScale)),
        compact ? linkY - Math.round(18 * panelScale) : height - Math.round(42 * panelScale),
      );
      renderGameOverSeedReadout(this, {
        centerX: panelCenterX,
        y: seedY,
        depth: d + 3,
        code: this.payload.seedCode,
        isDaily: this.payload.isDaily === true,
        delay: 1160,
      });
    }

    // Two small text links side-by-side under the seed readout. Postcard
    // saves the frame; rerun starts the exact seed again. Only render
    // rerun when the payload actually carries a numeric seed.
    const hasRerun = typeof this.payload.runSeed === 'number';
    if (hasRerun) {
      renderGameOverPostcardLink(this, { centerX: panelCenterX - 100, y: linkY, depth: d + 3, delay: 1180, getPayload });
      renderGameOverRerunSeedLink(this, { centerX: panelCenterX + 100, y: linkY, depth: d + 3, delay: 1200, getPayload });
    } else {
      renderGameOverPostcardLink(this, { centerX: panelCenterX, y: linkY, depth: d + 3, delay: 1180, getPayload });
    }
    // Save frame link — gated by captureEnabled setting; sits on a second
    // row directly below the postcard/rerun link row. Phase 4 — Copy frame
    // sits beside Save frame when the modern Clipboard API is available
    // (Chrome 76+, FF 127+, Safari 16.4+). Otherwise Save frame keeps the
    // centre slot solo.
    if (getSettingsManager().load().captureEnabled && !compact) {
      const saveFrameLinkY = linkY + 16;
      const hasImageClipboard = isImageClipboardAvailable();
      if (hasImageClipboard) {
        renderGameOverSaveFrameLink(this, { centerX: panelCenterX - 100, y: saveFrameLinkY, depth: d + 3, delay: 1220, getPayload });
        renderGameOverCopyFrameLink(this, { centerX: panelCenterX + 100, y: saveFrameLinkY, depth: d + 3, delay: 1230 });
      } else {
        renderGameOverSaveFrameLink(this, { centerX: panelCenterX, y: saveFrameLinkY, depth: d + 3, delay: 1220, getPayload });
      }
      const gameScene = this.scene.get('Game') as GameScene | undefined;
      const recorder = gameScene?.getClipRecorder();
      if (recorder?.isAvailable()) {
        renderGameOverSaveClipLink(this, { centerX: panelCenterX, y: saveFrameLinkY + 16, depth: d + 3, delay: 1240, recorder, getPayload });
      }
    }

    // Responsive gap — default design target is ±196 between centre
    // buttons at 800px, but on narrow viewports the left button otherwise
    // clips the canvas edge. Floor keeps the 24px between-button breathing
    // room intact (172 button width + 24 gap = 196 centre-to-centre).
    const actionBtnW = compact ? Math.floor((PANEL_W - 52) / 3) : 172;
    const actionSideGap = compact
      ? actionBtnW + 14
      : Math.min(196, Math.max(actionBtnW / 2 + 12, Math.floor((width - actionBtnW - 40) / 2)));
    // Action callbacks shared between the visible Phaser buttons and the
    // T407 DOM focus mirror — single source of truth for activation
    // behaviour so a screen-reader Tab + Enter takes the same path as a
    // pointer click.
    const onPlayAgain = () => {
      audio.playClick();
      musicEngine.stop();
      // Match MenuScene: wipe any lingering suspended-run snapshot before
      // starting a fresh run. GameScene's end-of-run cleanup already clears
      // it, but swallowed storage errors could otherwise resurrect a ghost run.
      try { new SaveManager().clearActiveRun(); } catch { /* ignore */ }
      // T403 — route through Curse picker instead of straight into Game.
      // Lets the player swap curses (or pick A CLEAN RUN) without bouncing
      // through MainMenu — the previous path silently re-launched with no
      // curse, hiding the choice from anyone who cleared a brutal one and
      // wanted a different bargain. The "Rerun seed" link (one row down)
      // still carries the original curse for masochist re-attempts.
      this.scene.start('Curse');
    };
    const onGoldShop = () => {
      audio.playClick();
      musicEngine.stop();
      this.scene.start('Shop');
    };
    const onTaeGran = () => {
      audio.playClick();
      musicEngine.stop();
      // H1 T9 — return to Croft hub, not MainMenu.
      this.scene.start('Croft');
    };

    createResultActionButton(this, this.focusController,panelCenterX - actionSideGap, buttonsY, actionBtnW, 42, t('ui.gameOver.play_again'), 'primary', 1240, uiScale, onPlayAgain);
    createResultActionButton(this, this.focusController,panelCenterX, buttonsY, actionBtnW, 42, t('ui.gameOver.upgrades'), 'secondary', 1300, uiScale, onGoldShop, { fillOverride: COLORS.WHISKY_GOLD, hoverOverride: 0xe0b830, textColorOverride: COLORS_CSS.BLACK });
    createResultActionButton(this, this.focusController,panelCenterX + actionSideGap, buttonsY, actionBtnW, 42, t('ui.gameOver.menu'), 'secondary', 1360, uiScale, onTaeGran);

    this.focusController.seedFocusFromActions();
    this.focusController.installKeyboard();
    this.focusController.installGamepad();
    // T407 — install the DOM-visible focus mirror after all three action
    // buttons exist. Mirrors the Phaser focus state via setFocusedIndex
    // (driven from applyStyles); DOM-side activation routes through
    // the same callbacks the visible buttons use.
    this.installDomFocusLayer({ onPlayAgain, onGoldShop, onTaeGran });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.focusController.dispose();
      this.uninstallDomFocusLayer();
    });
  }

  /**
   * T407 — mount the visually hidden DOM action mirror. Three buttons
   * (PLAY AGAIN / GOLD SHOP / TAE GRAN'S) reflect the visible row;
   * `aria-label` carries the resolved death/victory title and
   * `aria-describedby` carries a one-line run digest (variant +
   * kills/time/gold). The layer's polite live region announces the
   * focused button as the user navigates.
   */
  private installDomFocusLayer(callbacks: {
    onPlayAgain: () => void;
    onGoldShop: () => void;
    onTaeGran: () => void;
  }): void {
    if (typeof document === 'undefined') return;
    const p = this.payload;
    if (!p?.summary || !p.runResult) return;

    const isVictory = p.isVictory ?? (p.mode === 'victory');
    const titleKey = isVictory ? 'ui.gameOver.victory_title' : 'ui.gameOver.death_title';
    const summaryDigest = `${p.variantLabel} · ${t('ui.gameOver.damage_summary', {
      kills: p.summary.enemiesKilled,
      time: formatClockTime(p.summary.timeSurvivedSec),
      gold: p.runResult.goldEarned,
    })}`;

    const actions = buildGameOverDomFocusActions(callbacks);
    this.domFocusLayer = createDomFocusLayer({
      id: 'whs-game-over-focus-layer',
      label: t(titleKey),
      description: summaryDigest,
      role: 'dialog',
      actions,
      initialFocusIndex: Math.max(this.focusController.getFocusedIndex(), 0),
      onFocusIndexChange: (index) => {
        // Mirror DOM-side focus changes (screen-reader Tab) back into the
        // Phaser-side index so the visible stroke follows assistive-tech
        // navigation. applyStyles → setFocusedIndex on the layer is
        // a no-op when the index is already current, so re-entry is safe.
        const entry = this.focusController.getAction(index);
        if (!entry || entry.disabled) return;
        this.focusController.setFocusedIndex(index);
      },
    });
  }

  private uninstallDomFocusLayer(): void {
    this.domFocusLayer?.destroy();
    this.domFocusLayer = null;
  }

}
