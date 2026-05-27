/**
 * `mars_bar` projectile — a deep-fried Mars Bar.
 * Rectangular brick: dark chocolate base, pale gold batter coating,
 * slight caramel sheen. Lumbers through the air with a slow angular tumble.
 */

import * as Phaser from 'phaser';

export function bakeMarsBar(scene: Phaser.Scene): void {
  // 20×12 — rectangular, heavy.
  const w = 20, h = 12;
  const g = scene.add.graphics();

  // Motion trail — faint caramel smear behind.
  g.fillStyle(0xc08030, 0.14);
  g.fillRect(-4, 3, 5, 6);
  g.fillStyle(0xc08030, 0.08);
  g.fillRect(-8, 4, 4, 4);

  // Shadow/outline.
  g.fillStyle(0x1a0d00, 0.65);
  g.fillRect(1, 1, w, h);

  // Batter coating — pale gold outer.
  g.fillStyle(0xd4a040, 1);
  g.fillRect(0, 0, w, h);

  // Chocolate glimpse through cracked batter — dark brown stripe.
  g.fillStyle(0x4a1c08, 1);
  g.fillRect(3, 2, w - 6, h - 4);

  // Caramel inner — warm amber strip.
  g.fillStyle(0xc87820, 0.80);
  g.fillRect(4, 4, w - 8, 2);

  // Nougat hint — cream centre.
  g.fillStyle(0xf0e0c0, 0.60);
  g.fillRect(5, 5, w - 10, 2);

  // Batter highlight — lighter top edge.
  g.fillStyle(0xf0c868, 0.70);
  g.fillRect(1, 0, w - 2, 2);

  // Batter crust shadow — darker bottom.
  g.fillStyle(0x8a5010, 0.55);
  g.fillRect(1, h - 2, w - 2, 2);

  g.generateTexture('mars_bar', w, h);
  g.destroy();
}
