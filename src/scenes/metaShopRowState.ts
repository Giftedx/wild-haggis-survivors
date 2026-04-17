import { META_SHOP_ITEMS, type MetaShopItemKey } from '../data/metaShopItems';

/**
 * Narrow slice of the save the meta-shop row state needs. Stays
 * decoupled from the full SaveManager shape so tests can feed it
 * plain objects.
 */
export interface MetaShopRowSave {
  unlockedUpgrades: readonly string[];
  unlockedAchievements: readonly string[];
  /** Total lifetime kills — the meta-shop's currency. */
  totalKills: number;
}

/**
 * View-state for one MetaShopScene row. Three mutually-exclusive
 * display states pop out of the flags:
 *
 *   owned                    → "owned" pill; no buy button
 *   locked && !owned         → "locked" pill + lock reasons
 *   !owned && !locked        → buy button; canAfford controls colour
 *
 * `canAfford` is only meaningful when !owned && !locked; the scene
 * never reads it in the other two branches, but the flag is always
 * computed consistently.
 */
export interface MetaShopRowState {
  owned: boolean;
  achievementMet: boolean;
  prevMet: boolean;
  locked: boolean;
  canAfford: boolean;
  cost: number;
}

type MetaShopItem = (typeof META_SHOP_ITEMS)[MetaShopItemKey];

/**
 * Resolve the three-way row state (owned / locked / buyable) from
 * an item def + the player's save. Pure on its inputs — the scene
 * passes a narrow save slice so tests don't need the SaveManager.
 */
export function resolveMetaShopRowState(
  item: MetaShopItem,
  itemKey: MetaShopItemKey,
  save: MetaShopRowSave,
): MetaShopRowState {
  const owned = save.unlockedUpgrades.includes(itemKey);
  const req = 'requiresAchievement' in item ? item.requiresAchievement : undefined;
  const prevReq = 'requiresPrevious' in item ? item.requiresPrevious : undefined;
  const achievementMet = !req || save.unlockedAchievements.includes(req);
  const prevMet = !prevReq || save.unlockedUpgrades.includes(prevReq as string);
  const locked = (!achievementMet || !prevMet) && !owned;
  const canAfford = !owned && achievementMet && prevMet && save.totalKills >= item.cost;
  return { owned, achievementMet, prevMet, locked, canAfford, cost: item.cost };
}
