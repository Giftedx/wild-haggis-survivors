/**
 * Projectile trail FX — three tiny baked textures drawn behind/along
 * weapon flight paths to give attacks weight. Each trail anchors to
 * a specific weapon culturally (thistle pips, caber wood-chips, haggis
 * steam-and-oats) rather than reading as a generic motion smear.
 * Soft falloff via 2-3 alpha layers per sprite; one bright core pip
 * plus 1-2 outer specks for granularity at gameplay scale.
 */

import * as Phaser from 'phaser';

export function bakeFxTrailThistle(scene: Phaser.Scene): void {
  const w = 14, h = 14;
  const g = scene.add.graphics();
  const cx = 7, cy = 7;

  g.fillStyle(0x553388, 0.18);
  g.fillCircle(cx, cy, 6);
  g.fillStyle(0x6644aa, 0.28);
  g.fillCircle(cx, cy, 4.2);

  const pips: Array<[number, number, number, number]> = [
    [cx + 4.2, cy - 1.6, 1.1, 0.85],
    [cx - 3.8, cy + 1.0, 1.0, 0.75],
    [cx - 1.2, cy - 4.0, 0.9, 0.7],
    [cx + 2.6, cy + 3.8, 0.85, 0.65],
  ];
  for (const [px, py, r, a] of pips) {
    g.fillStyle(0x331155, a);
    g.fillCircle(px, py, r + 0.4);
    g.fillStyle(0x8855bb, a);
    g.fillCircle(px, py, r);
    g.fillStyle(0xbb88dd, Math.min(1, a + 0.15));
    g.fillCircle(px - 0.3, py - 0.3, r * 0.45);
  }

  g.fillStyle(0xaa66cc, 0.65);
  g.fillCircle(cx, cy, 2.2);
  g.fillStyle(0xddaaff, 0.95);
  g.fillCircle(cx, cy, 1.3);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - 0.2, cy - 0.2, 0.55);

  g.fillStyle(0xeeccff, 0.7);
  g.fillRect(cx + 3.8, cy - 0.5, 0.9, 0.5);
  g.fillRect(cx - 4.2, cy + 0.6, 0.7, 0.5);

  g.generateTexture('fx_trail_thistle', w, h);
  g.destroy();
}

export function bakeFxTrailCaber(scene: Phaser.Scene): void {
  const w = 18, h = 10;
  const g = scene.add.graphics();
  const cy = 5;

  g.fillStyle(0x6b4a2a, 0.12);
  g.fillEllipse(11, cy, 14, 6);
  g.fillStyle(0x8a6a3e, 0.22);
  g.fillEllipse(12, cy, 10, 4.2);
  g.fillStyle(0xb08a52, 0.42);
  g.fillEllipse(13, cy, 6.5, 3);

  g.fillStyle(0xd9b478, 0.85);
  g.fillEllipse(14.5, cy, 3.2, 1.8);
  g.fillStyle(0xf2d7a0, 0.95);
  g.fillEllipse(15.4, cy - 0.2, 1.4, 0.9);

  const chips: Array<[number, number, number, number, number]> = [
    [4.0, cy - 1.8, 1.6, 0.9, 0.85],
    [6.5, cy + 2.2, 1.3, 0.7, 0.7],
    [2.2, cy + 0.6, 1.0, 0.55, 0.6],
  ];
  for (const [px, py, ww, hh, a] of chips) {
    g.fillStyle(0x4a2f18, a);
    g.fillRect(px - ww / 2, py - hh / 2, ww + 0.4, hh + 0.4);
    g.fillStyle(0x8a5a30, a);
    g.fillRect(px - ww / 2 + 0.2, py - hh / 2 + 0.1, ww * 0.85, hh * 0.7);
  }

  g.fillStyle(0xc9a878, 0.35);
  g.fillCircle(3.2, cy - 2.4, 0.9);
  g.fillCircle(5.8, cy + 2.6, 0.7);
  g.fillStyle(0xe8d0a0, 0.55);
  g.fillCircle(3.4, cy - 2.4, 0.4);

  g.generateTexture('fx_trail_caber', w, h);
  g.destroy();
}

export function bakeFxTrailHaggis(scene: Phaser.Scene): void {
  const w = 14, h = 14;
  const g = scene.add.graphics();
  const cx = 7, cy = 7;

  g.fillStyle(0xf4e4c4, 0.14);
  g.fillEllipse(cx - 0.6, cy - 0.4, 13, 11);
  g.fillStyle(0xe8d4a8, 0.22);
  g.fillEllipse(cx - 1.2, cy - 1.0, 9.5, 8);
  g.fillStyle(0xf2e0bc, 0.38);
  g.fillEllipse(cx - 1.8, cy - 1.6, 5.5, 4.8);

  g.fillStyle(0xd9c090, 0.32);
  g.fillCircle(cx + 2.4, cy + 1.8, 2.2);
  g.fillStyle(0xeed8a8, 0.55);
  g.fillCircle(cx + 2.0, cy + 1.4, 1.4);

  const oats: Array<[number, number, number, number]> = [
    [cx + 3.6, cy - 0.4, 0.9, 0.95],
    [cx + 1.6, cy + 3.2, 0.75, 0.85],
    [cx - 0.4, cy + 2.6, 0.65, 0.7],
    [cx + 3.2, cy + 2.4, 0.55, 0.6],
  ];
  for (const [px, py, r, a] of oats) {
    g.fillStyle(0x6a4a20, a);
    g.fillCircle(px, py, r + 0.3);
    g.fillStyle(0xb88a48, a);
    g.fillCircle(px, py, r);
    g.fillStyle(0xe8c98a, Math.min(1, a + 0.15));
    g.fillCircle(px - 0.2, py - 0.2, r * 0.5);
  }

  g.fillStyle(0xfff4dc, 0.7);
  g.fillCircle(cx - 1.6, cy - 1.4, 1.1);
  g.fillStyle(0xffffff, 0.88);
  g.fillCircle(cx - 1.8, cy - 1.6, 0.55);

  g.fillStyle(0xfff0d0, 0.5);
  g.fillCircle(cx - 4.0, cy - 0.6, 0.7);
  g.fillCircle(cx - 3.2, cy + 1.6, 0.55);

  g.generateTexture('fx_trail_haggis', w, h);
  g.destroy();
}
