import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';

/**
 * `ucard_reeds` — double-reed bound with waxed thread.
 * Two pale cane blades joined at the base by a dark thread wrap, the
 * signature of the drone-pipe reed. Sells "+10% cooldown reduction"
 * through the reed's tight, efficient vibration.
 */
export function drawReeds(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  cardIconBg(g, s, 0x0c1406);

  // Drop shadow.
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(16, 27, 12, 2);

  // ── LEFT BLADE — angled from base-centre up-left ──
  // The cane blade is a tapered strip, pale natural cane colour.
  g.lineStyle(4, 0x0c0a04, 1);
  g.beginPath();
  g.moveTo(15, 25);
  g.lineTo(9, 7);
  g.strokePath();

  g.lineStyle(3, 0xd8c870, 1);
  g.beginPath();
  g.moveTo(15, 25);
  g.lineTo(9, 7);
  g.strokePath();

  // Highlight on left blade.
  g.lineStyle(1, 0xf0e098, 0.6);
  g.beginPath();
  g.moveTo(14.5, 24);
  g.lineTo(8.5, 6);
  g.strokePath();

  // ── RIGHT BLADE — angled from base-centre up-right ──
  g.lineStyle(4, 0x0c0a04, 1);
  g.beginPath();
  g.moveTo(17, 25);
  g.lineTo(23, 7);
  g.strokePath();

  g.lineStyle(3, 0xd8c870, 1);
  g.beginPath();
  g.moveTo(17, 25);
  g.lineTo(23, 7);
  g.strokePath();

  // Highlight on right blade.
  g.lineStyle(1, 0xf0e098, 0.6);
  g.beginPath();
  g.moveTo(17.5, 24);
  g.lineTo(23.5, 6);
  g.strokePath();

  // ── THREAD WRAP — three rings of dark waxed thread at the base ──
  const THREAD = 0x2a1808;
  const THREAD_HI = 0x5a3818;
  for (let i = 0; i < 3; i++) {
    const y = 24 - i * 2;
    g.lineStyle(2, THREAD, 1);
    g.strokeRect(13, y, 6, 1.5);
    g.fillStyle(THREAD_HI, 0.5);
    g.fillRect(13, y, 6, 0.8);
  }

  // Tip glow — soft green at blade tips to suggest the drone's tone.
  g.fillStyle(0x4aaa50, 0.45);
  g.fillCircle(9, 7, 3);
  g.fillCircle(23, 7, 3);
  g.fillStyle(0x88cc88, 0.25);
  g.fillCircle(9, 7, 1.5);
  g.fillCircle(23, 7, 1.5);

  g.generateTexture('ucard_reeds', s, s);
  g.destroy();
}
