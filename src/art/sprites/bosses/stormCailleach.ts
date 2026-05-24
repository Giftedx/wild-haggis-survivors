/**
 * `boss_storm_cailleach` — Tier-3 post-bell boss: The Cailleach of the Storm.
 *
 * The Cailleach Bheur (Blue Hag) is the goddess of winter in Gaelic
 * mythology. This manifestation is her storm aspect — not the patient
 * cold of the Gauntlet boss but the active gale: haar, ice-lances, hail.
 *
 * Silhouette: hunched old woman in billowing storm-grey robes, wind-torn
 * white hair streaming horizontal, gnarled staff topped with a gale
 * crystal. Distinctly broader and more elemental than the Gauntlet
 * Cailleach — the storm has mass.
 *
 * Scale: 2.8. Palette: storm-slate / haar-grey / ice-white / hail-blue.
 *
 * Refs: `SCOTTISH_RESEARCH.md` §1.1 (Cailleach Bheur / Blue Hag).
 */

import * as Phaser from 'phaser';

export const BOSS_STORM_CAILLEACH_CANVAS_SIZE = 72;

// ── Palette ──────────────────────────────────────────────────────────
const VOID_DARK       = 0x04040c;
const ROBE_DEEP       = 0x1e2030;
const ROBE_MID        = 0x2c3048;
const ROBE_LIGHT      = 0x3c4260;
const HAAR_GREY       = 0x8090b0;
const SKIN_PALE       = 0xc8c0b4;
const SKIN_DARK       = 0x8c8078;
const HAIR_WHITE      = 0xe8eef8;
const HAIR_MID        = 0xb0bcd4;
const STAFF_BARK      = 0x302820;
const STAFF_GNARL     = 0x584840;
const CRYSTAL_CORE    = 0xd8f0ff;
const CRYSTAL_GLOW    = 0xa8dcff;
const CRYSTAL_RING    = 0x70b8f0;
const ICE_ACCENT      = 0x90ccec;

export function drawBossStormCailleach(g: Phaser.GameObjects.Graphics): void {
  const s = BOSS_STORM_CAILLEACH_CANVAS_SIZE;
  const cx = s / 2;
  const cy = s / 2 + 4;

  // ── Ground shadow (wide — the storm spreads) ──────────────────────
  g.fillStyle(VOID_DARK, 0.50);
  g.fillEllipse(cx, cy + 26, 52, 9);

  // ── Robes — wide billowing base (wind-blown right) ────────────────
  g.fillStyle(ROBE_DEEP, 0.97);
  g.fillTriangle(cx - 16, cy + 28, cx + 22, cy + 28, cx + 8, cy - 6);
  g.fillTriangle(cx - 16, cy + 28, cx - 4, cy - 6, cx + 8, cy - 6);
  // Robe bulk / mid fold
  g.fillStyle(ROBE_MID, 0.88);
  g.fillTriangle(cx - 8, cy + 28, cx + 14, cy + 28, cx + 5, cy - 2);
  // Robe highlight (wind catches left edge, lighter)
  g.fillStyle(ROBE_LIGHT, 0.60);
  g.fillTriangle(cx - 14, cy + 22, cx - 6, cy + 28, cx - 2, cy + 4);
  // Hem border detail
  g.fillStyle(HAAR_GREY, 0.30);
  g.fillRect(cx - 16, cy + 24, 38, 4);

  // ── Hunched torso (stooped forward) ──────────────────────────────
  g.fillStyle(ROBE_DEEP, 0.95);
  g.fillEllipse(cx + 2, cy - 8, 26, 22);
  g.fillStyle(ROBE_MID, 0.55);
  g.fillEllipse(cx, cy - 10, 14, 12);

  // ── Left arm — holding staff (angled down-left) ───────────────────
  g.fillStyle(ROBE_DEEP, 0.90);
  g.fillRect(cx - 12, cy - 14, 6, 18);
  // Gnarled hand
  g.fillStyle(SKIN_DARK, 0.90);
  g.fillEllipse(cx - 9, cy + 4, 7, 8);

  // ── Staff (gnarled, angled slightly left) ─────────────────────────
  // Shaft
  g.fillStyle(STAFF_BARK, 0.95);
  g.fillRect(cx - 12, cy - 32, 4, 38);
  // Gnarl knot
  g.fillStyle(STAFF_GNARL, 0.90);
  g.fillEllipse(cx - 10, cy - 14, 7, 5);
  g.fillEllipse(cx - 10, cy + 2, 6, 4);
  // Crystal head — bright burst
  g.fillStyle(CRYSTAL_RING, 0.85);
  g.fillCircle(cx - 10, cy - 36, 9);
  g.fillStyle(CRYSTAL_GLOW, 0.90);
  g.fillCircle(cx - 10, cy - 36, 6);
  g.fillStyle(CRYSTAL_CORE, 0.95);
  g.fillCircle(cx - 10, cy - 36, 3);
  // Crystal inner sparkle
  g.fillStyle(0xffffff, 0.70);
  g.fillRect(cx - 11, cy - 38, 2, 5);
  g.fillRect(cx - 12, cy - 37, 5, 2);

  // ── Right arm (raised, gesturing into the storm) ──────────────────
  g.fillStyle(ROBE_DEEP, 0.88);
  g.fillRect(cx + 10, cy - 18, 6, 14);
  g.fillStyle(SKIN_DARK, 0.88);
  g.fillEllipse(cx + 13, cy - 4, 7, 8);
  // Splayed fingers (hint of claws)
  g.fillStyle(SKIN_PALE, 0.70);
  g.fillRect(cx + 11, cy - 6, 2, 5);
  g.fillRect(cx + 13, cy - 7, 2, 6);
  g.fillRect(cx + 15, cy - 5, 2, 5);

  // ── Neck ─────────────────────────────────────────────────────────
  g.fillStyle(SKIN_DARK, 0.88);
  g.fillRect(cx - 2, cy - 22, 8, 8);

  // ── Head — ancient, hunched forward, sharp-featured ──────────────
  g.fillStyle(SKIN_PALE, 0.92);
  g.fillEllipse(cx + 2, cy - 30, 18, 16);
  // Cheekbones (angular)
  g.fillStyle(SKIN_DARK, 0.45);
  g.fillEllipse(cx - 3, cy - 28, 6, 4);
  g.fillEllipse(cx + 7, cy - 28, 6, 4);
  // Nose (hooked)
  g.fillStyle(SKIN_DARK, 0.65);
  g.fillTriangle(cx + 2, cy - 32, cx, cy - 24, cx + 4, cy - 24);
  // Eyes — pale pale blue, cold
  g.fillStyle(ICE_ACCENT, 0.95);
  g.fillEllipse(cx - 2, cy - 32, 4, 3);
  g.fillEllipse(cx + 6, cy - 32, 4, 3);
  g.fillStyle(VOID_DARK, 0.90);
  g.fillCircle(cx - 1, cy - 32, 1);
  g.fillCircle(cx + 7, cy - 32, 1);

  // ── Hair — wild, horizontal, wind-torn ───────────────────────────
  // Main mass streaming right
  g.fillStyle(HAIR_WHITE, 0.90);
  g.fillTriangle(cx + 8, cy - 38, cx + 32, cy - 28, cx + 10, cy - 24);
  g.fillTriangle(cx + 8, cy - 38, cx + 28, cy - 22, cx + 8, cy - 18);
  // Secondary streaks
  g.fillStyle(HAIR_MID, 0.70);
  g.fillTriangle(cx + 8, cy - 36, cx + 24, cy - 30, cx + 10, cy - 26);
  g.fillTriangle(cx + 4, cy - 36, cx + 22, cy - 20, cx + 6, cy - 16);
  // Left wisp (into wind)
  g.fillStyle(HAIR_WHITE, 0.55);
  g.fillTriangle(cx - 2, cy - 38, cx - 14, cy - 30, cx - 1, cy - 24);

  // ── Ice accents on robes — frost-blue geometric lines ────────────
  g.lineStyle(1, ICE_ACCENT, 0.40);
  g.strokeRect(cx - 4, cy + 2, 12, 18);
  g.lineStyle(1, CRYSTAL_RING, 0.30);
  g.strokeEllipse(cx + 2, cy - 8, 20, 16);

  // ── Haar wisps at hem (cosmetic, read as ground mist) ────────────
  g.fillStyle(HAAR_GREY, 0.18);
  g.fillEllipse(cx - 14, cy + 28, 20, 6);
  g.fillEllipse(cx + 14, cy + 28, 18, 5);
}

export function bakeBossStormCailleach(scene: Phaser.Scene): void {
  const s = BOSS_STORM_CAILLEACH_CANVAS_SIZE;
  const g = scene.add.graphics();
  drawBossStormCailleach(g);
  g.generateTexture('boss_storm_cailleach', s, s);
  g.destroy();
}
