/**
 * E1 M1 — Seasonal events framework.
 *
 * Pure date-math activation: given a device-local Date, return which
 * seasonal events are currently active. No Phaser, no scene state, no
 * Date.now in hot paths — all logic routes through an explicit `now`
 * parameter so tests can clock-mock without monkey-patching globals.
 *
 * Event windows are MM-DD intervals. Same-year windows (Burns Night
 * 1/18 - 2/1) and year-wrap windows (Hogmanay 12/28 - 1/3) are both
 * supported. Overlaps are resolved by insertion order in `SEASONAL
 * _EVENTS`; the calendar is designed to avoid them, but if two
 * windows overlap the first-declared wins.
 *
 * Per spec `docs/superpowers/specs/2026-04-23-seasonal-events-burns-
 * night-design.md §5`: no server-time check, accepts device-local
 * time, no FOMO gates.
 */

export interface SeasonalEventDateWindow {
  /** 1-12. */
  startMonth: number;
  /** 1-31. */
  startDay: number;
  /** 1-12. */
  endMonth: number;
  /** 1-31. */
  endDay: number;
}

export interface SeasonalEventDef {
  /** Stable id used in save data + i18n keys. */
  key: string;
  /** i18n dot-path — display name for HUD / Chronicle badge. */
  nameKey: string;
  /** i18n dot-path — one-line description. */
  descriptionKey: string;
  /** Inclusive MM-DD window. */
  dateWindow: SeasonalEventDateWindow;
}

/**
 * Compare MM-DD pairs inclusively. Handles year-wrap: if the start
 * lies after the end (e.g. Dec 28 > Jan 3) the window is treated as
 * crossing the new year. Encodes MM-DD as M*100+D so ordinal compare
 * works without touching Date objects.
 */
export function isInWindow(
  today: { m: number; d: number },
  window: SeasonalEventDateWindow,
): boolean {
  const start = window.startMonth * 100 + window.startDay;
  const end = window.endMonth * 100 + window.endDay;
  const now = today.m * 100 + today.d;
  if (start <= end) {
    return now >= start && now <= end;
  }
  return now >= start || now <= end;
}

export const SEASONAL_EVENTS: Readonly<Record<string, SeasonalEventDef>> = {
  // Beltane — Gaelic fire festival marking the start of summer
  // (Apr 28 – May 4 around May 1). Bonfires, livestock driven
  // between twin fires for purification. Wild / Hearth tonal pair
  // depending on time of day; we frame it warm here.
  beltane: {
    key: 'beltane',
    nameKey: 'seasonalEvent.beltane.name',
    descriptionKey: 'seasonalEvent.beltane.description',
    dateWindow: { startMonth: 4, startDay: 28, endMonth: 5, endDay: 4 },
  },
  // Samhain — Gaelic festival marking the end of harvest / start of
  // winter. The veil between worlds thins; Cailleach ascendant.
  // Grave-tone per DESIGN_SOUL.md. Oct 28 – Nov 3 overlaps the modern
  // Halloween window and the older Gaelic reckoning.
  samhain: {
    key: 'samhain',
    nameKey: 'seasonalEvent.samhain.name',
    descriptionKey: 'seasonalEvent.samhain.description',
    dateWindow: { startMonth: 10, startDay: 28, endMonth: 11, endDay: 3 },
  },
  // St Andrew's Day — Scottish national day (Nov 30). Warm Hearth
  // tone; saltire imagery. ±3 days keeps the window forgiving
  // without stretching into the Hogmanay run-up.
  st_andrews: {
    key: 'st_andrews',
    nameKey: 'seasonalEvent.st_andrews.name',
    descriptionKey: 'seasonalEvent.st_andrews.description',
    dateWindow: { startMonth: 11, startDay: 27, endMonth: 12, endDay: 3 },
  },
  // Hogmanay — Scottish new year, traditionally bigger than Christmas.
  // First-footing, Auld Lang Syne, Stonehaven fireballs, Edinburgh
  // street party. Window straddles 31 Dec so both NYE and early-
  // January play sessions land inside the event; year-wrap is
  // handled by `isInWindow`'s ordinal compare.
  hogmanay: {
    key: 'hogmanay',
    nameKey: 'seasonalEvent.hogmanay.name',
    descriptionKey: 'seasonalEvent.hogmanay.description',
    dateWindow: { startMonth: 12, startDay: 28, endMonth: 1, endDay: 3 },
  },
  burns_night: {
    key: 'burns_night',
    nameKey: 'seasonalEvent.burns_night.name',
    descriptionKey: 'seasonalEvent.burns_night.description',
    // Burns's birthday is 25 January; ±7 days keeps the window
    // forgiving across time zones and weekend-play schedules.
    dateWindow: { startMonth: 1, startDay: 18, endMonth: 2, endDay: 1 },
  },
  // Imbolc / Brigid's Day — Gaelic first-of-spring, traditionally Feb 1.
  // Window starts the day after Burns Night closes (Feb 1 is Burns's
  // last day) so the two events stay disjoint, and runs through Feb 8
  // to give a full week — the older Gaelic reckoning treated Imbolc
  // as a season-edge several days wide, not a single date.
  imbolc: {
    key: 'imbolc',
    nameKey: 'seasonalEvent.imbolc.name',
    descriptionKey: 'seasonalEvent.imbolc.description',
    dateWindow: { startMonth: 2, startDay: 2, endMonth: 2, endDay: 8 },
  },
  // Lùnastal / Lammas — Gaelic harvest-start (Aug 1). Window Jul 29 –
  // Aug 4 mirrors the Beltane symmetry (Apr 28 – May 4 around May 1) —
  // these two cross-quarter days are the bookends of the agricultural
  // year. Sits comfortably between Beltane and the Aug 12 grouse-
  // shooting opening (a future tourist-hunter intensification slot).
  lammas: {
    key: 'lammas',
    nameKey: 'seasonalEvent.lammas.name',
    descriptionKey: 'seasonalEvent.lammas.description',
    dateWindow: { startMonth: 7, startDay: 29, endMonth: 8, endDay: 4 },
  },
};

function monthDay(now: Date): { m: number; d: number } {
  return { m: now.getMonth() + 1, d: now.getDate() };
}

/** True when the named event's window contains `now` (device-local). */
export function isSeasonalEventActive(eventKey: string, now: Date): boolean {
  const event = SEASONAL_EVENTS[eventKey];
  if (!event) return false;
  return isInWindow(monthDay(now), event.dateWindow);
}

/**
 * Keys of every event whose window currently contains `now`. The order
 * matches `SEASONAL_EVENTS` insertion (which is Object.keys-stable for
 * string keys in modern V8/SpiderMonkey — spec-compliant since ES2015).
 *
 * `disabled` (wired from `SettingsManager.disableSeasonalEvents` at call
 * sites) short-circuits to `[]` — players who opt out never see the
 * seasonal badge, ceremony, or variant gate regardless of real date.
 */
export function activeSeasonalEvents(now: Date, disabled: boolean = false): string[] {
  if (disabled) return [];
  const today = monthDay(now);
  return Object.keys(SEASONAL_EVENTS).filter((k) =>
    isInWindow(today, SEASONAL_EVENTS[k].dateWindow),
  );
}

/**
 * First active event's key, or `null` when none is active. The Chronicle
 * stamp uses this — one run belongs to one event even if windows ever
 * overlapped in the future. `disabled` respects the opt-out setting the
 * same way `activeSeasonalEvents` does.
 */
export function getActiveSeasonalEventKey(now: Date, disabled: boolean = false): string | null {
  const keys = activeSeasonalEvents(now, disabled);
  return keys.length > 0 ? keys[0] : null;
}
