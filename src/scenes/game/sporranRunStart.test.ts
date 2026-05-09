import { describe, expect, it, vi } from 'vitest';
import { defaultModifiers } from '../../core/RunModifiers';
import {
  applySporranRunStartPostSpawn,
  buildSporranRunStartPlan,
} from './sporranRunStart';

describe('buildSporranRunStartPlan', () => {
  it('returns inert plan when pickedSporranIds is null', () => {
    const m = defaultModifiers();
    const plan = buildSporranRunStartPlan({
      resumeRun: false,
      pickedSporranIds: null,
      runModifiers: m,
    });
    expect(plan.extraStartingHpHeal).toBe(0);
    expect(plan.appliedIds).toEqual([]);
    expect(m).toEqual(defaultModifiers());
  });

  it('returns inert plan when pickedSporranIds is empty', () => {
    const m = defaultModifiers();
    const plan = buildSporranRunStartPlan({
      resumeRun: false,
      pickedSporranIds: [],
      runModifiers: m,
    });
    expect(plan.extraStartingHpHeal).toBe(0);
    expect(plan.appliedIds).toEqual([]);
    expect(m).toEqual(defaultModifiers());
  });

  it('short-circuits on a resumed run (idempotent re-apply guard)', () => {
    const m = defaultModifiers();
    const plan = buildSporranRunStartPlan({
      resumeRun: true,
      pickedSporranIds: ['boon_silver', 'boon_coal', 'boon_whisky'],
      runModifiers: m,
    });
    expect(plan.extraStartingHpHeal).toBe(0);
    expect(plan.appliedIds).toEqual([]);
    expect(m).toEqual(defaultModifiers());
  });

  it('applies recognised cards in pick order (replay contract)', () => {
    const m = defaultModifiers();
    const plan = buildSporranRunStartPlan({
      resumeRun: false,
      pickedSporranIds: ['boon_silver', 'boon_shortbread', 'boon_coal'],
      runModifiers: m,
    });
    expect(plan.appliedIds).toEqual(['boon_silver', 'boon_shortbread', 'boon_coal']);
    expect(plan.extraStartingHpHeal).toBe(20);
    expect(m.goldMult).toBeCloseTo(1.10, 5);
    expect(m.damageTakenMult).toBeCloseTo(0.97, 5);
  });

  it('silently skips unknown card ids', () => {
    const m = defaultModifiers();
    const plan = buildSporranRunStartPlan({
      resumeRun: false,
      pickedSporranIds: ['curse_unknown_xyz', 'boon_silver', 'not_a_card'],
      runModifiers: m,
    });
    expect(plan.appliedIds).toEqual(['boon_silver']);
    expect(m.goldMult).toBeCloseTo(1.10, 5);
  });

  it('triple-curse compounds goldMult through delegation', () => {
    const m = defaultModifiers();
    buildSporranRunStartPlan({
      resumeRun: false,
      pickedSporranIds: ['curse_heavy_legs', 'curse_thin_hide', 'curse_windless_pipes'],
      runModifiers: m,
    });
    expect(m.goldMult).toBeCloseTo(1.30 * 1.40 * 1.35, 5);
  });

  it('all-unknown ids return inert plan without touching the bag', () => {
    const m = defaultModifiers();
    const plan = buildSporranRunStartPlan({
      resumeRun: false,
      pickedSporranIds: ['nope_a', 'nope_b', 'nope_c'],
      runModifiers: m,
    });
    expect(plan.appliedIds).toEqual([]);
    expect(plan.extraStartingHpHeal).toBe(0);
    expect(m).toEqual(defaultModifiers());
  });
});

describe('applySporranRunStartPostSpawn', () => {
  it('calls heal once with the plan amount when > 0', () => {
    const heal = vi.fn();
    applySporranRunStartPostSpawn(
      { extraStartingHpHeal: 20, appliedIds: ['boon_shortbread'] },
      { heal },
    );
    expect(heal).toHaveBeenCalledTimes(1);
    expect(heal).toHaveBeenCalledWith(20);
  });

  it('does not call heal when amount is 0', () => {
    const heal = vi.fn();
    applySporranRunStartPostSpawn(
      { extraStartingHpHeal: 0, appliedIds: [] },
      { heal },
    );
    expect(heal).not.toHaveBeenCalled();
  });

  it('does not call heal when amount is negative (defensive)', () => {
    const heal = vi.fn();
    applySporranRunStartPostSpawn(
      { extraStartingHpHeal: -5, appliedIds: [] },
      { heal },
    );
    expect(heal).not.toHaveBeenCalled();
  });
});
