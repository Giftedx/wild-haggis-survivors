/**
 * Story prop decorations: tiny readable folklore and place-memory objects
 * for FloraScatter and future encounter set dressing.
 */
import * as Phaser from 'phaser';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

export const STORY_PROP_KEYS = [
  'deco_waymarker_post',
  'deco_pictish_stone',
  'deco_ruined_croft',
  'deco_clootie_ribbons',
  'deco_fairy_ring',
  'deco_selkie_skin',
  'deco_pech_tools',
  'deco_catsith_saucer',
  'deco_brahan_eye_stone',
  'deco_burns_scrap',
  'deco_milestone',
  'deco_bridge_plank',
  'deco_peat_spade',
  'deco_fishing_net',
  'deco_salmon_leap',
  'deco_standing_stone_glyph',
  'deco_washer_cloth',
  'deco_rowan_charm',
  'deco_crannog_stake',
  'deco_machair_shell',
] as const;

function bake(scene: Phaser.Scene, key: string, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, 32, 32);
  g.destroy();
}

function shadow(g: Phaser.GameObjects.Graphics, x = 16, y = 26, w = 20, h = 4): void {
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(x, y, w, h);
}

function glyph(g: Phaser.GameObjects.Graphics, x: number, y: number, color = 0xc8a040): void {
  g.fillStyle(color, 0.9);
  g.fillCircle(x, y, 1.1);
  g.fillRect(x - 0.5, y - 5, 1, 4);
  g.fillRect(x - 3, y - 1, 6, 1);
}

export function bakeStoryProps(scene: Phaser.Scene): void {
  bake(scene, 'deco_waymarker_post', (g) => {
    shadow(g);
    g.fillStyle(0x1a0c04, 1);
    g.fillRect(15, 8, 3, 18);
    g.fillStyle(0x7a4a24, 1);
    g.fillRect(16, 8, 1.5, 18);
    g.fillStyle(0x1a0c04, 1);
    g.fillRect(8, 10, 17, 6);
    g.fillStyle(0xc8a040, 1);
    g.fillRect(9, 11, 15, 4);
    g.fillStyle(0x4a2e18, 1);
    g.fillTriangle(24, 10, 29, 13, 24, 16);
    g.fillStyle(0x8060a0, 1);
    g.fillRect(10, 12, 4, 1);
  });

  bake(scene, 'deco_pictish_stone', (g) => {
    shadow(g, 16, 27, 18, 4);
    g.fillStyle(0x1a1a20, 1);
    g.fillRoundedRect(9, 5, 14, 22, 3);
    g.fillStyle(0x5a5a60, 1);
    g.fillRoundedRect(10, 6, 12, 20, 3);
    g.fillStyle(0x8a8a90, 0.8);
    g.fillRect(12, 8, 4, 1);
    glyph(g, 16, 15, 0xffd66a);
    g.fillStyle(0x2a2a30, 0.8);
    g.fillRect(12, 22, 8, 1);
  });

  bake(scene, 'deco_ruined_croft', (g) => {
    shadow(g, 16, 26, 25, 5);
    g.fillStyle(0x1a1008, 1);
    g.fillRect(6, 17, 20, 8);
    g.fillStyle(0x4a4a50, 1);
    g.fillRect(7, 18, 18, 7);
    g.fillStyle(0x2a2a30, 1);
    g.fillRect(10, 20, 4, 5);
    g.fillRect(18, 20, 3, 3);
    g.fillStyle(0x6a4a28, 1);
    g.fillTriangle(5, 17, 16, 9, 27, 17);
    g.fillStyle(0x3a2818, 1);
    g.fillTriangle(8, 16, 16, 11, 24, 16);
    g.fillStyle(0x8a6a48, 0.8);
    g.fillRect(7, 18, 7, 1);
  });

  bake(scene, 'deco_clootie_ribbons', (g) => {
    shadow(g, 16, 27, 17, 4);
    g.fillStyle(0x2a1808, 1);
    g.fillRect(15, 7, 3, 19);
    g.fillStyle(0x5a3e20, 1);
    g.fillRect(16, 7, 1.4, 19);
    const ribbons: Array<[number, number, number]> = [[10, 11, 0xc42828], [20, 13, 0x8060a0], [12, 17, 0xffc840], [21, 20, 0x4a7090]];
    for (const [x, y, c] of ribbons) {
      g.fillStyle(c, 1);
      g.fillRect(x, y, 7, 2);
      g.fillRect(x + 4, y + 2, 2, 6);
    }
  });

  bake(scene, 'deco_fairy_ring', (g) => {
    shadow(g, 16, 25, 23, 5);
    g.lineStyle(1.2, 0xb090d0, 0.7);
    g.strokeEllipse(16, 20, 22, 10);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const x = 16 + Math.cos(a) * 10;
      const y = 20 + Math.sin(a) * 5;
      g.fillStyle(0x4a1c12, 1);
      g.fillEllipse(x, y, 4, 3);
      g.fillStyle(0xe8d0a8, 1);
      g.fillEllipse(x, y - 0.5, 3, 2);
    }
    g.fillStyle(0xd8a8ff, 0.9);
    g.fillCircle(16, 18, 1);
  });

  bake(scene, 'deco_selkie_skin', (g) => {
    shadow(g, 16, 25, 21, 4);
    g.fillStyle(0x1a1a20, 1);
    g.fillEllipse(16, 19, 20, 10);
    g.fillStyle(0x6a6a70, 1);
    g.fillEllipse(15, 18, 17, 8);
    g.fillStyle(0xa8a8b0, 0.9);
    g.fillEllipse(11, 16, 6, 3);
    g.fillStyle(0x0a0806, 1);
    g.fillCircle(21, 17, 1);
    g.fillStyle(0xb8e8f2, 0.65);
    g.fillRect(8, 22, 16, 1);
  });

  bake(scene, 'deco_pech_tools', (g) => {
    shadow(g, 16, 25, 21, 4);
    g.fillStyle(0x3a2818, 1);
    g.fillRect(7, 20, 18, 4);
    g.fillStyle(0x8a6a48, 1);
    g.fillRect(8, 20, 16, 2);
    g.fillStyle(0x2a2a30, 1);
    g.fillRect(10, 13, 3, 8);
    g.fillStyle(0x8a8a90, 1);
    g.fillRect(9, 11, 5, 3);
    g.fillStyle(0xc8a040, 1);
    g.fillRect(18, 11, 2, 10);
    g.fillTriangle(16, 11, 22, 11, 19, 7);
  });

  bake(scene, 'deco_catsith_saucer', (g) => {
    shadow(g, 16, 25, 18, 4);
    g.fillStyle(0x1a1008, 1);
    g.fillEllipse(16, 20, 18, 8);
    g.fillStyle(0xf4ead0, 1);
    g.fillEllipse(16, 19, 16, 6);
    g.fillStyle(0xd8e8f0, 1);
    g.fillEllipse(16, 18.5, 10, 3);
    g.fillStyle(0x0a0604, 1);
    g.fillTriangle(19, 12, 22, 7, 24, 13);
    g.fillTriangle(12, 12, 10, 7, 8, 13);
    g.fillCircle(16, 14, 5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(18, 13, 0.8);
  });

  bake(scene, 'deco_brahan_eye_stone', (g) => {
    shadow(g, 16, 27, 16, 4);
    g.fillStyle(0x1a1a20, 1);
    g.fillEllipse(16, 17, 15, 22);
    g.fillStyle(0x4a4a50, 1);
    g.fillEllipse(16, 16, 13, 20);
    g.fillStyle(0xc8a040, 1);
    g.fillEllipse(16, 15, 9, 5);
    g.fillStyle(0x111018, 1);
    g.fillCircle(16, 15, 2);
    g.fillStyle(0xffe080, 0.9);
    g.fillCircle(15, 14, 0.7);
  });

  bake(scene, 'deco_burns_scrap', (g) => {
    shadow(g, 16, 25, 18, 4);
    g.fillStyle(0x4a2e18, 1);
    g.fillRect(9, 10, 15, 15);
    g.fillStyle(0xf4ead0, 1);
    g.fillRect(10, 9, 13, 15);
    g.fillStyle(0xc8a040, 0.7);
    g.fillRect(12, 12, 8, 1);
    g.fillRect(12, 15, 7, 1);
    g.fillRect(12, 18, 9, 1);
    g.fillStyle(0xc42828, 0.9);
    g.fillCircle(21, 22, 1.4);
  });

  bake(scene, 'deco_milestone', (g) => {
    shadow(g, 16, 27, 17, 4);
    g.fillStyle(0x1a1a20, 1);
    g.fillRoundedRect(10, 7, 12, 20, 3);
    g.fillStyle(0x6a6a70, 1);
    g.fillRoundedRect(11, 8, 10, 18, 3);
    g.fillStyle(0xe8e0d0, 0.9);
    g.fillRect(13, 12, 6, 1);
    g.fillRect(13, 15, 4, 1);
    g.fillStyle(0xffc840, 0.75);
    g.fillCircle(16, 20, 1.2);
  });

  bake(scene, 'deco_bridge_plank', (g) => {
    shadow(g, 16, 25, 24, 4);
    g.fillStyle(0x1a1008, 1);
    g.fillRect(5, 17, 22, 6);
    g.fillStyle(0x7a5630, 1);
    g.fillRect(6, 18, 20, 4);
    g.fillStyle(0xb08a52, 0.8);
    g.fillRect(8, 18, 8, 1);
    g.fillStyle(0x3a2818, 1);
    g.fillRect(15, 17, 1, 6);
    g.fillRect(22, 17, 1, 6);
  });

  bake(scene, 'deco_peat_spade', (g) => {
    shadow(g, 16, 26, 18, 4);
    g.fillStyle(0x2a1808, 1);
    g.fillRect(15, 7, 2, 16);
    g.fillStyle(0x8a5a30, 1);
    g.fillRect(15.5, 8, 1, 15);
    g.fillStyle(0x1a1a20, 1);
    g.fillTriangle(10, 20, 22, 20, 16, 28);
    g.fillStyle(0x8a8a90, 1);
    g.fillTriangle(12, 20, 20, 20, 16, 26);
    g.fillStyle(0x5a3e20, 0.9);
    g.fillCircle(8, 25, 1.2);
  });

  bake(scene, 'deco_fishing_net', (g) => {
    shadow(g, 16, 25, 21, 4);
    g.lineStyle(1, 0xd8c098, 0.9);
    for (let i = 0; i < 5; i++) {
      g.lineBetween(8 + i * 4, 12, 4 + i * 4, 24);
      g.lineBetween(8 + i * 4, 24, 4 + i * 4, 12);
    }
    g.fillStyle(0x2a4a6a, 0.8);
    g.fillCircle(23, 22, 2);
    g.fillStyle(0xffc840, 0.85);
    g.fillCircle(10, 14, 1);
  });

  bake(scene, 'deco_salmon_leap', (g) => {
    shadow(g, 16, 26, 18, 4);
    g.fillStyle(0x2a4a6a, 0.4);
    g.fillEllipse(16, 24, 20, 4);
    g.fillStyle(0x3a6070, 1);
    g.fillEllipse(16, 15, 16, 7);
    g.fillStyle(0xb8d8d8, 1);
    g.fillEllipse(15, 14, 12, 5);
    g.fillStyle(0xc42828, 0.8);
    g.fillRect(12, 16, 7, 1);
    g.fillStyle(0x2a4a6a, 1);
    g.fillTriangle(24, 15, 29, 10, 28, 19);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(10, 12, 1);
  });

  bake(scene, 'deco_standing_stone_glyph', (g) => {
    shadow(g, 16, 27, 16, 4);
    g.fillStyle(0x1a1a20, 1);
    g.fillRoundedRect(11, 4, 11, 23, 4);
    g.fillStyle(0x5a5a60, 1);
    g.fillRoundedRect(12, 5, 9, 21, 4);
    glyph(g, 16, 13, 0xb090d0);
    g.fillStyle(0xc8a040, 0.8);
    g.fillCircle(16, 22, 1.1);
  });

  bake(scene, 'deco_washer_cloth', (g) => {
    shadow(g, 16, 25, 22, 4);
    g.fillStyle(0x2a4a6a, 0.25);
    g.fillEllipse(16, 23, 23, 5);
    g.fillStyle(0x8a1818, 1);
    g.fillRect(9, 13, 15, 10);
    g.fillStyle(0xd8d0c8, 1);
    g.fillRect(10, 12, 13, 10);
    g.fillStyle(0x901818, 0.75);
    g.fillCircle(14, 16, 2);
    g.fillRect(17, 19, 5, 1);
  });

  bake(scene, 'deco_rowan_charm', (g) => {
    shadow(g, 16, 26, 16, 4);
    g.fillStyle(0x2a1808, 1);
    g.fillRect(15, 7, 2, 17);
    g.fillStyle(0x436a28, 1);
    g.fillEllipse(12, 12, 7, 4);
    g.fillEllipse(21, 14, 7, 4);
    g.fillStyle(0xa42018, 1);
    for (const [x, y] of [[16, 12], [18, 13], [15, 15], [20, 16]]) g.fillCircle(x, y, 1.3);
    g.fillStyle(0xffc840, 0.9);
    g.fillRect(13, 20, 7, 1);
    g.fillRect(16, 17, 1, 7);
  });

  bake(scene, 'deco_crannog_stake', (g) => {
    shadow(g, 16, 26, 19, 4);
    for (const x of [10, 15, 20]) {
      g.fillStyle(0x1a1008, 1);
      g.fillRect(x, 9, 3, 17);
      g.fillStyle(0x7a5630, 1);
      g.fillRect(x + 0.7, 10, 1.4, 16);
      g.fillStyle(0x3a2818, 1);
      g.fillTriangle(x, 9, x + 1.5, 5, x + 3, 9);
    }
    g.fillStyle(0x2a4a6a, 0.4);
    g.fillRect(7, 24, 18, 2);
  });

  bake(scene, 'deco_machair_shell', (g) => {
    shadow(g, 16, 25, 16, 4);
    g.fillStyle(0x4a2e18, 1);
    g.fillEllipse(16, 19, 16, 10);
    g.fillStyle(0xf4ead0, 1);
    g.fillEllipse(16, 18, 14, 9);
    g.fillStyle(0xe0b8a8, 0.85);
    for (const x of [11, 14, 17, 20]) g.fillRect(x, 14, 1, 8);
    g.fillStyle(0xb090d0, 0.9);
    g.fillCircle(23, 20, 1.2);
    g.fillStyle(0x4f7430, 0.9);
    g.fillRect(7, 22, 8, 1);
  });
}
