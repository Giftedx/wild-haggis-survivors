/**
 * `boss_ninth_legion` — The Lost Ninth Legion Centurion (post-bell wave-boss).
 *
 * A spectral Roman centurion emerging from Caledonian mist. Legio IX Hispana
 * — the legion that marched into Scotland and was never heard of again.
 * The centurion is the last survivor, a ghost-commander who still waits
 * in the fog for the order that never came.
 *
 * Silhouette: crested helmet, ghostly silver armour, gladius raised,
 * trailing mist-hem. Desaturated silver-blue palette with faint red crest
 * (faded from centuries but still visible). Shield (scutum) on left arm.
 *
 * Also bakes `spectre_legionary` — the wave-spawn rank-and-file soldier.
 */
import * as Phaser from 'phaser';

export const BOSS_NINTH_LEGION_CANVAS_SIZE = 80;

export function bakeBossNinthLegion(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const s = BOSS_NINTH_LEGION_CANVAS_SIZE;
  const cx = s / 2;
  const cy = s / 2;

  // ── Ghost mist base ──────────────────────────────────────────────────
  g.fillStyle(0x8899bb, 0.15);
  g.fillEllipse(cx, cy + 8, 62, 40);
  g.fillStyle(0xaabbcc, 0.10);
  g.fillEllipse(cx, cy, 52, 52);

  // ── Ground shadow ────────────────────────────────────────────────────
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(cx + 4, cy + 34, 30, 5);

  // ── Mist hem (centurion trails into fog at the base) ─────────────────
  g.fillStyle(0x8899bb, 0.40);
  g.fillEllipse(cx, cy + 28, 34, 10);
  g.fillStyle(0xaabbdd, 0.25);
  g.fillEllipse(cx, cy + 30, 28, 7);

  // ── Body armour (lorica segmentata) ──────────────────────────────────
  g.fillStyle(0x3a4a5a, 1);
  g.fillRect(cx - 13, cy - 2, 26, 26);
  // Segmented plate strips
  g.fillStyle(0x4a5a6a, 1);
  g.fillRect(cx - 12, cy + 2, 24, 4);
  g.fillRect(cx - 12, cy + 8, 24, 4);
  g.fillRect(cx - 12, cy + 14, 24, 4);
  // Armour highlight (silver-blue edge)
  g.fillStyle(0x8899bb, 0.55);
  g.fillRect(cx - 13, cy - 2, 1.5, 26);
  g.fillRect(cx + 11, cy - 2, 1.5, 26);

  // ── Pauldrons (shoulder armour) ───────────────────────────────────────
  g.fillStyle(0x2a3a4a, 1);
  g.fillEllipse(cx - 16, cy - 2, 10, 8);
  g.fillEllipse(cx + 16, cy - 2, 10, 8);
  g.fillStyle(0x5a6a7a, 0.70);
  g.fillEllipse(cx - 16, cy - 3, 7, 5);
  g.fillEllipse(cx + 16, cy - 3, 7, 5);

  // ── Scutum (shield) on left arm ───────────────────────────────────────
  g.fillStyle(0x6a2020, 1);
  g.fillRect(cx - 28, cy - 8, 14, 22);
  // Shield boss (metal centre)
  g.fillStyle(0x8899aa, 1);
  g.fillEllipse(cx - 21, cy + 3, 8, 8);
  // Shield rim
  g.fillStyle(0x4a1010, 0.70);
  g.fillRect(cx - 28, cy - 8, 1, 22);
  g.fillRect(cx - 14, cy - 8, 1, 22);
  // Faded Roman sigil (SPQR ghost)
  g.fillStyle(0x8a4030, 0.55);
  g.fillRect(cx - 24, cy - 4, 6, 1);
  g.fillRect(cx - 24, cy, 6, 1);
  g.fillRect(cx - 22, cy - 4, 1, 5);

  // ── Sword arm (gladius raised) ────────────────────────────────────────
  g.fillStyle(0x3a4a5a, 1);
  g.fillRect(cx + 13, cy - 6, 8, 18);
  // Gladius blade (short, silver)
  g.fillStyle(0xccddee, 1);
  g.fillRect(cx + 16, cy - 22, 3, 18);
  // Blade highlight
  g.fillStyle(0xeef5ff, 0.80);
  g.fillRect(cx + 16.5, cy - 22, 1, 17);
  // Guard
  g.fillStyle(0x8899aa, 1);
  g.fillRect(cx + 14, cy - 4, 7, 2.5);

  // ── Neck & head ───────────────────────────────────────────────────────
  g.fillStyle(0x8a8a9a, 1);
  g.fillRect(cx - 4, cy - 14, 8, 12);

  // ── Helmet (Gallic type — prominent brow guard, cheek guards) ─────────
  // Helmet body
  g.fillStyle(0x3a4a5a, 1);
  g.fillEllipse(cx, cy - 20, 24, 18);
  g.fillStyle(0x4a5a6a, 1);
  g.fillEllipse(cx, cy - 22, 20, 14);
  // Brow guard (front brim)
  g.fillStyle(0x2a3a4a, 1);
  g.fillRect(cx - 12, cy - 12, 24, 3);
  g.fillStyle(0x6a7a8a, 0.60);
  g.fillRect(cx - 11, cy - 12, 22, 1);
  // Cheek guards
  g.fillStyle(0x2a3a4a, 1);
  g.fillRect(cx - 13, cy - 16, 5, 8);
  g.fillRect(cx + 8, cy - 16, 5, 8);

  // ── Crest (crista transversa — centurion's transverse crest) ──────────
  // Crest base
  g.fillStyle(0x3a4a5a, 1);
  g.fillRect(cx - 12, cy - 30, 24, 5);
  // Crest hair (faded red — centuries old, but still red)
  g.fillStyle(0x882222, 1);
  g.fillRect(cx - 11, cy - 35, 22, 9);
  g.fillStyle(0xaa3333, 0.70);
  g.fillRect(cx - 9, cy - 35, 18, 5);
  // Crest highlight
  g.fillStyle(0xcc5555, 0.40);
  g.fillRect(cx - 6, cy - 35, 12, 2);

  // ── Face (pale ghost-skin, minimal features) ──────────────────────────
  g.fillStyle(0x9aa0b0, 1);
  g.fillEllipse(cx, cy - 19, 13, 11);
  // Eyes — cold points of light (a ghost, not a person)
  g.fillStyle(0xbbccdd, 1);
  g.fillCircle(cx - 3, cy - 20, 1.3);
  g.fillCircle(cx + 3, cy - 20, 1.3);
  g.fillStyle(0xeef5ff, 0.80);
  g.fillCircle(cx - 3, cy - 20.4, 0.5);
  g.fillCircle(cx + 3, cy - 20.4, 0.5);

  // ── Silver-blue ghost rim ─────────────────────────────────────────────
  g.fillStyle(0x9aaabb, 0.20);
  g.fillEllipse(cx + 4, cy - 4, 60, 60);

  g.generateTexture('boss_ninth_legion', s, s);
  g.destroy();
}

/** Spectre Legionary — rank-and-file ghost soldier summoned by the Centurion. */
export function bakeSpectreLegionry(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const s = 32;
  const cx = s / 2;
  const cy = s / 2;

  // Ghost mist
  g.fillStyle(0x8899bb, 0.18);
  g.fillEllipse(cx, cy + 4, 28, 20);

  // Body armour (simplified)
  g.fillStyle(0x4a5a6a, 1);
  g.fillRect(cx - 6, cy - 2, 12, 14);
  g.fillStyle(0x5a6a7a, 0.70);
  g.fillRect(cx - 5, cy + 2, 10, 3);
  g.fillRect(cx - 5, cy + 6, 10, 3);

  // Small scutum
  g.fillStyle(0x6a2020, 1);
  g.fillRect(cx - 12, cy - 4, 7, 12);
  g.fillStyle(0x8899aa, 1);
  g.fillEllipse(cx - 8, cy + 2, 4, 4);

  // Head
  g.fillStyle(0x9aa0b0, 1);
  g.fillEllipse(cx, cy - 8, 9, 8);

  // Helmet
  g.fillStyle(0x3a4a5a, 1);
  g.fillEllipse(cx, cy - 11, 11, 8);
  g.fillRect(cx - 5, cy - 6, 10, 1.5);
  // Tiny crest
  g.fillStyle(0x882222, 1);
  g.fillRect(cx - 4, cy - 17, 8, 5);

  // Eyes
  g.fillStyle(0xbbccdd, 1);
  g.fillCircle(cx - 2, cy - 9, 0.8);
  g.fillCircle(cx + 2, cy - 9, 0.8);

  // Gladius
  g.fillStyle(0xccddee, 1);
  g.fillRect(cx + 5, cy - 14, 2, 12);

  // Ghost hem
  g.fillStyle(0x8899bb, 0.35);
  g.fillEllipse(cx, cy + 12, 14, 6);

  g.generateTexture('spectre_legionary', s, s);
  g.destroy();
}
