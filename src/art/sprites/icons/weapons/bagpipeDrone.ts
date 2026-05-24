import * as Phaser from 'phaser';

/**
 * `wicon_bagpipe_drone` — drone pipe icon.
 * Three parallel drone pipes (bass + baritone) tapering upward, with a
 * soft green aura ring suggesting the slow-field. Reads as "pipe/aura"
 * at 32px — distinct from the full bagpipes icon.
 */
export function drawBagpipeDroneIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Slow-field aura ring — soft green halo behind the pipes.
  g.lineStyle(1.5, 0x3a8844, 0.35);
  g.strokeCircle(16, 18, 13);
  g.lineStyle(1, 0x3a8844, 0.2);
  g.strokeCircle(16, 18, 10);

  // Three drone pipes — vertical cylinders, left / centre / right.
  const pipes = [
    { x: 10, topY: 5, botY: 27, w: 4 },
    { x: 16, topY: 3, botY: 27, w: 4 },
    { x: 22, topY: 5, botY: 27, w: 4 },
  ];

  for (const p of pipes) {
    // Shadow outline.
    g.fillStyle(0x0c1806, 1);
    g.fillRect(p.x - 1, p.topY - 1, p.w + 2, p.botY - p.topY + 2);
    // Dark green pipe body.
    g.fillStyle(0x2a5830, 1);
    g.fillRect(p.x, p.topY, p.w, p.botY - p.topY);
    // Highlight stripe on left edge.
    g.fillStyle(0x4a8844, 0.6);
    g.fillRect(p.x, p.topY, 1, p.botY - p.topY);
  }

  // Connector band — horizontal band joining the three pipes mid-way.
  g.fillStyle(0x1a1008, 1);
  g.fillRect(8, 16, 16, 3);
  g.fillStyle(0x5a4828, 0.8);
  g.fillRect(9, 16, 14, 2);

  // Cap / socket tops — dark ovoid at top of each pipe.
  for (const p of pipes) {
    g.fillStyle(0x0c1806, 1);
    g.fillEllipse(p.x + p.w / 2, p.topY, p.w + 2, 3);
    g.fillStyle(0x3a6838, 1);
    g.fillEllipse(p.x + p.w / 2, p.topY, p.w, 2);
  }

  // Bell openings at bottom — wider dark ovals.
  for (const p of pipes) {
    g.fillStyle(0x0c1806, 1);
    g.fillEllipse(p.x + p.w / 2, p.botY + 1, p.w + 3, 4);
    g.fillStyle(0x1a1808, 1);
    g.fillEllipse(p.x + p.w / 2, p.botY, p.w + 1, 2.5);
  }

  g.generateTexture('wicon_bagpipe_drone', s, s);
  g.destroy();
}
