import * as Phaser from 'phaser';

/**
 * `wicon_selkie_chorus` — Selkie Chorus evolution icon.
 * Three selkie silhouettes rising from the sea, each circled by its own
 * charm ring. The chorus is bigger and louder — three voices, three charms.
 * Reads as "multi-charm / evolved" vs the single-selkie base weapon.
 */
export function drawSelkieChorusIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Deep sea backing.
  g.fillStyle(0x0d2238, 0.70);
  g.fillEllipse(16, 20, 30, 20);

  // Outer evolution aura ring — gold-edged to signal legendary tier.
  g.lineStyle(1.5, 0xddcc88, 0.45);
  g.strokeCircle(16, 16, 14);
  g.lineStyle(1, 0xddcc88, 0.25);
  g.strokeCircle(16, 16, 11);

  // Three inner charm rings — sea-blue.
  g.lineStyle(1, 0x66aadd, 0.60);
  g.strokeCircle(9, 18, 5);
  g.strokeCircle(16, 14, 5);
  g.strokeCircle(23, 18, 5);

  // Wave crests — polyline approximations.
  g.lineStyle(2, 0x4488bb, 0.80);
  g.beginPath();
  g.moveTo(3, 21);
  g.lineTo(6, 17);
  g.lineTo(10, 16);
  g.lineTo(13, 18);
  g.lineTo(16, 21);
  g.lineTo(19, 24);
  g.lineTo(23, 25);
  g.lineTo(26, 23);
  g.lineTo(29, 21);
  g.strokePath();

  g.lineStyle(1.5, 0x6699cc, 0.50);
  g.beginPath();
  g.moveTo(5, 24);
  g.lineTo(8, 21);
  g.lineTo(11, 20);
  g.lineTo(14, 22);
  g.lineTo(17, 24);
  g.lineTo(20, 27);
  g.lineTo(24, 27);
  g.lineTo(27, 25);
  g.lineTo(29, 24);
  g.strokePath();

  // Left selkie.
  g.fillStyle(0x1a2a3a, 1);
  g.fillEllipse(9, 17, 7, 5);
  g.fillStyle(0x336688, 0.50);
  g.fillEllipse(8, 16, 3, 2);

  // Centre selkie (largest — the lead voice).
  g.fillStyle(0x1a2a3a, 1);
  g.fillEllipse(16, 13, 9, 7);
  g.fillStyle(0x4488aa, 0.55);
  g.fillEllipse(15, 12, 4, 3);

  // Right selkie.
  g.fillStyle(0x1a2a3a, 1);
  g.fillEllipse(23, 17, 7, 5);
  g.fillStyle(0x336688, 0.50);
  g.fillEllipse(22, 16, 3, 2);

  // Song dots above centre selkie.
  g.fillStyle(0xaaddee, 0.90);
  g.fillCircle(13, 7, 1.5);
  g.fillCircle(16, 5, 1.5);
  g.fillCircle(19, 7, 1.5);
  g.lineStyle(1, 0xaaddee, 0.55);
  g.lineBetween(13, 7, 13, 10);
  g.lineBetween(16, 5, 16, 9);
  g.lineBetween(19, 7, 19, 10);

  g.generateTexture('wicon_selkie_chorus', s, s);
  g.destroy();
}
