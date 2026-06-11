import { describe, expect, it } from 'vitest';
import { defaultModifiers } from '../core/RunModifiers';
import {
  BANNOCKBURN_FIELD_HEAL,
  BANNOCKBURN_LIFESTEAL_BONUS,
  applyBannockburnBlessing,
} from './bannockburnBlessing';

describe('applyBannockburnBlessing', () => {
  it('does not fire for null event', () => {
    const m = defaultModifiers();
    const result = applyBannockburnBlessing(null, m);
    expect(result.applied).toBe(false);
    expect(result.extraStartingHpHeal).toBe(0);
    expect(result.extraLifesteal).toBe(0);
    expect(m).toEqual(defaultModifiers());
  });

  it('does not fire for non-bannockburn events', () => {
    for (const event of [
      'hogmanay', 'beltane', 'samhain', 'st_andrews',
      'burns_night', 'imbolc', 'lammas', 'bracken_turn',
    ]) {
      const m = defaultModifiers();
      const result = applyBannockburnBlessing(event, m);
      expect(result.applied, `should skip ${event}`).toBe(false);
      expect(m).toEqual(defaultModifiers());
    }
  });

  it('grants the field heal and lifesteal bonus on bannockburn', () => {
    const m = defaultModifiers();
    const result = applyBannockburnBlessing('bannockburn', m);
    expect(result.applied).toBe(true);
    expect(result.extraStartingHpHeal).toBe(BANNOCKBURN_FIELD_HEAL);
    expect(result.extraLifesteal).toBe(BANNOCKBURN_LIFESTEAL_BONUS);
  });

  it('does not mutate the modifiers bag — lifesteal rides the Player accessor', () => {
    const m = defaultModifiers();
    applyBannockburnBlessing('bannockburn', m);
    expect(m).toEqual(defaultModifiers());
  });

  it('reports stable values across calls (idempotent return shape)', () => {
    const m = defaultModifiers();
    const a = applyBannockburnBlessing('bannockburn', m);
    const b = applyBannockburnBlessing('bannockburn', m);
    expect(a.extraStartingHpHeal).toBe(b.extraStartingHpHeal);
    expect(a.extraLifesteal).toBe(b.extraLifesteal);
  });
});
