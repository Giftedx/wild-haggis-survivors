import * as Phaser from 'phaser';

/**
 * `wicon_nessie_unleashed` — legendary Nessie evolution icon. Design
 * pivot: old icon was a tentacle-star of 12 small segment-blobs that
 * read as "spiral pattern". New pitch — iconic NESSIE SERPENT NECK
 * rising from water: curved long neck arching from lower-right loch,
 * reaching upper-left, small head with glowing eye at the tip. The
 * tourist-brochure silhouette everyone knows. Water splash at base
 * plus two supporting coils beneath the surface.
 */
export function drawNessieUnleashedIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── Water surface at the bottom — dark loch. ──
  g.fillStyle(0x0a2238, 1);
  g.fillRect(0, cy + 8, s, s - (cy + 8));
  g.fillStyle(0x1a3a58, 1);
  g.fillRect(0, cy + 8, s, 1.5);
  // Ripple lines
  g.fillStyle(0x4a7a9a, 0.8);
  g.fillRect(2, cy + 10, 8, 0.4);
  g.fillRect(14, cy + 12, 10, 0.4);
  g.fillRect(22, cy + 14, 8, 0.4);

  // ── Mystic halo around the monster. ──
  g.fillStyle(0x336688, 0.3);
  g.fillCircle(cx, cy - 2, 14);

  // ── BACK COIL — visible hump behind the neck, peeking over water. ──
  g.fillStyle(0x0a2012, 1);
  g.fillEllipse(cx + 8, cy + 7, 12, 5);
  g.fillStyle(0x1a4a2a, 1);
  g.fillEllipse(cx + 8, cy + 7, 10, 4);
  g.fillStyle(0x3a8a4a, 1);
  g.fillEllipse(cx + 8, cy + 6.5, 8, 2.5);

  // ── SECOND COIL — smaller hump further right. ──
  g.fillStyle(0x0a2012, 1);
  g.fillEllipse(cx + 14, cy + 9, 6, 3);
  g.fillStyle(0x1a4a2a, 1);
  g.fillEllipse(cx + 14, cy + 9, 5, 2.5);

  // ── SERPENT NECK — long curving S from base (cx+6, cy+5) arching
  // up to head (cx-8, cy-8). Drawn as overlapping circles of
  // decreasing size for smooth taper. ──
  const neckPoints: [number, number, number][] = [
    [cx + 6, cy + 5, 4.5],
    [cx + 4, cy + 2, 4.2],
    [cx + 1, cy - 1, 3.8],
    [cx - 2, cy - 4, 3.4],
    [cx - 5, cy - 6, 3],
    [cx - 7, cy - 8, 2.6],
  ];
  // Dark outline
  g.fillStyle(0x0a2012, 1);
  for (const [px, py, r] of neckPoints) g.fillCircle(px, py, r + 0.6);
  // Main body — loch green
  g.fillStyle(0x1a5a32, 1);
  for (const [px, py, r] of neckPoints) g.fillCircle(px, py, r);
  // Lighter belly (catches light on left side)
  g.fillStyle(0x3a8a4a, 1);
  for (const [px, py, r] of neckPoints) g.fillCircle(px - 0.5, py - 0.3, r * 0.6);
  // Brightest highlight strip
  g.fillStyle(0x5ab060, 0.85);
  for (const [px, py, r] of neckPoints) g.fillCircle(px - 0.8, py - 0.5, r * 0.3);

  // ── HEAD — teardrop shape at the neck tip, angled up-left. ──
  g.fillStyle(0x0a2012, 1);
  g.fillEllipse(cx - 9, cy - 9, 6, 4);
  g.fillStyle(0x1a5a32, 1);
  g.fillEllipse(cx - 9, cy - 9, 5, 3.5);
  g.fillStyle(0x3a8a4a, 1);
  g.fillEllipse(cx - 9.5, cy - 9.5, 4, 2.5);
  // Head snout pointing up-left
  g.fillStyle(0x0a2012, 1);
  g.fillTriangle(cx - 11, cy - 9, cx - 13, cy - 11, cx - 11, cy - 10);
  g.fillStyle(0x1a5a32, 1);
  g.fillTriangle(cx - 11, cy - 9.2, cx - 12.5, cy - 10.5, cx - 11, cy - 9.8);

  // ── GLOWING EYE — bright amber eye on the head, the anchor. ──
  g.fillStyle(0xffcc22, 1);
  g.fillCircle(cx - 9, cy - 9.3, 1.2);
  g.fillStyle(0xffee88, 1);
  g.fillCircle(cx - 9, cy - 9.3, 0.7);
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 9.3, cy - 10, 0.6, 1.5);

  // ── Mouth line — small dark curve. ──
  g.fillStyle(0x0a0a08, 1);
  g.fillRect(cx - 12, cy - 8, 1.5, 0.5);

  // ── Water splash at the neck base — the emergence tell. ──
  g.fillStyle(0x4a8aba, 0.85);
  g.fillEllipse(cx + 5, cy + 9, 10, 2);
  g.fillStyle(0x88ccee, 1);
  g.fillCircle(cx + 9, cy + 8, 1);
  g.fillCircle(cx + 2, cy + 8.5, 0.8);
  g.fillCircle(cx - 1, cy + 10, 0.8);
  // Splash droplets arching over
  g.fillStyle(0xaaddee, 0.9);
  g.fillCircle(cx + 11, cy + 5, 0.8);
  g.fillCircle(cx + 2, cy + 3, 0.7);

  g.generateTexture('wicon_nessie_unleashed', s, s);
  g.destroy();
}
