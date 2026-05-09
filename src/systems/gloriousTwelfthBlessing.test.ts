import { describe, expect, it } from 'vitest';
import { defaultModifiers } from '../core/RunModifiers';
import {
  GLORIOUS_TWELFTH_AOE_BONUS,
  GLORIOUS_TWELFTH_STOCKUP_HEAL,
  applyGloriousTwelfthBlessing,
} from './gloriousTwelfthBlessing';

describe('applyGloriousTwelfthBlessing', () => {
  it('does not fire for null event', () => {
    const m = defaultModifiers();
    const result = applyGloriousTwelfthBlessing(null, m);
    expect(result.applied).toBe(false);
    expect(result.extraStartingHpHeal).toBe(0);
    expect(result.extraAoeMultiplier).toBe(0);
    expect(m).toEqual(defaultModifiers());
  });

  it('does not fire for non-glorious_twelfth events', () => {
    for (const event of [
      'hogmanay', 'beltane', 'samhain', 'st_andrews',
      'burns_night', 'imbolc', 'lammas', 'bracken_turn',
      'bannockburn',
    ]) {
      const m = defaultModifiers();
      const result = applyGloriousTwelfthBlessing(event, m);
      expect(result.applied, `should skip ${event}`).toBe(false);
      expect(m).toEqual(defaultModifiers());
    }
  });

  it('grants the stock-up heal and AoE bonus on glorious_twelfth', () => {
    const m = defaultModifiers();
    const result = applyGloriousTwelfthBlessing('glorious_twelfth', m);
    expect(result.applied).toBe(true);
    expect(result.extraStartingHpHeal).toBe(GLORIOUS_TWELFTH_STOCKUP_HEAL);
    expect(result.extraAoeMultiplier).toBe(GLORIOUS_TWELFTH_AOE_BONUS);
  });

  it('does not mutate the modifiers bag — AoE rides the Player accessor', () => {
    const m = defaultModifiers();
    applyGloriousTwelfthBlessing('glorious_twelfth', m);
    expect(m).toEqual(defaultModifiers());
  });

  it('reports stable values across calls (idempotent return shape)', () => {
    const m = defaultModifiers();
    const a = applyGloriousTwelfthBlessing('glorious_twelfth', m);
    const b = applyGloriousTwelfthBlessing('glorious_twelfth', m);
    expect(a.extraStartingHpHeal).toBe(b.extraStartingHpHeal);
    expect(a.extraAoeMultiplier).toBe(b.extraAoeMultiplier);
  });
});
