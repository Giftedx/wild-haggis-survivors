import * as Phaser from 'phaser';
import { COLORS, COLORS_CSS, UI } from '../config';
import type { GameOverPayload } from './gameOverPayload';
import { t } from '../core/i18n';
import { getSettingsManager } from '../core/SettingsManager';
import { computeGoldBreakdown } from './gameOverFormatting';
import { resolveGameOverPanelTheme } from './gameOverPanelTheme';
import { renderVariantChip } from './gameOverVariantChip';
import { textStyle } from '../ui/typography';
import type { DomFocusLayer } from '../ui/domFocusLayer';
import { GameOverFocusController } from './game-over/GameOverFocusController';
import {
  renderDeathInsight,
  addRunResultUnlockContent,
} from './game-over/runResultContent';
import { renderGameOverTitleAndSubtitle } from './game-over/renderGameOverTitleAndSubtitle';
import { renderGameOverIronmoorBanner } from './game-over/renderGameOverIronmoorBanner';
import { renderGameOverCurseChip } from './game-over/renderGameOverCurseChip';
import { renderGameOverInnerPanels } from './game-over/renderGameOverInnerPanels';
import { renderGameOverLoadoutSummary } from './game-over/renderGameOverLoadoutSummary';
import { renderGameOverGoldPanel } from './game-over/renderGameOverGoldPanel';
import { renderGameOverStatGrid } from './game-over/renderGameOverStatGrid';
import { renderGameOverSeedAndLinkRows } from './game-over/renderGameOverSeedAndLinkRows';
import { renderGameOverActionRow } from './game-over/renderGameOverActionRow';
import { renderGameOverWeeTale } from './game-over/renderGameOverWeeTale';

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

    const { innerW, panelScale, weaponPanelTop, goldPanelCenterY, unlockPanelY, unlockPanelH } =
      renderGameOverInnerPanels(this, {
        panelCenterX,
        panelTop,
        PANEL_W,
        PANEL_H,
        height,
        compact,
        uiScale,
        depthBase: d,
      });

    renderGameOverStatGrid(this, {
      panelCenterX,
      panelTop,
      PANEL_W,
      compact,
      uiScale,
      depthBase: d,
      payload: this.payload,
    });

    renderGameOverLoadoutSummary(this, {
      panelCenterX,
      PANEL_W,
      uiScale,
      panelScale,
      weaponPanelTop,
      depthBase: d,
      payload: this.payload,
      weaponDamage,
      summary,
      runResult,
    });

    renderGameOverGoldPanel(this, {
      panelCenterX,
      goldPanelCenterY,
      innerW,
      compact,
      uiScale,
      panelScale,
      depthBase: d,
      goldEarned: runResult.goldEarned,
      goldBreakdown,
    });

    // Unlock content sits inside the unlockPanel — anchor on panel centre
    // minus a small top-padding so scaled text stays visually contained at
    // uiScale 1.4 instead of using the old fixed `panelTop + 512`.
    addRunResultUnlockContent(this, panelCenterX, unlockPanelY - Math.round(38 * panelScale), d + 3, runResult.newlyUnlockedVariants, 1140);

    const getPayload = (): GameOverPayload | null => this.payload;
    const { buttonsY } = renderGameOverSeedAndLinkRows(this, {
      panelCenterX,
      panelTop,
      PANEL_H,
      height,
      compact,
      panelScale,
      unlockPanelY,
      unlockPanelH,
      depthBase: d,
      getPayload,
      payload: this.payload,
    });

    this.domFocusLayer = renderGameOverActionRow(this, {
      panelCenterX,
      buttonsY,
      width,
      PANEL_W,
      compact,
      uiScale,
      payload: this.payload,
      focusController: this.focusController,
    });

    // Wee Tale — single italic prose epitaph closing the run. Sits
    // BELOW the action button row as a soft footer line so it
    // never collides with the inner-panel / seed-row stack. Clamped
    // both inside the panel (panelTop + PANEL_H - 6) and inside the
    // canvas (height - 8) so the bottom-most line is always visible
    // on short viewports.
    const weeTaleY = Math.min(
      buttonsY + (compact ? 22 : 26),
      panelTop + PANEL_H - 6,
      height - 8,
    );
    renderGameOverWeeTale({
      scene: this,
      payload: this.payload,
      panelCenterX,
      centerY: weeTaleY,
      maxWidth: PANEL_W - 32,
      uiScale,
      depth: d + 3,
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.focusController.dispose();
      this.uninstallDomFocusLayer();
    });
  }

  private uninstallDomFocusLayer(): void {
    this.domFocusLayer?.destroy();
    this.domFocusLayer = null;
  }

}
