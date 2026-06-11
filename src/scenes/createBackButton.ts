import type Phaser from 'phaser';
import { createGameButton } from '../ui/gameButton';

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
  const { rect } = createGameButton(scene, {
    x: opts.x, y: opts.y, width: opts.width, height: opts.height,
    label: opts.label, tier: 'tertiary', fontSize: opts.fontSize, uiScale: opts.uiScale,
  });
  return rect;
}
