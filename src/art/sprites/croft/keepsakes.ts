/**
 * Additional Gran's Croft keepsakes: lived-in details that make the hub
 * feel cared for between runs. Texture bakes exist for export; the scene
 * drawer paints directly at layout scale.
 */
import * as Phaser from 'phaser';
import type { CroftLayout } from '../../../scenes/croft/CroftComposition';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

export const CROFT_KEEPSAKE_KEYS = [
  'croft_rain_window',
  'croft_brownie_bowl',
  'croft_field_guide',
  'croft_gran_radio',
  'croft_tartan_blanket',
  'croft_family_photo',
  'croft_boots_by_door',
  'croft_seed_tray',
  'croft_knitting_basket',
  'croft_hearth_rowan_charm',
] as const;

function bake(scene: Phaser.Scene, key: string, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, 32, 32);
  g.destroy();
}

export function bakeCroftKeepsakes(scene: Phaser.Scene): void {
  bake(scene, 'croft_rain_window', (g) => drawRainWindow(g, 16, 16, 1));
  bake(scene, 'croft_brownie_bowl', (g) => drawBrownieBowl(g, 16, 18, 1));
  bake(scene, 'croft_field_guide', (g) => drawFieldGuide(g, 16, 18, 1));
  bake(scene, 'croft_gran_radio', (g) => drawGranRadio(g, 16, 18, 1));
  bake(scene, 'croft_tartan_blanket', (g) => drawTartanBlanket(g, 16, 18, 1));
  bake(scene, 'croft_family_photo', (g) => drawFamilyPhoto(g, 16, 17, 1));
  bake(scene, 'croft_boots_by_door', (g) => drawBootsByDoor(g, 16, 20, 1));
  bake(scene, 'croft_seed_tray', (g) => drawSeedTray(g, 16, 20, 1));
  bake(scene, 'croft_knitting_basket', (g) => drawKnittingBasket(g, 16, 19, 1));
  bake(scene, 'croft_hearth_rowan_charm', (g) => drawRowanCharm(g, 16, 17, 1));
}

export function drawCroftKeepsakes(
  g: Phaser.GameObjects.Graphics,
  layout: CroftLayout,
  opts: { includeWallKeepsakes?: boolean } = {},
): void {
  const s = layout.spriteScale;
  drawRainWindow(g, layout.windowView.x + 14 * s, layout.windowView.y + 16 * s, s);
  drawBrownieBowl(g, layout.hearth.x - 38 * s, layout.hearth.y + 30 * s, s);
  drawFieldGuide(g, layout.bookshelf.x + 22 * s, layout.bookshelf.y + 18 * s, s);
  drawGranRadio(g, layout.table.x - 8 * s, layout.table.y - 24 * s, s);
  drawTartanBlanket(g, layout.rug.x + layout.rug.w * 0.18, layout.rug.y + layout.rug.h * 0.2, s);
  if (opts.includeWallKeepsakes !== false) {
    drawFamilyPhoto(g, layout.photoWall.x + 12 * s, layout.photoWall.y + 14 * s, s);
  }
  drawBootsByDoor(g, layout.postie.x - 30 * s, layout.postie.y + 8 * s, s);
  drawSeedTray(g, layout.windowView.x + 16 * s, layout.windowView.y + layout.windowView.h - 8 * s, s);
  drawKnittingBasket(g, layout.gran.x - 42 * s, layout.gran.y + 24 * s, s);
  drawRowanCharm(g, layout.hearth.x + 32 * s, layout.hearth.y - 28 * s, s);
}

function drawRainWindow(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
  g.fillStyle(0x1a1008, 1);
  g.fillRect(cx - 10 * s, cy - 10 * s, 20 * s, 20 * s);
  g.fillStyle(0x2a4a6a, 1);
  g.fillRect(cx - 8 * s, cy - 8 * s, 16 * s, 16 * s);
  g.fillStyle(0x6a90b0, 0.45);
  g.fillRect(cx - 7 * s, cy - 7 * s, 14 * s, 14 * s);
  g.fillStyle(0xb8d8e8, 0.75);
  for (const dx of [-5, 0, 5]) {
    g.fillRect(cx + dx * s, cy - 7 * s, 1 * s, 6 * s);
    g.fillRect(cx + (dx + 1) * s, cy - 1 * s, 1 * s, 4 * s);
  }
  g.fillStyle(0xc8a040, 1);
  g.fillRect(cx - 10 * s, cy, 20 * s, 1.2 * s);
  g.fillRect(cx, cy - 10 * s, 1.2 * s, 20 * s);
}

function drawBrownieBowl(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
  g.fillStyle(0x1a1008, 0.5);
  g.fillEllipse(cx, cy + 7 * s, 18 * s, 4 * s);
  g.fillStyle(0x4a2e18, 1);
  g.fillEllipse(cx, cy + 2 * s, 17 * s, 8 * s);
  g.fillStyle(0xd8a85c, 1);
  g.fillEllipse(cx, cy, 15 * s, 6 * s);
  g.fillStyle(0xf4ead0, 1);
  g.fillEllipse(cx, cy - 1 * s, 10 * s, 3 * s);
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(cx - 3 * s, cy - 2 * s, 1 * s);
}

function drawFieldGuide(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
  g.fillStyle(0x1a1008, 1);
  g.fillRect(cx - 9 * s, cy - 9 * s, 18 * s, 17 * s);
  g.fillStyle(0x295030, 1);
  g.fillRect(cx - 8 * s, cy - 8 * s, 16 * s, 15 * s);
  g.fillStyle(0xc8a040, 1);
  g.fillRect(cx - 6 * s, cy - 5 * s, 12 * s, 1.2 * s);
  g.fillRect(cx - 6 * s, cy + 3 * s, 9 * s, 1.2 * s);
  g.fillStyle(0xa85c3a, 1);
  g.fillEllipse(cx, cy, 8 * s, 5 * s);
  g.fillStyle(0x1a0804, 1);
  g.fillCircle(cx + 2 * s, cy - 1 * s, 0.8 * s);
}

function drawGranRadio(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
  g.fillStyle(0x1a1008, 1);
  g.fillRoundedRect(cx - 10 * s, cy - 7 * s, 20 * s, 14 * s, 3 * s);
  g.fillStyle(0x7a4a24, 1);
  g.fillRoundedRect(cx - 9 * s, cy - 6 * s, 18 * s, 12 * s, 3 * s);
  g.fillStyle(0xc8a040, 1);
  g.fillCircle(cx - 5 * s, cy, 4 * s);
  g.fillStyle(0x3a2818, 1);
  g.fillRect(cx + 2 * s, cy - 4 * s, 5 * s, 1 * s);
  g.fillRect(cx + 2 * s, cy - 1 * s, 6 * s, 1 * s);
  g.fillRect(cx + 2 * s, cy + 2 * s, 4 * s, 1 * s);
  g.lineStyle(Math.max(1, s), 0xc8a040, 1);
  g.lineBetween(cx - 4 * s, cy - 7 * s, cx + 4 * s, cy - 13 * s);
}

function drawTartanBlanket(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
  g.fillStyle(0x1a0804, 1);
  g.fillRect(cx - 12 * s, cy - 7 * s, 24 * s, 14 * s);
  g.fillStyle(0x8060a0, 1);
  g.fillRect(cx - 11 * s, cy - 6 * s, 22 * s, 12 * s);
  g.fillStyle(0x2a4a6a, 0.9);
  g.fillRect(cx - 11 * s, cy - 1 * s, 22 * s, 3 * s);
  g.fillStyle(0xc8a040, 0.9);
  g.fillRect(cx - 7 * s, cy - 6 * s, 2 * s, 12 * s);
  g.fillRect(cx + 5 * s, cy - 6 * s, 2 * s, 12 * s);
  g.fillStyle(0xc42828, 0.75);
  g.fillRect(cx - 11 * s, cy + 4 * s, 22 * s, 1 * s);
}

function drawFamilyPhoto(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
  g.fillStyle(0x1a1008, 1);
  g.fillRect(cx - 9 * s, cy - 10 * s, 18 * s, 20 * s);
  g.fillStyle(0xf4ead0, 1);
  g.fillRect(cx - 7 * s, cy - 8 * s, 14 * s, 16 * s);
  g.fillStyle(0x6a90b0, 1);
  g.fillRect(cx - 6 * s, cy - 7 * s, 12 * s, 8 * s);
  g.fillStyle(0x5a3e20, 1);
  g.fillEllipse(cx - 3 * s, cy + 4 * s, 5 * s, 5 * s);
  g.fillEllipse(cx + 4 * s, cy + 4 * s, 4 * s, 4 * s);
  g.fillStyle(0xffc840, 0.8);
  g.fillCircle(cx, cy - 2 * s, 1 * s);
}

function drawBootsByDoor(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
  g.fillStyle(0x1a1008, 0.45);
  g.fillEllipse(cx, cy + 6 * s, 22 * s, 4 * s);
  for (const dx of [-5, 5]) {
    g.fillStyle(0x101008, 1);
    g.fillRect(cx + dx * s - 3 * s, cy - 7 * s, 6 * s, 13 * s);
    g.fillRect(cx + dx * s - 4 * s, cy + 2 * s, 9 * s, 4 * s);
    g.fillStyle(0x4a3a18, 1);
    g.fillRect(cx + dx * s - 2 * s, cy - 6 * s, 4 * s, 11 * s);
    g.fillStyle(0x7a6028, 0.8);
    g.fillRect(cx + dx * s - 1 * s, cy - 5 * s, 1.5 * s, 8 * s);
  }
}

function drawSeedTray(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
  g.fillStyle(0x1a1008, 1);
  g.fillRect(cx - 11 * s, cy - 4 * s, 22 * s, 8 * s);
  g.fillStyle(0x6a3a18, 1);
  g.fillRect(cx - 10 * s, cy - 3 * s, 20 * s, 6 * s);
  for (const dx of [-6, -2, 2, 6]) {
    g.fillStyle(0x3a2818, 1);
    g.fillCircle(cx + dx * s, cy, 2 * s);
    g.fillStyle(0x5a8038, 1);
    g.fillTriangle(cx + dx * s, cy - 1 * s, cx + dx * s - 2 * s, cy - 6 * s, cx + dx * s, cy - 3 * s);
    g.fillTriangle(cx + dx * s, cy - 1 * s, cx + dx * s + 2 * s, cy - 6 * s, cx + dx * s, cy - 3 * s);
  }
}

function drawKnittingBasket(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
  g.fillStyle(0x1a1008, 0.5);
  g.fillEllipse(cx, cy + 7 * s, 20 * s, 4 * s);
  g.fillStyle(0x4a2a14, 1);
  g.fillEllipse(cx, cy + 1 * s, 18 * s, 13 * s);
  g.fillStyle(0x9a7440, 1);
  g.fillEllipse(cx, cy, 16 * s, 10 * s);
  g.fillStyle(0x8060a0, 1);
  g.fillCircle(cx - 4 * s, cy - 3 * s, 4 * s);
  g.fillStyle(0xc42828, 1);
  g.fillCircle(cx + 4 * s, cy - 2 * s, 3.5 * s);
  g.lineStyle(Math.max(1, s), 0xc8a040, 1);
  g.lineBetween(cx + 2 * s, cy - 8 * s, cx + 12 * s, cy - 14 * s);
}

function drawRowanCharm(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
  g.fillStyle(0x2a1808, 1);
  g.fillRect(cx - 1 * s, cy - 10 * s, 2 * s, 20 * s);
  g.fillStyle(0xc8a040, 1);
  g.fillRect(cx - 6 * s, cy, 12 * s, 1.5 * s);
  g.fillStyle(0x436a28, 1);
  g.fillEllipse(cx - 4 * s, cy - 4 * s, 7 * s, 4 * s);
  g.fillEllipse(cx + 5 * s, cy - 4 * s, 7 * s, 4 * s);
  g.fillStyle(0xa42018, 1);
  for (const dx of [-3, 0, 3]) g.fillCircle(cx + dx * s, cy + 5 * s, 1.4 * s);
}
