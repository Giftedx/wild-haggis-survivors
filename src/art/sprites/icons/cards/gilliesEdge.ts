import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';

/**
 * `ucard_gillies_edge` — the gamekeeper's gillie brogue (the laced
 * Highland walking shoe). Soft brown leather, leather laces criss-
 * crossing up the front, low ankle. Sells light foot + quick step.
 */
export function drawGilliesEdge(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  cardIconBg(g, s, 0x141a14);
  const cx = 16, cy = 18;

  // Drop shadow under the brogue.
  g.fillStyle(0x000000, 0.45);
  g.fillEllipse(cx, cy + 7, 22, 3);

  const LEATHER_DARK = 0x3a2614;
  const LEATHER = 0x6a4424;
  const LEATHER_HI = 0x9a6a40;
  const LACE = 0x4a2e18;

  // ── Sole — flat plank, dark.
  g.fillStyle(0x0a0a0e, 1);
  g.fillRect(cx - 11, cy + 4, 22, 3);
  g.fillStyle(0x1a1410, 1);
  g.fillRect(cx - 10.4, cy + 4.4, 20.8, 2.2);
  g.fillStyle(0x2a201a, 0.9);
  g.fillRect(cx - 9.6, cy + 4.6, 19.2, 0.6);

  // ── Upper — toe → arch → heel. Curved tongue at the top.
  g.fillStyle(LEATHER_DARK, 1);
  // Outline (rounded shoe shape).
  g.fillEllipse(cx - 5, cy, 14, 9);     // toe-box
  g.fillRect(cx - 8, cy - 4, 14, 9);    // body
  g.fillEllipse(cx + 6, cy - 1, 8, 7);  // heel curl
  // Lit body.
  g.fillStyle(LEATHER, 1);
  g.fillEllipse(cx - 5, cy - 0.4, 12, 7.5);
  g.fillRect(cx - 7, cy - 3.4, 13, 7.5);
  g.fillEllipse(cx + 6, cy - 1.4, 7, 5.8);
  // Top highlight.
  g.fillStyle(LEATHER_HI, 0.8);
  g.fillRect(cx - 6, cy - 4, 11, 1.2);
  g.fillStyle(LEATHER_HI, 0.5);
  g.fillEllipse(cx - 4, cy - 2.4, 8, 1.6);

  // ── Tongue — slightly paler patch at the top centre.
  g.fillStyle(LEATHER_DARK, 1);
  g.fillRoundedRect(cx - 4, cy - 6, 8, 4, 1.2);
  g.fillStyle(LEATHER, 1);
  g.fillRoundedRect(cx - 3.4, cy - 5.6, 6.8, 3.2, 0.9);
  g.fillStyle(LEATHER_HI, 0.7);
  g.fillRect(cx - 3, cy - 5.4, 6, 0.6);

  // ── Laces — three crossed pairs over the front. Each crossing is two
  // short diagonal strokes.
  g.lineStyle(0.9, LACE, 1);
  for (let i = 0; i < 3; i++) {
    const ly = cy - 4 + i * 2.0;
    g.beginPath(); g.moveTo(cx - 3.6, ly); g.lineTo(cx + 3.6, ly + 0.4); g.strokePath();
    g.beginPath(); g.moveTo(cx + 3.6, ly); g.lineTo(cx - 3.6, ly + 0.4); g.strokePath();
  }
  // Lace tips poking up at the very top.
  g.fillStyle(LACE, 1);
  g.fillRect(cx - 4.6, cy - 6.4, 0.8, 1.6);
  g.fillRect(cx + 3.8, cy - 6.4, 0.8, 1.6);

  // ── Tiny speed-line accents to the left — three short pale lines
  // marking motion. Sells "+8% move speed" without a number.
  g.fillStyle(0xb8d8a8, 0.6);
  g.fillRect(cx - 14, cy - 4, 3, 0.6);
  g.fillRect(cx - 13.4, cy - 2, 2.4, 0.6);
  g.fillRect(cx - 13.4, cy, 2.6, 0.6);

  g.generateTexture('ucard_gillies_edge', s, s);
  g.destroy();
}
