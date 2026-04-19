/**
 * `deco_rock` / `deco_rock_2` / `deco_rock_3` — three rock variants for
 * environmental dressing on the moor. One function bakes all three so
 * the scattered-rock prop system can pick a variant per instance.
 *
 *  - variant 1: wide flat rock with lichen and horizontal crack.
 *  - variant 2: taller round boulder with moss on the north side.
 *  - variant 3: pebble cluster with a wee fallen traffic cone (lore).
 */

import Phaser from 'phaser';

export function bakeRocks(scene: Phaser.Scene): void {
  const s = 24;
  const cx = s / 2, cy = s / 2 + 2;

  // Variant 1 — wide flat rock with lichen and horizontal crack
  const g1 = scene.add.graphics();
  // Ground shadow
  g1.fillStyle(0x000000, 0.12);
  g1.fillEllipse(cx, cy + 4, 18, 5);
  // Dark stone outline
  g1.fillStyle(0x282838, 1);
  g1.fillEllipse(cx, cy, 18, 11);
  // Main stone body — warm Highland grey (not cold)
  g1.fillStyle(0x4a4a58, 1);
  g1.fillEllipse(cx, cy, 17, 10);
  // Lighter face — light catching the top
  g1.fillStyle(0x6a6a78, 1);
  g1.fillEllipse(cx - 1, cy - 1, 14, 7);
  // Bright highlight on top-left
  g1.fillStyle(0x8a8a96, 0.7);
  g1.fillEllipse(cx - 3, cy - 2, 8, 4);
  // Horizontal crack — the weathering
  g1.fillStyle(0x282838, 1);
  g1.fillRect(cx - 2, cy - 1, 5, 1);
  g1.fillRect(cx + 2, cy, 2, 1);
  // Secondary crack (branching)
  g1.fillRect(cx - 5, cy + 1, 3, 1);
  // ── Lichen patches — yellow-green, THE moor rock signature ──
  g1.fillStyle(0x88a844, 0.7);
  g1.fillCircle(cx + 4, cy - 2, 2);
  g1.fillStyle(0x99bb55, 0.6);
  g1.fillCircle(cx + 4, cy - 2, 1.2);
  g1.fillStyle(0x77994a, 0.5);
  g1.fillCircle(cx - 5, cy + 1, 1.5);
  // Tiny quartz fleck (mineral sparkle)
  g1.fillStyle(0xffffff, 0.5);
  g1.fillRect(cx - 4, cy - 3, 1, 1);
  g1.generateTexture('deco_rock', s, s);
  g1.destroy();

  // Variant 2 — taller, rounder boulder with moss on the north side
  const g2 = scene.add.graphics();
  g2.fillStyle(0x000000, 0.12);
  g2.fillEllipse(cx, cy + 5, 14, 4);
  // Dark outline
  g2.fillStyle(0x222234, 1);
  g2.fillEllipse(cx, cy, 14, 13);
  // Mid stone
  g2.fillStyle(0x3e3e50, 1);
  g2.fillEllipse(cx, cy, 13, 12);
  // Lighter upper face
  g2.fillStyle(0x5a5a6c, 1);
  g2.fillEllipse(cx - 1, cy - 2, 10, 8);
  // Highlight dome
  g2.fillStyle(0x7a7a88, 0.6);
  g2.fillEllipse(cx - 2, cy - 3, 6, 4);
  // Diagonal crack
  g2.fillStyle(0x222234, 1);
  g2.fillRect(cx - 1, cy - 3, 1, 2);
  g2.fillRect(cx, cy - 1, 1, 2);
  g2.fillRect(cx + 1, cy + 1, 1, 1);
  // ── Moss on shaded (right-lower) side — rich green ──
  g2.fillStyle(0x2a5522, 0.6);
  g2.fillCircle(cx + 3, cy + 3, 2.5);
  g2.fillCircle(cx + 5, cy + 2, 1.8);
  g2.fillStyle(0x3a7733, 0.5);
  g2.fillCircle(cx + 3, cy + 3, 1.5);
  // Quartz vein (thin diagonal line)
  g2.fillStyle(0xcccccc, 0.3);
  g2.fillRect(cx - 4, cy - 4, 1, 1);
  g2.fillRect(cx - 3, cy - 3, 1, 1);
  g2.fillRect(cx - 2, cy - 2, 1, 1);
  g2.generateTexture('deco_rock_2', s, s);
  g2.destroy();

  // Variant 3 — pebble cluster with a wee fallen traffic cone
  const g3 = scene.add.graphics();
  g3.fillStyle(0x000000, 0.1);
  g3.fillEllipse(cx, cy + 3, 16, 4);
  // Left pebble — dark outline then layers
  g3.fillStyle(0x2e2e3e, 1);
  g3.fillEllipse(cx - 3, cy, 10, 8);
  g3.fillStyle(0x484858, 1);
  g3.fillEllipse(cx - 3, cy - 1, 9, 7);
  g3.fillStyle(0x6a6a78, 0.7);
  g3.fillEllipse(cx - 4, cy - 2, 5, 3);
  // Right pebble
  g3.fillStyle(0x2e2e3e, 1);
  g3.fillEllipse(cx + 4, cy + 1, 8, 7);
  g3.fillStyle(0x484858, 1);
  g3.fillEllipse(cx + 4, cy, 7, 6);
  g3.fillStyle(0x6a6a78, 0.6);
  g3.fillEllipse(cx + 3, cy - 1, 4, 2);
  // Lichen on left pebble
  g3.fillStyle(0x88a844, 0.5);
  g3.fillCircle(cx - 5, cy + 1, 1.2);
  // Wee traffic cone lying on its side (if you know, you know)
  g3.fillStyle(0x882200, 0.8);
  g3.fillTriangle(cx + 7, cy - 2, cx + 10, cy + 2, cx + 5, cy + 2);
  g3.fillStyle(0xff6600, 1);
  g3.fillTriangle(cx + 7, cy - 1, cx + 9, cy + 1, cx + 5, cy + 1);
  g3.fillStyle(0xff8833, 1);
  g3.fillTriangle(cx + 7, cy - 1, cx + 8, cy + 1, cx + 6, cy + 1);
  // White band on fallen cone
  g3.fillStyle(0xffffff, 0.85);
  g3.fillRect(cx + 6, cy, 2, 1);
  // Mud on the cone (it's been here a while)
  g3.fillStyle(0x554422, 0.5);
  g3.fillRect(cx + 5, cy + 1, 2, 1);
  g3.generateTexture('deco_rock_3', s, s);
  g3.destroy();
}
