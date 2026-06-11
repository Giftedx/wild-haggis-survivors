/**
 * Glorious Twelfth Blessing — seasonal run-start hook.
 *
 * The Glorious Twelfth (Aug 12) opens the UK red-grouse-shooting
 * season — three days, Aug 11–13 in WHS, sliced cleanly between
 * Lammas (Jul 29 – Aug 4) and Bracken-turn (Nov 4 – Nov 26). The
 * Lammas comment in `SeasonalEventManager.ts` already names this
 * date as a future "tourist-hunter intensification slot"; this hook
 * fills the slot.
 *
 * Cultural framing: the moor on the Twelfth is loud — tourists in
 * tweed fan out, dogs in the heather, shotguns over the brae. The
 * haggis answers diegetically: it widens its arc, eats wider, walks
 * wider. The blessing is the haggis going to ground while the
 * surface gets busy. No anti-hunter venom, no class polemic — the
 * existing tourist + haggis_hunter enemies already carry the comic
 * register; the seasonal banter rides the same warmth.
 *
 * Mechanic — distinct from the prior nine hooks (Hogmanay gift,
 * Beltane gold, Samhain pressure, St Andrew's defence, Burns Night
 * cooldown, Imbolc speed, Lammas XP, Bracken-turn crit, Bannockburn
 * lifesteal):
 *   - +16 HP heal post-spawn (the haggis stocks up before the moor
 *     gets noisy),
 *   - +0.10 additive AoE multiplier — every weapon's area of effect
 *     widens 10% all run. First seasonal slot to touch
 *     `Player.addAoeMultiplier`; the prior nine leave it at
 *     baseline. Tenth distinct dimension in the cohort, which now
 *     covers (heal, gold, spawn-rate, damage-taken, weapon-CD,
 *     speed, XP, crit, lifesteal, AoE).
 *
 * Mirrors the Lammas / Bracken / Bannockburn pattern of bypassing
 * RunModifiers (which has no AoE slot) and applying via the Player
 * accessor — composes cleanly with the existing rune / permanent /
 * variant / passive AoE stack the same way the other player-side
 * blessings do.
 *
 * Refs: SCOTTISH_RESEARCH_DEEP.md §6.10 (sporting estates / grouse
 * moors); §22.3 (Highland Games / sporting calendar);
 * DESIGN_IDEAS.md §12 ("Glorious Twelfth (12 August) — grouse-
 * shooting season opens; tourist-hunter enemies appear more
 * frequently. Meta: haggis hunters are *extra* active this week").
 */

import type { RunModifiers } from '../core/RunModifiers';

/** Additive AoE multiplier fraction applied during the Glorious Twelfth window. */
export const GLORIOUS_TWELFTH_AOE_BONUS = 0.10;
/** Post-spawn heal applied as the haggis stocks up before the moor gets noisy. */
export const GLORIOUS_TWELFTH_STOCKUP_HEAL = 16;

export interface GloriousTwelfthBlessingResult {
  /** True when the blessing fired (caller shows toast + applies heal + AoE). */
  readonly applied: boolean;
  /** Heal amount in HP; non-zero only when `applied` is true. */
  readonly extraStartingHpHeal: number;
  /**
   * Additive AoE-multiplier fraction the caller folds into the
   * player's AoE stack via `Player.addAoeMultiplier`. 0 when not
   * applied.
   */
  readonly extraAoeMultiplier: number;
}

/**
 * Apply the Glorious Twelfth blessing when the seasonal event matches.
 * RunModifiers bag intentionally untouched — the AoE bonus rides
 * `Player.addAoeMultiplier` instead so it composes with the existing
 * rune / permanent / variant / passive AoE stack the same way the
 * other player-side seasonal blessings do. Returns
 * `{ applied: false, … }` for any other event (or null) so callers
 * branch identically to the other blessings.
 */
export function applyGloriousTwelfthBlessing(
  seasonalEventKey: string | null,
  _modifiers: RunModifiers,
): GloriousTwelfthBlessingResult {
  if (seasonalEventKey !== 'glorious_twelfth') {
    return { applied: false, extraStartingHpHeal: 0, extraAoeMultiplier: 0 };
  }
  return {
    applied: true,
    extraStartingHpHeal: GLORIOUS_TWELFTH_STOCKUP_HEAL,
    extraAoeMultiplier: GLORIOUS_TWELFTH_AOE_BONUS,
  };
}
