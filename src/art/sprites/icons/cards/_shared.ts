/**
 * Shared helpers for card icons. `cardIconBg` paints the dark rounded
 * frame used by every card; `darkenHex` is the local 0–1 multiplier
 * variant (distinct from the 0–100 percent helper in
 * `utils/colorFormat.ts`).
 */

import * as Phaser from 'phaser';

export function cardIconBg(g: Phaser.GameObjects.Graphics, s: number, bgColor: number): void {
  g.fillStyle(0x0b111c, 1);
  g.fillRoundedRect(1, 1, s - 2, s - 2, 6);
  g.fillStyle(bgColor, 1);
  g.fillRoundedRect(3, 3, s - 6, s - 6, 4);
}

/** Darken a hex color by multiplying each channel (factor 0–1). */
export function darkenHex(hex: number, factor: number): number {
  const r = Math.floor(((hex >> 16) & 0xff) * factor);
  const gg = Math.floor(((hex >> 8) & 0xff) * factor);
  const b = Math.floor((hex & 0xff) * factor);
  return (r << 16) | (gg << 8) | b;
}
