import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SaveManager, type StorageLike } from './SaveManager';
import { SettingsManager, SETTINGS_STORAGE_KEY } from './SettingsManager';
import { createDefaultSave, loadSave, writeSave } from '../utils/save';
import { MemoryStorage } from '../test/MemoryStorage';

const LEGACY_SAVE_KEY = 'whs_save';
const META_SAVE_KEY = 'whs_meta_save';

class MetaWriteFailingStorage implements StorageLike {
  private m = new Map<string, string>();

  getItem(key: string) { return this.m.get(key) ?? null; }

  setItem(key: string, value: string) {
    if (key === META_SAVE_KEY) throw new Error('meta store blocked');
    this.m.set(key, value);
  }

  removeItem(key: string) { this.m.delete(key); }
}

let originalLocalStorageDescriptor: PropertyDescriptor | undefined;

function installLocalStorage(storage: StorageLike): void {
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
  });
}

function legacySaveWithHistory(gold: number) {
  return {
    ...createDefaultSave(),
    gold,
    runHistory: [
      {
        timestamp: 1,
        timeSurvivedSec: 123,
        enemiesKilled: 45,
        level: 4,
        bossKills: 1,
        goldEarned: gold,
        bestCombo: 7,
        variantKey: 'classic',
        isVictory: false,
        weaponKeys: ['thistle_shot'],
      },
    ],
  };
}

describe('ADR-0007 localStorage store ownership boundaries', () => {
  beforeEach(() => {
    originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  });

  afterEach(() => {
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', originalLocalStorageDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, 'localStorage');
    }
    vi.restoreAllMocks();
  });

  it('ADR-0007: writing whs_game_settings does not mutate whs_save or whs_meta_save', () => {
    const storage = new MemoryStorage();
    installLocalStorage(storage);

    writeSave(legacySaveWithHistory(123));
    const legacyBefore = storage.getItem(LEGACY_SAVE_KEY);

    const meta = new SaveManager({ storage, key: META_SAVE_KEY });
    meta.save({ ...meta.load(), totalKills: 77 });
    const metaBefore = storage.getItem(META_SAVE_KEY);

    const settings = new SettingsManager({ storage, key: SETTINGS_STORAGE_KEY });
    settings.update((cur) => ({
      ...cur,
      masterVolume: 0.25,
      damageNumbers: false,
    }));

    expect(storage.getItem(LEGACY_SAVE_KEY)).toBe(legacyBefore);
    expect(storage.getItem(META_SAVE_KEY)).toBe(metaBefore);
    expect(JSON.parse(storage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')).toMatchObject({
      masterVolume: 0.25,
      damageNumbers: false,
    });
  });

  it('ADR-0007: failed whs_meta_save writes leave whs_save intact', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const storage = new MetaWriteFailingStorage();
    installLocalStorage(storage);

    writeSave(legacySaveWithHistory(456));
    const legacyBefore = storage.getItem(LEGACY_SAVE_KEY);

    const meta = new SaveManager({ storage, key: META_SAVE_KEY });
    expect(() => meta.save({ ...meta.load(), totalKills: 999 })).not.toThrow();

    expect(storage.getItem(LEGACY_SAVE_KEY)).toBe(legacyBefore);
    expect(storage.getItem(META_SAVE_KEY)).toBeNull();
    const legacyAfter = loadSave();
    expect(legacyAfter.gold).toBe(456);
    expect(legacyAfter.runHistory).toHaveLength(1);
    expect(legacyAfter.runHistory[0].weaponKeys).toEqual(['thistle_shot']);
  });

  it('ADR-0007: whs_save loads when whs_meta_save and whs_game_settings are missing', () => {
    const storage = new MemoryStorage();
    installLocalStorage(storage);
    writeSave(legacySaveWithHistory(12));

    expect(storage.getItem(META_SAVE_KEY)).toBeNull();
    expect(storage.getItem(SETTINGS_STORAGE_KEY)).toBeNull();

    const loaded = loadSave();
    expect(loaded.gold).toBe(12);
    expect(loaded.runHistory).toHaveLength(1);
  });

  it('ADR-0007: whs_meta_save loads when whs_save and whs_game_settings are missing', () => {
    const storage = new MemoryStorage();
    installLocalStorage(storage);
    const meta = new SaveManager({ storage, key: META_SAVE_KEY });
    storage.setItem(META_SAVE_KEY, JSON.stringify({ ...meta.load(), totalKills: 88 }));

    expect(storage.getItem(LEGACY_SAVE_KEY)).toBeNull();
    expect(storage.getItem(SETTINGS_STORAGE_KEY)).toBeNull();

    expect(new SaveManager({ storage, key: META_SAVE_KEY }).load().totalKills).toBe(88);
    expect(loadSave().gold).toBe(0);
    expect(new SettingsManager({ storage, key: SETTINGS_STORAGE_KEY }).load().masterVolume).toBe(1);
  });

  it('ADR-0007: whs_game_settings loads when whs_save and whs_meta_save are missing', () => {
    const storage = new MemoryStorage();
    installLocalStorage(storage);
    const settings = new SettingsManager({ storage, key: SETTINGS_STORAGE_KEY });
    settings.update((cur) => ({ ...cur, masterVolume: 0.33 }));

    expect(storage.getItem(LEGACY_SAVE_KEY)).toBeNull();
    expect(storage.getItem(META_SAVE_KEY)).toBeNull();

    expect(new SettingsManager({ storage, key: SETTINGS_STORAGE_KEY }).load().masterVolume).toBe(0.33);
    expect(loadSave().gold).toBe(0);
    expect(new SaveManager({ storage, key: META_SAVE_KEY }).load().totalKills).toBe(0);
  });
});
