/**
 * Save/load system using localStorage.
 * Stores permanent upgrades, unlocks, and settings between sessions.
 */

const SAVE_KEY = 'whs_save';

export interface SaveData {
  /** Golden Haggis — permanent currency */
  gold: number;

  /** Permanent upgrade levels (keyed by upgrade ID) */
  upgrades: Record<string, number>;

  /** Unlocked haggis variant keys */
  unlockedVariants: string[];

  /** Total runs played */
  totalRuns: number;

  /** Best survival time in seconds */
  bestTime: number;

  /** Settings */
  settings: {
    soundOn: boolean;
    musicOn: boolean;
  };
}

const DEFAULT_SAVE: SaveData = {
  gold: 0,
  upgrades: {},
  unlockedVariants: ['classic'],
  totalRuns: 0,
  bestTime: 0,
  settings: {
    soundOn: true,
    musicOn: true,
  },
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SAVE));
    const parsed = JSON.parse(raw);
    // Deep merge — preserves nested fields from defaults when old saves are missing them
    return {
      ...DEFAULT_SAVE,
      ...parsed,
      settings: { ...DEFAULT_SAVE.settings, ...(parsed.settings ?? {}) },
      upgrades: { ...DEFAULT_SAVE.upgrades, ...(parsed.upgrades ?? {}) },
    };
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_SAVE));
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

/** Add gold after a run and update stats */
export function recordRun(
  timeSurvivedSec: number,
  enemiesKilled: number,
  bossGold: number
): number {
  const save = loadSave();
  save.totalRuns++;

  if (timeSurvivedSec > save.bestTime) {
    save.bestTime = timeSurvivedSec;
  }

  // Gold formula: base on time + kills + scaled boss bonus
  const goldEarned = Math.floor(
    timeSurvivedSec * 0.5 +
    enemiesKilled * 0.2 +
    bossGold
  );
  save.gold += goldEarned;

  writeSave(save);
  return goldEarned;
}
