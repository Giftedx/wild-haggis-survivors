import { t } from '../core/i18n';

/**
 * Inputs for the Menu-scene stats strip: the aggregate save counters
 * and the current viewport width (used to pick the short vs long
 * i18n variant).
 */
export interface MenuStatsInput {
  /** Best run time survived, in seconds. */
  bestTime: number;
  bestKills: number;
  bestCombo: number;
  totalRuns: number;
  victories: number;
  gold: number;
  /** Camera viewport width in px — threshold is 1150 (short below). */
  viewWidth: number;
}

const STATS_STRIP_NARROW_PX = 1150;

/**
 * Format the Menu "stats strip" copy — one i18n line showing the
 * player's headline aggregates (best time, kills, combo, runs, wins,
 * gold). Picks `ui.menu.stats_short` on narrow viewports and
 * `ui.menu.stats_long` on wide ones; 1150px is the break.
 *
 * Pure on its inputs — `bestTime` seconds are formatted as `M:SS`
 * with negative and fractional values clamped (defensive against a
 * corrupted save). Feed the four plural counters as-is.
 */
export function formatMenuStatsStrip(input: MenuStatsInput): string {
  const safeSeconds = Math.max(0, Math.floor(input.bestTime));
  const mins = Math.floor(safeSeconds / 60);
  const secs = Math.floor(safeSeconds % 60);
  const bestTime = `${mins}:${secs.toString().padStart(2, '0')}`;
  const vars = {
    bestTime,
    bestKills: input.bestKills,
    bestCombo: input.bestCombo,
    totalRuns: input.totalRuns,
    victories: input.victories,
    gold: input.gold,
  };
  return input.viewWidth < STATS_STRIP_NARROW_PX
    ? t('ui.menu.stats_short', vars)
    : t('ui.menu.stats_long', vars);
}
