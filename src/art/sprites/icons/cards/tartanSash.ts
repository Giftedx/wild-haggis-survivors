import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';
import { HIGHLAND_TARTAN } from '../../../kiltPalette';
/**
 * `ucard_tartan_sash` — tartan-sash accessory icon. Design pivot:
 * old icon was a raw tartan-stripe band with a corner brooch that
 * read as "fabric sample". New pitch — paint the sash ACROSS A DARK
 * TORSO SILHOUETTE so it's unmistakably WORN, not a loose scrap.
 * Brooch pins at the left shoulder, red-gold-green tartan stripes
 * run along the sash axis, gold fringe tails trail at the waist.
 */
export function drawTartanSash(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x3b1f2d);
  const cx = 16;

  // ── Dark torso silhouette — the body the sash drapes over. ──
  g.fillStyle(0x0a0608, 1);
  g.fillRoundedRect(cx - 10, 6, 20, 22, 6);
  g.fillStyle(0x1a0c14, 1);
  g.fillRoundedRect(cx - 9, 7, 18, 20, 5);
  // Neckline V-cut
  g.fillStyle(0x3b1f2d, 1);
  g.fillTriangle(cx - 3, 7, cx + 3, 7, cx, 12);

  // ── Sash body — thick diagonal Highland tartan parallelogram from left
  // shoulder down to right waist. ──
  g.fillStyle(HIGHLAND_TARTAN.fieldDark, 1);
  g.fillTriangle(cx - 10, 9, cx - 6, 9, cx + 10, 27);
  g.fillTriangle(cx - 10, 9, cx + 10, 27, cx + 6, 27);
  g.fillStyle(HIGHLAND_TARTAN.field, 1);
  g.fillTriangle(cx - 9.5, 9.5, cx - 6.5, 9.5, cx + 9, 26.5);
  g.fillTriangle(cx - 9.5, 9.5, cx + 9, 26.5, cx + 6.5, 26.5);
  g.fillStyle(HIGHLAND_TARTAN.field, 1);
  g.fillTriangle(cx - 8.5, 10, cx - 7, 10, cx + 8, 26);
  g.fillTriangle(cx - 8.5, 10, cx + 8, 26, cx + 6.5, 26);

  // ── Gold pinstripe down the sash axis. ──
  g.fillStyle(HIGHLAND_TARTAN.accent, 1);
  g.fillTriangle(cx - 8, 11, cx - 7.5, 11, cx + 7.5, 25.5);
  g.fillTriangle(cx - 8, 11, cx + 7.5, 25.5, cx + 7, 25.5);
  // Dark green secondary stripe
  g.fillStyle(HIGHLAND_TARTAN.stripe, 0.95);
  g.fillTriangle(cx - 9, 11.5, cx - 8.5, 11.5, cx + 7, 25);
  g.fillTriangle(cx - 9, 11.5, cx + 7, 25, cx + 6.5, 25);

  // ── Tartan cross-beads suggesting perpendicular weave. ──
  const beads: [number, number][] = [
    [cx - 6, 12], [cx - 2, 17], [cx + 2, 21], [cx + 6, 25],
  ];
  for (const [px, py] of beads) {
    g.fillStyle(0x1a0404, 1);
    g.fillCircle(px, py, 0.9);
  }

  // ── Brooch at the shoulder — silver disc with amethyst stone. ──
  g.fillStyle(0x4a4a58, 1);
  g.fillCircle(cx - 8, 10, 3);
  g.fillStyle(0xaabacc, 1);
  g.fillCircle(cx - 8, 10, 2.3);
  g.fillStyle(0xdcdce8, 1);
  g.fillCircle(cx - 8, 10, 1.5);
  g.fillStyle(0x8844aa, 1);
  g.fillCircle(cx - 8, 10, 0.9);
  g.fillStyle(0xcc88ee, 1);
  g.fillCircle(cx - 8.2, 9.8, 0.4);

  // ── Gold fringe tails at the waist end. ──
  g.fillStyle(HIGHLAND_TARTAN.accent, 1);
  g.fillRect(cx + 7, 26, 0.7, 3);
  g.fillRect(cx + 8, 26, 0.7, 3.5);
  g.fillRect(cx + 9, 26, 0.7, 2.8);
  g.fillStyle(0x6a5020, 1);
  g.fillRect(cx + 7, 28.5, 0.7, 0.5);
  g.fillRect(cx + 8, 29, 0.7, 0.5);

  g.generateTexture('ucard_tartan_sash', s, s);
  g.destroy();
}
