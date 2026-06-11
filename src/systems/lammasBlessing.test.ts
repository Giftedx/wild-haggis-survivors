import { describe, expect, it } from 'vitest';
import { defaultModifiers } from '../core/RunModifiers';
import {
  LAMMAS_HARVEST_HEAL,
  LAMMAS_XP_MULT_BONUS,
  applyLammasBlessing,
} from './lammasBlessing';

describe('applyLammasBlessing', () => {
  it('does not fire for null event', () => {
    const m = defaultModifiers();
    const result = applyLammasBlessing(null, m);
    expect(result.applied).toBe(false);
    expect(result.extraStartingHpHeal).toBe(0);
    expect(result.extraXpMultiplier).toBe(0);
    expect(m).toEqual(defaultModifiers());
  });

  it('does not fire for non-lammas events', () => {
    for (const event of [
      'hogmanay', 'beltane', 'samhain', 'st_andrews', 'burns_night', 'imbolc',
    ]) {
      const m = defaultModifiers();
      const result = applyLammasBlessing(event, m);
      expect(result.applied, `should skip ${event}`).toBe(false);
      expect(m).toEqual(defaultModifiers());
    }
  });

  it('grants the heal and XP bonus on lammas', () => {
    const m = defaultModifiers();
    const result = applyLammasBlessing('lammas', m);
    expect(result.applied).toBe(true);
    expect(result.extraStartingHpHeal).toBe(LAMMAS_HARVEST_HEAL);
    expect(result.extraXpMultiplier).toBe(LAMMAS_XP_MULT_BONUS);
  });

  it('does not mutate the modifiers bag — XP rides the Player accessor', () => {
    // Lammas is the only seasonal slot that does NOT touch RunModifiers
    // (it bumps Player.bonusXpMultiplier instead). Test the contract.
    const m = defaultModifiers();
    applyLammasBlessing('lammas', m);
    expect(m).toEqual(defaultModifiers());
  });

  it('reports stable values across calls (idempotent return shape)', () => {
    const m = defaultModifiers();
    const a = applyLammasBlessing('lammas', m);
    const b = applyLammasBlessing('lammas', m);
    expect(a.extraStartingHpHeal).toBe(b.extraStartingHpHeal);
    expect(a.extraXpMultiplier).toBe(b.extraXpMultiplier);
  });
});
