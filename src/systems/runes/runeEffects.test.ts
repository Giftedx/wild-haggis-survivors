import { describe, expect, it } from 'vitest';
import type { RuneEffect } from '../../data/runes';
import {
  createRuneEffectBag,
  applyRuneEffect,
  removeRuneEffect,
} from './runeEffects';

const eff = (key: RuneEffect['key'], params: Record<string, number>): RuneEffect => ({ key, params });

describe('runeEffects — multiplicative (apply/remove reversible)', () => {
  it('dmg_mult multiplies then divides back', () => {
    const bag = createRuneEffectBag();
    expect(bag.dmgMult).toBe(1);
    applyRuneEffect(bag, eff('dmg_mult', { mult: 2.0 }));
    expect(bag.dmgMult).toBeCloseTo(2.0);
    removeRuneEffect(bag, eff('dmg_mult', { mult: 2.0 }));
    expect(bag.dmgMult).toBeCloseTo(1.0);
  });

  it('stacked dmg_mult composes multiplicatively', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('dmg_mult', { mult: 2.0 }));
    applyRuneEffect(bag, eff('dmg_mult', { mult: 1.5 }));
    expect(bag.dmgMult).toBeCloseTo(3.0);
    removeRuneEffect(bag, eff('dmg_mult', { mult: 2.0 }));
    expect(bag.dmgMult).toBeCloseTo(1.5);
  });

  it('speed_mult reversible', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('speed_mult', { mult: 0.8 }));
    expect(bag.speedMult).toBeCloseTo(0.8);
    removeRuneEffect(bag, eff('speed_mult', { mult: 0.8 }));
    expect(bag.speedMult).toBeCloseTo(1.0);
  });

  it('hp_max_mult reversible; hp_max_mult_persistent latches', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('hp_max_mult', { mult: 1.1 }));
    expect(bag.hpMaxMult).toBeCloseTo(1.1);
    removeRuneEffect(bag, eff('hp_max_mult', { mult: 1.1 }));
    expect(bag.hpMaxMult).toBeCloseTo(1.0);

    applyRuneEffect(bag, eff('hp_max_mult_persistent', { mult: 1.2 }));
    expect(bag.hpMaxMultPersistent).toBeCloseTo(1.2);
    // remove is a no-op for persistent
    removeRuneEffect(bag, eff('hp_max_mult_persistent', { mult: 1.2 }));
    expect(bag.hpMaxMultPersistent).toBeCloseTo(1.2);
  });

  it('slow_enemies / pickup_timer_mult / gold_mult / all_stats_mult / bagpipes_radius_mult / evo_cooldown_mul / xp_mult_run all reversible', () => {
    const bag = createRuneEffectBag();
    const keys = ['slow_enemies', 'pickup_timer_mult', 'gold_mult', 'all_stats_mult', 'bagpipes_radius_mult', 'evo_cooldown_mul', 'xp_mult_run'] as const;
    const fieldOf: Record<string, keyof typeof bag> = {
      slow_enemies: 'slowEnemiesMult',
      pickup_timer_mult: 'pickupTimerMult',
      gold_mult: 'goldMult',
      all_stats_mult: 'allStatsMult',
      bagpipes_radius_mult: 'bagpipesRadiusMult',
      evo_cooldown_mul: 'evoCooldownMul',
      xp_mult_run: 'xpMultRun',
    };
    for (const k of keys) {
      applyRuneEffect(bag, eff(k, { mult: 1.3 }));
      expect(bag[fieldOf[k]!]).toBeCloseTo(1.3);
      removeRuneEffect(bag, eff(k, { mult: 1.3 }));
      expect(bag[fieldOf[k]!]).toBeCloseTo(1.0);
    }
  });
});

describe('runeEffects — additive (apply/remove reversible)', () => {
  it('luck_flat adds / subtracts', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('luck_flat', { flat: 15 }));
    expect(bag.luckFlat).toBe(15);
    applyRuneEffect(bag, eff('luck_flat', { flat: 5 }));
    expect(bag.luckFlat).toBe(20);
    removeRuneEffect(bag, eff('luck_flat', { flat: 15 }));
    expect(bag.luckFlat).toBe(5);
  });

  it('crit_flat adds / subtracts', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('crit_flat', { flat: 0.15 }));
    expect(bag.critFlat).toBeCloseTo(0.15);
    removeRuneEffect(bag, eff('crit_flat', { flat: 0.15 }));
    expect(bag.critFlat).toBeCloseTo(0);
  });

  it('pickup_per_kill adds / subtracts', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('pickup_per_kill', { extra: 1 }));
    expect(bag.pickupPerKillExtra).toBe(1);
    removeRuneEffect(bag, eff('pickup_per_kill', { extra: 1 }));
    expect(bag.pickupPerKillExtra).toBe(0);
  });

  it('execute_threshold keeps the max HP fraction when stacked; remove drops it', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('execute_threshold', { hpFrac: 0.2 }));
    expect(bag.executeHpFrac).toBeCloseTo(0.2);
    applyRuneEffect(bag, eff('execute_threshold', { hpFrac: 0.1 }));
    // max stays at 0.2
    expect(bag.executeHpFrac).toBeCloseTo(0.2);
    removeRuneEffect(bag, eff('execute_threshold', { hpFrac: 0.2 }));
    expect(bag.executeHpFrac).toBeCloseTo(0.1);
    removeRuneEffect(bag, eff('execute_threshold', { hpFrac: 0.1 }));
    expect(bag.executeHpFrac).toBeCloseTo(0);
  });
});

describe('runeEffects — pulse effects (apply pushes, remove is no-op)', () => {
  it('gem_spawn queues a gem count; remove is no-op', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('gem_spawn', { extra: 1 }));
    expect(bag.pendingGems).toBe(1);
    applyRuneEffect(bag, eff('gem_spawn', { extra: 2 }));
    expect(bag.pendingGems).toBe(3);
    removeRuneEffect(bag, eff('gem_spawn', { extra: 1 }));
    expect(bag.pendingGems).toBe(3);
  });

  it('healing_thistle_spawn queues count', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('healing_thistle_spawn', { count: 1 }));
    expect(bag.pendingHealingThistles).toBe(1);
  });

  it('reroll_grant queues count', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('reroll_grant', { count: 1 }));
    expect(bag.pendingRerolls).toBe(1);
  });

  it('next_chest_drop latches a boolean', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('next_chest_drop', { prob: 1 }));
    expect(bag.pendingNextChestDrop).toBe(true);
  });

  it('shrine_buff_grant queues count', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('shrine_buff_grant', { count: 1 }));
    expect(bag.pendingShrineBuffs).toBe(1);
  });

  it('thistle_bomb queues a bomb payload per apply', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('thistle_bomb', { dmg: 60, radius: 120 }));
    expect(bag.pendingThistleBombs).toHaveLength(1);
    expect(bag.pendingThistleBombs[0]).toEqual({ dmg: 60, radius: 120 });
  });

  it('lightning_chain queues a chain payload per apply', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('lightning_chain', { targets: 3 }));
    expect(bag.pendingLightningChains).toEqual([{ targets: 3 }]);
  });
});

describe('runeEffects — latched timed effects', () => {
  it('dmg_mult_timed sets expiry relative to nowMs; remove clears latch', () => {
    const bag = createRuneEffectBag();
    bag.nowMs = 1000;
    applyRuneEffect(bag, eff('dmg_mult_timed', { mult: 1.5, durationMs: 1000 }));
    expect(bag.timedDmg).toEqual({ mult: 1.5, untilMs: 2000 });
    removeRuneEffect(bag, eff('dmg_mult_timed', { mult: 1.5, durationMs: 1000 }));
    expect(bag.timedDmg).toBeNull();
  });

  it('dash_first_shot_dmg latches a single-use mult with expiry', () => {
    const bag = createRuneEffectBag();
    bag.nowMs = 5000;
    applyRuneEffect(bag, eff('dash_first_shot_dmg', { mult: 2.0 }));
    expect(bag.firstShotAfterDash).not.toBeNull();
    expect(bag.firstShotAfterDash!.mult).toBe(2.0);
  });
});

describe('runeEffects — dmg_stack (cascade)', () => {
  it('dmg_stack primes stack config on apply; remove strips config and resets', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('dmg_stack', { perStack: 0.05, maxStacks: 10, windowMs: 500 }));
    expect(bag.cascadeConfig).toEqual({ perStack: 0.05, maxStacks: 10, windowMs: 500 });
    expect(bag.cascadeStacks).toBe(0);
    removeRuneEffect(bag, eff('dmg_stack', { perStack: 0.05, maxStacks: 10, windowMs: 500 }));
    expect(bag.cascadeConfig).toBeNull();
    expect(bag.cascadeStacks).toBe(0);
  });
});

describe('runeEffects — flag effects', () => {
  it('bass_attack_speed sets / clears a boolean flag', () => {
    const bag = createRuneEffectBag();
    applyRuneEffect(bag, eff('bass_attack_speed', { scale: 1 }));
    expect(bag.bassAttackSpeedActive).toBe(true);
    removeRuneEffect(bag, eff('bass_attack_speed', { scale: 1 }));
    expect(bag.bassAttackSpeedActive).toBe(false);
  });
});
