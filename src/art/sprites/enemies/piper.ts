/**
 * `piper` — full-regalia highland bagpiper: military doublet, dress sporran, diced-border tam with badge + toorie, tartan pipe-bag.
 */

import Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';
import { HIGHLAND_TARTAN } from '../../kiltPalette';

export const PIPER_CANVAS_SIZE = 48;

export function drawPiperBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = PIPER_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);
  const lly = frame.leftLegY ?? 0;
  const rly = frame.rightLegY ?? 0;

  // Legs (hose with flashes)
  g.fillStyle(0x111111, 1);
  g.fillRect(cx - 7, cy + 12 + lly, 5, 8);
  g.fillRect(cx + 2, cy + 12 + rly, 5, 8);
  g.fillStyle(0xeeeeee, 0.5);
  g.fillTriangle(cx - 5, cy + 14 + lly, cx - 4, cy + 16 + lly, cx - 6, cy + 16 + lly);
  g.fillTriangle(cx + 4, cy + 14 + rly, cx + 5, cy + 16 + rly, cx + 3, cy + 16 + rly);
  g.fillStyle(0xcc0000, 1);
  g.fillRect(cx - 7, cy + 12 + lly, 5, 1);
  g.fillRect(cx + 2, cy + 12 + rly, 5, 1);

  // Kilt
  g.fillStyle(HIGHLAND_TARTAN.fieldDark, 1);
  g.fillRect(cx - 10, cy + 2, 20, 12);
  g.fillStyle(HIGHLAND_TARTAN.field, 1);
  g.fillRect(cx - 9, cy + 3, 18, 10);
  g.fillStyle(HIGHLAND_TARTAN.stripe, 0.8);
  g.fillRect(cx - 9, cy + 6, 18, 1);
  g.fillRect(cx - 9, cy + 10, 18, 1);
  g.fillRect(cx - 4, cy + 3, 1, 10);
  g.fillRect(cx + 4, cy + 3, 1, 10);
  g.fillStyle(HIGHLAND_TARTAN.accent, 0.5);
  g.fillRect(cx - 9, cy + 8, 18, 1);

  // Full dress sporran (white horsehair, silver cantle)
  g.lineStyle(1, 0xcccccc, 0.9);
  g.lineBetween(cx - 7, cy + 3, cx + 7, cy + 3);
  g.fillStyle(0xdddddd, 1);
  g.fillEllipse(cx, cy + 6, 8, 6);
  g.fillStyle(0xeeeeee, 1);
  g.fillEllipse(cx, cy + 6, 6, 5);
  g.fillStyle(0xcccccc, 0.6);
  g.fillRect(cx - 2, cy + 4, 1, 4);
  g.fillRect(cx + 1, cy + 5, 1, 3);
  g.fillStyle(0x888899, 1);
  g.fillEllipse(cx, cy + 3, 8, 3);
  g.fillStyle(0xaaaabb, 1);
  g.fillEllipse(cx, cy + 3, 6, 2);
  g.fillStyle(0xccccdd, 0.8);
  g.fillCircle(cx - 2, cy + 3, 0.5);
  g.fillCircle(cx, cy + 3, 0.5);
  g.fillCircle(cx + 2, cy + 3, 0.5);
  g.fillStyle(0x111111, 1);
  g.fillRect(cx - 2, cy + 8, 1, 4);
  g.fillRect(cx, cy + 8, 1, 4);
  g.fillRect(cx + 2, cy + 8, 1, 4);
  g.fillCircle(cx - 2, cy + 12, 0.8);
  g.fillCircle(cx, cy + 12, 0.8);
  g.fillCircle(cx + 2, cy + 12, 0.8);

  // Military doublet
  g.fillStyle(0x0a0a1a, 1);
  g.fillRect(cx - 10, cy - 6, 20, 10);
  g.fillStyle(0x222244, 1);
  g.fillRect(cx - 9, cy - 5, 18, 8);
  g.fillStyle(0xcccccc, 1);
  g.fillCircle(cx - 2, cy - 3, 0.8);
  g.fillCircle(cx - 2, cy, 0.8);
  g.fillCircle(cx + 2, cy - 3, 0.8);
  g.fillCircle(cx + 2, cy, 0.8);
  g.fillStyle(0xdddd00, 0.8);
  g.fillRect(cx - 10, cy - 6, 3, 2);
  g.fillRect(cx + 7, cy - 6, 3, 2);

  // Head (GOING RED from blowing)
  g.fillStyle(0xcc5533, 1);
  g.fillCircle(cx, cy - 12, 8);
  g.fillStyle(0xee7755, 1);
  g.fillCircle(cx, cy - 12, 7);
  g.fillStyle(0xff8866, 1);
  g.fillCircle(cx - 7, cy - 10, 3);
  g.fillCircle(cx + 7, cy - 10, 3);
  g.fillStyle(0xffaa88, 0.8);
  g.fillCircle(cx - 7, cy - 11, 1.5);
  g.fillCircle(cx + 7, cy - 11, 1.5);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 3, cy - 14, 1.8);
  g.fillCircle(cx + 3, cy - 14, 1.8);
  g.fillStyle(0x111111, 1);
  g.fillCircle(cx - 3, cy - 14, 0.8);
  g.fillCircle(cx + 3, cy - 14, 0.8);
  g.fillStyle(0xaaddff, 0.8);
  g.fillCircle(cx + 6, cy - 15, 0.8);

  // Tam o'shanter (diced border, badge, red toorie)
  g.fillStyle(0x001133, 1);
  g.fillEllipse(cx, cy - 19, 16, 5);
  g.fillStyle(0x002255, 1);
  g.fillEllipse(cx, cy - 20, 14, 4);
  g.fillStyle(0xcc0000, 1);
  g.fillRect(cx - 7, cy - 18, 2, 1);
  g.fillRect(cx - 3, cy - 18, 2, 1);
  g.fillRect(cx + 1, cy - 18, 2, 1);
  g.fillRect(cx + 5, cy - 18, 2, 1);
  g.fillStyle(0xeeeeee, 1);
  g.fillRect(cx - 5, cy - 18, 2, 1);
  g.fillRect(cx - 1, cy - 18, 2, 1);
  g.fillRect(cx + 3, cy - 18, 2, 1);
  g.fillStyle(0xddaa00, 1);
  g.fillCircle(cx - 3, cy - 20, 1.5);
  g.fillStyle(0xffcc22, 1);
  g.fillCircle(cx - 3, cy - 20, 0.8);
  g.fillStyle(0x990000, 1);
  g.fillCircle(cx + 5, cy - 23, 3.5);
  g.fillStyle(0xcc1111, 1);
  g.fillCircle(cx + 5, cy - 23, 3);
  g.fillStyle(0xee3333, 0.7);
  g.fillCircle(cx + 4, cy - 24, 1.5);

  // BAGPIPES (tartan bag under arm)
  g.fillStyle(HIGHLAND_TARTAN.fieldDark, 1);
  g.fillEllipse(cx - 14, cy, 16, 14);
  g.fillStyle(HIGHLAND_TARTAN.field, 1);
  g.fillEllipse(cx - 14, cy, 14, 12);
  g.fillStyle(HIGHLAND_TARTAN.stripe, 0.8);
  g.fillRect(cx - 20, cy - 2, 12, 1);
  g.fillRect(cx - 20, cy + 2, 12, 1);
  g.fillRect(cx - 16, cy - 5, 1, 10);
  g.fillRect(cx - 12, cy - 5, 1, 10);

  // Drone pipes with gold ferrules
  g.fillStyle(0x1a1100, 1);
  g.fillRect(cx - 19, cy - 16, 2, 18);
  g.fillRect(cx - 15, cy - 18, 2, 20);
  g.fillRect(cx - 11, cy - 16, 2, 18);
  g.fillStyle(0x443300, 1);
  g.fillRect(cx - 19, cy - 15, 1, 17);
  g.fillRect(cx - 15, cy - 17, 1, 19);
  g.fillRect(cx - 11, cy - 15, 1, 17);
  g.fillStyle(0xddaa00, 1);
  g.fillRect(cx - 20, cy - 17, 4, 2);
  g.fillRect(cx - 16, cy - 19, 4, 2);
  g.fillRect(cx - 12, cy - 17, 4, 2);
  g.fillStyle(0xccaa00, 0.8);
  g.fillRect(cx - 20, cy - 8, 4, 1);
  g.fillRect(cx - 16, cy - 8, 4, 1);
  g.fillRect(cx - 12, cy - 8, 4, 1);

  g.fillStyle(0x1a1100, 1);
  g.fillRect(cx - 8, cy - 12, 6, 2);
}

export function bakePiper(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawPiperBody(g);
  g.generateTexture('piper', PIPER_CANVAS_SIZE, PIPER_CANVAS_SIZE);
  g.destroy();
}
