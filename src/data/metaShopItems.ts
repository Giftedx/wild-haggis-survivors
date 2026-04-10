import type { AchievementId } from '../core/BalanceConfig';

/**
 * Meta shop — spend SaveManager `totalKills` on persistent stat keys (StatComposer).
 */
export const META_SHOP_ITEMS = {
  speed_tier_1: {
    cost: 50,
    name: 'Sprint Boots',
    description: '+10% base move speed for new runs.',
  },
  health_tier_1: {
    cost: 50,
    name: 'Thick Pelt',
    description: '+10% base max HP for new runs.',
  },
  pickup_tier_1: {
    cost: 60,
    name: 'Magnetic Whiskers',
    description: '+22 pickup radius on new runs.',
    requiresAchievement: 'ach_survive_10m' as AchievementId,
  },
  damage_tier_1: {
    cost: 75,
    name: 'Highland Temper',
    description: '+5% damage on new runs.',
    requiresAchievement: 'ach_kills_1000' as AchievementId,
  },
} as const;

export type MetaShopItemKey = keyof typeof META_SHOP_ITEMS;

export function listMetaShopItemKeys(): MetaShopItemKey[] {
  return Object.keys(META_SHOP_ITEMS) as MetaShopItemKey[];
}
