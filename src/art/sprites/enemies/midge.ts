/**
 * `midge` — lone highland midge. Design pivot: old sprite drew
 * the midge FILLING the 32px canvas so it read as "small flying
 * beetle" at gameplay scale, not "tiny biting annoyance". New
 * pitch: the midge is DELIBERATELY TINY inside the canvas, with a
 * BIG MOTION BLUR HALO around it so "tiny thing moving fast" is
 * the silhouette, and a PROBOSCIS POINTING DOWN FORWARD as the
 * unmistakable biting-midge pose. Red compound eyes dominate the
 * tiny body so the visual anchor survives at 1×.
 */

import * as Phaser from 'phaser';

export function bakeMidge(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── Motion-blur halo — shrunk 30% so the body reads as the
  // sprite, not a mote inside a haze. ──
  g.fillStyle(0x3a3348, 0.22);
  g.fillCircle(cx, cy, 9);
  g.fillStyle(0x5a5068, 0.16);
  g.fillCircle(cx, cy, 7);

  // ── TRANSLUCENT WINGS — two crossed wing-smears so the tiny
  // body reads as an insect, not a round mote. ──
  g.fillStyle(0x8aa4bc, 0.28);
  g.fillEllipse(cx - 6, cy - 3, 12, 4);
  g.fillEllipse(cx + 6, cy - 3, 12, 4);
  g.fillEllipse(cx - 4, cy - 5, 8, 3);
  g.fillEllipse(cx + 4, cy - 5, 8, 3);
  g.fillStyle(0xffffff, 0.6);
  g.fillEllipse(cx - 5, cy - 3, 7, 2.5);
  g.fillEllipse(cx + 5, cy - 3, 7, 2.5);
  // Wing leading-edge flicker lines.
  g.fillStyle(0xcfe4f2, 0.85);
  g.fillRect(cx - 9, cy - 3, 6, 0.5);
  g.fillRect(cx + 3, cy - 3, 6, 0.5);
  // Pale wing veins: two diagonals per side turn the wing-smears into
  // insect anatomy without making the tiny sprite feel heavy.
  g.lineStyle(0.55, 0xe8f6ff, 0.7);
  g.lineBetween(cx - 8.5, cy - 3.5, cx - 3.5, cy - 1.8);
  g.lineBetween(cx - 7.5, cy - 2.2, cx - 2.8, cy - 3.8);
  g.lineBetween(cx + 3.5, cy - 1.8, cx + 8.5, cy - 3.5);
  g.lineBetween(cx + 2.8, cy - 3.8, cx + 7.5, cy - 2.2);

  // ── TINY MIDGE BODY — slightly larger silhouette so it reads at
  // 1× without losing the "tiny biting annoyance" feel. ──
  g.fillStyle(0x05050c, 1);
  g.fillEllipse(cx, cy + 1, 9.5, 6);
  g.fillStyle(0x2a1824, 1);
  g.fillEllipse(cx, cy, 7.5, 4.6);
  // Bronze abdomen catch-light gives the tiny black body an actual
  // volume read on dark moor tiles.
  g.fillStyle(0x6a4a30, 0.68);
  g.fillEllipse(cx - 1.4, cy - 0.4, 3.8, 1.6);
  // Abdomen segmented stripes — bumped contrast so segments survive.
  g.fillStyle(0x0a0a14, 1);
  g.fillRect(cx - 2.5, cy + 0.5, 5, 0.5);
  g.fillRect(cx - 2.5, cy + 1.7, 5, 0.5);

  // ── LARGER RED COMPOUND EYES — dominating the tiny head. This
  // is the signature "I'm biting you" face. ──
  g.fillStyle(0x8a0018, 1);
  g.fillCircle(cx - 2.0, cy - 1.6, 1.9);
  g.fillCircle(cx + 2.0, cy - 1.6, 1.9);
  g.fillStyle(0xff385f, 1);
  g.fillCircle(cx - 2.0, cy - 1.6, 1.2);
  g.fillCircle(cx + 2.0, cy - 1.6, 1.2);
  // Eye highlight pinpricks
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 2.4, cy - 2.1, 0.45);
  g.fillCircle(cx + 1.6, cy - 2.1, 0.45);

  // Antennae, kept hair-thin so they read as posture rather than clutter.
  g.lineStyle(0.6, 0x0a0006, 0.95);
  g.lineBetween(cx - 2.2, cy - 3.1, cx - 5.4, cy - 6.3);
  g.lineBetween(cx + 2.2, cy - 3.1, cx + 5.4, cy - 6.3);
  g.fillStyle(0xff7788, 0.85);
  g.fillCircle(cx - 5.4, cy - 6.3, 0.45);
  g.fillCircle(cx + 5.4, cy - 6.3, 0.45);

  // ── SIX-LEG MICRO-STROKES — visible thin lines angling away
  // from the body so the silhouette reads "insect" at 1×. ──
  g.lineStyle(0.6, 0x0a0006, 1);
  g.lineBetween(cx - 3.5, cy + 0.5, cx - 6.5, cy - 0.5);
  g.lineBetween(cx - 3.5, cy + 1.5, cx - 6.0, cy + 2.5);
  g.lineBetween(cx - 3.0, cy + 2.5, cx - 4.5, cy + 4.5);
  g.lineBetween(cx + 3.5, cy + 0.5, cx + 6.5, cy - 0.5);
  g.lineBetween(cx + 3.5, cy + 1.5, cx + 6.0, cy + 2.5);
  g.lineBetween(cx + 3.0, cy + 2.5, cx + 4.5, cy + 4.5);

  // ── PROBOSCIS — sharp needle pointing DOWN FORWARD, the
  // unmistakable biting-midge tell. ──
  g.lineStyle(1.4, 0x0a0006, 1);
  g.lineBetween(cx + 0.4, cy + 2.5, cx + 3.8, cy + 6.5);
  g.fillStyle(0x0a0006, 1);
  g.fillTriangle(cx + 3.3, cy + 6.5, cx + 4.5, cy + 6.6, cx + 3.9, cy + 7.7);

  // ── BRIGHTER PROBOSCIS-TIP FLASH — "bite incoming" punctuation
  // bumped to a hot pinprick that reads from any background. ──
  g.fillStyle(0xff2244, 0.65);
  g.fillCircle(cx + 4.1, cy + 7.7, 1.6);
  g.fillStyle(0xff7788, 1);
  g.fillCircle(cx + 4.1, cy + 7.7, 1.0);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx + 4.1, cy + 7.7, 0.5);

  // Tiny trailing bite sparks make its motion visible during fast swarms.
  g.fillStyle(0xffccd8, 0.55);
  g.fillCircle(cx - 8.5, cy + 4.5, 0.75);
  g.fillCircle(cx - 10.5, cy + 2.5, 0.45);

  g.generateTexture('midge', s, s);
  g.destroy();
}
