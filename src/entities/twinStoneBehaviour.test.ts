import { describe, expect, it } from 'vitest';
import {
  simulateTwinStoneBehaviour,
  initialTwinStoneState,
  TWIN_PHASE2_HP_THRESHOLD,
  TWIN_RING_CADENCE_MS,
  TWIN_FAN_CADENCE_MS,
} from './twinStoneBehaviour';

describe('simulateTwinStoneBehaviour', () => {
  it('starts in phase 1 with no attack flags', () => {
    const state = initialTwinStoneState();
    expect(state.phase).toBe(1);
    expect(state.shouldFireRing).toBe(false);
    expect(state.shouldFireFan).toBe(false);
    expect(state.speedMul).toBe(1.0);
  });

  it('does not fire ring before cadence elapses', () => {
    let state = initialTwinStoneState();
    state = simulateTwinStoneBehaviour(state, { deltaMs: 100, hpPct: 1.0 });
    expect(state.shouldFireRing).toBe(false);
  });

  it('fires ring when phase-1 cadence elapses', () => {
    let state = initialTwinStoneState();
    state = simulateTwinStoneBehaviour(state, { deltaMs: TWIN_RING_CADENCE_MS, hpPct: 1.0 });
    expect(state.shouldFireRing).toBe(true);
    expect(state.shouldFireFan).toBe(false);
  });

  it('resets accumulator after ring fire', () => {
    let state = initialTwinStoneState();
    state = simulateTwinStoneBehaviour(state, { deltaMs: TWIN_RING_CADENCE_MS, hpPct: 1.0 });
    state = simulateTwinStoneBehaviour(state, { deltaMs: 50, hpPct: 1.0 });
    expect(state.shouldFireRing).toBe(false);
  });

  it('transitions to phase 2 when HP crosses TWIN_PHASE2_HP_THRESHOLD', () => {
    let state = initialTwinStoneState();
    state = simulateTwinStoneBehaviour(state, { deltaMs: 16, hpPct: TWIN_PHASE2_HP_THRESHOLD - 0.01 });
    expect(state.phase).toBe(2);
    expect(state.speedMul).toBeGreaterThan(1.0);
  });

  it('phase-transition tick resets accumulator — no attack fires on transition frame', () => {
    let state = initialTwinStoneState();
    // Load up accumulator near the ring cadence.
    state = simulateTwinStoneBehaviour(state, {
      deltaMs: TWIN_RING_CADENCE_MS - 16,
      hpPct: 1.0,
    });
    // Transition tick — accumulated time resets, neither attack fires.
    state = simulateTwinStoneBehaviour(state, { deltaMs: 16, hpPct: 0.4 });
    expect(state.shouldFireRing).toBe(false);
    expect(state.shouldFireFan).toBe(false);
  });

  it('fires fan in phase 2 when fan cadence elapses', () => {
    let state = initialTwinStoneState();
    // Transition.
    state = simulateTwinStoneBehaviour(state, { deltaMs: 16, hpPct: 0.4 });
    expect(state.phase).toBe(2);
    // Advance past fan cadence.
    state = simulateTwinStoneBehaviour(state, { deltaMs: TWIN_FAN_CADENCE_MS, hpPct: 0.4 });
    expect(state.shouldFireFan).toBe(true);
    expect(state.shouldFireRing).toBe(false);
  });

  it('fan cadence is shorter than ring cadence — phase 2 fires faster', () => {
    expect(TWIN_FAN_CADENCE_MS).toBeLessThan(TWIN_RING_CADENCE_MS);
  });

  it('phase 2 speed multiplier is greater than 1', () => {
    let state = initialTwinStoneState();
    state = simulateTwinStoneBehaviour(state, { deltaMs: 16, hpPct: 0.4 });
    expect(state.speedMul).toBeGreaterThan(1.0);
  });
});
