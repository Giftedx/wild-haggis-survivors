import { describe, expect, it } from 'vitest';
import {
  simulateWailBehaviour,
  initialWailState,
  WAIL_LANCE_CADENCE_MS,
  WAIL_PULSE_RADIUS_PX,
  WAIL_PULSE_HP_THRESHOLD_PCT,
} from './wailBehaviour';

describe('simulateWailBehaviour', () => {
  it('does not fire lance until cadence elapses', () => {
    let state = initialWailState();
    state = simulateWailBehaviour(state, { deltaMs: 100, hpPct: 1.0 });
    expect(state.shouldFireLance).toBeFalsy();
  });

  it('fires ice-lance when cadence elapses', () => {
    let state = initialWailState();
    state = simulateWailBehaviour(state, { deltaMs: WAIL_LANCE_CADENCE_MS, hpPct: 1.0 });
    expect(state.shouldFireLance).toBe(true);
    // Resets accumulator on fire.
    state = simulateWailBehaviour(state, { deltaMs: 100, hpPct: 1.0 });
    expect(state.shouldFireLance).toBeFalsy();
  });

  it('fires the wail pulse exactly once at 50 % HP', () => {
    let state = initialWailState();
    state = simulateWailBehaviour(state, { deltaMs: 100, hpPct: 1.0 });
    expect(state.shouldFireWail).toBeFalsy();
    state = simulateWailBehaviour(state, { deltaMs: 100, hpPct: 0.49 });
    expect(state.shouldFireWail).toBe(true);
    expect(state.hasWailed).toBe(true);
    state = simulateWailBehaviour(state, { deltaMs: 100, hpPct: 0.4 });
    expect(state.shouldFireWail).toBeFalsy();
  });

  it('constants are sensible', () => {
    expect(WAIL_LANCE_CADENCE_MS).toBe(4000);
    expect(WAIL_PULSE_RADIUS_PX).toBe(600);
    expect(WAIL_PULSE_HP_THRESHOLD_PCT).toBeCloseTo(0.5);
  });
});
