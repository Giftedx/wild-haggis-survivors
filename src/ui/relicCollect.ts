/**
 * Pure decision helpers for Relic pickup routing (R1 M2 T17).
 *
 * When the player walks over a Relic, the scene asks these helpers
 * whether to silently add to the next empty slot, open the discard
 * picker, or skip entirely (duplicate). Separated from the Phaser
 * modal so the routing logic tests without a DOM.
 */

export type RelicCollectAction = 'add' | 'discard_ui' | 'skip_duplicate';

export interface RelicCollectContext {
  heldCount: number;
  isDuplicate: boolean;
  slotCap: number;
}

/**
 * Decide what happens when the player picks up a Relic.
 *
 * - `skip_duplicate`: already holding this key — silently consume the
 *   pickup. The roll pool already excludes held keys, so this is the
 *   belt-and-braces guard against a race where two pickups drop the
 *   same relic in the same frame.
 * - `add`: there's at least one empty slot — append.
 * - `discard_ui`: all slots full — open the 4th-relic picker.
 */
export function decideRelicCollect(ctx: RelicCollectContext): RelicCollectAction {
  if (ctx.isDuplicate) return 'skip_duplicate';
  if (ctx.heldCount < ctx.slotCap) return 'add';
  return 'discard_ui';
}

export type RelicDiscardChoice =
  | { kind: 'replace_held'; slotIndex: 0 | 1 | 2 }
  | { kind: 'reject_incoming' };

/**
 * Resolve the discard modal's player choice to a concrete slot
 * mutation. `replaceIndex: null` = incoming rejected, no slot change.
 */
export function resolveRelicDiscard(choice: RelicDiscardChoice): { replaceIndex: number | null } {
  return choice.kind === 'replace_held'
    ? { replaceIndex: choice.slotIndex }
    : { replaceIndex: null };
}
