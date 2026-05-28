/**
 * `boss_nuckelavee` — Orcadian mythos boss #3: The Nuckelavee.
 *
 * The Nuckelavee is the most horrifying creature in Orcadian
 * mythology: a skinless man-horse chimera that rises from the sea.
 * The horse body carries a humanoid torso from its back — neither
 * part has skin; exposed muscle, sinew and black blood are visible
 * at all times. Its single eye burns red. Its breath causes drought,
 * crop failure and plague. The only thing that stops it is fresh
 * water — running burns are its bane.
 *
 * Ref: `SCOTTISH_RESEARCH.md §1.1`, `SCOTTISH_RESEARCH_DEEP.md` Part 4.
 *
 * Silhouette: wide horse body (low, hunched) with a skeletal human
 * torso rising at 20° forward-lean from the withers — the torso
 * arms hang, the head drops forward. No skin anywhere. The palette
 * is deep crimson / raw-muscle maroon against black sinew lines.
 * One oversized burning-red eye on the horse head; the human face is
 * eyeless (the Nuckelavee has one eye total — the horse's).
 *
 * Scale: 2.5 — the largest non-Taxman boss.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const BOSS_NUCKELAVEE_CANVAS_SIZE = 96;

// ── Palette (raw flesh, Orcadian dark, sea-black) ──────────────────
const VOID_BLACK     = 0x000000;
const SINEW_BLACK    = 0x120408;
const SINEW_EDGE     = 0x28100c;
const MUSCLE_DARK    = 0x3a0808;
const MUSCLE_MID     = 0x620c0c;
const MUSCLE_HI      = 0x961414;
const MUSCLE_BRIGHT  = 0xbc2020;
const BLOOD_BLACK    = 0x1a0404;
const BLOOD_DARK     = 0x300808;
const EYE_RED        = 0xff2020;
const EYE_GLOW       = 0xff7070;
const EYE_PUPIL      = 0x200000;
const BONE_OFF       = 0x6a5040;
const BONE_HI        = 0x9a7860;
const HOOF_BLACK     = 0x0c0804;
const HOOF_EDGE      = 0x241810;
const SEA_MIST       = 0x181428;

export function drawBossNuckelavee(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = BOSS_NUCKELAVEE_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 8 + (frame.breathY ?? 0);

  // ── Ground shadow (large — horse mass) ────────────────────────────
  g.fillStyle(VOID_BLACK, 0.6);
  g.fillEllipse(cx, cy + 34, 70, 10);
  g.fillStyle(VOID_BLACK, 0.3);
  g.fillEllipse(cx, cy + 37, 80, 14);

  // ── Sea-mist aura (creature carries the sea with it) ──────────────
  g.fillStyle(SEA_MIST, 0.18);
  g.fillEllipse(cx, cy + 10, 88, 58);
  g.fillStyle(SEA_MIST, 0.10);
  g.fillEllipse(cx, cy + 6, 74, 44);

  // ── Horse hindquarters ────────────────────────────────────────────
  // Haunch — wide, low, hunched
  g.fillStyle(SINEW_BLACK, 1);
  g.fillEllipse(cx + 24, cy + 18, 34, 28);
  g.fillStyle(MUSCLE_DARK, 1);
  g.fillEllipse(cx + 24, cy + 18, 32, 26);
  g.fillStyle(MUSCLE_MID, 1);
  g.fillEllipse(cx + 26, cy + 16, 26, 20);
  // Surface musculature lines (sinew bands — no skin)
  g.lineStyle(1.0, SINEW_EDGE, 0.85);
  g.lineBetween(cx + 14, cy + 10, cx + 30, cy + 22);
  g.lineBetween(cx + 18, cy + 8,  cx + 36, cy + 20);
  g.lineBetween(cx + 22, cy + 14, cx + 38, cy + 28);
  g.lineStyle(0.6, MUSCLE_BRIGHT, 0.35);
  g.lineBetween(cx + 16, cy + 10, cx + 28, cy + 20);

  // ── Horse body centre ─────────────────────────────────────────────
  g.fillStyle(SINEW_BLACK, 1);
  g.fillEllipse(cx, cy + 22, 52, 32);
  g.fillStyle(MUSCLE_DARK, 1);
  g.fillEllipse(cx, cy + 22, 50, 30);
  g.fillStyle(MUSCLE_MID, 1);
  g.fillEllipse(cx + 2, cy + 20, 44, 24);
  g.fillStyle(MUSCLE_HI, 0.6);
  g.fillEllipse(cx + 2, cy + 18, 34, 16);
  // Rib cage suggestion (no ribs — just sinew bands over the bulge)
  g.lineStyle(0.8, SINEW_EDGE, 0.7);
  g.lineBetween(cx - 10, cy + 12, cx - 14, cy + 28);
  g.lineBetween(cx - 4,  cy + 10, cx - 8,  cy + 26);
  g.lineBetween(cx + 2,  cy + 10, cx + 2,  cy + 26);
  g.lineBetween(cx + 8,  cy + 10, cx + 12, cy + 26);
  g.lineStyle(0.4, BLOOD_DARK, 0.55);
  g.lineBetween(cx - 6, cy + 14, cx - 10, cy + 24);
  g.lineBetween(cx + 4, cy + 12, cx + 6,  cy + 24);

  // ── Horse forequarters ────────────────────────────────────────────
  g.fillStyle(SINEW_BLACK, 1);
  g.fillEllipse(cx - 22, cy + 18, 28, 24);
  g.fillStyle(MUSCLE_DARK, 1);
  g.fillEllipse(cx - 22, cy + 18, 26, 22);
  g.fillStyle(MUSCLE_MID, 1);
  g.fillEllipse(cx - 24, cy + 16, 20, 16);

  // ── Horse neck (connects body to head — low, powerful) ────────────
  g.fillStyle(SINEW_BLACK, 1);
  g.fillTriangle(cx - 28, cy + 12, cx - 38, cy + 6, cx - 44, cy + 18);
  g.fillStyle(MUSCLE_DARK, 1);
  g.fillTriangle(cx - 28, cy + 12, cx - 37, cy + 7, cx - 43, cy + 17);
  g.fillStyle(MUSCLE_MID, 1);
  g.fillRect(cx - 40, cy + 8, 12, 10);

  // ── Horse head (elongated, skull-prominent, no skin) ──────────────
  // Skull base
  g.fillStyle(SINEW_BLACK, 1);
  g.fillEllipse(cx - 48, cy + 12, 18, 14);
  g.fillStyle(MUSCLE_DARK, 1);
  g.fillEllipse(cx - 48, cy + 12, 16, 12);
  // Muzzle — elongated, lipless (no soft tissue)
  g.fillStyle(BONE_OFF, 1);
  g.fillRect(cx - 56, cy + 13, 14, 6);
  g.fillStyle(BONE_HI, 0.7);
  g.fillRect(cx - 55, cy + 13, 12, 2);
  // Teeth visible (no lips)
  g.fillStyle(BONE_OFF, 1);
  g.fillRect(cx - 56, cy + 17, 2, 3);
  g.fillRect(cx - 53, cy + 17, 2, 3);
  g.fillRect(cx - 50, cy + 17, 2, 3);
  g.fillRect(cx - 47, cy + 17, 2, 3);
  // Nasal cartilage (bare bone ridge)
  g.fillStyle(BONE_HI, 0.55);
  g.fillRect(cx - 52, cy + 11, 10, 2);
  // The single burning eye — the most terrifying feature
  g.fillStyle(BLOOD_DARK, 1);
  g.fillCircle(cx - 44, cy + 8, 5);
  g.fillStyle(EYE_RED, 1);
  g.fillCircle(cx - 44, cy + 8, 4);
  g.fillStyle(EYE_GLOW, 0.7);
  g.fillCircle(cx - 44, cy + 7, 2.2);
  g.fillStyle(EYE_PUPIL, 1);
  g.fillCircle(cx - 43.4, cy + 8, 1.4);
  g.fillStyle(EYE_GLOW, 0.9);
  g.fillCircle(cx - 42.8, cy + 7, 0.5);
  // Eye glow spill (the eye lights the surrounding flesh)
  g.fillStyle(EYE_RED, 0.18);
  g.fillCircle(cx - 44, cy + 8, 8);

  // ── Horse legs (four — front two visible, back two partially) ─────
  // Front-left leg
  g.fillStyle(SINEW_BLACK, 1);
  g.fillRect(cx - 32, cy + 28, 6, 18);
  g.fillStyle(MUSCLE_DARK, 1);
  g.fillRect(cx - 31, cy + 28, 4, 17);
  g.fillStyle(SINEW_EDGE, 0.7);
  g.lineBetween(cx - 30, cy + 28, cx - 30, cy + 44);
  // Front-right leg
  g.fillStyle(SINEW_BLACK, 1);
  g.fillRect(cx - 18, cy + 28, 6, 18);
  g.fillStyle(MUSCLE_DARK, 1);
  g.fillRect(cx - 17, cy + 28, 4, 17);
  // Back-left leg
  g.fillStyle(SINEW_BLACK, 1);
  g.fillRect(cx + 12, cy + 28, 6, 18);
  g.fillStyle(BLOOD_DARK, 1);
  g.fillRect(cx + 13, cy + 28, 4, 17);
  // Back-right leg
  g.fillStyle(SINEW_BLACK, 1);
  g.fillRect(cx + 24, cy + 28, 6, 18);
  g.fillStyle(BLOOD_DARK, 1);
  g.fillRect(cx + 25, cy + 28, 4, 17);
  // Hooves (four)
  g.fillStyle(HOOF_BLACK, 1);
  g.fillRect(cx - 33, cy + 44, 8, 4);
  g.fillStyle(HOOF_EDGE, 1);
  g.fillRect(cx - 32, cy + 44, 6, 1.5);
  g.fillStyle(HOOF_BLACK, 1);
  g.fillRect(cx - 19, cy + 44, 8, 4);
  g.fillStyle(HOOF_EDGE, 1);
  g.fillRect(cx - 18, cy + 44, 6, 1.5);
  g.fillStyle(HOOF_BLACK, 1);
  g.fillRect(cx + 11, cy + 44, 8, 4);
  g.fillStyle(HOOF_EDGE, 1);
  g.fillRect(cx + 12, cy + 44, 6, 1.5);
  g.fillStyle(HOOF_BLACK, 1);
  g.fillRect(cx + 23, cy + 44, 8, 4);
  g.fillStyle(HOOF_EDGE, 1);
  g.fillRect(cx + 24, cy + 44, 6, 1.5);

  // ── Horse tail (vestigial — tendon and sinew, no hair) ─────────────
  g.lineStyle(2.5, SINEW_BLACK, 1);
  g.lineBetween(cx + 36, cy + 18, cx + 44, cy + 22);
  g.lineBetween(cx + 44, cy + 22, cx + 46, cy + 30);
  g.lineStyle(1.2, MUSCLE_DARK, 0.7);
  g.lineBetween(cx + 36, cy + 18, cx + 43, cy + 24);
  g.lineBetween(cx + 43, cy + 24, cx + 44, cy + 32);

  // ── Human torso rising from withers (forward-lean ~20°) ───────────
  // Torso spine root — where the human emerges from the horse
  const tx = cx - 10;
  const ty = cy + 6;

  // Pelvis merge (horse-into-torso junction, widened by the split)
  g.fillStyle(MUSCLE_DARK, 1);
  g.fillEllipse(tx, ty + 4, 22, 10);
  g.fillStyle(MUSCLE_MID, 1);
  g.fillEllipse(tx, ty + 4, 18, 8);

  // Spine column (visible — no skin)
  g.fillStyle(BONE_OFF, 1);
  g.fillRect(tx - 1.5, ty - 28, 3, 28);
  g.fillStyle(BONE_HI, 0.6);
  g.fillRect(tx - 0.5, ty - 26, 1, 24);
  // Vertebra knobs
  for (let i = 0; i < 5; i++) {
    g.fillStyle(BONE_OFF, 1);
    g.fillCircle(tx, ty - 4 - i * 5, 2);
    g.fillStyle(BONE_HI, 0.5);
    g.fillCircle(tx, ty - 4 - i * 5, 1);
  }

  // Ribcage (open, no skin — a cage of bone arcs)
  g.lineStyle(1.4, BONE_OFF, 0.9);
  // Left ribs
  g.lineBetween(tx - 1, ty - 20, tx - 10, ty - 12);
  g.lineBetween(tx - 1, ty - 15, tx - 11, ty - 8);
  g.lineBetween(tx - 1, ty - 10, tx - 10, ty - 4);
  g.lineBetween(tx - 1, ty - 5,  tx - 9,  ty);
  // Right ribs
  g.lineBetween(tx + 1, ty - 20, tx + 10, ty - 12);
  g.lineBetween(tx + 1, ty - 15, tx + 11, ty - 8);
  g.lineBetween(tx + 1, ty - 10, tx + 10, ty - 4);
  g.lineBetween(tx + 1, ty - 5,  tx + 9,  ty);
  // Rib-to-sternum cross joins (faint)
  g.lineStyle(0.6, BONE_HI, 0.4);
  g.lineBetween(tx - 10, ty - 12, tx + 10, ty - 12);
  g.lineBetween(tx - 11, ty - 8,  tx + 11, ty - 8);
  g.lineBetween(tx - 10, ty - 4,  tx + 10, ty - 4);

  // Muscle over ribs (visible but thin — no skin layer)
  g.fillStyle(MUSCLE_DARK, 0.7);
  g.fillEllipse(tx, ty - 14, 22, 26);
  g.fillStyle(MUSCLE_MID, 0.5);
  g.fillEllipse(tx, ty - 14, 18, 22);
  // Exposed sinew bands over the chest
  g.lineStyle(0.7, SINEW_EDGE, 0.8);
  g.lineBetween(tx - 6, ty - 20, tx - 8, ty - 4);
  g.lineBetween(tx + 6, ty - 20, tx + 8, ty - 4);
  g.lineStyle(0.4, MUSCLE_BRIGHT, 0.3);
  g.lineBetween(tx - 4, ty - 18, tx - 6, ty - 6);
  g.lineBetween(tx + 4, ty - 18, tx + 6, ty - 6);

  // Shoulders (exposed clavicle + deltoid mass)
  g.fillStyle(BONE_OFF, 1);
  g.lineBetween(tx - 12, ty - 20, tx + 12, ty - 20);
  g.fillStyle(MUSCLE_DARK, 1);
  g.fillCircle(tx - 12, ty - 20, 6);
  g.fillCircle(tx + 12, ty - 20, 6);
  g.fillStyle(MUSCLE_MID, 1);
  g.fillCircle(tx - 12, ty - 20, 4);
  g.fillCircle(tx + 12, ty - 20, 4);
  g.fillStyle(MUSCLE_HI, 0.6);
  g.fillCircle(tx - 12, ty - 20, 2.2);
  g.fillCircle(tx + 12, ty - 20, 2.2);

  // Arms (hanging loose — menacing by stillness)
  // Left arm
  g.fillStyle(SINEW_BLACK, 1);
  g.fillRect(tx - 17, ty - 20, 5, 28);
  g.fillStyle(MUSCLE_DARK, 1);
  g.fillRect(tx - 16, ty - 20, 3, 27);
  g.lineStyle(0.6, SINEW_EDGE, 0.7);
  g.lineBetween(tx - 15, ty - 18, tx - 15, ty + 4);
  // Right arm
  g.fillStyle(SINEW_BLACK, 1);
  g.fillRect(tx + 12, ty - 20, 5, 28);
  g.fillStyle(MUSCLE_DARK, 1);
  g.fillRect(tx + 13, ty - 20, 3, 27);
  g.lineStyle(0.6, SINEW_EDGE, 0.7);
  g.lineBetween(tx + 15, ty - 18, tx + 15, ty + 4);
  // Hands (splayed, fingerless-looking — dried sinew)
  g.fillStyle(SINEW_BLACK, 1);
  g.fillEllipse(tx - 14, ty + 8, 8, 5);
  g.fillStyle(SINEW_EDGE, 1);
  g.fillEllipse(tx + 15, ty + 8, 8, 5);

  // Human neck (short, thick — no skin, exposed trachea)
  g.fillStyle(SINEW_BLACK, 1);
  g.fillRect(tx - 5, ty - 32, 10, 12);
  g.fillStyle(MUSCLE_DARK, 1);
  g.fillRect(tx - 4, ty - 32, 8, 11);
  // Trachea cartilage rings
  g.fillStyle(BONE_OFF, 0.7);
  for (let i = 0; i < 3; i++) {
    g.fillRect(tx - 2, ty - 31 + i * 3.5, 4, 1.5);
  }

  // Human skull (the head that droops forward — no face visible except
  // the hollow orbital sockets. The Nuckelavee's one eye belongs to
  // the horse; the human part is blind and silent.)
  g.fillStyle(SINEW_BLACK, 1);
  g.fillEllipse(tx, ty - 40, 18, 16);
  g.fillStyle(BLOOD_DARK, 1);
  g.fillEllipse(tx, ty - 40, 16, 14);
  g.fillStyle(MUSCLE_DARK, 0.9);
  g.fillEllipse(tx, ty - 40, 14, 12);
  // Orbital sockets — hollow, dark, facing down in the droop
  g.fillStyle(VOID_BLACK, 1);
  g.fillEllipse(tx - 4, ty - 38, 5, 4);
  g.fillEllipse(tx + 4, ty - 38, 5, 4);
  // Mandible / jaw (exposed, slightly open)
  g.fillStyle(BONE_OFF, 0.85);
  g.fillRect(tx - 5, ty - 34, 10, 3);
  g.fillStyle(BONE_HI, 0.5);
  g.fillRect(tx - 4, ty - 34, 8, 1);

  // ── Dripping blood / ichor from the horse barrel ───────────────────
  // Three slow-drip streaks downward from the belly
  g.fillStyle(BLOOD_BLACK, 0.8);
  g.fillRect(cx - 8, cy + 34, 2, 6);
  g.fillRect(cx + 4, cy + 35, 1.5, 5);
  g.fillRect(cx + 14, cy + 34, 2, 7);
  g.fillStyle(MUSCLE_DARK, 0.5);
  g.fillRect(cx - 8,  cy + 38, 3, 2);
  g.fillRect(cx + 4,  cy + 39, 2.5, 2);
  g.fillRect(cx + 14, cy + 40, 3, 2);

  // ── Poison breath wisps trailing from the muzzle ──────────────────
  // Faint grey-green miasma that reads as the plague-breath pre-tell
  g.fillStyle(0x203018, 0.30);
  g.fillEllipse(cx - 64, cy + 12, 12, 8);
  g.fillStyle(0x304020, 0.20);
  g.fillEllipse(cx - 70, cy + 10, 8, 6);
  g.fillStyle(0x203018, 0.15);
  g.fillEllipse(cx - 68, cy + 16, 6, 5);
}

export function bakeBossNuckelavee(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawBossNuckelavee(g);
  g.generateTexture('boss_nuckelavee', BOSS_NUCKELAVEE_CANVAS_SIZE, BOSS_NUCKELAVEE_CANVAS_SIZE);
  g.destroy();
}
