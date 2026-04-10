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

export type ISaveData = ISaveDataV2;

export const CURRENT_SAVE_VERSION = 2 as const;

const DEFAULT_SAVE: ISaveData = {
  saveVersion: CURRENT_SAVE_VERSION,
  totalKills: 0,
  unlockedWeapons: [],
  unlockedUpgrades: [],
};

function clampInt(n: unknown, fallback: number): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
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
      // Corrupt JSON: recover safely.
      return { ...DEFAULT_SAVE };
    }
  }

  save(data: ISaveData): void {
    // Always coerce before persisting so external callers can't store junk.
    const coerced = this.migrateAndCoerce(data);
    this.storage.setItem(this.key, JSON.stringify(coerced));
  }

  reset(): void {
    this.storage.removeItem(this.key);
  }

  /** Convenience helper: read-modify-write atomically. */
  update(fn: (current: ISaveData) => ISaveData): ISaveData {
    const next = fn(this.load());
    this.save(next);
    return next;
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

    if (v === 1) {
      return {
        saveVersion: 2,
        totalKills,
        unlockedWeapons,
        unlockedUpgrades: [],
      };
    }

    if (v === 2) {
      return {
        saveVersion: 2,
        totalKills,
        unlockedWeapons,
        unlockedUpgrades,
      };
    }

    // Unknown newer version: keep safe subset and normalize to current.
    return {
      saveVersion: CURRENT_SAVE_VERSION,
      totalKills,
      unlockedWeapons,
      unlockedUpgrades,
    };
  }
}

function defaultStorage(): StorageLike {
  // localStorage exists in browser runtime; tests inject a fake storage.
  const ls = (globalThis as unknown as { localStorage?: StorageLike }).localStorage;
  if (ls) return ls;
  // Minimal in-memory fallback (avoids crashing in non-browser contexts).
  const mem = new Map<string, string>();
  return {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => { mem.set(k, v); },
    removeItem: (k) => { mem.delete(k); },
  };
}
