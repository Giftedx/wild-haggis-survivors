/**
 * Extra atmosphere single-frame sprites for biomes and weather systems.
 * These are deliberately small: animation comes from drift, alpha, and
 * placement rather than heavy frame strips.
 */
import * as Phaser from 'phaser';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

export const ATMOSPHERE_LAYER_KEYS = [
  'fx_weather_haar_puff',
  'fx_weather_smirr_cluster',
  'fx_weather_bog_bubble',
  'fx_weather_loch_ripple_wide',
  'fx_weather_peat_smoke',
  'fx_weather_wind_leaf',
  'fx_weather_bracken_turn_leaf',
  'fx_weather_frost_star',
  'fx_weather_midge_glimmer',
  'fx_weather_moon_mist',
] as const;

function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

function sparkle(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.fillRect(x - 0.4, y - 1.6, 0.8, 3.2);
  g.fillRect(x - 1.6, y - 0.4, 3.2, 0.8);
}

export function bakeAtmosphereLayers(scene: Phaser.Scene): void {
  bake(scene, 'fx_weather_haar_puff', 40, 24, (g) => {
    g.fillStyle(0xdce8ee, 0.15);
    g.fillEllipse(20, 14, 36, 15);
    g.fillStyle(0xb8c8d8, 0.2);
    g.fillEllipse(14, 13, 20, 9);
    g.fillEllipse(27, 15, 22, 9);
    g.fillStyle(0xffffff, 0.36);
    g.fillEllipse(15, 11, 10, 4);
    g.fillEllipse(28, 13, 8, 3);
  });

  bake(scene, 'fx_weather_smirr_cluster', 20, 20, (g) => {
    const streaks: Array<[number, number, number]> = [
      [4, 2, 0.45],
      [9, 1, 0.65],
      [15, 4, 0.42],
      [6, 9, 0.55],
      [13, 10, 0.5],
      [3, 15, 0.38],
      [17, 15, 0.45],
    ];
    for (const [x, y, a] of streaks) {
      g.fillStyle(0xc8d8e2, a);
      g.fillRect(x, y, 1, 3);
      g.fillRect(x + 0.5, y + 2.4, 1, 1);
    }
    g.fillStyle(0xc8d8e2, 0.08);
    g.fillRect(1, 1, 18, 18);
  });

  bake(scene, 'fx_weather_bog_bubble', 22, 18, (g) => {
    g.fillStyle(0x1a2a12, 0.42);
    g.fillEllipse(11, 13, 18, 7);
    g.fillStyle(0x5a6a28, 0.55);
    g.fillCircle(9, 10, 4);
    g.fillCircle(15, 12, 3);
    g.fillStyle(0xb8d090, 0.8);
    g.fillCircle(8, 9, 1.1);
    g.fillCircle(14, 11, 0.8);
    g.lineStyle(1, 0x223010, 0.65);
    g.strokeEllipse(11, 13, 17, 6);
  });

  bake(scene, 'fx_weather_loch_ripple_wide', 48, 18, (g) => {
    g.lineStyle(1.5, 0xb8e8f2, 0.72);
    g.strokeEllipse(24, 10, 42, 8);
    g.lineStyle(1, 0x6a90b0, 0.62);
    g.strokeEllipse(24, 10, 29, 5);
    g.lineStyle(1, 0xe8fbff, 0.82);
    g.strokeEllipse(27, 9, 12, 2.4);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(13, 9, 0.6);
    g.fillCircle(35, 10, 0.5);
  });

  bake(scene, 'fx_weather_peat_smoke', 28, 38, (g) => {
    g.fillStyle(0x5a3e20, 0.13);
    g.fillEllipse(14, 29, 18, 8);
    g.fillStyle(0xb0a090, 0.18);
    g.fillCircle(12, 26, 5);
    g.fillCircle(17, 20, 6);
    g.fillCircle(12, 14, 5);
    g.fillStyle(0xe0d6c4, 0.24);
    g.fillCircle(16, 18, 2.8);
    g.fillCircle(11, 12, 2.2);
    g.fillStyle(0xffc840, 0.25);
    g.fillCircle(14, 31, 2);
  });

  bake(scene, 'fx_weather_wind_leaf', 18, 14, (g) => {
    g.fillStyle(0x17200c, 1);
    g.fillTriangle(4, 8, 14, 3, 12, 11);
    g.fillStyle(0x6f8a34, 1);
    g.fillTriangle(5, 8, 13, 4, 11, 10);
    g.fillStyle(0xb0b850, 0.8);
    g.fillRect(7, 7, 6, 0.8);
    g.fillStyle(0x2a1808, 1);
    g.fillRect(3, 9, 3, 0.7);
  });

  bake(scene, 'fx_weather_bracken_turn_leaf', 20, 16, (g) => {
    g.fillStyle(0x2a1808, 1);
    g.fillTriangle(5, 9, 15, 3, 14, 13);
    g.fillStyle(0xc06a28, 1);
    g.fillTriangle(6, 9, 14, 4, 13, 12);
    g.fillStyle(0xffb040, 0.86);
    g.fillTriangle(8, 8, 13, 5, 12, 10);
    g.fillStyle(0x7a3a18, 0.9);
    g.fillRect(5, 10, 9, 0.8);
  });

  bake(scene, 'fx_weather_frost_star', 20, 20, (g) => {
    g.fillStyle(0x8fd8ff, 0.18);
    g.fillCircle(10, 10, 9);
    g.fillStyle(0xe8f8ff, 0.9);
    g.fillRect(9.5, 3, 1, 14);
    g.fillRect(3, 9.5, 14, 1);
    g.fillRect(6, 6, 8, 1);
    g.fillRect(6, 13, 8, 1);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(10, 10, 1.3);
  });

  bake(scene, 'fx_weather_midge_glimmer', 18, 18, (g) => {
    g.fillStyle(0xffe080, 0.12);
    g.fillCircle(9, 9, 8);
    for (const [x, y] of [[5, 6], [11, 5], [13, 11], [7, 13], [9, 9]]) {
      g.fillStyle(0x1a1008, 0.8);
      g.fillCircle(x, y, 0.8);
      sparkle(g, x + 1.5, y - 1.2, 0xffe080, 0.6);
    }
  });

  bake(scene, 'fx_weather_moon_mist', 42, 22, (g) => {
    g.fillStyle(0x6a90b0, 0.12);
    g.fillEllipse(22, 14, 38, 13);
    g.fillStyle(0xdce8ff, 0.2);
    g.fillEllipse(17, 13, 23, 8);
    g.fillEllipse(30, 15, 18, 7);
    g.fillStyle(0xffffff, 0.72);
    g.fillCircle(10, 7, 3.6);
    g.fillStyle(0x6a90b0, 0.55);
    g.fillCircle(11.5, 6, 3.2);
  });
}
