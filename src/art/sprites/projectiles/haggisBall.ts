/**
 * `haggis_ball` projectile — the bouncing "jobby" lump for Jobby Hurler
 * / Cannon. Lumpy, organic, steaming, with oat-fleck texture and a wet
 * sheen. Must look disgusting AND hilarious — peak Glesga humour.
 */

import * as Phaser from 'phaser';

export function bakeHaggisBall(scene: Phaser.Scene): void {
  const s = 22;
  const g = scene.add.graphics();
  const cx = 11, cy = 11;

  // ── THREE STEAM WISPS rising from the top (warm and fresh).
  // Each wisp is two stacked circles — small base + smaller top —
  // so they read as three distinct curls rather than one cloud. ──
  // Left wisp
  g.fillStyle(0xccbb88, 0.3);
  g.fillCircle(cx - 3.5, cy - 7.5, 1.4);
  g.fillStyle(0xeeddaa, 0.4);
  g.fillCircle(cx - 3.5, cy - 9, 0.9);
  g.fillStyle(0xfff0c0, 0.5);
  g.fillCircle(cx - 4, cy - 10.5, 0.6);
  // Centre wisp (tallest)
  g.fillStyle(0xccbb88, 0.32);
  g.fillCircle(cx, cy - 8, 1.5);
  g.fillStyle(0xeeddaa, 0.45);
  g.fillCircle(cx + 0.5, cy - 9.8, 1);
  g.fillStyle(0xfff0c0, 0.6);
  g.fillCircle(cx, cy - 11.5, 0.7);
  // Right wisp
  g.fillStyle(0xccbb88, 0.3);
  g.fillCircle(cx + 3, cy - 7.5, 1.3);
  g.fillStyle(0xeeddaa, 0.4);
  g.fillCircle(cx + 3.5, cy - 9, 0.9);
  g.fillStyle(0xfff0c0, 0.5);
  g.fillCircle(cx + 4, cy - 10.5, 0.55);

  // ── WOBBLE SHADOW underneath — soft elliptical drop shadow
  // beneath the ball communicates "this thing is in motion". ──
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(cx, cy + 9, 12, 2.5);
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(cx, cy + 9, 16, 1.6);

  // ── Dark outline — lumpy, not perfectly round ──
  g.fillStyle(0x1a0e04, 1);
  g.fillCircle(cx, cy, 8);
  g.fillCircle(cx + 1, cy - 1, 7);  // slight offset for lumpiness
  g.fillCircle(cx - 2, cy + 1, 6);  // bottom-left bulge

  // ── Main body — dark brown haggis meat ──
  g.fillStyle(0x4a3008, 1);
  g.fillCircle(cx, cy, 7);
  g.fillCircle(cx + 1, cy - 1, 6);

  // ── Lighter brown layer (upper half catches light) ──
  g.fillStyle(0x6a4a10, 1);
  g.fillCircle(cx - 1, cy - 1, 5.5);
  g.fillStyle(0x7a5a18, 0.8);
  g.fillCircle(cx - 2, cy - 2, 4);

  // ── OAT FLECK texture — three-size variation so the surface
  // reads chunky: large flagship oats + medium flecks + tiny grit. ──
  // Large oats
  g.fillStyle(0xb89540, 1);
  g.fillCircle(cx - 3, cy - 1, 1.4);
  g.fillCircle(cx + 2.2, cy + 2.2, 1.5);
  g.fillStyle(0xd8b860, 0.9);
  g.fillCircle(cx - 3, cy - 1, 0.7);
  g.fillCircle(cx + 2.2, cy + 2.2, 0.8);
  // Medium flecks
  g.fillStyle(0x9a8030, 0.85);
  g.fillCircle(cx + 1, cy - 3, 0.9);
  g.fillCircle(cx - 1, cy + 3, 1);
  g.fillCircle(cx + 4, cy, 0.8);
  g.fillCircle(cx - 4, cy + 2, 0.9);
  // Tiny grit specks
  g.fillStyle(0xb89540, 0.7);
  g.fillCircle(cx - 2, cy - 4, 0.4);
  g.fillCircle(cx + 3.5, cy - 1, 0.4);
  g.fillCircle(cx + 0.5, cy + 4, 0.4);
  // Darker flecks (pepper / liver bits)
  g.fillStyle(0x2a1806, 0.7);
  g.fillCircle(cx + 3, cy - 2, 0.7);
  g.fillCircle(cx - 2, cy + 4, 0.6);
  g.fillCircle(cx + 1, cy + 1, 0.5);

  // ── SIDE HIGHLIGHT crescent — bright catchlight along the upper-
  // left curve so the ball reads spherical, not a flat blob. ──
  g.fillStyle(0xddbb55, 0.55);
  g.fillEllipse(cx - 3, cy - 3, 5, 2.5);
  g.fillStyle(0xeed080, 0.5);
  g.fillEllipse(cx - 3.5, cy - 4, 3.5, 1.5);

  // ── Wet sheen — glistening surface highlight ──
  g.fillStyle(0xbb9933, 0.5);
  g.fillCircle(cx - 2, cy - 3, 2);
  g.fillStyle(0xddbb55, 0.3);
  g.fillCircle(cx - 3, cy - 4, 1.2);

  // Specular dot
  g.fillStyle(0xffffff, 0.55);
  g.fillCircle(cx - 3, cy - 4, 0.9);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 3.2, cy - 4.2, 0.4);

  g.generateTexture('haggis_ball', s, s);
  g.destroy();
}
