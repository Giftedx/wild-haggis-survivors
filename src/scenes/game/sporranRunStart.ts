/**
 * Pre-run Sporran-Deck application — sister to `seasonalRunStart.ts`.
 *
 * The Sporran picker (`SporranScene`) hands the picked card IDs to
 * `GameScene` via the init payload. This helper resolves them to
 * `SporranCard` objects from the shipped pool, applies them in pick
 * order to the `RunModifiers` bag in place, and returns a plan
 * describing post-spawn side-effects (today: `extraStartingHpHeal`).
 *
 * Pure — no Phaser, no scene state. Mirrors the seasonal helper's
 * shape so the GameScene wiring follows the same pattern: build the
 * plan, apply post-spawn effects after Player construction.
 *
 * Replay-determinism contract (T1 / ADR-0002 Phase 3): given the
 * recorded `pickedSporranIds` array, this helper produces a
 * byte-identical `RunModifiers` mutation and post-spawn plan. The
 * draft RNG (which 7-of-11 were drawn) is not part of the contract —
 * only the player's recorded picks.
 *
 * Unknown / typo'd card IDs are silently skipped: the contract is
 * "apply what we recognise". A bad ID never aborts the run start.
 */

import type { RunModifiers } from '../../core/RunModifiers';
import { ALL_SPORRAN_CARDS } from '../../data/sporranCards';
import { applySporranPicks, type SporranCard } from '../../systems/sporranDeck';

/** Aggregate plan returned by `buildSporranRunStartPlan`. */
export interface SporranRunStartPlan {
  readonly extraStartingHpHeal: number;
  /**
   * Sum of damage-multiplier deltas across the picked cards. Phase
   * 1.5 hook for `quirk_haggis_blooded`. Applied via
   * `Player.addDamageMultiplier` at post-spawn so the lever stays
   * Player-side (RunModifiers has no damage-mult field).
   */
  readonly extraDamageMultiplier: number;
  readonly appliedIds: readonly string[];
}

export interface SporranRunStartDeps {
  readonly resumeRun: boolean;
  readonly pickedSporranIds: readonly string[] | null;
  readonly runModifiers: RunModifiers;
}

const cardsById: ReadonlyMap<string, SporranCard> = new Map(
  ALL_SPORRAN_CARDS.map((c) => [c.id, c]),
);

/**
 * Resolve the picked-card IDs to cards, apply them to the bag, and
 * return the plan. On a resumed run (mid-run save / replay carrying
 * a fresh init payload by accident) the helper short-circuits: a
 * resumed bag has already absorbed the original picks and re-applying
 * would compound. Same for a null / empty pick list.
 */
const INERT_PLAN: SporranRunStartPlan = {
  extraStartingHpHeal: 0,
  extraDamageMultiplier: 0,
  appliedIds: [],
};

export function buildSporranRunStartPlan(
  deps: SporranRunStartDeps,
): SporranRunStartPlan {
  if (deps.resumeRun) return INERT_PLAN;
  const ids = deps.pickedSporranIds ?? [];
  if (ids.length === 0) return INERT_PLAN;

  const picks: SporranCard[] = [];
  for (const id of ids) {
    const card = cardsById.get(id);
    if (card) picks.push(card);
  }
  if (picks.length === 0) return INERT_PLAN;

  const result = applySporranPicks(picks, deps.runModifiers);
  return {
    extraStartingHpHeal: result.extraStartingHpHeal,
    extraDamageMultiplier: result.extraDamageMultiplier,
    appliedIds: result.appliedIds,
  };
}

export interface SporranRunStartPostSpawnDeps {
  readonly heal: (amount: number) => void;
  readonly addDamageMultiplier: (amount: number) => void;
}

/**
 * Apply post-spawn side-effects from a plan (heal +
 * damage-multiplier). Kept as its own function so the GameScene
 * wiring matches the seasonal pattern: build plan before Player
 * construction (mutates bag), apply post-spawn after Player
 * construction (touches Player API). Damage-mult lives Player-side
 * (RunModifiers has no damage-mult lever) — same hook-point as the
 * heal, sister-shape to seasonalRunStart's `addDamageMultiplier`.
 */
export function applySporranRunStartPostSpawn(
  plan: SporranRunStartPlan,
  deps: SporranRunStartPostSpawnDeps,
): void {
  if (plan.extraStartingHpHeal > 0) deps.heal(plan.extraStartingHpHeal);
  if (plan.extraDamageMultiplier > 0) deps.addDamageMultiplier(plan.extraDamageMultiplier);
}
