/**
 * `nest` — bird's nest: twig base with criss-crossed detail, three speckled eggs, a single feather poking out. Stationary spawner.
 */

import Phaser from 'phaser';

export function bakeNest(scene: Phaser.Scene): void {
  const s = 40;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // Nest base outline
  g.fillStyle(0x3a2808, 1);
  g.fillEllipse(cx, cy + 4, 34, 20);
  // Nest twigs base
  g.fillStyle(0x6b4e0a, 1);
  g.fillEllipse(cx, cy + 3, 32, 18);
  g.fillStyle(0x886622, 1);
  g.fillEllipse(cx, cy + 1, 28, 14);
  // Twig detail (criss-crossed lines)
  g.lineStyle(1, 0x4a2a0a, 1);
  g.lineBetween(cx - 14, cy + 6, cx + 12, cy - 2);
  g.lineBetween(cx - 12, cy - 2, cx + 14, cy + 5);
  g.lineBetween(cx - 10, cy + 8, cx + 10, cy + 3);
  g.lineBetween(cx - 8, cy + 2, cx + 8, cy + 8);
  // Nest inside (darker)
  g.fillStyle(0x3a2808, 1);
  g.fillEllipse(cx, cy - 1, 20, 8);

  // Eggs (iconic, big and speckled)
  g.fillStyle(0xbbaa88, 1);
  g.fillEllipse(cx - 6, cy - 3, 8, 10);
  g.fillEllipse(cx + 6, cy - 3, 8, 10);
  g.fillEllipse(cx, cy - 2, 8, 10);
  g.fillStyle(0xeeeecc, 1);
  g.fillEllipse(cx - 6, cy - 4, 6, 8);
  g.fillEllipse(cx + 6, cy - 4, 6, 8);
  g.fillEllipse(cx, cy - 3, 6, 8);
  // Egg speckles
  g.fillStyle(0x8b6914, 1);
  g.fillCircle(cx - 6, cy - 2, 0.7);
  g.fillCircle(cx - 4, cy - 5, 0.7);
  g.fillCircle(cx + 6, cy - 4, 0.7);
  g.fillCircle(cx + 7, cy - 1, 0.7);
  g.fillCircle(cx, cy - 1, 0.7);
  g.fillCircle(cx + 1, cy - 5, 0.7);
  g.fillCircle(cx - 1, cy - 3, 0.7);

  // Wee feather sticking out (brown, wispy)
  g.fillStyle(0x886644, 0.8);
  g.fillTriangle(cx + 12, cy - 4, cx + 16, cy - 8, cx + 13, cy - 2);
  g.fillStyle(0xaa8866, 0.6);
  g.fillTriangle(cx + 12, cy - 3, cx + 15, cy - 7, cx + 13, cy - 2);
  g.lineStyle(0.5, 0x664422, 0.7);
  g.lineBetween(cx + 12, cy - 2, cx + 15, cy - 7);

  g.generateTexture('nest', s, s);
  g.destroy();
}

