import type { AchievementId } from '../core/BalanceConfig';

/**
 * Meta shop — spend SaveManager `totalKills` on persistent stat keys (StatComposer).
 * Display strings resolve via `i18n.t(nameKey)` / `t(descriptionKey)`.
 */
export const META_SHOP_ITEMS = {
  speed_tier_1: {
    cost: 50,
    nameKey: 'metaItem.speed_tier_1.name',
    descriptionKey: 'metaItem.speed_tier_1.description',
  },
  health_tier_1: {
    cost: 50,
    nameKey: 'metaItem.health_tier_1.name',
    descriptionKey: 'metaItem.health_tier_1.description',
  },
  pickup_tier_1: {
    cost: 60,
    nameKey: 'metaItem.pickup_tier_1.name',
    descriptionKey: 'metaItem.pickup_tier_1.description',
    requiresAchievement: 'ach_survive_10m' as AchievementId,
  },
  damage_tier_1: {
    cost: 75,
    nameKey: 'metaItem.damage_tier_1.name',
    descriptionKey: 'metaItem.damage_tier_1.description',
    requiresAchievement: 'ach_kills_1000' as AchievementId,
  },
} as const;

export type MetaShopItemKey = keyof typeof META_SHOP_ITEMS;

export function listMetaShopItemKeys(): MetaShopItemKey[] {
  return Object.keys(META_SHOP_ITEMS) as MetaShopItemKey[];
}
