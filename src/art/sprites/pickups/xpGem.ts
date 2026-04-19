/**
 * `xp_gem` — golden diamond with 4 distinct facets + bright centre fire +
 * sparkle highlights. Players collect hundreds of these so the readable
 * pop against the green moor + the satisfying sparkle matter every frame.
 */

import Phaser from 'phaser';

export function bakeXpGem(scene: Phaser.Scene): void {
  // 20×20 — golden XP gem, diamond shape with 4 distinct facets,
  // bright centre fire, sparkle highlights.
  const s = 20;
  const g = scene.add.graphics();
  const cx = 10, cy = 10;

  // Outer glow (subtle, makes gems pop against the green moor)
  g.fillStyle(0xd4a017, 0.15);
  g.fillCircle(cx, cy, 9);

  // Dark outline — solid 1px border for pixel crispness
  g.fillStyle(0x4a3000, 1);
  g.fillTriangle(cx, cy - 8, cx - 7, cy, cx + 7, cy);
  g.fillTriangle(cx, cy + 8, cx - 7, cy, cx + 7, cy);

  // ── Four facets with distinct shading ──
  // Top-left facet (brightest — light hits here)
  g.fillStyle(0xe8c030, 1);
  g.fillTriangle(cx, cy - 7, cx - 6, cy, cx, cy);
  // Top-right facet (medium bright)
  g.fillStyle(0xd4a017, 1);
  g.fillTriangle(cx, cy - 7, cx + 6, cy, cx, cy);
  // Bottom-left facet (medium dark)
  g.fillStyle(0xb88a12, 1);
  g.fillTriangle(cx, cy + 7, cx - 6, cy, cx, cy);
  // Bottom-right facet (darkest — shadow side)
  g.fillStyle(0x8a6608, 1);
  g.fillTriangle(cx, cy + 7, cx + 6, cy, cx, cy);

  // Centre horizontal fire band
  g.fillStyle(0xffee77, 1);
  g.fillRect(cx - 4, cy - 1, 8, 2);
  // Centre vertical cross (secondary fire)
  g.fillStyle(0xffdd55, 0.7);
  g.fillRect(cx - 1, cy - 4, 2, 8);

  // Hot specular — upper left facet
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - 2, cy - 3, 1.5);
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(cx - 3, cy - 2, 0.8);

  // Secondary sparkle — lower right
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(cx + 3, cy + 2, 0.7);

  // Tiny point sparkles at the 4 tips
  g.fillStyle(0xffeedd, 0.8);
  g.fillRect(cx - 1, cy - 8, 2, 1);  // top
  g.fillRect(cx - 1, cy + 7, 2, 1);  // bottom
  g.fillRect(cx - 7, cy - 1, 1, 2);  // left
  g.fillRect(cx + 6, cy - 1, 1, 2);  // right

  g.generateTexture('xp_gem', s, s);
  g.destroy();
}
