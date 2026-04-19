/**
 * `gale_wraith` — wind-wraith companion to the haar. Motion lines stream off the arms, hair horizontal, pale central core.
 */

import Phaser from 'phaser';

export function bakeGaleWraith(scene: Phaser.Scene): void {
  const s = 44;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // Outer gust halo — long directional streaks to the left (lee-side).
  g.fillStyle(0x9db0c0, 0.22);
  g.fillEllipse(cx - 4, cy, 30, 14);
  g.fillStyle(0x9db0c0, 0.1);
  g.fillEllipse(cx - 8, cy, 38, 18);

  // Swirling wind arcs — the signature motion readable silhouette.
  g.lineStyle(1.5, 0xd8e4ec, 0.85);
  g.beginPath();
  g.arc(cx + 2, cy - 2, 10, -Math.PI * 0.85, Math.PI * 0.35);
  g.strokePath();
  g.lineStyle(1.2, 0xc0d0dc, 0.7);
  g.beginPath();
  g.arc(cx - 2, cy + 1, 14, -Math.PI * 0.75, Math.PI * 0.55);
  g.strokePath();
  g.lineStyle(1, 0xa8b8c8, 0.5);
  g.beginPath();
  g.arc(cx - 4, cy + 4, 18, -Math.PI * 0.6, Math.PI * 0.65);
  g.strokePath();

  // Core body — denser than haar, still translucent.
  g.fillStyle(0x4a5e72, 0.7);
  g.fillEllipse(cx + 2, cy, 12, 14);
  g.fillStyle(0x6a7e92, 0.8);
  g.fillEllipse(cx + 2, cy - 1, 9, 11);

  // Head — small, leaning into the gust.
  g.fillStyle(0x2a3a48, 0.85);
  g.fillEllipse(cx + 4, cy - 9, 7, 8);
  g.fillStyle(0x455868, 0.9);
  g.fillEllipse(cx + 4, cy - 10, 5, 6);

  // Eyes — bright white-blue, narrowed like a squint against wind.
  g.fillStyle(0xf0f8ff, 1);
  g.fillRect(cx + 2, cy - 10, 2, 1);
  g.fillRect(cx + 5, cy - 10, 2, 1);

  // Leading-edge streaks — high contrast, directional.
  g.fillStyle(0xe8f0f8, 0.8);
  g.fillRect(cx + 8, cy - 3, 6, 1);
  g.fillRect(cx + 10, cy + 1, 5, 1);
  g.fillRect(cx + 8, cy + 5, 6, 1);

  // Trail wisps — fading off to the left.
  g.fillStyle(0xa8b8c8, 0.3);
  g.fillRect(cx - 12, cy - 2, 6, 1);
  g.fillRect(cx - 15, cy + 1, 5, 1);
  g.fillRect(cx - 13, cy + 4, 7, 1);

  g.generateTexture('gale_wraith', s, s);
  g.destroy();
}

/**
 * Seelie Piper — DESIGN_IDEAS section 3 Faerie family opener.
 * "Fair-court" faerie orbiting the player; pale gold palette with
 * sparkle-before-commit hint in the visual. Pairs with
 * unseelie_fiddler as the light half of a Seelie/Unseelie pair.
 */
