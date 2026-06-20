/**
 * Pure rune-effect consumer composers.
 *
 * The `RuneEffectBag` (apply/remove side) accumulates raw multipliers and
 * additive deltas. Live systems (Player, WeaponSystem, XPSystem, SpawnSystem
 * and the gold path) need stat-shaped folds — e.g. "what's the final XP
 * multiplier?" or "what's the active enemy slow scalar?".
 *
 * These composers are pure, allocation-free, and testable without Phaser.
 * They take a `RuneEffectBag` (or a permissive subset for tests) and return
 * a single number ready to feed into the consumer.
 *
 * Composition contract
 * - allStatsMult universally amplifies dmg, speed, hp, xp, gold, luck.
 * - timedDmg latches an extra dmg multiplier for a window; expired by
 *   `composeDamageMul` reading `nowMs` against the bag's recorded clock.
 * - persistent hp_max stacks with the revertible hp_max layer (run-long
 *   bonus per spec §2 — Ceilidh Chain Rune).
 *
 * The "bag clock" (`nowMs`) is advanced by the orchestrator; this module
 * doesn't mutate the bag — it only reads.
 *
 * Spec: docs/archive/superpowers/specs/2026-04-23-rune-upgrades-design.md §2
 * Plan: docs/top-10-tasks/09-u1-runes-m4-wire-consumers.md
 */

import type { RuneEffectBag } from './runeEffects';

/**
 * Final damage multiplier. Composes:
 *   dmgMult × allStatsMult × (timedDmg.mult if active else 1)
 *
 * The timed window is read against `bag.nowMs` so the same bag pre/post
 * expiry returns differing values without the consumer having to track a
 * separate timer.
 */
export function composeDamageMul(bag: RuneEffectBag): number {
  const allStats = bag.allStatsMult;
  const timed = bag.timedDmg && bag.timedDmg.untilMs > bag.nowMs
    ? bag.timedDmg.mult
    : 1;
  return bag.dmgMult * allStats * timed;
}

/** Final move-speed multiplier — speedMult × allStatsMult. */
export function composeSpeedMul(bag: RuneEffectBag): number {
  return bag.speedMult * bag.allStatsMult;
}

/**
 * Final max-HP multiplier. Persistent stack composes on top so a Ceilidh
 * Chain trigger raises max HP for the rest of the run even after the
 * condition releases.
 */
export function composeMaxHpMul(bag: RuneEffectBag): number {
  return bag.hpMaxMult * bag.hpMaxMultPersistent * bag.allStatsMult;
}

/** Final XP-gain multiplier. Pilgrim / Drover. */
export function composeXpMul(bag: RuneEffectBag): number {
  return bag.xpMultRun * bag.allStatsMult;
}

/** Final gold-gain multiplier. Edinburgh Rune. */
export function composeGoldMul(bag: RuneEffectBag): number {
  return bag.goldMult * bag.allStatsMult;
}

/** Flat luck draw addend (sporran-scale). Cairn Rune contributes +15. */
export function composeLuckBonus(bag: RuneEffectBag): number {
  return bag.luckFlat;
}

/** Flat crit-chance addend. Gloaming / Flush. */
export function composeCritBonus(bag: RuneEffectBag): number {
  return bag.critFlat;
}

/** Bagpipes-radius multiplier (Piper Rune). 1 if inactive. */
export function composeBagpipesRadiusMul(bag: RuneEffectBag): number {
  return bag.bagpipesRadiusMult;
}

/** Frost / similar enemy slow multiplier (Frost Rune). 1 = no slow. */
export function composeEnemySlowMul(bag: RuneEffectBag): number {
  return bag.slowEnemiesMult;
}

/** Pickup-magnet duration multiplier — Seawrack Rune. 1 = no change. */
export function composePickupTimerMul(bag: RuneEffectBag): number {
  return bag.pickupTimerMult;
}

/**
 * Evolution-cooldown multiplier — Evolved Rune. Lower = faster evolution
 * eligibility. WeaponSystem callers fold this against existing cooldown
 * computations the same way curse cooldown is folded.
 */
export function composeEvoCooldownMul(bag: RuneEffectBag): number {
  return bag.evoCooldownMul;
}

/**
 * Execute-threshold HP fraction (Kirkyard Rune). 0 = no execute.
 * Active when player.hpFrac > threshold AND enemy.hpFrac < threshold.
 */
export function composeExecuteHpFrac(bag: RuneEffectBag): number {
  return bag.executeHpFrac;
}

/** Cascade per-stack damage bonus, gated on cascade window. 0 = inactive. */
export function composeCascadeDmgBonus(bag: RuneEffectBag): number {
  if (!bag.cascadeConfig) return 0;
  const stacks = Math.min(bag.cascadeStacks, bag.cascadeConfig.maxStacks);
  return stacks * bag.cascadeConfig.perStack;
}

/**
 * Bass-driven attack-speed multiplier — Song Rune. Currently a flat
 * 1.20 when bassAttackSpeedActive is true; if a future tuning wants to
 * thread the param through, it can read `bag` for richer state.
 */
export function composeBassAttackSpeedMul(bag: RuneEffectBag): number {
  return bag.bassAttackSpeedActive ? 1.20 : 1.0;
}

/**
 * Cascade kill bookkeeper. Called by GameScene's enemy-kill cascade so
 * the bag's cascade stacks reflect "kills inside the rolling window".
 *
 * - First kill in run / first kill after window expiry: stack = 1.
 * - Kill within `windowMs` of the last cascade-tracked kill: stack += 1
 *   up to maxStacks.
 * - Kill outside the window: stack = 1 (re-prime).
 *
 * Pure mutation; the orchestrator advances `bag.nowMs` separately.
 */
export function noteCascadeKill(bag: RuneEffectBag): void {
  const cfg = bag.cascadeConfig;
  if (!cfg) return;
  const last = bag.cascadeLastKillMs;
  if (last === null || bag.nowMs - last > cfg.windowMs) {
    bag.cascadeStacks = 1;
  } else if (bag.cascadeStacks < cfg.maxStacks) {
    bag.cascadeStacks += 1;
  }
  bag.cascadeLastKillMs = bag.nowMs;
}

/**
 * Dash-first-shot bonus. Returns the multiplier to apply to the very
 * next weapon-shot damage when the rune is latched, then clears the
 * latch so a subsequent shot pays normal damage. 1 = inactive.
 */
export function consumeDashFirstShotMul(bag: RuneEffectBag): number {
  const f = bag.firstShotAfterDash;
  if (f === null) return 1;
  if (f.expiresMs <= bag.nowMs) {
    bag.firstShotAfterDash = null;
    return 1;
  }
  bag.firstShotAfterDash = null;
  return f.mult;
}
