import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';
/**
 * `ucard_stat_pickup` — pickup-range stat icon. Design pivot: old
 * icon had a magnet + flying gem + trail dots competing for attention
 * so the "pickup range" concept got diluted. New pitch — BIG BOLD
 * horseshoe magnet dominates the upper 2/3 of the icon, 3 BRIGHTER
 * concentric cyan field arcs radiating from the pole opening, and a
 * SINGLE bright sparkle-star at the bottom as the "pull target". No
 * clutter — the magnet silhouette carries the meaning.
 */
export function drawStatPickup(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x243a22);
  const cx = 16, cy = 15;

  // ── HORSESHOE MAGNET — bigger and bolder than before. Red body
  // + white pole tips. The dominant silhouette. ──
  // Outline shadow
  g.fillStyle(0x2a0808, 1);
  g.fillRect(cx - 10, cy - 10, 20, 5);
  g.fillRect(cx - 10, cy - 10, 5, 14);
  g.fillRect(cx + 5, cy - 10, 5, 14);

  // Red magnet body
  g.fillStyle(0xaa0a0a, 1);
  g.fillRect(cx - 9, cy - 9, 18, 4);
  g.fillRect(cx - 9, cy - 9, 4, 12);
  g.fillRect(cx + 5, cy - 9, 4, 12);
  g.fillStyle(0xdd2222, 1);
  g.fillRect(cx - 9, cy - 9, 18, 3);
  g.fillRect(cx - 9, cy - 9, 3, 11);
  g.fillRect(cx + 6, cy - 9, 3, 11);
  // Highlight
  g.fillStyle(0xff5544, 1);
  g.fillRect(cx - 8, cy - 9, 16, 1);
  g.fillRect(cx - 8, cy - 8, 1, 9);
  g.fillRect(cx + 7, cy - 8, 1, 9);

  // ── WHITE POLE TIPS at the open end — classic horseshoe detail. ──
  g.fillStyle(0xeaeae0, 1);
  g.fillRect(cx - 9, cy + 3, 4, 3);
  g.fillRect(cx + 5, cy + 3, 4, 3);
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 9, cy + 3, 4, 1);
  g.fillRect(cx + 5, cy + 3, 4, 1);

  // ── MAGNETIC FIELD ARCS — three concentric cyan arcs radiating
  // from the pole opening. Brighter + bolder than before. ──
  g.lineStyle(1.5, 0x66ddff, 0.9);
  g.beginPath();
  g.arc(cx, cy + 6, 4, Math.PI * 1.0, Math.PI * 2.0);
  g.strokePath();
  g.lineStyle(1.2, 0x88eeff, 0.75);
  g.beginPath();
  g.arc(cx, cy + 6, 7, Math.PI * 1.0, Math.PI * 2.0);
  g.strokePath();
  g.lineStyle(1.0, 0xaaf0ff, 0.55);
  g.beginPath();
  g.arc(cx, cy + 6, 10, Math.PI * 1.0, Math.PI * 2.0);
  g.strokePath();

  // ── PULL-TARGET SPARKLE — single bright 4-point star at the
  // bottom. Sells "thing being drawn toward the magnet" without
  // the clutter of a gem + trail. ──
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 0.6, cy + 11, 1.2, 4.5);
  g.fillRect(cx - 2.2, cy + 12.5, 4.5, 1.2);
  g.fillStyle(0xccf4ff, 1);
  g.fillCircle(cx, cy + 13, 1.2);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx, cy + 13, 0.6);

  g.generateTexture('ucard_stat_pickup', s, s);
  g.destroy();
}
