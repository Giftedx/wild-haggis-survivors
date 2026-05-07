/**
 * Lifetime counter bumps + DiscoveryLog incrementers — load → mutate →
 * write best-effort persistence used by Standing Stones, Ancestral
 * Echoes, Ceilidh Chain, beasties, runes, routes, items, banter,
 * first-time events, and the H1 Croft trophy fields.
 *
 * Each helper does the load → mutate → write pattern that was inlined
 * at the call sites with identical try/catch wrapping. Centralising
 * lets the storage failure mode evolve in one place (silent now;
 * could become a debug warning later).
 *
 * Extracted from `src/utils/save.ts` per the 2026-04-30 restructure
 * plan (Phase 1.4). The `beastieKillBuffer` Map is module-state — moves
 * AS A UNIT with `bumpBeastieKilled` + `flushBeastieKills`. Duplicating
 * the Map across modules silently splits kill counts; an explicit grep
 * gate in CI blocks any future re-introduction.
 */

import {
  recordBanterHeard,
  recordBeastieKilled,
  recordBeastieSeen,
  recordItemAcquired,
  recordRoutePicked,
} from '../../systems/DiscoveryLog';
import { loadSave, writeSave } from './io';

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
