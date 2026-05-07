/**
 * Save IO — read/write/default. Owns localStorage interaction.
 *
 * Extracted from `src/utils/save.ts` per the 2026-04-30 restructure plan
 * (Phase 1.2). `migrateSave` is sourced from the save.ts barrel until
 * Phase 1.3 lifts the migration chain into its own module — JS handles
 * the temporary cycle because all references are function-level.
 */

import { DEFAULT_VARIANT_KEY } from '../../data/variants';
import { createEmptyDiscoveryLog } from '../../systems/DiscoveryLog';
import { emitSaveFailure } from '../saveFailure';
import { migrateSave } from '../save';
import { SAVE_SCHEMA_VERSION } from './schema';
import type { SaveData, SaveSettings } from './types';

const SAVE_KEY = 'whs_save';

export const DEFAULT_SETTINGS: SaveSettings = {
  soundOn: true,
  musicOn: true,
};

export const DEFAULT_SAVE: SaveData = {
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
  } catch (err) {
    // T131 — surface the failure so the UI can toast instead of silently failing.
    emitSaveFailure('legacy_save', err);
  }

  return normalized;
}
