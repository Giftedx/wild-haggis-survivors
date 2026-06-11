import { describe, expect, it } from 'vitest';
import { defaultModifiers } from '../core/RunModifiers';
import {
  BURNS_BARDIC_HEAL,
  BURNS_WEAPON_COOLDOWN_MUL,
  applyBurnsNightBlessing,
} from './burnsNightBlessing';

describe('applyBurnsNightBlessing', () => {
  it('does not fire for null event', () => {
    const m = defaultModifiers();
    const result = applyBurnsNightBlessing(null, m);
    expect(result.applied).toBe(false);
    expect(result.extraStartingHpHeal).toBe(0);
    expect(m).toEqual(defaultModifiers());
  });

  it('does not fire for non-burns_night events', () => {
    for (const event of ['hogmanay', 'beltane', 'samhain', 'st_andrews']) {
      const m = defaultModifiers();
      const result = applyBurnsNightBlessing(event, m);
      expect(result.applied, `should skip ${event}`).toBe(false);
      expect(m).toEqual(defaultModifiers());
    }
  });

  it('multiplies weaponCooldownMult and grants the heal on burns_night', () => {
    const m = defaultModifiers();
    const result = applyBurnsNightBlessing('burns_night', m);
    expect(result.applied).toBe(true);
    expect(result.extraStartingHpHeal).toBe(BURNS_BARDIC_HEAL);
    expect(m.weaponCooldownMult).toBeCloseTo(BURNS_WEAPON_COOLDOWN_MUL, 5);
  });

  it('leaves non-cooldown modifier fields untouched', () => {
    const m = defaultModifiers();
    applyBurnsNightBlessing('burns_night', m);
    expect(m.moveSpeedMult).toBe(1);
    expect(m.startHpRatio).toBe(1);
    expect(m.spawnIntervalMult).toBe(1);
    expect(m.damageTakenMult).toBe(1);
    expect(m.goldMult).toBe(1);
  });

  it('stacks multiplicatively (defensive — caller should only invoke once)', () => {
    const m = defaultModifiers();
    applyBurnsNightBlessing('burns_night', m);
    applyBurnsNightBlessing('burns_night', m);
    expect(m.weaponCooldownMult).toBeCloseTo(
      BURNS_WEAPON_COOLDOWN_MUL * BURNS_WEAPON_COOLDOWN_MUL,
      5,
    );
  });
});
