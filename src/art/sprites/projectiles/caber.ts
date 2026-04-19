/**
 * `caber` projectile — Highland Games caber (telephone-pole-sized log).
 * Tapered wood body with bark edges, cut end-grain rings on the right
 * end, jagged left end. Flies horizontally through enemies.
 */

import Phaser from 'phaser';

export function bakeCaber(scene: Phaser.Scene): void {
  // 28×28 — Highland Games caber (telephone-pole-sized log).
  const s = 28;
  const g = scene.add.graphics();
  const cy = 14;

  // ── Dark bark outline (entire log) ──
  g.fillStyle(0x1a0e02, 1);
  g.fillRect(2, cy - 6, 22, 13);
  g.fillCircle(23, cy, 6);  // rounded right end

  // ── Main wood body — warm brown ──
  g.fillStyle(0x6a4a10, 1);
  g.fillRect(3, cy - 5, 20, 11);

  // ── Bark texture — dark top and bottom edges ──
  g.fillStyle(0x3a2808, 1);
  g.fillRect(3, cy - 5, 20, 2);
  g.fillRect(3, cy + 4, 20, 2);

  // ── Wood grain lines running horizontally ──
  g.fillStyle(0x5a3a08, 0.7);
  g.fillRect(3, cy - 2, 20, 1);
  g.fillRect(3, cy + 1, 20, 1);
  // Lighter grain highlights
  g.fillStyle(0x8a6a20, 0.5);
  g.fillRect(3, cy - 1, 20, 1);
  g.fillRect(3, cy + 3, 20, 1);

  // ── Top highlight (light hitting the rounded top of the log) ──
  g.fillStyle(0x9a7a28, 0.6);
  g.fillRect(5, cy - 4, 16, 1);

  // ── Knot holes — darker circles with ring detail ──
  g.fillStyle(0x3a2206, 1);
  g.fillCircle(9, cy, 2);
  g.fillStyle(0x4a3008, 1);
  g.fillCircle(9, cy, 1.2);
  g.fillStyle(0x3a2206, 0.6);
  g.fillCircle(17, cy - 2, 1.2);

  // ── Cut end-grain (right end of log) — concentric rings ──
  g.fillStyle(0x5a3e08, 1);
  g.fillCircle(23, cy, 5.5);
  g.fillStyle(0x7a5a14, 1);
  g.fillCircle(23, cy, 4.5);
  // Ring detail
  g.lineStyle(0.8, 0x5a4010, 0.6);
  g.strokeCircle(23, cy, 3.5);
  g.strokeCircle(23, cy, 2);
  // Pith (centre dot)
  g.fillStyle(0x4a3008, 1);
  g.fillCircle(23, cy, 1);
  // End-grain highlight
  g.fillStyle(0x9a7a28, 0.4);
  g.fillCircle(22, cy - 2, 2);

  // ── Left end (broken/rough) — jagged edge ──
  g.fillStyle(0x3a2206, 1);
  g.fillRect(2, cy - 4, 2, 2);
  g.fillRect(2, cy + 2, 2, 2);
  g.fillStyle(0x5a3e08, 1);
  g.fillRect(3, cy - 3, 1, 7);

  g.generateTexture('caber', s, s);
  g.destroy();
}
