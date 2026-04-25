import * as Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../config';
import { t } from '../core/i18n';
import { audio } from '../systems/AudioSystem';
import { getSettingsManager } from '../core/SettingsManager';
import { CURSES, type CurseKey } from '../data/curses';
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
import {
  firstEnabledModalFocusIndex,
  moveModalFocusIndex,
  type ModalFocusEntry,
} from '../ui/modalFocus';

/** Tile entry with the data needed to wire keyboard + gamepad focus. */
interface CurseTileFocusEntry extends ModalFocusEntry {
  readonly bg: Phaser.GameObjects.Rectangle;
  readonly accentColor: number;
  readonly idleAlpha: number;
  readonly onPick: () => void;
}

/**
 * Curse picker — interstitial between loadout and run. The player may pick
 * one curse (trading difficulty for gold) or skip with "A CLEAN RUN".
 * State is passed downstream via the GameScene init payload
 * (`scene.start('Game', { curseKey })`); GameScene.create() consumes it
 * exactly once. T303 replaced the prior module-level singleton.
 *
 * Layout: 5 tiles in a single row along the bottom half (4 curses + the
 * "clean run" escape tile at the end). At 800×600 that gives each tile
 * ~148px wide — enough room for title, description, and the "+X% gold" chip.
 *
 * Non-goals: curse stacking, random curse rolls, per-curse unlocks.
 * Everything is visible from the first run — discoverability over gating.
 */
export class CurseScene extends Phaser.Scene {
  private tileEntries: CurseTileFocusEntry[] = [];
  private focusedTileIndex = -1;
  private keyHandler?: (e: KeyboardEvent) => void;
  private gamepadUpdateHandler: (() => void) | null = null;
  private prevPadBack = false;
  private prevPadForward = false;
  private prevPadConfirm = false;

  constructor() {
    super({ key: 'Curse' });
  }

  create(): void {
    this.tileEntries = [];
    this.focusedTileIndex = -1;
    this.prevPadBack = this.prevPadForward = this.prevPadConfirm = false;

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
        textStyle('subtitle', { color: COLORS_CSS.CURSE_MAUVE, align: 'center' }),
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
      const entry = this.drawCurseTile(cx, tileY, tileW, tileH, uiScale, {
        titleKey: curse.nameKey,
        descKey: curse.descKey,
        goldPct: curse.goldBonusPct,
        pickLabelKey: 'ui.curseScene.pick',
        accentColor: 0xb35287,
        bested: besteredKeys.has(curse.key),
        onPick: () => this.commitCurse(curse.key),
      });
      this.registerTileEntry(entry, i);
    });

    // Clean-run tile — last in the row, distinct tint so it reads as the
    // opt-out rather than one-of-the-curses.
    const cleanX = tileXForIndex(startX, CURSES.length, tileW);
    const cleanEntry = this.drawCurseTile(cleanX, tileY, tileW, tileH, uiScale, {
      titleKey: 'ui.curseScene.none_title',
      descKey: 'ui.curseScene.none_desc',
      goldPct: null,
      pickLabelKey: 'ui.curseScene.pick_none',
      accentColor: 0x4a6a9e,
      bested: false,
      onPick: () => this.commitCurse(null),
    });
    this.registerTileEntry(cleanEntry, CURSES.length);

    this.focusedTileIndex = firstEnabledModalFocusIndex(this.tileEntries);
    this.applyTileFocus();
    this.installKeyboardShortcuts();
    this.installGamepadShortcuts();

    // ── Back ──
    const backY = height - 22;
    const backBtn = createBackButton(this, {
      x: width / 2, y: backY, width: 180, height: 30,
      label: t('ui.curseScene.back'), fontSize: '14px', uiScale,
    });
    const goBack = clickToScene(this, 'Menu');
    backBtn.on('pointerdown', goBack);

    this.input.keyboard?.on('keydown-ESC', goBack);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.uninstallKeyboardShortcuts();
      this.uninstallGamepadShortcuts();
    });

    stopAmbientWindOnShutdown(this);
  }

  private registerTileEntry(
    entry: { bg: Phaser.GameObjects.Rectangle; accentColor: number; idleAlpha: number; onPick: () => void },
    index: number,
  ): void {
    this.tileEntries.push(entry);
    entry.bg.on('pointerover', () => {
      this.focusedTileIndex = index;
      this.applyTileFocus();
    });
    entry.bg.on('pointerout', () => this.applyTileFocus());
  }

  private installKeyboardShortcuts(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    this.keyHandler = (e: KeyboardEvent) => {
      const digit = parseInt(e.key, 10);
      if (Number.isFinite(digit) && digit >= 1 && digit <= this.tileEntries.length) {
        const entry = this.tileEntries[digit - 1];
        if (entry && !entry.disabled) {
          e.preventDefault();
          this.focusedTileIndex = digit - 1;
          this.applyTileFocus();
          entry.onPick();
        }
        return;
      }
      if (
        e.key === 'ArrowLeft' || e.key === 'ArrowUp'
        || (e.key === 'Tab' && e.shiftKey)
      ) {
        e.preventDefault();
        this.moveTileFocus(-1);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'Tab') {
        e.preventDefault();
        this.moveTileFocus(1);
        return;
      }
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      this.activateFocusedTile();
    };
    keyboard.on('keydown', this.keyHandler);
  }

  private uninstallKeyboardShortcuts(): void {
    if (!this.keyHandler) return;
    this.input.keyboard?.off('keydown', this.keyHandler);
    this.keyHandler = undefined;
  }

  private installGamepadShortcuts(): void {
    this.uninstallGamepadShortcuts();
    this.gamepadUpdateHandler = () => {
      const pad = this.input.gamepad?.pad1;
      if (!pad?.connected) {
        this.prevPadBack = this.prevPadForward = this.prevPadConfirm = false;
        return;
      }
      const back = pad.left || pad.up || pad.leftStick.x < -0.5 || pad.leftStick.y < -0.5;
      const forward = pad.right || pad.down || pad.leftStick.x > 0.5 || pad.leftStick.y > 0.5;
      const confirm = pad.buttons[0]?.pressed === true || pad.buttons[9]?.pressed === true;
      if (back && !this.prevPadBack) this.moveTileFocus(-1);
      if (forward && !this.prevPadForward) this.moveTileFocus(1);
      if (confirm && !this.prevPadConfirm) this.activateFocusedTile();
      this.prevPadBack = back;
      this.prevPadForward = forward;
      this.prevPadConfirm = confirm;
    };
    this.events.on('update', this.gamepadUpdateHandler);
  }

  private uninstallGamepadShortcuts(): void {
    if (!this.gamepadUpdateHandler) return;
    this.events.off('update', this.gamepadUpdateHandler);
    this.gamepadUpdateHandler = null;
  }

  private moveTileFocus(direction: -1 | 1): void {
    this.focusedTileIndex = moveModalFocusIndex(
      this.tileEntries,
      this.focusedTileIndex,
      direction,
    );
    this.applyTileFocus();
  }

  private activateFocusedTile(): void {
    const entry = this.tileEntries[this.focusedTileIndex];
    if (!entry || entry.disabled) return;
    entry.onPick();
  }

  private applyTileFocus(): void {
    for (let i = 0; i < this.tileEntries.length; i++) {
      const entry = this.tileEntries[i]!;
      if (i === this.focusedTileIndex) {
        entry.bg.setStrokeStyle(3, 0xffe080, 1);
      } else {
        entry.bg.setStrokeStyle(2, entry.accentColor, entry.idleAlpha);
      }
    }
  }

  /**
   * Curse selection rides the GameScene init payload directly so a stale
   * pick can't survive an abandoned Curse→Menu→Curse cycle (T303 — the
   * pre-existing module singleton was a known cross-run bleed seam).
   */
  private commitCurse(key: CurseKey | null): void {
    audio.playClick();
    this.scene.start('Game', { curseKey: key });
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
  ): { bg: Phaser.GameObjects.Rectangle; accentColor: number; idleAlpha: number; onPick: () => void } {
    // Tile background — bested tiles get a slightly warmer fill + brighter
    // border so the conquered ones read as a settled "trophy" state.
    const bestedStyle = resolveCurseTileBestedStyle(opts.bested);
    const bg = this.add
      .rectangle(cx, cy, w, h, bestedStyle.fillColor, 0.92)
      .setStrokeStyle(2, opts.accentColor, bestedStyle.borderAlpha)
      .setInteractive({ useHandCursor: true });
    // Whole-tile click — convenient hit target outside the inner PICK button.
    bg.on('pointerdown', opts.onPick);

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

    // Title — wrap divided by uiScale so scaled text respects tile edges
    // at high comfort settings (1.4x would otherwise render ~2x past the
    // tile width since setScale multiplies the pre-wrapped bounds). Top-
    // edge Y also scales so the scaled 2-line title doesn't overlap the
    // gold chip (16px * 1.4 * 2 lines = 45px height at 1.4x, which at the
    // old +26 offset crashed into the chip sitting 50px below).
    this.add
      .text(cx, cy - h / 2 + Math.round(26 * uiScale), t(opts.titleKey),
        textStyle('label', { color: COLORS_CSS.WARM_TAN, align: 'center', wordWrap: { width: (w - 16) / Math.max(1, uiScale) } }),
      )
      .setOrigin(0.5, 0)
      .setScale(uiScale);

    // Gold chip (curse tiles only) — Y scaled from top edge so it tracks
    // the scaled title below it.
    if (opts.goldPct !== null) {
      const chipY = cy - h / 2 + Math.round(76 * uiScale);
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
    // reads under the title/chip without crowding the pick button. Y offset
    // from cy stays proportional to uiScale so the scaled desc block sits
    // with the same visual weight relative to tile center.
    const descY = cy - Math.round(12 * uiScale);
    this.add
      .text(cx, descY, t(opts.descKey),
        textStyle('small', { color: COLORS_CSS.COOL_GREY, align: 'center', wordWrap: { width: (w - 18) / Math.max(1, uiScale) } }),
      )
      .setOrigin(0.5)
      .setScale(uiScale);

    // Pick button (bottom of tile) — bottom-edge offset scales so the
    // button doesn't float too high or clip the tile floor at 1.4x.
    const btnY = cy + h / 2 - Math.round(26 * uiScale);
    const { rect: btn, label: btnLabel } = createGameButton(this, {
      x: cx, y: btnY, width: w - 24, height: 32,
      label: t(opts.pickLabelKey), tier: 'primary',
      fontSize: '12px',
      fillOverride: opts.accentColor,
      hoverOverride: brightenColor(opts.accentColor, 15),
    });
    btnLabel.setScale(uiScale);
    btn.on('pointerdown', opts.onPick);

    return { bg, accentColor: opts.accentColor, idleAlpha: bestedStyle.borderAlpha, onPick: opts.onPick };
  }
}
