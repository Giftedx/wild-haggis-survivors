import type { ISaveData } from './SaveManager';
import { META_SHOP_ITEMS, type MetaShopItemKey } from '../data/metaShopItems';

export type MetaPurchaseFailureReason = 'UNKNOWN_ITEM' | 'INSUFFICIENT_FUNDS' | 'ALREADY_OWNED';

export type MetaPurchaseResult =
  | { ok: true; next: ISaveData }
  | { ok: false; reason: MetaPurchaseFailureReason };

function isMetaShopKey(key: string): key is MetaShopItemKey {
  return Object.prototype.hasOwnProperty.call(META_SHOP_ITEMS, key);
}

/**
 * Pure purchase attempt — callers persist with SaveManager.save(next) on success.
 */
export function tryPurchaseMetaUpgrade(save: ISaveData, upgradeKey: string): MetaPurchaseResult {
  if (!isMetaShopKey(upgradeKey)) {
    return { ok: false, reason: 'UNKNOWN_ITEM' };
  }
  const item = META_SHOP_ITEMS[upgradeKey];
  if (save.unlockedUpgrades.includes(upgradeKey)) {
    return { ok: false, reason: 'ALREADY_OWNED' };
  }
  if (save.totalKills < item.cost) {
    return { ok: false, reason: 'INSUFFICIENT_FUNDS' };
  }
  return {
    ok: true,
    next: {
      ...save,
      totalKills: save.totalKills - item.cost,
      unlockedUpgrades: [...save.unlockedUpgrades, upgradeKey],
    },
  };
}
