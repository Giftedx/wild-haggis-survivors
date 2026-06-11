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
import type { VariantKey, VariantProgressSnapshot } from '../data/variants';

/** Three families of card. Each maps to a Voice Card register. */
export type SporranCardKind = 'curse' | 'boon' | 'quirk';

/**
 * Phase 3 — gating predicate for a card. Sister to `VariantUnlockCondition`
 * (`src/data/variants.ts`): a discriminated union evaluated against an
 * eligibility context built once per draft. A card with `eligibility`
 * absent (or `{ type: 'always' }`) is always drawable; everything else
 * is filtered out at draw-time when the context says so.
 *
 * Three gates today:
 * - `deed` — a `VariantProgressSnapshot` threshold (lifetime stat)
 * - `seasonal` — the active SeasonalEvent key matches `eventKey`
 * - `variant` — the player's currently selected variant matches
 *
 * Future gates (curse-completed, achievement-unlocked) extend the union
 * additively. Filter callers stay forward-compatible: an unrecognised
 * gate returns `false` (ineligible) so a legacy save can never accidentally
 * draw a card from a future patch.
 */
export type SporranEligibility =
  | { readonly type: 'always' }
  | { readonly type: 'deed'; readonly condition: SporranDeedCondition }
  | { readonly type: 'seasonal'; readonly eventKey: string }
  | { readonly type: 'variant'; readonly variantKey: VariantKey };

/**
 * Deed-gating predicate. Sister to `VariantUnlockCondition` — same shape
 * but a strict subset (sporran rares are smaller-stakes than variant
 * unlocks). Add new types here as more lifetime stats become useful
 * gates. Reuses `VariantProgressSnapshot` so save-side coercion + the
 * MenuScene unlock summary keep paying for themselves.
 */
export type SporranDeedCondition =
  | { readonly type: 'victories'; readonly required: number }
  | { readonly type: 'cursed_victories'; readonly required: number }
  | { readonly type: 'best_kills'; readonly required: number }
  | { readonly type: 'burns_night_full_evo'; readonly required: number };

/**
 * Eligibility context — passed once into `filterEligibleSporranCards`
 * before the draw. Built from save state in `SporranScene.create()`;
 * tests pass synthetic contexts directly.
 */
export interface SporranEligibilityContext {
  readonly progress: VariantProgressSnapshot;
  /** Result of `getActiveSeasonalEventKey(now, disabled)` at draft time. */
  readonly activeSeasonalEventKey: string | null;
  /** Player's currently selected variant. */
  readonly variantKey: VariantKey;
}

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
  /**
   * Phase 3 — optional draw-time gate. Absent = `{ type: 'always' }`. A
   * gated card is excluded from the pool when the eligibility context
   * doesn't satisfy the gate.
   */
  readonly eligibility?: SporranEligibility;
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
 * Phase 3 — evaluate one card's eligibility against a context. Pure;
 * tests pass synthetic contexts. An absent `eligibility` field is
 * always-true (back-compat with Phase 0 cards). Unrecognised gate types
 * fall through to `false` so a save authored on a future patch never
 * accidentally draws a card whose gate the running build can't reason
 * about.
 */
export function isSporranCardEligible(
  card: SporranCard,
  ctx: SporranEligibilityContext,
): boolean {
  const gate = card.eligibility;
  if (!gate || gate.type === 'always') return true;
  if (gate.type === 'variant') return ctx.variantKey === gate.variantKey;
  if (gate.type === 'seasonal') return ctx.activeSeasonalEventKey === gate.eventKey;
  if (gate.type === 'deed') {
    const c = gate.condition;
    switch (c.type) {
      case 'victories':
        return ctx.progress.victories >= c.required;
      case 'cursed_victories':
        return (ctx.progress.cursedVictories ?? 0) >= c.required;
      case 'best_kills':
        return ctx.progress.bestKills >= c.required;
      case 'burns_night_full_evo':
        return (ctx.progress.burnsNightFullEvoRuns ?? 0) >= c.required;
    }
  }
  return false;
}

/**
 * Phase 3 — filter a card pool to only the eligible entries. Compose
 * with `drawSporran` at the call site:
 * `drawSporran(rng, filterEligibleSporranCards(ALL, ctx))`.
 * Order of the input pool is preserved (filter, not shuffle) so the
 * draw RNG remains the only source of order.
 */
export function filterEligibleSporranCards(
  pool: readonly SporranCard[],
  ctx: SporranEligibilityContext,
): SporranCard[] {
  return pool.filter((c) => isSporranCardEligible(c, ctx));
}

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
