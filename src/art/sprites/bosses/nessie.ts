/**
 * `boss_nessie` — Nessie, Reconsidered.
 *
 * The Loch Ness Monster as a plesiosaur-silhouette: long neck arcing out of
 * dark loch-water, two visible humps, small head with a bright eye. Teal-
 * to-dark-green mottled hide; a ring of bioluminescent blue at the waterline
 * suggests depth. The neck rises at a slight off-centre cant — the creature
 * is already tracking the haggis.
 *
 * Scale: 2.6. Palette: loch-teal / deep-green / bioluminescent blue.
 * Ref: SCOTTISH_RESEARCH.md §1.2; SCOTTISH_RESEARCH_DEEP.md §21.
 *
 * Silhouette test: tall narrow neck, two humps breaking surface, wedge head.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const BOSS_NESSIE_CANVAS_SIZE = 64;

// ── Palette ──────────────────────────────────────────────────────────
const VOID_BLACK     = 0x000000;
const LOCH_DARK      = 0x091820;  // deep loch water
const LOCH_MID       = 0x0e2c38;
const LOCH_SURFACE   = 0x143c50;
const HIDE_DARK      = 0x0a2e20;  // mottled underbelly
const HIDE_MID       = 0x154030;
const HIDE_BRIGHT    = 0x206050;
const HIDE_SPOT      = 0x2a7860;  // paler mottling
const BIOLUME_CORE   = 0x30d0c0;  // teal bioluminescent ring
const BIOLUME_GLOW   = 0x60ffe0;
const EYE_AMBER      = 0xd08020;
const EYE_GLOW       = 0xffe060;

export function drawBossNessie(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = BOSS_NESSIE_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + (frame.breathY ?? 0);

  // ── Ground shadow ─────────────────────────────────────────────────
  g.fillStyle(VOID_BLACK, 0.40);
  g.fillEllipse(cx + 2, cy + 26, 50, 9);

  // ── Loch surface (water plane across the canvas) ──────────────────
  g.fillStyle(LOCH_DARK, 0.88);
  g.fillRect(0, cy + 12, s, 20);
  g.fillStyle(LOCH_MID, 0.55);
  g.fillRect(0, cy + 10, s, 6);
  g.fillStyle(LOCH_SURFACE, 0.30);
  g.fillRect(0, cy + 8, s, 4);

  // ── Bioluminescent waterline ring ─────────────────────────────────
  g.lineStyle(1.5, BIOLUME_CORE, 0.60);
  g.strokeEllipse(cx + 2, cy + 12, 42, 10);
  g.lineStyle(2.5, BIOLUME_GLOW, 0.20);
  g.strokeEllipse(cx + 2, cy + 12, 46, 13);

  // ── Hump B (back hump, left, partially submerged) ─────────────────
  g.fillStyle(HIDE_DARK, 0.92);
  g.fillEllipse(cx - 14, cy + 14, 18, 10);
  g.fillStyle(HIDE_MID, 0.80);
  g.fillEllipse(cx - 14, cy + 13, 14, 7);

  // ── Hump A (lead hump, right of centre) ───────────────────────────
  g.fillStyle(HIDE_DARK, 0.95);
  g.fillEllipse(cx + 8, cy + 10, 22, 13);
  g.fillStyle(HIDE_MID, 0.85);
  g.fillEllipse(cx + 8, cy + 9, 18, 10);
  g.fillStyle(HIDE_SPOT, 0.50);
  g.fillEllipse(cx + 10, cy + 8, 8, 5);

  // ── Neck base (emerges between humps, slight left lean) ──────────
  g.fillStyle(HIDE_DARK, 0.96);
  g.fillEllipse(cx - 2, cy + 4, 14, 22);
  g.fillStyle(HIDE_MID, 0.82);
  g.fillEllipse(cx - 2, cy + 2, 10, 18);

  // ── Neck mid-section (narrows, leans left) ────────────────────────
  g.fillStyle(HIDE_MID, 0.92);
  g.fillEllipse(cx - 5, cy - 8, 11, 20);
  g.fillStyle(HIDE_BRIGHT, 0.70);
  g.fillEllipse(cx - 5, cy - 10, 8, 16);

  // ── Neck upper / throat ────────────────────────────────────────────
  g.fillStyle(HIDE_MID, 0.90);
  g.fillEllipse(cx - 7, cy - 19, 9, 16);

  // ── Head (small wedge, forward tilt) ──────────────────────────────
  g.fillStyle(HIDE_DARK, 0.98);
  g.fillEllipse(cx - 10, cy - 26, 16, 10);
  g.fillStyle(HIDE_MID, 0.85);
  g.fillEllipse(cx - 10, cy - 27, 12, 8);

  // ── Snout (forward point of the wedge) ────────────────────────────
  g.fillStyle(HIDE_DARK, 0.92);
  g.fillTriangle(cx - 18, cy - 28, cx - 4, cy - 28, cx - 10, cy - 22);

  // ── Eye (single, amber, facing right — tracking the player) ───────
  g.fillStyle(EYE_GLOW, 0.40);
  g.fillCircle(cx - 6, cy - 27, 4);
  g.fillStyle(EYE_AMBER, 0.92);
  g.fillCircle(cx - 6, cy - 27, 2.5);
  g.fillStyle(EYE_GLOW, 1.0);
  g.fillCircle(cx - 6, cy - 27, 1);

  // ── Mottling highlights on neck ────────────────────────────────────
  g.fillStyle(HIDE_SPOT, 0.28);
  g.fillEllipse(cx - 3, cy - 6, 5, 7);
  g.fillEllipse(cx - 6, cy - 14, 4, 5);
}

export function bakeBossNessie(scene: Phaser.Scene): void {
  const s = BOSS_NESSIE_CANVAS_SIZE;
  const g = scene.add.graphics();
  drawBossNessie(g);
  g.generateTexture('boss_nessie', s, s);
  g.destroy();
}
