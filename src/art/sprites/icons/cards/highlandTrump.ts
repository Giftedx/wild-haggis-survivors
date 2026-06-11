import * as Phaser from 'phaser';

/**
 * `ucard_highland_trump` — Highland Trump passive icon.
 * A small jaw harp (mouth harp) — metal frame, central reed/tongue —
 * reads as "frame-drone / resonance / cooldown" at 32px.
 */
export function drawHighlandTrump(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 16;

  // Warm resonance glow — the frame-drone hum.
  g.fillStyle(0xe0c050, 0.18);
  g.fillCircle(cx, cy, 12);

  // Outer frame of the jew's harp — U-shaped metal.
  g.lineStyle(3, 0x8a7040, 1);
  g.beginPath();
  g.moveTo(cx - 3, cy - 9);
  g.lineTo(cx - 3, cy + 9);
  g.strokePath();

  g.beginPath();
  g.moveTo(cx + 3, cy - 9);
  g.lineTo(cx + 3, cy + 9);
  g.strokePath();

  // Rounded top connecting bar.
  g.lineStyle(3, 0x8a7040, 1);
  g.beginPath();
  g.arc(cx, cy - 9, 3, Math.PI, 0, false);
  g.strokePath();

  // Bottom connecting bar.
  g.lineStyle(2.5, 0x8a7040, 1);
  g.lineBetween(cx - 3, cy + 9, cx + 3, cy + 9);

  // Vibrating reed / tongue — centre element.
  g.lineStyle(1.5, 0xd4a820, 1);
  g.lineBetween(cx, cy - 7, cx, cy + 11);

  // Reed tip — slight curve suggestion.
  g.fillStyle(0xd4a820, 0.90);
  g.fillCircle(cx, cy + 11, 2);

  // Resonance wave lines — the drone radiating out.
  g.lineStyle(0.8, 0xe0c050, 0.55);
  g.lineBetween(cx - 8, cy - 2, cx - 6, cy - 2);
  g.lineBetween(cx + 6, cy - 2, cx + 8, cy - 2);
  g.lineStyle(0.8, 0xe0c050, 0.35);
  g.lineBetween(cx - 11, cy + 2, cx - 7, cy + 2);
  g.lineBetween(cx + 7, cy + 2, cx + 11, cy + 2);

  g.generateTexture('ucard_highland_trump', s, s);
  g.destroy();
}
