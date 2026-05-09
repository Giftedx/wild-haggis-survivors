import * as Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../config';
import { t } from '../core/i18n';
import { audio } from '../systems/AudioSystem';
import { getSettingsManager } from '../core/SettingsManager';
import { ALL_SPORRAN_CARDS } from '../data/sporranCards';
import {
  drawSporran,
  SPORRAN_DRAW_COUNT,
  SPORRAN_PICK_COUNT,
  type SporranCard,
} from '../systems/sporranDeck';
import {
  sporranKindAccent,
  sporranTileRowLayout,
  sporranTileXForIndex,
  type SporranKindAccentKey,
} from './sporranTileLayout';
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
import { createDomFocusLayer, type DomFocusLayer } from '../ui/domFocusLayer';
import { buildSporranDomFocusActions } from './sporranDomFocusActions';
import { createRNG } from '../utils/rng';

/**
 * S1 Phase 1 — Sporran Deck draft scene.
 *
 * Pre-run alternative to the Curse picker. The player is dealt 7 cards
 * from `ALL_SPORRAN_CARDS` (curse / boon / quirk mix), keeps 3, and the
 * three IDs ride the GameScene init payload as `pickedSporranIds`. The
 * apply step lives in `game/sporranRunStart.ts` (mutates `RunModifiers`
 * + emits the post-spawn heal).
 *
 * Replay-determinism contract (T1): the DRAW shuffle uses an ephemeral
 * `Date.now()`-seeded RNG — purely cosmetic. Only the player's PICKS
 * are persisted into the replay payload, so a recorded run reproduces
 * exactly without re-rolling the hand. (Phase 2 chronicle integration
 * will surface picks in run history; the same per-run picks array is
 * the contract there too.)
 *
 * Sister patterns: `CurseScene` (single-row tile grid + keyboard +
 * gamepad), `ActIntermissionScene` (3-card pick within a paused run).
 * DOM-focus mirror parity with CurseScene's T407 layer is a Phase 1.5
 * follow-up — keyboard + gamepad + mouse work today.
 */
interface SporranTileFocusEntry extends ModalFocusEntry {
  readonly bg: Phaser.GameObjects.Rectangle;
  readonly btnLabel: Phaser.GameObjects.Text;
  readonly accentColor: number;
  readonly card: SporranCard;
  readonly cardIndex: number;
  readonly onToggle: () => void;
}

export class SporranScene extends Phaser.Scene {
  private drawnHand: SporranCard[] = [];
  private pickedIndices: Set<number> = new Set();
  private tileEntries: SporranTileFocusEntry[] = [];
  private focusedTileIndex = -1;
  private confirmBtn: Phaser.GameObjects.Rectangle | null = null;
  private confirmLabel: Phaser.GameObjects.Text | null = null;
  private counterText: Phaser.GameObjects.Text | null = null;
  private keyHandler?: (e: KeyboardEvent) => void;
  private gamepadUpdateHandler: (() => void) | null = null;
  private prevPadBack = false;
  private prevPadForward = false;
  private prevPadConfirm = false;
  private prevPadStart = false;
  /**
   * S1 Phase 1.5 — DOM-visible focus mirror. Mirrors CurseScene's T407
   * a11y layer onto the Sporran draft. Read-only from Phaser's view:
   * label updates flow scene → DOM via `setActions`; focus updates flow
   * DOM → scene via `onFocusIndexChange`. Visually hidden 1×1 div with
   * one button per card + Confirm + Back; screen readers announce the
   * picked / dropped state and confirm-disabled gate.
   */
  private domFocusLayer: DomFocusLayer | null = null;

  constructor() {
    super({ key: 'Sporran' });
  }

  create(): void {
    this.drawnHand = [];
    this.pickedIndices = new Set();
    this.tileEntries = [];
    this.focusedTileIndex = -1;
    this.prevPadBack = this.prevPadForward = this.prevPadConfirm = this.prevPadStart = false;

    const { width, height } = this.scale;
    const { uiScale, highContrastUi } = getSettingsManager().load();

    addSceneBackdrop(this);
    // Warm amber wash at the top — Sporran is hearth-warm folk magic;
    // distinct from Curse's purple wine.
    this.add.rectangle(width / 2, 30, width, 60, COLORS.WHISKY_GOLD, 0.06);

    audio.startAmbientWind();
    addSceneFadeIn(this);

    // Header
    this.add
      .text(width / 2, 40, t('sporran.title'),
        sceneHeaderTextStyle(highContrastUi ? '#fadc6a' : '#e8d4a0'))
      .setOrigin(0.5)
      .setScale(uiScale);
    this.add
      .text(width / 2, 76, t('sporran.subtitle'),
        textStyle('subtitle', { color: COLORS_CSS.WARM_TAN, align: 'center' }),
      )
      .setOrigin(0.5)
      .setScale(uiScale);

    // Cosmetic shuffle — Date.now() RNG. Determinism contract is on the
    // PICKS, not the draw, so a non-replay seed is intentional.
    const rng = createRNG(Date.now());
    this.drawnHand = drawSporran(rng, ALL_SPORRAN_CARDS, SPORRAN_DRAW_COUNT);

    // Tile row
    const layout = sporranTileRowLayout(width);
    this.drawnHand.forEach((card, i) => {
      const cx = sporranTileXForIndex(layout.startX, i, layout.tileW);
      const entry = this.drawTile(cx, layout.tileY, layout.tileW, layout.tileH, uiScale, card, i);
      this.registerTileEntry(entry, i);
    });

    // Counter — sits below the tile row.
    const counterY = layout.tileY + layout.tileH / 2 + 28;
    this.counterText = this.add
      .text(width / 2, counterY, '', textStyle('label', { color: COLORS_CSS.WARM_TAN, align: 'center' }))
      .setOrigin(0.5)
      .setScale(uiScale);

    // Confirm button — large primary, below counter.
    const confirmY = counterY + Math.round(36 * uiScale);
    const { rect: confirmBtn, label: confirmLabel } = createGameButton(this, {
      x: width / 2, y: confirmY, width: 260, height: 44,
      label: t('sporran.confirm_disabled', { remaining: SPORRAN_PICK_COUNT }),
      tier: 'primary', fontSize: '17px', uiScale,
    });
    confirmBtn.setScale(uiScale);
    confirmLabel.setScale(uiScale);
    this.confirmBtn = confirmBtn;
    this.confirmLabel = confirmLabel;
    confirmBtn.on('pointerdown', () => this.commitPicks());

    // Back
    const backY = height - 22;
    const backBtn = createBackButton(this, {
      x: width / 2, y: backY, width: 180, height: 30,
      label: t('sporran.back'), fontSize: '14px', uiScale,
    });
    const goBack = clickToScene(this, 'Curse');
    backBtn.on('pointerdown', goBack);

    this.input.keyboard?.on('keydown-ESC', goBack);
    this.installKeyboardShortcuts();
    this.installGamepadShortcuts();

    this.focusedTileIndex = firstEnabledModalFocusIndex(this.tileEntries);
    this.applyTileFocus();
    this.refreshConfirmAndCounter();

    // Install AFTER tiles + confirm + back exist and the picked-state
    // counter is baked, so the layer's first label render reflects the
    // ground truth of an empty pick set.
    this.installDomFocusLayer(goBack);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.uninstallKeyboardShortcuts();
      this.uninstallGamepadShortcuts();
      this.uninstallDomFocusLayer();
    });

    stopAmbientWindOnShutdown(this);
  }

  private registerTileEntry(entry: SporranTileFocusEntry, index: number): void {
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
        if (entry) {
          e.preventDefault();
          this.focusedTileIndex = digit - 1;
          this.applyTileFocus();
          entry.onToggle();
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
      if (e.key === 'Enter') {
        e.preventDefault();
        // Enter at full picks confirms; otherwise toggle the focused tile.
        if (this.pickedIndices.size === SPORRAN_PICK_COUNT) {
          this.commitPicks();
        } else {
          this.activateFocusedTile();
        }
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        this.activateFocusedTile();
      }
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
        this.prevPadBack = this.prevPadForward = this.prevPadConfirm = this.prevPadStart = false;
        return;
      }
      const back = pad.left || pad.up || pad.leftStick.x < -0.5 || pad.leftStick.y < -0.5;
      const forward = pad.right || pad.down || pad.leftStick.x > 0.5 || pad.leftStick.y > 0.5;
      const confirm = pad.buttons[0]?.pressed === true;
      const start = pad.buttons[9]?.pressed === true;
      if (back && !this.prevPadBack) this.moveTileFocus(-1);
      if (forward && !this.prevPadForward) this.moveTileFocus(1);
      if (confirm && !this.prevPadConfirm) this.activateFocusedTile();
      if (start && !this.prevPadStart && this.pickedIndices.size === SPORRAN_PICK_COUNT) {
        this.commitPicks();
      }
      this.prevPadBack = back;
      this.prevPadForward = forward;
      this.prevPadConfirm = confirm;
      this.prevPadStart = start;
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
    if (!entry) return;
    entry.onToggle();
  }

  private applyTileFocus(): void {
    for (let i = 0; i < this.tileEntries.length; i++) {
      const entry = this.tileEntries[i]!;
      const picked = this.pickedIndices.has(i);
      if (i === this.focusedTileIndex) {
        entry.bg.setStrokeStyle(3, 0xffe080, 1);
      } else {
        // Picked tiles get a brighter accent border so they read as
        // "kept" at a glance even when not focused.
        entry.bg.setStrokeStyle(picked ? 3 : 2, entry.accentColor, picked ? 1 : 0.55);
      }
    }
    // Keep the DOM focus mirror in lockstep with the visible Phaser
    // cursor. Indices < tileEntries.length map to a card button; the
    // trailing Confirm + Back actions are reached by Tab past the row.
    if (this.domFocusLayer && this.focusedTileIndex >= 0 && this.focusedTileIndex < this.tileEntries.length) {
      this.domFocusLayer.setFocusedIndex(this.focusedTileIndex);
    }
  }

  /**
   * Toggle a card's pick state. If already picked → unpick. Otherwise
   * picked, unless the player has already kept 3 (ignored — they must
   * drop one first). Refreshes the visual + counter + confirm button.
   */
  private togglePick(cardIndex: number): void {
    audio.playClick();
    if (this.pickedIndices.has(cardIndex)) {
      this.pickedIndices.delete(cardIndex);
    } else {
      if (this.pickedIndices.size >= SPORRAN_PICK_COUNT) return;
      this.pickedIndices.add(cardIndex);
    }
    this.refreshTileVisuals();
    this.refreshConfirmAndCounter();
  }

  private refreshTileVisuals(): void {
    for (let i = 0; i < this.tileEntries.length; i++) {
      const entry = this.tileEntries[i]!;
      const picked = this.pickedIndices.has(i);
      entry.btnLabel.setText(t(picked ? 'sporran.unpick_label' : 'sporran.pick_label'));
      entry.bg.setFillStyle(picked ? 0x1a2640 : 0x10172a, 0.92);
    }
    this.applyTileFocus();
  }

  private refreshConfirmAndCounter(): void {
    const remaining = SPORRAN_PICK_COUNT - this.pickedIndices.size;
    if (this.counterText) {
      this.counterText.setText(
        t('sporran.picked_counter', { count: this.pickedIndices.size, max: SPORRAN_PICK_COUNT }),
      );
    }
    const enabled = remaining === 0;
    if (this.confirmLabel) {
      this.confirmLabel.setText(
        enabled
          ? t('sporran.confirm')
          : t('sporran.confirm_disabled', { remaining }),
      );
    }
    if (this.confirmBtn) {
      this.confirmBtn.setAlpha(enabled ? 1 : 0.55);
      this.confirmBtn.setFillStyle(
        enabled ? COLORS.SCOTTISH_BLUE : 0x2a3658,
      );
    }
    // Mirror the new picked-state into the DOM layer so screen readers
    // hear KEEP / DROP labels + the confirm-disabled gate update in
    // lockstep with the visible UI. Re-render preserves focus index;
    // see SettingsScene.refreshDomActions for the same pattern.
    this.refreshDomActions();
  }

  private refreshDomActions(): void {
    if (!this.domFocusLayer) return;
    this.domFocusLayer.setActions(
      buildSporranDomFocusActions({
        drawnHand: this.drawnHand,
        pickedIndices: this.pickedIndices,
        onTogglePick: (idx) => this.togglePick(idx),
        onConfirm: () => this.commitPicks(),
        onBack: () => this.scene.start('Curse'),
      }),
    );
    if (this.focusedTileIndex >= 0 && this.focusedTileIndex < this.tileEntries.length) {
      this.domFocusLayer.setFocusedIndex(this.focusedTileIndex);
    }
  }

  private installDomFocusLayer(goBack: () => void): void {
    if (typeof document === 'undefined') return;
    const actions = buildSporranDomFocusActions({
      drawnHand: this.drawnHand,
      pickedIndices: this.pickedIndices,
      onTogglePick: (idx) => this.togglePick(idx),
      onConfirm: () => this.commitPicks(),
      onBack: goBack,
    });
    this.domFocusLayer = createDomFocusLayer({
      id: 'whs-sporran-focus-layer',
      label: t('sporran.title'),
      description: t('sporran.subtitle'),
      role: 'group',
      actions,
      initialFocusIndex: this.focusedTileIndex >= 0 ? this.focusedTileIndex : 0,
      onFocusIndexChange: (index) => {
        // Only mirror DOM focus back into Phaser when the focus lands on
        // a card tile — Confirm / Back live past the tile range.
        if (index >= 0 && index < this.tileEntries.length) {
          this.focusedTileIndex = index;
        }
      },
    });
  }

  private uninstallDomFocusLayer(): void {
    this.domFocusLayer?.destroy();
    this.domFocusLayer = null;
  }

  private commitPicks(): void {
    if (this.pickedIndices.size !== SPORRAN_PICK_COUNT) return;
    audio.playClick();
    // Sort the indices so the ID order is stable across mouse / kbd /
    // gamepad pick sequences. Replay-friendly + chronicle-friendly.
    const sortedIndices = Array.from(this.pickedIndices).sort((a, b) => a - b);
    const ids = sortedIndices.map((idx) => this.drawnHand[idx]!.id);
    this.scene.start('Game', { pickedSporranIds: ids });
  }

  /**
   * Single-tile renderer. Returns the focus entry the registry needs.
   * Layout mirrors CurseScene's tile shape (kind chip → name → desc →
   * pick button) but slimmer (7 tiles per row vs 5).
   */
  private drawTile(
    cx: number,
    cy: number,
    w: number,
    h: number,
    uiScale: number,
    card: SporranCard,
    cardIndex: number,
  ): SporranTileFocusEntry {
    const accentColor = sporranKindAccent(card.kind as SporranKindAccentKey);
    const onToggle = () => this.togglePick(cardIndex);

    const bg = this.add
      .rectangle(cx, cy, w, h, 0x10172a, 0.92)
      .setStrokeStyle(2, accentColor, 0.55)
      .setInteractive({ useHandCursor: true });
    bg.on('pointerdown', onToggle);

    // Kind chip — sits at top of tile, full-width strip with the
    // colour-coded accent. Reads as a tab-label for the card kind.
    const chipH = 18;
    this.add
      .rectangle(cx, cy - h / 2 + chipH / 2 + 2, w - 8, chipH, accentColor, 0.92);
    this.add
      .text(cx, cy - h / 2 + chipH / 2 + 2, t(`sporran.kind.${card.kind}`),
        textStyle('small', { color: '#ffffff', align: 'center' }),
      )
      .setOrigin(0.5)
      .setScale(uiScale);

    // Card name — bold, centred, two-line wrap.
    this.add
      .text(cx, cy - h / 2 + Math.round(36 * uiScale), t(card.nameKey),
        textStyle('label', {
          color: COLORS_CSS.WARM_TAN,
          align: 'center',
          wordWrap: { width: (w - 14) / Math.max(1, uiScale) },
        }),
      )
      .setOrigin(0.5, 0)
      .setScale(uiScale);

    // Description — small, wrapped, centred mid-tile.
    const descY = cy - Math.round(8 * uiScale);
    this.add
      .text(cx, descY, t(card.descKey),
        textStyle('small', {
          color: COLORS_CSS.COOL_GREY,
          align: 'center',
          wordWrap: { width: (w - 14) / Math.max(1, uiScale) },
        }),
      )
      .setOrigin(0.5, 0)
      .setScale(uiScale);

    // Pick / Drop button — bottom of tile.
    const btnY = cy + h / 2 - Math.round(22 * uiScale);
    const { rect: btn, label: btnLabel } = createGameButton(this, {
      x: cx, y: btnY, width: w - 14, height: 30,
      label: t('sporran.pick_label'), tier: 'secondary',
      fontSize: '12px',
      fillOverride: accentColor,
      hoverOverride: brightenColor(accentColor, 15),
    });
    btnLabel.setScale(uiScale);
    btn.on('pointerdown', onToggle);

    return { bg, btnLabel, accentColor, card, cardIndex, onToggle };
  }
}
