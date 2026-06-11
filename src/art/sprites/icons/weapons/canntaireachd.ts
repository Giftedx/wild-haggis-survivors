import * as Phaser from 'phaser';

/**
 * `wicon_canntaireachd` — Canntaireachd weapon icon.
 * An open mouth with a wider double-ring aura — the evolved form
 * reads as "full voice / greater reach / stop-cold power" at 32px.
 */
export function drawCanntaireachdIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 15;

  // Outer doubled aura — deeper gold.
  g.fillStyle(0xb88820, 0.14);
  g.fillCircle(cx, cy, 15);

  g.fillStyle(0xd4a030, 0.24);
  g.fillCircle(cx, cy, 11);

  g.fillStyle(0xf0d060, 0.32);
  g.fillCircle(cx, cy, 7);

  // Head silhouette.
  g.fillStyle(0xc89060, 1);
  g.fillCircle(cx, cy - 1, 6);

  // Open mouth — wider than port_a_beul.
  g.fillStyle(0x1a0d08, 1);
  g.fillEllipse(cx, cy + 4, 9, 5.5);

  // Teeth.
  g.fillStyle(0xf8f0e0, 0.85);
  g.fillRect(cx - 3.5, cy + 2, 7, 1.5);

  // Three breath arcs — reaching further.
  g.lineStyle(1.5, 0xd4a030, 0.80);
  g.beginPath();
  g.arc(cx, cy + 4, 5, -0.55, 0.55, false);
  g.strokePath();

  g.lineStyle(1.2, 0xd4a030, 0.55);
  g.beginPath();
  g.arc(cx, cy + 4, 9, -0.65, 0.65, false);
  g.strokePath();

  g.lineStyle(1, 0xb88820, 0.35);
  g.beginPath();
  g.arc(cx, cy + 4, 13, -0.70, 0.70, false);
  g.strokePath();

  // Stop-cold accent — two small perpendicular ticks on the outer arc.
  g.lineStyle(1.2, 0xf0d060, 0.70);
  g.lineBetween(cx + 12, cy + 1, cx + 14, cy - 1);
  g.lineBetween(cx - 12, cy + 1, cx - 14, cy - 1);

  g.generateTexture('wicon_canntaireachd', s, s);
  g.destroy();
}
