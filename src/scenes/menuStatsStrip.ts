import { t } from '../core/i18n';
import type { RunHistoryEntry } from '../utils/save';
import { getAverageSurvivalTime, getTrend, getWinRate } from '../utils/save';

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
/**
 * Build the "history summary" line shown at the bottom of MainMenu
 * when the player has completed at least one run. One i18n line
 * containing: total runs, win rate %, average time M:SS, and a
 * trend label ("improving" / "declining" / "steady" copy).
 *
 * Returns `null` when the history is empty so callers can skip
 * rendering the line entirely.
 */
export function formatMenuHistorySummary(
  runHistory: readonly RunHistoryEntry[],
  totalRuns: number,
): string | null {
  if (runHistory.length === 0) return null;
  const winRate = Math.round(getWinRate(runHistory as RunHistoryEntry[]) * 100);
  const avgSec = Math.floor(getAverageSurvivalTime(runHistory as RunHistoryEntry[]));
  const avgMins = Math.floor(avgSec / 60);
  const avgSecsStr = Math.floor(avgSec % 60).toString().padStart(2, '0');
  const trendKey = getTrend(runHistory as RunHistoryEntry[]);
  const trendLabel = trendKey === 'improving'
    ? t('ui.menu.trend_improving')
    : trendKey === 'declining'
      ? t('ui.menu.trend_declining')
      : t('ui.menu.trend_steady');
  return t('ui.menu.history_summary', {
    totalRuns,
    winRate,
    avgTime: `${avgMins}:${avgSecsStr}`,
    trend: trendLabel,
  });
}

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
