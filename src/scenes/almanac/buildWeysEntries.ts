/**
 * C1 Highland Almanac — Book 2 (Weys) view-model builder.
 *
 * Maps the route registry against the persisted DiscoveryLog and emits
 * the ordered entry list the WeysBook renderer draws from. Pure — no
 * Phaser, no i18n, no save reads. `WeysBook.ts` adds Phaser scaffolding.
 *
 * Ordering: slot A first then slot B (matches the in-run reveal order —
 * picker A fires after the gordon kill ~5:00, picker B after tour_bus
 * ~10:00). Within a slot the page reads in `ROUTES` definition order
 * so the Almanac mirrors the on-screen card order at the picker.
 */

import type { DiscoveryLog, FirstSeenAt } from '../../systems/DiscoveryLog';
import { ROUTES, type PickerSlot, type RouteKey } from '../../data/routes';

export interface WeyEntryVM {
  readonly key: RouteKey;
  readonly slot: PickerSlot;
  readonly labelKey: string;
  readonly descKey: string;
  readonly picked: boolean;
  readonly pickCount: number;
  readonly firstPickedAt: FirstSeenAt | null;
}

export function buildWeysEntries(log: DiscoveryLog): WeyEntryVM[] {
  const sorted = ROUTES.slice().sort((a, b) => {
    if (a.slot !== b.slot) return a.slot === 'A' ? -1 : 1;
    return ROUTES.indexOf(a) - ROUTES.indexOf(b);
  });
  return sorted.map((route) => {
    const entry = log.routesVisited[route.key];
    return {
      key: route.key,
      slot: route.slot,
      labelKey: route.labelKey,
      descKey: route.descKey,
      picked: entry !== undefined,
      pickCount: entry?.pickCount ?? 0,
      firstPickedAt: entry?.firstPickedAt ?? null,
    };
  });
}

/**
 * Summary stats for the Weys-tab header pill ("N of M walked").
 * Pure wrapper around the entry list so the header stays in sync
 * with the body grid.
 */
export function weysDiscoverySummary(entries: readonly WeyEntryVM[]): {
  picked: number;
  total: number;
} {
  let picked = 0;
  for (const e of entries) if (e.picked) picked++;
  return { picked, total: entries.length };
}
