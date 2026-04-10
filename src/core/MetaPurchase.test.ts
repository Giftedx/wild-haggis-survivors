import { describe, expect, it } from 'vitest';
import { SaveManager, type ISaveData } from './SaveManager';
import { tryPurchaseMetaUpgrade } from './MetaPurchase';
import { StatComposer } from './StatComposer';

const baseSave = (): ISaveData => ({
  saveVersion: 2,
  totalKills: 100,
  unlockedWeapons: [],
  unlockedUpgrades: [],
});

describe('tryPurchaseMetaUpgrade', () => {
  it('rejects purchase when funds are insufficient', () => {
    const save: ISaveData = { ...baseSave(), totalKills: 10 };
    const r = tryPurchaseMetaUpgrade(save, StatComposer.UPGRADE_SPEED_TIER_1);
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
    const r = tryPurchaseMetaUpgrade(cur, StatComposer.UPGRADE_SPEED_TIER_1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    mgr.save(r.next);

    const loaded = mgr.load();
    expect(loaded.totalKills).toBe(50);
    expect(loaded.unlockedUpgrades).toEqual([StatComposer.UPGRADE_SPEED_TIER_1]);
  });

  it('rejects unknown upgrade keys', () => {
    const r = tryPurchaseMetaUpgrade(baseSave(), 'not_a_real_key');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('UNKNOWN_ITEM');
  });

  it('rejects duplicate unlock', () => {
    const save: ISaveData = {
      ...baseSave(),
      unlockedUpgrades: [StatComposer.UPGRADE_HEALTH_TIER_1],
    };
    const r = tryPurchaseMetaUpgrade(save, StatComposer.UPGRADE_HEALTH_TIER_1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('ALREADY_OWNED');
  });
});
