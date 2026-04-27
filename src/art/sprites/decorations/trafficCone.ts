/**
 * `deco_cone` — Duke-of-Wellington traffic cone. v4 lift: weather wear
 * (paint scuff on the lower-right body, mud splatter at base, scratched
 * reflective bands), slight lean for moor-native non-UI feel, contact
 * shadow grounded with a deeper layered halo. Same texture key, same
 * 28x28 canvas.
 */

import * as Phaser from 'phaser';

export function bakeTrafficCone(scene: Phaser.Scene): void {
  const s = 28;
  const g = scene.add.graphics();
  const cx = 14;
  // Each row is offset by a tiny lean amount: leans 1px right at top.
  // This is the moor-native "kicked over slightly" tilt.
  const leanFor = (y: number): number => {
    // 0 at base, +1 at tip. Linear ramp.
    const t = (20 - y) / 16;
    return t * 1;
  };

  // ── Layered ground shadow — bigger, asymmetric (lean direction). ──
  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(cx + 1, 25, 20, 5);
  g.fillStyle(0x000000, 0.28);
  g.fillEllipse(cx, 24, 16, 3.5);

  // ── Black rubber base — wide, flat. ──
  g.fillStyle(0x1a1a1a, 1);
  g.fillRect(cx - 8, 20, 16, 4);
  g.fillStyle(0x2a2a2a, 1);
  g.fillRect(cx - 7, 21, 14, 2);
  // Base scuff — chip on the right corner
  g.fillStyle(0x0a0a0a, 1);
  g.fillRect(cx + 6, 22, 2, 2);

  // ── Cone body — built row by row with lean. ──
  const rows: [number, number][] = [
    [19, 6], [18, 6], [17, 5], [16, 5], [15, 5],
    [14, 4], [13, 4], [12, 4], [11, 3], [10, 3],
    [9, 3], [8, 2], [7, 2], [6, 2], [5, 1], [4, 1],
  ];

  // Dark side (right half of each row) — apply lean
  for (const [y, hw] of rows) {
    const off = leanFor(y);
    g.fillStyle(0xcc3300, 1);
    g.fillRect(cx + off, y, hw, 1);
  }
  // Bright side (left half of each row)
  for (const [y, hw] of rows) {
    const off = leanFor(y);
    g.fillStyle(0xff5500, 1);
    g.fillRect(cx + off - hw, y, hw, 1);
  }
  // Highlight strip
  for (const [y, hw] of rows) {
    const off = leanFor(y);
    g.fillStyle(0xff8833, 1);
    g.fillRect(cx + off - hw, y, 1, 1);
  }

  // ── PAINT-SCUFF WEATHER WEAR — desaturated patch on lower-right
  // body where the cone has been kicked, a darker faded orange. ──
  g.fillStyle(0xa44a30, 0.85);
  g.fillRect(cx + 1, 17, 4, 2);
  g.fillStyle(0x884028, 0.7);
  g.fillRect(cx + 2, 18, 3, 1);
  // Tiny exposed-plastic crack
  g.fillStyle(0x4a2010, 0.9);
  g.fillRect(cx + 3, 17.5, 1, 0.5);

  // ── White reflective bands — scratched, not pristine. ──
  const upperBand: [number, number][] = [[9, 3], [10, 3], [11, 3]];
  for (const [y, hw] of upperBand) {
    const off = leanFor(y);
    g.fillStyle(0xefe8d8, 0.9);  // slightly off-white (yellowed)
    g.fillRect(cx + off - hw, y, hw * 2, 1);
    g.fillStyle(0xb8b0a0, 0.55);
    g.fillRect(cx + off + 1, y, hw - 1, 1);
  }
  // Upper-band scratch
  g.fillStyle(0xcc3300, 0.6);
  g.fillRect(cx + 1, 10, 1, 1);

  const lowerBand: [number, number][] = [[15, 5], [16, 5], [17, 5]];
  for (const [y, hw] of lowerBand) {
    const off = leanFor(y);
    g.fillStyle(0xefe8d8, 0.9);
    g.fillRect(cx + off - hw, y, hw * 2, 1);
    g.fillStyle(0xb8b0a0, 0.55);
    g.fillRect(cx + off + 1, y, hw - 1, 1);
  }
  // Lower-band scuff/mud
  g.fillStyle(0x6a4a28, 0.7);
  g.fillRect(cx - 4, 17, 2, 1);

  // ── Pointed tip. ──
  const tipOff = leanFor(3);
  g.fillStyle(0xff6622, 1);
  g.fillRect(cx + tipOff - 1, 3, 2, 2);
  g.fillStyle(0xffaa55, 1);
  g.fillRect(cx + tipOff - 1, 3, 1, 1);

  // ── Right-edge dark outline (depth). ──
  for (const [y, hw] of rows) {
    const off = leanFor(y);
    g.fillStyle(0x881800, 0.6);
    g.fillRect(cx + off + hw - 1, y, 1, 1);
  }

  // ── MUD SPLATTER at base — moor-native dirt scatter. ──
  g.fillStyle(0x4a3a20, 0.85);
  g.fillCircle(cx - 9, 22, 1.2);
  g.fillCircle(cx + 8, 21, 0.9);
  g.fillCircle(cx - 6, 23.5, 0.7);
  g.fillStyle(0x2a1a10, 0.7);
  g.fillCircle(cx - 9, 22, 0.5);
  g.fillCircle(cx + 8, 21, 0.4);

  g.generateTexture('deco_cone', s, s);
  g.destroy();
}
