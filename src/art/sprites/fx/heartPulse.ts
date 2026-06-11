/**
 * `fx_heart_pulse` — pickup-feedback heart spark for health drops.
 * One frame baked at 16×16; gameplay code can scale + alpha-fade for
 * the rising-heart pop. Hearth-palette warm red with cream highlights
 * and a soft pink halo so it pops over any biome.
 */

import * as Phaser from 'phaser';

const HALO_OUTER = 0xff8aa0;
const HALO_INNER = 0xffc0d0;
const HEART_OUTLINE = 0x6a0010;
const HEART_DARK = 0xc01828;
const HEART_MID = 0xee3a4a;
const HEART_HI = 0xff8090;
const SPECULAR = 0xffffff;

export function bakeHeartPulse(scene: Phaser.Scene): void {
  const s = 16;
  const g = scene.add.graphics();
  const cx = s / 2;
  const cy = s / 2 + 0.5;

  // Soft halo — two rings.
  g.fillStyle(HALO_OUTER, 0.22);
  g.fillCircle(cx, cy, 7.4);
  g.fillStyle(HALO_INNER, 0.32);
  g.fillCircle(cx, cy, 5);

  // Heart silhouette — built from two top lobes (circles) + a
  // diamond bottom point. Outline first.
  g.fillStyle(HEART_OUTLINE, 1);
  g.fillCircle(cx - 2.2, cy - 1, 2.6);
  g.fillCircle(cx + 2.2, cy - 1, 2.6);
  g.fillTriangle(cx - 4, cy - 0.4, cx + 4, cy - 0.4, cx, cy + 5.4);

  // Mid-tone fill.
  g.fillStyle(HEART_DARK, 1);
  g.fillCircle(cx - 2.2, cy - 1, 2.0);
  g.fillCircle(cx + 2.2, cy - 1, 2.0);
  g.fillTriangle(cx - 3.2, cy - 0.6, cx + 3.2, cy - 0.6, cx, cy + 4.4);

  // Brighter inner — gives the heart a glow from inside.
  g.fillStyle(HEART_MID, 1);
  g.fillCircle(cx - 1.8, cy - 1.2, 1.4);
  g.fillCircle(cx + 1.8, cy - 1.2, 1.4);
  g.fillTriangle(cx - 2.4, cy - 0.4, cx + 2.4, cy - 0.4, cx, cy + 3.2);

  // Hot highlight on the upper-left lobe.
  g.fillStyle(HEART_HI, 0.95);
  g.fillCircle(cx - 2, cy - 1.6, 0.8);
  g.fillStyle(HEART_HI, 0.7);
  g.fillCircle(cx + 2, cy - 1.6, 0.5);

  // Bright specular pinprick.
  g.fillStyle(SPECULAR, 1);
  g.fillRect(cx - 2.4, cy - 2, 0.7, 0.7);
  g.fillStyle(SPECULAR, 0.8);
  g.fillRect(cx + 1.4, cy - 2, 0.5, 0.5);

  // Tiny sparkle below the heart point (rising-heart trail).
  g.fillStyle(HEART_HI, 0.9);
  g.fillCircle(cx, cy + 6.4, 0.4);
  g.fillStyle(SPECULAR, 0.85);
  g.fillRect(cx - 0.2, cy + 6.2, 0.4, 0.4);

  g.generateTexture('fx_heart_pulse', s, s);
  g.destroy();
}
