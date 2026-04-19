/**
 * `gale_wraith` — wind-wraith companion to the haar. Design pivot:
 * BOLD horizontal motion slashes dominate the silhouette, thicker
 * and more numerous than before (they were fading at gameplay scale).
 * Body leans hard into the gust, hair and cloak whip horizontal, and
 * debris specks trail in the lee. The whole sprite should read as
 * "wind blasting left-to-right" at a glance. Contrast to haar's
 * stillness — this one is all forward motion.
 */

import Phaser from 'phaser';

export function bakeGaleWraith(scene: Phaser.Scene): void {
  const s = 44;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // ── Outer gust halo — elongated oval biased to the left (lee). ──
  g.fillStyle(0x9db0c0, 0.22);
  g.fillEllipse(cx - 4, cy, 34, 14);
  g.fillStyle(0x9db0c0, 0.1);
  g.fillEllipse(cx - 8, cy, 42, 18);

  // ── Long leading-edge gust streaks — BOLD horizontal slashes
  // trailing off to the left. Thicker than before so they read at
  // gameplay scale. Five streaks at different heights. ──
  g.fillStyle(0xe8f0f8, 0.9);
  g.fillRect(cx - 14, cy - 7, 18, 1.5);
  g.fillStyle(0xd8e4ec, 0.85);
  g.fillRect(cx - 18, cy - 3, 22, 1.8);
  g.fillStyle(0xe8f0f8, 0.85);
  g.fillRect(cx - 16, cy + 1, 20, 1.5);
  g.fillStyle(0xd8e4ec, 0.85);
  g.fillRect(cx - 14, cy + 5, 18, 1.8);
  g.fillStyle(0xd8e4ec, 0.7);
  g.fillRect(cx - 12, cy + 9, 15, 1.2);

  // ── Tapered tail-wisps fading into the lee — a few short
  // trailing dots at the far-left end of each streak. ──
  g.fillStyle(0xa8b8c8, 0.45);
  g.fillRect(cx - 20, cy - 3, 2, 1);
  g.fillRect(cx - 18, cy + 1, 2, 1);
  g.fillRect(cx - 16, cy + 5, 2, 1);

  // ── Swirl arcs — two thicker curved sweeps wrapping around
  // the body (makes the wind read as "swirl" not just "slash"). ──
  g.lineStyle(2, 0xd8e4ec, 0.85);
  g.beginPath();
  g.arc(cx + 2, cy - 2, 10, -Math.PI * 0.85, Math.PI * 0.35);
  g.strokePath();
  g.lineStyle(1.5, 0xc0d0dc, 0.7);
  g.beginPath();
  g.arc(cx - 2, cy + 1, 14, -Math.PI * 0.75, Math.PI * 0.55);
  g.strokePath();

  // ── Core body — leaning forward-right into the wind (signals
  // direction of motion). ──
  g.fillStyle(0x3a4e62, 0.8);
  g.fillEllipse(cx + 3, cy, 11, 13);
  g.fillStyle(0x5a6e82, 0.88);
  g.fillEllipse(cx + 3, cy - 1, 8, 10);

  // ── Head — small, tilted forward (leaning into the gust). ──
  g.fillStyle(0x1a2a38, 0.9);
  g.fillEllipse(cx + 5, cy - 9, 7, 8);
  g.fillStyle(0x354858, 0.95);
  g.fillEllipse(cx + 5, cy - 10, 5, 6);

  // ── Hair whipped horizontally to the left — three streak
  // strands trailing off the head in the wind direction. ──
  g.fillStyle(0x2a3848, 1);
  g.fillRect(cx - 4, cy - 11, 9, 1.2);
  g.fillStyle(0x3a4858, 0.9);
  g.fillRect(cx - 2, cy - 9, 7, 1);
  g.fillStyle(0x4a5868, 0.7);
  g.fillRect(cx - 5, cy - 13, 9, 1);

  // ── Eyes — narrowed slits, pale blue (squint against wind). ──
  g.fillStyle(0xe8f4ff, 1);
  g.fillRect(cx + 3, cy - 10, 2, 1);
  g.fillRect(cx + 6, cy - 10, 2, 1);

  // ── Debris — tiny specks (leaves/dust) whirling in the lee. ──
  g.fillStyle(0x4a3a28, 0.9);
  g.fillRect(cx - 10, cy - 1, 1, 1);
  g.fillStyle(0x6a5a38, 0.7);
  g.fillRect(cx - 15, cy + 3, 1, 1);
  g.fillStyle(0x4a3a28, 0.7);
  g.fillRect(cx - 13, cy + 7, 1.5, 1);
  g.fillStyle(0x6a5a38, 0.5);
  g.fillRect(cx - 8, cy + 10, 1, 1);

  g.generateTexture('gale_wraith', s, s);
  g.destroy();
}

/**
 * Seelie Piper — DESIGN_IDEAS section 3 Faerie family opener.
 * "Fair-court" faerie orbiting the player; pale gold palette with
 * sparkle-before-commit hint in the visual. Pairs with
 * unseelie_fiddler as the light half of a Seelie/Unseelie pair.
 */
