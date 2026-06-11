/**
 * Up Helly Aa Blessing — seasonal run-start hook.
 *
 * Up Helly Aa is the Shetland fire festival cycle — guizer brotherhoods
 * carry blazing torches in procession through the harbour, climaxing in
 * a Viking longship (the "galley") set ablaze and sunk in the bay. The
 * marquee event is the Lerwick festival on the **last Tuesday of January**
 * (Jan 25-31 across years), but the wider Shetland season runs through
 * February into early March: Cunningsburgh, Cullivoe (Yell), Norwick
 * (Unst), Bressay, Nesting/Girlsta, Uyeasound — eleven outlying community
 * fire festivals dot the calendar. The festival was formalised in 1881 by
 * Lerwick's young men taking the older yule-tar-barrelling tradition into
 * a structured procession.
 *
 * Window choice — Feb 9-15 (7 days). The marquee Lerwick event sits
 * SQUARELY inside Burns Night (Jan 18 - Feb 1) in real life; Shetlanders
 * do both back-to-back. Codebase pattern resolves overlapping events by
 * insertion order (`SeasonalEventManager.activeSeasonalEvents`), and Burns
 * Night was declared first — so a late-January Up Helly Aa window would
 * never fire. Feb 9-15 honours the broader Shetland season instead: it
 * sits cleanly between Imbolc (Feb 2-8) and Tartan Day (Apr 4-8) and
 * catches Cunningsburgh's mid-February event. The marquee Lerwick date
 * is acknowledged in flavour text + CLAUDE.md memory but not the runtime
 * window. SCOTTISH_RESEARCH_DEEP §1.6 (Shetland calendar);
 * DESIGN_IDEAS.md §12 (Up Helly Aa).
 *
 * Cultural framing: torchlight + brotherhood + Norse heritage. The galley
 * burns. Guizers march. The haggis swings harder for it. Banter rides
 * the procession (held torches, jarl's squad, the burn at the harbour
 * end), the Norn language echoes still in Shetland, and the comic
 * weight of being one wee creature on a moor where the men set ships
 * on fire to mark the dark half of the year. Hearth tone with one
 * grave-edge bite (h) for the longship's commitment-to-flame.
 *
 * Mechanic — thirteenth distinct blessing slot, distinct from the prior
 * twelve (Hogmanay first-footing, Beltane goldMult, Samhain pressure,
 * St Andrew's defence, Burns Night cooldown, Imbolc speed, Lammas XP,
 * Bracken-turn crit-CHANCE, Bannockburn lifesteal, Glorious Twelfth
 * AoE, Tartan Day pickup-radius, Simmer Dim crit-DAMAGE):
 *   - +18 HP heal post-spawn (the haggis takes the longship-warmth —
 *     larger heal than Simmer Dim's 12 because Up Helly Aa is
 *     festival-bright vs the solstice's quiet hold; symmetry with
 *     Up Helly Aa's 1881 formalisation date),
 *   - +0.18 additive damage-multiplier — the jarl's swing. First
 *     seasonal slot to touch `Player.addDamageMultiplier`. Distinct
 *     from Simmer Dim crit-DAMAGE (which only fires on crit hits) and
 *     Glorious Twelfth AoE (which widens the arc rather than the
 *     wallop). Pure flat damage uplift on every weapon hit. Composes
 *     cleanly with the existing rune / permanent / variant / passive
 *     / Clootie wrath damage stack the same way other player-side
 *     blessings do.
 *
 * Mirrors the Lammas / Bracken / Bannockburn / Glorious-Twelfth /
 * Tartan-Day / Simmer-Dim pattern of bypassing RunModifiers (which has
 * no damage-multiplier slot) and applying via the Player accessor.
 *
 * Refs: SCOTTISH_RESEARCH.md §1.6 (Shetland Up Helly Aa); SCOTTISH_
 * RESEARCH_DEEP.md §22.7 (Up Helly Aa procession + galley burn);
 * DESIGN_IDEAS.md §12 ("Up Helly Aa (last Tuesday of January) — Shetland
 * Viking fire festival. Longship burn event triggers.").
 */

import type { RunModifiers } from '../core/RunModifiers';

/** Additive damage-multiplier fraction applied during the Up Helly Aa window. */
export const UP_HELLY_AA_DAMAGE_BONUS = 0.18;
/** Post-spawn heal applied as the haggis takes the longship-warmth. */
export const UP_HELLY_AA_GALLEY_HEAL = 18;

export interface UpHellyAaBlessingResult {
  /** True when the blessing fired (caller shows toast + applies heal + damage-mult). */
  readonly applied: boolean;
  /** Heal amount in HP; non-zero only when `applied` is true. */
  readonly extraStartingHpHeal: number;
  /**
   * Additive damage-multiplier fraction the caller folds into the
   * player's damage-multiplier stack via `Player.addDamageMultiplier`.
   * 0 when not applied.
   */
  readonly extraDamageMultiplier: number;
}

/**
 * Apply the Up Helly Aa blessing when the seasonal event matches.
 * RunModifiers bag intentionally untouched — the damage-multiplier
 * bonus rides `Player.addDamageMultiplier` instead so it composes with
 * the existing stack (curse compose, Clootie wrath, runes, permanents,
 * variant + passive bonuses) the same way the other player-side
 * seasonal blessings do. Returns `{ applied: false, … }` for any other
 * event (or null) so callers branch identically to the other blessings.
 */
export function applyUpHellyAaBlessing(
  seasonalEventKey: string | null,
  _modifiers: RunModifiers,
): UpHellyAaBlessingResult {
  if (seasonalEventKey !== 'up_helly_aa') {
    return { applied: false, extraStartingHpHeal: 0, extraDamageMultiplier: 0 };
  }
  return {
    applied: true,
    extraStartingHpHeal: UP_HELLY_AA_GALLEY_HEAL,
    extraDamageMultiplier: UP_HELLY_AA_DAMAGE_BONUS,
  };
}
