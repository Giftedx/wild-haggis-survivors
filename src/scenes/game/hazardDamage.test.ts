import { describe, it, expect } from 'vitest';
import {
  computeHazardDamage,
  LAVA_BASE_DAMAGE,
  HEAL_ZONE_HEAL_AMOUNT,
} from './hazardDamage';

describe('computeHazardDamage', () => {
  it('returns the baseline when damageTakenMult is 1', () => {
    expect(computeHazardDamage(3, 1)).toBe(3);
    expect(computeHazardDamage(LAVA_BASE_DAMAGE, 1)).toBe(LAVA_BASE_DAMAGE);
  });

  it('scales damage up when damageTakenMult > 1', () => {
    // 3 * 2 = 6 (exactly)
    expect(computeHazardDamage(3, 2)).toBe(6);
    // 3 * 1.5 = 4.5 → rounds to 5 (banker's-round-friendly values avoided)
    expect(computeHazardDamage(3, 1.5)).toBe(5);
  });

  it('floors damage at 1 — a 0× multiplier still lands a point', () => {
    expect(computeHazardDamage(3, 0)).toBe(1);
    expect(computeHazardDamage(10, 0)).toBe(1);
  });

  it('floors damage at 1 for negative multipliers (defensive)', () => {
    // Curse shouldn't be able to invert hazards into heals.
    expect(computeHazardDamage(3, -0.5)).toBe(1);
    expect(computeHazardDamage(3, -10)).toBe(1);
  });

  it('rounds fractional results to the nearest integer', () => {
    // 3 * 0.4 = 1.2 → 1; 3 * 0.5 = 1.5 → 2; 3 * 0.7 = 2.1 → 2
    expect(computeHazardDamage(3, 0.4)).toBe(1);
    expect(computeHazardDamage(3, 0.5)).toBe(2);
    expect(computeHazardDamage(3, 0.7)).toBe(2);
  });

  it('treats NaN/infinite multipliers as 1× (safe default)', () => {
    expect(computeHazardDamage(3, Number.NaN)).toBe(3);
    expect(computeHazardDamage(3, Number.POSITIVE_INFINITY)).toBe(3);
    expect(computeHazardDamage(3, Number.NEGATIVE_INFINITY)).toBe(3);
  });

  it('with a 0 base damage, floor still kicks in', () => {
    expect(computeHazardDamage(0, 1)).toBe(1);
    expect(computeHazardDamage(0, 100)).toBe(1);
  });
});

describe('balance constants', () => {
  it('lava is a live damage source (base > 0)', () => {
    expect(LAVA_BASE_DAMAGE).toBeGreaterThan(0);
  });

  it('heal zones actually heal (positive amount)', () => {
    expect(HEAL_ZONE_HEAL_AMOUNT).toBeGreaterThan(0);
  });
});
