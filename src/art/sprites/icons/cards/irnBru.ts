import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';
/**
 * `ucard_irn_bru` — Scottish health drink icon. Design pivot: old
 * icon had a thin blue stripe on an orange bottle — read as "any
 * generic orange soda" because the Scottish anchor was too faint
 * at 32px. New pitch — clear bottle full of ORANGE Irn-Bru with a
 * BOLD BLUE LABEL featuring a WHITE SALTIRE (Scottish flag cross)
 * and yellow trim stripes. Blue + yellow + orange = unmistakable
 * Irn-Bru brand palette; the saltire locks in "Scottish".
 */
export function drawIrnBru(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x44220f);
  const cx = 16;

  // ── Bottle cap — dark blue with yellow rim (Irn-Bru brand). ──
  g.fillStyle(0x0a1a44, 1);
  g.fillRect(cx - 3, 4, 6, 4);
  g.fillStyle(0x2244aa, 1);
  g.fillRect(cx - 3, 4, 6, 3);
  g.fillStyle(0xffcc22, 1);
  g.fillRect(cx - 3, 7, 6, 1);
  // Cap ridges
  g.fillStyle(0x0a1a44, 1);
  g.fillRect(cx - 3, 5, 6, 0.4);
  g.fillRect(cx - 3, 6, 6, 0.4);

  // ── Bottle neck. ──
  g.fillStyle(0x0a0a12, 1);
  g.fillRect(cx - 2, 8, 4, 2);

  // ── BOTTLE BODY outline + ORANGE IRN-BRU liquid. The orange
  // is the dominant tell. ──
  g.fillStyle(0x1a0a00, 1);
  g.fillRoundedRect(cx - 7, 10, 14, 16, 3);
  g.fillStyle(0xdd5500, 1);
  g.fillRoundedRect(cx - 6, 11, 12, 14, 2);
  g.fillStyle(0xff7711, 1);
  g.fillRoundedRect(cx - 6, 12, 12, 12, 2);
  g.fillStyle(0xff9933, 1);
  g.fillRoundedRect(cx - 5, 12, 10, 10, 1.5);
  // Orange fizz highlight
  g.fillStyle(0xffbb55, 0.85);
  g.fillRect(cx - 3, 13, 3, 8);
  g.fillStyle(0xffdd88, 0.55);
  g.fillRect(cx - 2, 14, 2, 7);

  // ── BLUE LABEL BAND with WHITE SALTIRE — the Scottish-flag
  // anchor. Unmistakable Irn-Bru + Scotland. ──
  g.fillStyle(0x0a0a2a, 1);
  g.fillRect(cx - 7, 15.5, 14, 8);
  g.fillStyle(0x1a3a88, 1);
  g.fillRect(cx - 7, 16, 14, 7);
  // WHITE SALTIRE — two diagonals crossing
  g.lineStyle(1.6, 0xffffff, 1);
  g.lineBetween(cx - 6, 16.5, cx + 6, 22.5);
  g.lineBetween(cx + 6, 16.5, cx - 6, 22.5);
  // Yellow trim stripes top + bottom of label
  g.fillStyle(0xffcc22, 1);
  g.fillRect(cx - 7, 15.5, 14, 0.6);
  g.fillRect(cx - 7, 22.8, 14, 0.6);

  // ── Glass sheen highlight. ──
  g.fillStyle(0xffffff, 0.3);
  g.fillRect(cx - 6, 12, 1.5, 13);
  g.fillStyle(0xffffff, 0.15);
  g.fillRect(cx - 5, 12, 0.8, 13);

  g.generateTexture('ucard_irn_bru', s, s);
  g.destroy();
}
