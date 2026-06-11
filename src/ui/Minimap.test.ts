import { describe, expect, it, vi } from 'vitest';
import { Minimap } from './Minimap';
import {
  MINIMAP_CLOOTIE_OUTER,
  MINIMAP_CLOOTIE_INNER,
} from './minimapPalette';

vi.mock('phaser', () => {
  const __m = {
    Math: {
      Clamp: (value: number, min: number, max: number) => Math.max(min, Math.min(max, value)),
    },
  };
  return { default: __m, ...__m };
});

// Minimap now reads uiScale + highContrastUi in the constructor — mock the
// settings manager so the test runs under vitest (no localStorage).
vi.mock('../core/SettingsManager', () => ({
  getSettingsManager: () => ({
    load: () => ({
      settingsVersion: 1,
      masterVolume: 1,
      sfxVolume: 1,
      musicVolume: 1,
      screenShake: true,
      damageNumbers: true,
      reduceParticles: false,
      uiScale: 1,
      highContrastUi: false,
    }),
  }),
}));

class MockRect {
  public x = 0;
  public y = 0;
  setStrokeStyle() { return this; }
  setScrollFactor() { return this; }
  setDepth() { return this; }
  setPosition(x: number, y: number) { this.x = x; this.y = y; return this; }
  destroy() {}
}

class MockGraphics {
  public fillStyleCalls: number[] = [];
  clear() { this.fillStyleCalls.length = 0; return this; }
  setScrollFactor() { return this; }
  setDepth() { return this; }
  fillStyle(colour: number, _alpha?: number) { this.fillStyleCalls.push(colour); return this; }
  fillCircle() { return this; }
  fillTriangle() { return this; }
  lineStyle() { return this; }
  strokeRect() { return this; }
  fillRect() { return this; }
  destroy() {}
}

describe('Minimap', () => {
  it('keeps minimap inside view when camera zoom is above 1', () => {
    const bg = new MockRect();
    const gfx = new MockGraphics();
    const scene: any = {
      scale: { width: 1366, height: 768 },
      cameras: { main: { zoom: 1.3, width: 1366, height: 768, scrollX: 0, scrollY: 0 } },
      add: {
        rectangle: (x: number, y: number) => {
          bg.x = x;
          bg.y = y;
          return bg;
        },
        graphics: () => gfx,
      },
    };
    const enemyGroup: any = { getChildren: () => [], children: { entries: [] } };
    const minimap = new Minimap(scene);
    minimap.update(100, 100, enemyGroup);

    // Post-Phase-6-Tier-B size bump: 110 → 150 (baseline, before uiScale).
    const size = 150;
    const margin = 12;
    const uiWidth = scene.cameras.main.width / scene.cameras.main.zoom;
    const uiHeight = scene.cameras.main.height / scene.cameras.main.zoom;
    const uiLeft = (scene.cameras.main.width - uiWidth) / 2;
    const uiTop = (scene.cameras.main.height - uiHeight) / 2;
    const bottomPad = 12;
    const expectedX = uiLeft + uiWidth - margin - size / 2;
    const expectedY = uiTop + uiHeight - bottomPad - size / 2;

    expect(bg.x).toBeCloseTo(expectedX, 4);
    expect(bg.y).toBeCloseTo(expectedY, 4);
  });

  it('anchors to camera viewport even when display size exists', () => {
    const bg = new MockRect();
    const gfx = new MockGraphics();
    const scene: any = {
      scale: { width: 1366, height: 768, displaySize: { width: 1000, height: 700 } },
      cameras: { main: { zoom: 1.3, width: 1024, height: 576, scrollX: 0, scrollY: 0 } },
      add: {
        rectangle: (x: number, y: number) => {
          bg.x = x;
          bg.y = y;
          return bg;
        },
        graphics: () => gfx,
      },
    };
    const enemyGroup: any = { getChildren: () => [], children: { entries: [] } };
    const minimap = new Minimap(scene);
    minimap.update(100, 100, enemyGroup);

    // Post-Phase-6-Tier-B size bump: 110 → 150 (baseline, before uiScale).
    const size = 150;
    const margin = 12;
    const uiWidth = scene.cameras.main.width / scene.cameras.main.zoom;
    const uiHeight = scene.cameras.main.height / scene.cameras.main.zoom;
    const uiLeft = (scene.cameras.main.width - uiWidth) / 2;
    const uiTop = (scene.cameras.main.height - uiHeight) / 2;
    const bottomPad = 12;
    const expectedX = uiLeft + uiWidth - margin - size / 2;
    const expectedY = uiTop + uiHeight - bottomPad - size / 2;

    expect(bg.x).toBeCloseTo(expectedX, 4);
    expect(bg.y).toBeCloseTo(expectedY, 4);
  });

  it('renders the clootie pin only when a marker is passed', () => {
    const bg = new MockRect();
    const gfx = new MockGraphics();
    const scene: any = {
      scale: { width: 1366, height: 768 },
      cameras: { main: { zoom: 1, width: 1366, height: 768, scrollX: 0, scrollY: 0 } },
      add: {
        rectangle: (x: number, y: number) => { bg.x = x; bg.y = y; return bg; },
        graphics: () => gfx,
      },
    };
    const enemyGroup: any = { getChildren: () => [], children: { entries: [] } };
    const minimap = new Minimap(scene);

    minimap.update(100, 100, enemyGroup, [], 0, null, [], null);
    expect(gfx.fillStyleCalls).not.toContain(MINIMAP_CLOOTIE_OUTER);
    expect(gfx.fillStyleCalls).not.toContain(MINIMAP_CLOOTIE_INNER);

    minimap.update(100, 100, enemyGroup, [], 0, null, [], { x: 500, y: 500 });
    expect(gfx.fillStyleCalls).toContain(MINIMAP_CLOOTIE_OUTER);
    expect(gfx.fillStyleCalls).toContain(MINIMAP_CLOOTIE_INNER);
  });
});
