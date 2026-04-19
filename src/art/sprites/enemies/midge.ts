/**
 * `midge` — lone highland midge: translucent wings, compound red eyes, proboscis, six distinct legs. Tiny insect silhouette.
 */

import Phaser from 'phaser';

export function bakeMidge(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 1;

  // Reduced motion-blur halo (half alpha — reads as single insect, not swarm)
  g.fillStyle(0x333344, 0.15);
  g.fillCircle(cx, cy, 10);

  // ── Wings — two defined translucent ovals with visible leading edge ──
  // Left wing
  g.fillStyle(0xccddee, 0.4);
  g.fillEllipse(cx - 6, cy - 4, 10, 5);
  g.lineStyle(0.8, 0x8899aa, 0.6);
  g.lineBetween(cx - 10, cy - 5, cx - 2, cy - 3);
  // Right wing
  g.fillStyle(0xccddee, 0.4);
  g.fillEllipse(cx + 6, cy - 4, 10, 5);
  g.lineStyle(0.8, 0x8899aa, 0.6);
  g.lineBetween(cx + 2, cy - 3, cx + 10, cy - 5);

  // Body — chunky little oval, dark outline first
  g.fillStyle(0x1a1a22, 1);
  g.fillEllipse(cx, cy + 1, 12, 9);
  g.fillStyle(0x332a1a, 1);
  g.fillEllipse(cx, cy, 10, 7);
  // Abdomen segments (horizontal stripes)
  g.fillStyle(0x1a1a22, 0.7);
  g.fillRect(cx - 4, cy, 8, 1);
  g.fillRect(cx - 4, cy + 2, 8, 1);
  // Abdomen highlight
  g.fillStyle(0x5a4428, 1);
  g.fillCircle(cx - 1, cy - 1, 2);

  // Head — small dark bulb at the front
  g.fillStyle(0x0a0a11, 1);
  g.fillCircle(cx, cy - 4, 3);
  // Giant buggy compound eyes (red) — the iconic midge tell
  g.fillStyle(0xcc2244, 1);
  g.fillCircle(cx - 2, cy - 5, 1.5);
  g.fillCircle(cx + 2, cy - 5, 1.5);
  g.fillStyle(0xff6688, 1);
  g.fillCircle(cx - 2, cy - 5, 0.7);
  g.fillCircle(cx + 2, cy - 5, 0.7);

  // Proboscis
  g.fillStyle(0x0a0a11, 1);
  g.fillRect(cx, cy - 7, 1, 2);

  // ── Six distinct legs — three per side, visibly separated ──
  g.lineStyle(1, 0x0a0a11, 1);
  // Left side: front, mid, rear — each with clear separation
  g.lineBetween(cx - 4, cy + 3, cx - 8, cy + 7);   // front left
  g.lineBetween(cx - 3, cy + 4, cx - 6, cy + 10);  // mid left
  g.lineBetween(cx - 2, cy + 5, cx - 4, cy + 11);  // rear left
  // Right side: mirror
  g.lineBetween(cx + 4, cy + 3, cx + 8, cy + 7);   // front right
  g.lineBetween(cx + 3, cy + 4, cx + 6, cy + 10);  // mid right
  g.lineBetween(cx + 2, cy + 5, cx + 4, cy + 11);  // rear right

  // Thorax highlight
  g.fillStyle(0x5a4428, 0.9);
  g.fillCircle(cx, cy - 2, 1);

  g.generateTexture('midge', s, s);
  g.destroy();
}

