import { describe, expect, it } from 'vitest';
import { applyRuneEffect, createRuneEffectBag, removeRuneEffect } from './runeEffects';
import {
  composeBagpipesRadiusMul,
  composeBassAttackSpeedMul,
  composeCascadeDmgBonus,
  composeCritBonus,
  composeDamageMul,
  composeEnemySlowMul,
  composeExecuteHpFrac,
  composeGoldMul,
  composeLuckBonus,
  composeMaxHpMul,
  composePickupTimerMul,
  composeSpeedMul,
  composeXpMul,
  consumeDashFirstShotMul,
  noteCascadeKill,
} from './runeConsumer';
import type { RuneEffect } from '../../data/runes';

const eff = (key: RuneEffect['key'], params: Record<string, number>): RuneEffect => ({ key, params });

describe('runeConsumer — pure composers', () => {
  it('damage mul = 1 on neutral bag', () => {
    expect(composeDamageMul(createRuneEffectBag())).toBe(1);
  });

  it('damage mul stacks dmg_mult × allStatsMult × timed window', () => {
    const bag = createRuneEffectBag();
    bag.nowMs = 0;
    applyRuneEffect(bag, eff('dmg_mult', { mult: 2 }));
    applyRuneEffect(bag, eff('all_stats_mult', { mult: 1.1 }));
    applyRuneEffect(bag, eff('dmg_mult_timed', { mult: 1.5, durationMs: 1000 }));
    expect(composeDamageMul(bag)).toBeCloseTo(2 * 1.1 * 1.5);

    // After the window, timed slice drops out.
    bag.nowMs = 2000;
    expect(composeDamageMul(bag)).toBeCloseTo(2 * 1.1);
  });

  it('speed mul folds speedMult × allStatsMult', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('speed_mult', { mult: 0.8 }));
    applyRuneEffect(bag, eff('all_stats_mult', { mult: 1.1 }));
    expect(composeSpeedMul(bag)).toBeCloseTo(0.88);
  });

  it('max-hp mul layers persistent + revertible + allStats', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('hp_max_mult', { mult: 1.1 }));
    applyRuneEffect(bag, eff('hp_max_mult_persistent', { mult: 1.2 }));
    applyRuneEffect(bag, eff('all_stats_mult', { mult: 1.1 }));
    expect(composeMaxHpMul(bag)).toBeCloseTo(1.1 * 1.2 * 1.1);
    // Persistent does NOT revert; revertible hp_max does.
    removeRuneEffect(bag, eff('hp_max_mult', { mult: 1.1 }));
    removeRuneEffect(bag, eff('hp_max_mult_persistent', { mult: 1.2 }));
    expect(composeMaxHpMul(bag)).toBeCloseTo(1.2 * 1.1);
  });

  it('xp / gold / luck / crit bonuses folded directly', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('xp_mult_run', { mult: 1.5 }));
    applyRuneEffect(bag, eff('gold_mult', { mult: 1.25 }));
    applyRuneEffect(bag, eff('luck_flat', { flat: 15 }));
    applyRuneEffect(bag, eff('crit_flat', { flat: 0.08 }));
    expect(composeXpMul(bag)).toBeCloseTo(1.5);
    expect(composeGoldMul(bag)).toBeCloseTo(1.25);
    expect(composeLuckBonus(bag)).toBe(15);
    expect(composeCritBonus(bag)).toBeCloseTo(0.08);
  });

  it('bagpipes radius / enemy slow / pickup timer surface their bag fields', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('bagpipes_radius_mult', { mult: 1.25 }));
    applyRuneEffect(bag, eff('slow_enemies', { mult: 0.85 }));
    applyRuneEffect(bag, eff('pickup_timer_mult', { mult: 2.0 }));
    expect(composeBagpipesRadiusMul(bag)).toBeCloseTo(1.25);
    expect(composeEnemySlowMul(bag)).toBeCloseTo(0.85);
    expect(composePickupTimerMul(bag)).toBeCloseTo(2.0);
  });

  it('execute threshold reads bag (max-stacked)', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('execute_threshold', { hpFrac: 0.2 }));
    applyRuneEffect(bag, eff('execute_threshold', { hpFrac: 0.1 }));
    expect(composeExecuteHpFrac(bag)).toBeCloseTo(0.2);
    removeRuneEffect(bag, eff('execute_threshold', { hpFrac: 0.2 }));
    expect(composeExecuteHpFrac(bag)).toBeCloseTo(0.1);
  });

  it('bass attack-speed mul is 1.0 default and 1.20 when active', () => {
    const bag = createRuneEffectBag();
    expect(composeBassAttackSpeedMul(bag)).toBe(1);
    applyRuneEffect(bag, eff('bass_attack_speed', { scale: 1 }));
    expect(composeBassAttackSpeedMul(bag)).toBeCloseTo(1.2);
  });
});

describe('runeConsumer — cascade kill bookkeeping', () => {
  it('first cascade kill seeds stack=1; subsequent kills inside window stack up to max', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('dmg_stack', { perStack: 0.05, maxStacks: 3, windowMs: 500 }));
    bag.nowMs = 0;
    expect(composeCascadeDmgBonus(bag)).toBe(0);
    noteCascadeKill(bag);
    expect(bag.cascadeStacks).toBe(1);
    expect(composeCascadeDmgBonus(bag)).toBeCloseTo(0.05);
    bag.nowMs = 100;
    noteCascadeKill(bag);
    expect(bag.cascadeStacks).toBe(2);
    bag.nowMs = 300;
    noteCascadeKill(bag);
    expect(bag.cascadeStacks).toBe(3);
    // Capped at maxStacks.
    bag.nowMs = 400;
    noteCascadeKill(bag);
    expect(bag.cascadeStacks).toBe(3);
  });

  it('kill outside window resets to stack=1', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('dmg_stack', { perStack: 0.05, maxStacks: 10, windowMs: 500 }));
    bag.nowMs = 0;
    noteCascadeKill(bag);
    bag.nowMs = 100;
    noteCascadeKill(bag);
    expect(bag.cascadeStacks).toBe(2);
    // Big jump — outside window.
    bag.nowMs = 5000;
    noteCascadeKill(bag);
    expect(bag.cascadeStacks).toBe(1);
  });

  it('no-op when no cascade rune is equipped', () => {
    const bag = createRuneEffectBag();
    expect(() => noteCascadeKill(bag)).not.toThrow();
    expect(bag.cascadeStacks).toBe(0);
  });
});

describe('runeConsumer — dash first-shot consume', () => {
  it('returns mult exactly once, then identity', () => {
    const bag = createRuneEffectBag();
    bag.nowMs = 0;
    applyRuneEffect(bag, eff('dash_first_shot_dmg', { mult: 2 }));
    expect(consumeDashFirstShotMul(bag)).toBe(2);
    expect(consumeDashFirstShotMul(bag)).toBe(1);
  });

  it('returns identity if expired', () => {
    const bag = createRuneEffectBag();
    bag.nowMs = 0;
    applyRuneEffect(bag, eff('dash_first_shot_dmg', { mult: 2 }));
    bag.nowMs = 5000;
    expect(consumeDashFirstShotMul(bag)).toBe(1);
  });
});
