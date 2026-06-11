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

  // ── Body — compact, dark indigo like loch water. Pale belly stripe
  // separates the foal palette from the kelpie boss (audit dislike:
  // "palette overlaps kelpie"). ──
  g.fillStyle(0x0a1a28, 1);
  g.fillEllipse(cx, cy + 3, 18, 10);
  g.fillStyle(0x1a3850, 1);
  g.fillEllipse(cx, cy + 2, 16, 8);
  // Pale belly band — foal-cue (lighter underside is a young-mammal
  // signal, separates from the boss's solid dark-water mass).
  g.fillStyle(0x6a98b8, 0.85);
  g.fillEllipse(cx, cy + 5.5, 12, 3);
  g.fillStyle(0x9ac0d8, 0.55);
  g.fillEllipse(cx, cy + 6, 9, 1.6);
  // Wet-coat dapples
  g.fillStyle(0x4a7ea0, 0.6);
  g.fillEllipse(cx - 4, cy, 5, 2);
  g.fillEllipse(cx + 3, cy + 1, 4, 2);

  // ── Legs — four with knee detail and slight wobble (foal proportion:
  // head:leg ratio favours head). Slightly thicker than before so
  // they don't read as toothpicks. ──
  // Back pair (rightLegY).
  g.fillStyle(0x05101a, 1);
  g.fillRect(cx - 8, cy + 6 + rly, 2.5, 7);
  g.fillRect(cx - 3, cy + 7 + rly, 2.5, 6);
  // Front pair (leftLegY) — slightly shorter to enforce foal silhouette.
  g.fillRect(cx + 1, cy + 7 + lly, 2.5, 6);
  g.fillRect(cx + 6, cy + 6 + lly, 2.5, 7);
  // Knee-knobs — small lighter knobble mid-leg sells "young legs".
  g.fillStyle(0x3a6080, 0.85);
  g.fillCircle(cx - 6.7, cy + 9 + rly, 0.7);
  g.fillCircle(cx - 1.7, cy + 9.5 + rly, 0.6);
  g.fillCircle(cx + 2.3, cy + 9.5 + lly, 0.6);
  g.fillCircle(cx + 7.3, cy + 9 + lly, 0.7);
  // Pale bone-white hooves with a darker bottom rim — back pair.
  g.fillStyle(0x4a7090, 1);
  g.fillRect(cx - 8, cy + 13 + rly, 2.5, 0.4);
  g.fillRect(cx - 3, cy + 13 + rly, 2.5, 0.4);
  g.fillStyle(0xb0d0e8, 1);
  g.fillRect(cx - 8, cy + 13.4 + rly, 2.5, 1.4);
  g.fillRect(cx - 3, cy + 13.4 + rly, 2.5, 1.4);
  // Front pair.
  g.fillStyle(0x4a7090, 1);
  g.fillRect(cx + 1, cy + 13 + lly, 2.5, 0.4);
  g.fillRect(cx + 6, cy + 13 + lly, 2.5, 0.4);
  g.fillStyle(0xb0d0e8, 1);
  g.fillRect(cx + 1, cy + 13.4 + lly, 2.5, 1.4);
  g.fillRect(cx + 6, cy + 13.4 + lly, 2.5, 1.4);

  // ── Head — angled out-right, BIGGER (foal proportion: oversized
  // head on short legs is the cuteness/cuckoo signal). Audit dislike:
  // "foal cue is subtle". ──
  g.fillStyle(0x0a1a28, 1);
  g.fillEllipse(cx + 9, cy - 3, 10.5, 8);
  g.fillStyle(0x1a3850, 1);
  g.fillEllipse(cx + 9, cy - 4, 9, 6);
  // Cheek-fur clump — soft fluffy outline on the back of the cheek
  // breaks the smooth "helmet" silhouette (audit dislike: "head can
  // read as helmet").
  g.fillStyle(0x1a3850, 0.85);
  g.fillCircle(cx + 5, cy - 2, 1.6);
  g.fillStyle(0x2a5070, 0.7);
  g.fillCircle(cx + 5, cy - 2.5, 1);
  // Snout/muzzle — narrower at the front, with a paler nose
  g.fillStyle(0x0a1a28, 1);
  g.fillEllipse(cx + 12, cy - 2, 5.5, 3.2);
  g.fillStyle(0x1a3850, 1);
  g.fillEllipse(cx + 12, cy - 2.5, 4.4, 2.2);
  // Pale muzzle stripe — foal-cue (young equids have lighter muzzles).
  g.fillStyle(0x6a98b8, 0.85);
  g.fillEllipse(cx + 13, cy - 2, 2.4, 1.4);
  // Nostril dot — depth on the snout.
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx + 13.6, cy - 2, 0.4);
  // Forelock — a wet kelp tuft drooping between the ears, breaks
  // the helmet silhouette and adds wild-water-spirit identity.
  g.fillStyle(0x2a5040, 1);
  g.fillTriangle(cx + 7, cy - 8, cx + 8, cy - 8, cx + 7.5, cy - 4);
  g.fillStyle(0x4a7060, 0.85);
  g.fillRect(cx + 7.4, cy - 7.6, 0.4, 3);
  // Forelock drip
  g.fillStyle(0x8fd0f0, 0.8);
  g.fillCircle(cx + 7.5, cy - 3.5, 0.6);

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
