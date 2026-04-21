import { describe, it, expect } from 'vitest';
import {
  damageNumberStyle,
  DAMAGE_NUMBER_SCALE_CAP,
  DAMAGE_NUMBER_CRIT_SCALE_MUL,
  DAMAGE_NUMBER_BIG_THRESHOLD,
  DAMAGE_NUMBER_SCALE_BASE,
  DAMAGE_NUMBER_SCALE_SLOPE,
  DAMAGE_NUMBER_COMBO_BOOST_MAX,
  DAMAGE_NUMBER_COMBO_BOOST_PER_COUNT,
} from './damageNumberStyle';

describe('damageNumberStyle — scale', () => {
  it('returns the baseline scale at 0 damage', () => {
    expect(damageNumberStyle(0, false).scale).toBeCloseTo(DAMAGE_NUMBER_SCALE_BASE, 6);
  });

  it('grows linearly below the cap', () => {
    // At damage = 10: 0.8 + 10 * 0.04 = 1.2 (below cap 2.0).
    expect(damageNumberStyle(10, false).scale).toBeCloseTo(
      DAMAGE_NUMBER_SCALE_BASE + 10 * DAMAGE_NUMBER_SCALE_SLOPE,
      6,
    );
  });

  it('caps non-crit scale at DAMAGE_NUMBER_SCALE_CAP', () => {
    // At damage = 100: 0.8 + 100*0.04 = 4.8, cap to 2.0.
    expect(damageNumberStyle(100, false).scale).toBe(DAMAGE_NUMBER_SCALE_CAP);
    // Also at the exact cap boundary (damage = 30 → 2.0).
    expect(damageNumberStyle(30, false).scale).toBe(DAMAGE_NUMBER_SCALE_CAP);
  });

  it('crit multiplies the base size scale — can exceed the non-crit cap', () => {
    // At damage = 10: sizeScale = 1.2 → crit = 1.68.
    const nonCrit = damageNumberStyle(10, false).scale;
    const crit = damageNumberStyle(10, true).scale;
    expect(crit).toBeCloseTo(nonCrit * DAMAGE_NUMBER_CRIT_SCALE_MUL, 6);
  });

  it('crit at cap exceeds the non-crit cap', () => {
    // At damage = 100: sizeScale = cap (2.0); crit = 2.0 * 1.4 = 2.8.
    expect(damageNumberStyle(100, true).scale).toBeCloseTo(
      DAMAGE_NUMBER_SCALE_CAP * DAMAGE_NUMBER_CRIT_SCALE_MUL,
      6,
    );
  });

  it('clamps negative damage to 0 (baseline scale, default colour)', () => {
    const s = damageNumberStyle(-5, false);
    expect(s.scale).toBeCloseTo(DAMAGE_NUMBER_SCALE_BASE, 6);
    expect(s.color).toBe('#e8c848');
  });
});

describe('damageNumberStyle — combo scaling', () => {
  it('comboCount=0 produces the same scale as the two-argument call', () => {
    const base = damageNumberStyle(10, false).scale;
    expect(damageNumberStyle(10, false, 0).scale).toBeCloseTo(base, 6);
  });

  it('comboCount=20 adds 0.1 to scale', () => {
    const base = damageNumberStyle(10, false).scale;
    expect(damageNumberStyle(10, false, 20).scale).toBeCloseTo(
      base + 20 * DAMAGE_NUMBER_COMBO_BOOST_PER_COUNT,
      6,
    );
  });

  it('comboCount=40 adds the maximum boost', () => {
    const base = damageNumberStyle(10, false).scale;
    expect(damageNumberStyle(10, false, 40).scale).toBeCloseTo(
      base + DAMAGE_NUMBER_COMBO_BOOST_MAX,
      6,
    );
  });

  it('comboCount=100 is still capped at the maximum boost', () => {
    const at40 = damageNumberStyle(10, false, 40).scale;
    expect(damageNumberStyle(10, false, 100).scale).toBeCloseTo(at40, 6);
  });

  it('combo boost applies on top of crit multiplier', () => {
    const critBase = damageNumberStyle(10, true, 0).scale;
    const critCombo = damageNumberStyle(10, true, 20).scale;
    expect(critCombo).toBeCloseTo(
      critBase + 20 * DAMAGE_NUMBER_COMBO_BOOST_PER_COUNT,
      6,
    );
  });
});

describe('damageNumberStyle — colour', () => {
  it('crit always renders in bright-gold, regardless of damage', () => {
    expect(damageNumberStyle(1, true).color).toBe('#ffdd44');
    expect(damageNumberStyle(50, true).color).toBe('#ffdd44');
  });

  it('non-crit damage under threshold is warm default', () => {
    expect(damageNumberStyle(1, false).color).toBe('#e8c848');
    expect(damageNumberStyle(DAMAGE_NUMBER_BIG_THRESHOLD - 1, false).color).toBe('#e8c848');
  });

  it('non-crit damage at/above threshold flips to deep gold', () => {
    expect(damageNumberStyle(DAMAGE_NUMBER_BIG_THRESHOLD, false).color).toBe('#d4a017');
    expect(damageNumberStyle(DAMAGE_NUMBER_BIG_THRESHOLD + 50, false).color).toBe('#d4a017');
  });

  it('threshold and crit interact correctly — crit colour wins', () => {
    // 25 damage is above the 20 threshold, but crit colour takes priority.
    expect(damageNumberStyle(25, true).color).toBe('#ffdd44');
    expect(damageNumberStyle(25, false).color).toBe('#d4a017');
  });
});
