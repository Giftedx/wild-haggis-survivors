import * as Phaser from 'phaser';

/**
 * `wicon_thistle_storm` — thistle-storm evolution icon. Design
 * pivot: old icon was a centre bloom + 7 satellite dots inside a
 * radial spoke pattern that merged into "abstract sunburst". New
 * pitch — THREE thistle heads arranged on a visible SPIRAL inside
 * a dark-purple storm halo, with motion-trail dots behind each
 * head showing the rotation direction and a lightning spark
 * punctuation at the core. Reads "multi-thistle storm" at scale.
 */
export function drawThistleStormIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── Dark storm halo — two purple glow layers + lightning rim. ──
  g.fillStyle(0x2a0844, 0.35);
  g.fillCircle(cx, cy, 15);
  g.fillStyle(0x4a1068, 0.28);
  g.fillCircle(cx, cy, 12);
  g.lineStyle(1, 0xcc88ff, 0.55);
  g.strokeCircle(cx, cy, 14);

  // ── Spiral motion arc — sweep from top clockwise. ──
  g.lineStyle(2, 0x8a3ab0, 0.85);
  g.beginPath();
  g.arc(cx, cy, 10, -Math.PI * 0.9, Math.PI * 0.4);
  g.strokePath();
  g.lineStyle(1.2, 0xcc88ff, 0.7);
  g.beginPath();
  g.arc(cx, cy, 10, -Math.PI * 0.9, Math.PI * 0.4);
  g.strokePath();

  // ── Three thistle heads in spiral formation (largest at top). ──
  const heads: [number, number, number][] = [
    [0, -7, 3.5],
    [6, 3, 3],
    [-6, 3, 2.5],
  ];
  for (const [dx, dy, r] of heads) {
    const hx = cx + dx, hy = cy + dy;
    // Green calyx base
    g.fillStyle(0x1a3808, 1);
    g.fillEllipse(hx, hy + r * 0.6, r * 1.4, r * 0.7);
    g.fillStyle(0x2a5818, 1);
    g.fillEllipse(hx, hy + r * 0.6, r * 1.1, r * 0.5);
    // Dark purple bloom base
    g.fillStyle(0x2a0844, 1);
    g.fillCircle(hx, hy, r + 0.4);
    g.fillStyle(0x5a1a88, 1);
    g.fillCircle(hx, hy, r);
    g.fillStyle(0x9944cc, 1);
    g.fillCircle(hx - 0.3, hy - 0.3, r * 0.7);
    // Short bristle spikes radiating
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const tipX = hx + Math.cos(a) * (r + 1.3);
      const tipY = hy + Math.sin(a) * (r + 1.3);
      const bLx = hx + Math.cos(a - 0.15) * r * 0.8;
      const bLy = hy + Math.sin(a - 0.15) * r * 0.8;
      const bRx = hx + Math.cos(a + 0.15) * r * 0.8;
      const bRy = hy + Math.sin(a + 0.15) * r * 0.8;
      g.fillStyle(0x6a2088, 1);
      g.fillTriangle(tipX, tipY, bLx, bLy, bRx, bRy);
    }
    // Bright core
    g.fillStyle(0xcc88ff, 1);
    g.fillCircle(hx - 0.3, hy - 0.3, r * 0.4);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(hx - 0.5, hy - 0.5, r * 0.2);
  }

  // ── Motion-trail dots behind each head. ──
  g.fillStyle(0xcc88ff, 0.7);
  g.fillCircle(cx - 3, cy - 6, 0.8);
  g.fillCircle(cx + 3, cy + 6, 0.7);
  g.fillCircle(cx - 8, cy, 0.6);
  g.fillStyle(0xaa55dd, 0.5);
  g.fillCircle(cx - 5, cy - 5, 0.5);
  g.fillCircle(cx + 5, cy + 5, 0.5);

  // ── Lightning spark at centre — storm-threat anchor. ──
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(cx - 0.5, cy - 2, 1, 4);
  g.fillRect(cx - 2, cy - 0.5, 4, 1);

  g.generateTexture('wicon_thistle_storm', s, s);
  g.destroy();
}
