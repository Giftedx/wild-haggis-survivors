/**
 * `boss_stoor_worm` — Orcadian giant sea-serpent (secret final boss).
 *
 * The Stoor Worm of Orkney legend: a vast sea-serpent so large its teeth
 * became the Faroe Islands and its body became Iceland when Assipattle
 * killed it by setting fire to its liver. Scale 3.5× — the largest
 * entity in the game.
 *
 * Silhouette: angular serpent head, half-open maw, heavy scaling pattern
 * along the neck. Dark sea-green fading to paler belly. Orange-amber eye.
 * Scale plates on neck (lighter polygons) signal the lock/gape mechanic.
 *
 * Palette: Wild + Deep-Sea extension of ART_STYLE_BIBLE. Desaturated
 * sea-green base, bile-yellow maw lining, cold amber eye.
 */
import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const BOSS_STOOR_WORM_CANVAS_SIZE = 100;

export function drawBossStoorWorm(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = BOSS_STOOR_WORM_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + (frame.breathY ?? 0);

  // ── Ground shadow ────────────────────────────────────────────────────
  g.fillStyle(0x000000, 0.50);
  g.fillEllipse(cx + 4, cy + 38, 56, 10);

  // ── Neck / body coil (behind head) ──────────────────────────────────
  g.fillStyle(0x1a3a22, 1);
  g.fillEllipse(cx - 8, cy + 20, 44, 28);
  g.fillStyle(0x2a5032, 1);
  g.fillEllipse(cx - 6, cy + 18, 36, 22);

  // Neck scale plates — lighter polygons (the lock/gape mechanic cues)
  g.fillStyle(0x3a6842, 0.80);
  g.fillRect(cx - 22, cy + 10, 10, 7);
  g.fillRect(cx - 10, cy + 8, 10, 7);
  g.fillRect(cx + 2, cy + 8, 10, 7);
  g.fillRect(cx + 14, cy + 10, 8, 6);

  // Scale highlight edges
  g.fillStyle(0x5a9860, 0.50);
  g.fillRect(cx - 22, cy + 10, 10, 1);
  g.fillRect(cx - 10, cy + 8, 10, 1);
  g.fillRect(cx + 2, cy + 8, 10, 1);

  // ── Belly fade ───────────────────────────────────────────────────────
  g.fillStyle(0x48704e, 0.60);
  g.fillEllipse(cx - 4, cy + 22, 24, 12);

  // ── Head (upper) — massive angular serpent head ──────────────────────
  g.fillStyle(0x0e2018, 1);
  g.fillRect(cx - 14, cy - 22, 30, 28);      // head bounding box
  // Snout rounded end
  g.fillStyle(0x0e2018, 1);
  g.fillEllipse(cx + 12, cy - 8, 14, 20);

  // Head surface (lighter centre)
  g.fillStyle(0x1a3a22, 1);
  g.fillRect(cx - 12, cy - 20, 26, 24);
  g.fillStyle(0x2a5032, 0.70);
  g.fillRect(cx - 8, cy - 18, 16, 18);

  // Head ridge — dorsal crest
  g.fillStyle(0x3a6040, 1);
  g.fillRect(cx - 14, cy - 22, 6, 26);
  g.fillStyle(0x4a7850, 0.60);
  g.fillRect(cx - 13, cy - 22, 3, 24);

  // ── Maw (half-open; bile-yellow lining) ──────────────────────────────
  // Upper jaw shadow
  g.fillStyle(0x080c08, 1);
  g.fillRect(cx - 2, cy - 6, 26, 14);
  // Maw interior — bile-yellow
  g.fillStyle(0xc8a020, 1);
  g.fillRect(cx - 0, cy - 4, 22, 10);
  g.fillStyle(0xe8c840, 0.70);
  g.fillRect(cx + 2, cy - 3, 16, 6);
  // Maw drip — acid suggestion
  g.fillStyle(0x88aa00, 0.80);
  g.fillRect(cx + 6, cy + 4, 2, 4);
  g.fillRect(cx + 14, cy + 5, 2, 3);

  // Teeth — upper row
  g.fillStyle(0xddd8b0, 1);
  for (let i = 0; i < 5; i++) {
    g.fillTriangle(
      cx + 1 + i * 4, cy - 4,
      cx + 3 + i * 4, cy - 4,
      cx + 2 + i * 4, cy - 9,
    );
  }
  // Teeth — lower row
  for (let i = 0; i < 4; i++) {
    g.fillTriangle(
      cx + 2 + i * 5, cy + 6,
      cx + 4 + i * 5, cy + 6,
      cx + 3 + i * 5, cy + 11,
    );
  }

  // ── Eye — cold amber, serpentine slit ────────────────────────────────
  g.fillStyle(0xd88020, 1);
  g.fillEllipse(cx + 2, cy - 14, 10, 7);
  g.fillStyle(0x000000, 1);
  g.fillRect(cx + 5, cy - 17, 2, 13);    // vertical slit pupil
  g.fillStyle(0xf0a840, 0.80);
  g.fillCircle(cx + 1, cy - 15, 1.5);   // eye highlight

  // ── Nostril slits ────────────────────────────────────────────────────
  g.fillStyle(0x080c08, 1);
  g.fillRect(cx + 16, cy - 10, 3, 1.5);
  g.fillRect(cx + 18, cy - 13, 2, 1.5);

  // ── Rim glow — sea-green phosphorescence (telegraphs scale-lock state)
  g.fillStyle(0x44aa66, 0.22);
  g.fillEllipse(cx - 2, cy - 2, 70, 60);

}

export function bakeBossStoorWorm(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const s = BOSS_STOOR_WORM_CANVAS_SIZE;
  drawBossStoorWorm(g);
  g.generateTexture('boss_stoor_worm', s, s);
  g.destroy();
}
