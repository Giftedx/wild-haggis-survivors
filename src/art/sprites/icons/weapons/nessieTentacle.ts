import * as Phaser from 'phaser';

/**
 * `wicon_nessie_tentacle` — Loch Ness tentacle lash icon. Design
 * pivot: old icon was a string of overlapping green circles that
 * read as "snake made of peas". New pitch — BOLD TAPERED TENTACLE
 * silhouette lashing diagonally from bottom-left up-right, with a
 * clear proximal-to-distal taper, bright cream suckers running
 * along the underside, water splash at the base where it emerges.
 * Reads "squid-like tentacle" not "row of dots".
 */
export function drawNessieTentacleIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // Water splash at the base (lower-left) — the loch-emergence tell
  g.fillStyle(0x336688, 0.5);
  g.fillEllipse(cx - 12, cy + 13, 12, 3);
  g.fillStyle(0x66aacc, 0.8);
  g.fillCircle(cx - 13, cy + 12, 1.3);
  g.fillCircle(cx - 9, cy + 11, 1);
  g.fillStyle(0x88ccee, 1);
  g.fillCircle(cx - 14, cy + 10, 0.8);
  g.fillCircle(cx - 10, cy + 9, 0.6);

  // TENTACLE SHAPE — thick dark outline as a lashing S-curve from
  // lower-left to upper-right. Drawn as overlapping ellipses of
  // decreasing size for clean taper.
  const points: [number, number, number][] = [
    // [x, y, radius]
    [cx - 11, cy + 11, 6.5],
    [cx - 8, cy + 8, 6],
    [cx - 5, cy + 5, 5.5],
    [cx - 2, cy + 2, 5],
    [cx + 1, cy - 1, 4.5],
    [cx + 4, cy - 4, 4],
    [cx + 7, cy - 7, 3.3],
    [cx + 10, cy - 10, 2.6],
    [cx + 12, cy - 12, 2],
  ];
  // Dark outline pass
  g.fillStyle(0x0a2012, 1);
  for (const [px, py, r] of points) g.fillCircle(px, py, r + 0.6);
  // Main body — loch-water green
  g.fillStyle(0x1e5a36, 1);
  for (const [px, py, r] of points) g.fillCircle(px, py, r);
  // Light top highlight (light hits the upper-right side)
  g.fillStyle(0x3a8a5a, 1);
  for (const [px, py, r] of points) g.fillCircle(px + 0.3, py - 0.3, r * 0.65);
  // Brighter sheen
  g.fillStyle(0x60b080, 0.85);
  for (const [px, py, r] of points) g.fillCircle(px + 0.5, py - 0.6, r * 0.35);

  // POINTED TIP — sharpen the distal end with a triangle
  g.fillStyle(0x0a2012, 1);
  g.fillTriangle(cx + 11, cy - 11, cx + 15, cy - 15, cx + 12, cy - 12);
  g.fillStyle(0x1e5a36, 1);
  g.fillTriangle(cx + 11.5, cy - 11, cx + 14, cy - 14, cx + 12, cy - 11);

  // Suckers — cream-coloured circles running along the lower-right
  // underside of the tentacle. Spaced so they don't merge.
  g.fillStyle(0xeadcb8, 1);
  g.fillCircle(cx - 7, cy + 10, 1.3);
  g.fillCircle(cx - 3, cy + 7, 1.2);
  g.fillCircle(cx, cy + 4, 1.1);
  g.fillCircle(cx + 4, cy + 1, 1);
  g.fillCircle(cx + 7, cy - 2, 0.9);
  // Sucker rim shadow
  g.fillStyle(0x8a7040, 0.9);
  g.fillCircle(cx - 7, cy + 10, 0.7);
  g.fillCircle(cx - 3, cy + 7, 0.6);
  g.fillCircle(cx, cy + 4, 0.5);

  // Bio-luminescent green glints on the back side
  g.fillStyle(0x55ffaa, 0.8);
  g.fillCircle(cx - 9, cy + 6, 0.5);
  g.fillCircle(cx - 5, cy + 3, 0.5);
  g.fillCircle(cx, cy - 2, 0.5);
  g.fillCircle(cx + 5, cy - 6, 0.5);

  g.generateTexture('wicon_nessie_tentacle', s, s);
  g.destroy();
}
