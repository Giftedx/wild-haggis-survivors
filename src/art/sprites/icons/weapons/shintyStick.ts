import * as Phaser from 'phaser';

/**
 * `wicon_shinty_stick` — the camanachd caman + a wee ball mid-air.
 * Curved ash blade angled diagonally with a small leather-wrapped
 * grip + a pale shinty ball flying off the blade with a short motion
 * smear. Reads "stick game" at a glance — distinct from the haggis
 * hurler icon's brown-meat ball + tartan wrapper.
 */
export function drawShintyStickIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 16;

  // ── Shaft of the caman — pale ash wood, diagonal from top-left
  // to bottom-right. Two-tone wood: dark outline + warm cream stem
  // + faint grain stripe.
  g.fillStyle(0x1a1208, 1);
  g.fillTriangle(cx - 12, cy - 13, cx - 9, cy - 14, cx + 5, cy + 6);
  g.fillTriangle(cx - 11, cy - 12, cx + 7, cy + 7, cx + 4, cy + 8);
  // Cream wood body
  g.fillStyle(0xd8c088, 1);
  g.fillTriangle(cx - 11, cy - 12, cx - 9, cy - 13, cx + 5, cy + 5);
  g.fillTriangle(cx - 10.5, cy - 11.5, cx + 5.5, cy + 6, cx + 4, cy + 7);
  // Grain stripe
  g.fillStyle(0xa88858, 0.55);
  g.fillTriangle(cx - 10, cy - 11, cx - 9, cy - 11.5, cx + 4, cy + 5);

  // ── Curved BLADE at the bottom-right — the bas, wider than the
  // shaft, slightly hooked. Two ash plies visible.
  g.fillStyle(0x1a1208, 1);
  g.fillEllipse(cx + 7, cy + 8, 11, 5);
  g.fillStyle(0xc8b078, 1);
  g.fillEllipse(cx + 7, cy + 8, 9, 4);
  g.fillStyle(0xe8d8a0, 1);
  g.fillEllipse(cx + 6, cy + 7, 7, 2.6);
  // Leather binding band where the shaft meets the blade
  g.fillStyle(0x4a2a14, 1);
  g.fillRect(cx + 2, cy + 5, 3, 2);
  g.fillStyle(0x6a3a18, 1);
  g.fillRect(cx + 2, cy + 5, 3, 0.7);

  // ── Leather grip wrap at the top of the shaft — three dark bands.
  g.fillStyle(0x4a2a14, 1);
  g.fillRect(cx - 12, cy - 13, 4, 1);
  g.fillRect(cx - 11, cy - 12, 4, 0.7);
  g.fillRect(cx - 10, cy - 11, 4, 0.7);

  // ── SHINTY BALL — pale cream sphere with a red stitched seam,
  // mid-air upper-right. The ball is the second silhouette tell so
  // it has to read clearly; outline + body + highlight + seam.
  g.fillStyle(0x1a1208, 1);
  g.fillCircle(cx + 9, cy - 6, 4);
  g.fillStyle(0xe8d8b0, 1);
  g.fillCircle(cx + 9, cy - 6, 3.2);
  g.fillStyle(0xfff0c8, 0.9);
  g.fillEllipse(cx + 7.7, cy - 7.3, 2.4, 1.4);
  // Red stitched seam
  g.fillStyle(0x8a2218, 1);
  g.fillRect(cx + 6, cy - 6 + 0.2, 6, 0.5);
  // Cross-stitch beads
  g.fillStyle(0xa83228, 1);
  for (let i = 0; i < 3; i++) {
    g.fillRect(cx + 6.5 + i * 1.6, cy - 6.5, 0.4, 0.4);
    g.fillRect(cx + 6.5 + i * 1.6, cy - 5.5, 0.4, 0.4);
  }
  // Specular dot
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx + 7.5, cy - 7.5, 0.6);

  // ── Motion smear — three short white streaks behind the ball,
  // angled along its trajectory. Sells "ball just struck off the
  // blade".
  g.fillStyle(0x6a4818, 0.6);
  g.fillRect(cx + 12.4, cy - 5.2, 4, 0.5);
  g.fillRect(cx + 12.4, cy - 4, 3, 0.5);
  g.fillRect(cx + 12.4, cy - 6.4, 3, 0.5);
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(cx + 12, cy - 5.4, 4, 0.7);
  g.fillRect(cx + 12, cy - 4.2, 3, 0.7);
  g.fillRect(cx + 12, cy - 6.6, 3, 0.7);

  // ── Tiny grass/turf flicks at the blade's leading edge — sells
  // "this just came out of a striking arc".
  g.fillStyle(0x3a6a28, 1);
  g.fillRect(cx + 11, cy + 9, 1, 1);
  g.fillRect(cx + 12.5, cy + 8, 0.7, 0.7);
  g.fillStyle(0x5a8a38, 0.9);
  g.fillRect(cx + 11.2, cy + 9.2, 0.6, 0.6);

  g.generateTexture('wicon_shinty_stick', s, s);
  g.destroy();
}
