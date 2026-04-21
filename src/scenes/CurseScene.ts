import Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../config';
import { t } from '../core/i18n';
import { audio } from '../systems/AudioSystem';
import { getSettingsManager } from '../core/SettingsManager';
import { CURSES, setPendingCurse, type CurseKey } from '../data/curses';
import { loadSave } from '../utils/save';
import { listCursesBested } from '../ui/chronicleAggregates';
import { curseTileRowLayout, tileXForIndex, resolveCurseTileBestedStyle } from './curseTileLayout';
import { createGameButton } from '../ui/gameButton';
import { brightenColor } from '../utils/brightenColor';
import { clickToScene } from './clickToScene';
import { stopAmbientWindOnShutdown } from './stopAmbientWindOnShutdown';
import { createBackButton } from './createBackButton';
import { addSceneFadeIn, addSceneBackdrop } from './sceneFade';
import { sceneHeaderTextStyle } from './sceneHeaderStyle';
import { textStyle } from '../ui/typography';

/**
 * Curse picker — interstitial between loadout and run. The player may pick
 * one curse (trading difficulty for gold) or skip with "A CLEAN RUN".
 * State is passed downstream via the module-level pendingCurseKey singleton
 * in data/curses.ts (GameScene.create() consumes it exactly once).
 *
 * Layout: 5 tiles in a single row along the bottom half (4 curses + the
 * "clean run" escape tile at the end). At 800×600 that gives each tile
 * ~148px wide — enough room for title, description, and the "+X% gold" chip.
 *
 * Non-goals: curse stacking, random curse rolls, per-curse unlocks.
 * Everything is visible from the first run — discoverability over gating.
 */
export class CurseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Curse' });
  }

  create(): void {
    const { width, height } = this.scale;
    const { uiScale, highContrastUi } = getSettingsManager().load();

    addSceneBackdrop(this);
    // Purple-wine wash at the top — curses have a darker tone than the amber Chronicle.
    this.add.rectangle(width / 2, 30, width, 60, 0x5a2a4a, 0.08);

    audio.startAmbientWind();
    addSceneFadeIn(this);

    // ── Header ──
    this.add
      .text(width / 2, 40, t('ui.curseScene.title'),
        sceneHeaderTextStyle(highContrastUi ? '#ffbadc' : '#e8a0c6'))
      .setOrigin(0.5)
      .setScale(uiScale);

    this.add
      .text(width / 2, 76, t('ui.curseScene.subtitle'),
        textStyle('subtitle', { color: '#c0a8b6', align: 'center' }),
      )
      .setOrigin(0.5)
      .setScale(uiScale);

    // ── Tile grid: N curses + 1 "clean run" tile in one row ──
    const { tileW, tileH, tileY, startX } = curseTileRowLayout(width, CURSES.length);

    // BESTED markers — surface curse-roster progress at the point of
    // choice so players can see at-a-glance which curses they've yet
    // to beat. Reads gameplay save's runHistory (capped FIFO window).
    const besteredKeys = listCursesBested(loadSave().runHistory);

    CURSES.forEach((curse, i) => {
      const cx = tileXForIndex(startX, i, tileW);
      this.drawCurseTile(cx, tileY, tileW, tileH, uiScale, {
        titleKey: curse.nameKey,
        descKey: curse.descKey,
        goldPct: curse.goldBonusPct,
        pickLabelKey: 'ui.curseScene.pick',
        accentColor: 0xb35287,
        bested: besteredKeys.has(curse.key),
        onPick: () => this.commitCurse(curse.key),
      });
    });

    // Clean-run tile — last in the row, distinct tint so it reads as the
    // opt-out rather than one-of-the-curses.
    const cleanX = tileXForIndex(startX, CURSES.length, tileW);
    this.drawCurseTile(cleanX, tileY, tileW, tileH, uiScale, {
      titleKey: 'ui.curseScene.none_title',
      descKey: 'ui.curseScene.none_desc',
      goldPct: null,
      pickLabelKey: 'ui.curseScene.pick_none',
      accentColor: 0x4a6a9e,
      bested: false,
      onPick: () => this.commitCurse(null),
    });

    // ── Back ──
    const backY = height - 22;
    const backBtn = createBackButton(this, {
      x: width / 2, y: backY, width: 180, height: 30,
      label: t('ui.curseScene.back'), fontSize: '14px', uiScale,
    });
    const goBack = clickToScene(this, 'Menu');
    backBtn.on('pointerdown', goBack);

    this.input.keyboard?.on('keydown-ESC', goBack);

    stopAmbientWindOnShutdown(this);
  }

  /**
   * Pending curse is set on the module singleton and the Game scene is
   * started immediately — GameScene.create() consumes + clears the key.
   */
  private commitCurse(key: CurseKey | null): void {
    audio.playClick();
    setPendingCurse(key);
    this.scene.start('Game');
  }

  private drawCurseTile(
    cx: number,
    cy: number,
    w: number,
    h: number,
    uiScale: number,
    opts: {
      titleKey: string;
      descKey: string;
      /** null means "no gold chip" — used by the clean-run tile. */
      goldPct: number | null;
      pickLabelKey: string;
      accentColor: number;
      /** True when the player has already won at least one run with this curse. */
      bested: boolean;
      onPick: () => void;
    },
  ): void {
    // Tile background — bested tiles get a slightly warmer fill + brighter
    // border so the conquered ones read as a settled "trophy" state.
    const bestedStyle = resolveCurseTileBestedStyle(opts.bested);
    this.add
      .rectangle(cx, cy, w, h, bestedStyle.fillColor, 0.92)
      .setStrokeStyle(2, opts.accentColor, bestedStyle.borderAlpha);

    // BESTED ribbon — top-right corner, only on tiles the player has won.
    if (opts.bested) {
      const badgeX = cx + w / 2 - 6;
      const badgeY = cy - h / 2 + 6;
      this.add
        .text(badgeX, badgeY, t('ui.curseScene.bested_badge'), {
          ...textStyle('small', { color: COLORS_CSS.WHISKY_GOLD }),
          backgroundColor: '#3a2c14',
          padding: { left: 4, right: 4, top: 2, bottom: 2 },
        })
        .setOrigin(1, 0)
        .setScale(uiScale)
        .setDepth(2);
    }

    // Title
    this.add
      .text(cx, cy - h / 2 + 26, t(opts.titleKey),
        textStyle('label', { color: COLORS_CSS.WARM_TAN, align: 'center', wordWrap: { width: w - 16 } }),
      )
      .setOrigin(0.5, 0)
      .setScale(uiScale);

    // Gold chip (curse tiles only)
    if (opts.goldPct !== null) {
      const chipY = cy - h / 2 + 76;
      this.add
        .rectangle(cx, chipY, w - 24, 22, 0x3a2c14, 1)
        .setStrokeStyle(1, COLORS.WHISKY_GOLD, 0.9);
      this.add
        .text(cx, chipY, t('ui.curseScene.gold_chip', { pct: opts.goldPct }),
          textStyle('small', { color: COLORS_CSS.WHISKY_GOLD }),
        )
        .setOrigin(0.5)
        .setScale(uiScale);
    }

    // Description — wraps within the tile; positioned in the middle so it
    // reads under the title/chip without crowding the pick button.
    const descY = cy - 12;
    this.add
      .text(cx, descY, t(opts.descKey),
        textStyle('small', { color: COLORS_CSS.COOL_GREY, align: 'center', wordWrap: { width: w - 18 } }),
      )
      .setOrigin(0.5)
      .setScale(uiScale);

    // Pick button (bottom of tile)
    const btnY = cy + h / 2 - 26;
    const { rect: btn, label: btnLabel } = createGameButton(this, {
      x: cx, y: btnY, width: w - 24, height: 32,
      label: t(opts.pickLabelKey), tier: 'primary',
      fontSize: '12px',
      fillOverride: opts.accentColor,
      hoverOverride: brightenColor(opts.accentColor, 15),
    });
    btnLabel.setScale(uiScale);
    btn.on('pointerdown', opts.onPick);
  }
}
