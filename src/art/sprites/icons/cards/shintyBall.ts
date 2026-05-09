import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';

/**
 * `ucard_shinty_ball` — passive item icon. Big leather camanachd ball
 * centred on the card with the dark-red stitched seam clearly visible
 * + a chunky highlight + cork interior peeking through a small wear
 * notch (the "professional ball regulated, the haggis prefers the auld
 * kind" flavour). Pairs with the Shinty Stick weapon for the legendary
 * Caman Storm evolution.
 */
export function drawShintyBall(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  cardIconBg(g, s, 0x2a1f12);
  const cx = 16, cy = 16;

  // ── Drop shadow under the ball.
  g.fillStyle(0x000000, 0.45);
  g.fillEllipse(cx, cy + 11, 18, 3);
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, cy + 11, 22, 1.8);

  // ── Outer dark outline + leather body. Leather is a warm cream-tan.
  g.fillStyle(0x1a1208, 1);
  g.fillCircle(cx, cy, 11);
  g.fillStyle(0xc8b088, 1);
  g.fillCircle(cx, cy, 9.5);
  g.fillStyle(0xe8d8b0, 1);
  g.fillCircle(cx, cy, 8.5);

  // ── Upper-left highlight crescent — sells sphericality.
  g.fillStyle(0xfff0c8, 0.92);
  g.fillEllipse(cx - 2.5, cy - 3, 7.5, 4.5);
  g.fillStyle(0xfff8d8, 0.7);
  g.fillEllipse(cx - 3, cy - 4, 4, 2.2);

  // ── STITCHED SEAM — wide red band + cross-stitch beads. The ball's
  // single most identifying feature. Slight curve to suggest the seam
  // wraps over the sphere.
  g.fillStyle(0x3a0a04, 1);
  g.fillRect(cx - 8.5, cy + 0.5, 17, 1.6);
  g.fillStyle(0x8a2218, 1);
  g.fillRect(cx - 8.5, cy + 0.7, 17, 1.2);
  // Cross-stitch beads
  g.fillStyle(0xc8584a, 1);
  for (let i = 0; i < 7; i++) {
    const sx = cx - 7 + i * 2.2;
    g.fillRect(sx - 0.4, cy - 0.1, 0.8, 0.7);
    g.fillRect(sx - 0.4, cy + 1.6, 0.8, 0.7);
  }

  // ── WEAR NOTCH — a small chip on the lower-right where the leather
  // has frayed and a hint of pale cork core shows through. Sells the
  // "prefers the auld kind" flavour.
  g.fillStyle(0x6a4818, 1);
  g.fillRect(cx + 4, cy + 4, 1.6, 1.4);
  g.fillStyle(0xddc890, 1);
  g.fillRect(cx + 4.2, cy + 4.2, 1.2, 1);

  // ── Tiny scuffs scattered for "well-used" vibe.
  g.fillStyle(0xc8b088, 0.5);
  g.fillCircle(cx - 3, cy + 5, 1);
  g.fillCircle(cx + 4, cy - 3, 0.8);

  // ── Specular gleam — single bright dot for polish.
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 4, cy - 4.5, 1);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx - 4.4, cy - 4.8, 0.5);

  g.generateTexture('ucard_shinty_ball', s, s);
  g.destroy();
}
