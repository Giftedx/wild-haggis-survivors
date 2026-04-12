export type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export interface ISaveDataV1 {
  saveVersion: 1;
  totalKills: number;
  unlockedWeapons: string[];
}

export interface ISaveDataV2 {
  saveVersion: 2;
  totalKills: number;
  unlockedWeapons: string[];
  unlockedUpgrades: string[];
}

/** Serialized weapon row for mid-run resume. */
export interface IRunWeaponSlot {
  key: string;
  level: number;
  evolved: boolean;
  evolutionKey: string;
}

/** Strict mid-run snapshot (meta save `activeRun`). */
export interface IRunState {
  gameTimeSec: number;
  playerX: number;
  playerY: number;
  playerHealth: number;
  playerMaxHp: number;
  currentXp: number;
  currentLevel: number;
  acquiredWeapons: IRunWeaponSlot[];
  selectedVariantKey: string;
  killCount: number;
  ownedPassives: string[];
  evolvedWeaponKeys: string[];
  /** Boss kills already earned in this run (for Game Over stats). */
  bossKillCount?: number;
  /** Gold earned from boss kills so far this run. */
  bossGoldEarned?: number;
  /** Gold earned from coins/chests/kill milestones so far this run. */
  coinGoldEarned?: number;
  /** One-time revive remaining at snapshot time. */
  revivalAvailable?: boolean;
  /** Best combo reached before the snapshot. */
  bestCombo?: number;
  /** Current live combo chain at snapshot time. */
  comboCount?: number;
  /** Remaining lifetime on the current combo chain. */
  comboTimerMs?: number;
  /** Current dash charges remaining. */
  dashCharges?: number;
  /** Remaining cooldown on the next dash recharge. */
  dashCooldownMs?: number;
  /** Per-weapon damage totals accumulated so far this run. */
  weaponDamage?: Record<string, number>;
  /** Boss keys already spawned in this run (used to prevent duplicate intros on resume). */
  spawnedBossKeys?: string[];
  /** Highland Shield cooldown remaining in ms at snapshot time. */
  shieldCooldownMs?: number;
}

export interface ISaveDataV3 {
  saveVersion: 3;
  totalKills: number;
  unlockedWeapons: string[];
  unlockedUpgrades: string[];
  activeRun: IRunState | null;
}

export interface ISaveDataV4 {
  saveVersion: 4;
  totalKills: number;
  unlockedWeapons: string[];
  unlockedUpgrades: string[];
  activeRun: IRunState | null;
  unlockedAchievements: string[];
}

export interface ISaveDataV5 {
  saveVersion: 5;
  totalKills: number;
  unlockedWeapons: string[];
  unlockedUpgrades: string[];
  activeRun: IRunState | null;
  unlockedAchievements: string[];
  /** FTUE / one-shot onboarding — persisted in meta save. */
  hasCompletedTutorial: boolean;
  /** Drift mechanic hint — shown once on first run. */
  hasSeenDriftTutorial: boolean;
}

/** Per-run snapshot stored in history. */
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
}

export interface ISaveDataV6 {
  saveVersion: 6;
  totalKills: number;
  unlockedWeapons: string[];
  unlockedUpgrades: string[];
  activeRun: IRunState | null;
  unlockedAchievements: string[];
  hasCompletedTutorial: boolean;
  hasSeenDriftTutorial: boolean;
  runHistory: RunHistoryEntry[];
}

/**
 * V7 splits `totalKills` into two concerns:
 *  - `totalKills`: current spendable balance (MetaShop currency)
 *  - `totalKillsSpent`: monotonic lifetime total debited by MetaShop purchases
 *
 * Achievement thresholds read the SUM (`totalKills + totalKillsSpent`) so
 * players who spend heavily in the shop don't lose progress toward
 * `ach_kills_1000` / `ach_kills_5000`.
 */
export interface ISaveDataV7 {
  saveVersion: 7;
  totalKills: number;
  totalKillsSpent: number;
  unlockedWeapons: string[];
  unlockedUpgrades: string[];
  activeRun: IRunState | null;
  unlockedAchievements: string[];
  hasCompletedTutorial: boolean;
  hasSeenDriftTutorial: boolean;
  runHistory: RunHistoryEntry[];
}

export type ISaveData = ISaveDataV7;

export const CURRENT_SAVE_VERSION = 7 as const;

export const MAX_RUN_HISTORY = 20;

const DEFAULT_SAVE: ISaveData = {
  saveVersion: CURRENT_SAVE_VERSION,
  totalKills: 0,
  totalKillsSpent: 0,
  unlockedWeapons: [],
  unlockedUpgrades: [],
  activeRun: null,
  unlockedAchievements: [],
  hasCompletedTutorial: false,
  hasSeenDriftTutorial: false,
  runHistory: [],
};

function clampInt(n: unknown, fallback: number): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function clampNumber(n: unknown, fallback: number): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
  return n;
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

function toBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === 'boolean') return v;
  return fallback;
}

function toOptionalBool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined;
}

function toOptionalNonNegativeInt(v: unknown): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v)) return undefined;
  if (v < 0) return undefined;
  return Math.floor(v);
}

function toPositiveNumberRecord(v: unknown): Record<string, number> | undefined {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return undefined;
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(v)) {
    if (typeof key !== 'string' || !key) continue;
    if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) continue;
    out[key] = Math.floor(raw);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function coerceWeaponSlot(raw: unknown): IRunWeaponSlot | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const key = typeof o.key === 'string' ? o.key : '';
  if (!key) return null;
  const level = Math.max(1, clampInt(o.level, 1));
  const evolved = Boolean(o.evolved);
  const evolutionKey = typeof o.evolutionKey === 'string' ? o.evolutionKey : '';
  return { key, level, evolved, evolutionKey };
}

function coerceIRunState(raw: unknown): IRunState | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const wraw = o.acquiredWeapons;
  const weapons: IRunWeaponSlot[] = [];
  if (Array.isArray(wraw)) {
    for (const x of wraw) {
      const s = coerceWeaponSlot(x);
      if (s) weapons.push(s);
    }
  }
  const variant = typeof o.selectedVariantKey === 'string' ? o.selectedVariantKey : '';
  if (!variant || weapons.length === 0) return null;

  return {
    gameTimeSec: Math.max(0, clampNumber(o.gameTimeSec, 0)),
    playerX: clampNumber(o.playerX, 0),
    playerY: clampNumber(o.playerY, 0),
    playerHealth: Math.max(0, clampNumber(o.playerHealth, 1)),
    playerMaxHp: Math.max(1, clampNumber(o.playerMaxHp, 1)),
    currentXp: Math.max(0, clampInt(o.currentXp, 0)),
    currentLevel: Math.max(1, clampInt(o.currentLevel, 1)),
    acquiredWeapons: weapons,
    selectedVariantKey: variant,
    killCount: Math.max(0, clampInt(o.killCount, 0)),
    ownedPassives: toStringArray(o.ownedPassives),
    evolvedWeaponKeys: toStringArray(o.evolvedWeaponKeys),
    bossKillCount: toOptionalNonNegativeInt(o.bossKillCount),
    bossGoldEarned: toOptionalNonNegativeInt(o.bossGoldEarned),
    coinGoldEarned: toOptionalNonNegativeInt(o.coinGoldEarned),
    revivalAvailable: toOptionalBool(o.revivalAvailable),
    bestCombo: toOptionalNonNegativeInt(o.bestCombo),
    comboCount: toOptionalNonNegativeInt(o.comboCount),
    comboTimerMs: toOptionalNonNegativeInt(o.comboTimerMs),
    dashCharges: toOptionalNonNegativeInt(o.dashCharges),
    dashCooldownMs: toOptionalNonNegativeInt(o.dashCooldownMs),
    weaponDamage: toPositiveNumberRecord(o.weaponDamage),
    spawnedBossKeys: Array.isArray(o.spawnedBossKeys)
      ? toStringArray(o.spawnedBossKeys)
      : undefined,
    shieldCooldownMs: toOptionalNonNegativeInt(o.shieldCooldownMs),
  };
}

function coerceRunHistoryEntry(raw: unknown): RunHistoryEntry | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const variantKey = typeof o.variantKey === 'string' ? o.variantKey : '';
  if (!variantKey) return null;
  return {
    timestamp: clampInt(o.timestamp, 0),
    timeSurvivedSec: Math.max(0, clampNumber(o.timeSurvivedSec, 0)),
    enemiesKilled: clampInt(o.enemiesKilled, 0),
    level: Math.max(1, clampInt(o.level, 1)),
    bossKills: clampInt(o.bossKills, 0),
    goldEarned: clampInt(o.goldEarned, 0),
    bestCombo: clampInt(o.bestCombo, 0),
    variantKey,
    isVictory: toBool(o.isVictory, false),
    weaponKeys: toStringArray(o.weaponKeys),
  };
}

function coerceRunHistory(raw: unknown): RunHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: RunHistoryEntry[] = [];
  for (const item of raw) {
    const entry = coerceRunHistoryEntry(item);
    if (entry) out.push(entry);
  }
  return out.slice(-MAX_RUN_HISTORY);
}

export interface PersonalBests {
  bestTime: number;
  bestKills: number;
  bestCombo: number;
  bestLevel: number;
  bestGold: number;
}

export class SaveManager {
  private key: string;
  private storage: StorageLike;

  constructor(opts?: { key?: string; storage?: StorageLike }) {
    this.key = opts?.key ?? 'whs_meta_save';
    this.storage = opts?.storage ?? defaultStorage();
  }

  load(): ISaveData {
    const raw = this.storage.getItem(this.key);
    if (!raw) return { ...DEFAULT_SAVE };

    try {
      const parsed: unknown = JSON.parse(raw);
      return this.migrateAndCoerce(parsed);
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  save(data: ISaveData): void {
    const coerced = this.migrateAndCoerce(data);
    try {
      this.storage.setItem(this.key, JSON.stringify(coerced));
    } catch {
      // Storage can throw in private mode, quota exhaustion, or blocked contexts.
      // SaveManager callers should continue running even if persistence fails.
    }
  }

  reset(): void {
    this.storage.removeItem(this.key);
  }

  update(fn: (current: ISaveData) => ISaveData): ISaveData {
    const next = fn(this.load());
    this.save(next);
    return next;
  }

  /** Persist in-progress run (tab close / background). */
  saveActiveRun(run: IRunState): void {
    const coercedRun = coerceIRunState(run);
    if (!coercedRun) return;
    this.update((cur) => ({ ...cur, activeRun: coercedRun }));
  }

  clearActiveRun(): void {
    this.update((cur) => ({ ...cur, activeRun: null }));
  }

  recordRunToHistory(entry: RunHistoryEntry): void {
    const coerced = coerceRunHistoryEntry(entry);
    if (!coerced) return;
    this.update((cur) => {
      const history = [...cur.runHistory, coerced];
      if (history.length > MAX_RUN_HISTORY) history.splice(0, history.length - MAX_RUN_HISTORY);
      return { ...cur, runHistory: history };
    });
  }

  getRunHistory(): RunHistoryEntry[] {
    return this.load().runHistory;
  }

  getPersonalBests(): PersonalBests {
    const history = this.load().runHistory;
    const bests: PersonalBests = { bestTime: 0, bestKills: 0, bestCombo: 0, bestLevel: 0, bestGold: 0 };
    for (const entry of history) {
      if (entry.timeSurvivedSec > bests.bestTime) bests.bestTime = entry.timeSurvivedSec;
      if (entry.enemiesKilled > bests.bestKills) bests.bestKills = entry.enemiesKilled;
      if (entry.bestCombo > bests.bestCombo) bests.bestCombo = entry.bestCombo;
      if (entry.level > bests.bestLevel) bests.bestLevel = entry.level;
      if (entry.goldEarned > bests.bestGold) bests.bestGold = entry.goldEarned;
    }
    return bests;
  }

  private migrateAndCoerce(input: unknown): ISaveData {
    const obj = (typeof input === 'object' && input !== null) ? (input as Record<string, unknown>) : {};

    // A missing or non-numeric saveVersion means corrupt data (truncated
    // write, hand-edited, etc.). Prior to this guard, a blob like
    // {"totalKills": 2500} would be silently loaded as the current version
    // with all other fields defaulted — losing achievements, run history,
    // and tutorial flags without warning. Start fresh instead.
    if (typeof obj.saveVersion !== 'number' || !Number.isFinite(obj.saveVersion) || obj.saveVersion <= 0) {
      return { ...DEFAULT_SAVE };
    }
    const v = Math.max(1, Math.floor(obj.saveVersion));

    const totalKills = clampInt(obj.totalKills, 0);
    const totalKillsSpent = clampInt(obj.totalKillsSpent, 0);
    const unlockedWeapons = toStringArray(obj.unlockedWeapons);
    const unlockedUpgrades = toStringArray(obj.unlockedUpgrades);
    const activeRun = coerceIRunState(obj.activeRun);
    const unlockedAchievements = toStringArray(obj.unlockedAchievements);
    const hasCompletedTutorial = toBool(obj.hasCompletedTutorial, false);
    const hasSeenDriftTutorial = toBool(obj.hasSeenDriftTutorial, false);

    const runHistory = coerceRunHistory(obj.runHistory);

    if (v === 1) {
      return {
        saveVersion: CURRENT_SAVE_VERSION,
        totalKills,
        totalKillsSpent: 0,
        unlockedWeapons,
        unlockedUpgrades: [],
        activeRun: null,
        unlockedAchievements: [],
        hasCompletedTutorial: false,
        hasSeenDriftTutorial: false,
        runHistory: [],
      };
    }

    if (v === 2) {
      return {
        saveVersion: CURRENT_SAVE_VERSION,
        totalKills,
        totalKillsSpent: 0,
        unlockedWeapons,
        unlockedUpgrades,
        activeRun: null,
        unlockedAchievements: [],
        hasCompletedTutorial: false,
        hasSeenDriftTutorial: false,
        runHistory: [],
      };
    }

    if (v === 3) {
      return {
        saveVersion: CURRENT_SAVE_VERSION,
        totalKills,
        totalKillsSpent: 0,
        unlockedWeapons,
        unlockedUpgrades,
        activeRun,
        unlockedAchievements: [],
        hasCompletedTutorial: false,
        hasSeenDriftTutorial: false,
        runHistory: [],
      };
    }

    if (v === 4) {
      return {
        saveVersion: CURRENT_SAVE_VERSION,
        totalKills,
        totalKillsSpent: 0,
        unlockedWeapons,
        unlockedUpgrades,
        activeRun,
        unlockedAchievements,
        hasCompletedTutorial,
        hasSeenDriftTutorial: false,
        runHistory: [],
      };
    }

    if (v === 5) {
      return {
        saveVersion: CURRENT_SAVE_VERSION,
        totalKills,
        totalKillsSpent: 0,
        unlockedWeapons,
        unlockedUpgrades,
        activeRun,
        unlockedAchievements,
        hasCompletedTutorial,
        hasSeenDriftTutorial,
        runHistory: [],
      };
    }

    if (v === 6) {
      // V6 didn't know about totalKillsSpent — existing lifetime kills were
      // conflated into totalKills with no spend tracking. Seed spent to 0;
      // achievement checks now read (totalKills + totalKillsSpent).
      return {
        saveVersion: CURRENT_SAVE_VERSION,
        totalKills,
        totalKillsSpent: 0,
        unlockedWeapons,
        unlockedUpgrades,
        activeRun,
        unlockedAchievements,
        hasCompletedTutorial,
        hasSeenDriftTutorial,
        runHistory,
      };
    }

    return {
      saveVersion: CURRENT_SAVE_VERSION,
      totalKills,
      totalKillsSpent,
      unlockedWeapons,
      unlockedUpgrades,
      activeRun,
      unlockedAchievements,
      hasCompletedTutorial,
      hasSeenDriftTutorial,
      runHistory,
    };
  }
}

function defaultStorage(): StorageLike {
  const ls = (globalThis as unknown as { localStorage?: StorageLike }).localStorage;
  if (ls) return ls;
  const mem = new Map<string, string>();
  return {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => { mem.set(k, v); },
    removeItem: (k) => { mem.delete(k); },
  };
}
