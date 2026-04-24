import { describe, expect, it } from 'vitest';

import {
  applyBronzeClaspFirstHit,
  applyCeilidhDancersRibbonThreshold,
  applyDampTinderFireReduction,
  applyGransThimbleCritBonus,
  applyLuckyHeatherSprigLuck,
  applyOatcakeHealOnCircleEntry,
  applySporranOfHolding,
  applyWhiskyDramActivation,
  initialBronzeClaspState,
  initialWhiskyDramState,
  type BronzeClaspState,
  type WhiskyDramState,
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

describe('bronze_clasp', () => {
  it('first ever hit triggers the +15% bonus and stamps lastHitTime', () => {
    const result = applyBronzeClaspFirstHit(100, 500, initialBronzeClaspState);
    expect(result.damage).toBeCloseTo(115, 10);
    expect(result.state.lastHitTime).toBe(500);
  });

  it('a second hit within 1000ms returns base damage and preserves state', () => {
    const primed: BronzeClaspState = { lastHitTime: 500 };
    const result = applyBronzeClaspFirstHit(100, 1200, primed);
    expect(result.damage).toBe(100);
    expect(result.state).toBe(primed);
  });

  it('a hit exactly 1000ms after the last one re-triggers the bonus', () => {
    const primed: BronzeClaspState = { lastHitTime: 500 };
    const result = applyBronzeClaspFirstHit(100, 1500, primed);
    expect(result.damage).toBeCloseTo(115, 10);
    expect(result.state.lastHitTime).toBe(1500);
  });

  it('does not mutate the input state when bonus fires', () => {
    const primed: BronzeClaspState = { lastHitTime: 0 };
    applyBronzeClaspFirstHit(10, 2000, primed);
    expect(primed.lastHitTime).toBe(0);
  });
});

describe('ceilidh_dancers_ribbon', () => {
  it('returns 5 as the override threshold regardless of default', () => {
    expect(applyCeilidhDancersRibbonThreshold(8)).toBe(5);
  });

  it('overrides even a lower default threshold to 5 (relic is the source of truth)', () => {
    expect(applyCeilidhDancersRibbonThreshold(3)).toBe(5);
  });

  it('handles a zero default without error', () => {
    expect(applyCeilidhDancersRibbonThreshold(0)).toBe(5);
  });
});

describe('damp_tinder', () => {
  it('reduces a 10-damage fire tick to 6 (×0.6)', () => {
    expect(applyDampTinderFireReduction(10)).toBeCloseTo(6, 10);
  });

  it('returns 0 when the incoming fire damage is 0', () => {
    expect(applyDampTinderFireReduction(0)).toBe(0);
  });

  it('scales proportionally for small and large values', () => {
    expect(applyDampTinderFireReduction(1)).toBeCloseTo(0.6, 10);
    expect(applyDampTinderFireReduction(100)).toBeCloseTo(60, 10);
  });
});

describe('whisky_dram', () => {
  it('heals 20% of max HP on first activation and marks state used', () => {
    const result = applyWhiskyDramActivation(40, 100, initialWhiskyDramState);
    expect(result.hp).toBe(60);
    expect(result.state.used).toBe(true);
  });

  it('clamps the heal to maxHp (no overflow at high HP)', () => {
    const result = applyWhiskyDramActivation(95, 100, initialWhiskyDramState);
    expect(result.hp).toBe(100);
    expect(result.state.used).toBe(true);
  });

  it('is inert on a second activation — HP and state both unchanged', () => {
    const spent: WhiskyDramState = { used: true };
    const result = applyWhiskyDramActivation(40, 100, spent);
    expect(result.hp).toBe(40);
    expect(result.state).toBe(spent);
  });

  it('heals from zero HP as expected (clutch activation)', () => {
    const result = applyWhiskyDramActivation(0, 100, initialWhiskyDramState);
    expect(result.hp).toBe(20);
    expect(result.state.used).toBe(true);
  });

  it('does not mutate input state on activation', () => {
    const fresh: WhiskyDramState = { used: false };
    applyWhiskyDramActivation(50, 100, fresh);
    expect(fresh.used).toBe(false);
  });
});
