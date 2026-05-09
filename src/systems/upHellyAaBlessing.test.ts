import { describe, expect, it } from 'vitest';
import { defaultModifiers } from '../core/RunModifiers';
import {
  UP_HELLY_AA_DAMAGE_BONUS,
  UP_HELLY_AA_GALLEY_HEAL,
  applyUpHellyAaBlessing,
} from './upHellyAaBlessing';

describe('applyUpHellyAaBlessing', () => {
  it('returns inert result when seasonal key does not match', () => {
    const modifiers = defaultModifiers();
    const result = applyUpHellyAaBlessing('beltane', modifiers);
    expect(result).toEqual({
      applied: false,
      extraStartingHpHeal: 0,
      extraDamageMultiplier: 0,
    });
    expect(modifiers).toEqual(defaultModifiers());
  });

  it('returns inert result when seasonal key is null', () => {
    const modifiers = defaultModifiers();
    const result = applyUpHellyAaBlessing(null, modifiers);
    expect(result.applied).toBe(false);
    expect(result.extraStartingHpHeal).toBe(0);
    expect(result.extraDamageMultiplier).toBe(0);
    expect(modifiers).toEqual(defaultModifiers());
  });

  it('fires the +18 HP heal + +0.18 damage-multiplier on the up_helly_aa key', () => {
    const modifiers = defaultModifiers();
    const result = applyUpHellyAaBlessing('up_helly_aa', modifiers);
    expect(result).toEqual({
      applied: true,
      extraStartingHpHeal: UP_HELLY_AA_GALLEY_HEAL,
      extraDamageMultiplier: UP_HELLY_AA_DAMAGE_BONUS,
    });
  });

  it('does not mutate the run modifier bag (player-side blessing)', () => {
    const modifiers = defaultModifiers();
    const before = JSON.stringify(modifiers);
    applyUpHellyAaBlessing('up_helly_aa', modifiers);
    expect(JSON.stringify(modifiers)).toBe(before);
  });

  it('exposes the constants as public so callers can rebuild expected values', () => {
    expect(UP_HELLY_AA_GALLEY_HEAL).toBe(18);
    expect(UP_HELLY_AA_DAMAGE_BONUS).toBeCloseTo(0.18, 8);
  });
});
