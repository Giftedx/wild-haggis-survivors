import { describe, expect, it } from 'vitest';
import { META_SHOP_ITEMS, listMetaShopItemKeys, type MetaShopItemKey } from './metaShopItems';
import { ACHIEVEMENT_DEFS, type AchievementId } from '../core/BalanceConfig';
import { t } from '../core/i18n';

describe('metaShopItems', () => {
  it('lists all keys from META_SHOP_ITEMS', () => {
    const keys = listMetaShopItemKeys();
    expect(keys).toEqual(Object.keys(META_SHOP_ITEMS));
    expect(keys.length).toBeGreaterThanOrEqual(13);
  });

  it('every item has valid i18n name and description keys', () => {
    for (const key of listMetaShopItemKeys()) {
      const item = META_SHOP_ITEMS[key];
      const name = t(item.nameKey);
      const desc = t(item.descriptionKey);
      // i18n returns the key itself when not found — check it resolved
      expect(name).not.toBe(item.nameKey);
      expect(desc).not.toBe(item.descriptionKey);
      expect(name.length).toBeGreaterThan(0);
      expect(desc.length).toBeGreaterThan(0);
    }
  });

  it('every requiresAchievement references a valid AchievementId', () => {
    for (const key of listMetaShopItemKeys()) {
      const item = META_SHOP_ITEMS[key];
      if ('requiresAchievement' in item) {
        const achId = item.requiresAchievement as AchievementId;
        expect(ACHIEVEMENT_DEFS).toHaveProperty(achId);
      }
    }
  });

  it('every requiresPrevious references an existing meta shop item', () => {
    const allKeys = new Set(listMetaShopItemKeys());
    for (const key of listMetaShopItemKeys()) {
      const item = META_SHOP_ITEMS[key];
      if ('requiresPrevious' in item) {
        expect(allKeys.has(item.requiresPrevious as MetaShopItemKey)).toBe(true);
      }
    }
  });

  it('tier-2 items always require a tier-1 prerequisite', () => {
    for (const key of listMetaShopItemKeys()) {
      if (key.endsWith('_tier_2')) {
        const item = META_SHOP_ITEMS[key];
        expect('requiresPrevious' in item).toBe(true);
        const prevKey = (item as any).requiresPrevious as string;
        expect(prevKey).toMatch(/_tier_1$/);
      }
    }
  });

  it('all costs are positive integers', () => {
    for (const key of listMetaShopItemKeys()) {
      const item = META_SHOP_ITEMS[key];
      expect(item.cost).toBeGreaterThan(0);
      expect(Number.isInteger(item.cost)).toBe(true);
    }
  });
});
