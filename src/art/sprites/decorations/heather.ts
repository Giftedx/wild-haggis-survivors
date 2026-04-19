/**
 * `deco_heather` — purple heather bush for moor dressing. Woody stem
 * base, layered foliage, signature flower spikes climbing up with
 * blossom bumps, and a wee bee or hoverfly visiting.
 */

import Phaser from 'phaser';

export function bakeHeather(scene: Phaser.Scene): void {
  const s = 22;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 3;

  // Ground shadow — soft, grounding the bush on the moor
  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(cx, cy + 4, 14, 4);

  // Woody base stems (heather is semi-shrubby, not just a blob)
  g.fillStyle(0x3a1a10, 1);
  g.fillRect(cx - 5, cy, 1, 4);
  g.fillRect(cx - 2, cy - 1, 1, 5);
  g.fillRect(cx + 1, cy, 1, 4);
  g.fillRect(cx + 4, cy - 1, 1, 5);
  g.fillRect(cx - 4, cy + 1, 1, 3);
  g.fillRect(cx + 3, cy, 1, 4);

  // Dark leaf mass at base — establishes volume
  g.fillStyle(0x3a1828, 1);
  g.fillEllipse(cx, cy + 1, 16, 8);
  // Mid-tone leaf layer
  g.fillStyle(0x5a2244, 1);
  g.fillEllipse(cx, cy, 14, 7);
  // Lighter foliage clumps — irregular for natural feel
  g.fillStyle(0x6b3355, 1);
  g.fillCircle(cx - 4, cy, 3);
  g.fillCircle(cx, cy - 1, 3.5);
  g.fillCircle(cx + 4, cy, 3);
  g.fillCircle(cx + 1, cy + 1, 2.5);
  // Bright purple bloom highlights
  g.fillStyle(0x884466, 1);
  g.fillCircle(cx - 4, cy - 1, 2);
  g.fillCircle(cx, cy - 2, 2.2);
  g.fillCircle(cx + 4, cy - 1, 2);

  // ── Flower spikes — the signature heather silhouette ──
  // Each spike: stem + individual blossom bumps climbing up
  const spikes: [number, number, number][] = [
    // [xOffset, height, lean] — lean: slight curve direction
    [-6, 7, -0.3], [-4, 5, 0.2], [-2, 8, -0.1],
    [0, 6, 0.3], [2, 7, -0.2], [4, 5, 0.1], [5, 4, 0.4],
  ];
  for (const [xOff, h, _lean] of spikes) {
    const sx = cx + xOff;
    const baseY = cy - 2;
    // Tiny green-brown stem
    g.fillStyle(0x4a2a18, 0.8);
    g.fillRect(sx, baseY - h, 1, h);
    // Blossom bumps climbing up the spike (each ~1px dot)
    for (let i = 0; i < h - 1; i++) {
      const by = baseY - i - 1;
      // Alternate between two purple tones for texture
      g.fillStyle(i % 2 === 0 ? 0xbb6699 : 0xcc77aa, 1);
      g.fillRect(sx - 1, by, 1, 1);
      g.fillRect(sx + 1, by, 1, 1);
    }
    // Bright pink tip — the fresh bloom at top
    g.fillStyle(0xeeaacc, 1);
    g.fillRect(sx, baseY - h, 1, 1);
    // Tiny highlight dot on tip
    g.fillStyle(0xffccdd, 0.8);
    g.fillRect(sx, baseY - h - 1, 1, 1);
  }

  // A wee bee or hoverfly visiting (tiny 2px detail — life in the moor)
  g.fillStyle(0xddaa22, 1);
  g.fillRect(cx + 6, cy - 6, 1, 1);
  g.fillStyle(0x111111, 0.8);
  g.fillRect(cx + 6, cy - 7, 1, 1);
  // Translucent wing
  g.fillStyle(0xffffff, 0.4);
  g.fillRect(cx + 7, cy - 7, 1, 1);

  g.generateTexture('deco_heather', s, s);
  g.destroy();
}
