/**
 * `hud_shield` — small Highland targe icon for the shield-active HUD
 * indicator. Riveted rim, centre boss, subtle light model.
 */

import Phaser from 'phaser';

export function bakeShield(scene: Phaser.Scene): void {
  // ── Shield icon — Highland targe shape with riveted rim and celtic knot hint ──
  const s = 18;
  const g = scene.add.graphics();
  const cx = s / 2;
  const cy = s / 2;
  // Dark outline
  g.fillStyle(0x1a3a4a, 1);
  g.fillTriangle(cx, cy - 8, cx + 7, cy + 2, cx, cy + 8);
  g.fillTriangle(cx, cy - 8, cx - 7, cy + 2, cx, cy + 8);
  // Steel-blue body
  g.fillStyle(0x3a7ca5, 1);
  g.fillTriangle(cx, cy - 7, cx + 6, cy + 2, cx, cy + 7);
  g.fillTriangle(cx, cy - 7, cx - 6, cy + 2, cx, cy + 7);
  // Inner highlight (lighter face — light from upper left)
  g.fillStyle(0x5a9cc5, 0.6);
  g.fillTriangle(cx, cy - 5, cx - 4, cy + 1, cx, cy + 4);
  // Subtle bright edge (top-left rim catches light)
  g.fillStyle(0x8fd4ff, 0.45);
  g.fillTriangle(cx, cy - 5, cx - 3, cy, cx, cy + 3);
  // Centre boss rivet (small bright dot — targe detail)
  g.fillStyle(0xaaddee, 0.8);
  g.fillCircle(cx, cy, 1.2);
  g.fillStyle(0xddeeff, 0.5);
  g.fillCircle(cx - 0.3, cy - 0.3, 0.5);
  // Rim highlight (right edge — subtle, adds depth)
  g.fillStyle(0x2a6080, 0.6);
  g.fillRect(cx + 4, cy - 2, 1, 4);
  g.generateTexture('hud_shield', s, s);
  g.destroy();
}
