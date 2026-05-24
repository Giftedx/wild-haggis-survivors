import { describe, expect, it } from 'vitest';
import {
  simulateNessieBehaviour,
  initialNessieState,
  NESSIE_PHASE2_HP_THRESHOLD,
  NESSIE_SWEEP_CADENCE_MS,
  NESSIE_PLUNGE_CADENCE_MS,
} from './nessieBehaviour';

describe('simulateNessieBehaviour', () => {
  it('starts in phase 1 with no attack flags', () => {
    const state = initialNessieState();
    expect(state.phase).toBe(1);
    expect(state.shouldFireSweep).toBe(false);
    expect(state.shouldFirePlunge).toBe(false);
    expect(state.speedMul).toBe(1.0);
  });

  it('does not fire sweep before cadence elapses', () => {
    let state = initialNessieState();
    state = simulateNessieBehaviour(state, { deltaMs: 100, hpPct: 1.0 });
    expect(state.shouldFireSweep).toBe(false);
  });

  it('fires sweep when phase-1 cadence elapses', () => {
    let state = initialNessieState();
    state = simulateNessieBehaviour(state, { deltaMs: NESSIE_SWEEP_CADENCE_MS, hpPct: 1.0 });
    expect(state.shouldFireSweep).toBe(true);
    expect(state.shouldFirePlunge).toBe(false);
  });

  it('resets accumulator after sweep fires', () => {
    let state = initialNessieState();
    state = simulateNessieBehaviour(state, { deltaMs: NESSIE_SWEEP_CADENCE_MS, hpPct: 1.0 });
    state = simulateNessieBehaviour(state, { deltaMs: 50, hpPct: 1.0 });
    expect(state.shouldFireSweep).toBe(false);
  });

  it('transitions to phase 2 when HP crosses NESSIE_PHASE2_HP_THRESHOLD', () => {
    let state = initialNessieState();
    state = simulateNessieBehaviour(state, { deltaMs: 16, hpPct: NESSIE_PHASE2_HP_THRESHOLD - 0.01 });
    expect(state.phase).toBe(2);
    expect(state.speedMul).toBeGreaterThan(1.0);
  });

  it('phase-transition tick resets accumulator — no attack fires on transition frame', () => {
    let state = initialNessieState();
    state = simulateNessieBehaviour(state, { deltaMs: NESSIE_SWEEP_CADENCE_MS - 16, hpPct: 1.0 });
    // Transition tick — accumulated time resets.
    state = simulateNessieBehaviour(state, { deltaMs: 16, hpPct: 0.4 });
    expect(state.shouldFireSweep).toBe(false);
    expect(state.shouldFirePlunge).toBe(false);
  });

  it('fires plunge in phase 2 when plunge cadence elapses', () => {
    let state = initialNessieState();
    state = simulateNessieBehaviour(state, { deltaMs: 16, hpPct: 0.4 });
    expect(state.phase).toBe(2);
    state = simulateNessieBehaviour(state, { deltaMs: NESSIE_PLUNGE_CADENCE_MS, hpPct: 0.4 });
    expect(state.shouldFirePlunge).toBe(true);
    expect(state.shouldFireSweep).toBe(false);
  });

  it('plunge cadence is shorter than sweep cadence — phase 2 fires faster', () => {
    expect(NESSIE_PLUNGE_CADENCE_MS).toBeLessThan(NESSIE_SWEEP_CADENCE_MS);
  });

  it('phase 2 speed multiplier is greater than phase 1', () => {
    let state = initialNessieState();
    state = simulateNessieBehaviour(state, { deltaMs: 16, hpPct: 1.0 });
    expect(state.speedMul).toBe(1.0);
    state = simulateNessieBehaviour(state, { deltaMs: 16, hpPct: 0.4 });
    expect(state.speedMul).toBeGreaterThan(1.0);
  });

  it('carry-over keeps partial accumulator after fire', () => {
    const overshoot = 200;
    let state = initialNessieState();
    state = simulateNessieBehaviour(state, { deltaMs: NESSIE_SWEEP_CADENCE_MS + overshoot, hpPct: 1.0 });
    expect(state.shouldFireSweep).toBe(true);
    expect(state.msSinceLastAttack).toBe(overshoot);
  });
});
