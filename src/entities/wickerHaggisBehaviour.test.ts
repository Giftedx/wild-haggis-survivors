import { describe, expect, it } from 'vitest';
import {
  simulateWickerHaggisBehaviour,
  initialWickerHaggisState,
  WICKER_PHASE2_HP_THRESHOLD,
  WICKER_RING_CADENCE_MS,
  WICKER_SCATTER_CADENCE_MS,
} from './wickerHaggisBehaviour';

describe('simulateWickerHaggisBehaviour', () => {
  it('starts in phase 1 with no attack flags set', () => {
    const state = initialWickerHaggisState();
    expect(state.phase).toBe(1);
    expect(state.shouldFireRing).toBe(false);
    expect(state.shouldFireScatter).toBe(false);
    expect(state.shouldFireTransitionBurst).toBe(false);
  });

  it('does not fire ring until cadence elapses', () => {
    let state = initialWickerHaggisState();
    state = simulateWickerHaggisBehaviour(state, { deltaMs: 100, hpPct: 1.0 });
    expect(state.shouldFireRing).toBe(false);
  });

  it('fires ring when phase-1 cadence elapses', () => {
    let state = initialWickerHaggisState();
    state = simulateWickerHaggisBehaviour(state, { deltaMs: WICKER_RING_CADENCE_MS, hpPct: 1.0 });
    expect(state.shouldFireRing).toBe(true);
    expect(state.shouldFireScatter).toBe(false);
  });

  it('resets accumulator after firing so next tick does not double-fire', () => {
    let state = initialWickerHaggisState();
    state = simulateWickerHaggisBehaviour(state, { deltaMs: WICKER_RING_CADENCE_MS, hpPct: 1.0 });
    expect(state.shouldFireRing).toBe(true);
    state = simulateWickerHaggisBehaviour(state, { deltaMs: 50, hpPct: 1.0 });
    expect(state.shouldFireRing).toBe(false);
  });

  it('transitions to phase 2 when HP crosses WICKER_PHASE2_HP_THRESHOLD', () => {
    let state = initialWickerHaggisState();
    state = simulateWickerHaggisBehaviour(state, { deltaMs: 100, hpPct: WICKER_PHASE2_HP_THRESHOLD - 0.01 });
    expect(state.phase).toBe(2);
    expect(state.shouldFireTransitionBurst).toBe(true);
    expect(state.speedMul).toBeGreaterThan(1);
  });

  it('fires only one transition burst at the phase boundary', () => {
    let state = initialWickerHaggisState();
    state = simulateWickerHaggisBehaviour(state, { deltaMs: 100, hpPct: 0.5 });
    expect(state.shouldFireTransitionBurst).toBe(true);
    state = simulateWickerHaggisBehaviour(state, { deltaMs: 100, hpPct: 0.4 });
    expect(state.shouldFireTransitionBurst).toBe(false);
  });

  it('fires scatter in phase 2 when cadence elapses', () => {
    let state = initialWickerHaggisState();
    // Enter phase 2.
    state = simulateWickerHaggisBehaviour(state, { deltaMs: 16, hpPct: 0.4 });
    expect(state.phase).toBe(2);
    // Advance past scatter cadence.
    state = simulateWickerHaggisBehaviour(state, { deltaMs: WICKER_SCATTER_CADENCE_MS, hpPct: 0.4 });
    expect(state.shouldFireScatter).toBe(true);
    expect(state.shouldFireRing).toBe(false);
  });

  it('phase-transition tick does not fire either attack flag', () => {
    let state = initialWickerHaggisState();
    // Fire in phase 1 first so accumulator is non-zero.
    state = simulateWickerHaggisBehaviour(state, { deltaMs: WICKER_RING_CADENCE_MS + 16, hpPct: 1.0 });
    // Transition.
    state = simulateWickerHaggisBehaviour(state, { deltaMs: 16, hpPct: 0.4 });
    expect(state.shouldFireRing).toBe(false);
    expect(state.shouldFireScatter).toBe(false);
    expect(state.shouldFireTransitionBurst).toBe(true);
  });

  it('speed multiplier is 1.0 in phase 1 and greater in phase 2', () => {
    let state = initialWickerHaggisState();
    state = simulateWickerHaggisBehaviour(state, { deltaMs: 16, hpPct: 1.0 });
    expect(state.speedMul).toBe(1.0);
    state = simulateWickerHaggisBehaviour(state, { deltaMs: 16, hpPct: 0.4 });
    expect(state.speedMul).toBeGreaterThan(1.0);
  });
});
