import * as Phaser from 'phaser';

/**
 * `wicon_clarsach_eternal` — Clàrsach Eternal evolution icon.
 * Three harps superimposed at slight angles, strings radiating amber-gold,
 * with a resonance glow and a gold legendary-tier aura ring. Reads as
 * "triple-chord / legendary / harp" vs the single base weapon.
 */
export function drawClarsachEternalIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Legendary aura — warm gold outer ring.
  g.lineStyle(2, 0xf5c842, 0.30);
  g.strokeCircle(16, 16, 14);
  g.lineStyle(1, 0xfff0a0, 0.18);
  g.strokeCircle(16, 16, 11);

  // Central resonance fill — deep amber glow.
  g.fillStyle(0x3a2000, 0.50);
  g.fillCircle(16, 16, 12);

  // Three harp frames — overlapping at −10°/0°/+10° offset, dark wood.
  // Left harp (offset left-down).
  g.fillStyle(0x3a1a05, 0.80);
  g.fillTriangle(5, 28, 16, 28, 12, 8);
  g.fillRect(3, 7, 3, 22);
  g.fillTriangle(3, 7, 16, 7, 6, 3);

  // Right harp (offset right-down).
  g.fillStyle(0x3a1a05, 0.80);
  g.fillTriangle(16, 28, 27, 28, 20, 8);
  g.fillRect(26, 7, 3, 22);
  g.fillTriangle(16, 7, 29, 7, 22, 3);

  // Centre harp (full opacity, on top).
  g.fillStyle(0x6b3d12, 1);
  g.fillTriangle(8, 27, 24, 27, 24, 9);
  g.fillRect(6, 8, 4, 20);
  g.fillTriangle(8, 8, 24, 8, 10, 4);

  // Centre wood highlight.
  g.fillStyle(0x9a6030, 0.65);
  g.fillRect(7, 9, 2, 15);

  // Strings — seven amber-gold diagonals on centre harp.
  const stringsCount = 7;
  for (let i = 0; i < stringsCount; i++) {
    const t = i / (stringsCount - 1);
    const topX = 11 + t * 11;
    const topY = 7 + t * 3;
    const botX = 12 + t * 10;
    const botY = 24 - t * 2;
    const alpha = 0.95 - t * 0.20;
    g.lineStyle(i === 0 ? 2 : 1.5, 0xf5c842, alpha);
    g.lineBetween(topX, topY, botX, botY);
  }

  // String sheen on centre harp.
  g.lineStyle(1, 0xfff0a0, 0.55);
  g.lineBetween(11, 7, 12, 22);

  // Freeze-freeze shimmer dots — tiny pale blue sparks at string tips.
  g.fillStyle(0xaaddff, 0.70);
  g.fillCircle(11, 7, 1.5);
  g.fillCircle(22, 10, 1.5);
  g.fillCircle(16, 8, 1.5);

  g.generateTexture('wicon_clarsach_eternal', s, s);
  g.destroy();
}
