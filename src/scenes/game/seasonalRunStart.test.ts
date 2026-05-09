import { describe, expect, it, vi } from 'vitest';
import { defaultModifiers } from '../../core/RunModifiers';
import type { RNG } from '../../utils/rng';
import {
  applySeasonalRunStartPostSpawn,
  buildSeasonalRunStartPlan,
  type SeasonalRunStartPlan,
} from './seasonalRunStart';

function inertPlan(): SeasonalRunStartPlan {
  return {
    seasonalEventKey: null,
    toast: null,
    extraStartingHpHeal: 0,
    extraXpMultiplier: 0,
    extraCritChance: 0,
    extraLifesteal: 0,
    extraAoeMultiplier: 0,
    extraPickupRadius: 0,
    extraCritDamageMultiplier: 0,
  };
}

describe('buildSeasonalRunStartPlan', () => {
  it('returns an inert plan and does not roll first-footing on resume', () => {
    const modifiers = defaultModifiers();
    const pick = vi.fn(() => 'silver');
    const rng = { pick } as unknown as RNG;

    const plan = buildSeasonalRunStartPlan({
      resumeRun: true,
      disableSeasonalEvents: false,
      now: new Date(2026, 0, 1),
      runRng: rng,
      runModifiers: modifiers,
    });

    expect(plan).toEqual(inertPlan());
    expect(pick).not.toHaveBeenCalled();
    expect(modifiers).toEqual(defaultModifiers());
  });

  it('rolls Hogmanay first-footing and applies the selected run modifier', () => {
    const modifiers = defaultModifiers();
    const pick = vi.fn(() => 'silver');
    const rng = { pick } as unknown as RNG;

    const plan = buildSeasonalRunStartPlan({
      resumeRun: false,
      disableSeasonalEvents: false,
      now: new Date(2026, 0, 1),
      runRng: rng,
      runModifiers: modifiers,
    });

    expect(pick).toHaveBeenCalledTimes(1);
    expect(modifiers.goldMult).toBeCloseTo(1.15, 8);
    expect(plan).toMatchObject({
      seasonalEventKey: 'hogmanay',
      extraStartingHpHeal: 0,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      toast: {
        key: 'ui.firstFooting.toast.silver',
        color: '#f0d090',
        delayMs: 1500,
      },
    });
  });

  it('applies Beltane modifier and post-spawn heal without rolling first-footing', () => {
    const modifiers = defaultModifiers();
    const pick = vi.fn(() => 'coal');
    const rng = { pick } as unknown as RNG;

    const plan = buildSeasonalRunStartPlan({
      resumeRun: false,
      disableSeasonalEvents: false,
      now: new Date(2026, 4, 1),
      runRng: rng,
      runModifiers: modifiers,
    });

    expect(pick).not.toHaveBeenCalled();
    expect(modifiers.goldMult).toBeCloseTo(1.1, 8);
    expect(plan).toMatchObject({
      seasonalEventKey: 'beltane',
      extraStartingHpHeal: 15,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      toast: {
        key: 'ui.beltane.blessing_toast',
        color: '#f0a060',
        delayMs: 1500,
      },
    });
  });

  it('keeps player-side Lammas and Bracken-turn bonuses in the plan', () => {
    const lammasModifiers = defaultModifiers();
    const brackenModifiers = defaultModifiers();

    const lammas = buildSeasonalRunStartPlan({
      resumeRun: false,
      disableSeasonalEvents: false,
      now: new Date(2026, 7, 1),
      runRng: { pick: vi.fn() } as unknown as RNG,
      runModifiers: lammasModifiers,
    });
    const bracken = buildSeasonalRunStartPlan({
      resumeRun: false,
      disableSeasonalEvents: false,
      now: new Date(2026, 10, 10),
      runRng: { pick: vi.fn() } as unknown as RNG,
      runModifiers: brackenModifiers,
    });

    expect(lammas).toMatchObject({
      seasonalEventKey: 'lammas',
      extraStartingHpHeal: 14,
      extraXpMultiplier: 0.1,
      extraCritChance: 0,
      toast: { key: 'ui.lammas.blessing_toast', color: '#d4a040', delayMs: 1500 },
    });
    expect(bracken).toMatchObject({
      seasonalEventKey: 'bracken_turn',
      extraStartingHpHeal: 13,
      extraXpMultiplier: 0,
      extraCritChance: 0.05,
      toast: { key: 'ui.brackenTurn.blessing_toast', color: '#b87038', delayMs: 1500 },
    });
  });

  it('applies the Glorious Twelfth AoE bonus + stock-up heal', () => {
    const modifiers = defaultModifiers();
    const plan = buildSeasonalRunStartPlan({
      resumeRun: false,
      disableSeasonalEvents: false,
      now: new Date(2027, 7, 12),
      runRng: { pick: vi.fn() } as unknown as RNG,
      runModifiers: modifiers,
    });

    expect(modifiers).toEqual(defaultModifiers());
    expect(plan).toMatchObject({
      seasonalEventKey: 'glorious_twelfth',
      extraStartingHpHeal: 16,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0.10,
      toast: {
        key: 'ui.gloriousTwelfth.blessing_toast',
        color: '#9c8838',
        delayMs: 1500,
      },
    });
  });

  it('applies the Tartan Day pickup-radius bonus + diaspora heal', () => {
    const modifiers = defaultModifiers();
    const plan = buildSeasonalRunStartPlan({
      resumeRun: false,
      disableSeasonalEvents: false,
      now: new Date(2027, 3, 6),
      runRng: { pick: vi.fn() } as unknown as RNG,
      runModifiers: modifiers,
    });

    expect(modifiers).toEqual(defaultModifiers());
    expect(plan).toMatchObject({
      seasonalEventKey: 'tartan_day',
      extraStartingHpHeal: 14,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0,
      extraPickupRadius: 20,
      toast: {
        key: 'ui.tartanDay.blessing_toast',
        color: '#b04050',
        delayMs: 1500,
      },
    });
  });

  it('applies the Simmer Dim crit-damage bonus + solstice heal', () => {
    const modifiers = defaultModifiers();
    const plan = buildSeasonalRunStartPlan({
      resumeRun: false,
      disableSeasonalEvents: false,
      // June 21, 2027 — solstice peak.
      now: new Date(2027, 5, 21),
      runRng: { pick: vi.fn() } as unknown as RNG,
      runModifiers: modifiers,
    });

    expect(modifiers).toEqual(defaultModifiers());
    expect(plan).toMatchObject({
      seasonalEventKey: 'simmer_dim',
      extraStartingHpHeal: 12,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: 0.25,
      toast: {
        key: 'ui.simmerDim.blessing_toast',
        color: '#9080c0',
        delayMs: 1500,
      },
    });
  });
});

describe('applySeasonalRunStartPostSpawn', () => {
  it('applies heal and player bonuses before scheduling the toast', () => {
    const log: string[] = [];
    const plan: SeasonalRunStartPlan = {
      seasonalEventKey: 'lammas',
      toast: { key: 'ui.lammas.blessing_toast', color: '#d4a040', delayMs: 1500 },
      extraStartingHpHeal: 14,
      extraXpMultiplier: 0.1,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: 0,
    };

    applySeasonalRunStartPostSpawn(plan, {
      heal: (amount) => log.push(`heal:${amount}`),
      addXpMultiplier: (amount) => log.push(`xp:${amount}`),
      addCritChance: (amount) => log.push(`crit:${amount}`),
      addLifesteal: (amount) => log.push(`lifesteal:${amount}`),
      addAoeMultiplier: (amount) => log.push(`aoe:${amount}`),
      addPickupRadius: (amount) => log.push(`pickup:${amount}`),
      addCritDamageMultiplier: (amount) => log.push(`critDmg:${amount}`),
      showToastAfter: (delayMs, key, color) => log.push(`toast:${delayMs}:${key}:${color}`),
    });

    expect(log).toEqual([
      'heal:14',
      'xp:0.1',
      'toast:1500:ui.lammas.blessing_toast:#d4a040',
    ]);
  });

  it('applies lifesteal bonus on a bannockburn plan', () => {
    const log: string[] = [];
    const plan: SeasonalRunStartPlan = {
      seasonalEventKey: 'bannockburn',
      toast: { key: 'ui.bannockburn.blessing_toast', color: '#a8c0d0', delayMs: 1500 },
      extraStartingHpHeal: 22,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0.5,
      extraAoeMultiplier: 0,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: 0,
    };

    applySeasonalRunStartPostSpawn(plan, {
      heal: (amount) => log.push(`heal:${amount}`),
      addXpMultiplier: (amount) => log.push(`xp:${amount}`),
      addCritChance: (amount) => log.push(`crit:${amount}`),
      addLifesteal: (amount) => log.push(`lifesteal:${amount}`),
      addAoeMultiplier: (amount) => log.push(`aoe:${amount}`),
      addPickupRadius: (amount) => log.push(`pickup:${amount}`),
      addCritDamageMultiplier: (amount) => log.push(`critDmg:${amount}`),
      showToastAfter: (delayMs, key, color) => log.push(`toast:${delayMs}:${key}:${color}`),
    });

    expect(log).toEqual([
      'heal:22',
      'lifesteal:0.5',
      'toast:1500:ui.bannockburn.blessing_toast:#a8c0d0',
    ]);
  });

  it('applies AoE bonus on a glorious_twelfth plan', () => {
    const log: string[] = [];
    const plan: SeasonalRunStartPlan = {
      seasonalEventKey: 'glorious_twelfth',
      toast: { key: 'ui.gloriousTwelfth.blessing_toast', color: '#9c8838', delayMs: 1500 },
      extraStartingHpHeal: 16,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0.10,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: 0,
    };

    applySeasonalRunStartPostSpawn(plan, {
      heal: (amount) => log.push(`heal:${amount}`),
      addXpMultiplier: (amount) => log.push(`xp:${amount}`),
      addCritChance: (amount) => log.push(`crit:${amount}`),
      addLifesteal: (amount) => log.push(`lifesteal:${amount}`),
      addAoeMultiplier: (amount) => log.push(`aoe:${amount}`),
      addPickupRadius: (amount) => log.push(`pickup:${amount}`),
      addCritDamageMultiplier: (amount) => log.push(`critDmg:${amount}`),
      showToastAfter: (delayMs, key, color) => log.push(`toast:${delayMs}:${key}:${color}`),
    });

    expect(log).toEqual([
      'heal:16',
      'aoe:0.1',
      'toast:1500:ui.gloriousTwelfth.blessing_toast:#9c8838',
    ]);
  });

  it('applies pickup-radius bonus on a tartan_day plan', () => {
    const log: string[] = [];
    const plan: SeasonalRunStartPlan = {
      seasonalEventKey: 'tartan_day',
      toast: { key: 'ui.tartanDay.blessing_toast', color: '#b04050', delayMs: 1500 },
      extraStartingHpHeal: 14,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0,
      extraPickupRadius: 20,
      extraCritDamageMultiplier: 0,
    };

    applySeasonalRunStartPostSpawn(plan, {
      heal: (amount) => log.push(`heal:${amount}`),
      addXpMultiplier: (amount) => log.push(`xp:${amount}`),
      addCritChance: (amount) => log.push(`crit:${amount}`),
      addLifesteal: (amount) => log.push(`lifesteal:${amount}`),
      addAoeMultiplier: (amount) => log.push(`aoe:${amount}`),
      addPickupRadius: (amount) => log.push(`pickup:${amount}`),
      addCritDamageMultiplier: (amount) => log.push(`critDmg:${amount}`),
      showToastAfter: (delayMs, key, color) => log.push(`toast:${delayMs}:${key}:${color}`),
    });

    expect(log).toEqual([
      'heal:14',
      'pickup:20',
      'toast:1500:ui.tartanDay.blessing_toast:#b04050',
    ]);
  });

  it('applies crit-damage bonus on a simmer_dim plan', () => {
    const log: string[] = [];
    const plan: SeasonalRunStartPlan = {
      seasonalEventKey: 'simmer_dim',
      toast: { key: 'ui.simmerDim.blessing_toast', color: '#9080c0', delayMs: 1500 },
      extraStartingHpHeal: 12,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: 0.25,
    };

    applySeasonalRunStartPostSpawn(plan, {
      heal: (amount) => log.push(`heal:${amount}`),
      addXpMultiplier: (amount) => log.push(`xp:${amount}`),
      addCritChance: (amount) => log.push(`crit:${amount}`),
      addLifesteal: (amount) => log.push(`lifesteal:${amount}`),
      addAoeMultiplier: (amount) => log.push(`aoe:${amount}`),
      addPickupRadius: (amount) => log.push(`pickup:${amount}`),
      addCritDamageMultiplier: (amount) => log.push(`critDmg:${amount}`),
      showToastAfter: (delayMs, key, color) => log.push(`toast:${delayMs}:${key}:${color}`),
    });

    expect(log).toEqual([
      'heal:12',
      'critDmg:0.25',
      'toast:1500:ui.simmerDim.blessing_toast:#9080c0',
    ]);
  });

  it('does not touch post-spawn callbacks for an inert plan', () => {
    const calls = {
      heal: vi.fn(),
      addXpMultiplier: vi.fn(),
      addCritChance: vi.fn(),
      addLifesteal: vi.fn(),
      addAoeMultiplier: vi.fn(),
      addPickupRadius: vi.fn(),
      addCritDamageMultiplier: vi.fn(),
      showToastAfter: vi.fn(),
    };

    applySeasonalRunStartPostSpawn(inertPlan(), calls);

    expect(calls.heal).not.toHaveBeenCalled();
    expect(calls.addXpMultiplier).not.toHaveBeenCalled();
    expect(calls.addCritChance).not.toHaveBeenCalled();
    expect(calls.addLifesteal).not.toHaveBeenCalled();
    expect(calls.addAoeMultiplier).not.toHaveBeenCalled();
    expect(calls.addPickupRadius).not.toHaveBeenCalled();
    expect(calls.addCritDamageMultiplier).not.toHaveBeenCalled();
    expect(calls.showToastAfter).not.toHaveBeenCalled();
  });
});
