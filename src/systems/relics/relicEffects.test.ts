import { describe, expect, it } from 'vitest';

import {
  applyGransThimbleCritBonus,
  applyLuckyHeatherSprigLuck,
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

describe('grans_thimble', () => {
  it('scales a 2× crit multiplier by +8% to 2.16×', () => {
    expect(applyGransThimbleCritBonus(2)).toBeCloseTo(2.16, 10);
  });

  it('scales a 1× (no-crit baseline) up to 1.08×', () => {
    expect(applyGransThimbleCritBonus(1)).toBeCloseTo(1.08, 10);
  });

  it('scales a 3× mega-crit by 1.08 to 3.24×', () => {
    expect(applyGransThimbleCritBonus(3)).toBeCloseTo(3.24, 10);
  });
});

describe('lucky_heather_sprig', () => {
  it('adds +0.03 luck to a neutral 0 baseline', () => {
    expect(applyLuckyHeatherSprigLuck(0)).toBeCloseTo(0.03, 10);
  });

  it('is additive with existing luck', () => {
    expect(applyLuckyHeatherSprigLuck(0.1)).toBeCloseTo(0.13, 10);
  });

  it('stacks without clamping (callers own upper bound)', () => {
    expect(applyLuckyHeatherSprigLuck(0.99)).toBeCloseTo(1.02, 10);
  });
});
