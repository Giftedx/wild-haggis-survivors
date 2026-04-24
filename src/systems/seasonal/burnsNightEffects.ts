/**
 * E1 M2 — Burns Night-specific effect handlers.
 *
 * Pure per-event lookups for the Burns Night window (Jan 18 - Feb 1).
 * Scenes call these with `now` + the `disableSeasonalEvents` setting
 * and wire the returned config to their own systems (audio, banter,
 * banner). No Phaser imports, no Date.now in hot paths — seed every
 * call site with an explicit `now` so tests can clock-mock.
 *
 * Future seasonal events (Hogmanay, Samhain, Up Helly Aa, ...) will
 * add sibling entries in `seasonalRunStartCeremony` when their
 * designs land.
 */

import type { BanterContext } from '../../data/banter';
import { getActiveSeasonalEventKey } from '../SeasonalEventManager';

/**
 * Ceremony config describing what a scene should fire at run-start
 * when a seasonal event is active. Purposefully data-only so it can
 * be logged, captured in replays, and diffed between events.
 */
export interface SeasonalRunStartCeremony {
  /** Active event key (e.g. `'burns_night'`). */
  eventKey: string;
  /** Audio id — maps to a dedicated method on AudioSystem. */
  stingerId: string;
  /** Banter context the scene should request. */
  banterContext: BanterContext;
  /** Banter sub-pool tag (picks themed lines inside the context). */
  banterTag: string;
  /** i18n dot-path for the on-screen banner line (event name + "is live" phrasing). */
  bannerKey: string;
}

/**
 * Resolve the current run-start ceremony for whichever seasonal event
 * is active (if any). Returns `null` when no event is active or the
 * player has opted out via `disableSeasonalEvents`.
 */
export function seasonalRunStartCeremony(
  now: Date,
  disabled: boolean,
): SeasonalRunStartCeremony | null {
  const eventKey = getActiveSeasonalEventKey(now, disabled);
  switch (eventKey) {
    case 'burns_night':
      return {
        eventKey,
        stingerId: 'burns_pipes_in',
        banterContext: 'gran_commentary',
        banterTag: 'seasonal_event',
        bannerKey: 'seasonalEvent.burns_night.ceremony_banner',
      };
    default:
      return null;
  }
}
