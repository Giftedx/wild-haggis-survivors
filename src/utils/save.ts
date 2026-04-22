/**
 * Save/load system using localStorage.
 * Stores permanent upgrades, unlocks, and settings between sessions.
 */

import type { RoutePick } from '../data/routes';
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

const SAVE_KEY = 'whs_save';
export const SAVE_SCHEMA_VERSION = 6;

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

  /** Per-run history (capped at MAX_RUN_HISTORY, newest last). */
  runHistory: RunHistoryEntry[];

  /** Settings */
  settings: SaveSettings;
}

export interface RunSummary {
  timeSurvivedSec: number;
  enemiesKilled: number;
  bossGold: number;
  coinGold?: number;
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
  /** 32-bit RNG seed for this run — enables Chronicle "rerun this seed". */
  runSeed?: number;
  /** W66 Ironmoor flag passed through to RunHistoryEntry. */
  ironmoor?: boolean;
  /** T1 replay blob (optional) attached to this run's history entry. */
  replay?: ReplayBlobAny;
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
  runHistory: [],
  settings: { ...DEFAULT_SETTINGS },
};

type SaveRecord = Record<string, unknown>;

export function createDefaultSave(): SaveData {
  return {
    ...DEFAULT_SAVE,
    upgrades: {},
    unlockedVariants: [DEFAULT_VARIANT_KEY],
    runHistory: [],
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
    default:
      if (schemaVersion > SAVE_SCHEMA_VERSION) {
        console.warn(`Save schemaVersion ${schemaVersion} is newer than supported (${SAVE_SCHEMA_VERSION}); fields may be lost.`);
      }
      return finalizeSaveCandidate(raw);
  }
}

export function computeGoldReward(summary: RunSummary): number {
  const normalized = normalizeRunSummary(summary);
  const base =
    normalized.timeSurvivedSec * 0.4 +
    normalized.enemiesKilled * 0.4 +
    normalized.bossGold +
    normalized.coinGold;
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
    ...(typeof context?.runSeed === 'number' ? { runSeed: context.runSeed } : {}),
    ...(context?.ironmoor ? { ironmoor: true } : {}),
    ...(context?.replay ? { replay: context.replay } : {}),
  };

  const isCursedVictory =
    normalizedSummary.victory &&
    typeof context?.curseKey === 'string' &&
    context.curseKey.length > 0;

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
    runHistory: appendRunHistory(baseSave.runHistory, historyEntry),
  };

  const unlockResult = evaluateVariantUnlocks(nextSave, baseSave.unlockedVariants);
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
    ...(lastDeath ? { lastDeath } : {}),
    ...(stonesPicked ? { standingStonesPicked: stonesPicked } : {}),
    ...(reliquaryPicked ? { reliquaryCuriosPicked: reliquaryPicked } : {}),
    ancestralEchoesTouched: coerceInteger(candidate.ancestralEchoesTouched, 0),
    ceilidhPulsesLifetime: coerceInteger(candidate.ceilidhPulsesLifetime, 0),
    runHistory,
    settings: coerceSettings(candidate.settings),
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
    ...(typeof raw.runSeed === 'number' && Number.isFinite(raw.runSeed) ? { runSeed: raw.runSeed } : {}),
    ...(raw.ironmoor === true ? { ironmoor: true } : {}),
    ...(isReplayBlobAny(raw.replay) ? { replay: raw.replay } : {}),
  };
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
