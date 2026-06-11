/**
 * `boss_each_uisge` — N1 Mythos Tier-2 boss #1: Fey register, the
 * water-horse of Highland folklore (SCOTTISH_RESEARCH.md:56).
 *
 * A beautiful black stallion shape with a cold loch-blue rim shimmer
 * — Fey palette anchors per ART_STYLE_BIBLE.md:65-73. Hooves point
 * faintly backwards (the folkloric tell that warns the watchful).
 * White mane shimmer carries iridescent loch tones rather than warm
 * highlights — this is not a normal horse. Drawn at 80px to match
 * existing boss sprite canvas.
 *
 * Phase transition (rider form, 60% HP) is deferred to the M2 follow-up
 * — proof boss ships in horse form using `behaviorOverride: 'phase'`
 * for the shapeshifter blink.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const BOSS_EACH_UISGE_CANVAS_SIZE = 80;

// ── Palette (Fey, loch-tinted) ────────────────────────────────────────
const SHADOW_DEEP = 0x000000;
const COAT_OUTLINE = 0x05060a;
const COAT_DARK = 0x0a0e18;
const COAT_MID = 0x141a2a;
const COAT_HI = 0x222a3e;
const LOCH_GLOW_DEEP = 0x1a3060;
const LOCH_GLOW_MID = 0x4a70ff;
const LOCH_GLOW_HI = 0x9ac0ff;
const MANE_DARK = 0x162038;
const MANE_MID = 0x2c4878;
const MANE_HI = 0xb8d4f8;
const HOOF_RIM = 0x6a7080;
const HOOF_WHITE = 0xe8ecf2;
const EYE_RIM = 0x8a4a18;
const EYE_GLOW = 0xff8a3a;
const EYE_PUPIL = 0x080404;
const TEETH_DULL = 0xc8c4b0;
const NOSTRIL = 0x1a1014;
const WATER_DROP = 0xa8d8f0;

export function drawBossEachUisge(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = BOSS_EACH_UISGE_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 4 + (frame.breathY ?? 0);

  // ── Loch shimmer aura (rendered first, behind body) ─────────────────
  // Tells the Fey nature without screaming it — soft cold glow lifts
  // the silhouette off the moor.
  g.fillStyle(LOCH_GLOW_DEEP, 0.25);
  g.fillEllipse(cx, cy + 2, 60, 36);
  g.fillStyle(LOCH_GLOW_MID, 0.18);
  g.fillEllipse(cx, cy + 2, 50, 28);

  // ── Ground shadow (darker than usual — Each-uisge drips loch water) ─
  g.fillStyle(SHADOW_DEEP, 0.55);
  g.fillEllipse(cx, cy + 30, 32, 5);
  g.fillStyle(SHADOW_DEEP, 0.28);
  g.fillEllipse(cx, cy + 32, 40, 7);
  // Loch-water sheen under the boss
  g.fillStyle(WATER_DROP, 0.35);
  g.fillEllipse(cx - 6, cy + 31, 6, 1.4);
  g.fillEllipse(cx + 8, cy + 31, 5, 1.2);

  // ── Body (barrel) ───────────────────────────────────────────────────
  g.fillStyle(COAT_OUTLINE, 1);
  g.fillEllipse(cx, cy + 4, 38, 22);
  g.fillStyle(COAT_DARK, 1);
  g.fillEllipse(cx, cy + 4, 34, 19);
  g.fillStyle(COAT_MID, 1);
  g.fillEllipse(cx - 2, cy + 2, 28, 14);
  // Dorsal rim light — loch-tinted, never warm
  g.fillStyle(COAT_HI, 0.85);
  g.fillEllipse(cx - 4, cy - 2, 18, 4);
  g.fillStyle(LOCH_GLOW_HI, 0.45);
  g.fillEllipse(cx - 4, cy - 3, 14, 2);

  // ── Forequarters (chest mass leading the silhouette) ───────────────
  g.fillStyle(COAT_OUTLINE, 1);
  g.fillCircle(cx + 16, cy + 2, 11);
  g.fillStyle(COAT_DARK, 1);
  g.fillCircle(cx + 16, cy + 2, 9.5);
  g.fillStyle(COAT_MID, 1);
  g.fillCircle(cx + 14, cy, 7);

  // ── Neck (arched, proud) ────────────────────────────────────────────
  g.fillStyle(COAT_OUTLINE, 1);
  g.fillTriangle(cx + 12, cy - 6, cx + 28, cy - 18, cx + 22, cy + 2);
  g.fillStyle(COAT_DARK, 1);
  g.fillTriangle(cx + 13, cy - 5, cx + 27, cy - 16, cx + 21, cy + 1);
  g.fillStyle(COAT_MID, 1);
  g.fillTriangle(cx + 14, cy - 4, cx + 25, cy - 14, cx + 19, cy);

  // ── Head (long muzzle, head turned slightly toward camera) ─────────
  g.fillStyle(COAT_OUTLINE, 1);
  g.fillEllipse(cx + 28, cy - 18, 10, 16);
  g.fillStyle(COAT_DARK, 1);
  g.fillEllipse(cx + 28, cy - 18, 8.5, 14);
  g.fillStyle(COAT_MID, 1);
  g.fillEllipse(cx + 27, cy - 19, 6, 11);
  // Muzzle tip
  g.fillStyle(COAT_OUTLINE, 1);
  g.fillEllipse(cx + 29, cy - 26, 5, 4);
  g.fillStyle(COAT_DARK, 1);
  g.fillEllipse(cx + 29, cy - 26, 4, 3);

  // Nostril
  g.fillStyle(NOSTRIL, 1);
  g.fillEllipse(cx + 29, cy - 25, 1.4, 2);

  // ── Eye (the cold orange glow that gives it away) ──────────────────
  g.fillStyle(EYE_RIM, 1);
  g.fillCircle(cx + 26, cy - 18, 2.2);
  g.fillStyle(EYE_GLOW, 0.95);
  g.fillCircle(cx + 26, cy - 18, 1.6);
  g.fillStyle(EYE_PUPIL, 1);
  g.fillCircle(cx + 26, cy - 18, 0.7);
  // Eye glint — sells the wet shine
  g.fillStyle(0xffffff, 0.85);
  g.fillRect(cx + 25.5, cy - 18.6, 0.5, 0.5);

  // Teeth peeking — predator detail, half-hidden
  g.fillStyle(TEETH_DULL, 0.9);
  g.fillRect(cx + 28, cy - 23, 1, 1.2);
  g.fillRect(cx + 30, cy - 23, 0.8, 1);

  // ── Mane (loch-tinted, flowing toward the back) ────────────────────
  g.fillStyle(MANE_DARK, 1);
  g.fillTriangle(cx + 18, cy - 14, cx + 6, cy - 20, cx + 10, cy - 8);
  g.fillTriangle(cx + 12, cy - 16, cx - 2, cy - 18, cx + 8, cy - 6);
  g.fillStyle(MANE_MID, 1);
  g.fillTriangle(cx + 16, cy - 12, cx + 4, cy - 18, cx + 9, cy - 7);
  // Mane shimmer strands — cold blue, not warm
  g.lineStyle(0.8, MANE_HI, 0.6);
  g.lineBetween(cx + 14, cy - 10, cx + 2, cy - 16);
  g.lineBetween(cx + 13, cy - 8, cx, cy - 12);
  g.lineBetween(cx + 11, cy - 6, cx - 2, cy - 10);
  g.lineStyle(0.6, LOCH_GLOW_HI, 0.45);
  g.lineBetween(cx + 12, cy - 12, cx + 1, cy - 17);

  // ── Forelock (between the ears) ────────────────────────────────────
  g.fillStyle(MANE_DARK, 1);
  g.fillTriangle(cx + 24, cy - 22, cx + 27, cy - 26, cx + 26, cy - 20);
  g.lineStyle(0.6, MANE_HI, 0.5);
  g.lineBetween(cx + 25, cy - 24, cx + 26, cy - 21);

  // ── Ears ────────────────────────────────────────────────────────────
  g.fillStyle(COAT_OUTLINE, 1);
  g.fillTriangle(cx + 22, cy - 22, cx + 24, cy - 28, cx + 26, cy - 22);
  g.fillTriangle(cx + 30, cy - 22, cx + 32, cy - 27, cx + 33, cy - 21);
  g.fillStyle(COAT_DARK, 1);
  g.fillTriangle(cx + 23, cy - 22, cx + 24.5, cy - 27, cx + 25.5, cy - 22);

  // ── Legs (four — stylised columns; the front-right hoof is the
  // "tell": its specular hint sits BEHIND the leg silhouette,
  // suggesting the hoof points the wrong way). ───────────────────────
  // Back legs (further from camera — darker, smaller)
  g.fillStyle(COAT_OUTLINE, 1);
  g.fillRect(cx - 14, cy + 10, 4, 18);
  g.fillRect(cx - 6, cy + 12, 4, 16);
  g.fillStyle(COAT_DARK, 1);
  g.fillRect(cx - 13.5, cy + 10, 3, 17);
  g.fillRect(cx - 5.5, cy + 12, 3, 15);

  // Front legs (closer — bigger, lit)
  g.fillStyle(COAT_OUTLINE, 1);
  g.fillRect(cx + 8, cy + 10, 4.5, 19);
  g.fillRect(cx + 16, cy + 10, 4.5, 19);
  g.fillStyle(COAT_DARK, 1);
  g.fillRect(cx + 8.4, cy + 10, 3.7, 18);
  g.fillRect(cx + 16.4, cy + 10, 3.7, 18);
  g.fillStyle(COAT_MID, 1);
  g.fillRect(cx + 8.6, cy + 10, 1, 16);
  g.fillRect(cx + 16.6, cy + 10, 1, 16);

  // ── Hooves (white-bone — beautiful, conspicuous) ───────────────────
  g.fillStyle(HOOF_RIM, 1);
  g.fillRect(cx - 14.4, cy + 26, 4.5, 3);
  g.fillRect(cx - 6.4, cy + 26, 4.5, 3);
  g.fillRect(cx + 7.6, cy + 27, 5.2, 3.4);
  g.fillRect(cx + 15.6, cy + 27, 5.2, 3.4);
  g.fillStyle(HOOF_WHITE, 1);
  g.fillRect(cx - 14, cy + 26.4, 3.6, 2.4);
  g.fillRect(cx - 6, cy + 26.4, 3.6, 2.4);
  g.fillRect(cx + 8, cy + 27.4, 4.4, 2.6);
  g.fillRect(cx + 16, cy + 27.4, 4.4, 2.6);
  // Backwards-hoof tell — a faint shadow line on the BACK of the front
  // hooves where the toe should bevel forward but doesn't.
  g.fillStyle(SHADOW_DEEP, 0.65);
  g.fillRect(cx + 12.0, cy + 27.4, 0.4, 2.6);
  g.fillRect(cx + 20.0, cy + 27.4, 0.4, 2.6);

  // ── Tail (loch-shimmered streamer) ─────────────────────────────────
  g.fillStyle(MANE_DARK, 1);
  g.fillTriangle(cx - 18, cy + 0, cx - 30, cy + 8, cx - 16, cy + 8);
  g.fillStyle(MANE_MID, 1);
  g.fillTriangle(cx - 18, cy + 1, cx - 28, cy + 7, cx - 17, cy + 7);
  g.lineStyle(0.7, MANE_HI, 0.55);
  g.lineBetween(cx - 18, cy + 3, cx - 27, cy + 6);
  g.lineBetween(cx - 18, cy + 5, cx - 26, cy + 7);
  g.lineStyle(0.5, LOCH_GLOW_HI, 0.35);
  g.lineBetween(cx - 19, cy + 4, cx - 26, cy + 5);

  // ── Single water drop falling from the tail tip ────────────────────
  g.fillStyle(WATER_DROP, 0.95);
  g.fillEllipse(cx - 28, cy + 12, 1.2, 1.8);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx - 28.2, cy + 11.4, 0.4);

  // ── Final dorsal loch-glint (top edge) ─────────────────────────────
  g.fillStyle(LOCH_GLOW_HI, 0.35);
  g.fillEllipse(cx - 2, cy - 5, 12, 1.4);
}

export function bakeBossEachUisge(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawBossEachUisge(g);
  g.generateTexture('boss_each_uisge', BOSS_EACH_UISGE_CANVAS_SIZE, BOSS_EACH_UISGE_CANVAS_SIZE);
  g.destroy();
}
