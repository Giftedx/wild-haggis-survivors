import * as Phaser from 'phaser';

export function drawThistleShotIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 14;

  // ── Green calyx (the prickly cup under the bloom) — bold spiked
  // base so the silhouette reads "thistle flower" rather than
  // "purple ball". Three pointed green spikes on top of a wider
  // green cup. ──
  g.fillStyle(0x1a0a30, 1);
  g.fillTriangle(cx, cy + 3, cx - 7, cy + 11, cx + 7, cy + 11);
  g.fillStyle(0x331155, 1);
  g.fillTriangle(cx, cy + 4, cx - 6, cy + 11, cx + 6, cy + 11);
  g.fillStyle(0x442266, 1);
  g.fillTriangle(cx, cy + 5, cx - 5, cy + 10, cx + 5, cy + 10);
  // Calyx spike tips — three pointed green triangles poking into
  // the bloom (signature thistle detail)
  g.fillStyle(0x331155, 1);
  g.fillTriangle(cx - 4, cy + 5, cx - 5, cy + 8, cx - 2, cy + 7);
  g.fillTriangle(cx, cy + 4, cx - 1, cy + 7, cx + 1, cy + 7);
  g.fillTriangle(cx + 4, cy + 5, cx + 5, cy + 8, cx + 2, cy + 7);

  // ── Stem — green vertical bar below the calyx. ──
  g.fillStyle(0x1a0a30, 1);
  g.fillRect(cx - 1, cy + 11, 2, 4);
  g.fillStyle(0x331155, 1);
  g.fillRect(cx - 0.5, cy + 11, 1, 4);

  // ── Bloom base — dark purple sphere forms the underlying shape. ──
  g.fillStyle(0x2a0a40, 1);
  g.fillCircle(cx, cy, 9);

  // ── Bristles — 16 short radial spikes fanning outward from the
  // bloom. Denser = reads as a bristly thistle seed-head. ──
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI * 0.5;
    const innerR = 7;
    const outerR = 12;
    const spread = 0.1;
    g.fillStyle(0x4a1a6a, 1);
    g.fillTriangle(
      cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR,
      cx + Math.cos(a - spread) * innerR, cy + Math.sin(a - spread) * innerR,
      cx + Math.cos(a + spread) * innerR, cy + Math.sin(a + spread) * innerR,
    );
  }
  // Brighter inner bristle layer — shorter spikes, denser
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI * 0.25;
    const innerR = 5;
    const outerR = 9;
    const spread = 0.12;
    g.fillStyle(0x7a3abb, 1);
    g.fillTriangle(
      cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR,
      cx + Math.cos(a - spread) * innerR, cy + Math.sin(a - spread) * innerR,
      cx + Math.cos(a + spread) * innerR, cy + Math.sin(a + spread) * innerR,
    );
  }
  // Highlight bristles — 8 lightest strands on the upper half only
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI - Math.PI;
    const innerR = 4;
    const outerR = 8;
    g.fillStyle(0xc88ade, 0.85);
    g.fillTriangle(
      cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR,
      cx + Math.cos(a - 0.1) * innerR, cy + Math.sin(a - 0.1) * innerR,
      cx + Math.cos(a + 0.1) * innerR, cy + Math.sin(a + 0.1) * innerR,
    );
  }

  // ── Central bloom core — bright purple dome with a catch-light. ──
  g.fillStyle(0x5a2088, 1);
  g.fillCircle(cx, cy, 4.5);
  g.fillStyle(0x8a50c0, 1);
  g.fillCircle(cx - 0.5, cy - 0.5, 3);
  g.fillStyle(0xcc9ae0, 0.95);
  g.fillCircle(cx - 1, cy - 1, 1.5);
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(cx - 1.3, cy - 1.3, 0.6);

  g.generateTexture('wicon_thistle_shot', s, s);
  g.destroy();
}
