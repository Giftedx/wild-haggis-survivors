/**
 * Beltane Twin-Fire Blessing — seasonal run-start hook.
 *
 * Beltane is the Gaelic fire festival marking the start of summer
 * (Apr 28 – May 4 around May 1). The most-cited custom is driving
 * cattle between two bonfires for purification before the summer
 * pastures. In WHS the wild haggis is the herd; passing through
 * the twin fires at run start grants:
 *   - a small starting heal (purification),
 *   - a run-long goldMult ×1.10 (cattle prosperity).
 *
 * Unlike Hogmanay's first-footing (`firstFooting.ts`), Beltane is a
 * single fixed blessing — no roll, no choice. The fire festival
 * doesn't pick favourites; it walks the whole herd through the same
 * fire. The toast is a single Hearth-warm line.
 *
 * Pure helper — no Phaser, no scene state. Caller (GameScene)
 * decides whether to apply (active event + Player constructed +
 * resume gate). The opt-out path flows through caller —
 * `disableSeasonalEvents` returns null upstream so this module
 * never sees 'beltane' on an opt-out save.
 */

import type { RunModifiers } from '../core/RunModifiers';

/** Fixed gold multiplier applied for the run on Beltane blessing. */
export const BELTANE_GOLD_MULT = 1.10;
/** Post-spawn heal applied when the player walks through the twin fires. */
export const BELTANE_PURIFICATION_HEAL = 15;

export interface BeltaneBlessingResult {
  /** True when the blessing fired (caller shows toast + applies heal). */
  readonly applied: boolean;
  /** Heal amount in HP; non-zero only when `applied` is true. */
  readonly extraStartingHpHeal: number;
}

/**
 * Apply the Beltane twin-fire blessing to `modifiers` IN PLACE when
 * the seasonal event matches. Returns `{ applied: false, … }` for
 * any other event (or null) so callers branch cleanly.
 */
export function applyBeltaneBlessing(
  seasonalEventKey: string | null,
  modifiers: RunModifiers,
): BeltaneBlessingResult {
  if (seasonalEventKey !== 'beltane') {
    return { applied: false, extraStartingHpHeal: 0 };
  }
  modifiers.goldMult *= BELTANE_GOLD_MULT;
  return { applied: true, extraStartingHpHeal: BELTANE_PURIFICATION_HEAL };
}
