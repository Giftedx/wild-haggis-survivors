/**
 * SettingsManager.load() caching contract.
 *
 * GameScene reads `settingsManager.load()` from 14 sites — every read
 * was hitting localStorage, JSON.parse-ing, then coercing. Cheap per
 * call but not free, and 14 reads per frame across hot paths is
 * unnecessary churn (also obscures intent — multiple reads in the
 * same tick can race a settings save in theory). The fix: memoise
 * the most-recent load and invalidate on save. These tests pin the
 * contract.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import {
  SettingsManager,
  SETTINGS_STORAGE_KEY,
  resetSettingsManagerSingletonForTests,
} from './SettingsManager';
import { MemoryStorage } from '../test/MemoryStorage';

describe('SettingsManager.load() memoisation', () => {
  beforeEach(() => {
    resetSettingsManagerSingletonForTests();
  });

  it('returns the same object reference on consecutive load() calls', () => {
    const sm = new SettingsManager({ storage: new MemoryStorage(), key: SETTINGS_STORAGE_KEY });
    const first = sm.load();
    const second = sm.load();
    expect(second).toBe(first); // identity, not deep-equal
  });

  it('returns fresh data after save() (cache invalidated)', () => {
    const sm = new SettingsManager({ storage: new MemoryStorage(), key: SETTINGS_STORAGE_KEY });
    const before = sm.load();
    sm.save({ ...before, masterVolume: 0.123 });
    const after = sm.load();
    expect(after).not.toBe(before); // different ref because cache cleared
    expect(after.masterVolume).toBe(0.123);
  });

  it('does not re-read storage when memoised', () => {
    // Storage that counts reads — proves the cache is actually skipping
    // the localStorage hit, not just the JSON.parse.
    let reads = 0;
    const counted: import('./SaveManager').StorageLike = {
      getItem: (k) => { reads += 1; return new MemoryStorage().getItem(k); },
      setItem: () => { /* no-op */ },
      removeItem: () => { /* no-op */ },
    };
    const sm = new SettingsManager({ storage: counted, key: SETTINGS_STORAGE_KEY });
    sm.load();
    sm.load();
    sm.load();
    expect(reads).toBe(1);
  });
});
