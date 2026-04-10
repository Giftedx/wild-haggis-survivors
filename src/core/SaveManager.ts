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
}

export type ISaveData = ISaveDataV5;

export const CURRENT_SAVE_VERSION = 5 as const;

const DEFAULT_SAVE: ISaveData = {
  saveVersion: CURRENT_SAVE_VERSION,
  totalKills: 0,
  unlockedWeapons: [],
  unlockedUpgrades: [],
  activeRun: null,
  unlockedAchievements: [],
  hasCompletedTutorial: false,
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
  };
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
    this.storage.setItem(this.key, JSON.stringify(coerced));
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

  private migrateAndCoerce(input: unknown): ISaveData {
    const obj = (typeof input === 'object' && input !== null) ? (input as Record<string, unknown>) : {};
    const v = clampInt(obj.saveVersion, CURRENT_SAVE_VERSION);

    if (v <= 0) {
      return { ...DEFAULT_SAVE };
    }

    const totalKills = clampInt(obj.totalKills, 0);
    const unlockedWeapons = toStringArray(obj.unlockedWeapons);
    const unlockedUpgrades = toStringArray(obj.unlockedUpgrades);
    const activeRun = coerceIRunState(obj.activeRun);
    const unlockedAchievements = toStringArray(obj.unlockedAchievements);
    const hasCompletedTutorial = toBool(obj.hasCompletedTutorial, false);

    if (v === 1) {
      return {
        saveVersion: 5,
        totalKills,
        unlockedWeapons,
        unlockedUpgrades: [],
        activeRun: null,
        unlockedAchievements: [],
        hasCompletedTutorial: false,
      };
    }

    if (v === 2) {
      return {
        saveVersion: 5,
        totalKills,
        unlockedWeapons,
        unlockedUpgrades,
        activeRun: null,
        unlockedAchievements: [],
        hasCompletedTutorial: false,
      };
    }

    if (v === 3) {
      return {
        saveVersion: 5,
        totalKills,
        unlockedWeapons,
        unlockedUpgrades,
        activeRun,
        unlockedAchievements: [],
        hasCompletedTutorial: false,
      };
    }

    if (v === 4) {
      return {
        saveVersion: 5,
        totalKills,
        unlockedWeapons,
        unlockedUpgrades,
        activeRun,
        unlockedAchievements,
        hasCompletedTutorial,
      };
    }

    return {
      saveVersion: CURRENT_SAVE_VERSION,
      totalKills,
      unlockedWeapons,
      unlockedUpgrades,
      activeRun,
      unlockedAchievements,
      hasCompletedTutorial,
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
