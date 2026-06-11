/**
 * Always-on Gran's Croft warmth props plus baked texture versions for
 * the sprite export sheet. The scene drawer uses layout-relative
 * coordinates; the texture bake keeps the same tiny object language.
 */
import * as Phaser from 'phaser';
import type { CroftLayout } from '../../../scenes/croft/CroftComposition';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

function bake(scene: Phaser.Scene, key: string, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, 32, 32);
  g.destroy();
}

export function bakeCroftWarmthProps(scene: Phaser.Scene): void {
  bake(scene, 'croft_window_thistles', (g) => drawWindowThistles(g, 16, 25, 1));
  bake(scene, 'croft_knitted_haggis', (g) => drawKnittedHaggis(g, 16, 19, 1));
  bake(scene, 'croft_deed_shelf', (g) => drawDeedShelf(g, 16, 17, 1));
  bake(scene, 'croft_teacup', (g) => drawTeacup(g, 16, 18, 1));
  bake(scene, 'croft_shortbread', (g) => drawShortbread(g, 16, 18, 1));
  bake(scene, 'croft_sheepdog_mat', (g) => drawSheepdogMat(g, 16, 21, 1));
}

export function drawWarmthProps(g: Phaser.GameObjects.Graphics, layout: CroftLayout): void {
  drawWindowThistles(g, layout.windowView.x + layout.windowView.w - 18, layout.windowView.y + layout.windowView.h - 12, layout.spriteScale);
  drawKnittedHaggis(g, layout.table.x - 42 * layout.spriteScale, layout.table.y - 14 * layout.spriteScale, layout.spriteScale);
  drawDeedShelf(g, layout.bookshelf.x - 22 * layout.spriteScale, layout.bookshelf.y - 42 * layout.spriteScale, layout.spriteScale);
  drawTeacup(g, layout.table.x + 30 * layout.spriteScale, layout.table.y - 16 * layout.spriteScale, layout.spriteScale);
  drawShortbread(g, layout.table.x + 52 * layout.spriteScale, layout.table.y - 10 * layout.spriteScale, layout.spriteScale);
  drawSheepdogMat(g, layout.gran.x + 42 * layout.spriteScale, layout.rug.y + layout.rug.h * 0.4, layout.spriteScale);
}

function drawWindowThistles(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
  g.fillStyle(0x2a1808, 1);
  g.fillRect(cx - 7 * s, cy + 4 * s, 14 * s, 2 * s);
  for (const dx of [-5, 0, 5]) {
    g.fillStyle(0x294a18, 1);
    g.fillRect(cx + dx * s, cy - 7 * s, 1.3 * s, 12 * s);
    g.fillStyle(0x9a48d8, 1);
    g.fillEllipse(cx + dx * s, cy - 8 * s, 5 * s, 4 * s);
    g.fillStyle(0xe8a8ff, 0.9);
    g.fillEllipse(cx + dx * s, cy - 9 * s, 2.4 * s, 1.3 * s);
  }
}

function drawKnittedHaggis(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
  g.fillStyle(0x1a0804, 1);
  g.fillEllipse(cx, cy, 20 * s, 13 * s);
  g.fillStyle(0x7a3a24, 1);
  g.fillEllipse(cx, cy, 18 * s, 11 * s);
  g.fillStyle(0xa85c3a, 1);
  g.fillEllipse(cx - 2 * s, cy - 2 * s, 11 * s, 6 * s);
  g.fillStyle(0xd8a078, 0.9);
  g.fillRect(cx - 7 * s, cy, 14 * s, 1.1 * s);
  g.fillRect(cx - 4 * s, cy - 4 * s, 1.1 * s, 8 * s);
  g.fillRect(cx + 2 * s, cy - 4 * s, 1.1 * s, 8 * s);
  g.fillStyle(0x1a0804, 1);
  g.fillTriangle(cx - 6 * s, cy - 5 * s, cx - 3 * s, cy - 10 * s, cx - 1 * s, cy - 5 * s);
  g.fillTriangle(cx + 2 * s, cy - 5 * s, cx + 5 * s, cy - 10 * s, cx + 7 * s, cy - 5 * s);
}

function drawDeedShelf(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
  g.fillStyle(0x1a0c04, 1);
  g.fillRect(cx - 11 * s, cy + 7 * s, 22 * s, 3 * s);
  g.fillStyle(0x6a3a18, 1);
  g.fillRect(cx - 10 * s, cy + 7 * s, 20 * s, 2 * s);
  const colours = [0x7a1f1f, 0x224f28, 0x2b477a, 0x9a7428];
  for (let i = 0; i < colours.length; i++) {
    g.fillStyle(0x0a0604, 1);
    g.fillRect(cx - 9 * s + i * 5 * s, cy - 7 * s, 4 * s, 14 * s);
    g.fillStyle(colours[i], 1);
    g.fillRect(cx - 8.5 * s + i * 5 * s, cy - 6.5 * s, 3 * s, 13 * s);
    g.fillStyle(0xf0d070, 0.8);
    g.fillRect(cx - 8 * s + i * 5 * s, cy - 2 * s, 2 * s, 1 * s);
  }
}

function drawTeacup(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
  g.fillStyle(0x1a1008, 1);
  g.fillEllipse(cx, cy + 7 * s, 16 * s, 4 * s);
  g.fillStyle(0xf4e8c8, 1);
  g.fillEllipse(cx, cy + 6 * s, 14 * s, 3 * s);
  g.fillStyle(0x1a1008, 1);
  g.fillRect(cx - 6 * s, cy - 3 * s, 12 * s, 10 * s);
  g.fillStyle(0xf4e8c8, 1);
  g.fillRect(cx - 5 * s, cy - 2 * s, 10 * s, 8 * s);
  g.fillStyle(0xd06040, 1);
  g.fillRect(cx - 5 * s, cy + 1 * s, 10 * s, 1.4 * s);
  g.lineStyle(Math.max(1, s), 0xf4e8c8, 1);
  g.strokeCircle(cx + 7 * s, cy + 1 * s, 4 * s);
  g.fillStyle(0xd0b080, 0.45);
  g.fillCircle(cx - 4 * s, cy - 8 * s, 1.4 * s);
  g.fillCircle(cx + 1 * s, cy - 10 * s, 1.2 * s);
}

function drawShortbread(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
  g.fillStyle(0x4a2a10, 1);
  g.fillRoundedRect(cx - 8 * s, cy - 5 * s, 16 * s, 11 * s, 2 * s);
  g.fillStyle(0xd8a85c, 1);
  g.fillRoundedRect(cx - 7 * s, cy - 4 * s, 14 * s, 9 * s, 2 * s);
  g.fillStyle(0xf0cc7a, 0.9);
  g.fillRect(cx - 5 * s, cy - 2 * s, 10 * s, 1 * s);
  g.fillStyle(0x8a5a28, 0.7);
  for (const x of [-4, 0, 4]) g.fillCircle(cx + x * s, cy + 2 * s, 0.8 * s);
}

function drawSheepdogMat(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
  g.fillStyle(0x1a1008, 0.5);
  g.fillEllipse(cx, cy + 7 * s, 24 * s, 7 * s);
  g.fillStyle(0x6a4a28, 1);
  g.fillEllipse(cx, cy + 4 * s, 22 * s, 8 * s);
  g.fillStyle(0x202018, 1);
  g.fillEllipse(cx - 3 * s, cy, 16 * s, 9 * s);
  g.fillStyle(0xf0eee0, 1);
  g.fillEllipse(cx - 2 * s, cy - 1 * s, 12 * s, 6 * s);
  g.fillStyle(0x202018, 1);
  g.fillCircle(cx + 6 * s, cy - 2 * s, 4 * s);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx + 7 * s, cy - 3 * s, 0.8 * s);
}
