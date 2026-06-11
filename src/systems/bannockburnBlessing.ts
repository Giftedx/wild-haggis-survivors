/**
 * Bannockburn Anniversary Blessing — seasonal run-start hook.
 *
 * Bannockburn (Jun 23–24, 1314) — Robert the Bruce's victory over
 * Edward II's army; the high-water mark of the First War of Scottish
 * Independence. Burns wrote "Scots, Wha Hae" (1793) about it; the
 * line "Scots, wha hae wi' Wallace bled" rides the burns_citation
 * `charge` sub-pool now wired to Drift Mastery's burst-edge.
 * Bannockburn-window runs synthesise: every G-press echoes the
 * battle-anthem on a Bannockburn run.
 *
 * Mechanic — distinct from the prior eight hooks (Hogmanay gift,
 * Beltane gold, Samhain pressure, St Andrew's defence, Burns Night
 * cooldown, Imbolc speed, Lammas XP, Bracken-turn crit):
 *   - +22 HP heal post-spawn (battlefield medic; national pride),
 *   - +0.5 additive lifesteal — every kill returns half a HP. The
 *     Player.addLifesteal accessor caps the running total at 3 HP/kill
 *     so the bonus composes safely with rune / permanent / variant
 *     lifesteal stacks the same way Lammas XP and Bracken crit do.
 *
 * Mirrors the Lammas + Bracken pattern of bypassing RunModifiers
 * (which has no lifesteal slot) and applying via the Player accessor.
 *
 * Cultural framing: the blessing is celebratory of Scottish
 * resilience, not anti-English. Banter and i18n stay focused on
 * Bruce, the field, and Burns's anthem; no contemporary politics.
 *
 * Refs: SCOTTISH_RESEARCH_DEEP.md §6.3 (Wars of Independence);
 * §17 (Burns "Scots, Wha Hae"); DESIGN_IDEAS.md §12 ("Bannockburn
 * anniversary (23–24 June) — victory-themed").
 */

import type { RunModifiers } from '../core/RunModifiers';

/** Additive lifesteal applied during the Bannockburn window. */
export const BANNOCKBURN_LIFESTEAL_BONUS = 0.5;
/** Post-spawn heal applied at the bardic pre-charge toast. */
export const BANNOCKBURN_FIELD_HEAL = 22;

export interface BannockburnBlessingResult {
  /** True when the blessing fired (caller shows toast + applies heal + lifesteal). */
  readonly applied: boolean;
  /** Heal amount in HP; non-zero only when `applied` is true. */
  readonly extraStartingHpHeal: number;
  /**
   * Additive lifesteal (HP-per-kill) the caller folds into the
   * player's lifesteal stack via `Player.addLifesteal`. 0 when
   * not applied.
   */
  readonly extraLifesteal: number;
}

/**
 * Apply the Bannockburn blessing when the seasonal event matches.
 * RunModifiers bag intentionally untouched — the lifesteal bonus
 * rides `Player.addLifesteal` so it composes with the existing
 * rune / permanent / variant lifesteal stack the same way Lammas XP
 * and Bracken crit do. Returns `{ applied: false, … }` for any
 * other event (or null) so callers branch identically to the
 * other blessings.
 */
export function applyBannockburnBlessing(
  seasonalEventKey: string | null,
  _modifiers: RunModifiers,
): BannockburnBlessingResult {
  if (seasonalEventKey !== 'bannockburn') {
    return { applied: false, extraStartingHpHeal: 0, extraLifesteal: 0 };
  }
  return {
    applied: true,
    extraStartingHpHeal: BANNOCKBURN_FIELD_HEAL,
    extraLifesteal: BANNOCKBURN_LIFESTEAL_BONUS,
  };
}
