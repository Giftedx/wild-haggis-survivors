/**
 * `haar_wraith` — cold-coast sea-fog spirit. Design pivot (v2): old
 * sprite had a dominant ghost head/torso with fog bands as secondary
 * decoration — read as "generic ghost with fog feet" rather than
 * "the haar itself". New pitch: FOG IS THE THING. Massive horizontal
 * wind streaks stretch past the sprite edge on both sides; dense
 * core fog bands form the silhouette. The ghostly figure is barely-
 * there emergence from the mist, with only the cyan eye pinpricks
 * staying sharp (kill-target anchor). Reads "horizontal cold drift"
 * first, "something in it" second.
 */

import Phaser from 'phaser';

export function bakeHaarWraith(scene: Phaser.Scene): void {
  const s = 44;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // ── AMBIENT COLD HAAR — wide teal halo so the sprite edge is
  // all mist, never a clean line. ──
  g.fillStyle(0xa8c0c4, 0.15);
  g.fillCircle(cx, cy, 23);
  g.fillStyle(0xa8c0c4, 0.1);
  g.fillEllipse(cx, cy + 4, 40, 22);

  // ── MASSIVE HORIZONTAL WIND STREAKS — the primary silhouette.
  // Full-width drift bands reaching past the sprite edge on both
  // sides. The haar IS the horizontal movement. ──
  g.fillStyle(0xc0d8dc, 0.55);
  g.fillRect(2, cy - 4, 40, 1.2);
  g.fillRect(0, cy - 1, 44, 1.4);
  g.fillStyle(0xd4e4e6, 0.7);
  g.fillRect(2, cy + 2, 40, 1.5);
  g.fillRect(0, cy + 5, 44, 1.3);
  g.fillStyle(0xb0c4c8, 0.55);
  g.fillRect(2, cy + 8, 40, 1.2);
  g.fillRect(0, cy + 11, 44, 1.0);

  // ── CORE FOG BANDS — dense horizontal ellipses at the centre.
  // The THING. ──
  g.fillStyle(0x7a9ca0, 0.75);
  g.fillEllipse(cx, cy + 2, 32, 5);
  g.fillStyle(0x8aaab0, 0.8);
  g.fillEllipse(cx - 1, cy - 1, 30, 5);
  g.fillStyle(0x9abaBe, 0.7);
  g.fillEllipse(cx + 2, cy - 4, 28, 4);

  // ── GHOST TORSO — barely there. Emerging from the fog, not
  // sitting on top of it. Low alpha so fog dominates. ──
  g.fillStyle(0x4a5a60, 0.45);
  g.fillEllipse(cx, cy - 2, 10, 8);
  g.fillStyle(0x6a7c80, 0.55);
  g.fillEllipse(cx, cy - 3, 8, 6);

  // ── HEAD — slightly stronger so kill-target reads, but still
  // softer than before. Teal-grey, skeletal. ──
  g.fillStyle(0x1a2a30, 0.6);
  g.fillEllipse(cx, cy - 9, 8, 9);
  g.fillStyle(0x3a5058, 0.72);
  g.fillEllipse(cx, cy - 10, 6, 7);
  // Gaunt cheek hollows
  g.fillStyle(0x1a2a30, 0.5);
  g.fillEllipse(cx - 2.5, cy - 7, 1.8, 2.5);
  g.fillEllipse(cx + 2.5, cy - 7, 1.8, 2.5);

  // ── EYES — the ONLY sharp thing. Cyan pinpricks like distant
  // harbour lights through fog. Bright so kill-target is readable. ──
  g.fillStyle(0x88e8f0, 0.45);
  g.fillCircle(cx - 2, cy - 10, 2);
  g.fillCircle(cx + 2, cy - 10, 2);
  g.fillStyle(0xc8f8ff, 1);
  g.fillCircle(cx - 2, cy - 10, 1);
  g.fillCircle(cx + 2, cy - 10, 1);
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(cx - 2, cy - 10.3, 0.4);
  g.fillCircle(cx + 2, cy - 10.3, 0.4);

  // ── Hollow slit mouth — faint. ──
  g.fillStyle(0x0a1014, 0.65);
  g.fillRect(cx - 1.5, cy - 7, 3, 0.8);

  // ── Upper rising tufts — mist wisps above the head so the
  // silhouette fades upward into haze. ──
  g.fillStyle(0xd0e4e8, 0.55);
  g.fillCircle(cx - 3, cy - 16, 1.3);
  g.fillCircle(cx + 3, cy - 17, 1.1);
  g.fillStyle(0xd0e4e8, 0.3);
  g.fillCircle(cx, cy - 19, 0.8);

  // ── Trailing edge-wisps extending beyond sprite bounds — fog
  // pours sideways off the canvas. ──
  g.fillStyle(0xeaf4f5, 0.4);
  g.fillRect(0, cy + 3, 10, 0.8);
  g.fillRect(34, cy + 3, 10, 0.8);
  g.fillStyle(0xeaf4f5, 0.3);
  g.fillRect(0, cy - 2, 8, 0.6);
  g.fillRect(36, cy - 2, 8, 0.6);

  g.generateTexture('haar_wraith', s, s);
  g.destroy();
}

/**
 * Gale Wraith — DESIGN_IDEAS section 3 Weather #2. Billowing wind
 * form with visible sweep arcs. Visual reads "gust of wind" so the
 * shove-on-contact feels earned. Contrast to haar_wraith's pale
 * stillness — gale_wraith is all motion lines.
 */
