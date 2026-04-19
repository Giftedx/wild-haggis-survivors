/**
 * `deco_rock` / `deco_rock_2` / `deco_rock_3` — three rock variants for
 * environmental dressing on the moor. One function bakes all three so
 * the scattered-rock prop system can pick a variant per instance.
 *
 *  - variant 1: wide flat rock with lichen and horizontal crack (9/10 — leave alone).
 *  - variant 2 (v2 pivot): taller round boulder with a BIG chunky moss patch
 *    on one side. Old version had scattered moss dots + quartz vein + diagonal
 *    crack fighting for attention at 24px; new one strips to 3-tone boulder
 *    shading + one dominant moss patch.
 *  - variant 3 (v2 pivot): pebble cluster with a TINY fallen cone. Old version
 *    had the cone visually equal-weight to the pebbles, inverting intent; new
 *    one shows 3 chunky boulder-pebbles in a triangle stack with a wee cone
 *    (<4px) at the base as a "spot it" joke.
 */

import Phaser from 'phaser';

export function bakeRocks(scene: Phaser.Scene): void {
  const s = 24;
  const cx = s / 2, cy = s / 2 + 2;

  // ── Variant 1 — unchanged (9/10: wide flat rock with lichen and
  // horizontal crack). ──
  const g1 = scene.add.graphics();
  g1.fillStyle(0x000000, 0.12);
  g1.fillEllipse(cx, cy + 4, 18, 5);
  g1.fillStyle(0x282838, 1);
  g1.fillEllipse(cx, cy, 18, 11);
  g1.fillStyle(0x4a4a58, 1);
  g1.fillEllipse(cx, cy, 17, 10);
  g1.fillStyle(0x6a6a78, 1);
  g1.fillEllipse(cx - 1, cy - 1, 14, 7);
  g1.fillStyle(0x8a8a96, 0.7);
  g1.fillEllipse(cx - 3, cy - 2, 8, 4);
  g1.fillStyle(0x282838, 1);
  g1.fillRect(cx - 2, cy - 1, 5, 1);
  g1.fillRect(cx + 2, cy, 2, 1);
  g1.fillRect(cx - 5, cy + 1, 3, 1);
  g1.fillStyle(0x88a844, 0.7);
  g1.fillCircle(cx + 4, cy - 2, 2);
  g1.fillStyle(0x99bb55, 0.6);
  g1.fillCircle(cx + 4, cy - 2, 1.2);
  g1.fillStyle(0x77994a, 0.5);
  g1.fillCircle(cx - 5, cy + 1, 1.5);
  g1.fillStyle(0xffffff, 0.5);
  g1.fillRect(cx - 4, cy - 3, 1, 1);
  g1.generateTexture('deco_rock', s, s);
  g1.destroy();

  // ── Variant 2 (rebuilt) — round moss boulder, 3-tone shading +
  // one bold moss patch on the shaded side. No quartz vein, no
  // diagonal crack. The boulder silhouette is the anchor. ──
  const g2 = scene.add.graphics();
  g2.fillStyle(0x000000, 0.15);
  g2.fillEllipse(cx, cy + 5, 15, 4);
  // Dark stone outline (clean circle — NOT ellipse)
  g2.fillStyle(0x1a1a26, 1);
  g2.fillCircle(cx, cy, 8);
  // Mid stone body
  g2.fillStyle(0x3a3a4c, 1);
  g2.fillCircle(cx, cy, 7);
  // Upper-left dome highlight — large and smooth so the round shape
  // reads at 24px without detail clutter
  g2.fillStyle(0x5a5a6c, 1);
  g2.fillCircle(cx - 1.5, cy - 1.5, 5);
  // Bright dome catch-light
  g2.fillStyle(0x7a7a88, 1);
  g2.fillCircle(cx - 2.5, cy - 2.5, 2.8);
  // Brightest specular on top-left
  g2.fillStyle(0x9a9aa8, 0.85);
  g2.fillCircle(cx - 3, cy - 3, 1.3);

  // MOSS PATCH — one chunky green blob on the right-lower quadrant.
  // Big, dominant, unmistakable as "moss" at 24px.
  g2.fillStyle(0x1a4a1a, 1);
  g2.fillEllipse(cx + 3, cy + 2, 6, 4);
  g2.fillStyle(0x2a6a28, 1);
  g2.fillEllipse(cx + 3, cy + 2, 5, 3);
  g2.fillStyle(0x4a8c38, 1);
  g2.fillEllipse(cx + 3, cy + 1.5, 3.5, 2);
  // Bright moss-top flecks — fuzzy texture
  g2.fillStyle(0x6aac48, 1);
  g2.fillCircle(cx + 2, cy + 1, 0.8);
  g2.fillCircle(cx + 4, cy + 1.5, 0.7);
  g2.fillCircle(cx + 3.5, cy + 2.5, 0.6);
  // A few moss sprigs poking up off the top edge of the patch
  g2.fillStyle(0x4a8c38, 1);
  g2.fillRect(cx + 2, cy - 0.5, 0.5, 1);
  g2.fillRect(cx + 4, cy - 0.5, 0.5, 1);

  g2.generateTexture('deco_rock_2', s, s);
  g2.destroy();

  // ── Variant 3 (rebuilt) — pebble cluster. 3 chunky rocks stacked
  // as a triangle silhouette. Wee traffic cone shrunk to <4px at
  // the base as a "spot it" Easter egg. Rock mass dominates. ──
  const g3 = scene.add.graphics();
  g3.fillStyle(0x000000, 0.15);
  g3.fillEllipse(cx, cy + 4, 18, 4);

  // Back-left chunky pebble (biggest, base of triangle)
  g3.fillStyle(0x1a1a26, 1);
  g3.fillEllipse(cx - 4, cy + 1, 10, 8);
  g3.fillStyle(0x3a3a4c, 1);
  g3.fillEllipse(cx - 4, cy + 0.5, 9, 7);
  g3.fillStyle(0x5a5a6c, 1);
  g3.fillEllipse(cx - 5, cy - 0.5, 6, 4);
  g3.fillStyle(0x7a7a88, 0.8);
  g3.fillEllipse(cx - 6, cy - 1.5, 3, 1.8);
  // Lichen fleck
  g3.fillStyle(0x88a844, 0.7);
  g3.fillCircle(cx - 6, cy + 2, 1.2);
  g3.fillStyle(0x99bb55, 0.7);
  g3.fillCircle(cx - 6, cy + 2, 0.6);

  // Back-right chunky pebble
  g3.fillStyle(0x1a1a26, 1);
  g3.fillEllipse(cx + 4, cy + 2, 8, 7);
  g3.fillStyle(0x3a3a4c, 1);
  g3.fillEllipse(cx + 4, cy + 1.5, 7, 6);
  g3.fillStyle(0x5a5a6c, 1);
  g3.fillEllipse(cx + 3, cy + 0.5, 5, 3);
  g3.fillStyle(0x7a7a88, 0.8);
  g3.fillEllipse(cx + 2.5, cy - 0.5, 2.5, 1.5);

  // TOP capstone pebble — balanced on top of the others, completing
  // the triangle silhouette
  g3.fillStyle(0x1a1a26, 1);
  g3.fillEllipse(cx, cy - 4, 7, 5);
  g3.fillStyle(0x3a3a4c, 1);
  g3.fillEllipse(cx, cy - 4.5, 6, 4);
  g3.fillStyle(0x5a5a6c, 1);
  g3.fillEllipse(cx - 1, cy - 5, 4, 2.5);
  g3.fillStyle(0x7a7a88, 0.9);
  g3.fillEllipse(cx - 1.5, cy - 5.5, 2, 1.2);

  // WEE fallen cone at the base, right side — tiny so the rock
  // cluster dominates. 3px wide max.
  g3.fillStyle(0x882200, 1);
  g3.fillTriangle(cx + 7, cy + 3, cx + 9, cy + 4, cx + 6, cy + 4);
  g3.fillStyle(0xff6600, 1);
  g3.fillTriangle(cx + 7, cy + 3.2, cx + 8.5, cy + 4, cx + 6.2, cy + 4);
  g3.fillStyle(0xffffff, 0.8);
  g3.fillRect(cx + 6.5, cy + 3.7, 1.3, 0.4);

  g3.generateTexture('deco_rock_3', s, s);
  g3.destroy();
}
