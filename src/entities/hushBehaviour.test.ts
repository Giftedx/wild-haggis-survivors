import { describe, expect, it } from 'vitest';
import {
  HUSH_CADENCE_MS,
  HUSH_TELEGRAPH_MS,
  initialHushState,
  simulateHushBehaviour,
} from './hushBehaviour';

describe('hushBehaviour', () => {
  it('does not shout before cadence elapses', () => {
    const state = simulateHushBehaviour(
      initialHushState(),
      { deltaMs: HUSH_CADENCE_MS - 1 },
    );
    expect(state.telegraphing).toBe(false);
    expect(state.shouldDamage).toBe(false);
  });

  it('enters telegraph phase at cadence boundary', () => {
    const state = simulateHushBehaviour(
      initialHushState(),
      { deltaMs: HUSH_CADENCE_MS },
    );
    expect(state.telegraphing).toBe(true);
    expect(state.shouldDamage).toBe(false);
  });

  it('resets accumulator when telegraphing starts', () => {
    const state = simulateHushBehaviour(
      initialHushState(),
      { deltaMs: HUSH_CADENCE_MS + 500 },
    );
    expect(state.msSinceLastShout).toBe(0);
    expect(state.telegraphing).toBe(true);
  });

  it('shouldDamage fires after telegraph elapses', () => {
    const postCadence = simulateHushBehaviour(
      initialHushState(),
      { deltaMs: HUSH_CADENCE_MS },
    );
    expect(postCadence.telegraphing).toBe(true);
    const postTelegraph = simulateHushBehaviour(
      postCadence,
      { deltaMs: HUSH_TELEGRAPH_MS },
    );
    expect(postTelegraph.shouldDamage).toBe(true);
    expect(postTelegraph.telegraphing).toBe(false);
  });

  it('does not damage during telegraph window', () => {
    const postCadence = simulateHushBehaviour(
      initialHushState(),
      { deltaMs: HUSH_CADENCE_MS },
    );
    const midTelegraph = simulateHushBehaviour(
      postCadence,
      { deltaMs: HUSH_TELEGRAPH_MS - 1 },
    );
    expect(midTelegraph.shouldDamage).toBe(false);
    expect(midTelegraph.telegraphing).toBe(true);
  });

  it('accumulates partial ticks toward cadence', () => {
    let state = initialHushState();
    const halfStep = HUSH_CADENCE_MS / 4;
    for (let i = 0; i < 3; i++) {
      state = simulateHushBehaviour(state, { deltaMs: halfStep });
      expect(state.telegraphing).toBe(false);
    }
    state = simulateHushBehaviour(state, { deltaMs: halfStep });
    expect(state.telegraphing).toBe(true);
  });

  it('constants are within sensible design ranges', () => {
    expect(HUSH_CADENCE_MS).toBeGreaterThanOrEqual(3000);
    expect(HUSH_CADENCE_MS).toBeLessThanOrEqual(7000);
    expect(HUSH_TELEGRAPH_MS).toBeGreaterThan(300);
    expect(HUSH_TELEGRAPH_MS).toBeLessThan(HUSH_CADENCE_MS);
  });
});
