/**
 * Save/load system using localStorage.
 * Stores permanent upgrades, unlocks, and settings between sessions.
 */

import type { RoutePick } from '../data/routes';
import type { NodeOutcome } from '../data/nodeTypes';
import { RELIC_KEYS, type RelicKey } from '../data/relics';
import { generateHaggisNameFromHash } from '../data/haggisNames';
import { isReplayBlobAny, type ReplayBlobAny } from '../replay/replayBlob';
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
  createEmptyDiscoveryLog,
  discoveryLogFromJSON,
  recordBanterHeard,
  recordBeastieKilled,
  recordBeastieSeen,
  recordItemAcquired,
  recordRoutePicked,
  retroactiveSeedFromHistory,
  type DiscoveryLog,
  type RetroHistoryEntry,
} from '../systems/DiscoveryLog';

const SAVE_KEY = 'whs_save';
export const SAVE_SCHEMA_VERSION = 17;

/**
 * V2 Track 2 — the "coastal" biome set for the Peerie Shetlander
 * unlock. Subset of the four live biomes (see `src/data/biomes.ts`).
 * `loch` = water; `pine` = forested island landscape (Scottish isles
 * carry Scots pine where heather wouldn't thrive). Bog + heather are
 * "moor" biomes and disqualify the run.
 */
export const COASTAL_BIOMES: ReadonlySet<string> = new Set(['loch', 'pine']);

/**
 * V2 Track 3 — evolutions-threshold for the Burns's Wee Beastie unlock.
 * Seven of the eight weapons have an evolved form (bagpipes is
 * utility-only per CLAUDE.md); seven = the max achievable in one run.
 */
export const BURNS_EVOLUTION_THRESHOLD = 7;

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

/** Maximum number of run history entries kept (FIFO — oldest dropped on overflow). */
export const MAX_RUN_HISTORY = 20;

/**
 * @deprecated Legacy audio on/off booleans — real audio state lives in
 * `SettingsManager` (`sfxVolume` / `musicVolume`). These fields are kept
 * in the schema so existing save files still load, but nothing reads them
 * at runtime anymore. Do not add new consumers. New audio preferences go
 * through SettingsManager; add them to that module, not here.
 */
export interface SaveSettings {
  /** @deprecated read `SettingsManager.load().sfxVolume > 0` instead */
  soundOn: boolean;
  /** @deprecated read `SettingsManager.load().musicVolume > 0` instead */
  musicOn: boolean;
}

export interface RunHistoryEntry {
  timestamp: number;
  timeSurvivedSec: number;
  enemiesKilled: number;
  level: number;
  bossKills: number;
  goldEarned: number;
  bestCombo: number;
  variantKey: string;
  isVictory: boolean;
  weaponKeys: string[];
  /** Curse key if the player took one for this run — powers the Chronicle badge. */
  curseKey?: string;
  /** W2 Moor Road picker history. Absent on pre-v4 entries; default []. */
  routes?: RoutePick[];
  /**
   * R1 Relics — which relics the player held when the run ended. Pre-v9
   * entries have it absent; migration/coercion defaults to [] for
   * back-compat. Coercion also drops stale keys that no longer exist in
   * `RELIC_KEYS` so a renamed or removed relic in a future release
   * doesn't corrupt the Chronicle.
   */
  relics?: RelicKey[];
  /** 32-bit RNG seed for this run — enables Chronicle "rerun this seed". */
  runSeed?: number;
  /** W66 Ironmoor — true when the run was taken with ironmoorMode on. */
  ironmoor?: boolean;
  /**
   * T1 deterministic replay — per-frame input + delta capture attached
   * to the run when record mode was active at start. Absent on runs
   * recorded before replay v1 shipped, and on runs where replay mode
   * was off. Schema v5 added this field; v6 widened to `ReplayBlobAny`
   * so Phase 3 recordings (v2 blobs with curse / routes / composedStats)
   * persist alongside v1 blobs from older saves.
   */
  replay?: ReplayBlobAny;
  /** LG T3 — display name for this run, stable-hashed from seed on first load. */
  name?: string;
  /**
   * E1 M1 — seasonal event key active when this run was recorded
   * (e.g. 'burns_night'). Absent on runs played outside any event
   * window and on pre-v13 entries. Chronicle displays the event
   * badge alongside the run; coercion drops unknown keys so a
   * future renamed event doesn't corrupt old entries.
   */
  seasonalEvent?: string;
  /**
   * M1 Moor Road multi-node — ordered log of every node visited during
   * the run (across all acts). Absent on pre-v16 entries; coercion
   * defaults to [] for back-compat. Used by Chronicle to display path
   * breadcrumbs and by ReplayInput (v3 blob) to reconstruct events
   * without rerolling RNG.
   */
  nodeOutcomes?: NodeOutcome[];
}

export interface SaveData {
  schemaVersion: number;

  /** Golden Haggis — permanent currency */
  gold: number;

  /** Permanent upgrade levels (keyed by upgrade ID) */
  upgrades: Record<string, number>;

  /** Unlocked haggis variant keys */
  unlockedVariants: VariantKey[];

  /** Active haggis variant for the next run */
  selectedVariant: VariantKey;

  /** Total runs played */
  totalRuns: number;

  /** Best survival time in seconds */
  bestTime: number;

  /** Best kills in a single run */
  bestKills: number;

  /** Total kills across all runs */
  totalKills: number;

  /** Total gold earned across all runs */
  totalGoldEarned: number;

  /** Best combo in a single run */
  bestCombo: number;

  /** Total completed victories */
  victories: number;

  /**
   * Longest Post-Bell survival time in seconds (measured from the Taxman
   * kill onward, so it's always additive on top of the normal 20-minute
   * run). Optional + defaulted for back-compat; no schema bump needed.
   */
  bestEndlessSeconds?: number;

  /**
   * W66 Ironmoor: fastest Ironmoor-mode victory time in seconds, or 0 if
   * no Ironmoor victory yet. Separate leaderboard — does not mix with
   * `bestTime` (regular runs). Optional + defaulted for back-compat; no
   * schema bump needed.
   */
  bestIronmoorSeconds?: number;

  /**
   * Ancestral Echoes — last-death position persisted across runs so the
   * next run can spawn a spectral haggis at the spot. `ts` is a unix
   * milliseconds stamp used to expire stale echoes (24h TTL). Absent on
   * fresh saves and when the last run ended in victory.
   */
  lastDeath?: { x: number; y: number; ts: number };

  /**
   * Lifetime count of Standing Stones picked, keyed by boon id
   * ('mending' / 'fire' / 'haste'). Chronicle aggregates surface which
   * boon the player favours. Optional + defaulted; back-compat with
   * pre-stones saves.
   */
  standingStonesPicked?: Record<string, number>;

  /**
   * Lifetime count of Reliquary curios picked, keyed by curio id
   * ('echoing_reed' / 'flint_charm' / 'cairn_moss'). Powers the
   * `ach_relic_seeker` deed and lets future chronicle surfaces
   * show which curio the player favours. Optional + defaulted —
   * pre-reliquary saves read as undefined and coerce to `{}`.
   */
  reliquaryCuriosPicked?: Record<string, number>;

  /**
   * Lifetime count of Ancestral Echoes the player has touched. Surfaced
   * on the Chronicle once non-zero. Optional + defaulted.
   */
  ancestralEchoesTouched?: number;

  /**
   * Lifetime count of Ceilidh Chain pulses fired (every-8th-kill magnet
   * flare). Powers the "Ceilidh Commander" deed once the lifetime count
   * crosses its threshold. Optional + defaulted.
   */
  ceilidhPulsesLifetime?: number;

  /**
   * Total cursed-run victories across all time. Unlocks the Cailleach
   * variant at count=3. Retroactively seeded from runHistory on first
   * load for existing players who already have past cursed victories.
   */
  cursedVictoriesCompleted: number;

  /**
   * V2 Track 1 — total victorious runs completed without ever standing
   * in a healing circle. Unlocks the Doric Quinie variant at count=1.
   * No retroactive seed possible (pre-v10 runs didn't track per-run
   * healing-circle overlap); fresh counter starts at 0 for all players.
   */
  runsWithoutHealingCircleCompleted: number;

  /**
   * V2 Track 2 — total victorious runs where biomes visited were a
   * subset of {loch, pine} — the "coastal" biomes, never bog or
   * heather (the "moor" biomes). Unlocks the Peerie Shetlander at 1.
   * No retroactive seed possible (pre-v11 runs didn't persist per-run
   * biomes-visited set). Fresh counter starts at 0 for all players.
   */
  runsInCoastalOnlyCompleted: number;

  /**
   * V2 Track 3 — total victorious runs where the player reached the
   * `BURNS_EVOLUTION_THRESHOLD` (7) — i.e. all seven evolvable weapons
   * reached evolved form in the same run. No retroactive seed possible
   * (pre-v12 runs didn't persist per-run evolution count). Fresh
   * counter starts at 0 for all. (Kept for internal stat tracking;
   * Burns's Wee Beastie unlock now gates on the tightened v15
   * `burnsNightFullEvoRunsCompleted` counter instead.)
   */
  runsWithAllEvolutionsCompleted: number;

  /**
   * E1 M2 T11 — total victorious runs that (a) met the full-evo
   * threshold AND (b) landed inside a real-world Burns Night window.
   * This is the unlock gate for Burns's Wee Beastie in v15+ — ties
   * the variant to the bard's actual week on the calendar. No
   * retroactive seed possible; the seasonal event stamp was only
   * introduced in v13 and we never recorded evolvedWeaponCount on
   * history entries. Fresh counter starts at 0 for all. v15 addition.
   */
  burnsNightFullEvoRunsCompleted: number;

  /**
   * H1 Gran's Croft — per-boss kill tally powering mantelpiece trophy
   * tiers (see `src/scenes/croft/CroftTrophies.ts`). Keys are boss IDs
   * from `BOSSES` (gordon / tour_bus / laird / hunter_general / taxman);
   * values are lifetime kill counts.
   *
   * Retroactive seed (v13→v14): existing players get three boss counts
   * reconstructed from `runHistory` using W2 act gates — picked
   * act 1 routes imply gordon kills, picked act 2 routes imply
   * tour_bus kills, victorious runs imply taxman kills. Mid-act bosses
   * (laird, hunter_general) are not gate-bound so their retroactive
   * counts start at 0 and fill in from T15's live kill hook. v14 addition.
   */
  bossKillCounts: Record<string, number>;

  /**
   * H1 Gran's Croft — set of Moor Road route keys ever picked (dedupe-
   * unioned across all runs). Powers the photo wall polaroids:
   * sepia-to-colour fade on first pick, colour print thereafter.
   * Retroactively seeded from `runHistory[].routes[].routeKey` at
   * migration. v14 addition.
   */
  firstRouteVisits: string[];

  /**
   * H1 Gran's Croft — per-boss cursed-victory tally. Promotes the
   * mantelpiece trophy to its "cursed" tier (singed apron, cracked
   * windshield, red-ink bleed — see spec §3). Retroactive seed bumps
   * `taxman` only (we know cursed + victory = taxman kill); other
   * bosses' cursed-kill counts start at 0. v14 addition.
   */
  cursedVictoriesByBoss: Record<string, number>;

  /** Per-run history (capped at MAX_RUN_HISTORY, newest last). */
  runHistory: RunHistoryEntry[];

  /**
   * B1 banter density push — enemy types the player has ever seen spawn.
   * Used by `enemy_ambient` banter pool to distinguish first-encounter
   * (high-priority flavour line) from routine respawn (rare 1/20 tick).
   * Deduped + string-coerced at load. v7 addition.
   */
  seenEnemies: string[];

  /**
   * B1 banter density push — stable IDs of first-time banter reservations
   * that have already fired (e.g. `first_boss_gordon`, `first_evo_thistle`).
   * `first_time` pool priority 110 reads this set to gate emission.
   * Deduped + string-coerced at load. v7 addition.
   */
  firstTimeEventsFired: string[];

  /**
   * C1 Highland Almanac — discovery-log tracking for the four-book meta.
   * Pure data; all increments live in `src/systems/DiscoveryLog.ts`.
   * Pre-v8 saves get a retroactive seed from `runHistory` on first load
   * (routes + weapons reconstructible; beasties + banter start empty).
   * v8 addition.
   */
  discoveryLog: DiscoveryLog;

  /**
   * U1 Rune-tier meta-unlock. Each rune id written once the first time
   * it appears in a card-draw offer (NOT once picked — seeing it counts).
   * Deduped + string-coerced at load. Pre-v17 saves default to `[]`
   * so returning players start the collection from zero without losing
   * any other data. v17 addition.
   */
  seenRunes: string[];

  /** Settings */
  settings: SaveSettings;
}

export interface RunSummary {
  timeSurvivedSec: number;
  enemiesKilled: number;
  bossGold: number;
  coinGold?: number;
  /**
   * Gold spent mid-run (W2 node trader). `computeGoldReward` subtracts
   * this so a mid-run spend reduces the post-run Golden Haggis mint —
   * preventing a double-dip where the player buys a relic AND banks
   * the earned gold at full value.
   */
  coinGoldSpent?: number;
  bestCombo?: number;
  victory?: boolean;
  /**
   * Optional end-of-run gold multiplier, applied inside `computeGoldReward`.
   * Used by curse-of-the-moor picks. Defaults to 1.0 (no change).
   */
  goldMult?: number;
}

/** Extra context for run history recording (not needed for gold/unlock calculation). */
export interface RunHistoryContext {
  level: number;
  bossKills: number;
  variantKey: string;
  weaponKeys: string[];
  /** Curse key active for this run (if any). Passed through to history. */
  curseKey?: string;
  /** Between-act picker resolutions (W2). Passed through to history. */
  routes?: RoutePick[];
  /** R1 Relics held at run-end. Passed through to history for Chronicle / Almanac display. */
  relics?: RelicKey[];
  /**
   * V2 Track 1 — true if the player ever overlapped a healing circle
   * during this run. A `false`-on-victory bumps
   * `runsWithoutHealingCircleCompleted` and unlocks the Doric Quinie
   * variant. Not persisted per-run — only influences lifetime counter.
   */
  enteredHealingCircle?: boolean;
  /**
   * V2 Track 2 — the set of biome IDs the player entered during this
   * run (non-empty on completed runs). When the run is victorious AND
   * the set is a non-empty subset of `COASTAL_BIOMES` (loch + pine),
   * `runsInCoastalOnlyCompleted` increments and the Peerie Shetlander
   * unlocks. Not persisted per history entry.
   */
  biomesVisited?: readonly string[];
  /**
   * V2 Track 3 — number of weapons that reached evolved form this run.
   * Compared against `BURNS_EVOLUTION_THRESHOLD` (7); a victory at
   * threshold bumps `runsWithAllEvolutionsCompleted` and unlocks the
   * Burns's Wee Beastie. Not persisted per history entry.
   */
  evolvedWeaponCount?: number;
  /** 32-bit RNG seed for this run — enables Chronicle "rerun this seed". */
  runSeed?: number;
  /** W66 Ironmoor flag passed through to RunHistoryEntry. */
  ironmoor?: boolean;
  /** T1 replay blob (optional) attached to this run's history entry. */
  replay?: ReplayBlobAny;
  /**
   * M1 Moor Road multi-node — resolved node outcomes from `RunActState`
   * (all acts concatenated in visit order). Passed through to
   * `RunHistoryEntry.nodeOutcomes` so Chronicle can render the walked
   * path and ReplayInput (v3) can reconstruct events without re-rolling.
   */
  nodeOutcomes?: readonly NodeOutcome[];
  /**
   * LG T3 — cosmetic run name generated at run start (Math.random-based,
   * kept outside runRng per determinism policy). Passing it through here
   * means the persisted entry matches the name the player saw on the
   * pause screen and the run-end framing — otherwise the Chronicle would
   * show a different backfilled hash-name on load.
   */
  name?: string;
  /**
   * E1 M2 T11 — active seasonal event key at run-end (resolved at
   * `buildContext()` time with the opt-out setting respected). When
   * set to `'burns_night'` on a full-evo victory, `applyRunSummary`
   * increments `burnsNightFullEvoRunsCompleted` and unlocks Burns's
   * Wee Beastie. Absent when no event was live or the player opted
   * out — the downstream check short-circuits without special-casing.
   */
  seasonalEventKey?: string;
}

export interface RunResult {
  save: SaveData;
  goldEarned: number;
  newlyUnlockedVariants: VariantKey[];
}

const DEFAULT_SETTINGS: SaveSettings = {
  soundOn: true,
  musicOn: true,
};

const DEFAULT_SAVE: SaveData = {
  schemaVersion: SAVE_SCHEMA_VERSION,
  gold: 0,
  upgrades: {},
  unlockedVariants: [DEFAULT_VARIANT_KEY],
  selectedVariant: DEFAULT_VARIANT_KEY,
  totalRuns: 0,
  bestTime: 0,
  bestKills: 0,
  totalKills: 0,
  totalGoldEarned: 0,
  bestCombo: 0,
  victories: 0,
  bestEndlessSeconds: 0,
  bestIronmoorSeconds: 0,
  cursedVictoriesCompleted: 0,
  runsWithoutHealingCircleCompleted: 0,
  runsInCoastalOnlyCompleted: 0,
  runsWithAllEvolutionsCompleted: 0,
  burnsNightFullEvoRunsCompleted: 0,
  bossKillCounts: {},
  firstRouteVisits: [],
  cursedVictoriesByBoss: {},
  runHistory: [],
  seenEnemies: [],
  firstTimeEventsFired: [],
  discoveryLog: createEmptyDiscoveryLog(),
  seenRunes: [],
  settings: { ...DEFAULT_SETTINGS },
};

type SaveRecord = Record<string, unknown>;

export function createDefaultSave(): SaveData {
  return {
    ...DEFAULT_SAVE,
    upgrades: {},
    unlockedVariants: [DEFAULT_VARIANT_KEY],
    runHistory: [],
    seenEnemies: [],
    firstTimeEventsFired: [],
    discoveryLog: createEmptyDiscoveryLog(),
    seenRunes: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createDefaultSave();
    return migrateSave(JSON.parse(raw));
  } catch {
    return createDefaultSave();
  }
}

export function writeSave(data: SaveData): SaveData {
  const normalized = migrateSave(data);

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(normalized));
  } catch {
    // localStorage full or unavailable — silently fail
  }

  return normalized;
}

export function recordRun(summary: RunSummary, context?: RunHistoryContext): RunResult {
  const currentSave = loadSave();
  const runResult = applyRunSummary(currentSave, summary, context);
  const persistedSave = writeSave(runResult.save);
  return { ...runResult, save: persistedSave };
}

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
    default:
      if (schemaVersion > SAVE_SCHEMA_VERSION) {
        console.warn(`Save schemaVersion ${schemaVersion} is newer than supported (${SAVE_SCHEMA_VERSION}); fields may be lost.`);
      }
      return finalizeSaveCandidate(raw);
  }
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
    runHistory,
    seenEnemies: coerceStringArray(candidate.seenEnemies),
    firstTimeEventsFired: coerceStringArray(candidate.firstTimeEventsFired),
    discoveryLog,
    seenRunes: coerceStringArray(candidate.seenRunes),
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

function normalizeRunSummary(summary: RunSummary): Required<RunSummary> {
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

/** Ancestral Echo TTL — echoes older than this are silently dropped. */
export const LAST_DEATH_TTL_MS = 24 * 60 * 60 * 1000; // 24h

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

/** Shared by GameScene + tests — echoes are "fresh" within the TTL window. */
export function isLastDeathFresh(
  entry: { ts: number } | undefined | null,
  now: number = Date.now(),
): boolean {
  if (!entry) return false;
  return now - entry.ts < LAST_DEATH_TTL_MS;
}

function coerceRunHistoryEntry(raw: unknown): RunHistoryEntry | null {
  if (!isRecord(raw)) return null;
  const variantKey = typeof raw.variantKey === 'string' && raw.variantKey ? raw.variantKey : '';
  if (!variantKey) return null;
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
  };
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
  return entries.slice(-MAX_RUN_HISTORY);
}

export function appendRunHistory(history: RunHistoryEntry[], entry: RunHistoryEntry): RunHistoryEntry[] {
  const next = [...history, entry];
  if (next.length > MAX_RUN_HISTORY) next.shift();
  return next;
}

export interface PersonalBests {
  bestTime: number;
  bestKills: number;
  bestCombo: number;
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

function coerceInteger(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function isRecord(value: unknown): value is SaveRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
