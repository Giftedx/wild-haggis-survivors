/**
 * RelicSlotUI — HUD widget showing the player's 3 Relic slots
 * (R1 M3 T22 + T23).
 *
 * Each slot is an interactive rectangle so hover reveals a tooltip
 * (name + effect + flavour, T23). The gem artwork inside the slot is
 * drawn by a shared Graphics object that redraws only when the held
 * set changes — hovering doesn't force redraws.
 *
 * Positioned top-right below the minimap. Respects `uiScale`.
 * Destroys on scene restart via the standard reset pass.
 */
import * as Phaser from 'phaser';
import type { RelicDef } from '../data/relics';
import { COLORS, COLORS_CSS } from '../config';
import { getSettingsManager } from '../core/SettingsManager';
import { getCameraViewport } from './cameraViewport';
import { textStyle } from './typography';
import { t } from '../core/i18n';

export interface RelicSlotUIHooks {
  /** Current held slot defs, length 3; null entries = empty slot. */
  getHeldSlots(): readonly (RelicDef | null)[];
}

const SLOT_COUNT = 3;
const SLOT_SIZE_PX = 34;
const SLOT_GAP_PX = 6;
const MARGIN_PX = 12;
const DEPTH = 49;
const TOOLTIP_DEPTH = 100;

/** Pretty-print a snake_case relic key into "Sporran Of Holding". */
function prettyKey(key: string): string {
  return key
    .split('_')
    .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}

function localisedOrPretty(key: string, fallbackKey: string): string {
  const resolved = t(key);
  return resolved === key ? prettyKey(fallbackKey) : resolved;
}

interface SlotView {
  bg: Phaser.GameObjects.Rectangle;
  def: RelicDef | null;
}

export class RelicSlotUI {
  private readonly scene: Phaser.Scene;
  private readonly hooks: RelicSlotUIHooks;
  private readonly gfx: Phaser.GameObjects.Graphics;
  private readonly uiScale: number;
  private readonly slotViews: SlotView[] = [];
  private lastSig = '';
  private tooltip: {
    bg: Phaser.GameObjects.Rectangle;
    title: Phaser.GameObjects.Text;
    body: Phaser.GameObjects.Text;
  } | null = null;

  constructor(scene: Phaser.Scene, hooks: RelicSlotUIHooks) {
    this.scene = scene;
    this.hooks = hooks;
    this.uiScale = getSettingsManager().load().uiScale;
    this.gfx = scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(DEPTH);

    for (let i = 0; i < SLOT_COUNT; i++) {
      const bg = scene.add.rectangle(0, 0, SLOT_SIZE_PX, SLOT_SIZE_PX, 0x0a0a0a, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH + 1)
        .setInteractive({ useHandCursor: false });
      bg.setOrigin(0, 0);
      bg.on('pointerover', () => this.onHover(i));
      bg.on('pointerout', () => this.hideTooltip());
      this.slotViews.push({ bg, def: null });
    }
  }

  update(): void {
    const slots = this.hooks.getHeldSlots();
    const sig = slots.map((s) => s?.key ?? '').join('|');
    if (sig === this.lastSig) return;
    this.lastSig = sig;
    for (let i = 0; i < SLOT_COUNT; i++) {
      this.slotViews[i].def = slots[i] ?? null;
    }
    this.redraw();
  }

  private redraw(): void {
    this.gfx.clear();
    const vp = getCameraViewport(this.scene);
    const scale = Math.max(0.7, this.uiScale);
    const size = Math.round(SLOT_SIZE_PX * scale);
    const gap = Math.round(SLOT_GAP_PX * scale);
    const margin = Math.round(MARGIN_PX * scale);

    const totalW = SLOT_COUNT * size + (SLOT_COUNT - 1) * gap;
    const startX = vp.x + vp.width - margin - totalW;
    const minimapBlock = Math.round(150 * scale) + margin * 2;
    const y = vp.y + margin + minimapBlock;

    for (let i = 0; i < SLOT_COUNT; i++) {
      const x = startX + i * (size + gap);
      const view = this.slotViews[i];
      view.bg.setPosition(x, y);
      view.bg.setSize(size, size);
      this.drawSlot(x, y, size, view.def);
    }
  }

  private drawSlot(x: number, y: number, size: number, def: RelicDef | null): void {
    const g = this.gfx;
    const cx = x + size / 2;
    const cy = y + size / 2;

    if (def === null) {
      g.lineStyle(1, 0x8a8a8a, 0.65);
      const segLen = Math.max(2, Math.round(size / 8));
      for (let i = 0; i < 4; i++) {
        const px = x + (size / 4) * (i + 0.5) - segLen / 2;
        g.beginPath();
        g.moveTo(px, y);
        g.lineTo(px + segLen, y);
        g.moveTo(px, y + size);
        g.lineTo(px + segLen, y + size);
        g.strokePath();
      }
      for (let i = 0; i < 4; i++) {
        const py = y + (size / 4) * (i + 0.5) - segLen / 2;
        g.beginPath();
        g.moveTo(x, py);
        g.lineTo(x, py + segLen);
        g.moveTo(x + size, py);
        g.lineTo(x + size, py + segLen);
        g.strokePath();
      }
      return;
    }

    g.fillStyle(0x0a0a0a, 0.85);
    g.fillRect(x, y, size, size);
    const rimColour = def.rarity === 'rare' ? 0xffd700 : 0xaaaaaa;
    const rimThickness = def.rarity === 'rare' ? 2 : 1;
    g.lineStyle(rimThickness, rimColour, 1);
    g.strokeRect(x, y, size, size);

    const half = Math.round(size * 0.28);
    g.fillStyle(def.particleColour, 1);
    g.beginPath();
    g.moveTo(cx, cy - half);
    g.lineTo(cx + half, cy);
    g.lineTo(cx, cy + half);
    g.lineTo(cx - half, cy);
    g.closePath();
    g.fillPath();
    g.lineStyle(1, 0xffffff, 0.8);
    g.strokePath();

    g.fillStyle(0xffffff, 0.55);
    const hLen = Math.max(1, Math.round(half * 0.45));
    g.fillRect(cx - hLen, cy - Math.round(half * 0.6), hLen * 2, Math.max(1, Math.round(hLen / 2)));
  }

  private onHover(slotIndex: number): void {
    const view = this.slotViews[slotIndex];
    if (!view || view.def === null) return;
    const def = view.def;
    const name = localisedOrPretty(def.nameKey, def.key);
    const effect = localisedOrPretty(def.effectKey, def.key);
    const flavour = localisedOrPretty(def.flavourKey, def.key);
    const bodyText = `${effect}\n\n${flavour}`;
    this.showTooltip(view.bg.x, view.bg.y + view.bg.height, name, bodyText);
  }

  private showTooltip(anchorX: number, anchorY: number, title: string, body: string): void {
    this.hideTooltip();
    const scale = Math.max(0.7, this.uiScale);
    const wrap = Math.round(220 * scale);
    const padX = Math.round(10 * scale);
    const padY = Math.round(8 * scale);

    const titleText = this.scene.add.text(
      0, 0, title,
      textStyle('label', { color: COLORS_CSS.TOAST_GOLD, wordWrap: { width: wrap } }),
    ).setOrigin(0, 0).setScrollFactor(0).setDepth(TOOLTIP_DEPTH + 1).setScale(scale);

    const bodyText = this.scene.add.text(
      0, 0, body,
      textStyle('small', { color: COLORS_CSS.COOL_GREY, wordWrap: { width: wrap }, fontSize: '12px' }),
    ).setOrigin(0, 0).setScrollFactor(0).setDepth(TOOLTIP_DEPTH + 1).setScale(scale);

    const boxW = Math.max(titleText.width, bodyText.width) + padX * 2;
    const boxH = titleText.height + bodyText.height + padY * 3;

    // Anchor below the hovered slot; if that would clip the screen
    // bottom, flip above. Right-edge alignment keeps the box on-screen.
    const vp = getCameraViewport(this.scene);
    let bx = anchorX;
    let by = anchorY + Math.round(4 * scale);
    if (by + boxH > vp.y + vp.height - 4) {
      by = anchorY - boxH - Math.round(4 * scale) - Math.round(SLOT_SIZE_PX * scale);
    }
    bx = Math.min(bx, vp.x + vp.width - boxW - 4);
    bx = Math.max(bx, vp.x + 4);

    const bg = this.scene.add.rectangle(bx, by, boxW, boxH, COLORS.PANEL_SURFACE, 0.96)
      .setOrigin(0, 0)
      .setStrokeStyle(1, COLORS.WHISKY_GOLD, 0.8)
      .setScrollFactor(0)
      .setDepth(TOOLTIP_DEPTH);
    titleText.setPosition(bx + padX, by + padY);
    bodyText.setPosition(bx + padX, by + padY + titleText.height + padY);

    this.tooltip = { bg, title: titleText, body: bodyText };
  }

  private hideTooltip(): void {
    if (!this.tooltip) return;
    this.tooltip.bg.destroy();
    this.tooltip.title.destroy();
    this.tooltip.body.destroy();
    this.tooltip = null;
  }

  destroy(): void {
    this.hideTooltip();
    for (const v of this.slotViews) v.bg.destroy();
    this.slotViews.length = 0;
    this.gfx.destroy();
    this.lastSig = '';
  }
}
