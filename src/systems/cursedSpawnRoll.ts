/**
 * Phase B Endless — pure helper for the "Cursed enemy variant" roll.
 *
 * Cursed variants are post-bell only — `cursedChance` is 0 until the
 * second post-bell step (120s past the bell) per `PostBellEscalation`.
 * They are gated at the SpawnSystem call site to non-boss, non-hazard,
 * non-elite enemies — elites already carry their own visual identity
 * and stacking the two would muddy the read.
 *
 * Pure so the gameplay decision (curse-or-not) can be vitested without
 * Phaser. The visual + damage application is on `Enemy.markAsCursed`.
 */
import type { EnemyBehavior } from '../data/enemies';

export interface CursedRollContext {
  /** 0..1 — `PostBellMultipliers.cursedChance`. */
  readonly cursedChance: number;
  /** Already an elite this spawn? Cursed cannot stack on elite. */
  readonly isElite: boolean;
  /** Hazards never become cursed (they are static props, not enemies). */
  readonly behavior: EnemyBehavior;
  /** Pack members never become cursed (visual confusion + group spawn cost). */
  readonly packSize: number;
  /** A 0..1 roll from the run RNG (so the decision is deterministic / replayable). */
  readonly rng01: number;
}

/**
 * Should this newly-spawned enemy be marked as cursed?
 *
 * Returns true iff the chance is > 0, the enemy is eligible (non-elite,
 * non-hazard, non-pack), and the rng roll falls inside the chance band.
 */
export function shouldMarkCursed(ctx: CursedRollContext): boolean {
  if (ctx.cursedChance <= 0) return false;
  if (ctx.isElite) return false;
  if (ctx.behavior === 'hazard') return false;
  if (ctx.packSize > 1) return false;
  return ctx.rng01 < ctx.cursedChance;
}
