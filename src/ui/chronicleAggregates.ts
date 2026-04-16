/**
 * Pure aggregation helpers for the Herd Chronicle screen.
 *
 * Operates on `RunHistoryEntry[]` (capped at MAX_RUN_HISTORY, newest last)
 * plus the broader `SaveData` meta counters. Kept pure/deterministic so the
 * Chronicle scene is thin and the tone logic below is unit-testable.
 */
import type { RunHistoryEntry, SaveData } from '../utils/save';
import { BOSSES, ENEMY_TYPES, getEnemyDisplayName } from '../data/enemies';
import { getRoute, type RoutePick } from '../data/routes';
import { t } from '../core/i18n';

/** Lifetime totals — drawn from SaveData counters (authoritative, never capped). */
export interface LifetimeTotals {
  totalRuns: number;
  victories: number;
  totalKills: number;
  totalGold: number;
  bestTimeSec: number;
  bestKills: number;
  bestCombo: number;
  /** Sum of timeSurvivedSec across the (capped) history window — rough, not lifetime. */
  timeOnMoorSec: number;
  winRate: number;
}

/** Notable milestone rows — any may be null if history is empty. */
export interface Milestones {
  firstVictory: RunHistoryEntry | null;
  longestRun: RunHistoryEntry | null;
  mostKills: RunHistoryEntry | null;
  highestCombo: RunHistoryEntry | null;
  favoriteVariantKey: string | null;
  favoriteVariantCount: number;
  favoriteWeaponKey: string | null;
  favoriteWeaponCount: number;
  /** Current consecutive-victory streak counting backward from most recent. */
  currentWinStreak: number;
  /** Current consecutive-loss streak counting backward from most recent. */
  currentLossStreak: number;
}

/**
 * Emotional state drives the Chronicle's header/subtitle voice selection.
 * Ordered roughly by priority — earlier keys win when multiple apply.
 */
export type ChronicleMood =
  | 'empty'         // no runs yet
  | 'first_run'     // exactly one entry
  | 'victory_streak' // 2+ wins in a row
  | 'fresh_victory' // just won (last entry is victory)
  | 'loss_streak'   // 3+ losses in a row — Edge voice compassion
  | 'improving'     // avg trending up
  | 'declining'     // avg trending down
  | 'steady';       // default

export function lifetimeTotals(save: SaveData): LifetimeTotals {
  const history = save.runHistory;
  const timeOnMoorSec = history.reduce((sum, e) => sum + e.timeSurvivedSec, 0);
  const winRate = save.totalRuns > 0 ? save.victories / save.totalRuns : 0;
  return {
    totalRuns: save.totalRuns,
    victories: save.victories,
    totalKills: save.totalKills,
    totalGold: save.totalGoldEarned,
    bestTimeSec: save.bestTime,
    bestKills: save.bestKills,
    bestCombo: save.bestCombo,
    timeOnMoorSec,
    winRate,
  };
}

export function computeMilestones(history: RunHistoryEntry[]): Milestones {
  if (history.length === 0) {
    return {
      firstVictory: null,
      longestRun: null,
      mostKills: null,
      highestCombo: null,
      favoriteVariantKey: null,
      favoriteVariantCount: 0,
      favoriteWeaponKey: null,
      favoriteWeaponCount: 0,
      currentWinStreak: 0,
      currentLossStreak: 0,
    };
  }

  let firstVictory: RunHistoryEntry | null = null;
  let longestRun = history[0];
  let mostKills = history[0];
  let highestCombo = history[0];
  const variantCounts = new Map<string, number>();
  const weaponCounts = new Map<string, number>();

  for (const e of history) {
    if (!firstVictory && e.isVictory) firstVictory = e;
    if (e.timeSurvivedSec > longestRun.timeSurvivedSec) longestRun = e;
    if (e.enemiesKilled > mostKills.enemiesKilled) mostKills = e;
    if (e.bestCombo > highestCombo.bestCombo) highestCombo = e;
    variantCounts.set(e.variantKey, (variantCounts.get(e.variantKey) ?? 0) + 1);
    // Deduplicate weapons within a run so a run with 6 weapons counts each once,
    // not weighted by level or similar internal state we don't track here.
    const seen = new Set<string>();
    for (const wk of e.weaponKeys) {
      if (seen.has(wk)) continue;
      seen.add(wk);
      weaponCounts.set(wk, (weaponCounts.get(wk) ?? 0) + 1);
    }
  }

  const favVariant = topEntry(variantCounts);
  const favWeapon = topEntry(weaponCounts);

  // Streaks — walk backward from most recent entry.
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].isVictory) currentWinStreak++;
    else break;
  }
  if (currentWinStreak === 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      if (!history[i].isVictory) currentLossStreak++;
      else break;
    }
  }

  return {
    firstVictory,
    longestRun,
    mostKills,
    highestCombo,
    favoriteVariantKey: favVariant?.key ?? null,
    favoriteVariantCount: favVariant?.count ?? 0,
    favoriteWeaponKey: favWeapon?.key ?? null,
    favoriteWeaponCount: favWeapon?.count ?? 0,
    currentWinStreak,
    currentLossStreak,
  };
}

function topEntry(counts: Map<string, number>): { key: string; count: number } | null {
  let best: { key: string; count: number } | null = null;
  for (const [key, count] of counts) {
    if (!best || count > best.count) best = { key, count };
  }
  return best;
}

/**
 * Distill a history window into one mood tag. Priority order:
 * empty → first_run → victory_streak(≥2) → loss_streak(≥3) → fresh_victory →
 * improving/declining (≥3 entries) → steady.
 */
export function detectMood(history: RunHistoryEntry[]): ChronicleMood {
  if (history.length === 0) return 'empty';
  if (history.length === 1) return 'first_run';

  const m = computeMilestones(history);
  if (m.currentWinStreak >= 2) return 'victory_streak';
  if (m.currentLossStreak >= 3) return 'loss_streak';

  const last = history[history.length - 1];
  if (last.isVictory) return 'fresh_victory';

  if (history.length >= 3) {
    const recent = history.slice(-5);
    const overallAvg = history.reduce((s, e) => s + e.timeSurvivedSec, 0) / history.length;
    const recentAvg = recent.reduce((s, e) => s + e.timeSurvivedSec, 0) / recent.length;
    const ratio = overallAvg > 0 ? recentAvg / overallAvg : 1;
    if (ratio > 1.1) return 'improving';
    if (ratio < 0.9) return 'declining';
  }
  return 'steady';
}

/** Format total seconds as "Xh Ym" for long spans, "Xm Ys" otherwise. */
export function formatDurationLong(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  }
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

/** Format "M:SS" — mirrors GameOverScene.formatClockTime. */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/** Relative-time label for a past timestamp ("2h ago", "3d ago", "just now"). */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  return `${mo}mo ago`;
}

/** Unique enemy keys that can appear in the codex (regular types + bosses). */
export function getCodexRosterTotal(): number {
  const keys = new Set<string>();
  for (const k of Object.keys(ENEMY_TYPES)) keys.add(k);
  for (const b of BOSSES) keys.add(b.key);
  return keys.size;
}

export interface ChronicleCodexModel {
  discoveredCount: number;
  rosterTotal: number;
  /** Sorted display names for keys the player has culled at least once. */
  discoveredNames: string[];
}

export function buildChronicleCodex(
  codexCulledKeys: readonly string[] | undefined | null,
): ChronicleCodexModel {
  const uniq = [...new Set(codexCulledKeys ?? [])]
    .filter((k) => typeof k === 'string' && k.length > 0)
    .sort();
  return {
    discoveredCount: uniq.length,
    rosterTotal: getCodexRosterTotal(),
    discoveredNames: uniq.map(getEnemyDisplayName),
  };
}

/**
 * Single-line list of names for the Chronicle — truncated so the layout
 * stays within ~2 lines at the game's default width.
 */
export function formatCodexNamesLine(names: readonly string[], maxChars: number = 200): string {
  if (names.length === 0) return '';
  const joined = names.join(', ');
  if (joined.length <= maxChars) return joined;
  return `${joined.slice(0, Math.max(0, maxChars - 1))}…`;
}

/**
 * W2 Moor Road: render a pick history as a single-line breadcrumb
 * string for the Chronicle Moor Road log. Defaulted-by-setting picks
 * get a trailing "*" so the log can distinguish chosen from skipped.
 * Long trails are truncated at `maxChars` with a trailing ellipsis so
 * the Chronicle row stays within its width budget.
 */
export function formatRouteBreadcrumb(
  picks: readonly RoutePick[],
  maxChars: number = 60,
): string {
  if (picks.length === 0) return '';
  const joined = picks
    .map((p) => {
      const label = t(getRoute(p.routeKey).labelKey);
      return p.defaultedBySetting ? `${label}*` : label;
    })
    .join(' → ');
  if (joined.length <= maxChars) return joined;
  return `${joined.slice(0, Math.max(0, maxChars - 1))}…`;
}

/**
 * W2 Moor Road: select history entries that contain at least one
 * route pick, newest-first. Used by the Chronicle Moor Road log panel.
 */
export function selectRunsWithRoutes(
  history: readonly RunHistoryEntry[],
  limit: number = 10,
): RunHistoryEntry[] {
  const withRoutes = history.filter((e) => (e.routes?.length ?? 0) > 0);
  return withRoutes.slice(-limit).reverse();
}
