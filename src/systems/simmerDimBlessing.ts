/**
 * Simmer Dim Blessing — seasonal run-start hook.
 *
 * Simmer Dim ("summer dim") is the Shetlandic / Orcadian phrase for the
 * perpetual twilight of Scottish midsummer at high latitudes. North of
 * 60°N the sun barely sets between mid-June and early July; the night
 * never fully darkens, the gloaming holds. The phenomenon peaks at the
 * summer solstice (21 June). Window Jun 18–21 (4 days, anchored on the
 * solstice with a 3-day lead-in) — narrowed past the typical 5-day
 * single-anniversary band to dodge Bannockburn (Jun 22–25), which sits
 * the day after the solstice. Per `SeasonalEventManager.ts` doc:
 * "the calendar is designed to avoid [overlaps]".
 *
 * Cultural framing: hush, not festival. The simmer dim is a quiet
 * phenomenon — the moor doesn't go dark, the hares stay out, the
 * light waits at the horizon. Banter rides the held-light, the
 * solstice quiet, and the fey-ring caution that midsummer carries
 * across Scottish folklore. SCS overlay stays in general Scots
 * register (not Shetlandic-specific), since the Peerie Shetlander
 * variant carries the dedicated Shetlandic content; the phrase
 * "Simmer Dim" is recognised across Scotland as the name for the
 * phenomenon and reads correctly in any Scots register.
 *
 * Mechanic — twelfth distinct blessing slot, distinct from the prior
 * eleven (Hogmanay first-footing, Beltane goldMult, Samhain pressure,
 * St Andrew's defence, Burns Night cooldown, Imbolc speed, Lammas XP,
 * Bracken-turn crit-CHANCE, Bannockburn lifesteal, Glorious Twelfth
 * AoE, Tartan Day pickup-radius):
 *   - +12 HP heal post-spawn (the haggis takes the held light, modest
 *     heal — solstice is quiet not abundant),
 *   - +0.25 additive crit-DAMAGE multiplier — when the strike lands,
 *     it lands harder. First seasonal slot to touch
 *     `Player.addCritDamageMultiplier` (Bracken-turn rides crit
 *     CHANCE via `addCritChance`, a different stat — chance to
 *     trigger vs damage when triggered). Twelfth distinct dimension
 *     in the cohort, which now covers (heal, gold, spawn-rate,
 *     damage-taken, weapon-CD, speed, XP, crit-chance, lifesteal,
 *     AoE, pickup-radius, crit-damage).
 *
 * Mirrors the Lammas / Bracken / Bannockburn / Glorious-Twelfth /
 * Tartan-Day pattern of bypassing RunModifiers (which has no crit-
 * damage slot) and applying via the Player accessor — composes
 * cleanly with the existing rune / permanent / variant / passive
 * crit-damage stack the same way the other player-side blessings do.
 *
 * Refs: SCOTTISH_RESEARCH.md §1.6 (Shetland simmer dim); SCOTTISH_
 * RESEARCH_DEEP.md §22.6 (solstice / simmer dim); DESIGN_IDEAS.md
 * §12 ("Summer Solstice / Simmer Dim (21 June) — extended twilight
 * palette in Shetland biome").
 */

import type { RunModifiers } from '../core/RunModifiers';

/** Additive crit-damage multiplier fraction applied during the Simmer Dim window. */
export const SIMMER_DIM_CRIT_DAMAGE_BONUS = 0.25;
/** Post-spawn heal applied as the haggis takes the held light on the solstice. */
export const SIMMER_DIM_SOLSTICE_HEAL = 12;

export interface SimmerDimBlessingResult {
  /** True when the blessing fired (caller shows toast + applies heal + crit-damage). */
  readonly applied: boolean;
  /** Heal amount in HP; non-zero only when `applied` is true. */
  readonly extraStartingHpHeal: number;
  /**
   * Additive crit-damage multiplier fraction the caller folds into
   * the player's crit-damage stack via `Player.addCritDamageMultiplier`.
   * 0 when not applied.
   */
  readonly extraCritDamageMultiplier: number;
}

/**
 * Apply the Simmer Dim blessing when the seasonal event matches.
 * RunModifiers bag intentionally untouched — the crit-damage bonus
 * rides `Player.addCritDamageMultiplier` instead so it composes with
 * the existing rune / permanent / variant / passive crit-damage stack
 * the same way the other player-side seasonal blessings do. Returns
 * `{ applied: false, … }` for any other event (or null) so callers
 * branch identically to the other blessings.
 */
export function applySimmerDimBlessing(
  seasonalEventKey: string | null,
  _modifiers: RunModifiers,
): SimmerDimBlessingResult {
  if (seasonalEventKey !== 'simmer_dim') {
    return { applied: false, extraStartingHpHeal: 0, extraCritDamageMultiplier: 0 };
  }
  return {
    applied: true,
    extraStartingHpHeal: SIMMER_DIM_SOLSTICE_HEAL,
    extraCritDamageMultiplier: SIMMER_DIM_CRIT_DAMAGE_BONUS,
  };
}
