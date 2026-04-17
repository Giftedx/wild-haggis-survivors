import Phaser from 'phaser';
import { t } from '../core/i18n';
import { audio } from '../systems/AudioSystem';
import { getSettingsManager } from '../core/SettingsManager';
import { CURSES, setPendingCurse, type CurseKey } from '../data/curses';
import { loadSave } from '../utils/save';
import { listCursesBested } from '../ui/chronicleAggregates';
import { curseTileRowLayout, tileXForIndex, resolveCurseTileBestedStyle } from './curseTileLayout';
import { resolveBackButtonPalette } from './backButtonPalette';
import { attachButtonHoverFill } from '../ui/buttonHover';
import { brightenColor } from '../utils/brightenColor';
import { addSceneFadeIn, addSceneBackdrop } from './sceneFade';

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
      .text(width / 2, 40, t('ui.curseScene.title'), {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: highContrastUi ? '#ffbadc' : '#e8a0c6',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScale(uiScale);

    this.add
      .text(width / 2, 76, t('ui.curseScene.subtitle'), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#c0a8b6',
        fontStyle: 'italic',
        align: 'center',
        wordWrap: { width: width - 60 },
      })
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
    const backPalette = resolveBackButtonPalette();
    const backBtn = this.add
      .rectangle(width / 2, backY, 180, 30, backPalette.idle, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2, backY, t('ui.curseScene.back'), {
        fontFamily: 'monospace', fontSize: '14px', color: '#e8d4a0', fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(uiScale);
    attachButtonHoverFill(backBtn, backPalette.idle, backPalette.hover);
    backBtn.on('pointerdown', () => {
      audio.playClick();
      this.scene.start('Menu');
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      audio.playClick();
      this.scene.start('Menu');
    });

    this.events.once('shutdown', () => {
      audio.stopAmbientWind();
    });
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
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#f7d27a',
          fontStyle: 'bold',
          backgroundColor: '#3a2c14',
          padding: { left: 4, right: 4, top: 2, bottom: 2 },
        })
        .setOrigin(1, 0)
        .setScale(uiScale)
        .setDepth(2);
    }

    // Title
    this.add
      .text(cx, cy - h / 2 + 26, t(opts.titleKey), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f5e1a6',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: w - 16 },
      })
      .setOrigin(0.5, 0)
      .setScale(uiScale);

    // Gold chip (curse tiles only)
    if (opts.goldPct !== null) {
      const chipY = cy - h / 2 + 76;
      this.add
        .rectangle(cx, chipY, w - 24, 22, 0x3a2c14, 1)
        .setStrokeStyle(1, 0xd4a017, 0.9);
      this.add
        .text(cx, chipY, t('ui.curseScene.gold_chip', { pct: opts.goldPct }), {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#f7d27a',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScale(uiScale);
    }

    // Description — wraps within the tile; positioned in the middle so it
    // reads under the title/chip without crowding the pick button.
    const descY = cy - 12;
    this.add
      .text(cx, descY, t(opts.descKey), {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#bcc3d4',
        align: 'center',
        wordWrap: { width: w - 18 },
      })
      .setOrigin(0.5)
      .setScale(uiScale);

    // Pick button (bottom of tile)
    const btnY = cy + h / 2 - 26;
    const btn = this.add
      .rectangle(cx, btnY, w - 24, 32, opts.accentColor, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(cx, btnY, t(opts.pickLabelKey), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(uiScale);
    btn.on('pointerover', () => btn.setFillStyle(brightenColor(opts.accentColor, 15)));
    btn.on('pointerout', () => btn.setFillStyle(opts.accentColor));
    btn.on('pointerdown', opts.onPick);
  }
}
