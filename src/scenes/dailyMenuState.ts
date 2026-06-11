import { t } from '../core/i18n';
import type { DailyChallengeState } from '../core/SaveManager';

/**
 * Pure inputs for the Main Menu daily-challenge button display. The
 * scene resolves wall-clock-dependent values (today's dateKey, today's
 * seed + shortcode) and hands them in — the helper does no I/O.
 */
export interface DailyStateInput {
  /** "YYYY-MM-DD" local — current day. */
  todayKey: string;
  /** Today's daily challenge seed. */
  seed: number;
  /** Human-friendly seed code (e.g. `encodeSeed(seed)`). */
  seedCode: string;
  /** The save's daily record; null if never attempted. */
  recorded: DailyChallengeState | null;
}

/** Display fields for the daily challenge button. */
export interface DailyStateDisplay {
  seed: number;
  subtitle: string;
  completed: boolean;
}

/**
 * Subtitle colour — green when today's daily has been cleared,
 * warm gold when still pending. The two colours live next to the
 * state resolver so a future visual pass for the daily button can
 * read the identity from one place.
 */
export const DAILY_SUBTITLE_COLOR_COMPLETED = '#9de6a8';
export const DAILY_SUBTITLE_COLOR_PENDING = '#e2c97a';

export function resolveDailySubtitleColor(completed: boolean): string {
  return completed ? DAILY_SUBTITLE_COLOR_COMPLETED : DAILY_SUBTITLE_COLOR_PENDING;
}

/**
 * Resolve the display state for the Main Menu's daily button. Three
 * visual states, chosen by whether the save's daily record is from
 * today and whether the player has cleared it:
 *
 *  - No record, or record is from a prior day  → "fresh" subtitle.
 *  - Today's record, completedVictory = true   → "cleared" subtitle.
 *  - Today's record, not yet cleared           → "attempts {N}" subtitle.
 *
 * Pure on its inputs — tests can feed a specific `todayKey` and
 * `recorded` to pin each branch without faking the clock.
 */
export function resolveDailyStateDisplay(input: DailyStateInput): DailyStateDisplay {
  const { todayKey, seed, seedCode, recorded } = input;
  const isTodayRecord = !!recorded && recorded.dateKey === todayKey;
  if (!isTodayRecord) {
    return {
      seed,
      subtitle: t('ui.menu.daily_fresh', { code: seedCode }),
      completed: false,
    };
  }
  // isTodayRecord narrows `recorded` to non-null for TS.
  const rec = recorded as DailyChallengeState;
  if (rec.completedVictory) {
    return {
      seed,
      subtitle: t('ui.menu.daily_cleared', { code: seedCode }),
      completed: true,
    };
  }
  return {
    seed,
    subtitle: t('ui.menu.daily_attempts', { code: seedCode, attempts: rec.attempts }),
    completed: false,
  };
}
