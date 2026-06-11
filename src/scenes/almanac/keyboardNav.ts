/**
 * C1 M5 Highland Almanac — pure keyboard navigation helpers.
 *
 * AlmanacScene owns the side-effect wiring (Phaser key handlers, scene
 * transitions, re-render calls); this module owns the decisions.
 * Extracted so the keyboard contract stays testable without Phaser —
 * `AlmanacScene.ts` imports Phaser and can't live in node-env vitest.
 *
 * Contract:
 * - Tab / Shift+Tab / Left / Right → cycle active tab (next / prev).
 * - Enter → if an entry is open, collapse it; otherwise expand the
 *           first entry on the active tab. A blunt "Enter starts
 *           browsing" contract, not a full focused-cell model —
 *           keeps mouse + keyboard coherent without a focus cursor.
 * - Escape → if an entry is open on the active tab, close it;
 *            otherwise exit the scene.
 */

import type { ExpandState } from './expandState';
import type { AlmanacTabKey } from './tabNavigation';

export type AlmanacEscResolution = 'close-expanded' | 'exit-scene';

/**
 * Esc is overloaded: close the open panel if one exists, otherwise
 * leave the scene. Returns the decision so the scene can branch
 * without reaching into expandStates itself.
 */
export function resolveAlmanacEsc(
  activeTab: AlmanacTabKey,
  expandStates: Record<AlmanacTabKey, ExpandState>,
): AlmanacEscResolution {
  return expandStates[activeTab].expandedKey == null ? 'exit-scene' : 'close-expanded';
}

export interface AlmanacEnterAction {
  readonly action: 'expand' | 'collapse' | 'none';
  readonly key: string | null;
}

/**
 * Enter cycles through a binary "start / stop browsing" state:
 * - No entries on the tab (fresh save, empty book) → no-op.
 * - Entry already expanded → collapse.
 * - Nothing expanded → expand the first entry in the book order.
 */
export function resolveAlmanacEnterToggle(
  firstEntryKey: string | null,
  expandState: ExpandState,
): AlmanacEnterAction {
  if (expandState.expandedKey != null) {
    return { action: 'collapse', key: expandState.expandedKey };
  }
  if (firstEntryKey == null) {
    return { action: 'none', key: null };
  }
  return { action: 'expand', key: firstEntryKey };
}
