/**
 * First-time banter wiring helpers (B1 Phase 4 task 6 follow-up).
 *
 * The `first_time` banter pool ships content for ~30 milestones, but
 * three sub-pools were authored with the wiring deferred per the
 * Phase 4 plan: `variant_${key}_unlocked` (13 variants), `route_${routeKey}_first`
 * (6 routes), and `daily_first_clear`. The matching `bumpFirstTimeEvent`
 * save-side gate has been live since v7. This module is the connector.
 *
 * Design notes:
 *
 * - Pure module, no Phaser. The dependency surface is the bump function
 *   (returns true on the FIRST call per save lifetime per event id) and
 *   the banter request function (best-effort fire). Both are passed in
 *   so tests drive the helpers without `localStorage` or a live banter
 *   system.
 * - Multi-unlock-in-one-run is rare but real (a milestone run can clear
 *   the threshold for multiple stat-gated variants). The banter system
 *   only renders one pending request per tick, so we bump every newly-
 *   unlocked id (so the first-time flag retires correctly) but only
 *   request banter for the FIRST one that bumped successfully — the
 *   rest fire-and-forget on the persistent flag without a render. This
 *   is the same trade-off the live `ironmoor_first_victory` line accepts;
 *   the alternative (queue + space them across ticks) introduces ordering
 *   coupling we don't need for a flavour line.
 *
 * The `firstTimeEventId` builders are exported so call sites + tests
 * agree on the exact id strings that the banter pool and bumpers use.
 */

export const VARIANT_UNLOCK_EVENT_PREFIX = 'variant_';
export const VARIANT_UNLOCK_EVENT_SUFFIX = '_unlocked';
export const ROUTE_FIRST_EVENT_PREFIX = 'route_';
export const ROUTE_FIRST_EVENT_SUFFIX = '_first';
export const DAILY_FIRST_CLEAR_EVENT_ID = 'daily_first_clear';

export function variantUnlockEventId(variantKey: string): string {
  return `${VARIANT_UNLOCK_EVENT_PREFIX}${variantKey}${VARIANT_UNLOCK_EVENT_SUFFIX}`;
}

export function routeFirstEventId(routeKey: string): string {
  return `${ROUTE_FIRST_EVENT_PREFIX}${routeKey}${ROUTE_FIRST_EVENT_SUFFIX}`;
}

/** Atomic "claim this id once per save" — returns true on the first call ever. */
export type FirstTimeBumpFn = (eventId: string) => boolean;

/**
 * Banter sink. `request` returns true if the line was queued (matches
 * `BanterSystem.request`). The wiring helpers don't need the boolean —
 * they fire-and-forget — but typing it lets call sites assert on it.
 */
export interface FirstTimeBanterSink {
  request(context: 'first_time', payload: { tag: string }): boolean;
}

/**
 * Fire the variant-unlock first-time line for the FIRST id that hasn't
 * yet been claimed. All ids in the list are bumped (so subsequent runs
 * never re-claim), but only one banter request lands per call to keep
 * the per-tick render predictable.
 *
 * Returns the event id that fired the banter, or `null` if nothing
 * fired (already-claimed list, empty list, or no banter sink).
 */
export function fireFirstNewVariantUnlockBanter(
  newlyUnlocked: readonly string[],
  bumpFn: FirstTimeBumpFn,
  banter: FirstTimeBanterSink | null,
): string | null {
  let firedEventId: string | null = null;
  for (const variantKey of newlyUnlocked) {
    const eventId = variantUnlockEventId(variantKey);
    const claimed = bumpFn(eventId);
    if (!claimed) continue;
    if (firedEventId === null && banter) {
      banter.request('first_time', { tag: eventId });
      firedEventId = eventId;
    }
  }
  return firedEventId;
}

/**
 * Fire the daily-first-clear line if the run was a daily attempt and
 * the line hasn't been claimed yet. No-op for non-daily runs.
 */
export function fireDailyFirstClearBanter(
  isDailyRun: boolean,
  bumpFn: FirstTimeBumpFn,
  banter: FirstTimeBanterSink | null,
): boolean {
  if (!isDailyRun) return false;
  if (!bumpFn(DAILY_FIRST_CLEAR_EVENT_ID)) return false;
  banter?.request('first_time', { tag: DAILY_FIRST_CLEAR_EVENT_ID });
  return true;
}

/**
 * Fire the route-first line if this is the player's first ever pick of
 * `routeKey`. Returns true if the banter was requested.
 */
export function fireRouteFirstBanter(
  routeKey: string,
  bumpFn: FirstTimeBumpFn,
  banter: FirstTimeBanterSink | null,
): boolean {
  if (!routeKey) return false;
  const eventId = routeFirstEventId(routeKey);
  if (!bumpFn(eventId)) return false;
  banter?.request('first_time', { tag: eventId });
  return true;
}
