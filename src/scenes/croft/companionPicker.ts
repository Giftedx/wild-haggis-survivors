/**
 * Wild Living World Phase 2 — Croft companion picker view-model.
 *
 * Pure helper that turns persistent unlock + selection state into a
 * renderable list for the Croft "Living Moor" companion picker.
 * Lives next to `livingWorldTracks.ts` and follows the same shape:
 *   - input: minimal save-derived context object
 *   - output: ordered entries the scene renders without further logic
 *
 * Determinism contract: this is a pure between-runs view-model. No
 * RNG, no scene state, no save writes — the writes happen via the
 * `setSelectedCompanion` / `unlockCompanion` bumpers from
 * `utils/save/bumpers.ts`, this module just computes what's shown.
 */

import {
  COMPANION_DEFS,
  COMPANION_KEYS_IN_ORDER,
  type CompanionKey,
} from '../../entities/companions/companionTypes';

/**
 * One row in the picker — a companion the player MIGHT pick. Locked
 * companions are still rendered (greyed) so the player can see future
 * unlocks; that's a Soul-Charter warmth move (compassionate failure /
 * legible progression).
 */
export interface CompanionPickerEntry {
  readonly kind: 'companion';
  readonly key: CompanionKey;
  /** `t(displayNameKey)` resolves to the HUD chip label (`STOAT` etc.). */
  readonly displayNameKey: string;
  /** Static texture baked at boot — used for a small avatar preview. */
  readonly textureKey: string;
  /** True when the player has unlocked this companion at any point. */
  readonly unlocked: boolean;
  /**
   * True when this companion is the active pick for the next run. The
   * "no companion" opt-out row sits AFTER the unlocked list so this
   * never lights up for non-`CompanionKey` rows.
   */
  readonly selected: boolean;
}

/** Sentinel returned for the "go alone" opt-out row. */
export interface CompanionPickerOptOut {
  readonly kind: 'opt_out';
  readonly displayNameKey: string;
  readonly selected: boolean;
}

export type CompanionPickerRow = CompanionPickerEntry | CompanionPickerOptOut;

export interface CompanionPickerContext {
  readonly unlockedCompanions: readonly CompanionKey[];
  /** `null` = opt-out (start runs without a companion). */
  readonly selectedCompanion: CompanionKey | null;
}

/**
 * Build the ordered picker rows.
 *
 * Order:
 *   1. Every `COMPANION_KEYS_IN_ORDER` entry (always rendered — locked
 *      entries appear greyed so the surface itself communicates the
 *      goal). Selected row gets `selected: true`.
 *   2. A single "opt_out" row at the end so players can deliberately
 *      run solo. Selected when `selectedCompanion === null`.
 */
export function buildCompanionPickerRows(
  ctx: CompanionPickerContext,
): CompanionPickerRow[] {
  const unlocked = new Set(ctx.unlockedCompanions);
  const rows: CompanionPickerRow[] = COMPANION_KEYS_IN_ORDER.map((k) => ({
    kind: 'companion',
    key: k,
    displayNameKey: COMPANION_DEFS[k].nameKey,
    textureKey: COMPANION_DEFS[k].textureKeys[0],
    unlocked: unlocked.has(k),
    selected: ctx.selectedCompanion === k,
  } satisfies CompanionPickerEntry));
  rows.push({
    kind: 'opt_out',
    displayNameKey: 'ui.croft.livingWorld.picker.no_companion',
    selected: ctx.selectedCompanion === null,
  });
  return rows;
}

/**
 * Decide the next selection when a player clicks an unlocked row.
 *
 * Rules:
 *   - clicking the already-selected row is a no-op (returns input).
 *   - clicking a different unlocked row switches selection to it.
 *   - clicking a locked row is rejected (returns input — UI never
 *     enables clicks on locked rows but defending here keeps the
 *     contract honest if a tap leaks through during animation).
 *   - clicking the opt-out row sets the selection to `null`.
 */
export function resolveNextSelection(
  rows: readonly CompanionPickerRow[],
  clickedIndex: number,
  current: CompanionKey | null,
): CompanionKey | null {
  if (clickedIndex < 0 || clickedIndex >= rows.length) return current;
  const row = rows[clickedIndex];
  if (isOptOut(row)) return null;
  if (!row.unlocked) return current;
  if (row.selected) return current;
  return row.key;
}

function isOptOut(row: CompanionPickerRow): row is CompanionPickerOptOut {
  return (row as CompanionPickerOptOut).kind === 'opt_out';
}

/** Convenience exports so consumers don't re-import companion types. */
export { COMPANION_KEYS_IN_ORDER, COMPANION_DEFS };
