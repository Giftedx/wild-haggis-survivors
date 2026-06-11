import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JuiceSystem } from './JuiceSystem';
import { TimeManager, type TimeAdapter } from './TimeManager';
import {
  getSettingsManager,
  resetSettingsManagerSingletonForTests,
} from '../core/SettingsManager';

const phaserMathMock = vi.hoisted(() => ({
  Between: (min: number, _max: number) => min,
  FloatBetween: (min: number, _max: number) => min,
}));

vi.mock('phaser', () => ({
  default: {
    Math: phaserMathMock,
    Utils: {
      Array: {
        GetRandom: <T>(items: T[]) => items[0],
      },
    },
  },
  Math: phaserMathMock,
}));

class MockDisplayObject {
  public visible = true;
  public alpha = 1;
  public x = 0;
  public y = 0;
  public scale = 1;
  public text = '';
  public color = '#ffffff';
  public width = 0;
  public height = 0;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  setScrollFactor() { return this; }
  setDepth() { return this; }
  setAlpha(alpha: number) { this.alpha = alpha; return this; }
  setVisible(visible: boolean) { this.visible = visible; return this; }
  setOrigin() { return this; }
  setScale(scale: number) { this.scale = scale; return this; }
  setColor(color: string) { this.color = color; return this; }
  setText(text: string) { this.text = text; return this; }
  setPosition(x: number, y: number) { this.x = x; this.y = y; return this; }
  setStyle() { return this; }
  setFillStyle() { return this; }
  setRadius() { return this; }
  setRotation() { return this; }
  destroy() {}
}

class MockGraphics extends MockDisplayObject {
  clear() { return this; }
  fillStyle() { return this; }
  fillRect() { return this; }
}

function makeAdapter() {
  const state = {
    timeScale: 1,
    physicsPaused: false,
  };

  const adapter: TimeAdapter = {
    setTimeScale: vi.fn((v: number) => { state.timeScale = v; }),
    pausePhysics: vi.fn(() => { state.physicsPaused = true; }),
    resumePhysics: vi.fn(() => { state.physicsPaused = false; }),
    getPhysicsPaused: vi.fn(() => state.physicsPaused),
  };

  return { adapter, state };
}

function makeScene() {
  return {
    scale: { width: 1280, height: 720 },
    add: {
      graphics: () => new MockGraphics(),
      rectangle: (x = 0, y = 0, width = 0, height = 0) => new MockDisplayObject(x, y, width, height),
      text: (x = 0, y = 0) => new MockDisplayObject(x, y),
      circle: (x = 0, y = 0, radius = 0) => new MockDisplayObject(x, y, radius * 2, radius * 2),
    },
    tweens: {
      add: vi.fn(),
      killTweensOf: vi.fn(),
    },
    cameras: {
      main: {
        zoom: 1,
        shake: vi.fn(),
      },
    },
    textures: {
      exists: vi.fn(() => false),
    },
  };
}

describe('JuiceSystem combo timer', () => {
  function makeJuice(settingsLoad?: () => Record<string, unknown>) {
    const { adapter } = makeAdapter();
    const time = new TimeManager(adapter);
    const scene = makeScene();
    const settings: any = {
      load: settingsLoad ?? (() => ({
        damageNumbers: true,
        reduceParticles: false,
        screenShake: true,
      })),
    };

    return { juice: new JuiceSystem(scene as any, time, {} as any, settings), time, scene };
  }

  it('does not decay combo time while gameplay is paused', () => {
    const { juice, time } = makeJuice();
    juice.setResumeComboState(7, 1500);

    time.request('COUNTDOWN', { pausePhysics: true, timeScale: 0 });
    juice.update(1200);

    expect(juice.getComboCount()).toBe(7);
    expect(juice.getComboTimerRemainingMs()).toBe(1500);

    time.release('COUNTDOWN');
    juice.update(200);

    expect(juice.getComboCount()).toBe(7);
    expect(juice.getComboTimerRemainingMs()).toBe(1300);
  });

  it('resets kill combo to the baseline 1500ms window by default', () => {
    const { juice } = makeJuice();

    juice.showKillBurst(100, 100);

    expect(juice.getComboCount()).toBe(1);
    expect(juice.getComboTimerRemainingMs()).toBe(1500);
  });

  it('resets kill combo to 3000ms when Assist Mode extended combo window is enabled', () => {
    resetSettingsManagerSingletonForTests();
    getSettingsManager().update((cur) => ({
      ...cur,
      assistMode: true,
      assistModeExtendedComboWindow: true,
    }));
    const { juice } = makeJuice();

    juice.showKillBurst(100, 100);

    expect(juice.getComboCount()).toBe(1);
    expect(juice.getComboTimerRemainingMs()).toBe(3000);
  });

  describe('reduceFlashing compliance', () => {
    beforeEach(() => {
      resetSettingsManagerSingletonForTests();
    });
    afterEach(() => {
      resetSettingsManagerSingletonForTests();
    });

    function makeJuice() {
      const { adapter } = makeAdapter();
      const time = new TimeManager(adapter);
      const scene = makeScene();
      const settings: any = {
        load: () => ({
          damageNumbers: true,
          reduceParticles: false,
          screenShake: true,
        }),
      };
      const juice = new JuiceSystem(scene as any, time, {} as any, settings);
      return { juice, scene };
    }

    it('flashWhite honours default settings (alpha + duration pass through)', () => {
      getSettingsManager().update((cur) => ({
        ...cur,
        motionScale: 1,
        reduceFlashing: false,
      }));
      const { juice, scene } = makeJuice();
      scene.tweens.add.mockClear();
      juice.flashWhite(250);
      expect((juice as any).flashRect.alpha).toBeCloseTo(0.4, 5);
      const calls = scene.tweens.add.mock.calls;
      const call = calls[calls.length - 1]?.[0];
      expect(call.duration).toBe(250);
    });

    it('flashWhite under reduceFlashing caps alpha at 0.4 and floors duration at 200', () => {
      getSettingsManager().update((cur) => ({
        ...cur,
        motionScale: 1,
        reduceFlashing: true,
      }));
      const { juice, scene } = makeJuice();
      scene.tweens.add.mockClear();
      juice.flashWhite(100);
      // Base 0.4 × motionScale 1 = 0.4 → at cap, reduceFlashing no-op on alpha
      expect((juice as any).flashRect.alpha).toBeLessThanOrEqual(0.4);
      const calls = scene.tweens.add.mock.calls;
      const call = calls[calls.length - 1]?.[0];
      expect(call.duration).toBeGreaterThanOrEqual(200);
    });

    it('flashRed under reduceFlashing cannot exceed 0.4 alpha and cannot run faster than 200ms', () => {
      getSettingsManager().update((cur) => ({
        ...cur,
        motionScale: 1,
        reduceFlashing: true,
      }));
      const { juice, scene } = makeJuice();
      scene.tweens.add.mockClear();
      juice.flashRed(150);
      expect((juice as any).flashRect.alpha).toBeLessThanOrEqual(0.4);
      const calls = scene.tweens.add.mock.calls;
      const call = calls[calls.length - 1]?.[0];
      expect(call.duration).toBeGreaterThanOrEqual(200);
    });

    it('flashRed without reduceFlashing keeps shipped defaults (alpha 0.25, duration 150)', () => {
      getSettingsManager().update((cur) => ({
        ...cur,
        motionScale: 1,
        reduceFlashing: false,
      }));
      const { juice, scene } = makeJuice();
      scene.tweens.add.mockClear();
      juice.flashRed(150);
      expect((juice as any).flashRect.alpha).toBeCloseTo(0.25, 5);
      const calls = scene.tweens.add.mock.calls;
      const call = calls[calls.length - 1]?.[0];
      expect(call.duration).toBe(150);
    });
  });

  it('reflows fixed overlays against the UI viewport', () => {
    const { adapter } = makeAdapter();
    const time = new TimeManager(adapter);
    const scene = makeScene();
    scene.cameras.main.zoom = 1.25;
    const settings: any = {
      load: () => ({
        damageNumbers: true,
        reduceParticles: false,
        screenShake: true,
      }),
    };

    const juice = new JuiceSystem(scene as any, time, {} as any, settings);
    juice.update(16);

    const flashRect = (juice as any).flashRect as MockDisplayObject;
    const comboText = (juice as any).comboText as MockDisplayObject;
    expect(flashRect.x).toBeCloseTo(640, 4);
    expect(flashRect.y).toBeCloseTo(360, 4);
    expect(flashRect.width).toBeCloseTo(1024, 4);
    expect(flashRect.height).toBeCloseTo(576, 4);
    expect(comboText.x).toBeCloseTo(640, 4);
    expect(comboText.y).toBeCloseTo(187.2, 4);
  });
});
