import * as Phaser from 'phaser';

/**
 * `wicon_brose_cannon` — Brose Cannon evolution icon.
 * Three pots in a spread-fan with larger oatmeal arcs — reads as
 * "scatter / triple-lob / saturate" at 32px.
 */
export function drawBroseCannonIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Three arcing trajectory lines — fan spread.
  g.lineStyle(1, 0xa89070, 0.40);
  // Left arc
  g.beginPath();
  g.arc(8, 24, 18, -1.1, -0.5, false);
  g.strokePath();
  // Centre arc
  g.beginPath();
  g.arc(16, 26, 18, -1.35, -0.8, false);
  g.strokePath();
  // Right arc
  g.beginPath();
  g.arc(24, 24, 18, -1.6, -1.0, false);
  g.strokePath();

  // Three small pots at different positions in the fan.
  const pots = [
    { x: 6, y: 10 },
    { x: 16, y: 7 },
    { x: 25, y: 10 },
  ];

  for (const p of pots) {
    // Pot shadow.
    g.fillStyle(0x1a1a1a, 0.35);
    g.fillEllipse(p.x + 1, p.y + 1, 9, 7);

    // Pot body.
    g.fillStyle(0x3a3a3a, 1);
    g.fillEllipse(p.x, p.y, 9, 7);

    // Oatmeal fill.
    g.fillStyle(0xd4c090, 1);
    g.fillEllipse(p.x, p.y - 1, 7, 3);

    // Porridge splash — small mote above.
    g.fillStyle(0xd4c090, 0.80);
    g.fillCircle(p.x, p.y - 5, 1.8);
    g.fillCircle(p.x - 2, p.y - 6, 1.2);
  }

  // Brose label accent — warm spread glow at base.
  g.fillStyle(0xa89070, 0.12);
  g.fillEllipse(16, 28, 26, 8);

  g.generateTexture('wicon_brose_cannon', s, s);
  g.destroy();
}
