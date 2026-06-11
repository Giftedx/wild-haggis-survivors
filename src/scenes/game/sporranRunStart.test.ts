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
    expect(plan.extraDamageMultiplier).toBe(0);
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
    expect(plan.extraDamageMultiplier).toBe(0);
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
    expect(plan.extraDamageMultiplier).toBe(0);
    expect(plan.appliedIds).toEqual([]);
    expect(m).toEqual(defaultModifiers());
  });

  it('quirk_haggis_blooded threads damageMultiplier through the plan (Phase 1.5)', () => {
    const m = defaultModifiers();
    const plan = buildSporranRunStartPlan({
      resumeRun: false,
      pickedSporranIds: ['quirk_haggis_blooded'],
      runModifiers: m,
    });
    expect(plan.appliedIds).toEqual(['quirk_haggis_blooded']);
    expect(plan.extraDamageMultiplier).toBeCloseTo(0.12, 5);
    expect(m.damageTakenMult).toBeCloseTo(1.12, 5);
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
    const addDamageMultiplier = vi.fn();
    applySporranRunStartPostSpawn(
      { extraStartingHpHeal: 20, extraDamageMultiplier: 0, appliedIds: ['boon_shortbread'] },
      { heal, addDamageMultiplier },
    );
    expect(heal).toHaveBeenCalledTimes(1);
    expect(heal).toHaveBeenCalledWith(20);
    expect(addDamageMultiplier).not.toHaveBeenCalled();
  });

  it('does not call heal when amount is 0', () => {
    const heal = vi.fn();
    const addDamageMultiplier = vi.fn();
    applySporranRunStartPostSpawn(
      { extraStartingHpHeal: 0, extraDamageMultiplier: 0, appliedIds: [] },
      { heal, addDamageMultiplier },
    );
    expect(heal).not.toHaveBeenCalled();
    expect(addDamageMultiplier).not.toHaveBeenCalled();
  });

  it('does not call heal when amount is negative (defensive)', () => {
    const heal = vi.fn();
    const addDamageMultiplier = vi.fn();
    applySporranRunStartPostSpawn(
      { extraStartingHpHeal: -5, extraDamageMultiplier: 0, appliedIds: [] },
      { heal, addDamageMultiplier },
    );
    expect(heal).not.toHaveBeenCalled();
    expect(addDamageMultiplier).not.toHaveBeenCalled();
  });

  it('calls addDamageMultiplier once when the plan carries a positive delta (Phase 1.5)', () => {
    const heal = vi.fn();
    const addDamageMultiplier = vi.fn();
    applySporranRunStartPostSpawn(
      { extraStartingHpHeal: 0, extraDamageMultiplier: 0.12, appliedIds: ['quirk_haggis_blooded'] },
      { heal, addDamageMultiplier },
    );
    expect(addDamageMultiplier).toHaveBeenCalledTimes(1);
    expect(addDamageMultiplier).toHaveBeenCalledWith(0.12);
    expect(heal).not.toHaveBeenCalled();
  });

  it('does not call addDamageMultiplier when the delta is 0', () => {
    const heal = vi.fn();
    const addDamageMultiplier = vi.fn();
    applySporranRunStartPostSpawn(
      { extraStartingHpHeal: 20, extraDamageMultiplier: 0, appliedIds: ['boon_shortbread'] },
      { heal, addDamageMultiplier },
    );
    expect(addDamageMultiplier).not.toHaveBeenCalled();
  });
});
