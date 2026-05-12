import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';

/**
 * `ucard_widows_shawl` — a dark wool shawl folded in a soft drape. The
 * weave shows in horizontal hatched ridges; a single thread of mourning
 * grey trims the edge. Warm despite the dark palette — the shawl is
 * solace, not sorrow.
 */
export function drawWidowsShawl(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  cardIconBg(g, s, 0x171318);
  const cx = 16, cy = 16;

  // Drop shadow under the folded shawl.
  g.fillStyle(0x000000, 0.45);
  g.fillEllipse(cx, cy + 9, 24, 3);

  const WOOL_DARK = 0x2a1c20;
  const WOOL = 0x4a3038;
  const WOOL_HI = 0x6a4858;
  const TRIM = 0x9a8090;

  // ── Main drape — soft triangular pile in the centre, flares to
  // shoulder width then curls under at the bottom.
  g.fillStyle(WOOL_DARK, 1);
  g.fillTriangle(cx - 11, cy + 6, cx, cy - 8, cx + 11, cy + 6);
  g.fillRect(cx - 11, cy + 5, 22, 4);
  // Body fill.
  g.fillStyle(WOOL, 1);
  g.fillTriangle(cx - 10, cy + 6, cx, cy - 6.8, cx + 10, cy + 6);
  g.fillRect(cx - 10, cy + 5.4, 20, 3);
  // Highlight along the central drape ridge.
  g.fillStyle(WOOL_HI, 0.7);
  g.fillTriangle(cx - 1, cy + 5, cx, cy - 5, cx + 1, cy + 5);

  // ── Weave hatching — short horizontal pale dashes across the drape
  // body. Density falls off toward the edges so the silhouette stays
  // soft. Mirrors a real shawl's herringbone-ish hand.
  g.fillStyle(WOOL_HI, 0.55);
  for (let row = 0; row < 5; row++) {
    const y = cy - 4 + row * 2;
    const halfWidth = 4 + row * 1.4;
    for (let i = -halfWidth; i <= halfWidth; i += 1.8) {
      g.fillRect(cx + i, y, 0.9, 0.4);
    }
  }

  // ── Trim — a paler border line tracing the V at the top edge.
  g.lineStyle(0.8, TRIM, 0.9);
  g.beginPath();
  g.moveTo(cx - 10.5, cy + 5.4);
  g.lineTo(cx, cy - 6.6);
  g.lineTo(cx + 10.5, cy + 5.4);
  g.strokePath();
  // Trim along the bottom hem.
  g.lineStyle(0.7, TRIM, 0.7);
  g.beginPath();
  g.moveTo(cx - 10.5, cy + 8.5);
  g.lineTo(cx + 10.5, cy + 8.5);
  g.strokePath();

  // ── Fringe — five short threads hanging from the bottom edge.
  g.fillStyle(WOOL_DARK, 1);
  for (let i = -2; i <= 2; i++) {
    g.fillRect(cx + i * 4 - 0.4, cy + 9, 0.8, 2.2);
  }
  g.fillStyle(WOOL_HI, 0.7);
  for (let i = -2; i <= 2; i++) {
    g.fillRect(cx + i * 4 - 0.2, cy + 9.2, 0.4, 1.6);
  }

  // ── A small brooch at the top apex — pewter, plain. The widow's
  // ornament: present, not flashy.
  g.fillStyle(0x0a0a0e, 1);
  g.fillCircle(cx, cy - 6.2, 1.6);
  g.fillStyle(0x8a8a92, 1);
  g.fillCircle(cx, cy - 6.2, 1.1);
  g.fillStyle(0xc0c0c8, 0.85);
  g.fillCircle(cx - 0.3, cy - 6.5, 0.5);

  g.generateTexture('ucard_widows_shawl', s, s);
  g.destroy();
}
