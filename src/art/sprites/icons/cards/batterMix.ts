import * as Phaser from 'phaser';

/**
 * `ucard_batter_mix` — Batter Mix passive icon.
 * A paper bag of plain flour with a batter drip — reads as
 * "deep-fry / damage boost / coating" at 32px.
 */
export function drawBatterMix(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 17;

  // Bag shadow.
  g.fillStyle(0x1a1a1a, 0.30);
  g.fillRect(cx - 6, cy - 8, 13, 17);

  // Paper bag body — cream white.
  g.fillStyle(0xf0e8d0, 1);
  g.fillRect(cx - 7, cy - 9, 14, 16);

  // Bag fold lines — top crease.
  g.lineStyle(1, 0xc8b888, 0.70);
  g.lineBetween(cx - 7, cy - 9, cx - 7, cy + 7);
  g.lineBetween(cx + 7, cy - 9, cx + 7, cy + 7);
  g.lineBetween(cx - 7, cy - 9, cx + 7, cy - 9);

  // Bag top twist — darker crease.
  g.fillStyle(0xd8c8a0, 1);
  g.fillRect(cx - 5, cy - 12, 10, 4);

  // Flour label text area — faint rectangle.
  g.fillStyle(0xe0d8c0, 0.80);
  g.fillRect(cx - 4, cy - 5, 8, 8);

  // Flour label accent — tiny cross mark.
  g.lineStyle(1, 0xb0a070, 0.60);
  g.lineBetween(cx - 2, cy - 1, cx + 2, cy - 1);
  g.lineBetween(cx, cy - 3, cx, cy + 1);

  // Batter drip — amber-gold drip from the base.
  g.fillStyle(0xd4a040, 0.90);
  g.fillRect(cx - 1, cy + 7, 4, 3);
  g.fillEllipse(cx + 1, cy + 11, 5, 4);

  // Batter highlight.
  g.fillStyle(0xf0c868, 0.60);
  g.fillEllipse(cx + 1, cy + 10, 3, 2);

  g.generateTexture('ucard_batter_mix', s, s);
  g.destroy();
}
