import * as Phaser from 'phaser';

/**
 * `wicon_cullen_skink_ladle` — Cullen Skink Ladle weapon icon.
 * A wooden ladle with a round bowl, cream-yellow broth pooling in it,
 * and a small steam-puff above the bowl. Reads as "ladle/soup" at 32px.
 */
export function drawCullenSkinkLadleIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Handle — long wooden stick, diagonal bottom-left to top-right.
  g.lineStyle(3, 0x6a3a10, 1);
  g.lineBetween(5, 27, 18, 10);
  // Highlight on handle top edge.
  g.lineStyle(1, 0xa06030, 0.6);
  g.lineBetween(5, 26, 17, 9);

  // Ladle bowl — round, cream-yellow broth filled.
  // Shadow/outline.
  g.fillStyle(0x2a1808, 1);
  g.fillCircle(22, 13, 8);
  // Wooden bowl rim.
  g.fillStyle(0x6a3a10, 1);
  g.fillCircle(22, 13, 7);
  // Broth fill — cream-yellow.
  g.fillStyle(0xd4c080, 1);
  g.fillCircle(22, 14, 5.5);
  // Broth sheen — lighter centre.
  g.fillStyle(0xe8d8a0, 0.7);
  g.fillEllipse(21, 13, 5, 3.5);

  // Flecks of smoked fish in the broth — two tiny dark spots.
  g.fillStyle(0x5a3818, 0.8);
  g.fillCircle(20, 15, 1);
  g.fillCircle(24, 13, 1);

  // Steam wisps — two short upward strokes above the bowl.
  g.lineStyle(1.2, 0xe8e0d0, 0.55);
  g.lineBetween(20, 6, 21, 4);
  g.lineBetween(23, 5, 24, 3);

  g.generateTexture('wicon_cullen_skink_ladle', s, s);
  g.destroy();
}
