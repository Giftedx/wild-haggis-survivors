/**
 * Pure query/derivation helpers over SaveData and run-history slices.
 *
 * Extracted from `src/utils/save.ts` per the 2026-04-30 restructure plan
 * (Phase 1.5). These are the pure, dependency-light read paths —
 * `getPersonalBests`, win/trend/avg-survival rollups, the coastal-run
 * predicate, the last-death TTL check, the gold reward formula. No IO,
 * no localStorage; safe to call from tests, UI, scenes, anywhere.
 */

import { normalizeRunSummary } from './migrations';
import { COASTAL_BIOMES, LAST_DEATH_TTL_MS } from './schema';
import type { PersonalBests, RunHistoryEntry, RunSummary } from './types';

/**
 * Returns true when the run was victorious AND the player visited a
 * non-empty set of biomes all drawn from `COASTAL_BIOMES`. Used by
 * `applyRunSummary` to decide whether to bump the Peerie Shetlander
 * lifetime counter. Pure — safe to call in tests.
 */
export function isCoastalOnlyRun(
  victory: boolean,
  biomesVisited: readonly string[] | undefined,
): boolean {
  if (!victory) return false;
  if (!biomesVisited || biomesVisited.length === 0) return false;
  return biomesVisited.every((id) => COASTAL_BIOMES.has(id));
}

export function computeGoldReward(summary: RunSummary): number {
  const normalized = normalizeRunSummary(summary);
  const netCoin = Math.max(0, normalized.coinGold - normalized.coinGoldSpent);
  const base =
    normalized.timeSurvivedSec * 0.4 +
    normalized.enemiesKilled * 0.4 +
    normalized.bossGold +
    netCoin;
  return Math.floor(base * normalized.goldMult);
}

/** Shared by GameScene + tests — echoes are "fresh" within the TTL window. */
export function isLastDeathFresh(
  entry: { ts: number } | undefined | null,
  now: number = Date.now(),
): boolean {
  if (!entry) return false;
  return now - entry.ts < LAST_DEATH_TTL_MS;
}

export function getPersonalBests(history: RunHistoryEntry[]): PersonalBests {
  let bestTime = 0;
  let bestKills = 0;
  let bestCombo = 0;
  for (const entry of history) {
    if (entry.timeSurvivedSec > bestTime) bestTime = entry.timeSurvivedSec;
    if (entry.enemiesKilled > bestKills) bestKills = entry.enemiesKilled;
    if (entry.bestCombo > bestCombo) bestCombo = entry.bestCombo;
  }
  return { bestTime, bestKills, bestCombo };
}

export function getWinRate(history: RunHistoryEntry[]): number {
  if (history.length === 0) return 0;
  const wins = history.filter((e) => e.isVictory).length;
  return wins / history.length;
}

export function getAverageSurvivalTime(history: RunHistoryEntry[]): number {
  if (history.length === 0) return 0;
  const total = history.reduce((sum, e) => sum + e.timeSurvivedSec, 0);
  return total / history.length;
}

export function getTrend(history: RunHistoryEntry[]): 'improving' | 'declining' | 'steady' {
  if (history.length < 3) return 'steady';
  const recent = history.slice(-5);
  const overallAvg = getAverageSurvivalTime(history);
  const recentAvg = recent.reduce((sum, e) => sum + e.timeSurvivedSec, 0) / recent.length;
  const ratio = overallAvg > 0 ? recentAvg / overallAvg : 1;
  if (ratio > 1.1) return 'improving';
  if (ratio < 0.9) return 'declining';
  return 'steady';
}
