import { describe, expect, it, vi } from 'vitest';
import { TimeManager, createPhaserTimeAdapter, type TimeAdapter } from './TimeManager';

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

describe('TimeManager token stack', () => {
  it('keeps UI pause active after HIT_FREEZE expires', () => {
    const { adapter, state } = makeAdapter();
    const tm = new TimeManager(adapter);

    // HIT_FREEZE: pause physics for 20ms, no timeScale change
    tm.requestForDuration('HIT_FREEZE', { pausePhysics: true }, 20);
    expect(state.physicsPaused).toBe(true);
    expect(state.timeScale).toBe(1);

    // UI pause: pause physics + timeScale 0, indefinite
    tm.request('UI_PAUSE', { pausePhysics: true, timeScale: 0 });
    expect(state.physicsPaused).toBe(true);
    expect(state.timeScale).toBe(0);

    // Advance past hit-freeze expiry. UI pause must still win.
    tm.update(25);
    expect(tm.has('HIT_FREEZE')).toBe(false);
    expect(state.physicsPaused).toBe(true);
    expect(state.timeScale).toBe(0);

    // Releasing UI pause should restore defaults.
    tm.release('UI_PAUSE');
    expect(state.physicsPaused).toBe(false);
    expect(state.timeScale).toBe(1);
  });

  it('keeps gameplay paused if LEVEL_UP remains after UI pause is dismissed', () => {
    const { adapter, state } = makeAdapter();
    const tm = new TimeManager(adapter);

    // Level-up modal pauses gameplay indefinitely
    tm.request('LEVEL_UP', { pausePhysics: true, timeScale: 0 });
    expect(state.physicsPaused).toBe(true);
    expect(state.timeScale).toBe(0);

    // User hits ESC during level-up: UI pause token is added.
    tm.request('UI_PAUSE', { pausePhysics: true, timeScale: 0 });
    expect(state.physicsPaused).toBe(true);
    expect(state.timeScale).toBe(0);

    // Dismissing UI pause must not unpause while LEVEL_UP remains.
    tm.release('UI_PAUSE');
    expect(state.physicsPaused).toBe(true);
    expect(state.timeScale).toBe(0);

    // Only when LEVEL_UP is released should gameplay resume.
    tm.release('LEVEL_UP');
    expect(state.physicsPaused).toBe(false);
    expect(state.timeScale).toBe(1);
  });
});

describe('createPhaserTimeAdapter null guards', () => {
  it('tolerates scene.physics.world being null without throwing', () => {
    // This is the exact shape caught during the Phase 6 visual audit:
    // scene is mid-lifecycle and physics.world is null. Previously every
    // adapter method crashed here.
    const scene = {
      time: { timeScale: 1 },
      physics: { world: null },
    } as unknown as Phaser.Scene;
    const adapter = createPhaserTimeAdapter(scene);

    expect(() => adapter.setTimeScale(0)).not.toThrow();
    expect(() => adapter.pausePhysics()).not.toThrow();
    expect(() => adapter.resumePhysics()).not.toThrow();
    expect(() => adapter.getPhysicsPaused()).not.toThrow();
    // getPhysicsPaused must report a safe default.
    expect(adapter.getPhysicsPaused()).toBe(false);
  });

  it('tolerates scene.time being absent without throwing', () => {
    const scene = {
      physics: { world: { isPaused: false, pause: () => {}, resume: () => {} } },
    } as unknown as Phaser.Scene;
    const adapter = createPhaserTimeAdapter(scene);
    expect(() => adapter.setTimeScale(0.5)).not.toThrow();
  });

  it('drives TimeManager safely even when adapter is backed by a half-dead scene', () => {
    const scene = {
      time: { timeScale: 1 },
      physics: { world: null },
    } as unknown as Phaser.Scene;
    const tm = new TimeManager(createPhaserTimeAdapter(scene));
    expect(() => tm.request('LEVEL_UP', { pausePhysics: true, timeScale: 0 })).not.toThrow();
    expect(() => tm.release('LEVEL_UP')).not.toThrow();
  });
});

