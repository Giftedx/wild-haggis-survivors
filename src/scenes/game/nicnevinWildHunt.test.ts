import { describe, it, expect, vi } from 'vitest';
import {
  createWildHuntState,
  startWildHunt,
  stopWildHunt,
  tickWildHunt,
  WILD_HUNT_PULL_MS,
  WILD_HUNT_COOLDOWN_MS,
  type WildHuntCallbacks,
} from './nicnevinWildHunt';

function makeCallbacks(): WildHuntCallbacks {
  return {
    setPullSourceOverride: vi.fn(),
    scatterGems: vi.fn(),
    onPullStart: vi.fn(),
  };
}

const idleInputs = { bossX: 100, bossY: 200, bossActive: true } as const;

describe('Nicnevin Wild Hunt', () => {
  it('idle state ignores ticks until startWildHunt is called', () => {
    const state = createWildHuntState();
    const cb = makeCallbacks();
    tickWildHunt(state, 100, idleInputs, cb);
    expect(state.phase).toBe('idle');
    expect(cb.setPullSourceOverride).not.toHaveBeenCalled();
    expect(cb.scatterGems).not.toHaveBeenCalled();
  });

  it('startWildHunt enters pulling phase with the full pull duration', () => {
    const state = createWildHuntState();
    startWildHunt(state);
    expect(state.phase).toBe('pulling');
    expect(state.timerMs).toBe(WILD_HUNT_PULL_MS);
  });

  it('pulling phase pins the override to boss position every tick', () => {
    const state = createWildHuntState();
    startWildHunt(state);
    const cb = makeCallbacks();
    tickWildHunt(state, 100, idleInputs, cb);
    expect(cb.setPullSourceOverride).toHaveBeenCalledWith({ x: 100, y: 200 });
    expect(cb.scatterGems).not.toHaveBeenCalled();
  });

  it('pulling timer expiring releases override + scatters + enters cooldown', () => {
    const state = createWildHuntState();
    startWildHunt(state);
    const cb = makeCallbacks();
    tickWildHunt(state, WILD_HUNT_PULL_MS + 1, idleInputs, cb);
    expect(state.phase).toBe('cooldown');
    expect(state.timerMs).toBe(WILD_HUNT_COOLDOWN_MS);
    expect(cb.setPullSourceOverride).toHaveBeenLastCalledWith(null);
    expect(cb.scatterGems).toHaveBeenCalledTimes(1);
  });

  it('cooldown timer expiring flips back to pulling and calls onPullStart', () => {
    const state = createWildHuntState();
    state.phase = 'cooldown';
    state.timerMs = 50;
    const cb = makeCallbacks();
    tickWildHunt(state, 100, idleInputs, cb);
    expect(state.phase).toBe('pulling');
    expect(state.timerMs).toBe(WILD_HUNT_PULL_MS);
    expect(cb.onPullStart).toHaveBeenCalledTimes(1);
    // The pull source override is set on the *next* tick, not the cooldown
    // exit edge — keeps the contract symmetric with the initial start.
    expect(cb.setPullSourceOverride).not.toHaveBeenCalled();
  });

  it('cooldown does not call setPullSourceOverride or scatter prematurely', () => {
    const state = createWildHuntState();
    state.phase = 'cooldown';
    state.timerMs = WILD_HUNT_COOLDOWN_MS;
    const cb = makeCallbacks();
    tickWildHunt(state, 100, idleInputs, cb);
    expect(cb.setPullSourceOverride).not.toHaveBeenCalled();
    expect(cb.scatterGems).not.toHaveBeenCalled();
    expect(cb.onPullStart).not.toHaveBeenCalled();
  });

  it('boss dying mid-pull releases the override and resets to idle', () => {
    const state = createWildHuntState();
    startWildHunt(state);
    const cb = makeCallbacks();
    tickWildHunt(state, 100, { bossX: 0, bossY: 0, bossActive: false }, cb);
    expect(state.phase).toBe('idle');
    expect(state.timerMs).toBe(0);
    expect(cb.setPullSourceOverride).toHaveBeenLastCalledWith(null);
    // Scatter is a *pull-end* beat, not a *boss-died* beat — the player
    // shouldn't see a flung-gem effect when the queen falls.
    expect(cb.scatterGems).not.toHaveBeenCalled();
  });

  it('boss dying during cooldown also resets cleanly', () => {
    const state = createWildHuntState();
    state.phase = 'cooldown';
    state.timerMs = 1000;
    const cb = makeCallbacks();
    tickWildHunt(state, 100, { bossX: 0, bossY: 0, bossActive: false }, cb);
    expect(state.phase).toBe('idle');
    expect(state.timerMs).toBe(0);
    expect(cb.setPullSourceOverride).toHaveBeenLastCalledWith(null);
  });

  it('stopWildHunt is a manual reset (used by scene reset paths)', () => {
    const state = createWildHuntState();
    startWildHunt(state);
    state.timerMs = 1234;
    stopWildHunt(state);
    expect(state.phase).toBe('idle');
    expect(state.timerMs).toBe(0);
  });

  it('full cycle pulse → cooldown → pulse re-procs without re-trigger', () => {
    const state = createWildHuntState();
    startWildHunt(state);
    const cb = makeCallbacks();
    // Drive the pull to completion.
    tickWildHunt(state, WILD_HUNT_PULL_MS + 1, idleInputs, cb);
    expect(state.phase).toBe('cooldown');
    // Drive the cooldown to completion in one fat tick.
    tickWildHunt(state, WILD_HUNT_COOLDOWN_MS + 1, idleInputs, cb);
    expect(state.phase).toBe('pulling');
    expect(cb.onPullStart).toHaveBeenCalledTimes(1);
    expect(cb.scatterGems).toHaveBeenCalledTimes(1);
  });
});
