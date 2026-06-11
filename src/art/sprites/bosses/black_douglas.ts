/**
 * `boss_black_douglas` — post-bell Borders terror: The Black Douglas.
 *
 * James "Good Sir James" Douglas (c.1286–1330), whose lightning border
 * raids made him so feared that English mothers quieted children with
 * his name. Fastest boss in the timeline — the suddenness IS the
 * mechanic. Appears only in post-bell mode.
 *
 * Refs: `SCOTTISH_RESEARCH_DEEP.md` §6.3 (Black Douglas / border raids).
 *
 * Silhouette: tall armoured knight, full closed helm, raised broadsword
 * in right hand, Douglas heart blazon on black surcoat. No visible face
 * — just the helm's eye slit and the sword. Colour deliberately near-
 * monochrome black-steel with the red Douglas heart as the sole accent.
 *
 * Scale: 2.0. Palette: black-steel / void / Douglas-red.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const BOSS_BLACK_DOUGLAS_CANVAS_SIZE = 64;

// ── Palette ──────────────────────────────────────────────────────────
const VOID_BLACK     = 0x000000;
const STEEL_DEEP     = 0x070710;
const STEEL_DARK     = 0x0e0e1e;
const STEEL_MID      = 0x1c1c34;
const STEEL_SHINE    = 0x303060;
const STEEL_GLINT    = 0x5050a0;
const SURCOAT_BLACK  = 0x060606;
const SURCOAT_FOLD   = 0x111111;
const DOUGLAS_RED    = 0xc01818;  // the Douglas heart — one accent
const HEART_BRIGHT   = 0xe83030;
const SWORD_STEEL    = 0x888898;
const SWORD_EDGE     = 0xc8c8d8;
const SWORD_GRIP     = 0x282810;

export function drawBossBlackDouglas(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = BOSS_BLACK_DOUGLAS_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);

  // ── Ground shadow ─────────────────────────────────────────────────
  g.fillStyle(VOID_BLACK, 0.55);
  g.fillEllipse(cx, cy + 26, 40, 7);

  // ── Legs / greaves (wide stance, planted) ────────────────────────
  g.fillStyle(STEEL_DARK, 0.95);
  g.fillRect(cx - 9, cy + 10, 8, 16);  // left leg
  g.fillRect(cx + 1, cy + 10, 8, 16);  // right leg
  // Sabatons
  g.fillStyle(STEEL_MID, 0.90);
  g.fillEllipse(cx - 5, cy + 26, 10, 5);
  g.fillEllipse(cx + 5, cy + 26, 10, 5);

  // ── Surcoat body (black over armour) ─────────────────────────────
  g.fillStyle(SURCOAT_BLACK, 0.98);
  g.fillRect(cx - 11, cy - 4, 22, 18);
  g.fillStyle(SURCOAT_FOLD, 0.70);
  g.fillRect(cx - 9, cy - 2, 4, 12);
  g.fillRect(cx + 5, cy - 2, 4, 12);

  // ── Douglas heart blazon (the sole red accent) ────────────────────
  // Simple heraldic heart — two rounded bumps + pointed base
  g.fillStyle(DOUGLAS_RED, 0.95);
  g.fillCircle(cx - 3, cy + 5, 4);
  g.fillCircle(cx + 3, cy + 5, 4);
  // Pointed base via triangle approximation
  g.fillTriangle(cx - 6, cy + 7, cx + 6, cy + 7, cx, cy + 13);
  // Highlight
  g.fillStyle(HEART_BRIGHT, 0.40);
  g.fillCircle(cx - 2, cy + 4, 2);

  // ── Pauldrons (shoulder guards — broad, intimidating) ────────────
  g.fillStyle(STEEL_DEEP, 0.95);
  g.fillEllipse(cx - 14, cy - 8, 14, 10);  // left
  g.fillEllipse(cx + 14, cy - 8, 14, 10);  // right
  g.fillStyle(STEEL_SHINE, 0.35);
  g.fillEllipse(cx - 14, cy - 10, 10, 6);
  g.fillEllipse(cx + 14, cy - 10, 10, 6);

  // ── Torso / hauberk ───────────────────────────────────────────────
  g.fillStyle(STEEL_DARK, 0.92);
  g.fillEllipse(cx, cy - 2, 24, 20);
  g.fillStyle(STEEL_GLINT, 0.20);
  g.fillEllipse(cx - 2, cy - 6, 8, 6);

  // ── Sword arm (right, raised diagonally) ─────────────────────────
  // Upper arm
  g.fillStyle(STEEL_DARK, 0.90);
  g.fillRect(cx + 9, cy - 16, 6, 14);
  // Gauntlet
  g.fillStyle(STEEL_MID, 0.88);
  g.fillRect(cx + 10, cy - 18, 5, 6);
  // Crossguard
  g.fillStyle(SWORD_STEEL, 0.90);
  g.fillRect(cx + 7, cy - 22, 12, 3);
  // Blade (pointing upper-right)
  g.fillStyle(SWORD_STEEL, 0.85);
  g.fillRect(cx + 10, cy - 42, 5, 22);
  g.fillStyle(SWORD_EDGE, 0.70);
  g.fillRect(cx + 11, cy - 42, 2, 22);
  // Pommel
  g.fillStyle(SWORD_GRIP, 0.90);
  g.fillRect(cx + 10, cy - 18, 5, 5);
  g.fillStyle(STEEL_SHINE, 0.70);
  g.fillCircle(cx + 12, cy - 15, 2);

  // ── Left arm (shield-fist, slightly forward) ──────────────────────
  g.fillStyle(STEEL_DARK, 0.90);
  g.fillRect(cx - 16, cy - 10, 6, 14);
  g.fillStyle(STEEL_MID, 0.85);
  g.fillEllipse(cx - 13, cy + 4, 8, 8);

  // ── Neck / gorget ─────────────────────────────────────────────────
  g.fillStyle(STEEL_DARK, 0.95);
  g.fillRect(cx - 5, cy - 20, 10, 6);

  // ── Helm (full closed bascinet — most important read) ─────────────
  // Main bowl
  g.fillStyle(STEEL_DEEP, 0.98);
  g.fillEllipse(cx, cy - 26, 22, 20);
  // Visor face plate
  g.fillStyle(STEEL_DARK, 0.95);
  g.fillRect(cx - 8, cy - 30, 16, 10);
  // Eye slit (thin void — the only "face")
  g.fillStyle(VOID_BLACK, 1.0);
  g.fillRect(cx - 6, cy - 26, 12, 2);
  // Nasal bar
  g.fillStyle(STEEL_MID, 0.80);
  g.fillRect(cx - 1, cy - 26, 2, 5);
  // Helm shine
  g.fillStyle(STEEL_GLINT, 0.25);
  g.fillEllipse(cx - 2, cy - 32, 8, 6);
  // Aventail (mail neck guard, dark fringe)
  g.fillStyle(STEEL_DARK, 0.70);
  g.fillRect(cx - 10, cy - 20, 20, 5);

  // ── Rim light on helm ─────────────────────────────────────────────
  g.lineStyle(1, STEEL_SHINE, 0.22);
  g.strokeEllipse(cx, cy - 26, 22, 20);
}

export function bakeBossBlackDouglas(scene: Phaser.Scene): void {
  const s = BOSS_BLACK_DOUGLAS_CANVAS_SIZE;
  const g = scene.add.graphics();
  drawBossBlackDouglas(g);
  g.generateTexture('boss_black_douglas', s, s);
  g.destroy();
}
