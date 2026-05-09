/**
 * Tartan Day Blessing — seasonal run-start hook.
 *
 * Tartan Day (April 6) is the North-American diaspora's national-Scottish
 * holiday — the date is the Declaration of Arbroath signing in 1320, the
 * letter the Scots barons sent to Pope John XXII asserting Scotland's
 * independence. The US Senate recognised it in 1998, Canada earlier,
 * Australia and New Zealand celebrate it informally; the day's centre
 * of gravity is the diaspora itself remembering home.
 *
 * Window Apr 4–8 (5 days) — wider than the single-anniversary windows
 * (Bannockburn 4 days, Glorious Twelfth 3 days) because the diaspora
 * spans every time zone and the celebration is celebrated across a
 * weekend more often than not.
 *
 * Cultural framing: warmth, not flag-waving. The Declaration's most-
 * quoted line — "for as long as but a hundred of us remain alive,
 * never will we on any conditions be brought under English rule" — is
 * 1320 context, not a contemporary political stance. Banter and i18n
 * stay focused on the cloth, the cousins, and the line "for freedom
 * alone, which no honest man gives up but with life itself" (Arbroath).
 * No anti-English content. Per CULTURAL_SENSITIVITIES_RESEARCH.md §2.
 *
 * Mechanic — eleventh distinct blessing slot, distinct from the prior
 * ten (Hogmanay first-footing, Beltane goldMult, Samhain pressure, St
 * Andrew's defence, Burns Night cooldown, Imbolc speed, Lammas XP,
 * Bracken-turn crit, Bannockburn lifesteal, Glorious Twelfth AoE):
 *   - +14 HP heal post-spawn (the haggis takes the cloth — diaspora
 *     warmth, the moor reaches further),
 *   - +20 px additive pickup radius — gems, coins, polaroids, every
 *     world pickup pulls a touch farther all run. First seasonal slot
 *     to touch `Player.addPickupRadius`; the prior ten leave it at
 *     baseline. Eleventh distinct dimension in the cohort, which now
 *     covers (heal, gold, spawn-rate, damage-taken, weapon-CD, speed,
 *     XP, crit, lifesteal, AoE, pickup-radius).
 *
 * Mirrors the Lammas / Bracken / Bannockburn / Glorious-Twelfth pattern
 * of bypassing RunModifiers (which has no pickup-radius slot) and
 * applying via the Player accessor — composes cleanly with the
 * existing rune / permanent / variant / passive pickup-radius stack
 * the same way the other player-side blessings do.
 *
 * Refs: SCOTTISH_RESEARCH_DEEP.md §6.7 (Declaration of Arbroath); §14.5
 * (Scottish diaspora); DESIGN_IDEAS.md §12 ("Tartan Day (6 April,
 * North America diaspora) — diaspora-flavoured event" + "Declaration
 * of Arbroath anniversary (6 April) — overlaps Tartan Day. Narrative-
 * banter thread"). The two sketchpad rows bundle into one event.
 */

import type { RunModifiers } from '../core/RunModifiers';

/** Additive pickup-radius bonus in pixels applied during the Tartan Day window. */
export const TARTAN_DAY_PICKUP_BONUS_PX = 20;
/** Post-spawn heal applied as the haggis takes the cloth on Tartan Day. */
export const TARTAN_DAY_DIASPORA_HEAL = 14;

export interface TartanDayBlessingResult {
  /** True when the blessing fired (caller shows toast + applies heal + pickup-radius). */
  readonly applied: boolean;
  /** Heal amount in HP; non-zero only when `applied` is true. */
  readonly extraStartingHpHeal: number;
  /**
   * Additive pickup-radius bonus in pixels the caller folds into the
   * player's pickup-radius stack via `Player.addPickupRadius`. 0 when
   * not applied.
   */
  readonly extraPickupRadius: number;
}

/**
 * Apply the Tartan Day blessing when the seasonal event matches.
 * RunModifiers bag intentionally untouched — the pickup-radius bonus
 * rides `Player.addPickupRadius` instead so it composes with the
 * existing rune / permanent / variant / passive pickup-radius stack
 * the same way the other player-side seasonal blessings do. Returns
 * `{ applied: false, … }` for any other event (or null) so callers
 * branch identically to the other blessings.
 */
export function applyTartanDayBlessing(
  seasonalEventKey: string | null,
  _modifiers: RunModifiers,
): TartanDayBlessingResult {
  if (seasonalEventKey !== 'tartan_day') {
    return { applied: false, extraStartingHpHeal: 0, extraPickupRadius: 0 };
  }
  return {
    applied: true,
    extraStartingHpHeal: TARTAN_DAY_DIASPORA_HEAL,
    extraPickupRadius: TARTAN_DAY_PICKUP_BONUS_PX,
  };
}
