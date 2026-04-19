/**
 * `deco_glasgow_kite` — a crumpled Asda-blue plastic bag blowing on the
 * wind. Local name in Glasgow parlance for windblown litter. ASDA price
 * sticker still attached, muddy scuff from being dragged across the moor.
 */

import Phaser from 'phaser';

export function bakeGlasgowKite(scene: Phaser.Scene): void {
  // 22×22 — crumpled Asda-blue plastic bag blowing in the wind
  const s = 22;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;
  // Main bag body — billowing, asymmetric
  g.fillStyle(0xaac8e8, 0.55);
  g.fillTriangle(cx - 7, cy + 6, cx + 7, cy + 7, cx + 9, cy - 2);
  g.fillTriangle(cx - 7, cy + 6, cx - 5, cy - 4, cx + 9, cy - 2);
  // Wind-stretched left side
  g.fillStyle(0x99bde0, 0.5);
  g.fillTriangle(cx - 9, cy + 3, cx - 5, cy - 3, cx - 4, cy + 5);
  // Lighter crinkle patches (simulating crumpled plastic)
  g.fillStyle(0xd4e8f8, 0.45);
  g.fillTriangle(cx - 2, cy, cx + 4, cy - 1, cx + 3, cy + 4);
  g.fillStyle(0xc0d8f0, 0.4);
  g.fillTriangle(cx - 4, cy + 2, cx, cy + 1, cx - 1, cy + 6);
  // Handle loops at top — two small arcs
  g.lineStyle(1.5, 0x88b8d8, 0.6);
  g.strokeCircle(cx - 3, cy - 5, 2);
  g.strokeCircle(cx + 2, cy - 5, 2);
  // Subtle highlight line (light catching plastic)
  g.lineStyle(1, 0xeef6ff, 0.5);
  g.lineBetween(cx - 5, cy - 1, cx + 2, cy - 3);
  // Wind-tail flutter at bottom-right
  g.fillStyle(0x99bde0, 0.35);
  g.fillTriangle(cx + 7, cy + 5, cx + 11, cy + 8, cx + 8, cy + 9);
  // ASDA price sticker still attached — brighter green, slightly larger to pop
  g.fillStyle(0x6ac52b, 0.55);
  g.fillRect(cx + 1, cy + 2, 3, 3);
  // Muddy scuff from being dragged across the moor
  g.fillStyle(0x554422, 0.2);
  g.fillCircle(cx + 3, cy + 4, 1);
  g.generateTexture('deco_glasgow_kite', s, s);
  g.destroy();
}
