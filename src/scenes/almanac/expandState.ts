/**
 * C1 Highland Almanac — shared expand/collapse state for book grids.
 *
 * Every book has the same interaction: click a cell → that cell's
 * detail panel opens as an overlay; click the same cell again or hit
 * close → collapses. Pure state so the scene owns the value and the
 * renderer stays a function of its inputs.
 *
 * Books 2–4 will reuse this module — each passes its own entries +
 * expanded-key handler; nothing here is enemy-specific.
 */

export interface ExpandState {
  readonly expandedKey: string | null;
}

export function createExpandState(): ExpandState {
  return { expandedKey: null };
}

export function isExpanded(state: ExpandState, key: string): boolean {
  return state.expandedKey === key;
}

export function toggleExpanded(state: ExpandState, key: string): ExpandState {
  if (state.expandedKey === key) return { expandedKey: null };
  return { expandedKey: key };
}

export function closeExpanded(state: ExpandState): ExpandState {
  if (state.expandedKey === null) return state;
  return { expandedKey: null };
}
