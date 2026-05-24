import { describe, expect, it } from 'vitest';
import {
  simulateStormCailleachBehaviour,
  initialStormCailleachState,
  STORM_PHASE1_HP_THRESHOLD,
  STORM_PHASE2_HP_THRESHOLD,
  STORM_SPEED_MULS,
  STORM_HAAR_CADENCE_MS,
  STORM_LANCE_CADENCE_MS,
  STORM_HAIL_CADENCE_MS,
} from './stormCailleachBehaviour';

describe('simulateStormCailleachBehaviour', () => {
  it('starts in phase 1 with no attack flags', () => {
    const state = initialStormCailleachState();
    expect(state.phase).toBe(1);
    expect(state.speedMul).toBe(STORM_SPEED_MULS[0]);
    expect(state.shouldFireHaarPulse).toBeFalsy();
    expect(state.shouldFireIceLances).toBeFalsy();
    expect(state.shouldFireHailBurst).toBeFalsy();
  });

  it('does not fire haar pulse before cadence elapses', () => {
    let state = initialStormCailleachState();
    state = simulateStormCailleachBehaviour(state, { deltaMs: 100, hpPct: 1.0 });
    expect(state.shouldFireHaarPulse).toBeFalsy();
  });

  it('fires haar pulse in phase 1 when cadence elapses', () => {
    let state = initialStormCailleachState();
    state = simulateStormCailleachBehaviour(state, { deltaMs: STORM_HAAR_CADENCE_MS, hpPct: 1.0 });
    expect(state.shouldFireHaarPulse).toBe(true);
    expect(state.shouldFireIceLances).toBeFalsy();
    expect(state.shouldFireHailBurst).toBeFalsy();
  });

  it('resets accumulator after firing so next tick does not double-fire', () => {
    let state = initialStormCailleachState();
    state = simulateStormCailleachBehaviour(state, { deltaMs: STORM_HAAR_CADENCE_MS, hpPct: 1.0 });
    state = simulateStormCailleachBehaviour(state, { deltaMs: 50, hpPct: 1.0 });
    expect(state.shouldFireHaarPulse).toBeFalsy();
  });

  it('enters phase 2 when HP falls below STORM_PHASE1_HP_THRESHOLD', () => {
    let state = initialStormCailleachState();
    state = simulateStormCailleachBehaviour(state, { deltaMs: 16, hpPct: STORM_PHASE1_HP_THRESHOLD - 0.01 });
    expect(state.phase).toBe(2);
    expect(state.speedMul).toBe(STORM_SPEED_MULS[1]);
  });

  it('enters phase 3 when HP falls below STORM_PHASE2_HP_THRESHOLD', () => {
    let state = initialStormCailleachState();
    state = simulateStormCailleachBehaviour(state, { deltaMs: 16, hpPct: STORM_PHASE2_HP_THRESHOLD - 0.01 });
    expect(state.phase).toBe(3);
    expect(state.speedMul).toBe(STORM_SPEED_MULS[2]);
  });

  it('phase transition resets attack timer — no attack fires on transition tick', () => {
    let state = initialStormCailleachState();
    // Load up accumulator to near cadence.
    state = simulateStormCailleachBehaviour(state, { deltaMs: STORM_HAAR_CADENCE_MS - 16, hpPct: 1.0 });
    // Transition tick — timer resets.
    state = simulateStormCailleachBehaviour(state, { deltaMs: 16, hpPct: 0.5 });
    expect(state.shouldFireHaarPulse).toBeFalsy();
    expect(state.shouldFireIceLances).toBeFalsy();
  });

  it('fires ice lances in phase 2 when lance cadence elapses', () => {
    let state = initialStormCailleachState();
    state = simulateStormCailleachBehaviour(state, { deltaMs: 16, hpPct: 0.5 });
    expect(state.phase).toBe(2);
    state = simulateStormCailleachBehaviour(state, { deltaMs: STORM_LANCE_CADENCE_MS, hpPct: 0.5 });
    expect(state.shouldFireIceLances).toBe(true);
    expect(state.shouldFireHaarPulse).toBeFalsy();
    expect(state.shouldFireHailBurst).toBeFalsy();
  });

  it('fires hail bursts in phase 3 when hail cadence elapses', () => {
    let state = initialStormCailleachState();
    state = simulateStormCailleachBehaviour(state, { deltaMs: 16, hpPct: 0.2 });
    expect(state.phase).toBe(3);
    state = simulateStormCailleachBehaviour(state, { deltaMs: STORM_HAIL_CADENCE_MS, hpPct: 0.2 });
    expect(state.shouldFireHailBurst).toBe(true);
    expect(state.shouldFireHaarPulse).toBeFalsy();
    expect(state.shouldFireIceLances).toBeFalsy();
  });

  it('cadences get shorter each phase — each escalation is faster', () => {
    expect(STORM_LANCE_CADENCE_MS).toBeLessThan(STORM_HAAR_CADENCE_MS);
    expect(STORM_HAIL_CADENCE_MS).toBeLessThan(STORM_LANCE_CADENCE_MS);
  });

  it('speed multipliers increase across phases', () => {
    expect(STORM_SPEED_MULS[1]).toBeGreaterThan(STORM_SPEED_MULS[0]);
    expect(STORM_SPEED_MULS[2]).toBeGreaterThan(STORM_SPEED_MULS[1]);
  });
});
