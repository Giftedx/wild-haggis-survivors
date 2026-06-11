import * as Phaser from 'phaser';

/**
 * `wicon_bagpipe_blast` — aura-pulse bagpipes weapon icon. Design
 * pivot: old icon crammed bag + 3 drones + chanter + glow rings
 * into 32px and the ellipses all merged into a bronze blob. New
 * pitch: FOCUS on the chanter tip with MUSIC NOTES exploding out
 * in an arc + bold radial sonic-ring behind them. The bag + single
 * drone silhouette at the base anchors "bagpipes"; the music-note
 * burst tells you it's the BLAST weapon (not the utility form).
 */
export function drawBagpipeBlastIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── Outer sonic-pulse rings — thicker strokes layered close
  // together so the rings have real weight at 32px. (Was 1.2px;
  // now stacked 2.4-2.8px effective via twin overlapping strokes.) ──
  g.lineStyle(2.6, 0xffcc44, 0.35);
  g.strokeCircle(cx, cy, 14);
  g.lineStyle(1.4, 0xfff0a8, 0.55);
  g.strokeCircle(cx, cy, 14);
  g.lineStyle(2.6, 0xffcc44, 0.7);
  g.strokeCircle(cx, cy, 11);
  g.lineStyle(1.4, 0xfff0a8, 0.85);
  g.strokeCircle(cx, cy, 11);

  // ── Tartan bag — compact, red-green-white plaid diamond shape
  // on the lower-right. Smaller than before so it doesn't dominate. ──
  g.fillStyle(0x1a0a08, 1);
  g.fillEllipse(cx + 5, cy + 7, 14, 11);
  g.fillStyle(0x8a1818, 1);
  g.fillEllipse(cx + 5, cy + 7, 12, 9);
  // Tartan crossbars
  g.fillStyle(0x0a3818, 1);
  g.fillRect(cx, cy + 5, 11, 1);
  g.fillRect(cx, cy + 9, 11, 1);
  g.fillRect(cx + 2, cy + 3, 0.8, 9);
  g.fillRect(cx + 8, cy + 3, 0.8, 9);
  // Cream pinstripe accents
  g.fillStyle(0xf0e8c8, 0.8);
  g.fillRect(cx + 4, cy + 5, 0.5, 5);

  // ── ONE big bass drone — tall vertical pipe rising from the
  // bag's upper-left. Bold black silhouette with brass ferrules. ──
  g.fillStyle(0x0a0604, 1);
  g.fillRect(cx - 3, cy - 14, 2.5, 16);
  g.fillStyle(0x3a1808, 1);
  g.fillRect(cx - 2.8, cy - 14, 2, 16);
  // Brass ferrules at top + middle
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 4, cy - 15, 4, 2);
  g.fillRect(cx - 4, cy - 7, 4, 1.5);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 4, cy - 15, 4, 0.6);
  g.fillRect(cx - 4, cy - 7, 4, 0.4);

  // ── Chanter pointing down-right from the bag, with finger holes.
  // The business end where the blast exits. ──
  g.fillStyle(0x0a0604, 1);
  g.fillRect(cx + 5, cy + 1, 2.5, 10);
  g.fillStyle(0x3a1808, 1);
  g.fillRect(cx + 5.2, cy + 1, 2, 10);
  // Finger holes
  g.fillStyle(0x0a0604, 1);
  g.fillCircle(cx + 6.2, cy + 3, 0.5);
  g.fillCircle(cx + 6.2, cy + 5, 0.5);
  g.fillCircle(cx + 6.2, cy + 7, 0.5);
  g.fillCircle(cx + 6.2, cy + 9, 0.5);

  // ── EXPLODING MUSIC NOTES — bursting up-right from the chanter
  // tip. Each note is a solid black quarter-note (filled head +
  // stem + flag) so the shape reads even at 32px. ──
  drawMusicNote(g, cx + 10, cy - 2, 0);     // right note
  drawMusicNote(g, cx + 6, cy - 8, 1);      // upper-right
  drawMusicNote(g, cx - 2, cy - 12, 0);     // top
  drawMusicNote(g, cx + 12, cy + 4, 1);     // lower-right
  // Tiny trailing sparkles
  g.fillStyle(0xffdd44, 1);
  g.fillCircle(cx + 14, cy + 1, 0.8);
  g.fillCircle(cx + 2, cy - 14, 0.7);
  g.fillCircle(cx - 4, cy - 8, 0.6);

  // ── Bright flash at the chanter tip — the "blast point". ──
  g.fillStyle(0xffee88, 1);
  g.fillCircle(cx + 6.2, cy + 11, 2);
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(cx + 6.2, cy + 11, 1);

  g.generateTexture('wicon_bagpipe_blast', s, s);
  g.destroy();
}

/**
 * Draw a small filled music note — note-head (ellipse) + stem
 * (rect) + optional flag (triangle). Used by bagpipe icons.
 */
function drawMusicNote(g: Phaser.GameObjects.Graphics, x: number, y: number, flipFlag: number): void {
  // Note head — tilted oval
  g.fillStyle(0x0a0604, 1);
  g.fillEllipse(x, y, 3, 2.2);
  g.fillStyle(0x4a4050, 1);
  g.fillEllipse(x - 0.2, y - 0.2, 2, 1.4);
  // Stem
  g.fillStyle(0x0a0604, 1);
  g.fillRect(x + 1, y - 4, 0.8, 4);
  // Flag (eighth-note flag at the top of the stem)
  if (flipFlag) {
    g.fillTriangle(x + 1.8, y - 4, x + 3.5, y - 2.5, x + 1.8, y - 2);
  } else {
    g.fillTriangle(x + 1.8, y - 4, x + 3.2, y - 3, x + 1.8, y - 2.5);
  }
}
