/**
 * Run-history append + run-end summary application.
 *
 * Extracted from `src/utils/save.ts` per the 2026-04-30 restructure plan
 * (Phase 1.5). Owns:
 *   - `recordRun` / `applyRunSummary`: end-of-run pipeline that bumps
 *     lifetime counters, evaluates variant unlocks, and appends to
 *     RunHistory.
 *   - `appendRunHistory`: capped insert with replay-blob compaction.
 *   - `wipeIronmoorHistory` / `wipeIronmoorHistoryInPlace`: W66
 *     permadeath chronicle wipe.
 *   - One-shot lifetime writes: `recordPostBellBest`, `recordLastDeath`,
 *     `recordIronmoorBest`, `consumeLastDeath`.
 */

import type { VariantProgressSnapshot } from '../../data/variants';
import { loadSave, writeSave } from './io';
import { compactReplayBlobs, migrateSave, normalizeRunSummary } from './migrations';
import { isCoastalOnlyRun, computeGoldReward } from './queries';
import { BURNS_EVOLUTION_THRESHOLD, MAX_RUN_HISTORY } from './schema';
import type {
  RunHistoryContext,
  RunHistoryEntry,
  RunResult,
  RunSummary,
  SaveData,
} from './types';
import { coerceSelectedVariant, evaluateVariantUnlocks } from './variants';

export function recordRun(summary: RunSummary, context?: RunHistoryContext): RunResult {
  const currentSave = loadSave();
  const runResult = applyRunSummary(currentSave, summary, context);
  const persistedSave = writeSave(runResult.save);
  return { ...runResult, save: persistedSave };
}

export function applyRunSummary(save: SaveData, summary: RunSummary, context?: RunHistoryContext): RunResult {
  const baseSave = migrateSave(save);
  const normalizedSummary = normalizeRunSummary(summary);
  const goldEarned = computeGoldReward(normalizedSummary);

  const historyEntry: RunHistoryEntry = {
    timestamp: Date.now(),
    timeSurvivedSec: normalizedSummary.timeSurvivedSec,
    enemiesKilled: normalizedSummary.enemiesKilled,
    level: context?.level ?? 1,
    bossKills: context?.bossKills ?? 0,
    goldEarned,
    bestCombo: normalizedSummary.bestCombo,
    variantKey: context?.variantKey ?? 'classic',
    isVictory: normalizedSummary.victory,
    weaponKeys: context?.weaponKeys ?? [],
    ...(context?.curseKey ? { curseKey: context.curseKey } : {}),
    ...(context?.routes && context.routes.length > 0 ? { routes: [...context.routes] } : { routes: [] }),
    ...(context?.relics && context.relics.length > 0 ? { relics: [...context.relics] } : { relics: [] }),
    ...(typeof context?.runSeed === 'number' ? { runSeed: context.runSeed } : {}),
    ...(context?.ironmoor ? { ironmoor: true } : {}),
    ...(context?.replay ? { replay: context.replay } : {}),
    ...(typeof context?.name === 'string' && context.name.length > 0 ? { name: context.name } : {}),
    ...(context?.nodeOutcomes && context.nodeOutcomes.length > 0
      ? { nodeOutcomes: [...context.nodeOutcomes] }
      : { nodeOutcomes: [] }),
    ...(context?.sporranPicks && context.sporranPicks.length > 0
      ? { sporranPicks: [...context.sporranPicks] }
      : {}),
  };

  const isCursedVictory =
    normalizedSummary.victory &&
    typeof context?.curseKey === 'string' &&
    context.curseKey.length > 0;

  // V2 T1 — bumps when the player won WITHOUT ever standing in a
  // healing circle. `enteredHealingCircle` defaults to true on the
  // callsite side for safety (undefined context flag shouldn't false-
  // positive the Doric unlock); the flag is only asserted false by
  // GameScene after a clean run.
  const isNoHealVictory =
    normalizedSummary.victory && context?.enteredHealingCircle === false;

  // V2 T2 — bumps when the player won AND only entered the coastal
  // biomes (loch + pine). Missing / empty biomesVisited array defaults
  // false so unwired callers never false-positive the Peerie unlock.
  const isCoastalOnlyVictory = isCoastalOnlyRun(
    normalizedSummary.victory,
    context?.biomesVisited,
  );

  // V2 T3 — bumps when the player won AND reached the evolution
  // threshold (7, all evolvable weapons). Missing / below-threshold
  // evolvedWeaponCount defaults false so unwired callers never false-
  // positive the Burns's Wee Beastie unlock.
  const isFullEvoVictory =
    normalizedSummary.victory &&
    (context?.evolvedWeaponCount ?? 0) >= BURNS_EVOLUTION_THRESHOLD;

  // E1 M2 T11 — Burns's Wee Beastie now requires (a) full evo AND (b)
  // run landed inside a Burns Night window. `seasonalEventKey` is
  // supplied by RunHistoryRecorder.buildContext so the opt-out +
  // device-date are already resolved at source; a missing key (non-
  // Burns run) collapses to false without extra defensive checks.
  const isBurnsFullEvoVictory =
    isFullEvoVictory && context?.seasonalEventKey === 'burns_night';

  const nextSave: SaveData = {
    ...baseSave,
    gold: baseSave.gold + goldEarned,
    totalRuns: baseSave.totalRuns + 1,
    bestTime: Math.max(baseSave.bestTime, normalizedSummary.timeSurvivedSec),
    bestKills: Math.max(baseSave.bestKills, normalizedSummary.enemiesKilled),
    totalKills: baseSave.totalKills + normalizedSummary.enemiesKilled,
    totalGoldEarned: baseSave.totalGoldEarned + goldEarned,
    bestCombo: Math.max(baseSave.bestCombo, normalizedSummary.bestCombo),
    victories: baseSave.victories + (normalizedSummary.victory ? 1 : 0),
    cursedVictoriesCompleted: baseSave.cursedVictoriesCompleted + (isCursedVictory ? 1 : 0),
    runsWithoutHealingCircleCompleted:
      baseSave.runsWithoutHealingCircleCompleted + (isNoHealVictory ? 1 : 0),
    runsInCoastalOnlyCompleted:
      baseSave.runsInCoastalOnlyCompleted + (isCoastalOnlyVictory ? 1 : 0),
    runsWithAllEvolutionsCompleted:
      baseSave.runsWithAllEvolutionsCompleted + (isFullEvoVictory ? 1 : 0),
    burnsNightFullEvoRunsCompleted:
      baseSave.burnsNightFullEvoRunsCompleted + (isBurnsFullEvoVictory ? 1 : 0),
    runHistory: appendRunHistory(baseSave.runHistory, historyEntry),
  };

  // Build a snapshot whose field names match `VariantProgressSnapshot`
  // (SaveData uses longer field names for cursedVictories / runsWithoutHealing
  // / runsInCoastalOnly, so structural typing without an explicit map would
  // silently read `undefined` and fail those unlock resolutions at run-end).
  const runEndSnapshot: VariantProgressSnapshot = {
    bestTime: nextSave.bestTime,
    bestKills: nextSave.bestKills,
    totalGoldEarned: nextSave.totalGoldEarned,
    victories: nextSave.victories,
    cursedVictories: nextSave.cursedVictoriesCompleted,
    runsWithoutHealing: nextSave.runsWithoutHealingCircleCompleted,
    runsInCoastalOnly: nextSave.runsInCoastalOnlyCompleted,
    runsWithAllEvolutions: nextSave.runsWithAllEvolutionsCompleted,
    burnsNightFullEvoRuns: nextSave.burnsNightFullEvoRunsCompleted,
    unlockedVariants: baseSave.unlockedVariants,
  };
  const unlockResult = evaluateVariantUnlocks(runEndSnapshot, baseSave.unlockedVariants);
  nextSave.unlockedVariants = unlockResult.unlockedVariants;
  nextSave.selectedVariant = coerceSelectedVariant(baseSave.selectedVariant, nextSave.unlockedVariants);

  return {
    save: nextSave,
    goldEarned,
    newlyUnlockedVariants: unlockResult.newlyUnlockedVariants,
  };
}

export function appendRunHistory(history: RunHistoryEntry[], entry: RunHistoryEntry): RunHistoryEntry[] {
  const next = [...history, entry];
  if (next.length > MAX_RUN_HISTORY) next.shift();
  return compactReplayBlobs(next);
}

/**
 * W66 Ironmoor chronicle wipe. Returns a new SaveData with every
 * `runHistory` entry flagged `ironmoor: true` removed. Pure — does not
 * touch `bestIronmoorSeconds` (the separate leaderboard survives the
 * permadeath wipe) or any non-Ironmoor row. If there were no Ironmoor
 * entries, returns the same object reference so callers can cheaply
 * detect "nothing to wipe".
 */
export function wipeIronmoorHistory(save: SaveData): SaveData {
  const filtered = save.runHistory.filter((e) => !e.ironmoor);
  if (filtered.length === save.runHistory.length) return save;
  return { ...save, runHistory: filtered };
}

/**
 * Best-effort: write `secPast` to `bestEndlessSeconds` if it beats the
 * current record. No-op (and silent) when secPast <= the record. Used
 * by RunLifecycle on death after a Post-Bell run.
 */
export function recordPostBellBest(secPast: number): void {
  if (secPast <= 0) return;
  try {
    const cur = loadSave();
    const best = cur.bestEndlessSeconds ?? 0;
    if (secPast > best) {
      writeSave({ ...cur, bestEndlessSeconds: secPast });
    }
  } catch {
    /* best-effort */
  }
}

/**
 * Best-effort: persist the player's last death position so the next
 * run can spawn an Ancestral Echo at the spot.
 */
export function recordLastDeath(x: number, y: number, now: number = Date.now()): void {
  try {
    const cur = loadSave();
    writeSave({
      ...cur,
      lastDeath: { x: Math.round(x), y: Math.round(y), ts: Math.floor(now) },
    });
  } catch {
    /* best-effort */
  }
}

/**
 * Best-effort: write `time` to `bestIronmoorSeconds` if it beats the
 * current record (or if no record exists yet — bestIronmoorSeconds=0
 * is "no Ironmoor victory yet"). Lower-is-better since this is a
 * fastest-victory record. No-op for non-positive `time`.
 */
export function recordIronmoorBest(time: number): void {
  if (time <= 0) return;
  try {
    const cur = loadSave();
    const best = cur.bestIronmoorSeconds ?? 0;
    if (best === 0 || time < best) {
      writeSave({ ...cur, bestIronmoorSeconds: time });
    }
  } catch {
    /* best-effort */
  }
}

/**
 * Best-effort: clear the persisted last-death position. Called after
 * the Ancestral Echo for that death has been spawned, so it doesn't
 * re-trigger every run until the next death writes a new record.
 */
export function consumeLastDeath(): void {
  try {
    const cur = loadSave();
    if (cur.lastDeath === undefined) return;
    writeSave({ ...cur, lastDeath: undefined });
  } catch {
    /* best-effort */
  }
}

/**
 * Best-effort: load → wipe → write the Ironmoor chronicle wipe.
 * Returns true when at least one row was cleared (caller can then
 * show the wipe toast); returns false when nothing changed or the
 * load/write failed.
 */
export function wipeIronmoorHistoryInPlace(): boolean {
  try {
    const cur = loadSave();
    const next = wipeIronmoorHistory(cur);
    if (next === cur) return false;
    writeSave(next);
    return true;
  } catch {
    return false;
  }
}
