import * as Phaser from 'phaser';

/**
 * `wicon_haggis_hurler` — throwing-weapon icon. Design pivot (v2):
 * old icon had a round ball with motion arc but the ball itself
 * read as "any sports sphere" — no haggis-specific tells. New pitch
 * — haggis ball with STITCHED SEAM across the middle (natural
 * casing sewing with cream cross-stitch marks), TARTAN BUTCHER'S
 * WRAPPER tied at the top (Royal Stewart red/green), and TEARDROP
 * OAT FLECKS instead of round dots. The seam + wrapper + oat
 * pattern lock in "traditional Scottish haggis" specifically.
 */
export function drawHaggisHurlerIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 16;

  // ── Motion arc — comet-tail trail from upper-left to the ball.
  // Outer faint halo + denser cream cores so the arc reads as a
  // wake at 32px (was a thin 4-dot ribbon). ──
  const arc: Array<[number, number, number, number]> = [
    [cx - 10, cy - 10, 1.6, 0.95],
    [cx - 7, cy - 8, 1.7, 0.88],
    [cx - 4, cy - 5, 1.8, 0.8],
    [cx - 1, cy - 2, 1.9, 0.72],
    [cx + 1.5, cy + 0.5, 1.8, 0.62],
  ];
  for (const [x, y, r, a] of arc) {
    g.fillStyle(0xc8a868, a * 0.45);
    g.fillCircle(x, y, r + 0.9);
  }
  for (const [x, y, r, a] of arc) {
    g.fillStyle(0xeaddb0, a);
    g.fillCircle(x, y, r);
  }
  // Bright spark on the leading edge of each puff.
  g.fillStyle(0xfff0c8, 1);
  g.fillCircle(cx - 10, cy - 10, 0.7);
  g.fillCircle(cx - 4, cy - 5, 0.6);

  // ── Speed lines — bolder white streaks framed with a dark
  // shadow strip so they read against the bright arc. ──
  g.fillStyle(0x6a4818, 0.65);
  g.fillRect(cx - 14, cy - 11.6, 5, 0.6);
  g.fillRect(cx - 13, cy - 8.6, 4, 0.6);
  g.fillRect(cx - 15, cy - 5.6, 5, 0.6);
  g.fillStyle(0xffffff, 0.98);
  g.fillRect(cx - 14, cy - 12, 5, 1);
  g.fillRect(cx - 13, cy - 9, 4, 1);
  g.fillRect(cx - 15, cy - 6, 5, 1);

  // ── HAGGIS BALL — oval silhouette offset lower-right. Natural
  // casing texture with visible seam. ──
  g.fillStyle(0x1a0e04, 1);
  g.fillEllipse(cx + 4, cy + 4, 18, 16);
  // Deep brown casing
  g.fillStyle(0x4a3008, 1);
  g.fillEllipse(cx + 4, cy + 4, 16, 14);
  g.fillStyle(0x6a4a10, 1);
  g.fillEllipse(cx + 3, cy + 3, 14, 12);
  // Upper-left highlight
  g.fillStyle(0x8a6020, 0.85);
  g.fillEllipse(cx + 1, cy + 1, 8, 6);

  // ── STITCHED SEAM across the middle — natural casing sewing.
  // Dark thread line + cream cross-stitch marks. Unmistakable
  // haggis tell. ──
  g.fillStyle(0x0a0604, 1);
  g.fillRect(cx - 2, cy + 4, 12, 0.8);
  // Cream cross-stitch dots along the seam
  g.fillStyle(0xc8a848, 1);
  for (let i = 0; i < 6; i++) {
    const sx = cx - 1 + i * 2;
    g.fillRect(sx - 0.3, cy + 3.5, 0.6, 0.6);
    g.fillRect(sx - 0.3, cy + 4.3, 0.6, 0.6);
  }

  // ── TARTAN BUTCHER'S WRAPPER tied at the top — small red/green
  // striped cap. Royal Stewart anchor makes it unmistakably
  // Scottish haggis, not a generic food ball. ──
  g.fillStyle(0x0a0000, 1);
  g.fillRect(cx, cy - 4, 7, 2.8);
  g.fillStyle(0x8a1818, 1);
  g.fillRect(cx, cy - 3.8, 7, 2.2);
  g.fillStyle(0x0a3018, 1);
  g.fillRect(cx, cy - 3, 7, 0.6);
  g.fillStyle(0xdaaa40, 1);
  g.fillRect(cx + 2, cy - 3.8, 0.5, 2.2);
  g.fillRect(cx + 5, cy - 3.8, 0.5, 2.2);
  // Wrapper tail — little flag
  g.fillStyle(0x6a1212, 1);
  g.fillTriangle(cx + 7, cy - 4, cx + 9, cy - 3.5, cx + 7, cy - 2);

  // ── TEARDROP OAT FLECKS — bigger, varied. Signals "stuffed
  // with oats" clearly. ──
  g.fillStyle(0xc8a848, 1);
  g.fillEllipse(cx + 1, cy + 7, 1.6, 0.9);
  g.fillEllipse(cx + 6, cy + 7, 1.2, 0.7);
  g.fillEllipse(cx + 3, cy + 9, 1.4, 0.8);
  g.fillStyle(0xf0d880, 0.85);
  g.fillEllipse(cx + 1, cy + 7, 0.9, 0.5);
  g.fillEllipse(cx + 3, cy + 9, 0.8, 0.4);

  // ── Specular highlight — ball reads 3D. ──
  g.fillStyle(0xfff0c8, 1);
  g.fillCircle(cx - 1, cy, 1.3);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - 1.3, cy - 0.3, 0.6);

  g.generateTexture('wicon_haggis_hurler', s, s);
  g.destroy();
}
