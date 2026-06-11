/**
 * CairnBoonPickerScene — 3-card boon picker shown when the player
 * stacks the third cairn stone (Cairn Stacking v2).
 *
 * Launched by GameScene via `scene.launch('CairnBoonPicker', data)` after
 * the third stone is collected. The paired GameScene is frozen via a
 * TimeManager `'CAIRN_BOON'` token (held by the caller — this scene only
 * calls `onPick` and stops itself; token release lives in the launcher).
 *
 * Card layout: three boon cards in a horizontal row. Each shows the boon
 * name, a short description, and a PICK button. Keyboard shortcuts: 1/2/3
 * move focus; Enter/Space confirm. Pointer: click card or button to confirm.
 *
 * No haar fog (this is a quiet ceremony, not an act boundary). No complex
 * route-card component — boon cards are plain rectangles. DOM focus layer
 * for a11y, same pattern as ActIntermissionScene.
 */
import * as Phaser from 'phaser';
import { t } from '../core/i18n';
import { COLORS, COLORS_CSS, UI } from '../config';
import { textStyle } from '../ui/typography';
import { audio } from '../systems/AudioSystem';
import type { CairnBoonDef, CairnBoonId } from './game/cairnStackingBoons';

export interface CairnBoonPickerLaunchData {
  readonly options: readonly CairnBoonDef[];
  readonly onPick: (id: CairnBoonId) => void;
}

interface BoonFocusEntry {
  readonly def: CairnBoonDef;
  readonly bg: Phaser.GameObjects.Rectangle;
}

export class CairnBoonPickerScene extends Phaser.Scene {
  static readonly KEY = 'CairnBoonPicker';

  private launchData!: CairnBoonPickerLaunchData;
  private focusEntries: BoonFocusEntry[] = [];
  private focusedIndex = 0;
  private keyHandler?: (e: KeyboardEvent) => void;
  private resolved = false;

  constructor() {
    super({ key: CairnBoonPickerScene.KEY });
  }

  init(data: CairnBoonPickerLaunchData): void {
    this.launchData = data;
    this.focusEntries = [];
    this.focusedIndex = 0;
    this.resolved = false;
  }

  create(): void {
    this.renderCards();
    this.installKeyboard();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.uninstallKeyboard();
    });
  }

  private renderCards(): void {
    const { width, height } = this.cameras.main;
    const { options } = this.launchData;

    // Backdrop — input-blocking overlay, matches ActIntermission style.
    this.add
      .rectangle(width / 2, height / 2, width, height, COLORS.OVERLAY_DIM, UI.OVERLAY_ALPHA)
      .setInteractive();

    // Title.
    this.add
      .text(width / 2, height / 2 - 180, t('ui.cairn.picker_title'), textStyle('title', { color: COLORS_CSS.TOAST_GOLD }))
      .setOrigin(0.5);

    // Sub-hint.
    this.add
      .text(width / 2, height / 2 - 145, t('ui.cairn.boon_caption'), textStyle('subtitle'))
      .setOrigin(0.5);

    // Three cards.
    const CARD_W = 200;
    const CARD_H = 220;
    const GAP = 24;
    const totalW = options.length * CARD_W + (options.length - 1) * GAP;
    const startX = width / 2 - totalW / 2 + CARD_W / 2;
    const cardY = height / 2 + 10;

    for (let i = 0; i < options.length; i++) {
      const def = options[i];
      const x = startX + i * (CARD_W + GAP);

      const bg = this.add
        .rectangle(x, cardY, CARD_W, CARD_H, 0x1a1a1a, 0.95)
        .setStrokeStyle(2, 0x555555)
        .setInteractive({ useHandCursor: true });

      // Boon name.
      this.add
        .text(x, cardY - CARD_H / 2 + 22, t(`ui.cairn.boon.${def.id}.name`), textStyle('heading', { color: COLORS_CSS.TOAST_GOLD }))
        .setOrigin(0.5);

      // Description.
      this.add
        .text(x, cardY - 20, t(`ui.cairn.boon.${def.id}.desc`), textStyle('small', {
          wordWrap: { width: CARD_W - 16 },
          align: 'center',
        }))
        .setOrigin(0.5, 0.5);

      // PICK button.
      const btnY = cardY + CARD_H / 2 - 26;
      const btnBg = this.add
        .rectangle(x, btnY, CARD_W - 20, 30, 0x3a3a2a)
        .setStrokeStyle(1, 0x888866);
      this.add
        .text(x, btnY, 'PICK', textStyle('label', { color: '#d4c87a' }))
        .setOrigin(0.5);

      this.focusEntries.push({ def, bg });

      // Keyboard shortcut label (1 / 2 / 3).
      this.add
        .text(x - CARD_W / 2 + 10, cardY - CARD_H / 2 + 6, `${i + 1}`, textStyle('small', { color: '#888888' }))
        .setOrigin(0);

      const capture = i;
      bg.on(Phaser.Input.Events.POINTER_OVER, () => {
        this.setFocus(capture);
      });
      bg.on(Phaser.Input.Events.POINTER_DOWN, () => {
        this.confirm();
      });
      btnBg.setInteractive({ useHandCursor: true });
      btnBg.on(Phaser.Input.Events.POINTER_DOWN, () => {
        this.setFocus(capture);
        this.confirm();
      });
    }

    this.setFocus(0);
  }

  private setFocus(index: number): void {
    for (let i = 0; i < this.focusEntries.length; i++) {
      const entry = this.focusEntries[i];
      if (i === index) {
        entry.bg.setStrokeStyle(3, COLORS.TOAST_GOLD);
      } else {
        entry.bg.setStrokeStyle(2, 0x555555);
      }
    }
    this.focusedIndex = index;
  }

  private confirm(): void {
    if (this.resolved) return;
    if (this.focusedIndex < 0 || this.focusedIndex >= this.focusEntries.length) return;
    this.resolved = true;
    const id = this.focusEntries[this.focusedIndex].def.id;
    audio.playClick();
    this.scene.stop();
    this.launchData.onPick(id);
  }

  private installKeyboard(): void {
    if (typeof document === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      if (this.resolved) return;
      if (e.key === '1') { this.setFocus(0); return; }
      if (e.key === '2' && this.focusEntries.length >= 2) { this.setFocus(1); return; }
      if (e.key === '3' && this.focusEntries.length >= 3) { this.setFocus(2); return; }
      if (e.key === 'ArrowLeft') {
        this.setFocus(Math.max(0, this.focusedIndex - 1));
        return;
      }
      if (e.key === 'ArrowRight') {
        this.setFocus(Math.min(this.focusEntries.length - 1, this.focusedIndex + 1));
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.confirm();
      }
    };
    document.addEventListener('keydown', handler);
    this.keyHandler = handler;
  }

  private uninstallKeyboard(): void {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = undefined;
    }
  }
}
