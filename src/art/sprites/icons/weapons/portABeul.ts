import * as Phaser from 'phaser';

/**
 * `wicon_port_a_beul` — Port-à-Beul weapon icon.
 * An open mouth mid-song, warm amber breath-glow radiating outward
 * — reads as "voice / aura / rhythm" at 32px.
 */
export function drawPortABeulIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 16;

  // Outer breath aura — warm amber glow.
  g.fillStyle(0xf0d060, 0.18);
  g.fillCircle(cx, cy, 14);

  g.fillStyle(0xf0d060, 0.28);
  g.fillCircle(cx, cy, 10);

  // Head silhouette — simple circle.
  g.fillStyle(0xc89060, 1);
  g.fillCircle(cx, cy - 2, 7);

  // Open mouth — the instrument.
  g.fillStyle(0x1a0d08, 1);
  g.fillEllipse(cx, cy + 3, 8, 5);

  // Teeth hint — warm white strip across upper mouth.
  g.fillStyle(0xf8f0e0, 0.85);
  g.fillRect(cx - 3, cy + 1, 6, 1.5);

  // Breath arc — three curved lines radiating from mouth.
  g.lineStyle(1.2, 0xf0d060, 0.70);
  g.beginPath();
  g.arc(cx, cy + 3, 5, -0.5, 0.5, false);
  g.strokePath();

  g.lineStyle(1, 0xf0d060, 0.45);
  g.beginPath();
  g.arc(cx, cy + 3, 9, -0.6, 0.6, false);
  g.strokePath();

  g.lineStyle(0.8, 0xf0d060, 0.25);
  g.beginPath();
  g.arc(cx, cy + 3, 13, -0.65, 0.65, false);
  g.strokePath();

  g.generateTexture('wicon_port_a_beul', s, s);
  g.destroy();
}
