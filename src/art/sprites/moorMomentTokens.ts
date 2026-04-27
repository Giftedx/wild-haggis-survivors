/**
 * Small tokens that briefly ride inside moor-moment bursts. They make
 * each boon feel like a found object from the landscape rather than a
 * generic particle pop.
 */
import * as Phaser from 'phaser';

export const MOOR_MOMENT_TOKEN_KEYS = [
  'moor_token_peat_glint',
  'moor_token_loch_breath',
  'moor_token_heather_rest',
  'moor_token_pine_pull',
  'moor_token_crow_bargain',
  'moor_token_distant_tune',
  'moor_token_warm_stone',
  'moor_token_wind_shift',
  'moor_token_amber_glow',
  'moor_token_whisky_nip',
] as const;

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

function bake(scene: Phaser.Scene, key: string, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, 28, 28);
  g.destroy();
}

function halo(g: Phaser.GameObjects.Graphics, colour: number): void {
  g.fillStyle(colour, 0.18);
  g.fillCircle(14, 14, 13);
  g.lineStyle(1, colour, 0.4);
  g.strokeCircle(14, 14, 11);
}

export function bakeMoorMomentTokens(scene: Phaser.Scene): void {
  bake(scene, 'moor_token_peat_glint', (g) => {
    halo(g, 0xb27840);
    g.fillStyle(0x201008, 1);
    g.fillRect(7, 12, 15, 8);
    g.fillStyle(0x5a3018, 1);
    g.fillRect(8, 11, 13, 8);
    g.fillStyle(0xffd070, 1);
    g.fillTriangle(17, 8, 14, 15, 21, 15);
  });
  bake(scene, 'moor_token_loch_breath', (g) => {
    halo(g, 0x8ec8e8);
    g.fillStyle(0x1a4058, 1);
    g.fillEllipse(14, 18, 20, 6);
    g.fillStyle(0x9fd8f0, 0.8);
    g.fillRect(6, 17, 16, 1);
    g.fillStyle(0xd8f6ff, 0.55);
    g.fillCircle(9, 10, 2);
    g.fillCircle(15, 8, 1.6);
    g.fillCircle(20, 11, 1.8);
  });
  bake(scene, 'moor_token_heather_rest', (g) => {
    halo(g, 0xc699ee);
    g.fillStyle(0x224018, 1);
    g.fillRect(13, 9, 2, 13);
    g.fillStyle(0xa048d8, 1);
    g.fillEllipse(11, 10, 6, 4);
    g.fillEllipse(16, 8, 7, 5);
    g.fillEllipse(18, 13, 6, 4);
    g.fillStyle(0xe8b8ff, 0.9);
    g.fillCircle(15, 7, 1);
  });
  bake(scene, 'moor_token_pine_pull', (g) => {
    halo(g, 0x6aa85c);
    g.fillStyle(0x1e1008, 1);
    g.fillEllipse(14, 15, 11, 16);
    g.fillStyle(0x6a3a18, 1);
    g.fillEllipse(14, 15, 9, 14);
    g.fillStyle(0xa06a2c, 1);
    g.fillTriangle(14, 8, 10, 14, 18, 14);
    g.fillTriangle(14, 13, 9, 19, 19, 19);
  });
  bake(scene, 'moor_token_crow_bargain', (g) => {
    halo(g, 0x8a6070);
    g.fillStyle(0x08080a, 1);
    g.fillEllipse(15, 16, 14, 8);
    g.fillCircle(20, 12, 4);
    g.fillTriangle(9, 15, 3, 11, 8, 19);
    g.fillStyle(0x202028, 1);
    g.fillEllipse(14, 15, 10, 5);
    g.fillStyle(0xffcc30, 1);
    g.fillTriangle(23, 12, 27, 10, 23, 14);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(21, 11, 0.8);
  });
  bake(scene, 'moor_token_distant_tune', (g) => {
    halo(g, 0xffcc66);
    g.fillStyle(0x2a1408, 1);
    g.fillRect(11, 6, 3, 15);
    g.fillRect(17, 8, 3, 13);
    g.fillStyle(0xd4a848, 1);
    g.fillRect(12, 7, 1.6, 14);
    g.fillRect(18, 9, 1.6, 12);
    g.fillStyle(0x0a0604, 1);
    g.fillEllipse(10, 21, 6, 4);
    g.fillEllipse(17, 22, 6, 4);
  });
  bake(scene, 'moor_token_warm_stone', (g) => {
    halo(g, 0xd0b070);
    g.fillStyle(0x15120c, 1);
    g.fillEllipse(14, 16, 17, 13);
    g.fillStyle(0x80745a, 1);
    g.fillEllipse(14, 16, 15, 11);
    g.lineStyle(1, 0xf0d080, 0.85);
    g.strokeCircle(14, 16, 5);
    g.fillStyle(0xffe0a0, 0.75);
    g.fillCircle(12, 13, 1.2);
  });
  bake(scene, 'moor_token_wind_shift', (g) => {
    halo(g, 0xa8c8d8);
    g.lineStyle(2, 0xd8f0f8, 0.9);
    g.beginPath();
    g.moveTo(5, 12);
    g.lineTo(17, 12);
    g.lineTo(22, 9);
    g.strokePath();
    g.lineStyle(1.4, 0x88b8c8, 0.8);
    g.beginPath();
    g.moveTo(7, 18);
    g.lineTo(19, 18);
    g.lineTo(23, 21);
    g.strokePath();
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(22, 9, 1.2);
  });
  bake(scene, 'moor_token_amber_glow', (g) => {
    halo(g, 0xffba40);
    g.fillStyle(0x4a2800, 1);
    g.fillCircle(14, 14, 8);
    g.fillStyle(0xffa020, 1);
    g.fillCircle(14, 14, 6.5);
    g.fillStyle(0xffe080, 1);
    g.fillCircle(12, 12, 3);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(11, 11, 1.1);
  });
  bake(scene, 'moor_token_whisky_nip', (g) => {
    halo(g, 0xd49038);
    g.fillStyle(0x201408, 1);
    g.fillRect(10, 8, 8, 14);
    g.fillStyle(0xe8e0c8, 0.9);
    g.fillRect(11, 9, 6, 12);
    g.fillStyle(0xd48a28, 1);
    g.fillRect(11.5, 14, 5, 7);
    g.fillStyle(0xffd078, 0.9);
    g.fillRect(12, 14, 1.2, 5);
    g.fillStyle(0xf8f0d8, 0.65);
    g.fillRect(11, 9, 6, 1);
  });
}
