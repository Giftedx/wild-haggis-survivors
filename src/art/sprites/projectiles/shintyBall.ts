/**
 * `shinty_ball` projectile — the small camanachd ball, fired by the
 * Shinty Stick weapon. Real camanachd balls are cork-cored, leather-
 * skinned, with two stitched halves and a single seam line — pale
 * cream surface, dark red stitching. Smaller and zippier-looking than
 * the haggis_ball: clean, geometric, almost cartoon-perfect against
 * the haggis-ball's lumpy organic mess. The contrast in shape between
 * the two bouncing-weapon projectiles sells the camanachd-vs-jobby
 * fantasy split at a glance.
 */

import * as Phaser from 'phaser';

export function bakeShintyBall(scene: Phaser.Scene): void {
  const s = 18;
  const g = scene.add.graphics();
  const cx = 9, cy = 9;

  // Soft drop shadow — sells "in motion" parity with haggis_ball.
  g.fillStyle(0x000000, 0.32);
  g.fillEllipse(cx, cy + 7, 10, 2.2);
  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(cx, cy + 7, 13, 1.4);

  // Dark outline ring — keeps the ball legible on heather + bog tints.
  g.fillStyle(0x1a1208, 1);
  g.fillCircle(cx, cy, 6.5);

  // Pale leather skin — cream-tan, the colour of an oiled regulation
  // shinty ball. Slightly off-white because pure white reads as XP
  // gem at distance.
  g.fillStyle(0xe8d8b0, 1);
  g.fillCircle(cx, cy, 5.5);

  // Upper-left highlight crescent for sphere readability.
  g.fillStyle(0xfff0c8, 0.85);
  g.fillEllipse(cx - 1.5, cy - 1.5, 5, 3);

  // Stitched seam — a slim dark-red curve across the middle, with
  // visible cross-stitch beads. The seam is the unmistakable shinty-
  // ball tell vs a generic white sphere.
  g.fillStyle(0x6a1a14, 1);
  g.fillRect(cx - 4, cy + 0.5, 8, 0.6);
  // Cross-stitch beads along the seam
  g.fillStyle(0x8a2a22, 1);
  for (let i = 0; i < 4; i++) {
    const sx = cx - 3 + i * 2;
    g.fillRect(sx - 0.3, cy, 0.6, 0.5);
    g.fillRect(sx - 0.3, cy + 1.1, 0.6, 0.5);
  }

  // Tiny scuff mark — a wee darker patch low-right where the ball has
  // hit something already. Sells "this ball has been used".
  g.fillStyle(0xc8b888, 0.7);
  g.fillCircle(cx + 2, cy + 2.5, 1);

  // Specular dot — the single bright catch-light that gives the ball
  // a polished feel.
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 2, cy - 2.5, 0.8);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx - 2.3, cy - 2.8, 0.4);

  g.generateTexture('shinty_ball', s, s);
  g.destroy();
}
