import * as Phaser from 'phaser';

/**
 * `wicon_clarsach` — Clàrsach weapon icon.
 * A stylised Celtic triangular harp: forepillar on the left, neck
 * curving up-right, soundbox at bottom-right. Amber-gold strings
 * strung diagonally, matching the arc-sweep weapon colour (0xf5c842).
 * Reads as "harp / music / sweep" at 32px.
 */
export function drawClarsachIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Soundbox — dark warm wood.
  g.fillStyle(0x4a2c0a, 1);
  g.fillTriangle(8, 26, 26, 26, 26, 10);

  // Forepillar — left vertical strut.
  g.fillStyle(0x6b3d12, 1);
  g.fillRect(6, 8, 4, 20);

  // Neck — curved upper beam (approximated with filled poly).
  g.fillStyle(0x6b3d12, 1);
  g.fillTriangle(8, 8, 26, 8, 10, 4);

  // Wood highlight on forepillar.
  g.fillStyle(0x9a6030, 0.65);
  g.fillRect(7, 9, 2, 16);

  // Strings — seven amber-gold diagonal lines from neck to soundbox.
  const stringsCount = 7;
  const stringColor = 0xf5c842;
  for (let i = 0; i < stringsCount; i++) {
    const t = i / (stringsCount - 1);
    const topX = 11 + t * 13;   // across the neck
    const topY = 7 + t * 3;
    const botX = 12 + t * 12;   // across the soundbox base
    const botY = 24 - t * 2;
    const alpha = 0.95 - t * 0.25;
    g.lineStyle(i === 0 ? 2 : 1.5, stringColor, alpha);
    g.lineBetween(topX, topY, botX, botY);
  }

  // Resonance glow behind strings — faint amber halo.
  g.lineStyle(1, 0xf5c842, 0.18);
  g.strokeCircle(18, 17, 12);

  // String highlight on first string — the wire catches light.
  g.lineStyle(1, 0xfff0a0, 0.55);
  g.lineBetween(11, 7, 12, 22);

  g.generateTexture('wicon_clarsach', s, s);
  g.destroy();
}
