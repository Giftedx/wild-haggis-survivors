/**
 * Burns Night Bardic Blessing — seasonal run-start hook.
 *
 * Burns Night (Jan 18 – Feb 1, around Robert Burns's birthday on
 * Jan 25) honours the Ayrshire bard. Burns wrote *Address to a
 * Haggis* in 1786 — every Burns Supper since has piped the haggis
 * in, addressed it, sliced it open, dined. The haggis is the
 * national poet's chosen subject; on Burns Night the haggis fights
 * with bardic pride.
 *
 * Mechanic — distinct from the four other seasonal hooks (Hogmanay
 * gift roll, Beltane gold, Samhain pressure, St Andrew's defence):
 *   - +18 HP heal post-spawn (the toast at the supper),
 *   - weaponCooldownMult ×0.95 (the verse quickens the verse — every
 *     weapon fires 5% faster all run).
 *
 * Burns is the only seasonal event that *also* gates a variant
 * unlock — Burns's Wee Beastie at `burns_night_full_evo`. The two
 * coexist: the run-start blessing fires every run inside the
 * window; the variant unlock is the rare prize for completing a
 * full-evo run on Burns Night specifically. No interference.
 *
 * Pure helper — mirrors `samhainVeil.ts` and `standrewsBlessing.ts`.
 * No Phaser, no scene state.
 */

import type { RunModifiers } from '../core/RunModifiers';

/** Weapon-cooldown multiplier applied during the Burns Night window. */
export const BURNS_WEAPON_COOLDOWN_MUL = 0.95;
/** Post-spawn heal applied at the bardic toast. */
export const BURNS_BARDIC_HEAL = 18;

export interface BurnsNightBlessingResult {
  /** True when the blessing fired (caller shows toast + applies heal). */
  readonly applied: boolean;
  /** Heal amount in HP; non-zero only when `applied` is true. */
  readonly extraStartingHpHeal: number;
}

/**
 * Apply the Burns Night bardic blessing to `modifiers` IN PLACE
 * when the seasonal event matches. Returns `{ applied: false, … }`
 * for any other event (or null) so callers branch cleanly.
 */
export function applyBurnsNightBlessing(
  seasonalEventKey: string | null,
  modifiers: RunModifiers,
): BurnsNightBlessingResult {
  if (seasonalEventKey !== 'burns_night') {
    return { applied: false, extraStartingHpHeal: 0 };
  }
  modifiers.weaponCooldownMult *= BURNS_WEAPON_COOLDOWN_MUL;
  return { applied: true, extraStartingHpHeal: BURNS_BARDIC_HEAL };
}
