/**
 * Highland Games Blessing — seasonal run-start hook.
 *
 * The Highland Games (Aug 25 – Sep 7) cover both the Cowal Highland
 * Gathering (late August, world's largest) and the Braemar Gathering
 * (early September, attended by the Royal Family since Queen Victoria's
 * time). The gatherings celebrate strength, skill, and endurance:
 * caber toss, hammer throw, stone put, sheaf toss, Highland dancing,
 * pipe-band competitions.
 *
 * Mechanic — distinct from all prior slots:
 *   - +20 max HP (Highland physique — the athletes at the Games are
 *     the strongest people on the moor; their strength lends a run-long
 *     health bonus). First seasonal slot to touch `Player.addMaxHp`.
 *   - +16 HP heal on top (the pre-Games morning porridge; distinct
 *     from the max-HP increase, which also heals by design in addMaxHp).
 *
 * Pure helper. Refs: SCOTTISH_RESEARCH_DEEP §22.3 (Highland Games
 * history — Tailteann roots, Queen Victoria, Braemar tradition);
 * SCOTTISH_RESEARCH §1 (shinty/camanachd lineage).
 */

import type { RunModifiers } from '../core/RunModifiers';

/** Max HP added at run start during the Highland Games window. */
export const HIGHLAND_GAMES_MAX_HP_BONUS = 20;
/** Post-spawn heal applied alongside the max-HP bonus. */
export const HIGHLAND_GAMES_HEAL = 16;

export interface HighlandGamesBlessingResult {
  /** True when the blessing fired. */
  readonly applied: boolean;
  /** Extra max HP added to Player; 0 when not applied. */
  readonly extraMaxHp: number;
  /** Post-spawn heal; 0 when not applied. */
  readonly extraStartingHpHeal: number;
}

/**
 * Apply the Highland Games blessing when the seasonal event matches.
 * `RunModifiers` is intentionally untouched — the max-HP bonus rides
 * `Player.addMaxHp` at post-spawn time so the run-base stats stay clean.
 */
export function applyHighlandGamesBlessing(
  seasonalEventKey: string | null,
  _modifiers: RunModifiers,
): HighlandGamesBlessingResult {
  if (seasonalEventKey !== 'highland_games') {
    return { applied: false, extraMaxHp: 0, extraStartingHpHeal: 0 };
  }
  return {
    applied: true,
    extraMaxHp: HIGHLAND_GAMES_MAX_HP_BONUS,
    extraStartingHpHeal: HIGHLAND_GAMES_HEAL,
  };
}
