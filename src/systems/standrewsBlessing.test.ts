import { describe, expect, it } from 'vitest';
import { defaultModifiers } from '../core/RunModifiers';
import {
  STANDREWS_BLESSING_HEAL,
  STANDREWS_DAMAGE_TAKEN_MULT,
  applyStAndrewsBlessing,
} from './standrewsBlessing';

describe('applyStAndrewsBlessing', () => {
  it('does not fire for null event', () => {
    const m = defaultModifiers();
    const result = applyStAndrewsBlessing(null, m);
    expect(result.applied).toBe(false);
    expect(result.extraStartingHpHeal).toBe(0);
    expect(m).toEqual(defaultModifiers());
  });

  it('does not fire for non-st_andrews events', () => {
    for (const event of ['hogmanay', 'beltane', 'samhain', 'burns_night']) {
      const m = defaultModifiers();
      const result = applyStAndrewsBlessing(event, m);
      expect(result.applied, `should skip ${event}`).toBe(false);
      expect(m).toEqual(defaultModifiers());
    }
  });

  it('multiplies damageTakenMult and grants the heal on st_andrews', () => {
    const m = defaultModifiers();
    const result = applyStAndrewsBlessing('st_andrews', m);
    expect(result.applied).toBe(true);
    expect(result.extraStartingHpHeal).toBe(STANDREWS_BLESSING_HEAL);
    expect(m.damageTakenMult).toBeCloseTo(STANDREWS_DAMAGE_TAKEN_MULT, 5);
  });

  it('leaves non-damage-taken modifier fields untouched', () => {
    const m = defaultModifiers();
    applyStAndrewsBlessing('st_andrews', m);
    expect(m.moveSpeedMult).toBe(1);
    expect(m.startHpRatio).toBe(1);
    expect(m.spawnIntervalMult).toBe(1);
    expect(m.goldMult).toBe(1);
    expect(m.weaponCooldownMult).toBe(1);
  });

  it('stacks multiplicatively (defensive — caller should only invoke once)', () => {
    const m = defaultModifiers();
    applyStAndrewsBlessing('st_andrews', m);
    applyStAndrewsBlessing('st_andrews', m);
    expect(m.damageTakenMult).toBeCloseTo(
      STANDREWS_DAMAGE_TAKEN_MULT * STANDREWS_DAMAGE_TAKEN_MULT,
      5,
    );
  });
});
