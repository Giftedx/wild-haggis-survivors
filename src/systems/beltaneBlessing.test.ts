import { describe, expect, it } from 'vitest';
import { defaultModifiers } from '../core/RunModifiers';
import {
  BELTANE_GOLD_MULT,
  BELTANE_PURIFICATION_HEAL,
  applyBeltaneBlessing,
} from './beltaneBlessing';

describe('applyBeltaneBlessing', () => {
  it('does not fire for null event', () => {
    const m = defaultModifiers();
    const result = applyBeltaneBlessing(null, m);
    expect(result.applied).toBe(false);
    expect(result.extraStartingHpHeal).toBe(0);
    expect(m).toEqual(defaultModifiers());
  });

  it('does not fire for non-beltane events', () => {
    for (const event of ['hogmanay', 'samhain', 'burns_night', 'st_andrews']) {
      const m = defaultModifiers();
      const result = applyBeltaneBlessing(event, m);
      expect(result.applied, `should skip ${event}`).toBe(false);
      expect(m).toEqual(defaultModifiers());
    }
  });

  it('multiplies goldMult by BELTANE_GOLD_MULT and grants the heal on beltane', () => {
    const m = defaultModifiers();
    const result = applyBeltaneBlessing('beltane', m);
    expect(result.applied).toBe(true);
    expect(result.extraStartingHpHeal).toBe(BELTANE_PURIFICATION_HEAL);
    expect(m.goldMult).toBeCloseTo(BELTANE_GOLD_MULT, 5);
  });

  it('leaves non-gold modifier fields untouched', () => {
    const m = defaultModifiers();
    applyBeltaneBlessing('beltane', m);
    expect(m.moveSpeedMult).toBe(1);
    expect(m.startHpRatio).toBe(1);
    expect(m.spawnIntervalMult).toBe(1);
    expect(m.damageTakenMult).toBe(1);
    expect(m.weaponCooldownMult).toBe(1);
  });

  it('stacks multiplicatively (defensive — caller should only invoke once)', () => {
    const m = defaultModifiers();
    applyBeltaneBlessing('beltane', m);
    applyBeltaneBlessing('beltane', m);
    expect(m.goldMult).toBeCloseTo(BELTANE_GOLD_MULT * BELTANE_GOLD_MULT, 5);
  });
});
