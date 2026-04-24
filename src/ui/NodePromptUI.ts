/**
 * NodePromptUI — blocking modal for interactive Moor Road node events
 * (shrine / wee_trader / bargain). Minimal panel with 1–3 option
 * buttons plus an optional "Leave" skip.
 *
 * Caller is responsible for pausing game time around the prompt (scene
 * uses TimeManager 'NODE_PROMPT' token). This class owns only the
 * visual + input; it reports the chosen option key (or null on skip)
 * via `onResolve`.
 */

import * as Phaser from 'phaser';
import { COLORS_CSS } from '../config';
import { getSettingsManager } from '../core/SettingsManager';

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

const PANEL_DEPTH = 300;
const PANEL_BASE_WIDTH = 420;
const PANEL_BASE_HEIGHT_PER_OPTION = 56;
const PANEL_MIN_HEIGHT = 180;
const PANEL_PADDING = 20;
const TITLE_FONT_PX = 20;
const BODY_FONT_PX = 14;
const OPTION_FONT_PX = 15;

export class NodePromptUI {
  private readonly scene: Phaser.Scene;
  private scrim: Phaser.GameObjects.Rectangle | null = null;
  private panel: Phaser.GameObjects.Rectangle | null = null;
  private children: Phaser.GameObjects.GameObject[] = [];
  private open = false;

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
    const panelW = PANEL_BASE_WIDTH * scale;
    const panelH = Math.max(
      PANEL_MIN_HEIGHT * scale,
      (80 + optionCount * PANEL_BASE_HEIGHT_PER_OPTION) * scale,
    );

    // Scrim — blocks input behind the panel.
    this.scrim = this.scene.add
      .rectangle(cx, cy, cam.width * 2, cam.height * 2, 0x000000, 0.55)
      .setScrollFactor(0)
      .setDepth(PANEL_DEPTH)
      .setInteractive();
    this.scrim.on('pointerdown', () => {
      // Click on scrim = implicit skip, only when allowed.
      if (opts.allowSkip !== false) this.resolve(null, opts.onResolve);
    });

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
        { key: '__skip__', label: 'Leave' },
        () => this.resolve(null, opts.onResolve),
      );
    }
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
      rect.on('pointerover', () => rect.setStrokeStyle(2, 0xd4a017, 1));
      rect.on('pointerout', () => rect.setStrokeStyle(1, stroke, 1));
      rect.on('pointerup', onClick);
    }
    const textColor = option.disabled ? '#666677' : '#f0f0f8';
    const mainLabel = option.subLabel
      ? `${option.label}   ${option.subLabel}`
      : option.label;
    const label = this.scene.add
      .text(x, y, mainLabel, {
        fontFamily: 'monospace',
        fontSize: `${Math.round(OPTION_FONT_PX * scale)}px`,
        color: textColor,
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(PANEL_DEPTH + 3);
    this.children.push(rect, label);
  }

  private resolve(key: string | null, onResolve: (k: string | null) => void): void {
    if (!this.open) return;
    this.close();
    onResolve(key);
  }

  close(): void {
    this.open = false;
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
