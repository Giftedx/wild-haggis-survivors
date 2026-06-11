import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';

/**
 * `ucard_stirling_medal` — a hammered bronze valor medal on a tartan
 * ribbon. The medal carries a stamped St Andrew's saltire; the ribbon
 * is the steel-blue patriot tone shared with the Wallace Sword weapon
 * icon. Sells "+10% crit chance" through the medal's struck centre.
 */
export function drawStirlingMedal(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  cardIconBg(g, s, 0x10141a);
  const cx = 16, cy = 18;

  // Drop shadow under the disc.
  g.fillStyle(0x000000, 0.5);
  g.fillEllipse(cx, cy + 8, 18, 2.6);

  // ── RIBBON — two trapezoidal strips meeting at a chevron above the
  // medal. Steel-blue patriot tone.
  const RIB_DARK = 0x1e2c3a;
  const RIB = 0x3a4a5a;
  const RIB_HI = 0x5a6e80;
  // Left strip.
  g.fillStyle(RIB_DARK, 1);
  g.fillTriangle(cx, cy - 12, cx - 5, cy - 4, cx - 1.6, cy - 4);
  g.fillStyle(RIB, 1);
  g.fillTriangle(cx - 0.3, cy - 11.6, cx - 4.6, cy - 4.4, cx - 1.8, cy - 4.4);
  g.fillStyle(RIB_HI, 0.7);
  g.fillRect(cx - 3.2, cy - 9, 0.7, 4);
  // Right strip.
  g.fillStyle(RIB_DARK, 1);
  g.fillTriangle(cx, cy - 12, cx + 5, cy - 4, cx + 1.6, cy - 4);
  g.fillStyle(RIB, 1);
  g.fillTriangle(cx + 0.3, cy - 11.6, cx + 4.6, cy - 4.4, cx + 1.8, cy - 4.4);
  g.fillStyle(RIB_HI, 0.7);
  g.fillRect(cx + 2.5, cy - 9, 0.7, 4);
  // Pin loop at the top apex.
  g.fillStyle(0x4a5260, 1);
  g.fillCircle(cx, cy - 12.4, 1.4);
  g.fillStyle(0x8a92a0, 0.9);
  g.fillCircle(cx - 0.3, cy - 12.7, 0.6);

  // ── MEDAL DISC — bronze, hammered.
  const BRONZE_DARK = 0x4a2e14;
  const BRONZE = 0x8a5828;
  const BRONZE_HI = 0xc88440;
  const BRONZE_GLINT = 0xf0bc60;
  g.fillStyle(0x0a0a0e, 1);
  g.fillCircle(cx, cy + 1, 7);
  g.fillStyle(BRONZE_DARK, 1);
  g.fillCircle(cx, cy + 1, 6.4);
  g.fillStyle(BRONZE, 1);
  g.fillCircle(cx, cy + 1, 5.6);
  // Hammered facet highlights — a few asymmetric pale patches.
  g.fillStyle(BRONZE_HI, 0.7);
  g.fillCircle(cx - 1.6, cy - 0.4, 2.4);
  g.fillStyle(BRONZE_GLINT, 0.7);
  g.fillCircle(cx - 2.2, cy - 1.0, 1.0);
  g.fillStyle(BRONZE_HI, 0.4);
  g.fillCircle(cx + 2, cy + 2.2, 1.4);

  // ── ST ANDREW'S SALTIRE — two crossed dark struts across the medal,
  // the Scottish flag's saltire stamp. Kept thin so the bronze reads.
  g.fillStyle(BRONZE_DARK, 1);
  // Diagonal NW→SE
  g.fillTriangle(cx - 4.4, cy - 2.6, cx - 3.2, cy - 3.8, cx + 4.4, cy + 4.6);
  g.fillTriangle(cx - 4.4, cy - 2.6, cx + 4.4, cy + 4.6, cx + 3.2, cy + 5.8);
  // Diagonal NE→SW
  g.fillTriangle(cx + 4.4, cy - 2.6, cx + 3.2, cy - 3.8, cx - 4.4, cy + 4.6);
  g.fillTriangle(cx + 4.4, cy - 2.6, cx - 4.4, cy + 4.6, cx - 3.2, cy + 5.8);
  // Centre crit-pip — small bright glint where the saltire crosses.
  g.fillStyle(BRONZE_GLINT, 1);
  g.fillCircle(cx, cy + 1, 0.9);
  g.fillStyle(0xfff5d8, 1);
  g.fillRect(cx - 0.4, cy + 0.6, 0.5, 0.5);

  // ── Rim — single bright ring at the disc's edge.
  g.lineStyle(0.7, BRONZE_HI, 0.85);
  g.beginPath();
  g.arc(cx, cy + 1, 5.8, 0, Math.PI * 2, false);
  g.strokePath();

  g.generateTexture('ucard_stirling_medal', s, s);
  g.destroy();
}
