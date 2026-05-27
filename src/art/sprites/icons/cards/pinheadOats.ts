import * as Phaser from 'phaser';

/**
 * `ucard_pinhead_oats` — Pinhead Oats passive icon.
 * A small heap of rolled oats in a wooden bowl — reads as
 * "porridge / sustain / max HP" at 32px.
 */
export function drawPinheadOats(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 20;

  // Bowl shadow.
  g.fillStyle(0x1a1a1a, 0.30);
  g.fillEllipse(cx + 1, cy + 2, 20, 8);

  // Wooden bowl body.
  g.fillStyle(0x8a6040, 1);
  g.fillEllipse(cx, cy + 1, 20, 8);

  // Bowl rim — lighter wood.
  g.fillStyle(0xb08060, 1);
  g.fillEllipse(cx, cy - 1, 20, 6);

  // Oat heap — warm beige mound.
  g.fillStyle(0xd4c090, 1);
  g.fillEllipse(cx, cy - 4, 16, 9);

  // Oat texture — individual flake clusters.
  g.fillStyle(0xe8d8a8, 0.70);
  g.fillEllipse(cx - 3, cy - 6, 4, 2);
  g.fillEllipse(cx + 2, cy - 7, 3, 2);
  g.fillEllipse(cx - 1, cy - 4, 3, 1.5);

  g.fillStyle(0xb0a070, 0.55);
  g.fillEllipse(cx + 3, cy - 5, 3, 1.5);
  g.fillEllipse(cx - 4, cy - 5, 3, 1.5);

  // Steam wisps — two faint curls.
  g.lineStyle(1, 0xe0d8c0, 0.40);
  g.beginPath();
  g.moveTo(cx - 2, cy - 10);
  g.lineTo(cx - 4, cy - 13);
  g.lineTo(cx - 2, cy - 15);
  g.strokePath();

  g.lineStyle(1, 0xe0d8c0, 0.30);
  g.beginPath();
  g.moveTo(cx + 3, cy - 10);
  g.lineTo(cx + 5, cy - 12);
  g.lineTo(cx + 3, cy - 14);
  g.strokePath();

  g.generateTexture('ucard_pinhead_oats', s, s);
  g.destroy();
}
