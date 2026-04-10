import { describe, expect, it, vi } from 'vitest';
import { TimeManager, type TimeAdapter } from './TimeManager';

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
});

