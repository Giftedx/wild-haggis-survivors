/**
 * Pure rune-effect apply/remove functions.
 *
 * A `RuneEffectBag` is a flat accumulator the game reads each frame. Apply
 * mutates the bag; remove undoes the same mutation. Composition rules:
 *
 *   - multiplicative fields start at 1 and compose via product (dmgMult,
 *     speedMult, hpMaxMult, slowEnemiesMult, …) — remove divides
 *   - additive fields start at 0 and compose via sum (luckFlat, critFlat,
 *     pickupPerKillExtra) — remove subtracts
 *   - executeHpFrac stacks as max — remove re-derives from remaining
 *     registrations (tracked internally as a multiset)
 *   - pulse fields (pendingGems, pendingHealingThistles, pendingRerolls,
 *     pendingShrineBuffs, pendingThistleBombs, pendingLightningChains,
 *     pendingNextChestDrop) are one-shot queues filled on apply; remove
 *     is a no-op because the game loop drains them
 *   - latched timed fields (timedDmg, firstShotAfterDash) set on apply,
 *     clear on remove; the game loop wipes them on expiry independently
 *   - hpMaxMultPersistent latches on apply and does NOT revert (Ceilidh
 *     Chain Rune — "run-long" per spec §2)
 *
 * This module is PURE: no Phaser, no side-effects outside the bag.
 */

import type { RuneEffect, RuneEffectKey } from '../../data/runes';

export interface RuneEffectBag {
  // Multiplicative (start 1)
  dmgMult: number;
  speedMult: number;
  hpMaxMult: number;
  hpMaxMultPersistent: number;
  slowEnemiesMult: number;
  pickupTimerMult: number;
  goldMult: number;
  allStatsMult: number;
  bagpipesRadiusMult: number;
  evoCooldownMul: number;
  xpMultRun: number;

  // Additive (start 0)
  luckFlat: number;
  critFlat: number;
  pickupPerKillExtra: number;

  // Max-stacked (execute threshold)
  executeHpFrac: number;
  _executeStack: number[];  // internal multiset for remove-by-value

  // Cascade config
  cascadeConfig: { perStack: number; maxStacks: number; windowMs: number } | null;
  cascadeStacks: number;
  cascadeLastKillMs: number | null;

  // Latched timed
  timedDmg: { mult: number; untilMs: number } | null;
  firstShotAfterDash: { mult: number; expiresMs: number } | null;

  // Pending pulses (drained by the caller each frame)
  pendingGems: number;
  pendingHealingThistles: number;
  pendingRerolls: number;
  pendingShrineBuffs: number;
  pendingThistleBombs: Array<{ dmg: number; radius: number }>;
  pendingLightningChains: Array<{ targets: number }>;
  pendingNextChestDrop: boolean;

  // Flags
  bassAttackSpeedActive: boolean;

  // Clock — set by the orchestrator before each apply so latched effects
  // compute absolute expiry without tunneling the time parameter through.
  nowMs: number;
}

export function createRuneEffectBag(): RuneEffectBag {
  return {
    dmgMult: 1,
    speedMult: 1,
    hpMaxMult: 1,
    hpMaxMultPersistent: 1,
    slowEnemiesMult: 1,
    pickupTimerMult: 1,
    goldMult: 1,
    allStatsMult: 1,
    bagpipesRadiusMult: 1,
    evoCooldownMul: 1,
    xpMultRun: 1,

    luckFlat: 0,
    critFlat: 0,
    pickupPerKillExtra: 0,

    executeHpFrac: 0,
    _executeStack: [],

    cascadeConfig: null,
    cascadeStacks: 0,
    cascadeLastKillMs: null,

    timedDmg: null,
    firstShotAfterDash: null,

    pendingGems: 0,
    pendingHealingThistles: 0,
    pendingRerolls: 0,
    pendingShrineBuffs: 0,
    pendingThistleBombs: [],
    pendingLightningChains: [],
    pendingNextChestDrop: false,

    bassAttackSpeedActive: false,

    nowMs: 0,
  };
}

export function applyRuneEffect(bag: RuneEffectBag, effect: RuneEffect): void {
  const p = effect.params;
  switch (effect.key) {
    // multiplicative
    case 'dmg_mult':             bag.dmgMult *= p.mult!; return;
    case 'speed_mult':           bag.speedMult *= p.mult!; return;
    case 'hp_max_mult':          bag.hpMaxMult *= p.mult!; return;
    case 'hp_max_mult_persistent': bag.hpMaxMultPersistent *= p.mult!; return;
    case 'slow_enemies':         bag.slowEnemiesMult *= p.mult!; return;
    case 'pickup_timer_mult':    bag.pickupTimerMult *= p.mult!; return;
    case 'gold_mult':            bag.goldMult *= p.mult!; return;
    case 'all_stats_mult':       bag.allStatsMult *= p.mult!; return;
    case 'bagpipes_radius_mult': bag.bagpipesRadiusMult *= p.mult!; return;
    case 'evo_cooldown_mul':     bag.evoCooldownMul *= p.mult!; return;
    case 'xp_mult_run':          bag.xpMultRun *= p.mult!; return;
    // additive
    case 'luck_flat':            bag.luckFlat += p.flat!; return;
    case 'crit_flat':            bag.critFlat += p.flat!; return;
    case 'pickup_per_kill':      bag.pickupPerKillExtra += p.extra!; return;
    // max-stacked
    case 'execute_threshold':
      bag._executeStack.push(p.hpFrac!);
      bag.executeHpFrac = Math.max(...bag._executeStack);
      return;
    // cascade config
    case 'dmg_stack':
      bag.cascadeConfig = { perStack: p.perStack!, maxStacks: p.maxStacks!, windowMs: p.windowMs! };
      bag.cascadeStacks = 0;
      bag.cascadeLastKillMs = null;
      return;
    // latched timed
    case 'dmg_mult_timed':
      bag.timedDmg = { mult: p.mult!, untilMs: bag.nowMs + p.durationMs! };
      return;
    case 'dash_first_shot_dmg':
      bag.firstShotAfterDash = { mult: p.mult!, expiresMs: bag.nowMs + 1000 };
      return;
    // pulse
    case 'gem_spawn':             bag.pendingGems += p.extra!; return;
    case 'healing_thistle_spawn': bag.pendingHealingThistles += p.count!; return;
    case 'reroll_grant':          bag.pendingRerolls += p.count!; return;
    case 'shrine_buff_grant':     bag.pendingShrineBuffs += p.count!; return;
    case 'thistle_bomb':          bag.pendingThistleBombs.push({ dmg: p.dmg!, radius: p.radius! }); return;
    case 'lightning_chain':       bag.pendingLightningChains.push({ targets: p.targets! }); return;
    case 'next_chest_drop':       bag.pendingNextChestDrop = true; return;
    // flag
    case 'bass_attack_speed':     bag.bassAttackSpeedActive = true; return;
  }
  // exhaustiveness fallback
  const _exhaustive: never = effect.key as never;
  void _exhaustive;
}

export function removeRuneEffect(bag: RuneEffectBag, effect: RuneEffect): void {
  const p = effect.params;
  switch (effect.key) {
    // multiplicative — divide
    case 'dmg_mult':             bag.dmgMult /= p.mult!; return;
    case 'speed_mult':           bag.speedMult /= p.mult!; return;
    case 'hp_max_mult':          bag.hpMaxMult /= p.mult!; return;
    case 'slow_enemies':         bag.slowEnemiesMult /= p.mult!; return;
    case 'pickup_timer_mult':    bag.pickupTimerMult /= p.mult!; return;
    case 'gold_mult':            bag.goldMult /= p.mult!; return;
    case 'all_stats_mult':       bag.allStatsMult /= p.mult!; return;
    case 'bagpipes_radius_mult': bag.bagpipesRadiusMult /= p.mult!; return;
    case 'evo_cooldown_mul':     bag.evoCooldownMul /= p.mult!; return;
    case 'xp_mult_run':          bag.xpMultRun /= p.mult!; return;
    case 'hp_max_mult_persistent':
      // persistent: no revert (run-long bonus)
      return;
    // additive — subtract
    case 'luck_flat':            bag.luckFlat -= p.flat!; return;
    case 'crit_flat':            bag.critFlat -= p.flat!; return;
    case 'pickup_per_kill':      bag.pickupPerKillExtra -= p.extra!; return;
    // max-stacked
    case 'execute_threshold': {
      const idx = bag._executeStack.indexOf(p.hpFrac!);
      if (idx !== -1) bag._executeStack.splice(idx, 1);
      bag.executeHpFrac = bag._executeStack.length > 0 ? Math.max(...bag._executeStack) : 0;
      return;
    }
    // cascade — strip config + reset stacks
    case 'dmg_stack':
      bag.cascadeConfig = null;
      bag.cascadeStacks = 0;
      bag.cascadeLastKillMs = null;
      return;
    // latched timed — clear
    case 'dmg_mult_timed':       bag.timedDmg = null; return;
    case 'dash_first_shot_dmg':  bag.firstShotAfterDash = null; return;
    // pulse — no-op (events already emitted and drained)
    case 'gem_spawn':
    case 'healing_thistle_spawn':
    case 'reroll_grant':
    case 'shrine_buff_grant':
    case 'thistle_bomb':
    case 'lightning_chain':
    case 'next_chest_drop':
      return;
    // flag
    case 'bass_attack_speed':    bag.bassAttackSpeedActive = false; return;
  }
  const _exhaustive: never = effect.key;
  void _exhaustive;
}

/** Drain helper — zeros pulse queues, returns a snapshot. */
export function drainRunePulses(bag: RuneEffectBag): {
  gems: number;
  healingThistles: number;
  rerolls: number;
  shrineBuffs: number;
  thistleBombs: Array<{ dmg: number; radius: number }>;
  lightningChains: Array<{ targets: number }>;
  chestDropNext: boolean;
} {
  const out = {
    gems: bag.pendingGems,
    healingThistles: bag.pendingHealingThistles,
    rerolls: bag.pendingRerolls,
    shrineBuffs: bag.pendingShrineBuffs,
    thistleBombs: bag.pendingThistleBombs.slice(),
    lightningChains: bag.pendingLightningChains.slice(),
    chestDropNext: bag.pendingNextChestDrop,
  };
  bag.pendingGems = 0;
  bag.pendingHealingThistles = 0;
  bag.pendingRerolls = 0;
  bag.pendingShrineBuffs = 0;
  bag.pendingThistleBombs.length = 0;
  bag.pendingLightningChains.length = 0;
  bag.pendingNextChestDrop = false;
  return out;
}

// Type re-export for callers that only need the effect-key union.
export type { RuneEffectKey };
