/**
 * E1 M2 T10 — Haggis-platter pickup sprite.
 *
 * One-off in-game pickup that spawns during a Burns Night run. Drawn
 * fresh from Phaser Graphics (same visual language as the Croft
 * seasonal platter, scaled up for gameplay readability) and baked
 * into a texture at boot time so the collector can use a single
 * pooled sprite + physics body.
 *
 * Keeps palette anchored to the Burns-tonal set (warm metals, dark
 * oats, parsley flash, whisky amber) defined in the Art Style Bible.
 */

import * as Phaser from 'phaser';

export const HAGGIS_PLATTER_PICKUP_SIZE = 56;

const PLATTER_OUTLINE = 0x0a0604;
const PLATTER_METAL = 0xc0a878;
const PLATTER_SHEEN = 0xf0e0a0;
const HAGGIS_DARK = 0x3a1e0a;
const HAGGIS_MID = 0x6a3a14;
const HAGGIS_HI = 0x9a5a28;
const PARSLEY = 0x2a7018;
const STEAM = 0xe8d8b8;
const WHISKY = 0xd48a28;
const WHISKY_HI = 0xffc668;
const GLASS_OUTLINE = 0x202028;

/**
 * Draw the haggis-platter pickup centred on (cx, cy). Scaled ~1.5×
 * the Croft version so the sprite reads at gameplay camera zoom.
 */
export function drawHaggisPlatterPickup(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Platter base — wider ellipse for visibility.
  g.fillStyle(PLATTER_OUTLINE, 1);
  g.fillEllipse(cx, cy + 4, 44, 12);
  g.fillStyle(PLATTER_METAL, 1);
  g.fillEllipse(cx, cy + 4, 42, 10);
  g.fillStyle(PLATTER_SHEEN, 0.8);
  g.fillEllipse(cx - 8, cy + 3, 14, 3);

  // Haggis dome.
  g.fillStyle(PLATTER_OUTLINE, 1);
  g.fillEllipse(cx, cy - 3, 28, 14);
  g.fillStyle(HAGGIS_DARK, 1);
  g.fillEllipse(cx, cy - 3, 26, 12);
  g.fillStyle(HAGGIS_MID, 1);
  g.fillEllipse(cx - 1, cy - 5, 20, 7);
  g.fillStyle(HAGGIS_HI, 0.85);
  g.fillEllipse(cx - 3, cy - 7, 12, 3);

  // Steam curls.
  g.fillStyle(STEAM, 0.5);
  g.fillCircle(cx - 6, cy - 14, 2.4);
  g.fillCircle(cx, cy - 17, 2.0);
  g.fillCircle(cx + 6, cy - 13, 2.2);

  // Parsley sprig.
  g.fillStyle(PARSLEY, 1);
  g.fillCircle(cx + 12, cy - 2, 2.4);
  g.fillCircle(cx + 14, cy - 4, 1.8);
  g.fillCircle(cx + 10, cy - 4, 1.6);

  // Whisky glass to the right.
  g.fillStyle(GLASS_OUTLINE, 1);
  g.fillRect(cx + 18, cy - 8, 7, 12);
  g.fillStyle(WHISKY, 1);
  g.fillRect(cx + 18.8, cy - 3, 5.4, 7);
  g.fillStyle(WHISKY_HI, 0.9);
  g.fillRect(cx + 19.3, cy - 2, 1.2, 4);
  g.fillStyle(PLATTER_SHEEN, 0.55);
  g.fillRect(cx + 18, cy - 8, 7, 1);
}
