/**
 * `health_orb` — glowing Irn-Bru orange sphere with a healing cross
 * inside. Bright enough to spot mid-combat, distinctive from the gold
 * diamond xp_gem. Tiny fizz bubbles because of course it's Irn-Bru.
 */

import * as Phaser from 'phaser';

export function bakeHealthOrb(scene: Phaser.Scene): void {
  const s = 22;
  const g = scene.add.graphics();
  const cx = 11, cy = 11;

  // Outer glow — warm orange halo
  g.fillStyle(0xff6600, 0.12);
  g.fillCircle(cx, cy, 10);

  // Dark outline ring
  g.fillStyle(0x662200, 1);
  g.fillCircle(cx, cy, 9);

  // Main orb body — deep Irn-Bru orange
  g.fillStyle(0xcc5500, 1);
  g.fillCircle(cx, cy, 8);
  g.fillStyle(0xee7700, 1);
  g.fillCircle(cx, cy, 7);

  // Upper highlight hemisphere (brighter, light from above-left)
  g.fillStyle(0xff9922, 1);
  g.fillCircle(cx - 1, cy - 2, 5);
  g.fillStyle(0xffaa44, 0.8);
  g.fillCircle(cx - 2, cy - 3, 3);

  // ── Healing cross — white/cream, the universal health symbol ──
  // Horizontal bar
  g.fillStyle(0xffeedd, 0.9);
  g.fillRect(cx - 4, cy - 1, 8, 3);
  // Vertical bar
  g.fillRect(cx - 1, cy - 4, 3, 8);
  // Brighter inner cross (smaller, overlaid)
  g.fillStyle(0xffffff, 0.7);
  g.fillRect(cx - 3, cy, 6, 1);
  g.fillRect(cx, cy - 3, 1, 6);

  // Glass-like specular highlight — upper left
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx - 3, cy - 4, 2);
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(cx - 4, cy - 5, 1);

  // Secondary specular — lower right (subtle)
  g.fillStyle(0xffffff, 0.15);
  g.fillCircle(cx + 3, cy + 3, 1.5);

  // Tiny fizz bubbles (it's Irn-Bru after all)
  g.fillStyle(0xffdd88, 0.6);
  g.fillCircle(cx + 4, cy - 2, 0.7);
  g.fillCircle(cx + 2, cy + 4, 0.6);
  g.fillCircle(cx - 4, cy + 1, 0.5);

  g.generateTexture('health_orb', s, s);
  g.destroy();
}
