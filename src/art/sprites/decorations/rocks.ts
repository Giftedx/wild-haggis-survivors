/**
 * `deco_rock` / `deco_rock_2` / `deco_rock_3` — three rock variants for
 * environmental dressing on the moor. One function bakes all three so
 * the scattered-rock prop system can pick a variant per instance.
 *
 *  - variant 1: wide flat rock — asymmetric tilt to break the round
 *    silhouette, lichen splash on the windward shoulder, contact
 *    shadow gusset.
 *  - variant 2: round moss boulder — stronger contact shadow, lichen
 *    crust offsetting the moss patch, asymmetric notch in the dome.
 *  - variant 3: pebble cluster — capstone shifted off-axis, lichen
 *    splash, deeper basal shadow so the rocks read as resting on
 *    ground rather than floating.
 */

import * as Phaser from 'phaser';

export function bakeRocks(scene: Phaser.Scene): void {
  const s = 24;
  const cx = s / 2, cy = s / 2 + 2;

  // ── Variant 1 — wide flat rock with lichen, asymmetric silhouette,
  // and a layered contact shadow. ──
  const g1 = scene.add.graphics();
  // Layered contact shadow — wider darker base + soft outer halo so
  // the rock reads as grounded even on dark moor floor.
  g1.fillStyle(0x000000, 0.18);
  g1.fillEllipse(cx + 1, cy + 5, 22, 4);
  g1.fillStyle(0x000000, 0.28);
  g1.fillEllipse(cx, cy + 4, 18, 3);
  // Dark stone outline — wider on right than left to break symmetry
  g1.fillStyle(0x1a1a26, 1);
  g1.fillEllipse(cx + 0.5, cy, 19, 11);
  // Mid stone — main body, asymmetric (offset left)
  g1.fillStyle(0x4a4a58, 1);
  g1.fillEllipse(cx - 0.5, cy, 17, 10);
  // Upper-left dome highlight (top-light cue)
  g1.fillStyle(0x6a6a78, 1);
  g1.fillEllipse(cx - 2, cy - 1, 13, 6);
  // Bright catch-light specular
  g1.fillStyle(0x8a8a96, 0.75);
  g1.fillEllipse(cx - 3, cy - 2, 7, 3);
  // Asymmetric notch — small dark bite on the right shoulder
  g1.fillStyle(0x282838, 0.85);
  g1.fillEllipse(cx + 6, cy - 1, 4, 2);
  // Horizontal cracks (kept from original — value contrast)
  g1.fillStyle(0x282838, 1);
  g1.fillRect(cx - 2, cy - 1, 5, 1);
  g1.fillRect(cx + 2, cy, 2, 1);
  g1.fillRect(cx - 5, cy + 1, 3, 1);
  // LICHEN SPLASH — crustose patch on the windward (upper-right)
  // shoulder, brighter than original moor moss
  g1.fillStyle(0x8aa040, 0.85);
  g1.fillEllipse(cx + 4, cy - 2, 5, 2.3);
  g1.fillStyle(0xa8c050, 0.75);
  g1.fillEllipse(cx + 4, cy - 2.3, 3.5, 1.5);
  g1.fillStyle(0xc8d878, 0.65);
  g1.fillCircle(cx + 4, cy - 2.5, 1);
  // Secondary lichen fleck on lower-left
  g1.fillStyle(0xc8a040, 0.6);
  g1.fillCircle(cx - 5, cy + 1, 1.5);
  g1.fillStyle(0xe0c068, 0.55);
  g1.fillCircle(cx - 5, cy + 1, 0.8);
  // Bright top-light pixel
  g1.fillStyle(0xffffff, 0.55);
  g1.fillRect(cx - 4, cy - 3, 1, 1);
  g1.generateTexture('deco_rock', s, s);
  g1.destroy();

  // ── Variant 2 — round moss boulder, asymmetric dome with lichen
  // crust + chunky moss patch + grounded contact shadow. ──
  const g2 = scene.add.graphics();
  // Layered contact shadow
  g2.fillStyle(0x000000, 0.18);
  g2.fillEllipse(cx, cy + 6, 18, 4);
  g2.fillStyle(0x000000, 0.3);
  g2.fillEllipse(cx, cy + 5, 14, 3);
  // Dark stone outline (slightly oblong vertical, breaks pure circle)
  g2.fillStyle(0x1a1a26, 1);
  g2.fillEllipse(cx, cy, 16, 17);
  // Mid stone body — offset left for asymmetry
  g2.fillStyle(0x3a3a4c, 1);
  g2.fillEllipse(cx - 0.5, cy, 14, 15);
  // Upper-left dome highlight
  g2.fillStyle(0x5a5a6c, 1);
  g2.fillCircle(cx - 1.5, cy - 1.5, 5);
  // Bright dome catch-light
  g2.fillStyle(0x7a7a88, 1);
  g2.fillCircle(cx - 2.5, cy - 2.5, 2.8);
  // Brightest specular
  g2.fillStyle(0x9a9aa8, 0.85);
  g2.fillCircle(cx - 3, cy - 3, 1.3);
  // Asymmetric chip — small notch on upper-right edge
  g2.fillStyle(0x1a1a26, 0.95);
  g2.fillTriangle(cx + 6, cy - 4, cx + 8, cy - 2, cx + 5, cy - 2);

  // MOSS PATCH — chunky green blob on right-lower quadrant
  g2.fillStyle(0x1a4a1a, 1);
  g2.fillEllipse(cx + 3, cy + 2, 6, 4);
  g2.fillStyle(0x2a6a28, 1);
  g2.fillEllipse(cx + 3, cy + 2, 5, 3);
  g2.fillStyle(0x4a8c38, 1);
  g2.fillEllipse(cx + 3, cy + 1.5, 3.5, 2);
  g2.fillStyle(0x6aac48, 1);
  g2.fillCircle(cx + 2, cy + 1, 0.8);
  g2.fillCircle(cx + 4, cy + 1.5, 0.7);
  g2.fillCircle(cx + 3.5, cy + 2.5, 0.6);
  // Moss sprigs poking up
  g2.fillStyle(0x4a8c38, 1);
  g2.fillRect(cx + 2, cy - 0.5, 0.5, 1);
  g2.fillRect(cx + 4, cy - 0.5, 0.5, 1);

  // LICHEN CRUST — pale crustose splash on the upper-left shoulder,
  // contrasting the moss with a different green-yellow biological cue
  g2.fillStyle(0x9ab048, 0.8);
  g2.fillEllipse(cx - 3, cy - 4, 4, 1.8);
  g2.fillStyle(0xc0d068, 0.7);
  g2.fillEllipse(cx - 3, cy - 4.2, 2.5, 1);
  g2.fillStyle(0xe0e898, 0.55);
  g2.fillCircle(cx - 3, cy - 4.5, 0.7);
  // Tiny secondary lichen dot lower-left
  g2.fillStyle(0xc8a040, 0.65);
  g2.fillCircle(cx - 5, cy + 2, 1);

  g2.generateTexture('deco_rock_2', s, s);
  g2.destroy();

  // ── Variant 3 — pebble cluster, asymmetric capstone + lichen +
  // deeper layered contact shadow so the cluster sits on the ground. ──
  const g3 = scene.add.graphics();
  // Layered contact shadow — wider, deeper than original
  g3.fillStyle(0x000000, 0.2);
  g3.fillEllipse(cx, cy + 5, 22, 5);
  g3.fillStyle(0x000000, 0.32);
  g3.fillEllipse(cx, cy + 4, 18, 3.5);

  // Back-left chunky pebble (biggest)
  g3.fillStyle(0x1a1a26, 1);
  g3.fillEllipse(cx - 4, cy + 1, 10, 8);
  g3.fillStyle(0x3a3a4c, 1);
  g3.fillEllipse(cx - 4, cy + 0.5, 9, 7);
  g3.fillStyle(0x5a5a6c, 1);
  g3.fillEllipse(cx - 5, cy - 0.5, 6, 4);
  g3.fillStyle(0x7a7a88, 0.8);
  g3.fillEllipse(cx - 6, cy - 1.5, 3, 1.8);
  // Lichen splash on the left pebble — bigger than before
  g3.fillStyle(0x8aa040, 0.85);
  g3.fillEllipse(cx - 6, cy + 2, 3.5, 1.8);
  g3.fillStyle(0xa8c050, 0.75);
  g3.fillCircle(cx - 6, cy + 2, 1.2);
  g3.fillStyle(0xc8d878, 0.6);
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
  // Small lichen on right pebble
  g3.fillStyle(0xc8a040, 0.7);
  g3.fillCircle(cx + 6, cy + 2.5, 1);

  // Top capstone — shifted off-axis (right of centre) for asymmetry
  g3.fillStyle(0x1a1a26, 1);
  g3.fillEllipse(cx + 1, cy - 4, 7, 5);
  g3.fillStyle(0x3a3a4c, 1);
  g3.fillEllipse(cx + 1, cy - 4.5, 6, 4);
  g3.fillStyle(0x5a5a6c, 1);
  g3.fillEllipse(cx, cy - 5, 4, 2.5);
  g3.fillStyle(0x7a7a88, 0.9);
  g3.fillEllipse(cx - 0.5, cy - 5.5, 2, 1.2);
  // Top-light specular dot
  g3.fillStyle(0xffffff, 0.55);
  g3.fillRect(cx - 1, cy - 6, 1, 1);

  // Wee fallen cone at the base — kept as the spot-it Easter egg
  g3.fillStyle(0x882200, 1);
  g3.fillTriangle(cx + 7, cy + 3, cx + 9, cy + 4, cx + 6, cy + 4);
  g3.fillStyle(0xff6600, 1);
  g3.fillTriangle(cx + 7, cy + 3.2, cx + 8.5, cy + 4, cx + 6.2, cy + 4);
  g3.fillStyle(0xffffff, 0.8);
  g3.fillRect(cx + 6.5, cy + 3.7, 1.3, 0.4);

  g3.generateTexture('deco_rock_3', s, s);
  g3.destroy();
}
