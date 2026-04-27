/**
 * Shape-coded HUD/status badges. These are small enough for combat UI and
 * distinct by silhouette for high-contrast and colourblind-friendly reads.
 */
import * as Phaser from 'phaser';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

export const HUD_STATUS_BADGE_KEYS = [
  'hud_status_burn',
  'hud_status_frost',
  'hud_status_poison',
  'hud_status_elite',
  'hud_status_cursed',
  'hud_status_boss_phase',
  'hud_status_relic_full',
  'hud_status_route',
  'hud_status_warning',
  'hud_status_comfort',
] as const;

function bake(scene: Phaser.Scene, key: string, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, 24, 24);
  g.destroy();
}

function badgeBase(g: Phaser.GameObjects.Graphics, color: number): void {
  g.fillStyle(0x0a0604, 1);
  g.fillCircle(12, 12, 11);
  g.fillStyle(color, 1);
  g.fillCircle(12, 12, 9.5);
  g.fillStyle(0xffffff, 0.18);
  g.fillCircle(9, 8, 4);
}

export function bakeHudStatusBadges(scene: Phaser.Scene): void {
  bake(scene, 'hud_status_burn', (g) => {
    badgeBase(g, 0xc42828);
    g.fillStyle(0xffc840, 1);
    g.fillTriangle(12, 5, 7, 15, 12, 20);
    g.fillStyle(0xff9030, 1);
    g.fillTriangle(13, 8, 10, 15, 15, 18);
  });

  bake(scene, 'hud_status_frost', (g) => {
    badgeBase(g, 0x2a4a6a);
    g.fillStyle(0xe8f8ff, 1);
    g.fillRect(11.5, 5, 1, 14);
    g.fillRect(5, 11.5, 14, 1);
    g.fillRect(7, 7, 10, 1);
    g.fillRect(7, 16, 10, 1);
  });

  bake(scene, 'hud_status_poison', (g) => {
    badgeBase(g, 0x3a6638);
    g.fillStyle(0xd8f0a0, 1);
    g.fillCircle(9, 14, 3);
    g.fillCircle(15, 14, 3);
    g.fillCircle(12, 10, 3.2);
    g.fillStyle(0x102010, 1);
    g.fillCircle(11, 10, 0.9);
    g.fillCircle(13, 10, 0.9);
    g.fillRect(10, 15, 4, 1);
  });

  bake(scene, 'hud_status_elite', (g) => {
    badgeBase(g, 0xc8a040);
    g.fillStyle(0xfff0b0, 1);
    g.fillTriangle(12, 4, 15, 12, 9, 12);
    g.fillTriangle(20, 10, 13, 13, 15, 8);
    g.fillTriangle(17, 21, 12, 15, 16, 13);
    g.fillTriangle(7, 21, 8, 13, 12, 15);
    g.fillTriangle(4, 10, 9, 8, 11, 13);
    g.fillCircle(12, 12, 3);
  });

  bake(scene, 'hud_status_cursed', (g) => {
    badgeBase(g, 0x8060a0);
    g.fillStyle(0x281038, 1);
    g.fillTriangle(12, 5, 19, 17, 5, 17);
    g.fillStyle(0xd8a8ff, 1);
    g.fillCircle(12, 13, 2);
    g.fillRect(11, 8, 2, 4);
  });

  bake(scene, 'hud_status_boss_phase', (g) => {
    badgeBase(g, 0x901818);
    g.fillStyle(0xffe080, 1);
    g.fillRect(11, 4, 2, 16);
    g.fillRect(5, 11, 14, 2);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(12, 12, 2);
  });

  bake(scene, 'hud_status_relic_full', (g) => {
    badgeBase(g, 0x5a3e20);
    g.fillStyle(0xc8a040, 1);
    g.fillEllipse(12, 13, 12, 9);
    g.fillStyle(0xfff0b0, 1);
    g.fillRect(8, 9, 8, 1.5);
    g.fillCircle(12, 13, 2);
  });

  bake(scene, 'hud_status_route', (g) => {
    badgeBase(g, 0x2a4a6a);
    g.fillStyle(0xf4ead0, 1);
    g.fillRect(6, 7, 12, 10);
    g.fillStyle(0xc8a040, 1);
    g.fillCircle(9, 10, 1.2);
    g.fillCircle(15, 14, 1.2);
    g.lineStyle(1, 0x5a3e20, 1);
    g.lineBetween(9, 10, 15, 14);
  });

  bake(scene, 'hud_status_warning', (g) => {
    badgeBase(g, 0xff9030);
    g.fillStyle(0x1a1008, 1);
    g.fillTriangle(12, 4, 21, 20, 3, 20);
    g.fillStyle(0xffe080, 1);
    g.fillTriangle(12, 7, 18, 18, 6, 18);
    g.fillStyle(0x1a1008, 1);
    g.fillRect(11, 11, 2, 4);
    g.fillRect(11, 17, 2, 1.5);
  });

  bake(scene, 'hud_status_comfort', (g) => {
    badgeBase(g, 0x6a90b0);
    g.fillStyle(0xf4ead0, 1);
    g.fillEllipse(12, 14, 12, 9);
    g.fillStyle(0x8060a0, 1);
    g.fillRect(6, 12, 12, 3);
    g.fillStyle(0xffc840, 1);
    g.fillCircle(12, 9, 2.2);
  });
}
