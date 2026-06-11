/**
 * C1 Highland Almanac — pure tab-navigation state.
 *
 * Four books tabbed left-to-right in spec §2 order: Beasties, Weys,
 * Finds, Banter. Extracted so the cycle / keyboard-arrow behaviour
 * stays testable without Phaser — `AlmanacScene.ts` imports Phaser
 * and can't live in node-env vitest.
 */

export const ALMANAC_TAB_KEYS = ['beasties', 'weys', 'finds', 'banter'] as const;

export type AlmanacTabKey = typeof ALMANAC_TAB_KEYS[number];

/**
 * Entry-point default. The Beasties book is the spec's flagship page
 * (silhouettes + kill counts) and the densest surface on a cold save,
 * so it opens the Almanac.
 */
export const DEFAULT_ALMANAC_TAB: AlmanacTabKey = 'beasties';

export function almanacTabLabelKey(key: AlmanacTabKey): string {
  return `ui.almanac.tab_${key}`;
}

export function almanacTabIndex(key: AlmanacTabKey): number {
  return ALMANAC_TAB_KEYS.indexOf(key);
}

/**
 * Resolve an index (possibly out-of-range) back to a tab key by
 * wrapping modulo the tab count. Lets `cycleAlmanacTab` keep its
 * +1 / -1 maths trivial without worrying about boundaries.
 */
export function almanacTabAtIndex(i: number): AlmanacTabKey {
  const n = ALMANAC_TAB_KEYS.length;
  const wrapped = ((i % n) + n) % n;
  return ALMANAC_TAB_KEYS[wrapped];
}

export function cycleAlmanacTab(
  current: AlmanacTabKey,
  direction: 'next' | 'prev',
): AlmanacTabKey {
  const step = direction === 'next' ? 1 : -1;
  return almanacTabAtIndex(almanacTabIndex(current) + step);
}
