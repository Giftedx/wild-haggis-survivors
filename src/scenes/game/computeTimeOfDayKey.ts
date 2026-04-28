/**
 * Pure mapping: run time (ms) → time-of-day key.
 *
 * Phase 0 of B5 charter (`docs/superpowers/specs/2026-04-28-five-missing-
 * biomes-design.md`). Closes `gloaming_rune` (`runeConditions.ts:104`)
 * by giving GameScene a non-null `timeOfDayKey` to thread into the
 * rune evaluator (`GameScene.ts:2370`).
 *
 * Boundaries split the 25-min run so dusk lands in the late-mid range
 * where the player is already engaged but pre-final-boss. This matches
 * the Soul Charter "rest moment" pacing axis without disrupting the
 * combat ramp:
 *
 *   < 5min  → dawn   (early opener)
 *   5-15min → day    (combat ramp)
 *   15-22min → dusk  (gloaming window — pre-Hunter-General lull)
 *   >22min  → night  (post-Hunter-General final push to taxman)
 *
 * Pure helper so the boundary table is unit-testable without standing
 * up a real scene. Determinism: input is run time only, no RNG.
 */
export type TimeOfDayKey = 'dawn' | 'day' | 'dusk' | 'night';

const DAWN_END_MS = 5 * 60_000;
const DAY_END_MS = 15 * 60_000;
const DUSK_END_MS = 22 * 60_000;

export function computeTimeOfDayKey(runTimeMs: number): TimeOfDayKey {
  if (runTimeMs < DAWN_END_MS) return 'dawn';
  if (runTimeMs < DAY_END_MS) return 'day';
  if (runTimeMs < DUSK_END_MS) return 'dusk';
  return 'night';
}
