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

  // Tracksuit legs (navy with bold double white stripe — Adidas
  // language survives at gameplay scale).
  g.fillStyle(0x0a1428, 1);
  g.fillRect(cx - 5, cy + 8 + lly, 4, 10);
  g.fillRect(cx + 1, cy + 8 + rly, 4, 10);
  // Two stripes per leg, brighter.
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 4.2, cy + 8 + lly, 0.8, 10);
  g.fillRect(cx - 2.8, cy + 8 + lly, 0.8, 10);
  g.fillRect(cx + 1.8, cy + 8 + rly, 0.8, 10);
  g.fillRect(cx + 3.2, cy + 8 + rly, 0.8, 10);
  // Trainers — white upper.
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(cx - 3, cy + 19 + lly, 5, 2);
  g.fillEllipse(cx + 3, cy + 19 + rly, 5, 2);
  // Trainer sole stripe — dark band underneath the upper sells the
  // shoe shape so the legs don't dissolve into the ground.
  g.fillStyle(0x080808, 1);
  g.fillRect(cx - 5.5, cy + 19.6 + lly, 5, 0.9);
  g.fillRect(cx + 0.5, cy + 19.6 + rly, 5, 0.9);
  // Bright sole accent (Sambas / classic 3-stripe vibe).
  g.fillStyle(0xff2244, 1);
  g.fillRect(cx - 5.0, cy + 19.6 + lly, 1.5, 0.5);
  g.fillRect(cx + 3.5, cy + 19.6 + rly, 1.5, 0.5);

  // Tracksuit top (matching navy, hood up) — wider shoulders so the
  // sprite reads as a person at gameplay scale rather than a thin pin.
  g.fillStyle(0x050810, 1);
  g.fillRoundedRect(cx - 10, cy - 7, 20, 16, 3);
  g.fillStyle(0x0a1428, 1);
  g.fillRoundedRect(cx - 9, cy - 6, 18, 15, 2.5);
  g.fillStyle(0x1a2438, 1);
  g.fillRoundedRect(cx - 7, cy - 5, 14, 13, 2);
  // Adidas-style arm stripes — three SOLID white bands running the
  // full sleeve length so the tracksuit reads at 1×.
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 9.2, cy - 5, 0.8, 11);
  g.fillRect(cx - 7.8, cy - 5, 0.8, 11);
  g.fillRect(cx - 6.4, cy - 5, 0.8, 11);
  g.fillRect(cx + 6.4, cy - 5, 0.8, 11);
  g.fillRect(cx + 7.8, cy - 5, 0.8, 11);
  g.fillRect(cx + 9.2, cy - 5, 0.8, 11);
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
  g.fillEllipse(cx, cy - 10, 15, 10);
  g.fillStyle(0x11182a, 1);
  g.fillEllipse(cx, cy - 10, 12, 8);

  // Pale gaunt face in the hood (sharp cheekbones, sunk eyes).
  g.fillStyle(0xd8b89a, 1);
  g.fillEllipse(cx, cy - 10, 9, 7);
  // HOOD SHADOW across upper face — the brow casts a dark band, so
  // only the lower face is fully lit. Sells "hood up".
  g.fillStyle(0x050810, 0.55);
  g.fillRect(cx - 4, cy - 12, 8, 2.5);
  g.fillStyle(0x050810, 0.35);
  g.fillEllipse(cx, cy - 11.6, 9, 2.2);
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

  // Left hand/fist breaks up the blocky torso.
  g.fillStyle(0xd8b89a, 1);
  g.fillCircle(cx - 10, cy + 1, 1.5);

  // Buckfast bottle in right hand — bigger, bolder so the prop
  // reads instantly. Dark green glass, cream label, gold foil cap.
  // Bottle outline (deep shadow).
  g.fillStyle(0x020a02, 1);
  g.fillRect(cx + 7, cy - 6, 8, 17);
  // Body — dark green glass.
  g.fillStyle(0x0a2a0a, 1);
  g.fillRect(cx + 7.5, cy - 5, 7, 16);
  g.fillStyle(0x1a4418, 1);
  g.fillRect(cx + 8.5, cy - 4, 5, 14);
  // Cream label — central band, dominant.
  g.fillStyle(0x2a1a0a, 1);
  g.fillRect(cx + 7.5, cy + 1, 7, 6);
  g.fillStyle(0xeeddbb, 1);
  g.fillRect(cx + 8, cy + 1.5, 6, 5);
  // Label text-bar (red Buckfast wordmark stand-in).
  g.fillStyle(0x8a1818, 1);
  g.fillRect(cx + 8.5, cy + 2.5, 5, 1);
  g.fillStyle(0x4a1010, 1);
  g.fillRect(cx + 8.5, cy + 4.5, 5, 0.6);
  // Gold foil cap — bigger.
  g.fillStyle(0x8a6a10, 1);
  g.fillRect(cx + 8.5, cy - 7, 5, 4);
  g.fillStyle(0xccaa22, 1);
  g.fillRect(cx + 8.5, cy - 6.5, 5, 3);
  g.fillStyle(0xffdd44, 1);
  g.fillRect(cx + 9, cy - 6, 1, 2.5);
  // Glass highlight — vertical sheen.
  g.fillStyle(0xffffff, 0.55);
  g.fillRect(cx + 8.5, cy - 4, 0.8, 14);
  // Hand grip on bottle — knuckles wrapping the neck.
  g.fillStyle(0xd8b89a, 1);
  g.fillEllipse(cx + 11, cy - 1.5, 4, 2);

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
