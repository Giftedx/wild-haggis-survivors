/**
 * Save/load system using localStorage.
 * Stores permanent upgrades, unlocks, and settings between sessions.
 */

import {
  DEFAULT_VARIANT_KEY,
  VARIANTS,
  VariantKey,
  VariantProgressSnapshot,
  coerceVariantKeys,
  getVariantByKey,
  meetsVariantUnlockCondition,
} from '../data/variants';
import {
  recordBanterHeard,
  recordBeastieKilled,
  recordBeastieSeen,
  recordItemAcquired,
  recordRoutePicked,
} from '../systems/DiscoveryLog';
import type {
  PersonalBests,
  RunHistoryContext,
  RunHistoryEntry,
  RunResult,
  RunSummary,
  SaveData,
} from './save/types';

export type {
  PersonalBests,
  RunHistoryContext,
  RunHistoryEntry,
  RunResult,
  RunSummary,
  SaveData,
  SaveSettings,
} from './save/types';

import {
  BURNS_EVOLUTION_THRESHOLD,
  COASTAL_BIOMES,
  LAST_DEATH_TTL_MS,
  MAX_RUN_HISTORY,
} from './save/schema';

export {
  BURNS_EVOLUTION_THRESHOLD,
  COASTAL_BIOMES,
  LAST_DEATH_TTL_MS,
  MAX_RUN_HISTORY,
  REPLAY_HISTORY_CAP,
  SAVE_SCHEMA_VERSION,
} from './save/schema';

import { loadSave, writeSave } from './save/io';

export { createDefaultSave, loadSave, writeSave } from './save/io';

import { compactReplayBlobs, migrateSave, normalizeRunSummary } from './save/migrations';

export { migrateSave } from './save/migrations';

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


export function recordRun(summary: RunSummary, context?: RunHistoryContext): RunResult {
  const currentSave = loadSave();
  const runResult = applyRunSummary(currentSave, summary, context);
  const persistedSave = writeSave(runResult.save);
  return { ...runResult, save: persistedSave };
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

export function evaluateVariantUnlocks(
  progress: VariantProgressSnapshot,
  previouslyUnlocked: readonly VariantKey[] = []
): { unlockedVariants: VariantKey[]; newlyUnlockedVariants: VariantKey[] } {
  const unlocked = new Set<VariantKey>([DEFAULT_VARIANT_KEY, ...previouslyUnlocked]);

  for (const variant of VARIANTS) {
    if (meetsVariantUnlockCondition(variant, progress)) {
      unlocked.add(variant.key);
    }
  }

  const unlockedVariants = coerceVariantKeys(Array.from(unlocked));
  const previousSet = new Set<VariantKey>(previouslyUnlocked);
  const newlyUnlockedVariants = unlockedVariants.filter((key) => !previousSet.has(key));

  return { unlockedVariants, newlyUnlockedVariants };
}

export function coerceSelectedVariant(
  selectedVariant: unknown,
  unlockedVariants: readonly VariantKey[]
): VariantKey {
  const normalized = getVariantByKey(typeof selectedVariant === 'string' ? selectedVariant : undefined).key;
  return unlockedVariants.includes(normalized) ? normalized : DEFAULT_VARIANT_KEY;
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

/**
 * V2 followup — build a `VariantProgressSnapshot` whose field names
 * match the snapshot contract (short names: `cursedVictories`, not
 * the SaveData long form `cursedVictoriesCompleted`). SaveScenes
 * rendering variant-progress strips must route through this helper
 * rather than pass `SaveData` directly — structural typing masks the
 * name mismatch and silently reports "0/N" for every progress row.
 */
export function progressSnapshotFromSave(save: SaveData): VariantProgressSnapshot {
  return {
    bestTime: save.bestTime,
    bestKills: save.bestKills,
    totalGoldEarned: save.totalGoldEarned,
    victories: save.victories,
    cursedVictories: save.cursedVictoriesCompleted,
    runsWithoutHealing: save.runsWithoutHealingCircleCompleted,
    runsInCoastalOnly: save.runsInCoastalOnlyCompleted,
    runsWithAllEvolutions: save.runsWithAllEvolutionsCompleted,
    burnsNightFullEvoRuns: save.burnsNightFullEvoRunsCompleted,
    unlockedVariants: save.unlockedVariants,
  };
}

/** Shared by GameScene + tests — echoes are "fresh" within the TTL window. */
export function isLastDeathFresh(
  entry: { ts: number } | undefined | null,
  now: number = Date.now(),
): boolean {
  if (!entry) return false;
  return now - entry.ts < LAST_DEATH_TTL_MS;
}


export function appendRunHistory(history: RunHistoryEntry[], entry: RunHistoryEntry): RunHistoryEntry[] {
  const next = [...history, entry];
  if (next.length > MAX_RUN_HISTORY) next.shift();
  return compactReplayBlobs(next);
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
 * Lifetime counter bumps — best-effort persistence used by Standing
 * Stones, Ancestral Echoes, and Ceilidh Chain on each in-run trigger.
 *
 * Each helper does the load → mutate → write pattern that was
 * inlined at three call sites with identical try/catch wrapping.
 * Centralising lets the storage failure mode evolve in one place
 * (silent now; could become a debug warning later).
 */
/**
 * H1 M2 T15 — bump the lifetime boss kill count for `bossKey`. Called
 * live from GameScene's boss-kill hook so the Croft mantelpiece picks
 * up new trophies even if the player abandons the run (quits to menu
 * / closes the tab mid-run). Best-effort on storage failure — no run
 * gameplay depends on this counter.
 */
export function bumpBossKillCount(bossKey: string): void {
  try {
    const cur = loadSave();
    const counts = { ...(cur.bossKillCounts ?? {}) };
    counts[bossKey] = (counts[bossKey] ?? 0) + 1;
    writeSave({ ...cur, bossKillCounts: counts });
  } catch {
    /* best-effort */
  }
}

/**
 * H1 M2 T15 — bump the per-boss cursed-kill tally for `bossKey`. Called
 * when a boss dies while a curse was active on the run, regardless of
 * whether the run ultimately ends in victory. The mantelpiece's
 * 'cursed' tier gates on `>=1` here, so any cursed-run boss kill
 * promotes the trophy to its cursed variant (see `CroftTrophies`).
 */
export function bumpCursedVictoryByBoss(bossKey: string): void {
  try {
    const cur = loadSave();
    const counts = { ...(cur.cursedVictoriesByBoss ?? {}) };
    counts[bossKey] = (counts[bossKey] ?? 0) + 1;
    writeSave({ ...cur, cursedVictoriesByBoss: counts });
  } catch {
    /* best-effort */
  }
}

/**
 * H1 M2 T16 — record a first-picked Moor Road route. Idempotent —
 * writes only when the routeKey isn't already present. Used by
 * ActIntermissionScene's resolve callback to light up the Croft
 * photo-wall polaroid on the first pick, then stay quiet on reruns.
 */
export function addFirstRouteVisit(routeKey: string): void {
  try {
    const cur = loadSave();
    const visits = cur.firstRouteVisits ?? [];
    if (visits.includes(routeKey)) return;
    writeSave({ ...cur, firstRouteVisits: [...visits, routeKey] });
  } catch {
    /* best-effort */
  }
}

export function bumpStandingStonePick(boonId: string): void {
  try {
    const cur = loadSave();
    const picked = { ...(cur.standingStonesPicked ?? {}) };
    picked[boonId] = (picked[boonId] ?? 0) + 1;
    writeSave({ ...cur, standingStonesPicked: picked });
  } catch {
    /* best-effort */
  }
}

/**
 * Bump the lifetime count for a Reliquary curio id on pickup. Mirrors
 * {@link bumpStandingStonePick} — best-effort, silent on storage failure.
 * Used by GameScene's Reliquary.onPick callback so the chronicle +
 * `ach_relic_seeker` deed pick up the event at run-end unlock check.
 */
export function bumpReliquaryCurioPick(curioId: string): void {
  try {
    const cur = loadSave();
    const picked = { ...(cur.reliquaryCuriosPicked ?? {}) };
    picked[curioId] = (picked[curioId] ?? 0) + 1;
    writeSave({ ...cur, reliquaryCuriosPicked: picked });
  } catch {
    /* best-effort */
  }
}

export function bumpAncestralEchoesTouched(): void {
  try {
    const cur = loadSave();
    writeSave({ ...cur, ancestralEchoesTouched: (cur.ancestralEchoesTouched ?? 0) + 1 });
  } catch {
    /* best-effort */
  }
}

export function bumpCeilidhPulsesLifetime(): void {
  try {
    const cur = loadSave();
    writeSave({ ...cur, ceilidhPulsesLifetime: (cur.ceilidhPulsesLifetime ?? 0) + 1 });
  } catch {
    /* best-effort */
  }
}

/**
 * B1 Phase 3 Task 17 — persist an enemy key into `seenEnemies` the first
 * time SpawnSystem encounters it. Best-effort — swallow storage errors
 * so banter never blocks gameplay. No-op when the key is already tracked.
 */
export function bumpSeenEnemy(enemyKey: string): void {
  if (!enemyKey) return;
  try {
    const cur = loadSave();
    if (cur.seenEnemies.includes(enemyKey)) return;
    writeSave({ ...cur, seenEnemies: [...cur.seenEnemies, enemyKey] });
  } catch {
    /* best-effort */
  }
}

/**
 * U1 Task 15 — persist a rune id into `seenRunes` the first time that rune
 * is OFFERED in a card-draw (not once picked — sighting alone meta-unlocks
 * it for future runs). Best-effort — swallow storage errors so level-up
 * never blocks. No-op when the id is already tracked.
 */
export function bumpSeenRune(runeId: string): void {
  if (!runeId) return;
  try {
    const cur = loadSave();
    if (cur.seenRunes.includes(runeId)) return;
    writeSave({ ...cur, seenRunes: [...cur.seenRunes, runeId] });
  } catch {
    /* best-effort */
  }
}

/**
 * C1 M2 Task 11 — record a beastie sighting into the DiscoveryLog.
 * Best-effort — swallow storage errors so spawns never block. Writes
 * only on the first-encounter transition per key to keep the spawn
 * hot path off localStorage; subsequent `seenCount` bumps live in
 * memory only (and the Beasties book never surfaces that counter
 * anyway, per spec §2 — only kill count + first-seen are visible).
 */
export function bumpBeastieSeen(
  beastieKey: string,
  runId: string,
  timestamp: number,
): void {
  if (!beastieKey) return;
  try {
    const cur = loadSave();
    if (cur.discoveryLog.beastiesSeen[beastieKey]) return;
    const nextLog = recordBeastieSeen(cur.discoveryLog, beastieKey, runId, timestamp);
    writeSave({ ...cur, discoveryLog: nextLog });
  } catch {
    /* best-effort */
  }
}

/**
 * C1 M2 Task 11 — per-run buffer of kill counts waiting to be persisted.
 * Populated by `bumpBeastieKilled`, drained by the threshold autoflush
 * inside that function and by explicit `flushBeastieKills()` calls at
 * run-end (RunLifecycle victory/death paths). Batching matters — the
 * marathon smoke regressed the enemy-pool slope by ~2% under per-kill
 * localStorage writes because each kill was doing a full loadSave /
 * finalizeSaveCandidate / writeSave round-trip.
 */
const beastieKillBuffer = new Map<string, number>();

/**
 * Flush auto-triggers once the pending kill tally crosses this many.
 * At peak kill rate (~50/sec) this caps persistence to roughly one
 * write per second — cheap enough for the marathon window while still
 * small enough that a crash loses at most a handful of kills.
 */
const BEASTIE_KILL_FLUSH_THRESHOLD = 64;

/**
 * C1 M2 Task 11 — bump `killCount` for a beastie in the DiscoveryLog.
 * Accumulates in memory and autoflushes once `BEASTIE_KILL_FLUSH_THRESHOLD`
 * kills queue up; RunLifecycle flushes the remainder at run-end so no
 * kills are lost across a regular victory/death transition. On a
 * hard crash (tab close mid-run) the last <64 kills fall on the
 * floor — acceptable tradeoff per spec §8 "seen before your first
 * journal entry" tolerance.
 */
export function bumpBeastieKilled(beastieKey: string): void {
  if (!beastieKey) return;
  const prev = beastieKillBuffer.get(beastieKey) ?? 0;
  beastieKillBuffer.set(beastieKey, prev + 1);
  let total = 0;
  for (const n of beastieKillBuffer.values()) total += n;
  if (total >= BEASTIE_KILL_FLUSH_THRESHOLD) flushBeastieKills();
}

/**
 * Drain the in-memory kill buffer into the persisted DiscoveryLog.
 * Safe to call at any time — no-ops when the buffer is empty, and
 * silently drops keys that were never `bumpBeastieSeen`'d (the
 * DiscoveryLog module's guard rejects kills on unseen keys).
 */
export function flushBeastieKills(): void {
  if (beastieKillBuffer.size === 0) return;
  try {
    const cur = loadSave();
    let log = cur.discoveryLog;
    for (const [key, n] of beastieKillBuffer) {
      for (let i = 0; i < n; i++) log = recordBeastieKilled(log, key);
    }
    beastieKillBuffer.clear();
    if (log === cur.discoveryLog) return; // every key was unseen
    writeSave({ ...cur, discoveryLog: log });
  } catch {
    /* best-effort — keep the buffer populated so the next flush retries */
  }
}

/**
 * C1 M3 Task 14 — record a Moor Road route pick into the DiscoveryLog.
 * Called once per pick-resolve in `GameScene.launchActIntermission`.
 * Best-effort — swallow storage errors so the act-transition never
 * blocks gameplay. Increments `pickCount` on every call (mid-run
 * picks can cross a save boundary, but the bag itself is the source
 * of truth for the run; the persisted log accumulates lifetime picks).
 */
export function bumpRoutePicked(
  routeKey: string,
  runId: string,
  timestamp: number,
): void {
  if (!routeKey) return;
  try {
    const cur = loadSave();
    const nextLog = recordRoutePicked(cur.discoveryLog, routeKey, runId, timestamp);
    writeSave({ ...cur, discoveryLog: nextLog });
  } catch {
    /* best-effort */
  }
}

/**
 * C1 M3 Task 16 — record an item acquisition (weapon / passive /
 * evolution / permanent upgrade / relic) into the DiscoveryLog.
 * Called from LevelUpFlow.apply, ShopScene.purchaseUpgrade, and
 * the Reliquary onPick callback. Best-effort — never blocks gameplay
 * or the shop on storage failure. Increments `acquireCount` on every
 * call so the Finds book can show "picked 5 times" lifetime totals.
 */
export function bumpItemAcquired(
  findKey: string,
  runId: string,
  timestamp: number,
): void {
  if (!findKey) return;
  try {
    const cur = loadSave();
    const nextLog = recordItemAcquired(cur.discoveryLog, findKey, runId, timestamp);
    writeSave({ ...cur, discoveryLog: nextLog });
  } catch {
    /* best-effort */
  }
}

/**
 * C1 M4 Task 19 — record a banter-line firing into the DiscoveryLog.
 * Called from `BanterSystem.onLineFired` after each sink emission.
 * Best-effort — swallows storage errors so a persistence failure
 * never drops a banter line. Caps at `BANTER_HEAR_COUNT_CAP`
 * automatically via `recordBanterHeard`.
 */
export function bumpBanterHeard(
  leafKey: string,
  runId: string,
  timestamp: number,
): void {
  if (!leafKey) return;
  try {
    const cur = loadSave();
    const nextLog = recordBanterHeard(cur.discoveryLog, leafKey, runId, timestamp);
    if (nextLog === cur.discoveryLog) return;
    writeSave({ ...cur, discoveryLog: nextLog });
  } catch {
    /* best-effort */
  }
}

/**
 * B1 Phase 3 Task 18 — atomic check-and-record for first-time banter
 * events. Returns `true` the very first call per event id (caller
 * then fires the `first_time` banter request); returns `false` on
 * every subsequent call + on empty id + on storage failure. The
 * once-and-only-once guarantee lives in `SaveData.firstTimeEventsFired`
 * (persisted), so the line never replays across runs either.
 */
export function bumpFirstTimeEvent(eventId: string): boolean {
  if (!eventId) return false;
  try {
    const cur = loadSave();
    if (cur.firstTimeEventsFired.includes(eventId)) return false;
    writeSave({ ...cur, firstTimeEventsFired: [...cur.firstTimeEventsFired, eventId] });
    return true;
  } catch {
    return false;
  }
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

