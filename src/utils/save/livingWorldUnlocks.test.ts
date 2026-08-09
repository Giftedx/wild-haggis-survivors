/**
 * Wild Living World Phase 2 — save schema v23 coverage for the
 * `livingWorldUnlocks` bag.
 *
 * Bytes tested:
 *   - default shape on a fresh save
 *   - default shape on pre-v23 saves (no field present)
 *   - coercion of malformed payloads (non-array unlocks, non-string keys,
 *     stale keys, selected key not in unlock list)
 *   - explicit `null` selectedCompanion is honoured (opt-out path)
 *   - `setSelectedCompanion` / `unlockCompanion` bumpers round-trip
 *     through localStorage with the right invariants.
 *
 * The bumpers + coercer share the same `COMPANION_KEYS_IN_ORDER`
 * allowlist; tests reach for both to lock that in.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createDefaultSave,
  loadSave,
  migrateSave,
  setSelectedCompanion,
  unlockCompanion,
  writeSave,
} from '../save';
import type { CompanionKey } from '../../entities/companions/companionTypes';

/**
 * Node-env vitest runs with `--no-webstorage` (see `vite.config.ts`
 * `vitestNoWebStorage`) so the global `localStorage` is unavailable.
 * We install a tiny in-memory shim around an `originalLocalStorage`
 * capture — mirrors the pattern in `save.test.ts` "lifetime-counter
 * bumps" describe block.
 */
let originalLocalStorage: Storage | undefined;
function installMemoryLocalStorage(): void {
  originalLocalStorage = (globalThis as { localStorage?: Storage }).localStorage;
  const mem = new Map<string, string>();
  (globalThis as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => { mem.set(k, v); },
    removeItem: (k: string) => { mem.delete(k); },
    clear: () => { mem.clear(); },
    key: () => null,
    get length() { return mem.size; },
  } as Storage;
}
function restoreOriginalLocalStorage(): void {
  if (originalLocalStorage === undefined) {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  } else {
    (globalThis as { localStorage: Storage }).localStorage = originalLocalStorage;
  }
}

describe('save schema v23 — livingWorldUnlocks', () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  afterEach(() => {
    restoreOriginalLocalStorage();
  });

  it('createDefaultSave seeds sheepdog as both unlocked and selected', () => {
    const save = createDefaultSave();
    expect(save.livingWorldUnlocks).toEqual({
      unlockedCompanions: ['sheepdog'],
      selectedCompanion: 'sheepdog',
    });
  });

  it('migrates pre-v23 saves to the default sheepdog unlock', () => {
    const migrated = migrateSave({
      schemaVersion: 22,
      gold: 100,
      upgrades: {},
    });
    expect(migrated.livingWorldUnlocks).toEqual({
      unlockedCompanions: ['sheepdog'],
      selectedCompanion: 'sheepdog',
    });
  });

  it('preserves a valid persisted bag round-trip', () => {
    const migrated = migrateSave({
      schemaVersion: 23,
      livingWorldUnlocks: {
        unlockedCompanions: ['sheepdog', 'stoat_scout'],
        selectedCompanion: 'stoat_scout',
      },
    });
    expect(migrated.livingWorldUnlocks).toEqual({
      unlockedCompanions: ['sheepdog', 'stoat_scout'],
      selectedCompanion: 'stoat_scout',
    });
  });

  it('drops unknown companion keys but keeps sheepdog defaulted on', () => {
    const migrated = migrateSave({
      schemaVersion: 23,
      livingWorldUnlocks: {
        unlockedCompanions: ['unknown_eagle_marker', 'stoat_scout', 42, null],
        selectedCompanion: 'unknown_eagle_marker',
      },
    });
    expect(migrated.livingWorldUnlocks.unlockedCompanions).toEqual([
      'sheepdog',
      'stoat_scout',
    ]);
    // unknown selection falls back to sheepdog rather than `null` — null
    // is the explicit opt-out path and we never silently choose it.
    expect(migrated.livingWorldUnlocks.selectedCompanion).toBe('sheepdog');
  });

  it('honours explicit null selectedCompanion as opt-out', () => {
    const migrated = migrateSave({
      schemaVersion: 23,
      livingWorldUnlocks: {
        unlockedCompanions: ['sheepdog'],
        selectedCompanion: null,
      },
    });
    expect(migrated.livingWorldUnlocks.selectedCompanion).toBeNull();
  });

  it('falls back to sheepdog when selected key is not currently unlocked', () => {
    const migrated = migrateSave({
      schemaVersion: 23,
      livingWorldUnlocks: {
        unlockedCompanions: ['sheepdog'],
        selectedCompanion: 'stoat_scout',
      },
    });
    expect(migrated.livingWorldUnlocks.selectedCompanion).toBe('sheepdog');
  });

  it.each([
    { sample: 'null', raw: null },
    { sample: 'undefined', raw: undefined },
    { sample: 'string', raw: 'oops' },
    { sample: 'number', raw: 42 },
    { sample: 'array', raw: [] },
  ])('non-record livingWorldUnlocks sample $sample falls back to defaults', ({ raw }) => {
    const migrated = migrateSave({
      schemaVersion: 23,
      livingWorldUnlocks: raw,
    });
    expect(migrated.livingWorldUnlocks).toEqual({
      unlockedCompanions: ['sheepdog'],
      selectedCompanion: 'sheepdog',
    });
  });
});

describe('save bumpers v23 — companion selection / unlock', () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    writeSave(createDefaultSave());
  });

  afterEach(() => {
    restoreOriginalLocalStorage();
  });

  it('setSelectedCompanion(null) honours opt-out', () => {
    setSelectedCompanion(null);
    expect(loadSave().livingWorldUnlocks.selectedCompanion).toBeNull();
  });

  it('setSelectedCompanion refuses keys not in the allowlist', () => {
    setSelectedCompanion('eagle_marker' as unknown as CompanionKey);
    expect(loadSave().livingWorldUnlocks.selectedCompanion).toBe('sheepdog');
  });

  it('setSelectedCompanion refuses keys that are not yet unlocked', () => {
    setSelectedCompanion('stoat_scout');
    // Default save unlocks only sheepdog, so the stoat scout selection
    // is refused without explicit unlock.
    expect(loadSave().livingWorldUnlocks.selectedCompanion).toBe('sheepdog');
  });

  it('unlockCompanion writes the new key and is idempotent', () => {
    expect(unlockCompanion('stoat_scout')).toBe(true);
    expect(unlockCompanion('stoat_scout')).toBe(false);
    expect(loadSave().livingWorldUnlocks.unlockedCompanions).toEqual([
      'sheepdog',
      'stoat_scout',
    ]);
  });

  it('unlockCompanion works for kelpie_foal (Phase 4 companion)', () => {
    expect(unlockCompanion('kelpie_foal')).toBe(true);
    expect(unlockCompanion('kelpie_foal')).toBe(false);
    expect(loadSave().livingWorldUnlocks.unlockedCompanions).toContain('kelpie_foal');
  });

  it('setSelectedCompanion accepts a key after it is unlocked', () => {
    unlockCompanion('stoat_scout');
    setSelectedCompanion('stoat_scout');
    expect(loadSave().livingWorldUnlocks.selectedCompanion).toBe('stoat_scout');
  });
});
