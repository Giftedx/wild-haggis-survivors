/**
 * Save schema migration chain. Pure-ish — load → coerce → finalize.
 *
 * Extracted from `src/utils/save.ts` per the 2026-04-30 restructure plan
 * (Phase 1.3). Owns:
 *   - the `migrateSave` switch + 14 V→V step functions
 *   - `finalizeSaveCandidate` (the coerce-and-seed wrapper)
 *   - all coercion helpers (coerce*, seed*, normalizeRunSummary,
 *     buildProgressSnapshot, compactReplayBlobs, isRecord)
 *
 * Bumping `SAVE_SCHEMA_VERSION` requires adding a new `migrateV{N-1}ToV{N}`
 * step and threading it through the switch in `migrateSave`.
 */

import type { NodeOutcome } from '../../data/nodeTypes';
import type { RoutePick } from '../../data/routes';
import { RELIC_KEYS, type RelicKey } from '../../data/relics';
import { SPORRAN_CARD_IDS } from '../../data/sporranCards';
import { generateHaggisNameFromHash } from '../../data/haggisNames';
import { isReplayBlobAny } from '../../replay/replayBlob';
import {
  type VariantKey,
  type VariantProgressSnapshot,
  coerceVariantKeys,
} from '../../data/variants';
import {
  discoveryLogFromJSON,
  retroactiveSeedFromHistory,
  type DiscoveryLog,
  type RetroHistoryEntry,
} from '../../systems/DiscoveryLog';
import { coerceSelectedVariant, evaluateVariantUnlocks } from './variants';
import { DEFAULT_SAVE, DEFAULT_SETTINGS, createDefaultSave } from './io';
import {
  MAX_RUN_HISTORY,
  REPLAY_HISTORY_CAP,
  SAVE_SCHEMA_VERSION,
} from './schema';
import type {
  RunHistoryEntry,
  RunSummary,
  SaveData,
  SaveSettings,
} from './types';

export type SaveRecord = Record<string, unknown>;

export function migrateSave(raw: unknown): SaveData {
  if (!isRecord(raw)) return createDefaultSave();

  const schemaVersion = coerceInteger(raw.schemaVersion, 0);
  switch (schemaVersion) {
    case 0:
    case 1:
      return finalizeSaveCandidate(migrateLegacySave(raw));
    case 2:
      return finalizeSaveCandidate({ ...raw, schemaVersion: SAVE_SCHEMA_VERSION, runHistory: [] });
    case 3:
      return finalizeSaveCandidate(migrateV3ToV4(raw));
    case 4:
      return finalizeSaveCandidate(migrateV4ToV5(raw));
    case 5:
      return finalizeSaveCandidate(migrateV5ToV6(raw));
    case 6:
      return finalizeSaveCandidate(migrateV6ToV7(raw));
    case 7:
      return finalizeSaveCandidate(migrateV7ToV8(raw));
    case 8:
      return finalizeSaveCandidate(migrateV8ToV9(raw));
    case 9:
      return finalizeSaveCandidate(migrateV9ToV10(raw));
    case 10:
      return finalizeSaveCandidate(migrateV10ToV11(raw));
    case 11:
      return finalizeSaveCandidate(migrateV11ToV12(raw));
    case 12:
      return finalizeSaveCandidate(migrateV12ToV13(raw));
    case 13:
      return finalizeSaveCandidate(migrateV13ToV14(raw));
    case 14:
      return finalizeSaveCandidate(migrateV14ToV15(raw));
    case 15:
      return finalizeSaveCandidate(migrateV15ToV16(raw));
    case 16:
      return finalizeSaveCandidate(migrateV16ToV17(raw));
    case 17:
      return finalizeSaveCandidate(migrateV17ToV18(raw));
    case 18:
      return finalizeSaveCandidate(migrateV18ToV19(raw));
    case 19:
      return finalizeSaveCandidate(migrateV19ToV20(raw));
    case 20:
      return finalizeSaveCandidate(migrateV20ToV21(raw));
    default:
      if (schemaVersion > SAVE_SCHEMA_VERSION) {
        console.warn(`Save schemaVersion ${schemaVersion} is newer than supported (${SAVE_SCHEMA_VERSION}); fields may be lost.`);
      }
      return finalizeSaveCandidate(raw);
  }
}

function migrateLegacySave(raw: SaveRecord): SaveRecord {
  const legacySettings = isRecord(raw.settings) ? raw.settings : {};
  const legacyUpgrades = isRecord(raw.upgrades) ? raw.upgrades : {};

  return {
    ...raw,
    schemaVersion: SAVE_SCHEMA_VERSION,
    upgrades: legacyUpgrades,
    settings: {
      soundOn: coerceBoolean(legacySettings.soundOn, DEFAULT_SETTINGS.soundOn),
      musicOn: coerceBoolean(legacySettings.musicOn, DEFAULT_SETTINGS.musicOn),
    },
  };
}

function migrateV3ToV4(raw: SaveRecord): SaveRecord {
  const history = Array.isArray(raw.runHistory) ? raw.runHistory : [];
  const normalized = history.map((entry) => {
    if (!isRecord(entry)) return entry;
    const existing = Array.isArray(entry.routes) ? entry.routes : [];
    return { ...entry, routes: existing };
  });
  // Carry forward into v5 in one step — v4 → v5 adds an optional `replay`
  // field only, so nothing to backfill per-entry.
  return { ...raw, schemaVersion: SAVE_SCHEMA_VERSION, runHistory: normalized };
}

/**
 * v4 → v5 adds `RunHistoryEntry.replay?: ReplayBlob` for T1 deterministic
 * replay. The field is optional, so migration is a pure version bump —
 * pre-v5 history entries remain valid with `replay` absent.
 */
function migrateV4ToV5(raw: SaveRecord): SaveRecord {
  return { ...raw, schemaVersion: SAVE_SCHEMA_VERSION };
}

/**
 * v5 → v6 widens `RunHistoryEntry.replay` from `ReplayBlob` (v1) to
 * `ReplayBlobAny` (v1 ∪ v2) for T1 Phase 3. No per-entry rewrite needed —
 * existing v1 blobs already validate under the union via `isReplayBlobAny`.
 * Pure version bump.
 */
function migrateV5ToV6(raw: SaveRecord): SaveRecord {
  return { ...raw, schemaVersion: SAVE_SCHEMA_VERSION };
}

/**
 * v6 → v7 adds `seenEnemies: string[]` and `firstTimeEventsFired: string[]`
 * for the B1 banter density push. Both default to empty — pre-v7 saves
 * simply haven't tracked these, so every enemy will fire the first-encounter
 * line exactly once per player from the upgrade onward. Pure version bump;
 * `finalizeSaveCandidate` coerces the fields via `coerceStringArray`.
 */
function migrateV6ToV7(raw: SaveRecord): SaveRecord {
  return { ...raw, schemaVersion: SAVE_SCHEMA_VERSION };
}

/**
 * v7 → v8 adds `discoveryLog: DiscoveryLog` for the C1 Highland Almanac.
 * Pure version bump; `finalizeSaveCandidate` handles two cases:
 * (a) field absent (pre-v8 save) — retroactively seed from runHistory;
 * (b) field present but malformed — coerce via discoveryLogFromJSON.
 */
function migrateV7ToV8(raw: SaveRecord): SaveRecord {
  return { ...raw, schemaVersion: SAVE_SCHEMA_VERSION };
}

/**
 * v8 → v9 adds `RunHistoryEntry.relics?: RelicKey[]` for R1 Relics —
 * records the relics the player held when the run ended so the
 * Chronicle + Highland Almanac can surface them. Pure version bump;
 * `coerceRunHistoryEntry` defaults the field to `[]` for pre-v9 entries
 * and filters out stale / malformed keys on load.
 */
function migrateV8ToV9(raw: SaveRecord): SaveRecord {
  return { ...raw, schemaVersion: SAVE_SCHEMA_VERSION };
}

/**
 * v9 → v10 adds `runsWithoutHealingCircleCompleted: number` (V2 Track 1,
 * Doric Quinie unlock). Pure version bump — `finalizeSaveCandidate`
 * coerces the missing field to 0 via `coerceInteger`. No retroactive
 * seed possible (pre-v10 runs didn't track per-run healing overlap).
 */
function migrateV9ToV10(raw: SaveRecord): SaveRecord {
  return { ...raw, schemaVersion: SAVE_SCHEMA_VERSION };
}

/**
 * v10 → v11 adds `runsInCoastalOnlyCompleted: number` (V2 Track 2,
 * Peerie Shetlander unlock). Pure version bump — `finalizeSaveCandidate`
 * coerces the missing field to 0 via `coerceInteger`. No retroactive
 * seed possible (pre-v11 runs didn't persist per-run biomes-visited
 * set). Per-run biome set is transient context on `RunHistoryContext`,
 * not persisted per history entry — the lifetime counter is the only
 * durable state needed.
 */
function migrateV10ToV11(raw: SaveRecord): SaveRecord {
  return { ...raw, schemaVersion: SAVE_SCHEMA_VERSION };
}

/**
 * v11 → v12 adds `runsWithAllEvolutionsCompleted: number` (V2 Track 3,
 * Burns's Wee Beastie unlock placeholder). Pure version bump — counter
 * coerced to 0 on load. Per-run evolution count is transient context,
 * not persisted per history entry.
 */
function migrateV11ToV12(raw: SaveRecord): SaveRecord {
  return { ...raw, schemaVersion: SAVE_SCHEMA_VERSION };
}

/**
 * v12 → v13 adds `RunHistoryEntry.seasonalEvent?: string` (E1 M1
 * seasonal events). Pure version bump — field is optional, absent on
 * every pre-v13 entry by default. No retroactive seed: we cannot
 * reconstruct past event-window membership without the original run
 * timestamp + event calendar, and the Chronicle badge is cosmetic.
 */
function migrateV12ToV13(raw: SaveRecord): SaveRecord {
  return { ...raw, schemaVersion: SAVE_SCHEMA_VERSION };
}

/**
 * v13 → v14 adds three H1 Gran's Croft fields — `bossKillCounts`,
 * `firstRouteVisits`, `cursedVictoriesByBoss`. Pure version bump here;
 * the actual retroactive seed from `runHistory` lives in
 * `finalizeSaveCandidate` alongside the existing v8 discoveryLog +
 * cursedVictoriesCompleted seeds, so new saves get the full
 * coerce-and-seed treatment uniformly.
 */
function migrateV13ToV14(raw: SaveRecord): SaveRecord {
  return { ...raw, schemaVersion: SAVE_SCHEMA_VERSION };
}

/**
 * v14 → v15 adds `burnsNightFullEvoRunsCompleted: number` (E1 M2 T11,
 * tightened Burns's Wee Beastie unlock gate). Pure version bump —
 * `finalizeSaveCandidate` coerces the missing field to 0 via
 * `coerceInteger`. No retroactive seed: we never stored evolvedWeaponCount
 * on history entries, so past full-evo-during-Burns-Night runs are
 * unrecoverable. Fresh counter starts at 0 for all.
 */
function migrateV14ToV15(raw: SaveRecord): SaveRecord {
  return { ...raw, schemaVersion: SAVE_SCHEMA_VERSION };
}

/**
 * v15 → v16 adds `RunHistoryEntry.nodeOutcomes?: NodeOutcome[]` (M1
 * Moor Road multi-node). Pure version bump — `coerceRunHistoryEntry`
 * defaults the field to `[]` for pre-v16 entries. No retroactive seed:
 * pre-M1 runs had no node events to reconstruct.
 */
function migrateV15ToV16(raw: SaveRecord): SaveRecord {
  return { ...raw, schemaVersion: SAVE_SCHEMA_VERSION };
}

/**
 * v16 → v17 (U1 Rune tier). Adds `seenRunes: string[]` — the meta-unlock
 * set for the Rune upgrade rarity. Pre-v17 saves default to an empty
 * array; field is lazily populated at card-offer time by the Rune system.
 * No field-level migration beyond the version bump — the coercer below
 * handles absent / malformed arrays.
 */
function migrateV16ToV17(raw: SaveRecord): SaveRecord {
  return { ...raw, schemaVersion: SAVE_SCHEMA_VERSION };
}

/**
 * v17 → v18 (Lemmings Easter Egg, DESIGN_IDEAS §13). Adds
 * `lemmingsSeenForVariant: string[]` — variant keys that have already
 * earned the cliff-edge parade. Once-per-variant lifetime trigger.
 * Pre-v18 saves default to `[]`; the field is lazily populated when
 * the trigger fires the first time per variant. No field-level
 * migration beyond the version bump — the coercer in
 * `finalizeSaveCandidate` handles absent / malformed arrays via
 * `coerceStringArray`.
 */
function migrateV17ToV18(raw: SaveRecord): SaveRecord {
  return { ...raw, schemaVersion: SAVE_SCHEMA_VERSION };
}

/**
 * v18 → v19 (S1 Phase 2 — Sporran Deck chronicle persistence). Adds
 * `RunHistoryEntry.sporranPicks?: string[]` — the 3 Sporran card IDs
 * the player kept at the start of each run. Pure version bump; the
 * field is optional, absent on every pre-v19 entry by default. No
 * retroactive seed: pre-v19 runs didn't track picks, and reconstructing
 * from the embedded replay blob (when present) is brittle for runs that
 * never recorded one. The coercer in `coerceRunHistoryEntry` validates
 * IDs against `SPORRAN_CARD_IDS` so a renamed / removed card never
 * survives load; absent / malformed → field omitted.
 */
function migrateV18ToV19(raw: SaveRecord): SaveRecord {
  return { ...raw, schemaVersion: SAVE_SCHEMA_VERSION };
}

/**
 * v19 → v20 (Race the Beithir lifetime cure counter, DESIGN_IDEAS §1
 * v2 follow-up). Adds `beithirCuresLifetime?: number` — bumped on each
 * successful cure (heal-water OR kill-beast); pre-bump 0 gates the
 * `cured_heal_first` / `cured_kill_first` banter sub-pools so the
 * first cure ever feels like discovery, not muscle memory. Pure version
 * bump — `finalizeSaveCandidate` coerces the missing field to 0 via
 * `coerceInteger`. No retroactive seed: per-run cure outcomes were
 * never persisted, so past cures are unrecoverable. Fresh counter
 * starts at 0 for all returning players, so they get one more
 * "first-cure" wonder beat the next time they cure a sting.
 */
function migrateV19ToV20(raw: SaveRecord): SaveRecord {
  return { ...raw, schemaVersion: SAVE_SCHEMA_VERSION };
}

/**
 * v20 → v21 (Clootie Rag Wager lifetime counter, DESIGN_IDEAS §1
 * v2 follow-up). Adds `clootieWagersLifetime?: number` — bumped on
 * each committed wager (walk-through commits the supplication); pre-
 * bump 0 gates the `bound_first` banter sub-pool so the first wager
 * ever feels like discovery, not muscle memory. Sister to v20 beithir.
 * Pure version bump — `finalizeSaveCandidate` coerces the missing
 * field to 0 via `coerceInteger`. No retroactive seed: per-run wager
 * outcomes were never persisted, so past wagers are unrecoverable.
 * Fresh counter starts at 0 for all returning players, so they get
 * one more "first-wager" supplication beat next time they bind a rag.
 */
function migrateV20ToV21(raw: SaveRecord): SaveRecord {
  return { ...raw, schemaVersion: SAVE_SCHEMA_VERSION };
}

function finalizeSaveCandidate(candidate: SaveRecord): SaveData {
  const unlockedVariants = coerceVariantKeys(candidate.unlockedVariants);
  const progress = buildProgressSnapshot(candidate, unlockedVariants);
  const unlockResult = evaluateVariantUnlocks(progress, unlockedVariants);
  const lastDeath = coerceLastDeath(candidate.lastDeath);
  const stonesPicked = coerceStonesPicked(candidate.standingStonesPicked);
  const reliquaryPicked = coerceReliquaryCuriosPicked(candidate.reliquaryCuriosPicked);
  const runHistory = coerceRunHistory(candidate.runHistory);

  // Retroactive seed: if the field was absent, count past cursed victories from history.
  let cursedVictoriesCompleted = coerceInteger(candidate.cursedVictoriesCompleted, 0);
  if (!('cursedVictoriesCompleted' in candidate) && runHistory.length > 0) {
    try {
      cursedVictoriesCompleted = runHistory.filter(
        (r) => r.isVictory && typeof r.curseKey === 'string' && r.curseKey.length > 0
      ).length;
    } catch {
      cursedVictoriesCompleted = 0;
    }
  }

  const discoveryLog = coerceDiscoveryLog(candidate, runHistory);

  // H1 M2 T11 — Croft trophy fields. Coerce if present, otherwise
  // reconstruct approximate counts from W2 act gates (routes[0]
  // picked = gordon kill, routes[1] picked = tour_bus kill,
  // isVictory = taxman kill). Mid-act bosses can't be seeded.
  const { bossKillCounts, firstRouteVisits, cursedVictoriesByBoss } =
    coerceCroftTrophyFields(candidate, runHistory);

  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    gold: coerceInteger(candidate.gold, DEFAULT_SAVE.gold),
    upgrades: coerceUpgradeLevels(candidate.upgrades),
    unlockedVariants: unlockResult.unlockedVariants,
    selectedVariant: coerceSelectedVariant(candidate.selectedVariant, unlockResult.unlockedVariants),
    totalRuns: coerceInteger(candidate.totalRuns, DEFAULT_SAVE.totalRuns),
    bestTime: coerceInteger(candidate.bestTime, DEFAULT_SAVE.bestTime),
    bestKills: coerceInteger(candidate.bestKills, DEFAULT_SAVE.bestKills),
    totalKills: coerceInteger(candidate.totalKills, DEFAULT_SAVE.totalKills),
    totalGoldEarned: coerceInteger(candidate.totalGoldEarned, DEFAULT_SAVE.totalGoldEarned),
    bestCombo: coerceInteger(candidate.bestCombo, DEFAULT_SAVE.bestCombo),
    victories: coerceInteger(candidate.victories, DEFAULT_SAVE.victories),
    bestEndlessSeconds: coerceInteger(candidate.bestEndlessSeconds, 0),
    bestIronmoorSeconds: coerceInteger(candidate.bestIronmoorSeconds, 0),
    cursedVictoriesCompleted,
    runsWithoutHealingCircleCompleted: coerceInteger(candidate.runsWithoutHealingCircleCompleted, 0),
    runsInCoastalOnlyCompleted: coerceInteger(candidate.runsInCoastalOnlyCompleted, 0),
    runsWithAllEvolutionsCompleted: coerceInteger(candidate.runsWithAllEvolutionsCompleted, 0),
    burnsNightFullEvoRunsCompleted: coerceInteger(candidate.burnsNightFullEvoRunsCompleted, 0),
    bossKillCounts,
    firstRouteVisits,
    cursedVictoriesByBoss,
    ...(lastDeath ? { lastDeath } : {}),
    ...(stonesPicked ? { standingStonesPicked: stonesPicked } : {}),
    ...(reliquaryPicked ? { reliquaryCuriosPicked: reliquaryPicked } : {}),
    ancestralEchoesTouched: coerceInteger(candidate.ancestralEchoesTouched, 0),
    ceilidhPulsesLifetime: coerceInteger(candidate.ceilidhPulsesLifetime, 0),
    beithirCuresLifetime: coerceInteger(candidate.beithirCuresLifetime, 0),
    clootieWagersLifetime: coerceInteger(candidate.clootieWagersLifetime, 0),
    runHistory,
    seenEnemies: coerceStringArray(candidate.seenEnemies),
    firstTimeEventsFired: coerceStringArray(candidate.firstTimeEventsFired),
    discoveryLog,
    seenRunes: coerceStringArray(candidate.seenRunes),
    lemmingsSeenForVariant: coerceStringArray(candidate.lemmingsSeenForVariant),
    settings: coerceSettings(candidate.settings),
  };
}

/**
 * C1 v8 — discovery-log coercion with retroactive seed. Two cases:
 * (a) the field is absent from the candidate — pre-v8 save; seed an
 *     approximate log from runHistory (routes + weapons reconstructible).
 * (b) the field is present — coerce malformed entries away via
 *     discoveryLogFromJSON; caller's good entries survive.
 */
function coerceDiscoveryLog(
  candidate: SaveRecord,
  runHistory: readonly RunHistoryEntry[],
): DiscoveryLog {
  if ('discoveryLog' in candidate) {
    return discoveryLogFromJSON(candidate.discoveryLog);
  }
  const retroEntries: RetroHistoryEntry[] = runHistory.map((entry) => ({
    timestamp: entry.timestamp,
    weaponKeys: entry.weaponKeys,
    routes: entry.routes,
    ...(typeof entry.runSeed === 'number' ? { runSeed: entry.runSeed } : {}),
  }));
  return retroactiveSeedFromHistory(retroEntries);
}

/**
 * B1 v7 — string-array coercer shared by `seenEnemies` and
 * `firstTimeEventsFired`. Drops non-string / empty entries and dedupes
 * while preserving first-seen order. Non-array input returns `[]`.
 */
function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of value) {
    if (typeof raw !== 'string' || raw.length === 0) continue;
    if (seen.has(raw)) continue;
    seen.add(raw);
    out.push(raw);
  }
  return out;
}

function buildProgressSnapshot(
  candidate: SaveRecord,
  unlockedVariants: readonly VariantKey[]
): VariantProgressSnapshot {
  return {
    bestTime: coerceInteger(candidate.bestTime, DEFAULT_SAVE.bestTime),
    bestKills: coerceInteger(candidate.bestKills, DEFAULT_SAVE.bestKills),
    totalGoldEarned: coerceInteger(candidate.totalGoldEarned, DEFAULT_SAVE.totalGoldEarned),
    victories: coerceInteger(candidate.victories, DEFAULT_SAVE.victories),
    cursedVictories: coerceInteger(candidate.cursedVictoriesCompleted, 0),
    runsWithoutHealing: coerceInteger(candidate.runsWithoutHealingCircleCompleted, 0),
    runsInCoastalOnly: coerceInteger(candidate.runsInCoastalOnlyCompleted, 0),
    runsWithAllEvolutions: coerceInteger(candidate.runsWithAllEvolutionsCompleted, 0),
    burnsNightFullEvoRuns: coerceInteger(candidate.burnsNightFullEvoRunsCompleted, 0),
    unlockedVariants,
  };
}

export function normalizeRunSummary(summary: RunSummary): Required<RunSummary> {
  return {
    // Round (not floor) so a 299.9s run — which in-game is visibly at 5:00 —
    // doesn't get recorded as bestTime 4:59 and undercount gold reward.
    timeSurvivedSec: coerceRoundedNonNegative(summary.timeSurvivedSec, 0),
    enemiesKilled: coerceInteger(summary.enemiesKilled, 0),
    bossGold: coerceInteger(summary.bossGold, 0),
    coinGold: coerceInteger(summary.coinGold, 0),
    coinGoldSpent: coerceInteger(summary.coinGoldSpent, 0),
    bestCombo: coerceInteger(summary.bestCombo, 0),
    victory: Boolean(summary.victory),
    goldMult: coerceFinitePositive(summary.goldMult, 1),
  };
}

function coerceFinitePositive(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

function coerceRoundedNonNegative(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.round(value));
}

function coerceLastDeath(raw: unknown): { x: number; y: number; ts: number } | undefined {
  if (!isRecord(raw)) return undefined;
  const x = typeof raw.x === 'number' && Number.isFinite(raw.x) ? raw.x : undefined;
  const y = typeof raw.y === 'number' && Number.isFinite(raw.y) ? raw.y : undefined;
  const ts = typeof raw.ts === 'number' && Number.isFinite(raw.ts) && raw.ts > 0 ? Math.floor(raw.ts) : undefined;
  if (x === undefined || y === undefined || ts === undefined) return undefined;
  return { x, y, ts };
}

/**
 * Accepts a record of boonId → lifetime count. Drops non-numeric /
 * non-finite / negative values. Returns undefined for empty / invalid
 * inputs so `finalizeSaveCandidate` can omit the field entirely (keeps
 * the save lean on fresh accounts).
 */
function coerceStonesPicked(raw: unknown): Record<string, number> | undefined {
  if (!isRecord(raw)) return undefined;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof k !== 'string' || k.length === 0) continue;
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) continue;
    out[k] = Math.floor(v);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * H1 M2 T11 — coerce + retroactively seed the three Croft trophy
 * fields (`bossKillCounts`, `firstRouteVisits`, `cursedVictoriesByBoss`).
 *
 * If a field is already present on the candidate, the stored value
 * wins (saves that have been writing these fields since v14 should
 * never regress to seed-reconstructed values). Absence triggers a
 * best-effort seed from `runHistory` using W2 act-gate inferences:
 *
 *   - routes[0] (slot A) picked → gordon kill credited
 *   - routes[1] (slot B) picked → tour_bus kill credited
 *   - isVictory = true          → taxman kill credited
 *   - victory + curseKey → cursedVictoriesByBoss.taxman += 1
 *
 * Mid-act bosses (laird, hunter_general) aren't route-gated so the
 * seed can't credit them; their kill tallies fill in from the live
 * boss-death hook (T15) going forward.
 */
function coerceCroftTrophyFields(
  candidate: SaveRecord,
  runHistory: readonly RunHistoryEntry[],
): {
  bossKillCounts: Record<string, number>;
  firstRouteVisits: string[];
  cursedVictoriesByBoss: Record<string, number>;
} {
  const bossKillCountsProvided = 'bossKillCounts' in candidate;
  const firstRouteVisitsProvided = 'firstRouteVisits' in candidate;
  const cursedVictoriesByBossProvided = 'cursedVictoriesByBoss' in candidate;

  let bossKillCounts: Record<string, number> = bossKillCountsProvided
    ? coerceStringNumberRecord(candidate.bossKillCounts)
    : {};
  let firstRouteVisits: string[] = firstRouteVisitsProvided
    ? coerceStringArray(candidate.firstRouteVisits)
    : [];
  let cursedVictoriesByBoss: Record<string, number> = cursedVictoriesByBossProvided
    ? coerceStringNumberRecord(candidate.cursedVictoriesByBoss)
    : {};

  // Retroactive seed — only when the field is absent. Explicitly-set
  // empty {} / [] in the persisted save is honoured.
  if (!bossKillCountsProvided && runHistory.length > 0) {
    bossKillCounts = seedBossKillCountsFromHistory(runHistory);
  }
  if (!firstRouteVisitsProvided && runHistory.length > 0) {
    firstRouteVisits = seedFirstRouteVisitsFromHistory(runHistory);
  }
  if (!cursedVictoriesByBossProvided && runHistory.length > 0) {
    cursedVictoriesByBoss = seedCursedVictoriesByBossFromHistory(runHistory);
  }

  return { bossKillCounts, firstRouteVisits, cursedVictoriesByBoss };
}

function seedBossKillCountsFromHistory(
  runHistory: readonly RunHistoryEntry[],
): Record<string, number> {
  const out: Record<string, number> = {};
  const bump = (key: string) => {
    out[key] = (out[key] ?? 0) + 1;
  };
  for (const entry of runHistory) {
    const routes = Array.isArray(entry.routes) ? entry.routes : [];
    if (routes.length >= 1) bump('gordon');
    if (routes.length >= 2) bump('tour_bus');
    if (entry.isVictory) bump('taxman');
  }
  return out;
}

function seedFirstRouteVisitsFromHistory(
  runHistory: readonly RunHistoryEntry[],
): string[] {
  const seen = new Set<string>();
  for (const entry of runHistory) {
    const routes = Array.isArray(entry.routes) ? entry.routes : [];
    for (const pick of routes) {
      if (typeof pick?.routeKey === 'string' && pick.routeKey.length > 0) {
        seen.add(pick.routeKey);
      }
    }
  }
  return [...seen];
}

function seedCursedVictoriesByBossFromHistory(
  runHistory: readonly RunHistoryEntry[],
): Record<string, number> {
  let taxmanCursedWins = 0;
  for (const entry of runHistory) {
    if (entry.isVictory && typeof entry.curseKey === 'string' && entry.curseKey.length > 0) {
      taxmanCursedWins += 1;
    }
  }
  return taxmanCursedWins > 0 ? { taxman: taxmanCursedWins } : {};
}

/**
 * Generic `Record<string, number>` coercion — drops non-numeric /
 * non-finite / negative values and floors to integer. Unlike
 * `coerceStonesPicked` / `coerceReliquaryCuriosPicked`, returns an
 * empty object rather than `undefined` when all inputs are invalid,
 * because the Croft trophy fields are required on SaveData.
 */
function coerceStringNumberRecord(raw: unknown): Record<string, number> {
  if (!isRecord(raw)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof k !== 'string' || k.length === 0) continue;
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) continue;
    out[k] = Math.floor(v);
  }
  return out;
}

/**
 * Coerce persisted Reliquary pick counts. Same shape as
 * `coerceStonesPicked` — drops non-numeric / non-finite / non-positive
 * values and omits the field on empty / invalid input so the save
 * stays lean until a player actually touches a relic.
 */
function coerceReliquaryCuriosPicked(raw: unknown): Record<string, number> | undefined {
  if (!isRecord(raw)) return undefined;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof k !== 'string' || k.length === 0) continue;
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) continue;
    out[k] = Math.floor(v);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function coerceRunHistoryEntry(raw: unknown): RunHistoryEntry | null {
  if (!isRecord(raw)) return null;
  const variantKey = typeof raw.variantKey === 'string' && raw.variantKey ? raw.variantKey : '';
  if (!variantKey) return null;
  const sporranPicks = coerceSporranPicks(raw.sporranPicks);
  return {
    timestamp: coerceInteger(raw.timestamp, 0),
    timeSurvivedSec: coerceInteger(raw.timeSurvivedSec, 0),
    enemiesKilled: coerceInteger(raw.enemiesKilled, 0),
    level: Math.max(1, coerceInteger(raw.level, 1)),
    bossKills: coerceInteger(raw.bossKills, 0),
    goldEarned: coerceInteger(raw.goldEarned, 0),
    bestCombo: coerceInteger(raw.bestCombo, 0),
    variantKey,
    isVictory: typeof raw.isVictory === 'boolean' ? raw.isVictory : false,
    weaponKeys: Array.isArray(raw.weaponKeys)
      ? (raw.weaponKeys as unknown[]).filter((x): x is string => typeof x === 'string')
      : [],
    ...(typeof raw.curseKey === 'string' && raw.curseKey ? { curseKey: raw.curseKey } : {}),
    routes: Array.isArray(raw.routes) ? (raw.routes as RoutePick[]) : [],
    relics: Array.isArray(raw.relics)
      ? (raw.relics as unknown[]).filter((x): x is RelicKey =>
          typeof x === 'string' && (RELIC_KEYS as readonly string[]).includes(x),
        )
      : [],
    ...(typeof raw.runSeed === 'number' && Number.isFinite(raw.runSeed) ? { runSeed: raw.runSeed } : {}),
    ...(raw.ironmoor === true ? { ironmoor: true } : {}),
    ...(isReplayBlobAny(raw.replay) ? { replay: raw.replay } : {}),
    ...(typeof raw.seasonalEvent === 'string' && raw.seasonalEvent
      ? { seasonalEvent: raw.seasonalEvent }
      : {}),
    nodeOutcomes: coerceNodeOutcomes(raw.nodeOutcomes),
    name: coerceRunHistoryName(raw),
    ...(sporranPicks ? { sporranPicks: sporranPicks.slice() } : {}),
  };
}

/**
 * S1 Phase 2 — coerce + validate persisted Sporran pick IDs. Drops
 * non-string / empty / stale IDs (anything not in `SPORRAN_CARD_IDS`)
 * so a renamed or removed card from a future release doesn't poison
 * the Chronicle. Returns `null` on absent / empty / fully-invalid
 * input so the caller can omit the field entirely from the entry —
 * keeps pre-v19 history rows lean and avoids stamping `[]` on every
 * legacy entry at migration time.
 */
function coerceSporranPicks(value: unknown): readonly string[] | null {
  if (!Array.isArray(value)) return null;
  const out: string[] = [];
  for (const raw of value) {
    if (typeof raw !== 'string' || raw.length === 0) continue;
    if (!SPORRAN_CARD_IDS.has(raw)) continue;
    out.push(raw);
  }
  return out.length > 0 ? out : null;
}

function coerceNodeOutcomes(value: unknown): NodeOutcome[] {
  if (!Array.isArray(value)) return [];
  const out: NodeOutcome[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    const nodeKey = typeof raw.nodeKey === 'string' && raw.nodeKey ? raw.nodeKey : null;
    if (!nodeKey) continue;
    const visitedAtGameTimeSec =
      typeof raw.visitedAtGameTimeSec === 'number' && Number.isFinite(raw.visitedAtGameTimeSec)
        ? raw.visitedAtGameTimeSec
        : 0;
    const entry: NodeOutcome = { nodeKey, visitedAtGameTimeSec };
    if (typeof raw.chosenRewardKey === 'string' && raw.chosenRewardKey) {
      out.push({ ...entry, chosenRewardKey: raw.chosenRewardKey });
    } else {
      out.push(entry);
    }
  }
  return out;
}

function coerceRunHistoryName(raw: Record<string, unknown>): string {
  if (typeof raw.name === 'string' && raw.name.length > 0) return raw.name;
  try {
    // Prefer the persisted `runSeed` (number) so two runs with identical
    // time/kills still get distinct names. Fall back to a legacy `seed`
    // string (test fixtures / speculative future field), then to
    // timestamp+stats so pre-seed history entries still get a stable hash.
    let seed: string;
    if (typeof raw.runSeed === 'number' && Number.isFinite(raw.runSeed)) {
      seed = `runSeed:${raw.runSeed >>> 0}`;
    } else if (typeof raw.seed === 'string' && raw.seed.length > 0) {
      seed = raw.seed;
    } else {
      seed = `${raw.timestamp ?? 0}-${raw.timeSurvivedSec ?? 0}-${raw.enemiesKilled ?? 0}`;
    }
    return generateHaggisNameFromHash(seed);
  } catch {
    return 'Unknown Kin';
  }
}

function coerceRunHistory(value: unknown): RunHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  const entries: RunHistoryEntry[] = [];
  for (const raw of value) {
    const entry = coerceRunHistoryEntry(raw);
    if (entry) entries.push(entry);
  }
  return compactReplayBlobs(entries.slice(-MAX_RUN_HISTORY));
}

/**
 * T406 — only the most-recent N runs keep their `replay` blob; older
 * entries drop it on the next history append. A 90k-frame cap (T308)
 * keeps any single replay under ~600 KB, but 20 capped replays still
 * eats up to ~12 MB — past localStorage's per-origin quota on most
 * browsers. Capping the replay slice means the Chronicle's "watch
 * recent run" feature still works for the freshest runs while
 * marathon players don't blow the quota.
 */
export function compactReplayBlobs(entries: RunHistoryEntry[]): RunHistoryEntry[] {
  if (entries.length <= REPLAY_HISTORY_CAP) return entries;
  const cutoff = entries.length - REPLAY_HISTORY_CAP;
  return entries.map((e, i) => {
    if (i >= cutoff) return e;
    if (!e.replay) return e;
    const { replay: _drop, ...rest } = e;
    void _drop;
    return rest as RunHistoryEntry;
  });
}

function coerceSettings(value: unknown): SaveSettings {
  if (!isRecord(value)) {
    return { ...DEFAULT_SETTINGS };
  }

  return {
    soundOn: coerceBoolean(value.soundOn, DEFAULT_SETTINGS.soundOn),
    musicOn: coerceBoolean(value.musicOn, DEFAULT_SETTINGS.musicOn),
  };
}

function coerceUpgradeLevels(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};

  const upgrades: Record<string, number> = {};
  for (const [key, rawLevel] of Object.entries(value)) {
    upgrades[key] = coerceInteger(rawLevel, 0);
  }
  return upgrades;
}

export function coerceInteger(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function isRecord(value: unknown): value is SaveRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
