import * as Phaser from 'phaser';

/**
 * `ucard_seal_pelt` — Seal Pelt passive card icon.
 * A smooth salt-grey seal pelt folded on itself, with a faint shimmer
 * of sea-blue suggesting the regen warmth it provides. Reads as
 * "protection / regen / sea" at 32px — distinct from wool-based passives.
 */
export function drawSealPelt(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Pelt shadow / backing.
  g.fillStyle(0x1a2a38, 0.40);
  g.fillEllipse(17, 21, 22, 14);

  // Main pelt — smooth blue-grey, sleek as a wet seal.
  g.fillStyle(0x8898aa, 1);
  g.fillEllipse(16, 17, 20, 14);

  // Pelt highlight — lighter sheen on the upper surface.
  g.fillStyle(0xaabbc8, 0.75);
  g.fillEllipse(15, 14, 13, 7);

  // Pelt fold line — subtle crease across the middle.
  g.lineStyle(1.5, 0x667788, 0.55);
  g.lineBetween(6, 18, 26, 17);

  // Underside — darker grey where the pelt is folded under.
  g.fillStyle(0x6a7888, 0.85);
  g.fillEllipse(16, 21, 16, 6);

  // Sea-regen shimmer — tiny blue droplets near the edges (hint of the sea).
  g.fillStyle(0x66aacc, 0.65);
  g.fillCircle(7, 15, 2);
  g.fillCircle(25, 16, 2);
  g.fillCircle(16, 24, 2);

  // HP-regen cross symbol — faint green heartbeat mark at centre.
  g.lineStyle(1.5, 0x44cc88, 0.50);
  g.lineBetween(16, 13, 16, 20);
  g.lineBetween(12, 16, 20, 16);

  g.generateTexture('ucard_seal_pelt', s, s);
  g.destroy();
}
