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

  it('uses the minimum timeScale when multiple tokens specify one', () => {
    const { adapter, state } = makeAdapter();
    const tm = new TimeManager(adapter);

    tm.request('SLOW_A', { timeScale: 0.5 });
    expect(state.timeScale).toBe(0.5);

    tm.request('SLOW_B', { timeScale: 0.2 });
    expect(state.timeScale).toBe(0.2);

    tm.release('SLOW_B');
    expect(state.timeScale).toBe(0.5);

    tm.release('SLOW_A');
    expect(state.timeScale).toBe(1);
  });

  it('reset() drops every token and restores timeScale + physics defaults', () => {
    const { adapter, state } = makeAdapter();
    const tm = new TimeManager(adapter);

    tm.request('LEVEL_UP', { pausePhysics: true, timeScale: 0 });
    tm.requestForDuration('HIT_FREEZE', { pausePhysics: true }, 1000);
    expect(tm.getTokenCount()).toBe(2);
    expect(state.physicsPaused).toBe(true);
    expect(state.timeScale).toBe(0);

    tm.reset();
    expect(tm.getTokenCount()).toBe(0);
    expect(state.physicsPaused).toBe(false);
    expect(state.timeScale).toBe(1);
  });

  it('release is safe for unknown keys and double-release (idempotent)', () => {
    const { adapter, state } = makeAdapter();
    const tm = new TimeManager(adapter);

    expect(() => tm.release('nope')).not.toThrow();
    expect(tm.getTokenCount()).toBe(0);

    tm.request('TMP', { timeScale: 0.4 });
    tm.release('TMP');
    expect(() => tm.release('TMP')).not.toThrow();
    expect(tm.getTokenCount()).toBe(0);
    expect(state.timeScale).toBe(1);
  });

  it('update ignores non-positive deltaMs (duration tokens do not expire)', () => {
    const { adapter } = makeAdapter();
    const tm = new TimeManager(adapter);
    tm.requestForDuration('X', {}, 10);
    expect(tm.has('X')).toBe(true);
    tm.update(-5);
    tm.update(0);
    expect(tm.has('X')).toBe(true);
    tm.update(10);
    expect(tm.has('X')).toBe(false);
  });

  it('update is a no-op when there are no tokens', () => {
    const { adapter, state } = makeAdapter();
    const tm = new TimeManager(adapter);
    tm.update(9999);
    expect(tm.getTokenCount()).toBe(0);
    expect(state.timeScale).toBe(1);
    expect(state.physicsPaused).toBe(false);
  });

  it('getActiveTokenKeys returns keys in sorted order', () => {
    const { adapter } = makeAdapter();
    const tm = new TimeManager(adapter);
    tm.request('zebra', { timeScale: 0.5 });
    tm.request('apple', { timeScale: 0.3 });
    expect(tm.getActiveTokenKeys()).toEqual(['apple', 'zebra']);
  });

  it('destroy() clears tokens like reset()', () => {
    const { adapter, state } = makeAdapter();
    const tm = new TimeManager(adapter);
    tm.request('LEVEL_UP', { pausePhysics: true, timeScale: 0 });
    tm.destroy();
    expect(tm.getTokenCount()).toBe(0);
    expect(state.physicsPaused).toBe(false);
    expect(state.timeScale).toBe(1);
  });

  it('request replaces an existing token with the same key', () => {
    const { adapter, state } = makeAdapter();
    const tm = new TimeManager(adapter);
    tm.request('FX', { timeScale: 0.5 });
    expect(state.timeScale).toBe(0.5);
    tm.request('FX', { timeScale: 0.8 });
    expect(tm.getTokenCount()).toBe(1);
    expect(state.timeScale).toBe(0.8);
    tm.release('FX');
    expect(state.timeScale).toBe(1);
  });

  it('clamps negative durationMs to 0 so the token expires on first positive update', () => {
    const { adapter } = makeAdapter();
    const tm = new TimeManager(adapter);
    tm.request('BAD', { durationMs: -100 });
    expect(tm.has('BAD')).toBe(true);
    tm.update(1);
    expect(tm.has('BAD')).toBe(false);
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

