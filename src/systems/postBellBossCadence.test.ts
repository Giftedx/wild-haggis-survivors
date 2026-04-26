import { describe, it, expect } from 'vitest';
import { evaluatePostBellBossTick } from './postBellBossCadence';

describe('evaluatePostBellBossTick', () => {
  it('not due before cadence elapses', () => {
    const r = evaluatePostBellBossTick(1230, 1200, 300, false);
    expect(r.due).toBe(false);
    expect(r.nextDueSec).toBe(1500);
  });

  it('due exactly when cadence elapses', () => {
    const r = evaluatePostBellBossTick(1500, 1200, 300, false);
    expect(r.due).toBe(true);
    expect(r.nextDueSec).toBe(1500);
  });

  it('still due after cadence + slop', () => {
    const r = evaluatePostBellBossTick(2000, 1200, 300, false);
    expect(r.due).toBe(true);
  });

  it('never due while a boss is still active', () => {
    const r = evaluatePostBellBossTick(2000, 1200, 300, true);
    expect(r.due).toBe(false);
  });

  it('cadence 0 returns not-due (defensive)', () => {
    const r = evaluatePostBellBossTick(99999, 0, 0, false);
    expect(r.due).toBe(false);
  });

  it('faster cadence in late endless still respects boss-active gate', () => {
    const r = evaluatePostBellBossTick(2300, 2200, 120, true);
    expect(r.due).toBe(false);
  });

  it('faster cadence in late endless triggers as soon as window opens', () => {
    const r = evaluatePostBellBossTick(2320, 2200, 120, false);
    expect(r.due).toBe(true);
  });
});
