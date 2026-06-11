/**
 * Culloden Memorial — seasonal run-start hook.
 *
 * Culloden Moor, 16 April 1746. The last pitched battle on British
 * soil; the Jacobite Rising crushed in under an hour. 1,500–2,000
 * Jacobites died on Drumrossie. The aftermath — suppression of the
 * clan system, the Dress Act, the beginning of the Clearances — ran
 * for decades more.
 *
 * This is NOT a celebration and carries NO gameplay buff. A quiet
 * memorial toast fires at run start to mark the day. The haggis is
 * a moor-witness, not a partisan. The banter pool (seasonal_event.
 * culloden.*) carries the grave register across 12 leaves.
 *
 * Cultural framing:
 *   - Grave register only; no hearth warmth, no comedic distance.
 *   - No anti-English content; no Jacobite romanticism.
 *   - No contemporary political stance.
 *   - The moor remembers — the haggis witnesses.
 *
 * Ref: SCOTTISH_RESEARCH_DEEP.md §6.9 (Culloden / Jacobite Rising);
 * DESIGN_IDEAS.md §12 (Culloden anniversary — "sombre, respectfully
 * handled").
 */

import type { RunModifiers } from '../core/RunModifiers';

export interface CullodenMemorialResult {
  /** True when the memorial fired (caller shows toast). */
  readonly applied: boolean;
  /** Always 0 — no gameplay boon on a memorial day. */
  readonly extraStartingHpHeal: number;
}

/**
 * Returns `{ applied: true, extraStartingHpHeal: 0 }` when the
 * active seasonal event is 'culloden'. The caller uses `applied`
 * to build the plan's toast; no RunModifiers mutation occurs.
 */
export function applyCullodenMemorial(
  seasonalEventKey: string | null,
  _modifiers: RunModifiers,
): CullodenMemorialResult {
  if (seasonalEventKey !== 'culloden') {
    return { applied: false, extraStartingHpHeal: 0 };
  }
  return { applied: true, extraStartingHpHeal: 0 };
}
