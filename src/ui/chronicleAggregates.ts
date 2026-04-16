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

/**
 * W66 Ironmoor lifetime snapshot — how the single-life posture is
 * treating the player across their whole runHistory. Three numbers
 * + a "longest victory" record keep the story compact.
 */
export interface IronmoorStats {
  /** Total Ironmoor attempts across history. */
  attempts: number;
  /** Ironmoor runs that ended in victory. */
  victories: number;
  /** Longest Ironmoor run by timeSurvivedSec (0 if none). */
  longestSec: number;
  /** victories / attempts, 0 when attempts === 0. */
  winRate: number;
}

export function computeIronmoorStats(
  history: readonly RunHistoryEntry[],
): IronmoorStats {
  let attempts = 0;
  let victories = 0;
  let longestSec = 0;
  for (const e of history) {
    if (!e.ironmoor) continue;
    attempts++;
    if (e.isVictory) victories++;
    if (e.timeSurvivedSec > longestSec) longestSec = e.timeSurvivedSec;
  }
  return {
    attempts,
    victories,
    longestSec,
    winRate: attempts > 0 ? victories / attempts : 0,
  };
}

/**
 * Single-line Chronicle readout for the Ironmoor posture. Blank when
 * the player has never taken an Ironmoor run — silent on fresh saves.
 * When `bestVictorySec > 0`, appends the separate-leaderboard fastest
 * Ironmoor-victory time — the single-life pride record.
 */
export function formatIronmoorLine(
  s: IronmoorStats,
  bestVictorySec: number = 0,
): string {
  if (s.attempts === 0) return '';
  const pct = Math.round(s.winRate * 100);
  const fmt = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  const base = `⚔ Ironmoor — ${s.victories}/${s.attempts} wins (${pct}%) · longest ${fmt(s.longestSec)}`;
  if (bestVictorySec > 0) return `${base} · fastest win ${fmt(bestVictorySec)}`;
  return base;
}

/**
 * W2 Moor Road: kill-criterion report.
 *
 * The W2 ship gate defined three measurements to decide whether the
 * flagship design is working, paused, or needs redesign:
 *   - **monotony:** fraction of runs where slot A was the same route
 *   - **completionDelta:** post-W2 victory rate vs pre-W2 baseline
 *   - **skipRate:** fraction of route picks that were auto-defaulted
 *
 * This helper computes all three over the full runHistory window. The
 * Chronicle and progress.txt both consume it. Pure — no i18n, no
 * formatting. The caller turns the numbers into a readable line.
 */
export interface MoorRoadKillCriteria {
  /** Runs that hit at least one picker. Basis of all ratios below. */
  w2Runs: number;
  /** Runs before W2 shipped — no routes field, used as completion baseline. */
  preW2Runs: number;
  /** 0..1 — share of w2Runs whose act-1 pick was the most common route. */
  monotonyA: number;
  /** Route key that dominated act 1 (undefined if w2Runs === 0). */
  monotonyARouteKey?: string;
  /** Same as monotonyA but for act 2. */
  monotonyB: number;
  monotonyBRouteKey?: string;
  /** post-W2 victory rate − pre-W2 victory rate. Positive = improved. */
  completionDelta: number;
  /** 0..1 — fraction of picks across all W2 runs that were defaultedBySetting. */
  skipRate: number;
}

/**
 * Kill-criterion thresholds. If any of these trip, the Moor Road design
 * has a structural problem and M2 findings should be reviewed.
 * Sourced from the W2 ship-gate spec (Task 23 + Task 31).
 */
const KILL_CRITERIA_THRESHOLDS = {
  /** Fraction of picks on one route that signals monotony. */
  monotonyFail: 0.80,
  /** Post-W2 victory rate drop (fractional) that signals regression. */
  completionFail: -0.15,
  /** Fraction of picks skipped via setting that signals a bad UX. */
  skipRateFail: 0.60,
} as const;

/**
 * Summary string for the Chronicle Moor Road readout. Blank if no W2
 * runs are logged yet; otherwise a two-line label describing the most
 * popular act-1 route + a status flag for each of the three kill
 * criteria. Meant to be concise — renders under Milestones.
 */
export function formatMoorRoadStatus(
  criteria: MoorRoadKillCriteria,
): { line: string; anyFailed: boolean } {
  if (criteria.w2Runs === 0) {
    return { line: '', anyFailed: false };
  }
  // Monotony + skip only gate the design once there are enough runs for
  // the ratio to be meaningful (<5 runs → a single outlier reads as 100%).
  const hasSample = criteria.w2Runs >= 5;
  const monoAFailed = hasSample && criteria.monotonyA >= KILL_CRITERIA_THRESHOLDS.monotonyFail;
  const monoBFailed = hasSample && criteria.monotonyB >= KILL_CRITERIA_THRESHOLDS.monotonyFail;
  const skipFailed = hasSample && criteria.skipRate >= KILL_CRITERIA_THRESHOLDS.skipRateFail;
  // Completion delta gates only when both pre + post buckets have runs.
  const compFailed = criteria.preW2Runs > 0
    && criteria.w2Runs > 0
    && criteria.completionDelta <= KILL_CRITERIA_THRESHOLDS.completionFail;
  const anyFailed = monoAFailed || monoBFailed || compFailed || skipFailed;

  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const monoA = criteria.monotonyARouteKey
    ? `A: ${pct(criteria.monotonyA)} ${criteria.monotonyARouteKey}`
    : 'A: —';
  const monoB = criteria.monotonyBRouteKey
    ? `B: ${pct(criteria.monotonyB)} ${criteria.monotonyBRouteKey}`
    : 'B: —';
  const delta = criteria.completionDelta >= 0
    ? `+${pct(criteria.completionDelta)}`
    : pct(criteria.completionDelta);
  const line = `Moor Road — ${monoA} · ${monoB} · Δwin ${delta} · skip ${pct(criteria.skipRate)}`;

  return { line, anyFailed };
}

export function computeMoorRoadKillCriteria(
  history: readonly RunHistoryEntry[],
): MoorRoadKillCriteria {
  const w2 = history.filter((e) => (e.routes?.length ?? 0) > 0);
  const preW2 = history.filter((e) => !e.routes || e.routes.length === 0);

  const countsFor = (slot: 'A' | 'B'): Map<string, number> => {
    const m = new Map<string, number>();
    for (const e of w2) {
      const pick = (e.routes ?? []).find((p) => p.slot === slot);
      if (!pick) continue;
      m.set(pick.routeKey, (m.get(pick.routeKey) ?? 0) + 1);
    }
    return m;
  };

  const dominant = (m: Map<string, number>): { key?: string; share: number } => {
    if (m.size === 0) return { share: 0 };
    let bestKey: string | undefined;
    let bestCount = 0;
    let total = 0;
    for (const [k, c] of m) {
      total += c;
      if (c > bestCount) { bestCount = c; bestKey = k; }
    }
    return { key: bestKey, share: total > 0 ? bestCount / total : 0 };
  };

  const aCounts = countsFor('A');
  const bCounts = countsFor('B');
  const aDom = dominant(aCounts);
  const bDom = dominant(bCounts);

  const postVictoryRate = w2.length > 0
    ? w2.filter((e) => e.isVictory).length / w2.length
    : 0;
  const preVictoryRate = preW2.length > 0
    ? preW2.filter((e) => e.isVictory).length / preW2.length
    : 0;

  // skip rate = defaultedBySetting picks / total picks across all W2 runs
  let totalPicks = 0;
  let skippedPicks = 0;
  for (const e of w2) {
    for (const p of e.routes ?? []) {
      totalPicks++;
      if (p.defaultedBySetting) skippedPicks++;
    }
  }

  return {
    w2Runs: w2.length,
    preW2Runs: preW2.length,
    monotonyA: aDom.share,
    monotonyARouteKey: aDom.key,
    monotonyB: bDom.share,
    monotonyBRouteKey: bDom.key,
    completionDelta: postVictoryRate - preVictoryRate,
    skipRate: totalPicks > 0 ? skippedPicks / totalPicks : 0,
  };
}

// ── Standing Stones + Ancestral Echoes ─────────────────────────────

export interface StandingStonesStats {
  /** Total lifetime stones walked. */
  total: number;
  /** Per-boon tally (mending / fire / haste). */
  byBoon: Record<string, number>;
  /** Most-picked boon id, or null when no picks yet. */
  favouriteBoon: string | null;
}

export function computeStandingStonesStats(save: SaveData): StandingStonesStats {
  const picked = save.standingStonesPicked ?? {};
  let total = 0;
  let favourite: string | null = null;
  let favouriteCount = 0;
  for (const [key, count] of Object.entries(picked)) {
    total += count;
    if (count > favouriteCount) {
      favouriteCount = count;
      favourite = key;
    }
  }
  return { total, byBoon: { ...picked }, favouriteBoon: favourite };
}

/**
 * Single-line Chronicle readout. Blank when the player has never
 * walked a stone. Surfaces favourite boon when at least one pick
 * exists.
 */
export function formatStandingStonesLine(stats: StandingStonesStats): string {
  if (stats.total === 0) return '';
  const parts: string[] = [`⟁ Stones walked: ${stats.total}`];
  const m = stats.byBoon.mending ?? 0;
  const f = stats.byBoon.fire ?? 0;
  const h = stats.byBoon.haste ?? 0;
  parts.push(`(mending ${m} · fire ${f} · haste ${h})`);
  return parts.join(' ');
}

/**
 * Single-line Chronicle readout for Ancestral Echo touches. Blank
 * before the first touch.
 */
export function formatAncestralEchoesLine(save: SaveData): string {
  const n = save.ancestralEchoesTouched ?? 0;
  if (n === 0) return '';
  return `⟡ Echoes touched: ${n}`;
}
