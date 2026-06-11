/**
 * `boss_twin_stone_a` and `boss_twin_stone_b` — Twin Stones of Callanish.
 *
 * Two of the Fir Bhreige (False Men), the petrified giant race of Callanish,
 * Isle of Lewis. Outer Hebrides Neolithic standing stones — anthropomorphic
 * pillars of Lewisian gneiss, lichen-patched, carved with spirals older than
 * language. They share one heartstone; they share one fate.
 *
 * Stone A (boss_twin_stone_a): Tall, erect pillar. Carved spiral on face.
 *   Two amber glowing eyes. The primary — its HP is the shared pool.
 * Stone B (boss_twin_stone_b): Shorter, broader. Weathered edge. No spiral.
 *   The companion — flanks or orbits the primary, fires in concert.
 *
 * Canvas size: 56. Scale: 2.4 (boss). Palette: Lewisian gneiss.
 * Refs: `SCOTTISH_RESEARCH.md` §1.8 (Callanish Standing Stones).
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const BOSS_TWIN_STONE_CANVAS_SIZE = 56;

// ── Palette ───────────────────────────────────────────────────────────
const VOID_DARK    = 0x040408;
const STONE_DEEP   = 0x2c2820;
const STONE_MID    = 0x4a4438;
const STONE_FACE   = 0x685c50;
const STONE_LIGHT  = 0x7c6c5c;
const LICHEN_GOLD  = 0x906c34;
const LICHEN_PALE  = 0xb09060;
const MOSS_GREEN   = 0x4a5c28;
const MOSS_PALE    = 0x687840;
const EYE_AMBER    = 0xc08030;
const EYE_GLOW     = 0xf0a840;
const SPIRAL_GROOVE = 0x3a3028;

// ── Stone A (tall — the primary boss) ────────────────────────────────

export function drawBossTwinStoneA(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = BOSS_TWIN_STONE_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + (frame.breathY ?? 0);

  // Ground shadow
  g.fillStyle(VOID_DARK, 0.45);
  g.fillEllipse(cx + 1, cy + 26, 30, 7);

  // Base (wide foot, tapers up)
  g.fillStyle(STONE_DEEP, 0.97);
  g.fillTriangle(cx - 11, cy + 24, cx + 13, cy + 24, cx + 9, cy - 22);
  g.fillTriangle(cx - 11, cy + 24, cx - 7, cy - 22, cx + 9, cy - 22);

  // Stone mid-tone bulk
  g.fillStyle(STONE_MID, 0.90);
  g.fillRect(cx - 8, cy - 20, 17, 43);

  // Left face edge (shadow side)
  g.fillStyle(STONE_DEEP, 0.70);
  g.fillRect(cx - 9, cy - 18, 4, 40);

  // Right face highlight (sun-struck face)
  g.fillStyle(STONE_LIGHT, 0.55);
  g.fillRect(cx + 4, cy - 18, 4, 38);

  // Stone face (main surface)
  g.fillStyle(STONE_FACE, 0.85);
  g.fillRect(cx - 6, cy - 16, 12, 38);

  // Head (rounded top)
  g.fillStyle(STONE_MID, 0.95);
  g.fillEllipse(cx + 1, cy - 22, 18, 14);
  g.fillStyle(STONE_FACE, 0.80);
  g.fillEllipse(cx + 1, cy - 24, 12, 10);

  // Lichen — gold patches upper stone
  g.fillStyle(LICHEN_GOLD, 0.70);
  g.fillEllipse(cx - 2, cy - 14, 7, 4);
  g.fillEllipse(cx + 4, cy - 8, 5, 3);
  g.fillStyle(LICHEN_PALE, 0.50);
  g.fillEllipse(cx - 4, cy - 6, 4, 3);
  g.fillEllipse(cx + 2, cy - 18, 4, 3);

  // Moss — green lower stone
  g.fillStyle(MOSS_GREEN, 0.60);
  g.fillEllipse(cx - 3, cy + 14, 8, 5);
  g.fillEllipse(cx + 4, cy + 18, 6, 4);
  g.fillStyle(MOSS_PALE, 0.40);
  g.fillEllipse(cx - 1, cy + 20, 5, 3);

  // Carved spiral (Callanish-style Neolithic mark) on upper face
  g.lineStyle(1, SPIRAL_GROOVE, 0.80);
  g.strokeEllipse(cx, cy - 4, 8, 8);
  g.strokeEllipse(cx, cy - 4, 4, 4);
  // Connecting line from inner to outer spiral arm
  g.fillStyle(SPIRAL_GROOVE, 0.70);
  g.fillRect(cx, cy - 4, 1, 5);

  // Eyes — ancient amber glow, set into the stone face
  g.fillStyle(EYE_AMBER, 0.75);
  g.fillEllipse(cx - 3, cy - 12, 4, 3);
  g.fillEllipse(cx + 4, cy - 12, 4, 3);
  g.fillStyle(EYE_GLOW, 0.90);
  g.fillCircle(cx - 2, cy - 12, 1.5);
  g.fillCircle(cx + 5, cy - 12, 1.5);

  // Crack line — age mark
  g.lineStyle(1, STONE_DEEP, 0.55);
  g.lineBetween(cx + 3, cy - 2, cx + 5, cy + 12);
}

// ── Stone B (shorter, broader — the companion / shadow stone) ────────

export function drawBossTwinStoneB(g: Phaser.GameObjects.Graphics): void {
  const s = BOSS_TWIN_STONE_CANVAS_SIZE;
  const cx = s / 2;
  const cy = s / 2 + 2; // slightly lower

  // Ground shadow
  g.fillStyle(VOID_DARK, 0.40);
  g.fillEllipse(cx, cy + 20, 34, 7);

  // Base (broader, more irregular)
  g.fillStyle(STONE_DEEP, 0.97);
  g.fillTriangle(cx - 13, cy + 20, cx + 14, cy + 20, cx + 10, cy - 14);
  g.fillTriangle(cx - 13, cy + 20, cx - 8, cy - 14, cx + 10, cy - 14);

  // Stone bulk
  g.fillStyle(STONE_MID, 0.90);
  g.fillRect(cx - 10, cy - 12, 20, 32);

  // Left shadow edge
  g.fillStyle(STONE_DEEP, 0.65);
  g.fillRect(cx - 12, cy - 10, 5, 28);

  // Right highlight
  g.fillStyle(STONE_LIGHT, 0.50);
  g.fillRect(cx + 7, cy - 10, 4, 28);

  // Face surface
  g.fillStyle(STONE_FACE, 0.80);
  g.fillRect(cx - 7, cy - 8, 14, 28);

  // Head — more irregular/rounded top
  g.fillStyle(STONE_MID, 0.92);
  g.fillEllipse(cx, cy - 16, 22, 12);
  g.fillStyle(STONE_FACE, 0.75);
  g.fillEllipse(cx - 1, cy - 17, 14, 9);

  // Lichen — more extensive on this stone (older?)
  g.fillStyle(LICHEN_GOLD, 0.65);
  g.fillEllipse(cx - 3, cy - 4, 8, 5);
  g.fillEllipse(cx + 4, cy + 2, 6, 4);
  g.fillStyle(LICHEN_PALE, 0.50);
  g.fillEllipse(cx - 5, cy + 6, 5, 3);
  g.fillEllipse(cx + 2, cy - 10, 5, 3);
  g.fillEllipse(cx - 2, cy + 14, 8, 4);

  // Moss — lower section
  g.fillStyle(MOSS_GREEN, 0.55);
  g.fillEllipse(cx - 4, cy + 10, 9, 5);
  g.fillEllipse(cx + 5, cy + 14, 7, 4);
  g.fillStyle(MOSS_PALE, 0.38);
  g.fillEllipse(cx, cy + 17, 6, 3);

  // No spiral on Stone B — different character
  // Instead: weathered pitting (small dark marks)
  g.fillStyle(STONE_DEEP, 0.45);
  g.fillCircle(cx - 1, cy - 2, 2);
  g.fillCircle(cx + 4, cy + 6, 2);
  g.fillCircle(cx - 3, cy + 4, 1.5);

  // Eyes — dimmer than Stone A (the companion, not the primary)
  g.fillStyle(EYE_AMBER, 0.55);
  g.fillEllipse(cx - 4, cy - 6, 4, 3);
  g.fillEllipse(cx + 4, cy - 6, 4, 3);
  g.fillStyle(EYE_GLOW, 0.65);
  g.fillCircle(cx - 3, cy - 6, 1);
  g.fillCircle(cx + 5, cy - 6, 1);
}

// ── Bakers ────────────────────────────────────────────────────────────

export function bakeBossTwinStoneA(scene: Phaser.Scene): void {
  const s = BOSS_TWIN_STONE_CANVAS_SIZE;
  const g = scene.add.graphics();
  drawBossTwinStoneA(g);
  g.generateTexture('boss_twin_stone_a', s, s);
  g.destroy();
}

export function bakeBossTwinStoneB(scene: Phaser.Scene): void {
  const s = BOSS_TWIN_STONE_CANVAS_SIZE;
  const g = scene.add.graphics();
  drawBossTwinStoneB(g);
  g.generateTexture('boss_twin_stone_b', s, s);
  g.destroy();
}
