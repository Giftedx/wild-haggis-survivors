import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';
/**
 * U1 Rune tier — single shared 32×32 carved-stone panel with a
 * stylised rune-cross glyph. Every rune card points at this texture
 * key in v1; M3 polish will fan out per-id glyph variants (authored or
 * procedural-by-id-hash). See RUNE_GLYPH_TEXTURE_KEY in data/runes.ts.
 */
export function drawRuneGlyph(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  // Stone panel background with rune-mauve wash.
  cardIconBg(g, s, 0x2f2940);
  const cx = 16, cy = 16;
  // Outer carved border — chipped stone, not a blank grey tile.
  g.fillStyle(0x171320, 1);
  g.fillRoundedRect(5, 5, 22, 22, 4);
  g.fillStyle(0x4e465e, 1);
  g.fillRoundedRect(6, 6, 20, 20, 3);
  g.fillStyle(0x6a5b7a, 0.55);
  g.fillRoundedRect(8, 8, 16, 16, 2);
  g.lineStyle(0.7, 0x161020, 0.75);
  g.lineBetween(8, 11, 13, 8);
  g.lineBetween(22, 9, 20, 14);
  g.lineBetween(10, 24, 15, 22);
  g.lineBetween(23, 21, 19, 24);

  // Warm glow behind the mark so the card reads magical at 32px.
  g.fillStyle(0xe7c85a, 0.18);
  g.fillCircle(cx, cy, 9);
  g.fillStyle(0x9c7df0, 0.12);
  g.fillCircle(cx, cy, 12);

  // Carved rune cross — dark incised trench first.
  g.lineStyle(3, 0x0e0a14, 1);
  g.beginPath();
  g.moveTo(cx, cy - 7);
  g.lineTo(cx, cy + 7);
  g.moveTo(cx, cy - 4);
  g.lineTo(cx - 4, cy - 7);
  g.moveTo(cx, cy - 4);
  g.lineTo(cx + 4, cy - 7);
  g.moveTo(cx, cy + 3);
  g.lineTo(cx + 4, cy + 6);
  g.strokePath();

  // Lit inlay stroke — gold plus mauve gleam along the carved edge.
  g.lineStyle(1.4, 0xe7c85a, 0.95);
  g.beginPath();
  g.moveTo(cx, cy - 7);
  g.lineTo(cx, cy + 7);
  g.moveTo(cx, cy - 4);
  g.lineTo(cx - 4, cy - 7);
  g.moveTo(cx, cy - 4);
  g.lineTo(cx + 4, cy - 7);
  g.moveTo(cx, cy + 3);
  g.lineTo(cx + 4, cy + 6);
  g.strokePath();
  g.lineStyle(0.7, 0xf6e7a5, 0.9);
  g.beginPath();
  g.moveTo(cx - 0.4, cy - 6);
  g.lineTo(cx - 0.4, cy + 5);
  g.strokePath();
  // Four small thistle/pictish dot anchors around the glyph.
  g.fillStyle(0xb58cff, 0.9);
  g.fillCircle(cx - 7, cy, 1);
  g.fillCircle(cx + 7, cy, 1);
  g.fillCircle(cx, cy - 9, 0.9);
  g.fillCircle(cx, cy + 9, 0.9);
  g.fillStyle(0xffffff, 0.75);
  g.fillCircle(cx - 7.2, cy - 0.3, 0.35);
  // Pictish side spirals and a tiny thistle root make the shared rune
  // feel authored even before per-rune glyph variants exist.
  g.lineStyle(0.75, 0x21152e, 0.9);
  g.beginPath();
  g.arc(cx - 7, cy + 5, 2.2, Math.PI * 0.15, Math.PI * 1.45, false);
  g.strokePath();
  g.beginPath();
  g.arc(cx + 7, cy - 5, 2.2, Math.PI * 1.15, Math.PI * 0.45, true);
  g.strokePath();
  g.fillStyle(0x3f7a30, 0.9);
  g.fillRect(cx - 0.4, cy + 8.5, 0.8, 2.2);
  g.fillStyle(0x9c7df0, 0.95);
  g.fillCircle(cx - 1.2, cy + 8, 0.55);
  g.fillCircle(cx, cy + 7.5, 0.65);
  g.fillCircle(cx + 1.2, cy + 8, 0.55);
  g.fillStyle(0xf6e7a5, 0.85);
  g.fillRect(cx - 5, cy - 10, 10, 0.5);
  g.generateTexture('rune_glyph', s, s);
  g.destroy();
}
