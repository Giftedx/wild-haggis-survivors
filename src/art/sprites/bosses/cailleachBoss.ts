/**
 * `boss_cailleach` — Cailleach Gauntlet boss (V2 of The Moor Remembers).
 *
 * The mythological Cailleach Bheur — winter crone, mountain goddess,
 * shaper of the land. Distinct from the playable `cailleach` haggis
 * variant: this is the actual figure, tall and robed, who answers
 * when seven cairn-stones are touched in a single run.
 *
 * Spec: `docs/superpowers/specs/2026-05-22-moor-remembers-v2-design.md`.
 *
 * Design notes:
 *  - Tall hooded crone with antler-topped staff. Slow advance — the
 *    danger is presence, not pursuit. Sister-silhouette to Nicnevin
 *    (both tall, both T2) but distinct: Nicnevin is purple-Unseelie
 *    void; Cailleach is frost-slate winter, paler and colder.
 *  - Ice-blue formant rim — the same hex range her ice-lance projectile
 *    uses, so the visual chain reads consistently across boss + lance.
 *  - Antlers atop ironwood staff: the bone-white tines reference the
 *    Cailleach-as-deer mythology (she takes deer-form in some tales),
 *    rendered as part of her authority not her body.
 *
 * Palette anchored to ART_STYLE_BIBLE.md Winter / Frost extension:
 *  - Robe: slate-blue with cool shadow falling toward indigo-black.
 *  - Hood: deeper slate, near-black at the inner shadow.
 *  - Hair: frost-white, wisps at the face edge.
 *  - Face: pale skin, almost grey — the colour of long cold.
 *  - Eyes: ice-blue pinpoints — the only saturated reading on the face.
 *  - Staff: ironwood with bone antler atop.
 */
import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const BOSS_CAILLEACH_CANVAS_SIZE = 80;

// ── Palette (Winter / Frost) ──────────────────────────────────────────
const SHADOW_DEEP = 0x000000;
const FROST_RIM_DEEP = 0x0a1018;
const ROBE_OUTLINE = 0x0a141c;
const ROBE_DEEP = 0x1a2838;
const ROBE_MID = 0x3c4a5a;
const ROBE_HI = 0x6a7a8a;
const HOOD_DEEP = 0x0a1424;
const HOOD_MID = 0x14202c;
const SKIN_PALE = 0xa8a098;
const SKIN_HI = 0xc4bcb4;
const HAIR_FROST = 0xe8f0f5;
const HAIR_HI = 0xfafdff;
const EYE_ICE = 0x88c8e6;
const EYE_HI = 0xe8f8ff;
const STAFF_IRON = 0x4a3525;
const STAFF_HI = 0x6e5238;
const ANTLER_BONE = 0xd8c8a0;
const ANTLER_HI = 0xf0e4c0;
const RIM_ICE = 0xb9d6f0;
const RIM_HI = 0xe8f5ff;
const SMOKE_HEM = 0x1a202a;

export function drawBossCailleach(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = BOSS_CAILLEACH_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 6 + (frame.breathY ?? 0);

  // ── Cold halo (rendered first; she carries the chill of the peak) ──
  g.fillStyle(RIM_ICE, 0.16);
  g.fillEllipse(cx, cy + 2, 60, 36);
  g.fillStyle(EYE_ICE, 0.20);
  g.fillEllipse(cx, cy + 4, 46, 28);

  // ── Ground shadow ─────────────────────────────────────────────────
  g.fillStyle(SHADOW_DEEP, 0.55);
  g.fillEllipse(cx, cy + 33, 28, 5);
  g.fillStyle(SHADOW_DEEP, 0.28);
  g.fillEllipse(cx, cy + 35, 36, 7);

  // ── Smoke hem (robe bleeds into ground frost) ─────────────────────
  g.fillStyle(SMOKE_HEM, 0.65);
  g.fillEllipse(cx, cy + 28, 30, 8);
  g.fillStyle(ROBE_DEEP, 0.85);
  g.fillEllipse(cx, cy + 26, 26, 6);

  // ── Robe body (long triangular silhouette — austere, mountainous) ─
  g.fillStyle(ROBE_OUTLINE, 1);
  g.fillTriangle(cx - 17, cy + 26, cx + 17, cy + 26, cx, cy - 4);
  g.fillStyle(ROBE_DEEP, 1);
  g.fillTriangle(cx - 15, cy + 25, cx + 15, cy + 25, cx, cy - 3);
  g.fillStyle(ROBE_MID, 1);
  g.fillTriangle(cx - 12, cy + 22, cx + 12, cy + 22, cx, cy - 1);

  // Centre-front lighter panel
  g.fillStyle(ROBE_HI, 0.35);
  g.fillTriangle(cx - 4, cy + 18, cx + 4, cy + 18, cx, cy + 2);

  // ── Ice rim-light along robe edge ─────────────────────────────────
  g.fillStyle(RIM_ICE, 0.45);
  g.fillTriangle(cx - 17, cy + 26, cx - 15, cy + 26, cx - 1, cy - 3);
  g.fillStyle(RIM_ICE, 0.45);
  g.fillTriangle(cx + 17, cy + 26, cx + 15, cy + 26, cx + 1, cy - 3);
  g.fillStyle(RIM_HI, 0.40);
  g.fillTriangle(cx - 6, cy - 3, cx - 4, cy - 3, cx - 1, cy + 6);
  g.fillTriangle(cx + 6, cy - 3, cx + 4, cy - 3, cx + 1, cy + 6);

  // ── Hem trim ──────────────────────────────────────────────────────
  g.fillStyle(FROST_RIM_DEEP, 1);
  g.fillRect(cx - 14, cy + 22, 28, 1.4);
  g.fillStyle(RIM_ICE, 0.55);
  g.fillRect(cx - 12, cy + 22, 24, 0.4);

  // ── Shoulders (gathered, narrow — the crone stoops slightly) ──────
  g.fillStyle(ROBE_OUTLINE, 1);
  g.fillEllipse(cx - 8, cy - 3, 6, 7);
  g.fillEllipse(cx + 8, cy - 3, 6, 7);
  g.fillStyle(ROBE_DEEP, 1);
  g.fillEllipse(cx - 8, cy - 3, 4, 5);
  g.fillEllipse(cx + 8, cy - 3, 4, 5);

  // ── Hood (drawn forward over the face, creating a deep shadow) ────
  g.fillStyle(HOOD_DEEP, 1);
  g.fillEllipse(cx, cy - 12, 22, 18);
  g.fillStyle(HOOD_MID, 1);
  g.fillEllipse(cx, cy - 12, 18, 15);

  // ── Face (recessed in hood shadow — pale grey, not warm) ──────────
  g.fillStyle(SKIN_PALE, 1);
  g.fillEllipse(cx, cy - 11, 11, 13);
  g.fillStyle(SKIN_HI, 0.5);
  g.fillEllipse(cx, cy - 13, 7, 4); // forehead highlight

  // ── Hair wisps at face edge (frost-white, escaping the hood) ──────
  g.fillStyle(HAIR_FROST, 0.8);
  g.fillEllipse(cx - 7, cy - 9, 5, 8);
  g.fillEllipse(cx + 7, cy - 9, 5, 8);
  g.fillStyle(HAIR_HI, 0.5);
  g.fillEllipse(cx - 8, cy - 7, 2, 4);
  g.fillEllipse(cx + 8, cy - 7, 2, 4);

  // ── Eyes (ice-blue pinpoints; the only saturated reading) ─────────
  g.fillStyle(EYE_ICE, 1);
  g.fillCircle(cx - 3, cy - 11, 1.6);
  g.fillCircle(cx + 3, cy - 11, 1.6);
  g.fillStyle(EYE_HI, 0.85);
  g.fillCircle(cx - 3, cy - 11.3, 0.6);
  g.fillCircle(cx + 3, cy - 11.3, 0.6);

  // ── Mouth (a thin line — no expression) ───────────────────────────
  g.fillStyle(FROST_RIM_DEEP, 0.8);
  g.fillRect(cx - 2, cy - 7, 4, 0.6);

  // ── Staff (vertical, ironwood, longer than her height) ────────────
  // Staff shadow first
  g.fillStyle(SHADOW_DEEP, 0.3);
  g.fillRect(cx + 16, cy - 22, 1.5, 50);
  // Staff body
  g.fillStyle(STAFF_IRON, 1);
  g.fillRect(cx + 15, cy - 22, 2.5, 50);
  // Staff highlight
  g.fillStyle(STAFF_HI, 0.7);
  g.fillRect(cx + 15.5, cy - 22, 0.8, 50);

  // ── Hand grasping the staff ───────────────────────────────────────
  g.fillStyle(SKIN_PALE, 1);
  g.fillEllipse(cx + 14, cy + 2, 5, 4);
  g.fillStyle(ROBE_OUTLINE, 0.7);
  g.fillRect(cx + 14, cy + 4, 5, 2);

  // ── Antler tines atop staff (bone-white, asymmetric) ──────────────
  const staffTopX = cx + 16;
  const staffTopY = cy - 22;
  // Main left tine
  g.lineStyle(2, ANTLER_BONE, 1);
  g.lineBetween(staffTopX, staffTopY, staffTopX - 6, staffTopY - 8);
  g.lineBetween(staffTopX - 6, staffTopY - 8, staffTopX - 10, staffTopY - 14);
  g.lineBetween(staffTopX - 6, staffTopY - 8, staffTopX - 8, staffTopY - 13);
  // Main right tine
  g.lineBetween(staffTopX, staffTopY, staffTopX + 5, staffTopY - 7);
  g.lineBetween(staffTopX + 5, staffTopY - 7, staffTopX + 9, staffTopY - 13);
  g.lineBetween(staffTopX + 5, staffTopY - 7, staffTopX + 6, staffTopY - 11);
  // Crown tine (centre)
  g.lineBetween(staffTopX, staffTopY, staffTopX - 1, staffTopY - 6);
  g.lineBetween(staffTopX - 1, staffTopY - 6, staffTopX + 2, staffTopY - 11);

  // Antler highlights
  g.lineStyle(0.8, ANTLER_HI, 0.8);
  g.lineBetween(staffTopX - 1, staffTopY - 0.5, staffTopX - 5, staffTopY - 7);
  g.lineBetween(staffTopX + 1, staffTopY - 0.5, staffTopX + 4, staffTopY - 6);

  // ── A single ice-glint floating near the staff top (telegraph for
  // the ice-lance she fires) ──────────────────────────────────────
  g.fillStyle(EYE_HI, 0.8);
  g.fillCircle(staffTopX + 1, staffTopY - 4, 1.0);
  g.fillStyle(EYE_HI, 0.45);
  g.fillCircle(staffTopX + 3, staffTopY - 2, 0.7);
}

export function bakeBossCailleach(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawBossCailleach(g);
  g.generateTexture('boss_cailleach', BOSS_CAILLEACH_CANVAS_SIZE, BOSS_CAILLEACH_CANVAS_SIZE);
  g.destroy();
}
