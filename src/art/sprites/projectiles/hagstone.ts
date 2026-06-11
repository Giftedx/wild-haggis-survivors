/**
 * `hagstone` projectile — a holed river stone on a cord.
 * Grey-granite disc with a dark central aperture; tapers slightly
 * in the direction of flight. The hole is the mechanic — enemies
 * seen through it take the bonus.
 */

import * as Phaser from 'phaser';

export function bakeHagstone(scene: Phaser.Scene): void {
  // 22×22 — compact river stone.
  const s = 22;
  const g = scene.add.graphics();
  const cx = 11, cy = 11;

  // Motion trail — faint grey smear behind the stone.
  g.fillStyle(0x888888, 0.18);
  g.fillEllipse(cx - 5, cy, 8, 6);
  g.fillStyle(0x999999, 0.12);
  g.fillEllipse(cx - 8, cy, 5, 4);

  // Stone shadow/outline.
  g.fillStyle(0x2a2a2a, 0.70);
  g.fillCircle(cx + 1, cy + 1, 9);

  // Main stone body — grey granite.
  g.fillStyle(0x8a8a82, 1);
  g.fillCircle(cx, cy, 8);

  // Granite mottling — lighter patches.
  g.fillStyle(0xb0b0a8, 0.55);
  g.fillCircle(cx - 2, cy - 2, 3);
  g.fillCircle(cx + 3, cy + 1, 2);

  // Granite mottling — darker patches.
  g.fillStyle(0x5a5a56, 0.45);
  g.fillCircle(cx + 1, cy + 3, 2);
  g.fillCircle(cx - 3, cy + 2, 1.5);

  // Central aperture — the hole. Dark void with a subtle rim.
  g.lineStyle(1.5, 0x4a4a46, 1);
  g.strokeCircle(cx, cy, 3.5);
  g.fillStyle(0x0f0f0e, 1);
  g.fillCircle(cx, cy, 3);

  // Cord — a faint cord stub trailing left (shows this is a sling stone).
  g.lineStyle(1.2, 0x9a7040, 0.65);
  g.lineBetween(cx - 8, cy, cx - 11, cy + 2);
  g.lineBetween(cx - 11, cy + 2, cx - 14, cy + 1);

  g.generateTexture('hagstone', s, s);
  g.destroy();
}
