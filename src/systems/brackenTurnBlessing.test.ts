import { describe, expect, it } from 'vitest';
import { defaultModifiers } from '../core/RunModifiers';
import {
  BRACKEN_CRIT_BONUS,
  BRACKEN_FROST_HEAL,
  applyBrackenTurnBlessing,
} from './brackenTurnBlessing';

describe('applyBrackenTurnBlessing', () => {
  it('does not fire for null event', () => {
    const m = defaultModifiers();
    const result = applyBrackenTurnBlessing(null, m);
    expect(result.applied).toBe(false);
    expect(result.extraStartingHpHeal).toBe(0);
    expect(result.extraCritChance).toBe(0);
    expect(m).toEqual(defaultModifiers());
  });

  it('does not fire for non-bracken events', () => {
    for (const event of [
      'hogmanay', 'beltane', 'samhain', 'st_andrews',
      'burns_night', 'imbolc', 'lammas',
    ]) {
      const m = defaultModifiers();
      const result = applyBrackenTurnBlessing(event, m);
      expect(result.applied, `should skip ${event}`).toBe(false);
      expect(m).toEqual(defaultModifiers());
    }
  });

  it('grants the heal and crit bonus on bracken_turn', () => {
    const m = defaultModifiers();
    const result = applyBrackenTurnBlessing('bracken_turn', m);
    expect(result.applied).toBe(true);
    expect(result.extraStartingHpHeal).toBe(BRACKEN_FROST_HEAL);
    expect(result.extraCritChance).toBe(BRACKEN_CRIT_BONUS);
  });

  it('does not mutate the modifiers bag — crit rides the Player accessor', () => {
    const m = defaultModifiers();
    applyBrackenTurnBlessing('bracken_turn', m);
    expect(m).toEqual(defaultModifiers());
  });

  it('reports stable values across calls (idempotent return shape)', () => {
    const m = defaultModifiers();
    const a = applyBrackenTurnBlessing('bracken_turn', m);
    const b = applyBrackenTurnBlessing('bracken_turn', m);
    expect(a.extraStartingHpHeal).toBe(b.extraStartingHpHeal);
    expect(a.extraCritChance).toBe(b.extraCritChance);
  });
});
