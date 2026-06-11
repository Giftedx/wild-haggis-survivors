/**
 * St Andrew's Saltire Blessing — seasonal run-start hook.
 *
 * St Andrew's Day (Nov 30) is Scotland's national day. The patron
 * saint, the saltire, the diagonal cross of his crucifixion — all
 * of it gets a forgiving ±3-day window around the date itself.
 *
 * In WHS the saltire blesses the herd defensively. The cross above
 * the moor doesn't bring more enemies; it softens the ones who
 * arrive:
 *   - +20 HP heal post-spawn (the saint's hand on the brow),
 *   - damageTakenMult ×0.95 (the saltire deflects the worst hits).
 *
 * Distinct from Beltane (gold) and Samhain (more enemies). The
 * national-day blessing is steady protection — a quiet shield rather
 * than a spike.
 *
 * Pure helper — mirrors `beltaneBlessing.ts` and `samhainVeil.ts`.
 * No Phaser, no scene state. Caller (GameScene) decides whether to
 * apply (active event + Player constructed + resume gate).
 */

import type { RunModifiers } from '../core/RunModifiers';

/** Damage-taken multiplier applied during the St Andrew's window. */
export const STANDREWS_DAMAGE_TAKEN_MULT = 0.95;
/** Post-spawn heal applied under the saltire's protection. */
export const STANDREWS_BLESSING_HEAL = 20;

export interface StAndrewsBlessingResult {
  /** True when the blessing fired (caller shows toast + applies heal). */
  readonly applied: boolean;
  /** Heal amount in HP; non-zero only when `applied` is true. */
  readonly extraStartingHpHeal: number;
}

/**
 * Apply the St Andrew's saltire blessing to `modifiers` IN PLACE when
 * the seasonal event matches. Returns `{ applied: false, … }` for any
 * other event (or null) so callers branch cleanly.
 */
export function applyStAndrewsBlessing(
  seasonalEventKey: string | null,
  modifiers: RunModifiers,
): StAndrewsBlessingResult {
  if (seasonalEventKey !== 'st_andrews') {
    return { applied: false, extraStartingHpHeal: 0 };
  }
  modifiers.damageTakenMult *= STANDREWS_DAMAGE_TAKEN_MULT;
  return { applied: true, extraStartingHpHeal: STANDREWS_BLESSING_HEAL };
}
