/**
 * Bracken-turn Blessing — seasonal run-start hook.
 *
 * Bracken-turn (Nov 4 – Nov 26) is the autumn cusp when the moor's
 * bracken fronds shift from green through copper to bronze, and the
 * first frost edges through. Sits between Samhain (Oct 28 – Nov 3)
 * and St Andrew's Day (Nov 27 – Dec 3) — the cohort's quiet
 * shoulder season, claimed for a tonal palette shift in DESIGN_IDEAS
 * §12 ("Bracken-turn — moor palette shifts to copper-bronze. XP
 * bonus.").
 *
 * Mechanic — distinct from the prior seven hooks (Hogmanay gift,
 * Beltane gold, Samhain pressure, St Andrew's defence, Burns Night
 * cooldown, Imbolc speed, Lammas XP):
 *   - +13 HP heal post-spawn (first-frost warm coat),
 *   - +0.05 additive crit chance — bracken-bronze hardness reads as
 *     a sharper edge in the haggis. First seasonal slot to touch
 *     `Player.addCritChance`; the prior eight slots leave it at
 *     baseline.
 *
 * Mirrors the Lammas pattern of bypassing RunModifiers (which has
 * no crit slot) and applying via the Player accessor — composes
 * cleanly with the existing rune / permanent / variant crit stack.
 *
 * Refs: SCOTTISH_RESEARCH.md §1 (moor palette / phenology);
 * SCOTTISH_RESEARCH_DEEP.md §13 (autumn-edge folk markers);
 * DESIGN_IDEAS.md §12 ("Bracken-turn (October–November) — moor
 * palette shifts to copper-bronze. XP bonus" — XP slot is taken by
 * Lammas; reframed as crit because the colour reads sharp).
 */

import type { RunModifiers } from '../core/RunModifiers';

/** Additive crit-chance fraction applied during the Bracken-turn window. */
export const BRACKEN_CRIT_BONUS = 0.05;
/** Post-spawn heal applied at first-frost warmth. */
export const BRACKEN_FROST_HEAL = 13;

export interface BrackenTurnBlessingResult {
  /** True when the blessing fired (caller shows toast + applies heal + crit). */
  readonly applied: boolean;
  /** Heal amount in HP; non-zero only when `applied` is true. */
  readonly extraStartingHpHeal: number;
  /**
   * Additive crit-chance fraction the caller folds into the player's
   * crit stack via `Player.addCritChance`. 0 when not applied.
   */
  readonly extraCritChance: number;
}

/**
 * Apply the Bracken-turn blessing when the seasonal event matches.
 * RunModifiers bag intentionally untouched — the crit bonus rides
 * `Player.addCritChance` instead so it composes with the existing
 * rune / permanent / variant crit stack the same way Lammas's XP
 * bonus does. Returns `{ applied: false, … }` for any other event
 * (or null) so callers branch identically to the other blessings.
 */
export function applyBrackenTurnBlessing(
  seasonalEventKey: string | null,
  _modifiers: RunModifiers,
): BrackenTurnBlessingResult {
  if (seasonalEventKey !== 'bracken_turn') {
    return { applied: false, extraStartingHpHeal: 0, extraCritChance: 0 };
  }
  return {
    applied: true,
    extraStartingHpHeal: BRACKEN_FROST_HEAL,
    extraCritChance: BRACKEN_CRIT_BONUS,
  };
}
