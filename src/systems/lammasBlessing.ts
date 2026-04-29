/**
 * Lùnastal / Lammas Harvest Blessing — seasonal run-start hook.
 *
 * Lùnastal (Aug 1; window Jul 29 – Aug 4 here) is the Gaelic festival
 * of the harvest's first cutting. Named after the god Lugh, who held
 * funeral games for his foster-mother Tailtiu after she died of
 * exhaustion clearing the plains of Ireland for agriculture. In
 * Scotland the day is "Lammas" — Old English *hlafmæsse*, "loaf-mass",
 * marking the bread baked from the first sheaves.
 *
 * Mechanic — distinct from the prior six hooks (Hogmanay gift,
 * Beltane gold, Samhain pressure, St Andrew's defence, Burns Night
 * cooldown, Imbolc speed):
 *   - +14 HP heal post-spawn (the harvest loaf shared at the cairn),
 *   - +10% additive XP multiplier (the bounty cuts cleaner — first
 *     seasonal slot to touch XP gain, all six prior slots leave
 *     `Player.bonusXpMultiplier` at identity).
 *
 * Pure helper — mirrors `imbolcBlessing.ts` and the other five.
 * Caller passes the player through the result object so the additive
 * XP bump folds into the existing `Player.addXpMultiplier` API
 * without leaking through `RunModifiers` (which has no XP slot —
 * adding one would require touching every consumer; this stays
 * compositional with the existing accessor).
 *
 * Refs: SCOTTISH_RESEARCH.md §1 (Lùnastal / Tailteann games);
 * SCOTTISH_RESEARCH_DEEP.md §13.4 (Lammas + cornkist / first-fruits);
 * DESIGN_IDEAS.md §12 ("Lùnastal / Lammas — harvest-start season").
 */

import type { RunModifiers } from '../core/RunModifiers';

/** Additive XP multiplier (fraction) applied during the Lammas window. */
export const LAMMAS_XP_MULT_BONUS = 0.10;
/** Post-spawn heal applied at the harvest-loaf blessing. */
export const LAMMAS_HARVEST_HEAL = 14;

export interface LammasBlessingResult {
  /** True when the blessing fired (caller shows toast + applies heal + XP). */
  readonly applied: boolean;
  /** Heal amount in HP; non-zero only when `applied` is true. */
  readonly extraStartingHpHeal: number;
  /**
   * Additive XP multiplier fraction the caller folds into the player's
   * `bonusXpMultiplier` via `Player.addXpMultiplier`. 0 when not applied.
   */
  readonly extraXpMultiplier: number;
}

/**
 * Apply the Lammas harvest blessing when the seasonal event matches.
 * Modifiers bag is intentionally untouched — the XP bonus rides the
 * Player accessor instead so the existing rune/permanent/variant XP
 * stack composes cleanly. Returns `{ applied: false, … }` for any
 * other event (or null) so callers branch identically to the other
 * blessing helpers.
 */
export function applyLammasBlessing(
  seasonalEventKey: string | null,
  _modifiers: RunModifiers,
): LammasBlessingResult {
  if (seasonalEventKey !== 'lammas') {
    return { applied: false, extraStartingHpHeal: 0, extraXpMultiplier: 0 };
  }
  return {
    applied: true,
    extraStartingHpHeal: LAMMAS_HARVEST_HEAL,
    extraXpMultiplier: LAMMAS_XP_MULT_BONUS,
  };
}
