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
  burns_night: {
    key: 'burns_night',
    nameKey: 'seasonalEvent.burns_night.name',
    descriptionKey: 'seasonalEvent.burns_night.description',
    // Burns's birthday is 25 January; ±7 days keeps the window
    // forgiving across time zones and weekend-play schedules.
    dateWindow: { startMonth: 1, startDay: 18, endMonth: 2, endDay: 1 },
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
 */
export function activeSeasonalEvents(now: Date): string[] {
  const today = monthDay(now);
  return Object.keys(SEASONAL_EVENTS).filter((k) =>
    isInWindow(today, SEASONAL_EVENTS[k].dateWindow),
  );
}

/**
 * First active event's key, or `null` when none is active. The Chronicle
 * stamp uses this — one run belongs to one event even if windows ever
 * overlapped in the future.
 */
export function getActiveSeasonalEventKey(now: Date): string | null {
  const keys = activeSeasonalEvents(now);
  return keys.length > 0 ? keys[0] : null;
}
