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

// ── T10 Haggis-platter pickup ───────────────────────────────────────

/** Damage multiplier applied while the platter buff is active. */
export const BURNS_PLATTER_BUFF_MULT = 1.3;

/** Buff lifetime in ms once the platter is collected. */
export const BURNS_PLATTER_BUFF_MS = 60_000;

/**
 * When (ms into the run) the single platter pickup appears. W2 act 1
 * begins around 3:00, so 30 s reliably drops the platter during the
 * first node — visible without crowding the curse-pact / intro toast.
 */
export const BURNS_PLATTER_SPAWN_MS = 30_000;

/**
 * `true` when the run is inside an active Burns Night window, the
 * opt-out is off, and the one-per-run pickup has not spawned yet.
 */
export function shouldSpawnBurnsPlatter(
  now: Date,
  disabled: boolean,
  alreadySpawned: boolean,
): boolean {
  if (alreadySpawned) return false;
  return getActiveSeasonalEventKey(now, disabled) === 'burns_night';
}

/**
 * Current damage multiplier contributed by the platter buff.
 * `pickedUpAtMs === null` → not collected yet → identity (1). Once
 * collected, returns `BURNS_PLATTER_BUFF_MULT` for the next
 * `BURNS_PLATTER_BUFF_MS`; reverts to 1 after the window closes.
 * The `now` value must be drawn from the same clock the caller uses
 * for `pickedUpAtMs` (scene.time.now) so pause-aware ticking works.
 */
export function burnsPlatterDamageBuff(
  nowMs: number,
  pickedUpAtMs: number | null,
): number {
  if (pickedUpAtMs === null) return 1;
  if (nowMs >= pickedUpAtMs + BURNS_PLATTER_BUFF_MS) return 1;
  return BURNS_PLATTER_BUFF_MULT;
}
