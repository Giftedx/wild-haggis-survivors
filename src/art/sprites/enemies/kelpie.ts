/**
 * `kelpie` — loch water spirit in equine form. Simplified silhouette
 * (previous draft was 150 lines and read as visual noise at 48px):
 * dark bold body + signature cyan glowing eye + hoof puddle + brighter
 * cyan edge accents so the silhouette reads against dark terrain at
 * combat speed. Folklore: the shapeshifter that lures lone wanderers
 * into the loch.
 *
 * Detail-budget rule of thumb: nothing smaller than 2px survives the
 * 48×48 frame — teeth, nostrils, mane strands, seaweed tangles, and
 * ripple arcs were all invisible under actual gameplay and have been
 * removed. What's left is the silhouette plus the cyan eye read.
 */

import Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const KELPIE_CANVAS_SIZE = 48;

export function drawKelpieBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = KELPIE_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);
  const lly = frame.leftLegY ?? 0;  // front pair
  const rly = frame.rightLegY ?? 0; // back pair

  // ── Water-spirit underglow — the "this is magical" tell. ──
  g.fillStyle(0x4a8ab0, 0.22);
  g.fillEllipse(cx, cy + 2, 38, 30);
  g.fillStyle(0x6fa0c0, 0.15);
  g.fillEllipse(cx, cy + 2, 28, 20);

  // ── Hoof puddle — kelpie is always wet. Two ellipses, no ripple
  //   arcs (the 0.8px lines disappeared at gameplay scale). ──
  g.fillStyle(0x103348, 0.6);
  g.fillEllipse(cx, cy + 17, 30, 5);
  g.fillStyle(0x3a6590, 0.45);
  g.fillEllipse(cx, cy + 17, 20, 3);

  // ── Legs — 4 dark columns, bright cyan hocks for edge definition.
  //   Pale hock band is the strongest silhouette cue against dark
  //   terrain (heather, stone, pine). ──
  g.fillStyle(0x0a1828, 1);
  g.fillRect(cx - 10, cy + 5 + lly, 3, 12);
  g.fillRect(cx - 4, cy + 7 + lly, 3, 10);
  g.fillRect(cx + 2, cy + 7 + rly, 3, 10);
  g.fillRect(cx + 8, cy + 5 + rly, 3, 12);
  g.fillStyle(0x88d0e8, 0.9);
  g.fillRect(cx - 10, cy + 15 + lly, 3, 2);
  g.fillRect(cx - 4, cy + 15 + lly, 3, 2);
  g.fillRect(cx + 2, cy + 15 + rly, 3, 2);
  g.fillRect(cx + 8, cy + 15 + rly, 3, 2);

  // ── Body — two layers. Darker base (was three, middle layer read
  //   as mud at 48px) plus a slim spine highlight for edge read. ──
  g.fillStyle(0x0a1828, 1);
  g.fillEllipse(cx, cy + 5, 28, 14);
  g.fillStyle(0x2a4c70, 1);
  g.fillEllipse(cx - 1, cy + 4, 24, 11);
  g.fillStyle(0x6fa8d0, 0.65);
  g.fillEllipse(cx - 3, cy + 1, 14, 3);

  // ── Neck — single triangle rising to head. ──
  g.fillStyle(0x0a1828, 1);
  g.fillTriangle(cx + 8, cy - 4, cx + 4, cy + 5, cx + 13, cy + 3);
  g.fillStyle(0x2a4c70, 1);
  g.fillTriangle(cx + 9, cy - 3, cx + 6, cy + 4, cx + 12, cy + 3);

  // ── Head — one layer (was three). Bony forehead ridge, nostril,
  //   muzzle stripe, and jagged teeth were all sub-2px and invisible
  //   in combat; cut. Silhouette + cyan eye carry the read. ──
  g.fillStyle(0x0a1828, 1);
  g.fillEllipse(cx + 16, cy - 4, 12, 7);
  g.fillStyle(0x2a4c70, 1);
  g.fillEllipse(cx + 15, cy - 5, 9, 5);

  // ── Ear — one pricked triangle (was two layers). ──
  g.fillStyle(0x0a1828, 1);
  g.fillTriangle(cx + 11, cy - 8, cx + 9, cy - 3, cx + 13, cy - 5);

  // ── Glowing cyan eye — THE signature tell. Sized up slightly and
  //   with a brighter white highlight so the silhouette has one
  //   anchor point the player tracks at speed. ──
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx + 13, cy - 6, 2.2);
  g.fillStyle(0x44ddcc, 1);
  g.fillCircle(cx + 13, cy - 6, 1.5);
  g.fillStyle(0x9ff0ff, 1);
  g.fillCircle(cx + 12.7, cy - 6.3, 0.8);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx + 12.5, cy - 6.5, 0.4);

  // ── Mane — single dark shape. No individual strands (the 1-2px
  //   water columns + seaweed bars were noise, not signal). ──
  g.fillStyle(0x050810, 1);
  g.fillEllipse(cx + 2, cy - 3, 14, 9);
  g.fillStyle(0x1a3348, 1);
  g.fillEllipse(cx + 1, cy - 4, 12, 7);

  // ── Tail — one wispy triangle trailing behind. ──
  g.fillStyle(0x0a1828, 1);
  g.fillTriangle(cx - 13, cy + 2, cx - 17, cy + 1, cx - 11, cy + 8);
  g.fillStyle(0x3a6590, 0.75);
  g.fillTriangle(cx - 12, cy + 3, cx - 15, cy + 3, cx - 11, cy + 7);

  // ── Dripping water — three bright cyan droplets (was seven mixed).
  //   Brighter accent color survives the underglow and reads. ──
  g.fillStyle(0x88d0e8, 0.85);
  g.fillCircle(cx + 6, cy + 13, 1);
  g.fillCircle(cx - 4, cy + 13, 0.9);
  g.fillCircle(cx + 17, cy - 2, 0.8);
}

export function bakeKelpie(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawKelpieBody(g);
  g.generateTexture('kelpie', KELPIE_CANVAS_SIZE, KELPIE_CANVAS_SIZE);
  g.destroy();
}
