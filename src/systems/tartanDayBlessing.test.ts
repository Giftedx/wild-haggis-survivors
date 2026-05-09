import { describe, expect, it } from 'vitest';
import { defaultModifiers } from '../core/RunModifiers';
import {
  TARTAN_DAY_DIASPORA_HEAL,
  TARTAN_DAY_PICKUP_BONUS_PX,
  applyTartanDayBlessing,
} from './tartanDayBlessing';

describe('applyTartanDayBlessing', () => {
  it('does not fire for null event', () => {
    const m = defaultModifiers();
    const result = applyTartanDayBlessing(null, m);
    expect(result.applied).toBe(false);
    expect(result.extraStartingHpHeal).toBe(0);
    expect(result.extraPickupRadius).toBe(0);
    expect(m).toEqual(defaultModifiers());
  });

  it('does not fire for non-tartan_day events', () => {
    for (const event of [
      'hogmanay', 'beltane', 'samhain', 'st_andrews',
      'burns_night', 'imbolc', 'lammas', 'bracken_turn',
      'bannockburn', 'glorious_twelfth',
    ]) {
      const m = defaultModifiers();
      const result = applyTartanDayBlessing(event, m);
      expect(result.applied, `should skip ${event}`).toBe(false);
      expect(m).toEqual(defaultModifiers());
    }
  });

  it('grants the diaspora heal and pickup-radius bonus on tartan_day', () => {
    const m = defaultModifiers();
    const result = applyTartanDayBlessing('tartan_day', m);
    expect(result.applied).toBe(true);
    expect(result.extraStartingHpHeal).toBe(TARTAN_DAY_DIASPORA_HEAL);
    expect(result.extraPickupRadius).toBe(TARTAN_DAY_PICKUP_BONUS_PX);
  });

  it('does not mutate the modifiers bag — pickup-radius rides the Player accessor', () => {
    const m = defaultModifiers();
    applyTartanDayBlessing('tartan_day', m);
    expect(m).toEqual(defaultModifiers());
  });

  it('reports stable values across calls (idempotent return shape)', () => {
    const m = defaultModifiers();
    const a = applyTartanDayBlessing('tartan_day', m);
    const b = applyTartanDayBlessing('tartan_day', m);
    expect(a.extraStartingHpHeal).toBe(b.extraStartingHpHeal);
    expect(a.extraPickupRadius).toBe(b.extraPickupRadius);
  });
});
