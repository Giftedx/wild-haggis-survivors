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
export const SAVE_SCHEMA_VERSION = 2;

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
  settings: { ...DEFAULT_SETTINGS },
};

type SaveRecord = Record<string, unknown>;

export function createDefaultSave(): SaveData {
  return {
    ...DEFAULT_SAVE,
    upgrades: {},
    unlockedVariants: [DEFAULT_VARIANT_KEY],
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

export function recordRun(summary: RunSummary): RunResult {
  const currentSave = loadSave();
  const runResult = applyRunSummary(currentSave, summary);
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
    default:
      return finalizeSaveCandidate(raw);
  }
}

export function computeGoldReward(summary: RunSummary): number {
  const normalized = normalizeRunSummary(summary);
  return Math.floor(
    normalized.timeSurvivedSec * 0.4 +
    normalized.enemiesKilled * 0.4 +
    normalized.bossGold +
    normalized.coinGold
  );
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

export function applyRunSummary(save: SaveData, summary: RunSummary): RunResult {
  const baseSave = migrateSave(save);
  const normalizedSummary = normalizeRunSummary(summary);
  const goldEarned = computeGoldReward(normalizedSummary);

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
    timeSurvivedSec: coerceInteger(summary.timeSurvivedSec, 0),
    enemiesKilled: coerceInteger(summary.enemiesKilled, 0),
    bossGold: coerceInteger(summary.bossGold, 0),
    coinGold: coerceInteger(summary.coinGold, 0),
    bestCombo: coerceInteger(summary.bestCombo, 0),
    victory: Boolean(summary.victory),
  };
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
