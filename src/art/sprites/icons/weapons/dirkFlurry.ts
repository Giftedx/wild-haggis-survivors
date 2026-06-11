import * as Phaser from 'phaser';

/**
 * `wicon_dirk_flurry` — three Highland dirks fanned around a brass
 * crown-pommel. Reads as "the dance became the wall" at icon size.
 * Same tartan-red wrap as the base Dirk Dance; the three blades
 * arrange in a tight fan so the silhouette holds at 32 px.
 */
export function drawDirkFlurryIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 18;

  // Drop shadow.
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(cx, cy + 8, 18, 2.6);

  // Three blade tips fanned: -45°, 0° (up), +45° from vertical.
  const angles = [-Math.PI * 0.35, 0, Math.PI * 0.35];
  const BLADE_OUT = 0x0a0a0e;
  const BLADE_BODY = 0x8c98a4;
  const BLADE_EDGE = 0xd0d8e0;

  for (const ang of angles) {
    const tipX = cx + Math.sin(ang) * 14;
    const tipY = cy - Math.cos(ang) * 14;
    const baseX = cx + Math.sin(ang) * 3;
    const baseY = cy - Math.cos(ang) * 3;
    // Per-blade perpendicular offset for the wedge width.
    const px = Math.cos(ang) * 1.4;
    const py = Math.sin(ang) * 1.4;

    g.fillStyle(BLADE_OUT, 1);
    g.fillTriangle(tipX, tipY, baseX + px, baseY + py, baseX - px, baseY - py);
    g.fillStyle(BLADE_BODY, 1);
    g.fillTriangle(
      tipX, tipY,
      baseX + px * 0.7, baseY + py * 0.7,
      baseX - px * 0.7, baseY - py * 0.7,
    );
    // Edge highlight on the leading side.
    g.fillStyle(BLADE_EDGE, 1);
    g.fillTriangle(tipX, tipY, baseX + px * 0.5, baseY + py * 0.5, baseX, baseY);
  }

  // Central brass pommel (a single crown for all three blades).
  g.fillStyle(0x0a0a0e, 1);
  g.fillCircle(cx, cy + 1.5, 3.4);
  g.fillStyle(0xa07028, 1);
  g.fillCircle(cx, cy + 1.5, 2.8);
  g.fillStyle(0xd8a040, 0.9);
  g.fillCircle(cx - 0.6, cy + 0.9, 1.2);

  // Tartan-red grip ring under the pommel.
  g.fillStyle(0x6a1818, 1);
  g.fillRect(cx - 3, cy + 4, 6, 5);
  g.fillStyle(0x9a2a2a, 1);
  g.fillRect(cx - 2.4, cy + 4.4, 4.8, 4.2);
  // Two stitch bands.
  g.fillStyle(0x4a1010, 1);
  g.fillRect(cx - 2.4, cy + 5.4, 4.8, 0.5);
  g.fillRect(cx - 2.4, cy + 7.0, 4.8, 0.5);

  // Three motion arcs faintly hinting "three becomes one".
  g.lineStyle(0.6, 0xc83838, 0.45);
  g.beginPath(); g.arc(cx, cy + 1, 10, Math.PI * 1.15, Math.PI * 1.85, false); g.strokePath();
  g.lineStyle(0.6, 0xc83838, 0.30);
  g.beginPath(); g.arc(cx, cy + 1, 13, Math.PI * 1.2, Math.PI * 1.8, false); g.strokePath();

  g.generateTexture('wicon_dirk_flurry', s, s);
  g.destroy();
}
