/**
 * `haar_wraith` — cold-coast sea-fog spirit. Design pivot: horizontal
 * fog bands dominate the silhouette, with a humanoid head/shoulders
 * emerging from the top and the bottom dissolving into a stack of
 * mist layers. Palette shifts to cold teal-grey (NOT pure grey) to
 * read as "coastal haar" rather than "generic ghost". Eyes glow
 * pale-cyan like distant harbour lights through fog.
 */

import Phaser from 'phaser';

export function bakeHaarWraith(scene: Phaser.Scene): void {
  const s = 44;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // ── Ambient haar — broad cold-teal halo, low contrast. ──
  g.fillStyle(0xa8c0c4, 0.14);
  g.fillCircle(cx, cy, 21);
  g.fillStyle(0xa8c0c4, 0.08);
  g.fillCircle(cx, cy, 25);

  // ── Horizontal fog bands at the bottom — the signature haar
  // silhouette. Five stacked wide ellipses of diminishing alpha,
  // the wraith "dissolves into sideways drift" rather than fading
  // straight down. Cold teal-grey palette. ──
  g.fillStyle(0xb0c8cc, 0.35);
  g.fillEllipse(cx, cy + 14, 22, 3);
  g.fillStyle(0xc0d8dc, 0.45);
  g.fillEllipse(cx - 2, cy + 11, 20, 3);
  g.fillStyle(0x9ab4b8, 0.55);
  g.fillEllipse(cx + 1, cy + 8, 18, 3);
  g.fillStyle(0x8aa8ac, 0.65);
  g.fillEllipse(cx - 1, cy + 5, 16, 3);
  g.fillStyle(0x7a9ca0, 0.75);
  g.fillEllipse(cx, cy + 2, 14, 4);

  // ── Wind-drifted tendrils on both sides — long horizontal wisps
  // reaching out like cold fingers of fog. ──
  g.fillStyle(0xc0d8dc, 0.4);
  g.fillRect(cx - 18, cy + 6, 8, 1.5);
  g.fillRect(cx - 16, cy + 10, 6, 1);
  g.fillRect(cx + 10, cy + 7, 8, 1.5);
  g.fillRect(cx + 11, cy + 11, 5, 1);

  // ── Torso — cold teal-grey, dense at the shoulders and fading
  // into the fog bands below. ──
  g.fillStyle(0x4a5a60, 0.75);
  g.fillEllipse(cx, cy - 1, 11, 10);
  g.fillStyle(0x6a7c80, 0.85);
  g.fillEllipse(cx, cy - 2, 9, 8);

  // ── Head — high-contrast against the mist so the kill-target
  // is readable. Pale, skull-like, cold teal tint. ──
  g.fillStyle(0x1a2a30, 0.9);
  g.fillEllipse(cx, cy - 8, 9, 10);
  g.fillStyle(0x3a5058, 0.92);
  g.fillEllipse(cx, cy - 9, 7, 8);
  // Gaunt cheek hollows
  g.fillStyle(0x1a2a30, 0.5);
  g.fillEllipse(cx - 2.5, cy - 6, 2, 3);
  g.fillEllipse(cx + 2.5, cy - 6, 2, 3);

  // ── Eyes — cold pale-cyan pinpricks like harbour lights seen
  // through fog. Slight glow halo. ──
  g.fillStyle(0x88e8f0, 0.4);
  g.fillCircle(cx - 2, cy - 9, 1.8);
  g.fillCircle(cx + 2, cy - 9, 1.8);
  g.fillStyle(0xc8f8ff, 1);
  g.fillCircle(cx - 2, cy - 9, 1);
  g.fillCircle(cx + 2, cy - 9, 1);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - 2, cy - 9.3, 0.4);
  g.fillCircle(cx + 2, cy - 9.3, 0.4);

  // ── Hollow slit mouth. ──
  g.fillStyle(0x0a1014, 0.95);
  g.fillRect(cx - 1.5, cy - 6, 3, 1);

  // ── Top wisps — rising mist tufts above the head so the
  // silhouette doesn't end in a hard line. ──
  g.fillStyle(0xd0e4e8, 0.55);
  g.fillCircle(cx - 3, cy - 15, 1.3);
  g.fillCircle(cx + 3, cy - 16, 1.1);
  g.fillStyle(0xd0e4e8, 0.3);
  g.fillCircle(cx, cy - 18, 0.8);

  g.generateTexture('haar_wraith', s, s);
  g.destroy();
}

/**
 * Gale Wraith — DESIGN_IDEAS section 3 Weather #2. Billowing wind
 * form with visible sweep arcs. Visual reads "gust of wind" so the
 * shove-on-contact feels earned. Contrast to haar_wraith's pale
 * stillness — gale_wraith is all motion lines.
 */
