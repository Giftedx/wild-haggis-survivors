import { describe, expect, it, vi } from 'vitest';
import { JuiceSystem } from './JuiceSystem';
import { TimeManager, type TimeAdapter } from './TimeManager';

vi.mock('phaser', () => ({
  default: {
    Math: {
      Between: (min: number, _max: number) => min,
      FloatBetween: (min: number, _max: number) => min,
    },
    Utils: {
      Array: {
        GetRandom: <T>(items: T[]) => items[0],
      },
    },
  },
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
  };
}

describe('JuiceSystem combo timer', () => {
  it('does not decay combo time while gameplay is paused', () => {
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
