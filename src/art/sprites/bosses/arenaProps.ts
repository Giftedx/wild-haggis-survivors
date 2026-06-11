/**
 * Boss arena/event props. They are baked as standalone sprites for the
 * export sheet and future encounter staging, matching the five boss
 * silhouettes without changing combat behaviour.
 */
import * as Phaser from 'phaser';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

function bake(scene: Phaser.Scene, key: string, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, 42, 34);
  g.destroy();
}

export function bakeBossArenaProps(scene: Phaser.Scene): void {
  bake(scene, 'boss_prop_gordon_chopping_board', (g) => {
    g.fillStyle(0x000000, 0.16);
    g.fillEllipse(21, 28, 32, 5);
    g.fillStyle(0x2a1608, 1);
    g.fillRoundedRect(7, 10, 28, 17, 3);
    g.fillStyle(0x9a6330, 1);
    g.fillRoundedRect(8, 9, 26, 17, 3);
    g.fillStyle(0xd09048, 0.9);
    g.fillRect(11, 11, 16, 2);
    g.fillStyle(0x3a1a08, 0.75);
    g.fillRect(12, 20, 16, 1);
    g.fillStyle(0xe8e0d0, 1);
    g.fillRect(26, 6, 10, 3);
    g.fillStyle(0x5a6068, 1);
    g.fillTriangle(22, 10, 38, 8, 27, 15);
  });

  bake(scene, 'boss_prop_tour_bus_sign', (g) => {
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(21, 29, 24, 5);
    g.fillStyle(0x1a1208, 1);
    g.fillRect(19, 13, 4, 16);
    g.fillStyle(0xffe060, 1);
    g.fillRect(9, 6, 24, 11);
    g.fillStyle(0x202020, 1);
    g.fillRect(11, 8, 20, 2);
    g.fillRect(11, 12, 14, 2);
    g.fillStyle(0xd82020, 1);
    g.fillCircle(30, 20, 4);
  });

  bake(scene, 'boss_prop_laird_gate', (g) => {
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(21, 29, 32, 5);
    g.fillStyle(0x1a0e05, 1);
    for (const x of [8, 16, 24, 32]) g.fillRect(x, 8, 3, 21);
    g.fillStyle(0x5a3518, 1);
    for (const x of [9, 17, 25, 33]) g.fillRect(x, 9, 1.5, 19);
    g.fillStyle(0x2a1808, 1);
    g.fillRect(6, 14, 31, 3);
    g.fillRect(6, 23, 31, 3);
    g.fillStyle(0xd0a840, 1);
    g.fillCircle(21, 19, 3.5);
    g.fillStyle(0x3a2608, 1);
    g.fillCircle(21, 19, 1.4);
  });

  bake(scene, 'boss_prop_hunter_target_flag', (g) => {
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(21, 29, 26, 5);
    g.fillStyle(0x2a1808, 1);
    g.fillRect(19, 8, 3, 21);
    g.fillStyle(0xc8b878, 1);
    g.fillTriangle(22, 8, 36, 12, 22, 17);
    g.fillStyle(0x8a1818, 1);
    g.fillTriangle(23, 10, 32, 12, 23, 15);
    g.fillStyle(0xe8e0c0, 1);
    g.fillCircle(13, 17, 8);
    g.fillStyle(0xa02020, 1);
    g.fillCircle(13, 17, 5);
    g.fillStyle(0xe8e0c0, 1);
    g.fillCircle(13, 17, 2);
  });

  bake(scene, 'boss_prop_taxman_stamp', (g) => {
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(21, 29, 28, 5);
    g.fillStyle(0x1a0e04, 1);
    g.fillRect(15, 8, 12, 9);
    g.fillRect(12, 17, 18, 8);
    g.fillStyle(0x5a3518, 1);
    g.fillRect(16, 9, 10, 7);
    g.fillStyle(0xd8c090, 1);
    g.fillRect(13, 18, 16, 6);
    g.fillStyle(0xa02020, 1);
    g.fillRect(9, 24, 24, 3);
    g.fillStyle(0xffe0e0, 0.75);
    g.fillRect(15, 20, 10, 1);
  });
}
