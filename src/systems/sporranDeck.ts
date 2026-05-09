/**
 * Sporran Deck — pre-run draft helper (DESIGN_IDEAS §1).
 *
 * The sporran is the leather purse worn at the front of the kilt — by
 * tradition it carries small charms, herbs, oatcakes, a relative's
 * ribbon, and whatever else the wearer trusts to fate's pocket. Drawing
 * a hand of cards from the sporran is the haggis committing to a
 * pre-run posture: which charms travel today, which stay home.
 *
 * Mechanic: draw 7 cards from the pool, keep 3. Picked cards mutate
 * the run's `RunModifiers` bag pre-run. Cards span three families —
 * curses (penalty + gold bonus, wraps existing CURSES), boons (small
 * positive), and quirks (mixed positive/negative, no gold).
 *
 * Phase 0 ships this helper + tests + an 11-card pool. NO runtime
 * wiring — the system is dead code until Phase 1 lifts the UI. See
 * `docs/superpowers/specs/2026-05-09-sporran-deck-design.md`.
 *
 * Replay-determinism contract (T1 / ADR-0002 Phase 3): `drawSporran`
 * is a pure function of `(rng-state, pool)` — same seed + same pool =
 * byte-identical card-id sequence. Picks (Phase 1+) record chosen ids
 * separately so the human-pick step is replayable without re-rolling.
 *
 * Sister patterns: `firstFooting.ts` (RNG roll → result → modifier
 * mutation), `curses.ts` (typed pool entries with apply mutators).
 */

import type { RNG } from '../utils/rng';
import type { RunModifiers } from '../core/RunModifiers';

/** Three families of card. Each maps to a Voice Card register. */
export type SporranCardKind = 'curse' | 'boon' | 'quirk';

/**
 * One sporran card. `apply(m)` mutates the bag in place AND returns a
 * result object describing any caller-side effects (e.g. starting-HP
 * heal). Mirrors the `firstFooting.ts` shape so the two pre-run paths
 * are wired the same way downstream.
 */
export interface SporranCard {
  readonly id: string;
  readonly kind: SporranCardKind;
  /** Display name i18n key (Phase 1 authors copy). */
  readonly nameKey: string;
  /** One-line description i18n key. */
  readonly descKey: string;
  /** Mutates the modifier bag in place; returns post-spawn side effects. */
  readonly apply: (m: RunModifiers) => SporranCardApplyResult;
}

export interface SporranCardApplyResult {
  /** Post-spawn HP heal to invoke on the Player. 0 for most cards. */
  readonly extraStartingHpHeal: number;
  /**
   * Post-spawn damage-multiplier delta to invoke on the Player via
   * `Player.addDamageMultiplier`. 0 for most cards. Lives on the
   * apply-result rather than as a `RunModifiers` lever because damage
   * multiplication is owned Player-side (applied during weapon
   * resolution); mirrors the same hook-point as
   * `extraStartingHpHeal`. Phase 1.5 lift — earlier deferred per spec
   * §6 because the underlying `RunModifiers.damageMult` lever does
   * not exist; routing via post-spawn dependency dodges that.
   */
  readonly extraDamageMultiplier: number;
}

/** Aggregate result of applying all picked cards to the bag. */
export interface SporranDraftResult {
  /** Sum of `extraStartingHpHeal` across all picks. */
  readonly extraStartingHpHeal: number;
  /** Sum of `extraDamageMultiplier` across all picks. */
  readonly extraDamageMultiplier: number;
  /** Ordered list of picked card ids — for replay/persistence. */
  readonly appliedIds: readonly string[];
}

/** Default draw size. 7 in, 3 out — sister to "draw seven, keep three". */
export const SPORRAN_DRAW_COUNT = 7;
/** Number of cards the player keeps from the drawn hand. */
export const SPORRAN_PICK_COUNT = 3;

/**
 * Draw `drawCount` distinct cards from `pool` using `rng`. Fisher-Yates
 * over a defensive copy — the caller's `pool` is never mutated. If the
 * pool is smaller than `drawCount`, returns the whole pool (still
 * shuffled). Determinism: same seed + same pool order = same draw.
 */
export function drawSporran(
  rng: RNG,
  pool: readonly SporranCard[],
  drawCount: number = SPORRAN_DRAW_COUNT,
): SporranCard[] {
  const copy = pool.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    if (j !== i) {
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
  }
  const take = Math.min(Math.max(0, drawCount), copy.length);
  return copy.slice(0, take);
}

/**
 * Apply each picked card to the run's `RunModifiers` bag in pick order.
 * Mutates `modifiers` in place (matches the first-footing convention)
 * and returns a `SporranDraftResult` summarising side effects.
 *
 * Pick order matters for the recorded `appliedIds` (replay), but not
 * for the modifier outcome — every modifier delta is multiplicative
 * commutative. Heals accumulate additively.
 */
export function applySporranPicks(
  picks: readonly SporranCard[],
  modifiers: RunModifiers,
): SporranDraftResult {
  let totalHeal = 0;
  let totalDamageMult = 0;
  const ids: string[] = [];
  for (const card of picks) {
    const result = card.apply(modifiers);
    totalHeal += result.extraStartingHpHeal;
    totalDamageMult += result.extraDamageMultiplier;
    ids.push(card.id);
  }
  return {
    extraStartingHpHeal: totalHeal,
    extraDamageMultiplier: totalDamageMult,
    appliedIds: ids,
  };
}
