/**
 * `deco_thistle` — Scotland's crown flower. Layered purple head with
 * feathery florets, spiky calyx of 10 bracts, serrated silver-veined
 * leaves, ribbed stem with tiny thorns, dusting of pollen.
 */

import Phaser from 'phaser';

export function bakeThistle(scene: Phaser.Scene): void {
  const s = 24;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 3;

  // Ground shadow
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(cx, cy + 8, 12, 4);

  // ── Stem — thick, ribbed, slightly thorny ──
  g.fillStyle(0x152e0c, 1);
  g.fillRect(cx - 1, cy - 2, 3, 11);
  g.fillStyle(0x1e3a12, 1);
  g.fillRect(cx, cy - 2, 1, 11);
  // Stem thorns (tiny 1px spurs)
  g.fillStyle(0x152e0c, 1);
  g.fillRect(cx - 2, cy + 2, 1, 1);
  g.fillRect(cx + 2, cy + 4, 1, 1);
  g.fillRect(cx - 2, cy + 6, 1, 1);

  // ── Left leaf — serrated, silver-veined ──
  g.fillStyle(0x2a5518, 1);
  g.fillTriangle(cx - 7, cy + 3, cx - 1, cy + 1, cx - 1, cy + 7);
  g.fillStyle(0x3a6822, 1);
  g.fillTriangle(cx - 6, cy + 3, cx - 1, cy + 2, cx - 1, cy + 6);
  // Leaf vein (lighter centre line)
  g.fillStyle(0x4a8830, 0.6);
  g.fillRect(cx - 4, cy + 3, 3, 1);
  // Serrated spine tips along leaf edge
  g.fillStyle(0x1e3a12, 1);
  g.fillRect(cx - 6, cy + 2, 1, 1);
  g.fillRect(cx - 5, cy + 4, 1, 1);
  g.fillRect(cx - 3, cy + 5, 1, 1);

  // ── Right leaf — mirror, slight variation ──
  g.fillStyle(0x2a5518, 1);
  g.fillTriangle(cx + 7, cy + 4, cx + 1, cy + 1, cx + 1, cy + 7);
  g.fillStyle(0x3a6822, 1);
  g.fillTriangle(cx + 6, cy + 4, cx + 1, cy + 2, cx + 1, cy + 6);
  g.fillStyle(0x4a8830, 0.6);
  g.fillRect(cx + 2, cy + 4, 3, 1);
  g.fillStyle(0x1e3a12, 1);
  g.fillRect(cx + 5, cy + 3, 1, 1);
  g.fillRect(cx + 4, cy + 5, 1, 1);
  g.fillRect(cx + 6, cy + 4, 1, 1);

  // ── Small secondary leaf (lower, adds fullness) ──
  g.fillStyle(0x2a5518, 0.8);
  g.fillTriangle(cx - 4, cy + 6, cx, cy + 5, cx, cy + 8);

  // ── Green calyx — the spiky involucre at base of flower head ──
  g.fillStyle(0x2a5518, 1);
  g.fillCircle(cx, cy - 3, 4);
  // Calyx bracts — 10 sharp overlapping scales
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const dark = i % 2 === 0;
    g.fillStyle(dark ? 0x1e3a12 : 0x2e5518, 1);
    g.fillTriangle(
      cx + Math.cos(a) * 3, cy - 3 + Math.sin(a) * 3,
      cx + Math.cos(a + 0.3) * 5.5, cy - 3 + Math.sin(a + 0.3) * 5.5,
      cx + Math.cos(a - 0.3) * 5.5, cy - 3 + Math.sin(a - 0.3) * 5.5,
    );
  }
  // Calyx spine tips (brighter, catching light)
  g.fillStyle(0x5a8833, 0.7);
  for (let i = 0; i < 10; i += 2) {
    const a = (i / 10) * Math.PI * 2;
    g.fillRect(cx + Math.cos(a) * 5.5 - 0.3, cy - 3 + Math.sin(a) * 5.5 - 0.3, 1, 1);
  }

  // ── Thistle head — layered purple, Scotland's crown ──
  // Dark core
  g.fillStyle(0x2a0e44, 1);
  g.fillCircle(cx, cy - 4, 4);
  // Rich purple body
  g.fillStyle(0x6633aa, 1);
  g.fillCircle(cx, cy - 4, 3.5);
  // Mid purple — upper bloom
  g.fillStyle(0x8844cc, 1);
  g.fillCircle(cx, cy - 5, 2.8);
  // Bright purple crown
  g.fillStyle(0xaa55dd, 1);
  g.fillCircle(cx - 0.5, cy - 5.5, 2);
  // Light highlight shimmer
  g.fillStyle(0xcc88ff, 0.8);
  g.fillCircle(cx - 1, cy - 6, 1.2);
  // Specular dot
  g.fillStyle(0xeeccff, 0.6);
  g.fillCircle(cx - 1, cy - 6.5, 0.5);

  // ── Radiating floret tips — the feathery crown ──
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r = 4.5 + (i % 2) * 0.5;
    // Each floret tip — bright pink-purple dot
    g.fillStyle(i % 3 === 0 ? 0xdd99ff : 0xcc88ee, 1);
    g.fillRect(cx + Math.cos(a) * r - 0.5, cy - 4 + Math.sin(a) * r - 0.5, 1, 1);
  }

  // ── Pollen dust (barely visible golden motes above flower) ──
  g.fillStyle(0xffdd88, 0.3);
  g.fillRect(cx + 2, cy - 8, 1, 1);
  g.fillRect(cx - 2, cy - 9, 1, 1);

  g.generateTexture('deco_thistle', s, s);
  g.destroy();
}
