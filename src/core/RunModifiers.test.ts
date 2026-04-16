import { describe, expect, it } from 'vitest';
import { defaultModifiers } from './RunModifiers';

describe('RunModifiers', () => {
  it('defaults all multipliers to 1.0 and routePicks to []', () => {
    const m = defaultModifiers();
    expect(m.moveSpeedMult).toBe(1);
    expect(m.startHpRatio).toBe(1);
    expect(m.spawnIntervalMult).toBe(1);
    expect(m.damageTakenMult).toBe(1);
    expect(m.goldMult).toBe(1);
    expect(m.routePicks).toEqual([]);
  });
});
