/**
 * `boss_earl_beardie` — Glamis ghost boss: The Earl Beardie.
 *
 * A 15th-century Earl of Crawford whose ghost is doomed to play cards
 * eternally in a sealed room at Glamis Castle, having wagered his soul
 * to the Devil on a Sunday. Semi-transparent, robed figure seated at
 * an invisible table; cards in hand, ghost-green aura, one burning eye.
 *
 * Ref: `SCOTTISH_RESEARCH.md` §1.4.
 *
 * Silhouette: broad-shouldered seated apparition in a fur-trimmed earl's
 * robe. Both hands raised — left holds a fan of spectral cards, right
 * is mid-deal. Featureless void face except a single amber eye. A faint
 * card-table baize glow rings the lower body (the sealed-room locale).
 *
 * Scale: 2.0. Palette: ghost-green / corpse-grey / baize amber.
 */

import * as Phaser from 'phaser';

export const BOSS_EARL_BEARDIE_CANVAS_SIZE = 64;

// ── Palette ──────────────────────────────────────────────────────────
const VOID_BLACK    = 0x000000;
const GHOST_DARK    = 0x0a1a10;
const GHOST_MID     = 0x183828;
const GHOST_PALE    = 0x2a5c3a;
const GHOST_BRIGHT  = 0x40904a;
const GHOST_RIM     = 0x60c860;
const ROBE_DARK     = 0x141a18;
const ROBE_MID      = 0x202e24;
const ROBE_EDGE     = 0x304038;
const FUR_TRIM      = 0x383830;
const BAIZE_GLOW    = 0x1a4020;
const CARD_LIGHT    = 0xe8e0c8;  // aged-vellum card face
const CARD_EDGE     = 0xa09060;  // card border
const EYE_AMBER     = 0xe0a020;
const EYE_GLOW      = 0xffd060;

export function drawBossEarlBeardie(g: Phaser.GameObjects.Graphics): void {
  const s = BOSS_EARL_BEARDIE_CANVAS_SIZE;
  const cx = s / 2;
  const cy = s / 2 + 4;

  // ── Ground shadow (seated, so smaller than standing bosses) ──────
  g.fillStyle(VOID_BLACK, 0.45);
  g.fillEllipse(cx, cy + 22, 44, 8);

  // ── Baize aura (the sealed room's green card-table glow) ─────────
  g.fillStyle(BAIZE_GLOW, 0.25);
  g.fillEllipse(cx, cy + 12, 56, 28);

  // ── Ghost aura (outer halo) ───────────────────────────────────────
  g.fillStyle(GHOST_PALE, 0.12);
  g.fillCircle(cx, cy - 4, 28);
  g.fillStyle(GHOST_MID, 0.18);
  g.fillCircle(cx, cy - 6, 22);

  // ── Robe body (lower half — wide seated silhouette) ──────────────
  g.fillStyle(ROBE_DARK, 0.92);
  g.fillEllipse(cx, cy + 14, 38, 22);
  g.fillStyle(ROBE_MID, 0.88);
  g.fillEllipse(cx, cy + 10, 32, 18);

  // ── Fur trim (collar band) ────────────────────────────────────────
  g.fillStyle(FUR_TRIM, 0.85);
  g.fillRect(cx - 12, cy - 2, 24, 5);
  g.fillStyle(GHOST_DARK, 0.6);
  g.fillRect(cx - 10, cy - 1, 20, 3);

  // ── Torso ─────────────────────────────────────────────────────────
  g.fillStyle(ROBE_EDGE, 0.82);
  g.fillEllipse(cx, cy + 2, 26, 22);
  g.fillStyle(ROBE_MID, 0.72);
  g.fillEllipse(cx, cy, 20, 18);

  // ── Left arm / card hand (cards fanned left) ──────────────────────
  // Three spectral cards in a fan
  const cardAngles = [-0.4, 0.0, 0.4];
  for (const ang of cardAngles) {
    const ax = cx - 14 + Math.sin(ang) * 4;
    const ay = cy + 2 + Math.cos(ang) * 2;
    g.fillStyle(CARD_EDGE, 0.80);
    g.fillRect(ax - 4, ay - 6, 8, 11);
    g.fillStyle(CARD_LIGHT, 0.88);
    g.fillRect(ax - 3, ay - 5, 6, 9);
  }

  // ── Right arm (mid-deal, extended toward player) ──────────────────
  g.fillStyle(GHOST_BRIGHT, 0.60);
  g.fillEllipse(cx + 14, cy + 4, 8, 14);
  // Single card being dealt
  g.fillStyle(CARD_EDGE, 0.85);
  g.fillRect(cx + 10, cy - 2, 8, 11);
  g.fillStyle(CARD_LIGHT, 0.90);
  g.fillRect(cx + 11, cy - 1, 6, 9);

  // ── Head (featureless void shape) ────────────────────────────────
  g.fillStyle(GHOST_DARK, 0.95);
  g.fillEllipse(cx, cy - 10, 18, 20);
  g.fillStyle(GHOST_MID, 0.70);
  g.fillEllipse(cx, cy - 12, 14, 16);

  // ── Earl's hood / cap (15th century bonnet shape) ─────────────────
  g.fillStyle(ROBE_DARK, 0.90);
  g.fillEllipse(cx, cy - 18, 20, 10);
  g.fillStyle(ROBE_EDGE, 0.75);
  g.fillEllipse(cx, cy - 20, 16, 8);

  // ── Single eye (amber — the only focal point in the void face) ────
  g.fillStyle(EYE_GLOW, 0.45);
  g.fillCircle(cx, cy - 11, 4);
  g.fillStyle(EYE_AMBER, 0.90);
  g.fillCircle(cx, cy - 11, 3);
  g.fillStyle(EYE_GLOW, 1.0);
  g.fillCircle(cx, cy - 11, 1.5);

  // ── Ghost rim light (edge glow on the robe outline) ───────────────
  g.lineStyle(1.5, GHOST_RIM, 0.30);
  g.strokeEllipse(cx, cy + 2, 26, 22);
  g.strokeEllipse(cx, cy - 10, 18, 20);
}

export function bakeBossEarlBeardie(scene: Phaser.Scene): void {
  const s = BOSS_EARL_BEARDIE_CANVAS_SIZE;
  const g = scene.add.graphics();
  drawBossEarlBeardie(g);
  g.generateTexture('boss_earl_beardie', s, s);
  g.destroy();
}
