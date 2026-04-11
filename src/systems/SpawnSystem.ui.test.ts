import { describe, expect, it, vi } from 'vitest';

vi.mock('./AudioSystem', () => ({
  audio: { playBossWarning: vi.fn() },
}));

// Default settings mock — individual tests can override with vi.doMock + resetModules
// when they need HC mode or a non-1.0 uiScale. Without this top-level mock the first
// test would hit the real SettingsManager singleton, which has no localStorage in
// the vitest node environment.
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

vi.mock('../entities/Enemy', () => ({
  Enemy: class {},
}));

vi.mock('phaser', () => {
  class DummyEmitter {
    removeAllListeners() {}
  }
  class DummySprite {}
  return {
    default: {
      Physics: { Arcade: { Sprite: DummySprite } },
      Events: { EventEmitter: DummyEmitter },
      GameObjects: { Group: class {} },
    },
  };
});

describe('SpawnSystem boss warning layout', () => {
  it('uses the UI viewport for boss warning overlays', async () => {
    const { SpawnSystem } = await import('./SpawnSystem');
    const rectangles: Array<{ x: number; y: number; width: number; height: number }> = [];
    const texts: Array<{ x: number; y: number; text: string }> = [];
    const scene: any = {
      scale: { width: 1280, height: 720 },
      cameras: { main: { zoom: 1.25 } },
      add: {
        rectangle: (x: number, y: number, width: number, height: number) => {
          rectangles.push({ x, y, width, height });
          return {
            setScrollFactor() { return this; },
            setDepth() { return this; },
            destroy() {},
          };
        },
        text: (x: number, y: number, text: string) => {
          texts.push({ x, y, text });
          return {
            setOrigin() { return this; },
            setScrollFactor() { return this; },
            setDepth() { return this; },
            destroy() {},
          };
        },
      },
      tweens: { add: vi.fn() },
    };

    const ss: any = Object.create(SpawnSystem.prototype);
    ss.scene = scene;
    ss.showBossWarning('Incoming menace');

    expect(rectangles[0]).toEqual({ x: 512, y: 288, width: 1024, height: 76 });
    expect(texts[0]).toEqual({ x: 512, y: 288, text: 'Incoming menace' });
  });

  it('scales boss warning font by uiScale and swaps palette for high contrast', async () => {
    vi.resetModules();
    vi.doMock('../core/SettingsManager', () => ({
      getSettingsManager: () => ({
        load: () => ({
          settingsVersion: 1,
          masterVolume: 1,
          sfxVolume: 1,
          musicVolume: 1,
          screenShake: true,
          damageNumbers: true,
          reduceParticles: false,
          uiScale: 1.3,
          highContrastUi: true,
        }),
      }),
    }));
    const { SpawnSystem: SS2 } = await import('./SpawnSystem');
    const textStyles: Array<Record<string, unknown>> = [];
    const scene: any = {
      scale: { width: 1280, height: 720 },
      cameras: { main: { zoom: 1 } },
      add: {
        rectangle: () => ({
          setScrollFactor() { return this; },
          setDepth() { return this; },
          destroy() {},
        }),
        text: (_x: number, _y: number, _text: string, style: Record<string, unknown>) => {
          textStyles.push(style);
          return {
            setOrigin() { return this; },
            setScrollFactor() { return this; },
            setDepth() { return this; },
            destroy() {},
          };
        },
      },
      tweens: { add: vi.fn() },
    };

    const ss: any = Object.create(SS2.prototype);
    ss.scene = scene;
    ss.showBossWarning('Incoming menace');

    // Font size scales with uiScale (36 * 1.3 → 46 or 47 px, rounded)
    const style = textStyles[0];
    const fontSize = String(style.fontSize);
    expect(fontSize).toMatch(/4[67]px/);
    // High-contrast color should NOT be the default #ff4444
    expect(style.color).not.toBe('#ff4444');

    vi.doUnmock('../core/SettingsManager');
  });
});
