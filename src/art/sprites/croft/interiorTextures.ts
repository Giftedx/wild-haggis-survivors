/**
 * Small baked swatches for Gran's Croft architecture.
 *
 * Kept separate from `interior.ts` so BootScene can export the material
 * sprites without pulling the full room renderer into the main bundle.
 */
import * as Phaser from 'phaser';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

const INK = 0x0a0604;
const PEAT_DARK = 0x3a2818;
const PEAT_MID = 0x5a3e20;
const PEAT_SHADOW = 0x2a1808;
const PLASTER_DARK = 0x4a3020;
const PLASTER_MID = 0x6a4828;
const PLASTER_LIGHT = 0x9a7440;
const WOOD_DARK = 0x2a1608;
const WOOD_MID = 0x5a3218;
const WOOD_LIGHT = 0x8a5a2e;
const STONE_DARK = 0x2a2a30;
const STONE_MID = 0x4a4a50;
const LOCH = 0x2a4a6a;
const MIST = 0x6a90b0;
const HEATHER = 0x8060a0;
const HEATHER_LIGHT = 0xb090d0;
const WHISKY = 0xc8a040;
const PAPER = 0xf4e8c8;

function bake(scene: Phaser.Scene, key: string, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, 32, 32);
  g.destroy();
}

export function bakeCroftInteriorTextures(scene: Phaser.Scene): void {
  bake(scene, 'croft_wallpaper_panel', drawWallpaper);
  bake(scene, 'croft_floor_flagstone', drawFloor);
  bake(scene, 'croft_oak_beam', drawBeam);
  bake(scene, 'croft_hearth_surround', drawHearth);
  bake(scene, 'croft_window_curtain', drawWindow);
  bake(scene, 'croft_bookshelf_full', drawBookshelf);
  bake(scene, 'croft_door_panel', drawDoor);
  bake(scene, 'croft_action_board', drawActionBoard);
}

function drawWallpaper(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(PLASTER_DARK, 1);
  g.fillRect(0, 0, 32, 32);
  g.fillStyle(PLASTER_MID, 1);
  g.fillRect(2, 2, 28, 28);
  g.fillStyle(PLASTER_LIGHT, 0.28);
  for (let y = 6; y < 32; y += 8) g.fillRect(3, y, 26, 1);
}

function drawFloor(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(PEAT_DARK, 1);
  g.fillRect(0, 0, 32, 32);
  g.fillStyle(PEAT_MID, 1);
  g.fillRect(1, 1, 30, 30);
  g.lineStyle(1, PEAT_SHADOW, 0.75);
  for (let y = 7; y < 32; y += 8) g.lineBetween(1, y, 31, y + 1);
  for (let x = 8; x < 32; x += 10) g.lineBetween(x, 1, x - 3, 31);
}

function drawBeam(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(INK, 1);
  g.fillRect(2, 10, 28, 12);
  g.fillStyle(WOOD_DARK, 1);
  g.fillRect(3, 11, 26, 10);
  g.fillStyle(WOOD_MID, 1);
  g.fillRect(4, 12, 24, 8);
  g.fillStyle(WOOD_LIGHT, 0.55);
  g.fillRect(5, 12, 22, 1);
}

function drawHearth(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(STONE_DARK, 1);
  g.fillRect(2, 2, 28, 28);
  g.fillStyle(STONE_MID, 1);
  for (let y = 4; y < 28; y += 8) {
    for (let x = 4; x < 28; x += 9) g.fillRect(x, y, 6, 5);
  }
  g.fillStyle(INK, 1);
  g.fillRoundedRect(10, 11, 12, 15, 3);
  g.fillStyle(0xffc840, 0.5);
  g.fillEllipse(16, 21, 8, 7);
}

function drawWindow(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(HEATHER, 1);
  g.fillRect(3, 3, 8, 26);
  g.fillRect(21, 3, 8, 26);
  g.fillStyle(HEATHER_LIGHT, 0.32);
  g.fillRect(6, 6, 1, 20);
  g.fillRect(24, 6, 1, 20);
  g.fillStyle(LOCH, 1);
  g.fillRect(11, 7, 10, 18);
  g.fillStyle(MIST, 0.7);
  g.fillRect(12, 8, 8, 8);
}

function drawBookshelf(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(INK, 1);
  g.fillRect(5, 2, 22, 28);
  g.fillStyle(WOOD_DARK, 1);
  g.fillRect(7, 4, 18, 24);
  for (const y of [10, 17, 24]) {
    g.fillStyle(WOOD_LIGHT, 0.8);
    g.fillRect(7, y, 18, 1);
  }
  const cols = [0x7a1f1f, 0x295030, 0x2a4a6a, 0x8060a0, 0xc8a040];
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 4; i++) {
      g.fillStyle(cols[(i + row) % cols.length], 1);
      g.fillRect(9 + i * 4, 6 + row * 7, 3, 5 + (i % 2));
    }
  }
}

function drawDoor(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(INK, 1);
  g.fillRect(7, 2, 18, 28);
  g.fillStyle(WOOD_MID, 1);
  g.fillRect(9, 4, 14, 24);
  g.fillStyle(WOOD_DARK, 1);
  g.fillRect(15, 6, 2, 20);
  g.fillStyle(WHISKY, 1);
  g.fillCircle(21, 17, 2);
}

function drawActionBoard(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(INK, 1);
  g.fillRoundedRect(2, 5, 28, 22, 3);
  g.fillStyle(WOOD_MID, 1);
  g.fillRoundedRect(4, 7, 24, 18, 2);
  g.fillStyle(WOOD_LIGHT, 0.35);
  g.fillRect(6, 9, 20, 1);
  g.fillStyle(PAPER, 1);
  g.fillRect(8, 12, 16, 4);
  g.fillRect(8, 19, 16, 4);
}
