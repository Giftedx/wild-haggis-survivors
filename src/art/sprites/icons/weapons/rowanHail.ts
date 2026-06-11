import * as Phaser from 'phaser';

/**
 * `wicon_rowan_hail` — Rowan Hail evolution icon.
 * Three hagstones fanned outward in a spread — centre + left + right.
 * Rowan-red accent glow behind them suggests the charm's warmth.
 * Reads as "fan / piercing / three" at 32px.
 */
export function drawRowanHailIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Rowan-red aura behind the stones.
  g.fillStyle(0x8a1a0a, 0.30);
  g.fillCircle(16, 16, 14);

  // Spread lines suggesting three trajectories.
  g.lineStyle(1, 0xcc4422, 0.25);
  g.lineBetween(8, 16, 30, 8);
  g.lineBetween(8, 16, 30, 16);
  g.lineBetween(8, 16, 30, 24);

  // Top stone (upper arc).
  g.fillStyle(0x2a2a2a, 0.40);
  g.fillCircle(23, 9, 5.5);
  g.fillStyle(0x8a8a82, 1);
  g.fillCircle(22, 8, 5);
  g.fillStyle(0xb0b0a8, 0.50);
  g.fillCircle(20, 7, 2);
  g.lineStyle(1, 0x4a4a46, 1);
  g.strokeCircle(22, 8, 2);
  g.fillStyle(0x0d0d0c, 1);
  g.fillCircle(22, 8, 1.5);

  // Centre stone.
  g.fillStyle(0x2a2a2a, 0.40);
  g.fillCircle(23, 17, 5.5);
  g.fillStyle(0x8a8a82, 1);
  g.fillCircle(22, 16, 5);
  g.fillStyle(0xb0b0a8, 0.50);
  g.fillCircle(20, 15, 2);
  g.lineStyle(1, 0x4a4a46, 1);
  g.strokeCircle(22, 16, 2);
  g.fillStyle(0x0d0d0c, 1);
  g.fillCircle(22, 16, 1.5);

  // Bottom stone (lower arc).
  g.fillStyle(0x2a2a2a, 0.40);
  g.fillCircle(23, 25, 5.5);
  g.fillStyle(0x8a8a82, 1);
  g.fillCircle(22, 24, 5);
  g.fillStyle(0xb0b0a8, 0.50);
  g.fillCircle(20, 23, 2);
  g.lineStyle(1, 0x4a4a46, 1);
  g.strokeCircle(22, 24, 2);
  g.fillStyle(0x0d0d0c, 1);
  g.fillCircle(22, 24, 1.5);

  // Sling / launch point.
  g.fillStyle(0x9a7040, 0.80);
  g.fillCircle(8, 16, 3);
  g.lineStyle(1.5, 0x9a7040, 0.60);
  g.strokeCircle(8, 16, 3);

  // Rowan berry accent — three red dots (one per stone).
  g.fillStyle(0xcc3311, 0.85);
  g.fillCircle(5, 8, 1.5);
  g.fillCircle(3, 16, 1.5);
  g.fillCircle(5, 24, 1.5);

  g.generateTexture('wicon_rowan_hail', s, s);
  g.destroy();
}
