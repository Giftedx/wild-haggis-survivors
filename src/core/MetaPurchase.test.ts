import { describe, expect, it } from 'vitest';
import { SaveManager, type ISaveData } from './SaveManager';
import { tryPurchaseMetaUpgrade } from './MetaPurchase';

const baseSave = (): ISaveData => ({
  saveVersion: 9,
  totalKills: 100,
  totalKillsSpent: 0,
  dailyChallenge: null,
  unlockedWeapons: [],
  unlockedUpgrades: [],
  activeRun: null,
  unlockedAchievements: [],
  hasCompletedTutorial: true,
  hasSeenDriftTutorial: false,
  hasSeenEliteAffixTip: false,
  hasSeenMoorMomentTip: false,
  moorMomentsLifetime: 0,
  runHistory: [],
  codexCulledKeys: [],
});

describe('tryPurchaseMetaUpgrade', () => {
  it('rejects purchase when funds are insufficient', () => {
    const save: ISaveData = { ...baseSave(), totalKills: 10 };
    const r = tryPurchaseMetaUpgrade(save, 'speed_tier_1');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('INSUFFICIENT_FUNDS');
    expect(save.totalKills).toBe(10);
    expect(save.unlockedUpgrades).toEqual([]);
  });

  it('on success deducts cost, appends key, and persists via SaveManager', () => {
    const storage = new (class {
      private m = new Map<string, string>();
      getItem(k: string) { return this.m.get(k) ?? null; }
      setItem(k: string, v: string) { this.m.set(k, v); }
      removeItem(k: string) { this.m.delete(k); }
    })();
    const mgr = new SaveManager({ storage, key: 'meta' });
    mgr.save(baseSave());

    const cur = mgr.load();
    const r = tryPurchaseMetaUpgrade(cur, 'speed_tier_1');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    mgr.save(r.next);

    const loaded = mgr.load();
    expect(loaded.totalKills).toBe(50);
    expect(loaded.unlockedUpgrades).toEqual(['speed_tier_1']);
  });

  it('rejects unknown upgrade keys', () => {
    const r = tryPurchaseMetaUpgrade(baseSave(), 'not_a_real_key');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('UNKNOWN_ITEM');
  });

  it('rejects duplicate unlock', () => {
    const save: ISaveData = {
      ...baseSave(),
      unlockedUpgrades: ['health_tier_1'],
    };
    const r = tryPurchaseMetaUpgrade(save, 'health_tier_1');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('ALREADY_OWNED');
  });

  it('rejects gated item without achievement', () => {
    const r = tryPurchaseMetaUpgrade(
      { ...baseSave(), totalKills: 200 },
      'pickup_tier_1'
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('LOCKED_ACHIEVEMENT');
  });

  it('allows gated item when achievement is present', () => {
    const r = tryPurchaseMetaUpgrade(
      {
        ...baseSave(),
        totalKills: 200,
        unlockedAchievements: ['ach_survive_10m'],
      },
      'pickup_tier_1'
    );
    expect(r.ok).toBe(true);
  });

  it('rejects tier-2 item without tier-1 purchased', () => {
    const r = tryPurchaseMetaUpgrade(
      { ...baseSave(), totalKills: 500, unlockedAchievements: ['ach_survive_10m'] },
      'speed_tier_2'
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('REQUIRES_PREVIOUS');
  });

  it('allows tier-2 item when tier-1 is owned and achievement met', () => {
    const r = tryPurchaseMetaUpgrade(
      {
        ...baseSave(),
        totalKills: 500,
        unlockedUpgrades: ['speed_tier_1'],
        unlockedAchievements: ['ach_survive_10m'],
      },
      'speed_tier_2'
    );
    expect(r.ok).toBe(true);
  });
});
