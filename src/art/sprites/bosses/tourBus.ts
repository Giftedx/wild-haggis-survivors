/**
 * `boss_tour_bus` — Act-2 boss: anthropomorphised tour bus, headlights as eyes, grille as teeth, a traffic cone on top. The joke made flesh.
 */

import Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const BOSS_TOUR_BUS_CANVAS_SIZE = 96;

export function drawBossTourBusBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = BOSS_TOUR_BUS_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + (frame.breathY ?? 0);

  // All offsets scaled 1.2× from 80px originals to fill 96px canvas proportionally.

  // === Bus body (MAGENTA/HOT PINK — the unmistakable First Glasgow livery) ===
  g.fillStyle(0x551133, 1);
  g.fillRect(cx - 41, cy - 19, 82, 38);
  g.fillStyle(0xaa2266, 1);
  g.fillRect(cx - 40, cy - 18, 80, 36);
  // Yellow swoosh stripe
  g.fillStyle(0xddcc22, 1);
  g.fillRect(cx - 40, cy - 10, 80, 3);
  g.fillStyle(0xbbaa11, 1);
  g.fillRect(cx - 40, cy - 7, 80, 1);

  // === Open top deck rail ===
  g.fillStyle(0x333333, 1);
  g.fillRect(cx - 36, cy - 22, 72, 2);
  g.fillRect(cx - 34, cy - 24, 1, 4);
  g.fillRect(cx - 22, cy - 24, 1, 4);
  g.fillRect(cx - 10, cy - 24, 1, 4);
  g.fillRect(cx + 2, cy - 24, 1, 4);
  g.fillRect(cx + 14, cy - 24, 1, 4);
  g.fillRect(cx + 26, cy - 24, 1, 4);

  // === HORIZONTAL rain (Glasgow rain goes SIDEWAYS) ===
  g.lineStyle(1, 0xaaddff, 0.4);
  g.lineBetween(cx - 30, cy - 26, cx - 24, cy - 25);
  g.lineBetween(cx - 12, cy - 28, cx - 6, cy - 27);
  g.lineBetween(cx + 6, cy - 25, cx + 12, cy - 24);
  g.lineBetween(cx + 22, cy - 26, cx + 28, cy - 25);
  g.lineBetween(cx - 18, cy - 24, cx - 12, cy - 23);
  g.lineBetween(cx + 14, cy - 28, cx + 20, cy - 27);

  // === Tourist faces in windows ===
  g.fillStyle(0x222244, 1);
  g.fillRect(cx - 36, cy - 16, 72, 7);
  g.fillStyle(0x88ccff, 0.7);
  for (let i = 0; i < 6; i++) {
    g.fillRect(cx - 35 + i * 12, cy - 15, 10, 6);
  }
  g.fillStyle(0xee8877, 1);
  g.fillCircle(cx - 30, cy - 12, 2);
  g.fillCircle(cx - 18, cy - 12, 2);
  g.fillCircle(cx - 6, cy - 12, 2);
  g.fillCircle(cx + 6, cy - 12, 2);
  g.fillCircle(cx + 18, cy - 12, 2);
  g.fillCircle(cx + 30, cy - 12, 2);

  // === Destination sign — "YOKER" ===
  g.fillStyle(0x111111, 1);
  g.fillRect(cx - 14, cy - 18, 28, 5);
  g.fillStyle(0xff8800, 1);
  g.fillRect(cx - 12, cy - 17, 24, 3);
  g.fillStyle(0xffaa00, 1);
  // Y
  g.fillRect(cx - 11, cy - 17, 1, 1);
  g.fillRect(cx - 9, cy - 17, 1, 1);
  g.fillRect(cx - 10, cy - 16, 1, 1);
  // O
  g.fillRect(cx - 6, cy - 17, 2, 1);
  g.fillRect(cx - 6, cy - 16, 2, 1);
  // K
  g.fillRect(cx - 3, cy - 17, 1, 2);
  g.fillRect(cx - 2, cy - 17, 1, 1);
  // E
  g.fillRect(cx, cy - 17, 2, 1);
  g.fillRect(cx, cy - 16, 1, 1);
  // R
  g.fillRect(cx + 3, cy - 17, 2, 1);
  g.fillRect(cx + 3, cy - 16, 1, 1);
  g.fillRect(cx + 4, cy - 16, 1, 1);

  // === Headlights (angry, bearing down) ===
  g.fillStyle(0xffff66, 1);
  g.fillCircle(cx + 40, cy - 5, 5);
  g.fillCircle(cx + 40, cy + 5, 5);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx + 40, cy - 5, 2.5);
  g.fillCircle(cx + 40, cy + 5, 2.5);
  g.fillStyle(0xffff88, 0.15);
  g.fillTriangle(cx + 43, cy - 7, cx + 43, cy + 7, cx + 55, cy);

  // === Traffic cone on bumper (Duke of Wellington nod!) ===
  g.fillStyle(0xff6600, 1);
  g.fillTriangle(cx + 41, cy + 11, cx + 46, cy + 17, cx + 36, cy + 17);
  g.fillStyle(0xff8833, 1);
  g.fillTriangle(cx + 41, cy + 12, cx + 44, cy + 17, cx + 37, cy + 17);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(cx + 37, cy + 15, 7, 1);

  // === Bumper ===
  g.fillStyle(0x333333, 1);
  g.fillRect(cx - 40, cy + 17, 80, 5);
  g.fillStyle(0x555555, 1);
  g.fillRect(cx - 40, cy + 17, 80, 1);

  // === Wheels ===
  g.fillStyle(0x111111, 1);
  g.fillCircle(cx - 24, cy + 24, 8);
  g.fillCircle(cx + 24, cy + 24, 8);
  g.fillStyle(0x333333, 1);
  g.fillCircle(cx - 24, cy + 24, 6);
  g.fillCircle(cx + 24, cy + 24, 6);
  g.fillStyle(0x888888, 1);
  g.fillCircle(cx - 24, cy + 24, 2.5);
  g.fillCircle(cx + 24, cy + 24, 2.5);

  // === Exhaust fumes ===
  g.fillStyle(0x444444, 0.4);
  g.fillCircle(cx - 43, cy + 10, 5);
  g.fillCircle(cx - 48, cy + 6, 6);
  g.fillCircle(cx - 53, cy + 2, 5);
  g.fillStyle(0x555555, 0.25);
  g.fillCircle(cx - 46, cy + 5, 4);
  g.fillCircle(cx - 50, cy + 1, 4);
}

export function bakeBossTourBus(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawBossTourBusBody(g);
  g.generateTexture('boss_tour_bus', BOSS_TOUR_BUS_CANVAS_SIZE, BOSS_TOUR_BUS_CANVAS_SIZE);
  g.destroy();
}
