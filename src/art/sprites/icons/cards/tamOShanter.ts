import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';
/**
 * `ucard_tam_o_shanter` — Scottish Blue Bonnet (tam o' shanter).
 * Design pivot (v2): prior icon used a diced red/white chequer band
 * with 2×2 pixel squares that resolved to "noise stripe" at 1× scale,
 * leaving only the pom-pom as a read so the silhouette said "any
 * round hat". New pitch: classic Blue Bonnet — flat wide dark-blue
 * beret body + BOLD RED TOORIE (pom-pom) dominant on top + solid
 * dark headband + small silver cap-badge as the Scottish anchor.
 * Single-colour band lets the toorie pop instead of competing.
 */
export function drawTamOShanter(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x2a2238);
  const cx = 16, cy = 17;
  // ── Flat wide beret body — the Blue Bonnet silhouette. ──
  g.fillStyle(0x050a1a, 1);
  g.fillEllipse(cx, cy + 1, 26, 12);
  g.fillStyle(0x152245, 1);
  g.fillEllipse(cx, cy, 24, 10);
  g.fillStyle(0x253365, 1);
  g.fillEllipse(cx - 1, cy - 1, 20, 8);
  g.fillStyle(0x3a4a8a, 0.7);
  g.fillEllipse(cx - 2, cy - 2, 12, 4);
  // ── Solid dark headband (no chequers — chequers blur at 1×). ──
  g.fillStyle(0x050812, 1);
  g.fillRect(cx - 13, cy + 6, 26, 4);
  g.fillStyle(0x152245, 1);
  g.fillRect(cx - 12, cy + 6, 24, 1);
  // ── Silver cap-badge on the band front — Scottish regimental tell. ──
  g.fillStyle(0x2a2a2a, 1);
  g.fillCircle(cx, cy + 8, 2);
  g.fillStyle(0xaaaaaa, 1);
  g.fillCircle(cx, cy + 8, 1.5);
  g.fillStyle(0xeeeeee, 1);
  g.fillCircle(cx - 0.3, cy + 7.7, 0.7);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - 0.5, cy + 7.5, 0.3);
  // ── BOLD RED TOORIE (pom-pom) — dominant anchor, 4-layer specular. ──
  g.fillStyle(0x3a0404, 1);
  g.fillCircle(cx, cy - 7, 5);
  g.fillStyle(0x881010, 1);
  g.fillCircle(cx, cy - 7, 4.3);
  g.fillStyle(0xcc2020, 1);
  g.fillCircle(cx - 0.5, cy - 7.5, 3.3);
  g.fillStyle(0xee4040, 1);
  g.fillCircle(cx - 1, cy - 8, 2);
  g.fillStyle(0xff8070, 0.9);
  g.fillCircle(cx - 1.3, cy - 8.3, 1);
  g.fillStyle(0xffddbb, 0.8);
  g.fillCircle(cx - 1.5, cy - 8.5, 0.5);
  // Pom fibres — faint texture dots around the toorie edge
  g.fillStyle(0x3a0404, 0.7);
  g.fillCircle(cx + 2.5, cy - 5.5, 0.5);
  g.fillCircle(cx - 3, cy - 5, 0.5);
  g.fillCircle(cx + 3, cy - 8, 0.4);
  g.fillCircle(cx - 2.5, cy - 9, 0.4);
  g.generateTexture('ucard_tam_o_shanter', s, s);
  g.destroy();
}
