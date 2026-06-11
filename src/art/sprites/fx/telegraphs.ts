/**
 * Enemy telegraph VFX sprites. These are texture building blocks for
 * readable warnings: rings, howls, stamp marks, music bursts, and boss
 * stomp flashes.
 */
import * as Phaser from 'phaser';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

function bake(scene: Phaser.Scene, key: string, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, 48, 48);
  g.destroy();
}

export function bakeTelegraphFx(scene: Phaser.Scene): void {
  bake(scene, 'fx_telegraph_ripple', (g) => {
    g.lineStyle(2, 0xffd66a, 0.75);
    g.strokeCircle(24, 24, 18);
    g.lineStyle(1.2, 0xfff0b0, 0.65);
    g.strokeCircle(24, 24, 10);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(24, 24, 2);
  });
  bake(scene, 'fx_telegraph_howl', (g) => {
    g.fillStyle(0x88b0d0, 0.18);
    g.fillCircle(24, 24, 21);
    g.lineStyle(2, 0xd8f0ff, 0.8);
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.arc(24, 24, 8 + i * 6, -0.7, 0.7, false);
      g.strokePath();
    }
    g.fillStyle(0xffffff, 0.9);
    g.fillTriangle(13, 24, 23, 18, 23, 30);
  });
  bake(scene, 'fx_telegraph_stamp', (g) => {
    g.fillStyle(0xcc4422, 0.18);
    g.fillEllipse(24, 28, 34, 18);
    g.lineStyle(2, 0xff7040, 0.85);
    g.strokeEllipse(24, 28, 32, 16);
    g.fillStyle(0xffb070, 0.75);
    g.fillRect(14, 26, 20, 4);
    g.fillRect(22, 17, 4, 22);
  });
  bake(scene, 'fx_telegraph_music_gold', (g) => {
    g.fillStyle(0xffcc44, 0.16);
    g.fillCircle(24, 24, 22);
    g.lineStyle(1.4, 0xffe080, 0.8);
    g.strokeCircle(24, 24, 17);
    drawNote(g, 17, 29, 0xffe080);
    drawNote(g, 27, 19, 0xffffff);
    drawNote(g, 33, 31, 0xffcc44);
  });
  bake(scene, 'fx_telegraph_music_violet', (g) => {
    g.fillStyle(0x9a58d0, 0.18);
    g.fillCircle(24, 24, 22);
    g.lineStyle(1.4, 0xd8a8ff, 0.8);
    g.strokeCircle(24, 24, 17);
    drawNote(g, 16, 29, 0xd8a8ff);
    drawNote(g, 27, 18, 0xffffff);
    drawNote(g, 34, 30, 0x9a58d0);
  });
  bake(scene, 'fx_telegraph_stomp', (g) => {
    g.fillStyle(0xff4a30, 0.12);
    g.fillCircle(24, 24, 23);
    g.lineStyle(3, 0xff7040, 0.85);
    g.strokeCircle(24, 24, 19);
    g.fillStyle(0xffd080, 0.85);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fillRect(24 + Math.cos(a) * 12 - 1, 24 + Math.sin(a) * 12 - 1, 2, 2);
    }
  });
}

function drawNote(g: Phaser.GameObjects.Graphics, x: number, y: number, colour: number): void {
  g.fillStyle(0x0a0604, 1);
  g.fillEllipse(x, y, 6, 4);
  g.fillRect(x + 2, y - 12, 2, 12);
  g.fillTriangle(x + 4, y - 12, x + 10, y - 8, x + 4, y - 6);
  g.fillStyle(colour, 1);
  g.fillEllipse(x, y, 4, 2.6);
  g.fillRect(x + 2.4, y - 11, 1, 11);
}
