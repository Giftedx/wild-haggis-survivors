import { describe, expect, it } from 'vitest';
import { defaultModifiers } from '../core/RunModifiers';
import {
  IMBOLC_BRIGID_HEAL,
  IMBOLC_MOVE_SPEED_MUL,
  applyImbolcBlessing,
} from './imbolcBlessing';

describe('applyImbolcBlessing', () => {
  it('does not fire for null event', () => {
    const m = defaultModifiers();
    const result = applyImbolcBlessing(null, m);
    expect(result.applied).toBe(false);
    expect(result.extraStartingHpHeal).toBe(0);
    expect(m).toEqual(defaultModifiers());
  });

  it('does not fire for non-imbolc events', () => {
    for (const event of ['hogmanay', 'beltane', 'samhain', 'st_andrews', 'burns_night']) {
      const m = defaultModifiers();
      const result = applyImbolcBlessing(event, m);
      expect(result.applied, `should skip ${event}`).toBe(false);
      expect(m).toEqual(defaultModifiers());
    }
  });

  it('multiplies moveSpeedMult and grants the heal on imbolc', () => {
    const m = defaultModifiers();
    const result = applyImbolcBlessing('imbolc', m);
    expect(result.applied).toBe(true);
    expect(result.extraStartingHpHeal).toBe(IMBOLC_BRIGID_HEAL);
    expect(m.moveSpeedMult).toBeCloseTo(IMBOLC_MOVE_SPEED_MUL, 5);
  });

  it('leaves non-speed modifier fields untouched', () => {
    const m = defaultModifiers();
    applyImbolcBlessing('imbolc', m);
    expect(m.startHpRatio).toBe(1);
    expect(m.spawnIntervalMult).toBe(1);
    expect(m.damageTakenMult).toBe(1);
    expect(m.goldMult).toBe(1);
    expect(m.weaponCooldownMult).toBe(1);
  });

  it('stacks multiplicatively (defensive — caller should only invoke once)', () => {
    const m = defaultModifiers();
    applyImbolcBlessing('imbolc', m);
    applyImbolcBlessing('imbolc', m);
    expect(m.moveSpeedMult).toBeCloseTo(
      IMBOLC_MOVE_SPEED_MUL * IMBOLC_MOVE_SPEED_MUL,
      5,
    );
  });
});
