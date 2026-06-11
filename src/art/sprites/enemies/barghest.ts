/**
 * `barghest` — phantom hound with matted shadow-fur and two burning yellow eyes. Lower to the ground than a wolf.
 */

import * as Phaser from 'phaser';
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

  // Cold spectral rim — Grave-register halo so the silhouette holds
  // on dark backdrops (audit dislike: "outline depends on background").
  g.fillStyle(0x2a2438, 0.32);
  g.fillEllipse(cx, cy + 4, 30, 15);
  g.fillStyle(0x3a3050, 0.18);
  g.fillEllipse(cx, cy + 4, 34, 17);

  // Paw contact shadow — pool under the four feet so the hound feels
  // grounded mid-bound.
  g.fillStyle(0x000000, 0.45);
  g.fillEllipse(cx - 1, cy + 14, 22, 3);

  // Lean hound body — elongated ellipse, nearly black with an inner
  // gradient so the bulk reads as volume not silhouette.
  g.fillStyle(0x05050a, 1);
  g.fillEllipse(cx, cy + 4, 26, 12);
  g.fillStyle(0x121220, 1);
  g.fillEllipse(cx, cy + 3, 22, 10);
  // Top-light shoulder gradient — charcoal lifts on the upper curve.
  g.fillStyle(0x252238, 0.85);
  g.fillEllipse(cx, cy + 1, 18, 5);
  g.fillStyle(0x3a3450, 0.5);
  g.fillEllipse(cx - 1, cy, 14, 3);
  // Fur shadow hints — darker streaks along the back/flank.
  g.fillStyle(0x000004, 0.85);
  g.fillEllipse(cx - 6, cy + 5, 4, 2);
  g.fillEllipse(cx + 4, cy + 6, 4, 2);
  // Spine ridge — sharp dark stripe down the back.
  g.fillStyle(0x000004, 0.75);
  g.fillRect(cx - 8, cy - 1, 14, 0.6);

  // Legs — 4, scruffy and taut mid-bound. Wider so they don't dissolve.
  // Back pair (leftLegY mapped to back legs at left-side of body).
  g.fillStyle(0x050508, 1);
  g.fillRect(cx - 10, cy + 8 + rly, 2.5, 7);
  g.fillRect(cx - 4, cy + 9 + rly, 2.5, 6);
  // Front pair (rightLegY mapped to front legs near head).
  g.fillRect(cx + 2, cy + 9 + lly, 2.5, 6);
  g.fillRect(cx + 8, cy + 8 + lly, 2.5, 7);
  // Pale claw glints at each paw — keeps the legs from reading flat.
  g.fillStyle(0x6a6478, 0.85);
  g.fillRect(cx - 10, cy + 14 + rly, 2.5, 1);
  g.fillRect(cx - 4, cy + 14 + rly, 2.5, 1);
  g.fillRect(cx + 2, cy + 14 + lly, 2.5, 1);
  g.fillRect(cx + 8, cy + 14 + lly, 2.5, 1);

  // Tail — curling shadow behind, with a wisp tip.
  g.fillStyle(0x05050a, 1);
  g.fillTriangle(cx - 12, cy + 2, cx - 16, cy - 2, cx - 12, cy + 6);
  g.fillStyle(0x2a2438, 0.55);
  g.fillCircle(cx - 17, cy - 2, 1.3);

  // Head — low and forward, teeth bared. Lifted highlight on the brow.
  g.fillStyle(0x05050a, 1);
  g.fillEllipse(cx + 11, cy, 9, 7);
  g.fillStyle(0x141420, 1);
  g.fillEllipse(cx + 11, cy - 1, 7, 5);
  // Brow ridge top-light — separates skull from black body.
  g.fillStyle(0x2a2438, 0.85);
  g.fillEllipse(cx + 11, cy - 2.5, 5, 1.5);
  // Snout shadow under the jaw — defines the muzzle line.
  g.fillStyle(0x000002, 0.85);
  g.fillRect(cx + 12, cy + 2, 5, 0.7);

  // Ears — pointed, laid back, with a notched bite-scar in the right ear
  // (audit dislike: "ears clear" but no asymmetry — give it a tear).
  g.fillStyle(0x05050a, 1);
  g.fillTriangle(cx + 8, cy - 4, cx + 6, cy - 9, cx + 10, cy - 6);
  g.fillTriangle(cx + 13, cy - 4, cx + 16, cy - 9, cx + 15, cy - 5);
  // Notch carved into right ear — a fight survived.
  g.fillStyle(0x1a0a14, 1);
  g.fillTriangle(cx + 14.6, cy - 7, cx + 15.4, cy - 6, cx + 14.2, cy - 5.6);

  // Red eyes — the signature glow. Outer bloom for the colour hook.
  g.fillStyle(0xff5028, 0.45);
  g.fillCircle(cx + 10, cy - 1, 2.2);
  g.fillCircle(cx + 14, cy - 1, 2.2);
  g.fillStyle(0xcc0a00, 1);
  g.fillCircle(cx + 10, cy - 1, 1.2);
  g.fillCircle(cx + 14, cy - 1, 1.2);
  g.fillStyle(0xff3a20, 0.95);
  g.fillCircle(cx + 10, cy - 1, 0.6);
  g.fillCircle(cx + 14, cy - 1, 0.6);
  // Crisp white pinprick — sells the eye as a light source.
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx + 10, cy - 1.3, 0.25);
  g.fillCircle(cx + 14, cy - 1.3, 0.25);

  // Bared fangs — bigger, with a cool glint stripe so the white reads.
  g.fillStyle(0xe8e8e8, 1);
  g.fillTriangle(cx + 12.5, cy + 2, cx + 14, cy + 3.4, cx + 14, cy + 1);
  g.fillTriangle(cx + 14.5, cy + 2, cx + 16, cy + 3.4, cx + 16, cy + 1);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(cx + 13.2, cy + 1.4, 0.6, 1);
  g.fillRect(cx + 15.2, cy + 1.4, 0.6, 1);
  // Black mouth gap behind the fangs.
  g.fillStyle(0x000000, 1);
  g.fillRect(cx + 12.8, cy + 2.6, 3.4, 0.6);

  // Dive trail — spectral streaks behind, leaning purple-grey to read
  // on any background.
  g.fillStyle(0x4a3060, 0.4);
  g.fillRect(cx - 18, cy + 2, 4, 1);
  g.fillRect(cx - 20, cy + 5, 3, 1);
  g.fillStyle(0x6a508a, 0.25);
  g.fillRect(cx - 22, cy + 3, 3, 1);
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
