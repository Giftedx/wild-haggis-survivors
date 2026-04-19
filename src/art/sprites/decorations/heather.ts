/**
 * `deco_heather` — purple heather bush for moor dressing. Design
 * pivot (v3): the "3 spike stems + bee" version still collapsed
 * at 22px — individual 1px blossoms merged into mulch and the
 * yellow bee dot fought the purple mass for attention. New pitch:
 * one BIG DENSE PURPLE BLOOM CLUSTER filling the upper 2/3 of the
 * canvas made from 5 overlapping round bloom-heads. Narrow dark
 * green foliage base only in the bottom third. Bright magenta tip
 * as the single eye-catcher. Purple IS the silhouette at gameplay
 * scale.
 */

import Phaser from 'phaser';

export function bakeHeather(scene: Phaser.Scene): void {
  const s = 22;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 3;

  // ── Ground shadow. ──
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, cy + 5, 14, 3);

  // ── Foliage base — narrow dark-green strip in the bottom third
  // only. Deliberately smaller than before so purple can dominate. ──
  g.fillStyle(0x1a2810, 1);
  g.fillEllipse(cx, cy + 3, 12, 5);
  g.fillStyle(0x3a5a1e, 1);
  g.fillEllipse(cx, cy + 2, 10, 4);
  // Tiny mid-green leaf nubs
  g.fillStyle(0x5a7028, 1);
  g.fillCircle(cx - 4, cy + 2, 1.5);
  g.fillCircle(cx + 4, cy + 2, 1.5);

  // ── BLOOM CLUSTER — five overlapping purple bloom-heads forming
  // a chunky mass. Back shadow first, then body, then highlight tips. ──
  // Shadow layer (dark plum)
  g.fillStyle(0x3a1448, 1);
  g.fillCircle(cx - 4, cy - 2, 4);
  g.fillCircle(cx - 1, cy - 5, 4.5);
  g.fillCircle(cx + 3, cy - 3, 4);
  g.fillCircle(cx + 1, cy + 1, 4);
  g.fillCircle(cx - 3, cy + 1, 3.5);

  // Body layer (rich purple — the dominant silhouette colour)
  g.fillStyle(0x6a2884, 1);
  g.fillCircle(cx - 4, cy - 2, 3.2);
  g.fillCircle(cx - 1, cy - 5, 3.8);
  g.fillCircle(cx + 3, cy - 3, 3.2);
  g.fillCircle(cx + 1, cy + 1, 3.2);
  g.fillCircle(cx - 3, cy + 1, 2.8);

  // Mid-tone bloom highlights (upper half only — light catches top)
  g.fillStyle(0x9a3eba, 1);
  g.fillCircle(cx - 4, cy - 3, 2.2);
  g.fillCircle(cx - 1, cy - 6, 2.6);
  g.fillCircle(cx + 3, cy - 4, 2.2);

  // Bright lavender top highlights — catches sun
  g.fillStyle(0xcc78dd, 1);
  g.fillCircle(cx - 4, cy - 4, 1.2);
  g.fillCircle(cx - 1, cy - 7, 1.4);
  g.fillCircle(cx + 3, cy - 5, 1.2);

  // ── Bright magenta eye-catcher tip-bloom — single brightest
  // dot at the apex. Draws attention without clutter. ──
  g.fillStyle(0xff88dd, 1);
  g.fillCircle(cx - 1, cy - 8, 1.2);
  g.fillStyle(0xffccee, 1);
  g.fillCircle(cx - 1, cy - 8, 0.6);

  // ── Tiny bloom sub-dot speckles across the cluster — adds the
  // "many small flowers" flavour without drawing each one. ──
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
