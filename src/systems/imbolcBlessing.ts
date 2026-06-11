/**
 * Imbolc Brigid Blessing — seasonal run-start hook.
 *
 * Imbolc (Feb 1, traditionally; window Feb 2 – Feb 8 here so it sits
 * just past the Burns Night close on Feb 1) marks the Gaelic first-
 * of-spring. The name comes from "i mbolg" — *in the belly* —
 * referring to pregnant ewes whose lambing season opens. Brigid /
 * Brìde, the Gaelic triple-goddess of healing, smithcraft, and
 * fire-of-hearth, claims the date; her mantle (`brat Brìde`) was
 * traditionally left out overnight for healing power.
 *
 * Mechanic — distinct from the five other seasonal hooks (Hogmanay
 * gift roll, Beltane gold, Samhain pressure, St Andrew's defence,
 * Burns Night cooldown):
 *   - +12 HP heal post-spawn (Brigid's mantle warmth),
 *   - moveSpeedMult ×1.05 (lambing season's quick energy — first
 *     speed-touching seasonal slot, all five prior slots leave
 *     `moveSpeedMult` at identity).
 *
 * Pure helper — mirrors `burnsNightBlessing.ts` shape exactly. No
 * Phaser, no scene state.
 *
 * Refs: SCOTTISH_RESEARCH.md §1 (Brigid / Brìde); DESIGN_IDEAS.md
 * §12 ("Imbolc — Brigid's-Day seasonal").
 */

import type { RunModifiers } from '../core/RunModifiers';

/** Move-speed multiplier applied during the Imbolc window. */
export const IMBOLC_MOVE_SPEED_MUL = 1.05;
/** Post-spawn heal applied at Brigid's-mantle blessing. */
export const IMBOLC_BRIGID_HEAL = 12;

export interface ImbolcBlessingResult {
  /** True when the blessing fired (caller shows toast + applies heal). */
  readonly applied: boolean;
  /** Heal amount in HP; non-zero only when `applied` is true. */
  readonly extraStartingHpHeal: number;
}

/**
 * Apply the Imbolc Brigid blessing to `modifiers` IN PLACE when the
 * seasonal event matches. Returns `{ applied: false, … }` for any
 * other event (or null) so callers branch cleanly.
 */
export function applyImbolcBlessing(
  seasonalEventKey: string | null,
  modifiers: RunModifiers,
): ImbolcBlessingResult {
  if (seasonalEventKey !== 'imbolc') {
    return { applied: false, extraStartingHpHeal: 0 };
  }
  modifiers.moveSpeedMult *= IMBOLC_MOVE_SPEED_MUL;
  return { applied: true, extraStartingHpHeal: IMBOLC_BRIGID_HEAL };
}
