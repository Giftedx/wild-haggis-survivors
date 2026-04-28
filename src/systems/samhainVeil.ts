/**
 * Samhain Veil Blessing — seasonal run-start hook.
 *
 * Samhain is the Gaelic festival marking the end of harvest and the
 * start of winter (Oct 28 – Nov 3 around Nov 1). The defining motif
 * is the thinning of the veil between living and dead — the
 * Cailleach ascends; the dead walk; bonfires keep them honest.
 * Pictish-pagan origin, Christianised as All Hallows.
 *
 * In WHS the wild haggis feels the thinning at the run start. The
 * veil does NOT bring favour — it brings *more*. Every shipping moor
 * already has midges, kelpies, and worse; Samhain wakes them all a
 * little earlier:
 *   - +25 HP heal post-spawn (the bonfires hearten the herd),
 *   - spawnIntervalMult ×1.05 (the veil thins; the dead come through
 *     faster).
 *
 * Net: a slightly busier run with a larger HP cushion at the front.
 * The increased pressure is the soulful part — Samhain isn't a gift,
 * it's an acknowledgement that the herd is being walked through a
 * thinner place. The toast confirms what the player feels.
 *
 * Pure helper — mirrors `beltaneBlessing.ts` shape. No Phaser, no
 * scene state. Caller (GameScene) decides whether to apply (active
 * event + Player constructed + resume gate).
 */

import type { RunModifiers } from '../core/RunModifiers';

/** Spawn-interval multiplier applied during the Samhain window. */
export const SAMHAIN_SPAWN_MULT = 1.05;
/** Post-spawn heal applied when the veil thins around the herd. */
export const SAMHAIN_VEIL_HEAL = 25;

export interface SamhainVeilResult {
  /** True when the blessing fired (caller shows toast + applies heal). */
  readonly applied: boolean;
  /** Heal amount in HP; non-zero only when `applied` is true. */
  readonly extraStartingHpHeal: number;
}

/**
 * Apply the Samhain veil blessing to `modifiers` IN PLACE when the
 * seasonal event matches. Returns `{ applied: false, … }` for any
 * other event (or null) so callers branch cleanly.
 */
export function applySamhainVeil(
  seasonalEventKey: string | null,
  modifiers: RunModifiers,
): SamhainVeilResult {
  if (seasonalEventKey !== 'samhain') {
    return { applied: false, extraStartingHpHeal: 0 };
  }
  modifiers.spawnIntervalMult *= SAMHAIN_SPAWN_MULT;
  return { applied: true, extraStartingHpHeal: SAMHAIN_VEIL_HEAL };
}
