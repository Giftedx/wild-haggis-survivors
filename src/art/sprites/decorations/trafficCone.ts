/**
 * `deco_cone` — Duke-of-Wellington traffic cone, standing upright.
 * Chunky rubber base, tapered orange body built row-by-row, two white
 * reflective bands, pointed tip. The kind you'd pinch off Buchanan
 * Street and stick on a statue.
 */

import * as Phaser from 'phaser';

export function bakeTrafficCone(scene: Phaser.Scene): void {
  // 28×28 — THE Duke of Wellington cone. Upright, chunky, unmistakable.
  const s = 28;
  const g = scene.add.graphics();
  const cx = 14;
  // Ground shadow
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(cx, 24, 16, 4);
  // ── Black rubber base — wide, flat, square-ish ──
  g.fillStyle(0x1a1a1a, 1);
  g.fillRect(cx - 8, 20, 16, 4);
  g.fillStyle(0x2a2a2a, 1);
  g.fillRect(cx - 7, 21, 14, 2);
  // ── Cone body — built row by row for clean taper ──
  // Each row: y position, half-width at that row
  const rows: [number, number][] = [
    [19, 6], [18, 6], [17, 5], [16, 5], [15, 5],
    [14, 4], [13, 4], [12, 4], [11, 3], [10, 3],
    [9, 3], [8, 2], [7, 2], [6, 2], [5, 1], [4, 1],
  ];
  // Dark side (right half of each row)
  for (const [y, hw] of rows) {
    g.fillStyle(0xcc3300, 1);
    g.fillRect(cx, y, hw, 1);
  }
  // Bright side (left half of each row)
  for (const [y, hw] of rows) {
    g.fillStyle(0xff5500, 1);
    g.fillRect(cx - hw, y, hw, 1);
  }
  // Highlight strip (left edge, 1px wide, brighter orange)
  for (const [y, hw] of rows) {
    g.fillStyle(0xff8833, 1);
    g.fillRect(cx - hw, y, 1, 1);
  }
  // ── White reflective bands — two bands like a real UK cone ──
  // Upper band (narrower, higher on cone)
  const upperBand: [number, number][] = [
    [9, 3], [10, 3], [11, 3],
  ];
  for (const [y, hw] of upperBand) {
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(cx - hw, y, hw * 2, 1);
    // Grey shadow on right half
    g.fillStyle(0xcccccc, 0.5);
    g.fillRect(cx + 1, y, hw - 1, 1);
  }
  // Lower band (wider, lower on cone)
  const lowerBand: [number, number][] = [
    [15, 5], [16, 5], [17, 5],
  ];
  for (const [y, hw] of lowerBand) {
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(cx - hw, y, hw * 2, 1);
    g.fillStyle(0xcccccc, 0.5);
    g.fillRect(cx + 1, y, hw - 1, 1);
  }
  // ── Pointed tip ──
  g.fillStyle(0xff6622, 1);
  g.fillRect(cx - 1, 3, 2, 2);
  g.fillStyle(0xffaa55, 1);
  g.fillRect(cx - 1, 3, 1, 1);
  // ── Dark outline on right edge for depth ──
  for (const [y, hw] of rows) {
    g.fillStyle(0x881800, 0.6);
    g.fillRect(cx + hw - 1, y, 1, 1);
  }
  g.generateTexture('deco_cone', s, s);
  g.destroy();
}
