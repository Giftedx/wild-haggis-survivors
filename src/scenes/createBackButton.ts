import type Phaser from 'phaser';
import { resolveBackButtonPalette } from './backButtonPalette';
import { attachButtonHoverFill } from '../ui/buttonHover';

/**
 * Builds the standard "Back" button rectangle + amber bold label that
 * Curse / Chronicle / Deeds / MetaShop scenes all open at the bottom
 * of the screen. The geometry varies (180x30 vs 200x38), the label
 * key varies, the click target scene varies — but the palette,
 * hover-fill swap, label colour and font family stay identical.
 *
 * Returns the rectangle so the caller can wire its own pointerdown
 * handler (most scenes route through `clickToScene(...)` directly).
 */
export interface BackButtonOpts {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  fontSize: string;
  uiScale?: number;
}

export function createBackButton(
  scene: Phaser.Scene,
  opts: BackButtonOpts,
): Phaser.GameObjects.Rectangle {
  const palette = resolveBackButtonPalette();
  const btn = scene.add
    .rectangle(opts.x, opts.y, opts.width, opts.height, palette.idle, 1)
    .setInteractive({ useHandCursor: true });
  const label = scene.add
    .text(opts.x, opts.y, opts.label, {
      fontFamily: 'monospace',
      fontSize: opts.fontSize,
      color: '#e8d4a0',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);
  if (opts.uiScale !== undefined) label.setScale(opts.uiScale);
  attachButtonHoverFill(btn, palette.idle, palette.hover);
  return btn;
}
