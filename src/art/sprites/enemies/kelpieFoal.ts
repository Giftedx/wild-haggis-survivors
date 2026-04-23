/**
 * `kelpie_foal` — young kelpie, half-size of the boss. Design pivot:
 * old foal read as "cute little horse" — too soft for a water-demon
 * scout. New pitch — same compact scale, but MENACE cranked: bared
 * fang in a slightly open mouth, bigger luminous cyan eye with
 * glowing halo, kelp-strands mane dripping heavily, splash pool
 * under the hooves. Still unmistakably equine (four legs + horse
 * head silhouette) but reads "sinister water-spirit" not "My Little
 * Pony".
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const KELPIE_FOAL_CANVAS_SIZE = 36;

export function drawKelpieFoalBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = KELPIE_FOAL_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);
  const lly = frame.leftLegY ?? 0;  // front legs
  const rly = frame.rightLegY ?? 0; // back legs

  // ── Splash-pool under the hooves — water-spirit tell. Bigger
  // than before so the "of the loch" reads even at gameplay scale. ──
  g.fillStyle(0x1a3e5e, 0.5);
  g.fillEllipse(cx, cy + 13, 20, 5);
  g.fillStyle(0x3a6e90, 0.6);
  g.fillEllipse(cx, cy + 13, 16, 3);
  // Splash droplets around the pool
  g.fillStyle(0x8fd0f0, 0.75);
  g.fillCircle(cx - 10, cy + 11, 0.8);
  g.fillCircle(cx + 10, cy + 11, 0.8);
  g.fillCircle(cx - 7, cy + 15, 0.6);
  g.fillCircle(cx + 7, cy + 14, 0.6);

  // ── Blue-green water aura — threat halo. ──
  g.fillStyle(0x4a8ab0, 0.25);
  g.fillEllipse(cx, cy + 2, 28, 22);
  g.fillStyle(0x6fa0c0, 0.15);
  g.fillEllipse(cx, cy + 2, 32, 26);

  // ── Body — compact, dark indigo like loch water. Slightly more
  // oval than before (was too round → read as "foal"). ──
  g.fillStyle(0x0a1a28, 1);
  g.fillEllipse(cx, cy + 3, 18, 10);
  g.fillStyle(0x1a3850, 1);
  g.fillEllipse(cx, cy + 2, 16, 8);
  // Wet-coat dapples
  g.fillStyle(0x4a7ea0, 0.6);
  g.fillEllipse(cx - 4, cy, 5, 2);
  g.fillEllipse(cx + 3, cy + 1, 4, 2);

  // ── Legs — four thin ones with pale hooves. Slightly longer than
  // before for a menacing gait. ──
  // Back pair (rightLegY).
  g.fillStyle(0x0a1a28, 1);
  g.fillRect(cx - 8, cy + 6 + rly, 2, 8);
  g.fillRect(cx - 3, cy + 7 + rly, 2, 7);
  // Front pair (leftLegY).
  g.fillRect(cx + 1, cy + 7 + lly, 2, 7);
  g.fillRect(cx + 6, cy + 6 + lly, 2, 8);
  // Pale bone-white hooves — back pair.
  g.fillStyle(0xa0c8e0, 0.9);
  g.fillRect(cx - 8, cy + 13 + rly, 2, 1.5);
  g.fillRect(cx - 3, cy + 13 + rly, 2, 1.5);
  // Pale bone-white hooves — front pair.
  g.fillRect(cx + 1, cy + 13 + lly, 2, 1.5);
  g.fillRect(cx + 6, cy + 13 + lly, 2, 1.5);

  // ── Head — angled out-right, bigger than before so the face
  // details land at small scale. ──
  g.fillStyle(0x0a1a28, 1);
  g.fillEllipse(cx + 9, cy - 3, 9, 7);
  g.fillStyle(0x1a3850, 1);
  g.fillEllipse(cx + 9, cy - 4, 8, 5);
  // Snout/muzzle — narrower at the front
  g.fillStyle(0x0a1a28, 1);
  g.fillEllipse(cx + 12, cy - 2, 5, 3);
  g.fillStyle(0x1a3850, 1);
  g.fillEllipse(cx + 12, cy - 2.5, 4, 2);

  // ── Glowing cyan eye — BIGGER than before, with a soft glow halo
  // so it pops even at gameplay scale. ──
  g.fillStyle(0x8fe0ff, 0.4);
  g.fillCircle(cx + 10, cy - 4, 2.5);
  g.fillStyle(0xaff0ff, 1);
  g.fillCircle(cx + 10, cy - 4, 1.5);
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(cx + 10, cy - 4, 0.7);
  // Vertical slit pupil
  g.fillStyle(0x0a1a28, 1);
  g.fillRect(cx + 10 - 0.3, cy - 4.5, 0.6, 1.2);

  // ── Open mouth with ONE visible fang — the menace. ──
  g.fillStyle(0x1a0a14, 1);
  g.fillRect(cx + 13, cy - 1, 2.5, 1.5);
  g.fillStyle(0xf0e8c8, 1);
  g.fillRect(cx + 14, cy - 0.5, 0.8, 1.5);

  // ── Ears — tiny water-pointed, back-flat (pinned = aggressive). ──
  g.fillStyle(0x0a1a28, 1);
  g.fillTriangle(cx + 6, cy - 7, cx + 7, cy - 4, cx + 4, cy - 4);
  g.fillTriangle(cx + 10, cy - 7, cx + 11, cy - 4, cx + 9, cy - 4);

  // ── Mane — dripping seaweed strands down the neck. Heavier than
  // before, clearly "wet kelp" not "hair". ──
  g.fillStyle(0x2a5040, 1);
  g.fillRect(cx + 3, cy - 5, 1.2, 6);
  g.fillRect(cx + 5, cy - 6, 1.2, 6);
  g.fillRect(cx + 7, cy - 5, 1, 5);
  g.fillStyle(0x4a7060, 0.85);
  g.fillRect(cx + 3.5, cy - 5, 0.6, 5);
  g.fillRect(cx + 5.5, cy - 6, 0.6, 5);
  // Drip-tips at the end of each strand
  g.fillStyle(0x8fd0f0, 0.85);
  g.fillCircle(cx + 3.5, cy + 2, 0.7);
  g.fillCircle(cx + 5.5, cy + 1, 0.7);
  g.fillCircle(cx + 7.2, cy + 1.5, 0.6);

  // ── Tail — wispy water-tail trailing left. ──
  g.fillStyle(0x2a5040, 0.9);
  g.fillTriangle(cx - 8, cy + 2, cx - 14, cy, cx - 10, cy + 6);
  g.fillStyle(0x4a8ab0, 0.7);
  g.fillTriangle(cx - 8, cy + 3, cx - 12, cy + 1, cx - 9, cy + 5);
  // Tail-tip drip
  g.fillStyle(0x8fd0f0, 0.8);
  g.fillCircle(cx - 13, cy + 2, 0.7);
}

export function bakeKelpieFoal(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawKelpieFoalBody(g);
  g.generateTexture('kelpie_foal', KELPIE_FOAL_CANVAS_SIZE, KELPIE_FOAL_CANVAS_SIZE);
  g.destroy();
}
