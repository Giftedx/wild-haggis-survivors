/**
 * NodePromptUI — blocking modal for interactive Moor Road node events
 * (shrine / wee_trader / bargain). Panel with 1–3 option buttons,
 * keyboard/gamepad focus navigation, and an optional explicit "Leave" skip.
 *
 * Caller is responsible for pausing game time around the prompt (scene
 * uses TimeManager 'NODE_PROMPT' token). This class owns only the
 * visual + input; it reports the chosen option key (or null on skip)
 * via `onResolve`.
 */

import * as Phaser from 'phaser';
import { COLORS_CSS } from '../config';
import { getSettingsManager } from '../core/SettingsManager';
import { t } from '../core/i18n';
import {
  firstEnabledPromptEntryIndex,
  movePromptFocusIndex,
  type NodePromptNavEntry,
} from './nodePromptNav';
import { createDomFocusLayer, type DomFocusLayer } from './domFocusLayer';
import { buildNodePromptDomFocusActions } from './nodePromptDomFocus';

export interface NodePromptOption {
  readonly key: string;
  readonly label: string;
  /** Optional sub-line — shows a gold price, required HP, etc. */
  readonly subLabel?: string;
  /** When true, the button is visible but unclickable. */
  readonly disabled?: boolean;
}

export interface NodePromptOpts {
  readonly title: string;
  readonly body?: string;
  readonly options: readonly NodePromptOption[];
  /** Show a "Leave" button that resolves with `null`. Default true. */
  readonly allowSkip?: boolean;
  readonly onResolve: (chosenKey: string | null) => void;
}

const PANEL_DEPTH = 1400;
const PANEL_BASE_WIDTH = 420;
const PANEL_BASE_HEIGHT_PER_OPTION = 56;
const PANEL_MIN_HEIGHT = 180;
const PANEL_PADDING = 20;
const TITLE_FONT_PX = 20;
const BODY_FONT_PX = 14;
const OPTION_FONT_PX = 15;

interface NodePromptButtonEntry extends NodePromptNavEntry {
  readonly rect: Phaser.GameObjects.Rectangle;
  readonly activate: () => void;
  readonly baseStroke: number;
}

export class NodePromptUI {
  private readonly scene: Phaser.Scene;
  private scrim: Phaser.GameObjects.Rectangle | null = null;
  private panel: Phaser.GameObjects.Rectangle | null = null;
  private children: Phaser.GameObjects.GameObject[] = [];
  private buttonEntries: NodePromptButtonEntry[] = [];
  private focusedIndex = -1;
  private keyboardHandlers: Array<{ event: string; handler: (event: KeyboardEvent) => void }> = [];
  private updateHandler: (() => void) | null = null;
  private prevPadUp = false;
  private prevPadDown = false;
  private prevPadConfirm = false;
  private prevPadCancel = false;
  private open = false;
  /**
   * T407 — DOM-visible focus mirror. Visually hidden 1×1 clipped div
   * exposing the same option list + Leave button as native `<button>`
   * elements. Mirrors the Phaser focus state so screen-reader / keyboard
   * users hear what is selected and can activate any option without a
   * working pointer. Per-show lifecycle: created in `show()`, destroyed
   * in `close()` — paired exactly like the scrim + panel.
   */
  private domFocusLayer: DomFocusLayer | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  isOpen(): boolean {
    return this.open;
  }

  show(opts: NodePromptOpts): void {
    if (this.open) return;
    this.open = true;

    const { uiScale } = getSettingsManager().load();
    const scale = Math.max(0.75, uiScale);
    const cam = this.scene.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;

    const optionCount = opts.options.length + (opts.allowSkip !== false ? 1 : 0);
    const panelW = Math.min(
      PANEL_BASE_WIDTH * scale,
      Math.max(280, cam.width - 32),
    );
    const panelH = Math.min(
      Math.max(
      PANEL_MIN_HEIGHT * scale,
      (80 + optionCount * PANEL_BASE_HEIGHT_PER_OPTION) * scale,
      ),
      Math.max(PANEL_MIN_HEIGHT * scale, cam.height - 32),
    );

    // Scrim — blocks input behind the panel.
    this.scrim = this.scene.add
      .rectangle(cx, cy, cam.width * 2, cam.height * 2, 0x000000, 0.55)
      .setScrollFactor(0)
      .setDepth(PANEL_DEPTH)
      .setInteractive();
    // Scrim click only blocks the playfield. Skipping is deliberate via
    // the Leave button, Esc/B, or the explicit caller-provided option.

    this.panel = this.scene.add
      .rectangle(cx, cy, panelW, panelH, 0x0a0a10, 0.95)
      .setStrokeStyle(2, 0xd4a017, 1)
      .setScrollFactor(0)
      .setDepth(PANEL_DEPTH + 1)
      .setInteractive();
    // Eat clicks on the panel body so they don't bubble to the scrim.
    this.panel.on('pointerdown', (pointer: Phaser.Input.Pointer, _x: number, _y: number, evt: { stopPropagation: () => void }) => {
      evt.stopPropagation?.();
      void pointer;
    });

    const titleY = cy - panelH / 2 + PANEL_PADDING * scale + TITLE_FONT_PX * scale * 0.5;
    const title = this.scene.add
      .text(cx, titleY, opts.title, {
        fontFamily: 'monospace',
        fontSize: `${Math.round(TITLE_FONT_PX * scale)}px`,
        color: COLORS_CSS.WHISKY_GOLD,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(PANEL_DEPTH + 2);
    this.children.push(title);

    let cursorY = titleY + TITLE_FONT_PX * scale * 0.7 + 8 * scale;
    if (opts.body && opts.body.length > 0) {
      const body = this.scene.add
        .text(cx, cursorY + BODY_FONT_PX * scale * 0.5, opts.body, {
          fontFamily: 'monospace',
          fontSize: `${Math.round(BODY_FONT_PX * scale)}px`,
          color: '#ddddee',
          align: 'center',
          wordWrap: { width: panelW - 2 * PANEL_PADDING * scale },
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(PANEL_DEPTH + 2);
      this.children.push(body);
      cursorY += BODY_FONT_PX * scale * 2 + 10 * scale;
    } else {
      cursorY += 10 * scale;
    }

    for (const option of opts.options) {
      const y = cursorY + PANEL_BASE_HEIGHT_PER_OPTION * scale * 0.5;
      cursorY += PANEL_BASE_HEIGHT_PER_OPTION * scale;
      this.buildButton(cx, y, panelW - 2 * PANEL_PADDING * scale, scale, option, () => {
        if (!option.disabled) this.resolve(option.key, opts.onResolve);
      });
    }

    if (opts.allowSkip !== false) {
      const y = cursorY + PANEL_BASE_HEIGHT_PER_OPTION * scale * 0.5;
      this.buildButton(
        cx,
        y,
        panelW - 2 * PANEL_PADDING * scale,
        scale,
        { key: '__skip__', label: t('nodes.ui.leave') },
        () => this.resolve(null, opts.onResolve),
      );
    }

    this.focusedIndex = firstEnabledPromptEntryIndex(this.buttonEntries);
    this.applyFocus();
    this.installKeyboard(opts);
    this.installGamepad(opts);
    this.installDomFocusLayer(opts);
  }

  private buildButton(
    x: number,
    y: number,
    width: number,
    scale: number,
    option: NodePromptOption,
    onClick: () => void,
  ): void {
    const btnH = 40 * scale;
    const fill = option.disabled ? 0x1a1a20 : 0x1f1f28;
    const stroke = option.disabled ? 0x444455 : 0x6a6a78;
    const rect = this.scene.add
      .rectangle(x, y, width, btnH, fill, 1)
      .setStrokeStyle(1, stroke, 1)
      .setScrollFactor(0)
      .setDepth(PANEL_DEPTH + 2);
    if (!option.disabled) {
      rect.setInteractive({ useHandCursor: true });
      rect.on('pointerover', () => {
        this.focusedIndex = this.buttonEntries.findIndex((entry) => entry.rect === rect);
        this.applyFocus();
      });
      rect.on('pointerout', () => this.applyFocus());
      rect.on('pointerup', onClick);
    }
    const textColor = option.disabled ? '#666677' : '#f0f0f8';
    const padX = 12 * scale;
    if (option.subLabel) {
      const subLabelW = Math.min(96 * scale, width * 0.34);
      const labelW = Math.max(90, width - subLabelW - padX * 3);
      const label = this.scene.add
        .text(x - width / 2 + padX, y, option.label, {
          fontFamily: 'monospace',
          fontSize: `${Math.round(OPTION_FONT_PX * scale)}px`,
          color: textColor,
          wordWrap: { width: labelW },
          align: 'left',
        })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(PANEL_DEPTH + 3);
      const sub = this.scene.add
        .text(x + width / 2 - padX, y, option.subLabel, {
          fontFamily: 'monospace',
          fontSize: `${Math.round((OPTION_FONT_PX - 1) * scale)}px`,
          color: option.disabled ? '#666677' : COLORS_CSS.WHISKY_GOLD,
          wordWrap: { width: subLabelW },
          align: 'right',
        })
        .setOrigin(1, 0.5)
        .setScrollFactor(0)
        .setDepth(PANEL_DEPTH + 3);
      this.children.push(rect, label, sub);
    } else {
      const label = this.scene.add
        .text(x, y, option.label, {
          fontFamily: 'monospace',
          fontSize: `${Math.round(OPTION_FONT_PX * scale)}px`,
          color: textColor,
          wordWrap: { width: Math.max(90, width - padX * 2) },
          align: 'center',
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(PANEL_DEPTH + 3);
      this.children.push(rect, label);
    }
    this.buttonEntries.push({
      rect,
      activate: onClick,
      baseStroke: stroke,
      disabled: option.disabled,
    });
  }

  private installKeyboard(opts: NodePromptOpts): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;
    const move = (direction: -1 | 1) => {
      this.focusedIndex = movePromptFocusIndex(this.buttonEntries, this.focusedIndex, direction);
      this.applyFocus();
    };
    const activate = () => this.activateFocused();
    const leave = () => {
      if (opts.allowSkip !== false) this.resolve(null, opts.onResolve);
    };
    const handlers = [
      ['keydown-UP', (event: KeyboardEvent) => { event.preventDefault(); move(-1); }],
      ['keydown-DOWN', (event: KeyboardEvent) => { event.preventDefault(); move(1); }],
      ['keydown-TAB', (event: KeyboardEvent) => {
        event.preventDefault();
        move(event.shiftKey ? -1 : 1);
      }],
      ['keydown-ENTER', (event: KeyboardEvent) => { event.preventDefault(); activate(); }],
      ['keydown-SPACE', (event: KeyboardEvent) => { event.preventDefault(); activate(); }],
      ['keydown-ESC', (event: KeyboardEvent) => { event.preventDefault(); leave(); }],
    ] as const;
    for (const [event, handler] of handlers) {
      keyboard.on(event, handler);
      this.keyboardHandlers.push({ event, handler });
    }
  }

  private installGamepad(opts: NodePromptOpts): void {
    this.updateHandler = () => {
      if (!this.open) return;
      const pad = this.scene.input.gamepad?.pad1;
      if (!pad?.connected) {
        this.prevPadUp = this.prevPadDown = this.prevPadConfirm = this.prevPadCancel = false;
        return;
      }

      const up = pad.up || pad.leftStick.y < -0.5;
      const down = pad.down || pad.leftStick.y > 0.5;
      const confirm = pad.buttons[0]?.pressed === true || pad.buttons[9]?.pressed === true;
      const cancel = pad.buttons[1]?.pressed === true;

      if (up && !this.prevPadUp) {
        this.focusedIndex = movePromptFocusIndex(this.buttonEntries, this.focusedIndex, -1);
        this.applyFocus();
      }
      if (down && !this.prevPadDown) {
        this.focusedIndex = movePromptFocusIndex(this.buttonEntries, this.focusedIndex, 1);
        this.applyFocus();
      }
      if (confirm && !this.prevPadConfirm) this.activateFocused();
      if (cancel && !this.prevPadCancel && opts.allowSkip !== false) {
        this.resolve(null, opts.onResolve);
      }

      this.prevPadUp = up;
      this.prevPadDown = down;
      this.prevPadConfirm = confirm;
      this.prevPadCancel = cancel;
    };
    this.scene.events.on('update', this.updateHandler);
  }

  private activateFocused(): void {
    const entry = this.buttonEntries[this.focusedIndex];
    if (!entry || entry.disabled) return;
    entry.activate();
  }

  private applyFocus(): void {
    for (let i = 0; i < this.buttonEntries.length; i++) {
      const entry = this.buttonEntries[i]!;
      if (entry.disabled) {
        entry.rect.setStrokeStyle(1, entry.baseStroke, 1);
      } else if (i === this.focusedIndex) {
        entry.rect.setStrokeStyle(2, 0xd4a017, 1);
      } else {
        entry.rect.setStrokeStyle(1, entry.baseStroke, 1);
      }
    }
    // Keep the DOM focus mirror in lockstep with the visible Phaser cursor
    // so assistive tech announces the same row the user sees. The DOM layer
    // builds its actions from `opts.options` in the same order as the
    // Phaser button entries, so indices map directly (no remap needed).
    if (this.domFocusLayer && this.focusedIndex >= 0 && this.focusedIndex < this.buttonEntries.length) {
      this.domFocusLayer.setFocusedIndex(this.focusedIndex);
    }
  }

  /**
   * T407 — install the DOM-visible focus layer for this prompt invocation.
   * The layer is paired one-for-one with the Phaser button entries: each
   * option appears as a native `<button>` carrying the option label + the
   * folded subLabel (price / cost) so screen-reader users hear the
   * trade-off in one announcement. Activation routes through the same
   * `activate` callback as the Phaser button (single source of truth for
   * the resolve contract), and DOM-driven focus changes mirror back into
   * `focusedIndex` so the visible cursor moves with assistive-tech focus.
   */
  private installDomFocusLayer(opts: NodePromptOpts): void {
    if (typeof document === 'undefined') return;
    const allowSkip = opts.allowSkip !== false;
    const actions = buildNodePromptDomFocusActions({
      options: opts.options,
      allowSkip,
      onActivateOption: (index) => {
        const entry = this.buttonEntries[index];
        if (!entry || entry.disabled) return;
        entry.activate();
      },
      onActivateLeave: () => {
        if (allowSkip) this.resolve(null, opts.onResolve);
      },
    });
    this.domFocusLayer = createDomFocusLayer({
      id: 'whs-node-prompt-focus-layer',
      label: opts.title,
      description: opts.body && opts.body.length > 0 ? opts.body : undefined,
      role: 'dialog',
      actions,
      initialFocusIndex: this.focusedIndex >= 0 ? this.focusedIndex : 0,
      onFocusIndexChange: (index) => {
        // Sync the visible Phaser cursor back to the DOM-driven focus.
        // Bounds + disabled checks mirror what `movePromptFocusIndex`
        // would enforce — guard before mutating focusedIndex.
        if (index < 0 || index >= this.buttonEntries.length) return;
        const entry = this.buttonEntries[index];
        if (!entry || entry.disabled) return;
        this.focusedIndex = index;
        // Re-render Phaser strokes only — calling applyFocus() would
        // round-trip back into setFocusedIndex on the layer (stable but
        // wasteful). Mirror the disabled / focused / idle stroke logic
        // inline.
        for (let i = 0; i < this.buttonEntries.length; i++) {
          const e = this.buttonEntries[i]!;
          if (e.disabled) {
            e.rect.setStrokeStyle(1, e.baseStroke, 1);
          } else if (i === this.focusedIndex) {
            e.rect.setStrokeStyle(2, 0xd4a017, 1);
          } else {
            e.rect.setStrokeStyle(1, e.baseStroke, 1);
          }
        }
      },
    });
  }

  private uninstallDomFocusLayer(): void {
    this.domFocusLayer?.destroy();
    this.domFocusLayer = null;
  }

  private resolve(key: string | null, onResolve: (k: string | null) => void): void {
    if (!this.open) return;
    this.close();
    onResolve(key);
  }

  close(): void {
    this.open = false;
    const keyboard = this.scene.input.keyboard;
    if (keyboard) {
      for (const { event, handler } of this.keyboardHandlers) {
        keyboard.off(event, handler);
      }
    }
    this.keyboardHandlers = [];
    if (this.updateHandler) {
      this.scene.events.off('update', this.updateHandler);
      this.updateHandler = null;
    }
    // Tear down the DOM mirror BEFORE clearing buttonEntries — destroy()
    // is idempotent on the layer side (re-entry is a no-op) but pairing
    // it here keeps the lifecycle symmetric with show()/installDomFocusLayer.
    this.uninstallDomFocusLayer();
    this.buttonEntries = [];
    this.focusedIndex = -1;
    this.prevPadUp = this.prevPadDown = this.prevPadConfirm = this.prevPadCancel = false;
    for (const c of this.children) {
      try { c.destroy(); } catch { /* ignore */ }
    }
    this.children = [];
    this.scrim?.destroy();
    this.scrim = null;
    this.panel?.destroy();
    this.panel = null;
  }

  destroy(): void {
    this.close();
  }
}
