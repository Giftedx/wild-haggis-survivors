/**
 * Elite and boss-readable telegraph icons. These build a shared warning
 * language: colour helps, but shape carries the meaning first.
 */
import * as Phaser from 'phaser';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

export const ELITE_TELEGRAPH_KEYS = [
  'fx_telegraph_elite_swirl',
  'fx_telegraph_curse_seal',
  'fx_telegraph_aoe_gold',
  'fx_telegraph_dash_red',
  'fx_telegraph_projectile_blue',
  'fx_telegraph_fey_hex',
  'fx_telegraph_loch_ripple',
  'fx_telegraph_urban_flicker',
] as const;

function bake(scene: Phaser.Scene, key: string, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, 48, 48);
  g.destroy();
}

function arrowHead(g: Phaser.GameObjects.Graphics, x: number, y: number, angle: number, color: number): void {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const p = (px: number, py: number): [number, number] => [x + px * c - py * s, y + px * s + py * c];
  const a = p(7, 0);
  const b = p(-4, -4);
  const c2 = p(-4, 4);
  g.fillStyle(0x0a0604, 1);
  g.fillTriangle(a[0], a[1], b[0], b[1], c2[0], c2[1]);
  g.fillStyle(color, 1);
  const aa = p(5.5, 0);
  const bb = p(-2.5, -2.8);
  const cc = p(-2.5, 2.8);
  g.fillTriangle(aa[0], aa[1], bb[0], bb[1], cc[0], cc[1]);
}

export function bakeEliteTelegraphs(scene: Phaser.Scene): void {
  bake(scene, 'fx_telegraph_elite_swirl', (g) => {
    g.fillStyle(0xffc840, 0.12);
    g.fillCircle(24, 24, 23);
    g.lineStyle(2.2, 0xffd66a, 0.85);
    g.beginPath();
    g.arc(24, 24, 15, 0.2, Math.PI * 1.55, false);
    g.strokePath();
    arrowHead(g, 18, 10, -2.6, 0xffe080);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(24, 24, 2);
  });

  bake(scene, 'fx_telegraph_curse_seal', (g) => {
    g.fillStyle(0x9a58d0, 0.16);
    g.fillCircle(24, 24, 23);
    g.lineStyle(2, 0xd8a8ff, 0.85);
    g.strokeCircle(24, 24, 17);
    g.fillStyle(0x2a1038, 1);
    g.fillTriangle(24, 10, 36, 31, 12, 31);
    g.fillStyle(0xb090d0, 1);
    g.fillTriangle(24, 13, 33, 29, 15, 29);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(24, 24, 2);
  });

  bake(scene, 'fx_telegraph_aoe_gold', (g) => {
    g.fillStyle(0xffc840, 0.1);
    g.fillCircle(24, 24, 23);
    g.lineStyle(3, 0xffc840, 0.85);
    g.strokeCircle(24, 24, 18);
    g.lineStyle(1.3, 0xfff0b0, 0.7);
    g.strokeCircle(24, 24, 9);
    g.fillStyle(0xffe080, 0.9);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fillRect(24 + Math.cos(a) * 17 - 1, 24 + Math.sin(a) * 17 - 1, 2, 2);
    }
  });

  bake(scene, 'fx_telegraph_dash_red', (g) => {
    g.fillStyle(0xc42828, 0.14);
    g.fillEllipse(24, 26, 41, 17);
    g.fillStyle(0x5a0c0c, 1);
    g.fillTriangle(10, 24, 30, 12, 29, 21);
    g.fillTriangle(10, 25, 31, 35, 29, 27);
    g.fillStyle(0xff7040, 1);
    g.fillTriangle(13, 24, 28, 15, 27, 22);
    g.fillTriangle(13, 25, 28, 32, 27, 26);
    g.fillStyle(0xffc0a0, 0.85);
    g.fillRect(30, 23, 8, 2);
  });

  bake(scene, 'fx_telegraph_projectile_blue', (g) => {
    g.fillStyle(0x2a4a6a, 0.16);
    g.fillCircle(24, 24, 22);
    g.fillStyle(0x0e2030, 1);
    g.fillTriangle(10, 24, 30, 13, 30, 35);
    g.fillStyle(0x4a90c0, 1);
    g.fillTriangle(13, 24, 28, 16, 28, 32);
    g.lineStyle(1.5, 0xd8f0ff, 0.8);
    g.strokeCircle(34, 24, 8);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(36, 22, 1.4);
  });

  bake(scene, 'fx_telegraph_fey_hex', (g) => {
    g.fillStyle(0x8060a0, 0.16);
    g.fillCircle(24, 24, 23);
    g.lineStyle(2, 0xd8a8ff, 0.85);
    const pts: Array<[number, number]> = [[24, 7], [39, 15], [39, 33], [24, 41], [9, 33], [9, 15]];
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % pts.length];
      g.lineBetween(x1, y1, x2, y2);
    }
    g.fillStyle(0xfff0b0, 0.9);
    g.fillCircle(24, 24, 2);
    g.fillCircle(17, 18, 1.2);
    g.fillCircle(31, 30, 1.2);
  });

  bake(scene, 'fx_telegraph_loch_ripple', (g) => {
    g.fillStyle(0x2a4a6a, 0.14);
    g.fillEllipse(24, 25, 42, 19);
    g.lineStyle(2, 0x8ed8e8, 0.8);
    g.strokeEllipse(24, 25, 38, 15);
    g.lineStyle(1.2, 0xd8f8ff, 0.75);
    g.strokeEllipse(24, 24, 22, 8);
    g.fillStyle(0xb8f0ff, 0.9);
    g.fillTriangle(24, 8, 20, 22, 28, 22);
  });

  bake(scene, 'fx_telegraph_urban_flicker', (g) => {
    g.fillStyle(0xff9030, 0.13);
    g.fillCircle(24, 24, 23);
    g.fillStyle(0x0a0604, 1);
    g.fillRect(15, 8, 18, 30);
    g.fillStyle(0xff9030, 1);
    g.fillRect(18, 11, 12, 24);
    g.fillStyle(0xffd080, 0.9);
    g.fillRect(20, 13, 8, 3);
    g.fillRect(20, 20, 8, 3);
    g.fillRect(20, 29, 8, 2);
    g.fillStyle(0xc42828, 0.85);
    g.fillRect(12, 36, 24, 3);
  });
}
