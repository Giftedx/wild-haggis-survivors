/**
 * `buckfast_ned` — hooded gaunt face, tracksuit, gold chain, Buckfast bottle clutched tight. Gantry-at-Trongate identity.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const BUCKFAST_NED_CANVAS_SIZE = 44;

export function drawBuckfastNedBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = BUCKFAST_NED_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);
  const lly = frame.leftLegY ?? 0;
  const rly = frame.rightLegY ?? 0;

  // Tracksuit legs (navy with white stripe).
  g.fillStyle(0x0a1428, 1);
  g.fillRect(cx - 5, cy + 8 + lly, 4, 10);
  g.fillRect(cx + 1, cy + 8 + rly, 4, 10);
  g.fillStyle(0xdcdcdc, 1);
  g.fillRect(cx - 4, cy + 8 + lly, 1, 10);
  g.fillRect(cx + 2, cy + 8 + rly, 1, 10);
  // Trainers.
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(cx - 3, cy + 19 + lly, 5, 2);
  g.fillEllipse(cx + 3, cy + 19 + rly, 5, 2);

  // Tracksuit top (matching navy, hood up).
  g.fillStyle(0x0a1428, 1);
  g.fillRect(cx - 7, cy - 6, 14, 14);
  g.fillStyle(0x1a2438, 1);
  g.fillRect(cx - 6, cy - 5, 12, 12);
  // Adidas-style arm stripes — three thin white bands down the sleeves.
  g.fillStyle(0xdcdcdc, 0.85);
  g.fillRect(cx - 7, cy - 4, 1, 1);
  g.fillRect(cx - 7, cy - 2, 1, 1);
  g.fillRect(cx - 7, cy, 1, 1);
  g.fillRect(cx + 7, cy - 4, 1, 1);
  g.fillRect(cx + 7, cy - 2, 1, 1);
  g.fillRect(cx + 7, cy, 1, 1);
  // White chest zip.
  g.fillStyle(0xdcdcdc, 0.7);
  g.fillRect(cx, cy - 5, 1, 11);
  // Gold chain — heavy Sovereign-style link visible on the neckline.
  // The chain is a V of tiny gold segments + a small pendant.
  g.fillStyle(0xccaa22, 1);
  g.fillRect(cx - 4, cy - 5, 1, 1);
  g.fillRect(cx - 3, cy - 4, 1, 1);
  g.fillRect(cx - 2, cy - 3, 1, 1);
  g.fillRect(cx - 1, cy - 2, 1, 1);
  g.fillRect(cx + 1, cy - 2, 1, 1);
  g.fillRect(cx + 2, cy - 3, 1, 1);
  g.fillRect(cx + 3, cy - 4, 1, 1);
  g.fillRect(cx + 4, cy - 5, 1, 1);
  // Pendant — single brighter gold dot at the V of the chain.
  g.fillStyle(0xffdd44, 1);
  g.fillRect(cx, cy - 1, 1, 1);
  // Hood shadow framing the face.
  g.fillStyle(0x050810, 1);
  g.fillEllipse(cx, cy - 10, 12, 8);

  // Pale gaunt face in the hood (sharp cheekbones, sunk eyes).
  g.fillStyle(0xd8b89a, 1);
  g.fillEllipse(cx, cy - 10, 8, 6);
  // Cheekbone shadows — gaunt / hollow.
  g.fillStyle(0x8a6a4a, 0.4);
  g.fillRect(cx - 3, cy - 8, 2, 1);
  g.fillRect(cx + 2, cy - 8, 2, 1);
  g.fillStyle(0x111111, 1);
  g.fillCircle(cx - 2, cy - 10, 0.8);
  g.fillCircle(cx + 2, cy - 10, 0.8);
  // Dark under-eye circles — haunted ned stare.
  g.fillStyle(0x6a4832, 0.6);
  g.fillRect(cx - 3, cy - 9, 2, 1);
  g.fillRect(cx + 2, cy - 9, 2, 1);
  // Thin scowl.
  g.lineStyle(0.8, 0x222222, 1);
  g.lineBetween(cx - 1, cy - 7, cx + 2, cy - 7);

  // Buckfast bottle in right hand — dark green glass, cream label, gold foil.
  g.fillStyle(0x0a2a0a, 1);
  g.fillRect(cx + 7, cy - 1, 4, 11);
  g.fillStyle(0x1a4418, 1);
  g.fillRect(cx + 8, cy, 2, 9);
  g.fillStyle(0xeeddbb, 1);
  g.fillRect(cx + 7, cy + 3, 4, 3);
  g.fillStyle(0xccaa22, 1);
  g.fillRect(cx + 8, cy - 3, 2, 3);

}

export function bakeBuckfastNed(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawBuckfastNedBody(g);
  g.generateTexture('buckfast_ned', BUCKFAST_NED_CANVAS_SIZE, BUCKFAST_NED_CANVAS_SIZE);
  g.destroy();
}

/**
 * Traffic Cone Totem — DESIGN_IDEAS section 3 Urban Ghaists #2.
 * Three stacked Glasgow-orange traffic cones on a slick base. Static
 * (chase at speed 0) so the hit-response path stays standard. When
 * killed the totem collapses and spits four slick patches in the
 * cardinals (wired through EnemyKillHandler.onTotemFall).
 */
