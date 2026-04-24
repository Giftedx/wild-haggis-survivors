import { describe, expect, it } from 'vitest';

import {
  applyOatcakeHealOnCircleEntry,
  applySporranOfHolding,
} from './relicEffects';

describe('sporran_of_holding', () => {
  it('adds +2 gold to a normal pickup', () => {
    expect(applySporranOfHolding(5)).toBe(7);
  });

  it('still adds +2 on a zero-value pickup (floor bump)', () => {
    expect(applySporranOfHolding(0)).toBe(2);
  });

  it('handles large pickup values without rounding drift', () => {
    expect(applySporranOfHolding(1_000_000)).toBe(1_000_002);
  });
});

describe('oatcake_stash', () => {
  it('adds +2 HP to a normal healing-circle heal', () => {
    expect(applyOatcakeHealOnCircleEntry(4)).toBe(6);
  });

  it('still adds +2 when the base heal is zero', () => {
    expect(applyOatcakeHealOnCircleEntry(0)).toBe(2);
  });

  it('is additive, not multiplicative', () => {
    expect(applyOatcakeHealOnCircleEntry(10)).toBe(12);
    expect(applyOatcakeHealOnCircleEntry(1)).toBe(3);
  });
});
