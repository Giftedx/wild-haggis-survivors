import * as Phaser from 'phaser';

/**
 * `ucard_rowan_thread` — Rowan Thread passive card icon.
 * A small rowan sprig (two clusters of berries, dark-red) with a
 * thin red thread wrapped once around the stem. Reads as "protection/
 * plant" at 32px — distinct from the whisky, cloth, and metal passives.
 */
export function drawRowanThread(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Main stem — dark bark brown, slightly diagonal.
  g.lineStyle(2.5, 0x3a2010, 1);
  g.lineBetween(11, 28, 20, 6);

  // Left branch.
  g.lineStyle(1.8, 0x3a2010, 1);
  g.lineBetween(13, 22, 7, 17);

  // Right branch.
  g.lineBetween(17, 14, 24, 10);

  // Left berry cluster (3 berries).
  const leftBerries = [
    { x: 7, y: 16 }, { x: 5, y: 13 }, { x: 9, y: 13 },
  ];
  for (const b of leftBerries) {
    g.fillStyle(0x1a0a04, 1);
    g.fillCircle(b.x, b.y, 3);
    g.fillStyle(0x9a1818, 1);
    g.fillCircle(b.x, b.y, 2.5);
    g.fillStyle(0xcc3030, 0.6);
    g.fillCircle(b.x - 0.5, b.y - 0.5, 1);
  }

  // Right berry cluster (3 berries).
  const rightBerries = [
    { x: 24, y: 9 }, { x: 22, y: 7 }, { x: 26, y: 7 },
  ];
  for (const b of rightBerries) {
    g.fillStyle(0x1a0a04, 1);
    g.fillCircle(b.x, b.y, 3);
    g.fillStyle(0x9a1818, 1);
    g.fillCircle(b.x, b.y, 2.5);
    g.fillStyle(0xcc3030, 0.6);
    g.fillCircle(b.x - 0.5, b.y - 0.5, 1);
  }

  // Protective thread — bright red, wrapped around mid-stem.
  g.lineStyle(1.5, 0xd42020, 0.9);
  g.lineBetween(14, 20, 18, 18);
  g.lineBetween(18, 18, 14, 16);
  // Trailing thread end.
  g.lineStyle(1, 0xd42020, 0.6);
  g.lineBetween(14, 16, 11, 18);

  g.generateTexture('ucard_rowan_thread', s, s);
  g.destroy();
}
