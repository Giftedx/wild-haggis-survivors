import type { AchievementId } from '../core/BalanceConfig';

/**
 * Meta shop — spend SaveManager `totalKills` on persistent stat keys (StatComposer).
 * Display strings resolve via `i18n.t(nameKey)` / `t(descriptionKey)`.
 *
 * Items with `requiresPrevious` must be purchased in order (tier 1 before tier 2).
 */
export const META_SHOP_ITEMS = {
  // ── Speed ──
  speed_tier_1: {
    cost: 50,
    nameKey: 'metaItem.speed_tier_1.name',
    descriptionKey: 'metaItem.speed_tier_1.description',
  },
  speed_tier_2: {
    cost: 200,
    nameKey: 'metaItem.speed_tier_2.name',
    descriptionKey: 'metaItem.speed_tier_2.description',
    requiresAchievement: 'ach_survive_10m' as AchievementId,
    requiresPrevious: 'speed_tier_1' as const,
  },
  // ── Health ──
  health_tier_1: {
    cost: 50,
    nameKey: 'metaItem.health_tier_1.name',
    descriptionKey: 'metaItem.health_tier_1.description',
  },
  health_tier_2: {
    cost: 200,
    nameKey: 'metaItem.health_tier_2.name',
    descriptionKey: 'metaItem.health_tier_2.description',
    requiresAchievement: 'ach_survive_10m' as AchievementId,
    requiresPrevious: 'health_tier_1' as const,
  },
  // ── Pickup ──
  pickup_tier_1: {
    cost: 60,
    nameKey: 'metaItem.pickup_tier_1.name',
    descriptionKey: 'metaItem.pickup_tier_1.description',
    requiresAchievement: 'ach_survive_10m' as AchievementId,
  },
  // ── Damage ──
  damage_tier_1: {
    cost: 75,
    nameKey: 'metaItem.damage_tier_1.name',
    descriptionKey: 'metaItem.damage_tier_1.description',
    requiresAchievement: 'ach_kills_1000' as AchievementId,
  },
  damage_tier_2: {
    cost: 300,
    nameKey: 'metaItem.damage_tier_2.name',
    descriptionKey: 'metaItem.damage_tier_2.description',
    requiresAchievement: 'ach_defeat_taxman' as AchievementId,
    requiresPrevious: 'damage_tier_1' as const,
  },
  // ── Regen ──
  regen_tier_1: {
    cost: 100,
    nameKey: 'metaItem.regen_tier_1.name',
    descriptionKey: 'metaItem.regen_tier_1.description',
  },
  // ── Crit ──
  crit_tier_1: {
    cost: 150,
    nameKey: 'metaItem.crit_tier_1.name',
    descriptionKey: 'metaItem.crit_tier_1.description',
    requiresAchievement: 'ach_survive_5m' as AchievementId,
  },
  // ── Cooldown ──
  cooldown_tier_1: {
    cost: 150,
    nameKey: 'metaItem.cooldown_tier_1.name',
    descriptionKey: 'metaItem.cooldown_tier_1.description',
    requiresAchievement: 'ach_kills_1000' as AchievementId,
  },
  // ── XP ──
  xp_tier_1: {
    cost: 100,
    nameKey: 'metaItem.xp_tier_1.name',
    descriptionKey: 'metaItem.xp_tier_1.description',
  },
  // ── Armor ──
  armor_tier_1: {
    cost: 120,
    nameKey: 'metaItem.armor_tier_1.name',
    descriptionKey: 'metaItem.armor_tier_1.description',
    requiresAchievement: 'ach_survive_5m' as AchievementId,
  },
  // ── Dash ──
  dash_tier_1: {
    cost: 200,
    nameKey: 'metaItem.dash_tier_1.name',
    descriptionKey: 'metaItem.dash_tier_1.description',
    requiresAchievement: 'ach_first_victory' as AchievementId,
  },
} as const;

export type MetaShopItemKey = keyof typeof META_SHOP_ITEMS;

export function listMetaShopItemKeys(): MetaShopItemKey[] {
  return Object.keys(META_SHOP_ITEMS) as MetaShopItemKey[];
}
