/**
 * `edinburgh_ghost_guide` — spectral Royal Mile tour guide. Design
 * pivot: old sprite read as "generic top-hatted figure" because the
 * ghost anchor was weak and the lantern small. New pitch — bright
 * GOLD LANTERN is now the dominant prop, held high and glowing; the
 * guide's OTHER HAND is raised mid-gesture (tour-guide pointing
 * pose); a wide-brimmed TOP HAT with a red tartan band; ghostly
 * face with hollow cyan eyes and a sunken jaw. The "on tour" read
 * is unmistakable at scale.
 */

import Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const EDINBURGH_GHOST_GUIDE_CANVAS_SIZE = 44;

export function drawEdinburghGhostGuideBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = EDINBURGH_GHOST_GUIDE_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);

  // ── Ectoplasmic aura — two layers of cold cyan. ──
  g.fillStyle(0x8fc6d4, 0.2);
  g.fillEllipse(cx, cy, 30, 34);
  g.fillStyle(0x8fc6d4, 0.1);
  g.fillEllipse(cx, cy, 38, 42);

  // ── Lantern glow halo — bright amber aura behind everything so
  // the lamp reads as a light source, not a prop. ──
  g.fillStyle(0xffd88a, 0.35);
  g.fillCircle(cx + 12, cy - 2, 9);
  g.fillStyle(0xffcc66, 0.25);
  g.fillCircle(cx + 12, cy - 2, 12);

  // ── Long Victorian frock coat — black-blue with coat-tails. ──
  g.fillStyle(0x0a1220, 1);
  g.fillTriangle(cx - 10, cy + 18, cx + 10, cy + 18, cx + 6, cy - 3);
  g.fillTriangle(cx - 10, cy + 18, cx - 6, cy - 3, cx + 6, cy - 3);
  g.fillStyle(0x1e2838, 1);
  g.fillTriangle(cx - 8, cy + 16, cx + 8, cy + 16, cx + 5, cy - 2);
  g.fillTriangle(cx - 8, cy + 16, cx - 5, cy - 2, cx + 5, cy - 2);

  // ── Coat-tails trailing down and outward. ──
  g.fillStyle(0x0a1220, 0.85);
  g.fillTriangle(cx - 10, cy + 18, cx - 15, cy + 22, cx - 6, cy + 17);
  g.fillTriangle(cx + 10, cy + 18, cx + 15, cy + 22, cx + 6, cy + 17);

  // ── Wispy bottom trails (no feet — ghost drift). ──
  g.fillStyle(0x8fc6d4, 0.4);
  for (let i = 0; i < 4; i++) {
    g.fillCircle(cx - 6 + i * 4, cy + 19, 2);
  }
  g.fillStyle(0x8fc6d4, 0.25);
  for (let i = 0; i < 5; i++) {
    g.fillCircle(cx - 8 + i * 4, cy + 21, 1.5);
  }

  // ── White shirt-front with cravat — visible at the chest gap. ──
  g.fillStyle(0xe8ecf0, 1);
  g.fillRect(cx - 2, cy - 3, 4, 5);
  // Red silk cravat
  g.fillStyle(0x8a1818, 1);
  g.fillTriangle(cx - 1.5, cy - 3, cx + 1.5, cy - 3, cx, cy + 2);
  g.fillStyle(0xaa2828, 1);
  g.fillTriangle(cx - 1, cy - 3, cx + 1, cy - 3, cx, cy + 1);

  // ── Pale gaunt face. ──
  g.fillStyle(0xd8e6ee, 0.95);
  g.fillEllipse(cx, cy - 9, 9, 11);
  g.fillStyle(0xe8f0f6, 1);
  g.fillEllipse(cx, cy - 10, 7, 9);

  // ── Hollow cyan eyes — bigger than before so they read at scale. ──
  g.fillStyle(0x000000, 0.9);
  g.fillCircle(cx - 2.5, cy - 10, 1.5);
  g.fillCircle(cx + 2.5, cy - 10, 1.5);
  g.fillStyle(0x4addee, 1);
  g.fillCircle(cx - 2.5, cy - 10, 1);
  g.fillCircle(cx + 2.5, cy - 10, 1);
  g.fillStyle(0xaffaff, 1);
  g.fillCircle(cx - 2.5, cy - 10.3, 0.4);
  g.fillCircle(cx + 2.5, cy - 10.3, 0.4);

  // ── Thin tour-guide moustache — twirled tips. ──
  g.fillStyle(0x1a1a24, 1);
  g.fillRect(cx - 3, cy - 7, 6, 0.8);
  g.fillCircle(cx - 3.5, cy - 7, 0.5);
  g.fillCircle(cx + 3.5, cy - 7, 0.5);
  // Sunken jaw — thin dark slit
  g.fillStyle(0x1a2838, 1);
  g.fillRect(cx - 1.5, cy - 5, 3, 0.5);

  // ── BIG TOP HAT with tartan band — widened so the silhouette
  // shouts "Victorian gentleman". ──
  // Crown (taller cylinder)
  g.fillStyle(0x0a0e14, 1);
  g.fillRect(cx - 6, cy - 20, 12, 7);
  g.fillStyle(0x1e2838, 1);
  g.fillRect(cx - 5, cy - 19, 10, 5);
  // Sheen strip
  g.fillStyle(0x3a4858, 0.7);
  g.fillRect(cx - 5, cy - 19, 2, 5);
  // RED TARTAN BAND — the anchor that says "Edinburgh tour"
  g.fillStyle(0x8a1818, 1);
  g.fillRect(cx - 6, cy - 14.5, 12, 1.8);
  g.fillStyle(0x2a0808, 1);
  g.fillRect(cx - 6, cy - 14, 12, 0.5);
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 3, cy - 14.5, 0.5, 1.8);
  g.fillRect(cx + 2.5, cy - 14.5, 0.5, 1.8);
  // Wide brim
  g.fillStyle(0x0a0e14, 1);
  g.fillRect(cx - 8, cy - 13, 16, 1.5);
  g.fillStyle(0x2a3040, 1);
  g.fillRect(cx - 8, cy - 13, 16, 0.5);

  // ── LEFT HAND — raised mid-gesture ("and if you look to the left,
  // you'll see the haunted close…"). Pale, skeletal. ──
  g.fillStyle(0xd8e6ee, 1);
  g.fillRect(cx - 10, cy - 2, 2, 4);
  g.fillCircle(cx - 10, cy - 3, 1.5);
  // Pointing finger
  g.fillRect(cx - 12, cy - 4, 1.2, 3);

  // ── RIGHT HAND — holding the lantern pole. ──
  g.fillStyle(0xd8e6ee, 1);
  g.fillCircle(cx + 9, cy, 1.5);

  // ── LANTERN — BIG, bright, dominant prop on the right. Old-style
  // oil lamp with glass panels and brass top. ──
  // Pole up to the lantern
  g.fillStyle(0x4a3818, 1);
  g.fillRect(cx + 10, cy - 6, 1.2, 6);
  // Lantern body — 4-panel brass frame
  g.fillStyle(0x2a1a08, 1);
  g.fillRect(cx + 9, cy - 10, 6, 7);
  g.fillStyle(0x6a4818, 1);
  g.fillRect(cx + 9, cy - 10, 6, 0.8);
  g.fillRect(cx + 9, cy - 4, 6, 0.8);
  // Glass window — BRIGHT amber-yellow
  g.fillStyle(0xffcc66, 1);
  g.fillRect(cx + 10, cy - 9, 4, 5);
  g.fillStyle(0xfff0a0, 1);
  g.fillRect(cx + 10.5, cy - 9, 3, 4);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx + 12, cy - 7, 1.3);
  // Brass frame bars dividing the glass into panels
  g.fillStyle(0x4a3010, 0.85);
  g.fillRect(cx + 12, cy - 10, 0.5, 7);
  g.fillRect(cx + 9, cy - 7, 6, 0.4);
  // Brass dome/chimney top
  g.fillStyle(0x4a3010, 1);
  g.fillTriangle(cx + 9, cy - 10, cx + 15, cy - 10, cx + 12, cy - 13);
  g.fillStyle(0x8a6028, 1);
  g.fillTriangle(cx + 10, cy - 10.5, cx + 14, cy - 10.5, cx + 12, cy - 12.5);
}

export function bakeEdinburghGhostGuide(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawEdinburghGhostGuideBody(g);
  g.generateTexture('edinburgh_ghost_guide', EDINBURGH_GHOST_GUIDE_CANVAS_SIZE, EDINBURGH_GHOST_GUIDE_CANVAS_SIZE);
  g.destroy();
}
