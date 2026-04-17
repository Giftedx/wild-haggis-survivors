import { describe, it, expect } from 'vitest';
import {
  resolveMetaShopRowState,
  buildMetaShopLockReasonSuffix,
  type MetaShopRowSave,
} from './metaShopRowState';
import { META_SHOP_ITEMS, type MetaShopItemKey } from '../data/metaShopItems';

function saveOf(overrides: Partial<MetaShopRowSave> = {}): MetaShopRowSave {
  return {
    unlockedUpgrades: [],
    unlockedAchievements: [],
    totalKills: 0,
    ...overrides,
  };
}

describe('resolveMetaShopRowState', () => {
  it('marks an item owned when its key is in unlockedUpgrades', () => {
    const key = 'speed_tier_1' as MetaShopItemKey;
    const s = resolveMetaShopRowState(
      META_SHOP_ITEMS[key],
      key,
      saveOf({ unlockedUpgrades: ['speed_tier_1'] }),
    );
    expect(s.owned).toBe(true);
    expect(s.locked).toBe(false);
    expect(s.canAfford).toBe(false); // owned excludes canAfford
  });

  it('marks a gated item locked when the achievement is missing', () => {
    // speed_tier_2 requires ach_survive_10m + speed_tier_1.
    const key = 'speed_tier_2' as MetaShopItemKey;
    const s = resolveMetaShopRowState(
      META_SHOP_ITEMS[key],
      key,
      saveOf({
        unlockedUpgrades: ['speed_tier_1'],
        unlockedAchievements: [], // achievement missing
        totalKills: 1000,
      }),
    );
    expect(s.owned).toBe(false);
    expect(s.prevMet).toBe(true);
    expect(s.achievementMet).toBe(false);
    expect(s.locked).toBe(true);
    expect(s.canAfford).toBe(false);
  });

  it('marks a gated item locked when a prerequisite upgrade is missing', () => {
    const key = 'speed_tier_2' as MetaShopItemKey;
    const s = resolveMetaShopRowState(
      META_SHOP_ITEMS[key],
      key,
      saveOf({
        unlockedUpgrades: [], // speed_tier_1 missing
        unlockedAchievements: ['ach_survive_10m'],
        totalKills: 1000,
      }),
    );
    expect(s.achievementMet).toBe(true);
    expect(s.prevMet).toBe(false);
    expect(s.locked).toBe(true);
  });

  it('owned-and-locked is impossible — owned wins', () => {
    // If somehow the player has the upgrade but no prerequisites satisfied,
    // locked still must be false (they already own it).
    const key = 'speed_tier_2' as MetaShopItemKey;
    const s = resolveMetaShopRowState(
      META_SHOP_ITEMS[key],
      key,
      saveOf({ unlockedUpgrades: ['speed_tier_2'] }), // no prereq, but owned
    );
    expect(s.owned).toBe(true);
    expect(s.locked).toBe(false);
  });

  it('canAfford requires all gates + kills >= cost', () => {
    const key = 'speed_tier_1' as MetaShopItemKey;
    const item = META_SHOP_ITEMS[key];
    // Kills below cost — not affordable.
    const below = resolveMetaShopRowState(item, key, saveOf({ totalKills: item.cost - 1 }));
    expect(below.canAfford).toBe(false);
    // Kills exactly at cost — affordable (>= semantics).
    const at = resolveMetaShopRowState(item, key, saveOf({ totalKills: item.cost }));
    expect(at.canAfford).toBe(true);
    // Kills above — affordable.
    const above = resolveMetaShopRowState(item, key, saveOf({ totalKills: item.cost * 2 }));
    expect(above.canAfford).toBe(true);
  });

  it('an owned item is never canAfford (even with enough kills)', () => {
    const key = 'speed_tier_1' as MetaShopItemKey;
    const item = META_SHOP_ITEMS[key];
    const s = resolveMetaShopRowState(
      item,
      key,
      saveOf({ unlockedUpgrades: ['speed_tier_1'], totalKills: item.cost * 10 }),
    );
    expect(s.canAfford).toBe(false);
  });

  it('an ungated item with zero kills is neither locked nor affordable', () => {
    const key = 'speed_tier_1' as MetaShopItemKey;
    const item = META_SHOP_ITEMS[key];
    const s = resolveMetaShopRowState(item, key, saveOf({ totalKills: 0 }));
    expect(s.locked).toBe(false);
    expect(s.achievementMet).toBe(true);
    expect(s.prevMet).toBe(true);
    expect(s.canAfford).toBe(false);
  });

  it('surfaces cost for UI consumption', () => {
    const key = 'speed_tier_1' as MetaShopItemKey;
    const s = resolveMetaShopRowState(META_SHOP_ITEMS[key], key, saveOf());
    expect(s.cost).toBe(META_SHOP_ITEMS[key].cost);
  });
});

describe('buildMetaShopLockReasonSuffix', () => {
  it('returns an empty string when the item is owned', () => {
    const key = 'speed_tier_2' as MetaShopItemKey;
    const state = resolveMetaShopRowState(
      META_SHOP_ITEMS[key],
      key,
      saveOf({ unlockedUpgrades: ['speed_tier_2'] }),
    );
    expect(buildMetaShopLockReasonSuffix(META_SHOP_ITEMS[key], state)).toBe('');
  });

  it('returns an empty string when all gates are met (just unaffordable)', () => {
    const key = 'speed_tier_2' as MetaShopItemKey;
    const state = resolveMetaShopRowState(
      META_SHOP_ITEMS[key],
      key,
      saveOf({
        unlockedUpgrades: ['speed_tier_1'],
        unlockedAchievements: ['ach_survive_10m'],
        totalKills: 0, // can't afford, but not locked
      }),
    );
    expect(buildMetaShopLockReasonSuffix(META_SHOP_ITEMS[key], state)).toBe('');
  });

  it('returns the achievement-required line when the achievement is missing', () => {
    const key = 'speed_tier_2' as MetaShopItemKey;
    const state = resolveMetaShopRowState(
      META_SHOP_ITEMS[key],
      key,
      saveOf({ unlockedUpgrades: ['speed_tier_1'] }), // ach missing, prereq met
    );
    const out = buildMetaShopLockReasonSuffix(META_SHOP_ITEMS[key], state);
    expect(out.startsWith('\n')).toBe(true);
    expect(out).not.toContain('ui.metaShop.requires_achievement');
  });

  it('returns the previous-required line when the prerequisite is missing', () => {
    const key = 'speed_tier_2' as MetaShopItemKey;
    const state = resolveMetaShopRowState(
      META_SHOP_ITEMS[key],
      key,
      saveOf({ unlockedAchievements: ['ach_survive_10m'] }), // prereq missing, ach met
    );
    const out = buildMetaShopLockReasonSuffix(META_SHOP_ITEMS[key], state);
    expect(out.startsWith('\n')).toBe(true);
    expect(out).not.toContain('ui.metaShop.requires_previous');
  });

  it('stacks both lines when both gates are missing', () => {
    const key = 'speed_tier_2' as MetaShopItemKey;
    const state = resolveMetaShopRowState(
      META_SHOP_ITEMS[key],
      key,
      saveOf(), // neither met
    );
    const out = buildMetaShopLockReasonSuffix(META_SHOP_ITEMS[key], state);
    // Two reasons → starts with \n, contains one interior \n separator.
    expect(out.startsWith('\n')).toBe(true);
    const lines = out.split('\n').filter((l) => l.length > 0);
    expect(lines).toHaveLength(2);
  });
});
