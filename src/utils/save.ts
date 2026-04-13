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

const SAVE_KEY = 'whs_save';
export const SAVE_SCHEMA_VERSION = 3;

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
    default:
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
  };

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

function finalizeSaveCandidate(candidate: SaveRecord): SaveData {
  const unlockedVariants = coerceVariantKeys(candidate.unlockedVariants);
  const progress = buildProgressSnapshot(candidate, unlockedVariants);
  const unlockResult = evaluateVariantUnlocks(progress, unlockedVariants);

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
    runHistory: coerceRunHistory(candidate.runHistory),
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
