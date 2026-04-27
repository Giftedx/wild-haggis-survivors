/**
 * `deco_heather` — purple heather bush. v4 lift: variation across
 * blooms (mix saturations + sizes so it doesn't read as one gem),
 * leaf detail (tiny needle-like leaves on the stems peeking through
 * the cluster), multi-bloom feel from a small budding sprig off to
 * one side. Purple still dominates silhouette but with floral grain
 * rather than candy.
 */

import * as Phaser from 'phaser';

export function bakeHeather(scene: Phaser.Scene): void {
  const s = 22;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 3;

  // ── Layered ground shadow. ──
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(cx, cy + 6, 16, 3.5);
  g.fillStyle(0x000000, 0.28);
  g.fillEllipse(cx, cy + 5, 12, 2.5);

  // ── Foliage base — narrow dark-green strip in the bottom third. ──
  g.fillStyle(0x1a2810, 1);
  g.fillEllipse(cx, cy + 3, 12, 5);
  g.fillStyle(0x3a5a1e, 1);
  g.fillEllipse(cx, cy + 2, 10, 4);
  // Mid-green leaf nubs
  g.fillStyle(0x5a7028, 1);
  g.fillCircle(cx - 4, cy + 2, 1.5);
  g.fillCircle(cx + 4, cy + 2, 1.5);

  // ── NEEDLE-LIKE LEAVES — fine dark green slivers poking up between
  // the bloom base and the cluster. Heather leaves are scale-like
  // needles and this gives the prop botanical specificity. ──
  g.fillStyle(0x2a4818, 1);
  g.fillRect(cx - 5, cy - 1, 0.5, 2.5);
  g.fillRect(cx - 2.5, cy - 1.5, 0.5, 2.5);
  g.fillRect(cx + 0.5, cy - 1, 0.5, 2.5);
  g.fillRect(cx + 3, cy - 1.5, 0.5, 2.5);
  g.fillRect(cx + 5, cy - 0.5, 0.5, 2);
  // Leaf highlights (catches a hint of light)
  g.fillStyle(0x6a8a32, 1);
  g.fillRect(cx - 5, cy - 1, 0.3, 1);
  g.fillRect(cx + 0.5, cy - 1, 0.3, 1);
  g.fillRect(cx + 3, cy - 1.5, 0.3, 1);

  // ── BLOOM CLUSTER — five overlapping bloom-heads with VARIED
  // sizes and slightly varied hues so it reads as many flowers, not
  // one gem. ──
  // Shadow layer
  g.fillStyle(0x3a1448, 1);
  g.fillCircle(cx - 4, cy - 2, 4);
  g.fillCircle(cx - 1, cy - 5, 4.5);
  g.fillCircle(cx + 3, cy - 3, 4);
  g.fillCircle(cx + 1, cy + 1, 4);
  g.fillCircle(cx - 3, cy + 1, 3.5);

  // Body layer — three of the five blooms get a slightly redder
  // purple to imply some are more open than others
  g.fillStyle(0x6a2884, 1);
  g.fillCircle(cx - 4, cy - 2, 3.2);
  g.fillCircle(cx - 1, cy - 5, 3.8);
  g.fillStyle(0x782a90, 1);  // slightly brighter (more open bloom)
  g.fillCircle(cx + 3, cy - 3, 3.2);
  g.fillStyle(0x5a2074, 1);  // slightly bluer (less open bloom)
  g.fillCircle(cx + 1, cy + 1, 3.2);
  g.fillStyle(0x6a2884, 1);
  g.fillCircle(cx - 3, cy + 1, 2.8);

  // Mid-tone bloom highlights — varied per bloom for grain
  g.fillStyle(0x9a3eba, 1);
  g.fillCircle(cx - 4, cy - 3, 2.2);
  g.fillCircle(cx - 1, cy - 6, 2.6);
  g.fillStyle(0xb04edd, 1);  // brightest highlight on the open bloom
  g.fillCircle(cx + 3, cy - 4, 2.2);

  // Bright lavender top highlights
  g.fillStyle(0xcc78dd, 1);
  g.fillCircle(cx - 4, cy - 4, 1.2);
  g.fillCircle(cx - 1, cy - 7, 1.4);
  g.fillCircle(cx + 3, cy - 5, 1.2);

  // ── Magenta apex tip-bloom (signature eye-catcher). ──
  g.fillStyle(0xff88dd, 1);
  g.fillCircle(cx - 1, cy - 8, 1.2);
  g.fillStyle(0xffccee, 1);
  g.fillCircle(cx - 1, cy - 8, 0.6);

  // ── BUDDING SPRIG — a wee secondary stalk to the right, with two
  // tiny tight buds. Reads as "this plant is multi-bloom, not a
  // single gem". ──
  g.fillStyle(0x2a4818, 1);
  g.fillRect(cx + 5.5, cy - 4, 0.6, 4);
  g.fillStyle(0x5a2074, 1);
  g.fillCircle(cx + 5.7, cy - 4.5, 1);
  g.fillCircle(cx + 5.2, cy - 5.8, 0.8);
  g.fillStyle(0x9a3eba, 0.9);
  g.fillCircle(cx + 5.7, cy - 4.7, 0.5);
  g.fillCircle(cx + 5.2, cy - 5.9, 0.4);

  // ── Tiny bloom sub-dot speckles — many-small-flowers grain. ──
  g.fillStyle(0x4a1858, 0.9);
  g.fillCircle(cx - 5, cy - 1, 0.5);
  g.fillCircle(cx - 2, cy - 3, 0.5);
  g.fillCircle(cx + 1, cy - 4, 0.5);
  g.fillCircle(cx + 4, cy - 2, 0.5);
  g.fillCircle(cx + 2, cy, 0.5);
  g.fillCircle(cx - 3, cy, 0.5);

  g.generateTexture('deco_heather', s, s);
  g.destroy();
}
