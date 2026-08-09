import { describe, expect, it } from 'vitest';
import {
  COMBO_BONUS_CAP,
  COMBO_BONUS_PER_TIER,
  COMBO_TIER_SIZE,
  comboDamageBonusFraction,
  comboDamageBonusPct,
  comboDamageMultiplier,
} from './comboDamage';

describe('comboDamageBonusFraction', () => {
  it('is zero below the first tier (combo 0..9)', () => {
    for (const c of [0, 1, 5, 9]) {
      expect(comboDamageBonusFraction(c), `combo ${c}`).toBe(0);
    }
  });

  it('crosses to +5% at the first tier boundary (combo 10)', () => {
    expect(comboDamageBonusFraction(10)).toBeCloseTo(COMBO_BONUS_PER_TIER);
    expect(comboDamageBonusFraction(19)).toBeCloseTo(COMBO_BONUS_PER_TIER);
  });

  it('grows linearly per tier — combo 50 = +25%', () => {
    expect(comboDamageBonusFraction(50)).toBeCloseTo(0.25);
  });

  it('caps at +50% (combo 100 = max bonus)', () => {
    expect(comboDamageBonusFraction(100)).toBeCloseTo(COMBO_BONUS_CAP);
    expect(comboDamageBonusFraction(200)).toBeCloseTo(COMBO_BONUS_CAP);
    expect(comboDamageBonusFraction(99999)).toBeCloseTo(COMBO_BONUS_CAP);
  });

  it('clamps negative inputs to 0 (corrupted-resume defence)', () => {
    expect(comboDamageBonusFraction(-1)).toBe(0);
    expect(comboDamageBonusFraction(-100)).toBe(0);
  });
});

describe('comboDamageMultiplier', () => {
  it('is exactly 1.0 at combo 0', () => {
    expect(comboDamageMultiplier(0)).toBe(1);
  });

  it('is 1 + bonus fraction', () => {
    expect(comboDamageMultiplier(20)).toBeCloseTo(1.10);
    expect(comboDamageMultiplier(100)).toBeCloseTo(1.50);
  });
});

describe('comboDamageBonusPct', () => {
  it('matches the multiplier expressed as a whole-number %', () => {
    expect(comboDamageBonusPct(0)).toBe(0);
    expect(comboDamageBonusPct(10)).toBe(5);
    expect(comboDamageBonusPct(50)).toBe(25);
    expect(comboDamageBonusPct(100)).toBe(50);
    expect(comboDamageBonusPct(500)).toBe(50);
  });
});

describe('constants pin the curve shape', () => {
  it('tier size + bonus + cap stay aligned', () => {
    expect(COMBO_TIER_SIZE).toBe(10);
    expect(COMBO_BONUS_PER_TIER).toBe(0.05);
    expect(COMBO_BONUS_CAP).toBe(0.5);
    // 10 tiers × 5% = 50% cap — the curve is internally consistent.
    expect((COMBO_BONUS_CAP / COMBO_BONUS_PER_TIER) * COMBO_TIER_SIZE).toBe(100);
  });
});
