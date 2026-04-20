/**
 * `barghest` — phantom hound with matted shadow-fur and two burning yellow eyes. Lower to the ground than a wolf.
 */

import Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const BARGHEST_CANVAS_SIZE = 44;

export function drawBarghestBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = BARGHEST_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);
  const lly = frame.leftLegY ?? 0;  // front legs
  const rly = frame.rightLegY ?? 0; // back legs

  // Menacing under-shadow.
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(cx, cy + 15, 26, 5);

  // Lean hound body — elongated ellipse, nearly black.
  g.fillStyle(0x0a0a0f, 1);
  g.fillEllipse(cx, cy + 4, 26, 12);
  g.fillStyle(0x141418, 1);
  g.fillEllipse(cx, cy + 3, 22, 10);
  // Fur shadow hints — darker streaks along the back.
  g.fillStyle(0x050508, 0.7);
  g.fillEllipse(cx - 6, cy + 1, 4, 3);
  g.fillEllipse(cx + 4, cy, 4, 3);

  // Legs — 4, scruffy and taut mid-bound.
  // Back pair (leftLegY mapped to back legs at left-side of body).
  g.fillStyle(0x0a0a0f, 1);
  g.fillRect(cx - 10, cy + 8 + rly, 2, 7);
  g.fillRect(cx - 4, cy + 9 + rly, 2, 6);
  // Front pair (rightLegY mapped to front legs near head).
  g.fillRect(cx + 2, cy + 9 + lly, 2, 6);
  g.fillRect(cx + 8, cy + 8 + lly, 2, 7);

  // Tail — curling shadow behind.
  g.fillStyle(0x0a0a0f, 1);
  g.fillTriangle(cx - 12, cy + 2, cx - 16, cy - 2, cx - 12, cy + 6);

  // Head — low and forward, teeth bared.
  g.fillStyle(0x0a0a0f, 1);
  g.fillEllipse(cx + 11, cy, 9, 7);
  g.fillStyle(0x141418, 1);
  g.fillEllipse(cx + 11, cy - 1, 7, 5);

  // Ears — pointed, laid back.
  g.fillStyle(0x0a0a0f, 1);
  g.fillTriangle(cx + 8, cy - 4, cx + 6, cy - 9, cx + 10, cy - 6);
  g.fillTriangle(cx + 13, cy - 4, cx + 16, cy - 9, cx + 15, cy - 5);

  // Red eyes — the signature glow.
  g.fillStyle(0xcc0a00, 1);
  g.fillCircle(cx + 10, cy - 1, 1.2);
  g.fillCircle(cx + 14, cy - 1, 1.2);
  // Eye bloom.
  g.fillStyle(0xff3a20, 0.7);
  g.fillCircle(cx + 10, cy - 1, 0.6);
  g.fillCircle(cx + 14, cy - 1, 0.6);

  // Bared fangs — tiny white triangles below the snout.
  g.fillStyle(0xe8e8e8, 1);
  g.fillTriangle(cx + 13, cy + 2, cx + 14, cy + 3, cx + 14, cy + 1);
  g.fillTriangle(cx + 15, cy + 2, cx + 16, cy + 3, cx + 16, cy + 1);

  // Dive trail — faint motion streaks behind.
  g.fillStyle(0x220022, 0.3);
  g.fillRect(cx - 18, cy + 2, 4, 1);
  g.fillRect(cx - 20, cy + 5, 3, 1);
}

export function bakeBarghest(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawBarghestBody(g);
  g.generateTexture('barghest', BARGHEST_CANVAS_SIZE, BARGHEST_CANVAS_SIZE);
  g.destroy();
}

/**
 * Kelpie Foal — DESIGN_IDEAS section 3 Cryptids #2. Young water-
 * horse; flees when the player gets close (reuses sheep's `flee`
 * behaviour). Shimmer-blue coat with mane-drip detail so it reads
 * as water-spirit rather than livestock.
 */
