/**
 * `haar_wraith` — cold-coast mist spirit with tendril fingers and a bottom that dissolves into fog. Early weather-family member.
 */

import Phaser from 'phaser';

export function bakeHaarWraith(scene: Phaser.Scene): void {
  const s = 44;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // Ambient haar — broad low-contrast halo.
  g.fillStyle(0xc8d0dc, 0.12);
  g.fillCircle(cx, cy, 18);
  g.fillStyle(0xc8d0dc, 0.08);
  g.fillCircle(cx, cy, 22);

  // Mist tendrils spiralling outward.
  g.fillStyle(0xb8c0cc, 0.35);
  g.fillEllipse(cx - 12, cy + 2, 8, 3);
  g.fillEllipse(cx + 12, cy - 2, 8, 3);
  g.fillEllipse(cx, cy + 12, 10, 3);
  g.fillEllipse(cx - 4, cy - 10, 6, 2);

  // Body — soft humanoid torso.
  g.fillStyle(0x6a7685, 0.55);
  g.fillEllipse(cx, cy + 4, 12, 14);
  g.fillStyle(0x8a95a5, 0.6);
  g.fillEllipse(cx, cy + 3, 10, 12);
  // Fade to nothing at the bottom — dissolving into mist.
  g.fillStyle(0xc8d0dc, 0.3);
  g.fillEllipse(cx, cy + 10, 14, 5);
  g.fillStyle(0xc8d0dc, 0.15);
  g.fillEllipse(cx, cy + 14, 18, 4);

  // Head — high-contrast against the mist so kill-target is readable.
  g.fillStyle(0x2a3340, 0.8);
  g.fillEllipse(cx, cy - 6, 9, 10);
  g.fillStyle(0x454f5c, 0.85);
  g.fillEllipse(cx, cy - 7, 7, 8);

  // Eyes — pale pinpricks (haar-light glow).
  g.fillStyle(0xe0e8f2, 1);
  g.fillCircle(cx - 2, cy - 7, 1);
  g.fillCircle(cx + 2, cy - 7, 1);

  // Mouth — hollow slit.
  g.fillStyle(0x0a1018, 0.9);
  g.fillRect(cx - 1, cy - 4, 3, 1);

  // Drift arms — hinted, translucent.
  g.fillStyle(0x6a7685, 0.4);
  g.fillEllipse(cx - 9, cy + 2, 4, 8);
  g.fillEllipse(cx + 9, cy + 2, 4, 8);

  // Top wisps — rising.
  g.fillStyle(0xd8e0ea, 0.5);
  g.fillCircle(cx - 2, cy - 13, 1.2);
  g.fillCircle(cx + 3, cy - 14, 1);

  g.generateTexture('haar_wraith', s, s);
  g.destroy();
}

/**
 * Gale Wraith — DESIGN_IDEAS section 3 Weather #2. Billowing wind
 * form with visible sweep arcs. Visual reads "gust of wind" so the
 * shove-on-contact feels earned. Contrast to haar_wraith's pale
 * stillness — gale_wraith is all motion lines.
 */
