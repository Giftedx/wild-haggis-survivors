import * as Phaser from 'phaser';

/**
 * `ucard_copper_rivet` — Copper Rivet passive card icon.
 * A single large hand-forged rivet head — round copper cap, square
 * shank, set against a dark iron plate with two smaller rivets flanking
 * it. Reads as "industrial/Clyde-built" at 32px.
 */
export function drawCopperRivet(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Iron plate background — dark grey, slightly recessed.
  g.fillStyle(0x2a2a2a, 1);
  g.fillRoundedRect(4, 6, 24, 20, 3);
  g.fillStyle(0x3e3e3e, 1);
  g.fillRoundedRect(5, 7, 22, 18, 2);

  // Plate highlight — subtle top sheen.
  g.fillStyle(0x5a5a5a, 0.35);
  g.fillRect(6, 7, 20, 3);

  // Central rivet — large copper cap.
  g.fillStyle(0x3a1a00, 1);
  g.fillCircle(16, 16, 7);
  g.fillStyle(0xb87820, 1);
  g.fillCircle(16, 16, 6);
  // Copper sheen — warm highlight top-left.
  g.fillStyle(0xe8a830, 0.70);
  g.fillEllipse(14, 14, 5, 4);
  // Rivet punch-mark — small dark centre dimple.
  g.fillStyle(0x6a3a08, 1);
  g.fillCircle(16, 16, 1.8);

  // Left small rivet.
  g.fillStyle(0x2a1200, 1);
  g.fillCircle(8, 16, 3);
  g.fillStyle(0x9a6010, 1);
  g.fillCircle(8, 16, 2.5);
  g.fillStyle(0xc88828, 0.55);
  g.fillCircle(7, 15, 1);

  // Right small rivet.
  g.fillStyle(0x2a1200, 1);
  g.fillCircle(24, 16, 3);
  g.fillStyle(0x9a6010, 1);
  g.fillCircle(24, 16, 2.5);
  g.fillStyle(0xc88828, 0.55);
  g.fillCircle(23, 15, 1);

  g.generateTexture('ucard_copper_rivet', s, s);
  g.destroy();
}
