/**
 * `eagle` — fierce amber-eyed raptor, feathery finger-tip wings, hooked beak. Bar-setting for the aerial enemies.
 */

import Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const EAGLE_CANVAS_SIZE = 56;

export function drawEagleBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = EAGLE_CANVAS_SIZE;
  const cx = s / 2 - 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + (frame.breathY ?? 0);

  // ── Wings — broad sweep reaching near canvas edges (~2px margin) ──
  // Outer wing (darkest — primary feathers)
  g.fillStyle(0x1a1208, 1);
  g.fillTriangle(cx - 2, cy, cx - 10, cy - 24, cx + 7, cy - 17);
  g.fillTriangle(cx - 2, cy, cx - 10, cy + 24, cx + 7, cy + 17);
  // Mid wing coverts (warm brown)
  g.fillStyle(0x3a2a14, 1);
  g.fillTriangle(cx, cy, cx - 6, cy - 18, cx + 5, cy - 13);
  g.fillTriangle(cx, cy, cx - 6, cy + 18, cx + 5, cy + 13);
  // Inner wing highlight (golden-brown scapulars)
  g.fillStyle(0x5a4020, 1);
  g.fillTriangle(cx + 1, cy, cx - 3, cy - 12, cx + 4, cy - 10);
  g.fillTriangle(cx + 1, cy, cx - 3, cy + 12, cx + 4, cy + 10);
  // Individual primary feather tips — separated fingers at wingtips
  g.fillStyle(0x0e0a04, 1);
  g.fillTriangle(cx - 10, cy - 24, cx - 5, cy - 19, cx - 13, cy - 20);
  g.fillTriangle(cx - 8, cy - 22, cx - 4, cy - 17, cx - 11, cy - 17);
  g.fillTriangle(cx - 5, cy - 20, cx - 1, cy - 15, cx - 8, cy - 15);
  g.fillTriangle(cx - 10, cy + 24, cx - 5, cy + 19, cx - 13, cy + 20);
  g.fillTriangle(cx - 8, cy + 22, cx - 4, cy + 17, cx - 11, cy + 17);
  g.fillTriangle(cx - 5, cy + 20, cx - 1, cy + 15, cx - 8, cy + 15);
  // Feather barring detail
  g.fillStyle(0x4a3818, 0.5);
  g.fillRect(cx - 5, cy - 14, 7, 1);
  g.fillRect(cx - 5, cy + 13, 7, 1);
  g.fillRect(cx - 3, cy - 11, 5, 1);
  g.fillRect(cx - 3, cy + 10, 5, 1);

  // ── Body — barrel-shaped, thicker (+2px each side) ──
  g.fillStyle(0x1a1208, 1);
  g.fillEllipse(cx, cy, 20, 13);
  g.fillStyle(0x3a2a14, 1);
  g.fillEllipse(cx, cy, 18, 11);
  // Breast
  g.fillStyle(0x5a4828, 0.7);
  g.fillEllipse(cx - 1, cy + 1, 12, 8);
  // Back feather sheen
  g.fillStyle(0x6a5030, 0.4);
  g.fillEllipse(cx, cy - 2, 12, 5);

  // ── Tail — broad, fanned, banded ──
  g.fillStyle(0x1a1208, 1);
  g.fillTriangle(cx - 8, cy - 5, cx - 8, cy + 5, cx - 17, cy);
  g.fillStyle(0x2a1a0c, 1);
  g.fillTriangle(cx - 8, cy - 4, cx - 8, cy + 4, cx - 16, cy);
  g.fillStyle(0x4a3818, 0.6);
  g.fillRect(cx - 14, cy - 1, 5, 2);

  // ── Head — golden-brown nape ──
  g.fillStyle(0x1a1208, 1);
  g.fillCircle(cx + 11, cy, 7);
  g.fillStyle(0x5a4020, 1);
  g.fillCircle(cx + 11, cy, 6);
  g.fillStyle(0x8a7040, 1);
  g.fillCircle(cx + 10, cy - 2, 4);
  g.fillStyle(0xaa8850, 0.7);
  g.fillCircle(cx + 9, cy - 3, 2.5);

  // ── Beak — massive, hooked ──
  g.fillStyle(0xccaa22, 1);
  g.fillCircle(cx + 16, cy, 2);
  g.fillStyle(0x1a1800, 1);
  g.fillTriangle(cx + 16, cy - 2, cx + 16, cy + 1, cx + 23, cy);
  g.fillStyle(0x444422, 1);
  g.fillTriangle(cx + 17, cy - 1, cx + 17, cy + 0.5, cx + 22, cy);
  g.fillStyle(0x0a0800, 1);
  g.fillCircle(cx + 22, cy + 0.5, 1.2);
  g.fillStyle(0x333322, 1);
  g.fillTriangle(cx + 16, cy + 1, cx + 16, cy + 3, cx + 20, cy + 2);

  // ── Eye — fierce amber, with heavy brow ridge ──
  g.fillStyle(0x2a1a0c, 1);
  g.fillRect(cx + 9, cy - 4, 5, 1);
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx + 12, cy - 1, 2.5);
  g.fillStyle(0xddaa00, 1);
  g.fillCircle(cx + 12, cy - 1, 1.8);
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx + 12, cy - 1, 0.7);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx + 12, cy - 2, 0.7);

  // ── Talons — powerful ──
  g.fillStyle(0x333322, 1);
  g.fillRect(cx - 2, cy + 5, 2, 5);
  g.fillRect(cx + 3, cy + 5, 2, 5);
  g.fillStyle(0x0a0800, 1);
  g.fillRect(cx - 3, cy + 9, 1, 2);
  g.fillRect(cx, cy + 9, 1, 2);
  g.fillRect(cx + 2, cy + 9, 1, 2);
  g.fillRect(cx + 5, cy + 9, 1, 2);
  g.fillStyle(0x3a2a14, 0.6);
  g.fillCircle(cx - 1, cy + 5, 2.5);
  g.fillCircle(cx + 4, cy + 5, 2.5);
}

export function bakeEagle(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawEagleBody(g);
  g.generateTexture('eagle', EAGLE_CANVAS_SIZE, EAGLE_CANVAS_SIZE);
  g.destroy();
}
