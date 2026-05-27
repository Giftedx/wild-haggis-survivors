import { describe, it, expect } from 'vitest';
import { evaluatePostBellRetinueTick } from './postBellRetinueCadence';

describe('evaluatePostBellRetinueTick', () => {
  it('returns due:false when cadenceSec is 0 (pre-bell / neutral)', () => {
    const r = evaluatePostBellRetinueTick(1000, 900, 0);
    expect(r.due).toBe(false);
  });

  it('returns due:false when cadenceSec is negative', () => {
    const r = evaluatePostBellRetinueTick(1000, 900, -1);
    expect(r.due).toBe(false);
  });

  it('returns due:false before the cadence elapses', () => {
    const r = evaluatePostBellRetinueTick(950, 900, 90);
    expect(r.due).toBe(false);
    expect(r.nextDueSec).toBe(990);
  });

  it('returns due:true exactly when gameTimeSec equals nextDueSec', () => {
    const r = evaluatePostBellRetinueTick(990, 900, 90);
    expect(r.due).toBe(true);
    expect(r.nextDueSec).toBe(990);
  });

  it('returns due:true when gameTimeSec exceeds nextDueSec', () => {
    const r = evaluatePostBellRetinueTick(1050, 900, 90);
    expect(r.due).toBe(true);
  });

  it('computes nextDueSec as lastSpawnSec + cadenceSec', () => {
    const r = evaluatePostBellRetinueTick(800, 700, 75);
    expect(r.nextDueSec).toBe(775);
  });

  it('no bossCurrentlyActive guard — fires even during boss fights', () => {
    // No active-boss parameter exists; the function always fires if cadence is met.
    const r = evaluatePostBellRetinueTick(2000, 1900, 90);
    expect(r.due).toBe(true);
  });
});
