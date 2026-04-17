import { getUpgradeCost, type PermanentUpgrade } from '../data/permanentUpgrades';

/**
 * Pure view-state resolver for one ShopScene upgrade row. Given the
 * upgrade def, the player's current level in that upgrade, and the
 * player's gold, returns the flags the row needs to render: is it
 * maxed, what does the next tier cost, can the player afford it.
 *
 * Extracted from ShopScene.renderUpgradeRow so the three branches
 * (maxed / affordable / too-expensive) can be pinned by tests without
 * spinning up a Phaser scene.
 *
 * Contract: when `isMaxed` is true, `cost` is 0 and `canAfford` is
 * false — the row shows the "MAX" label and no buy button.
 */
export interface ShopUpgradeRowState {
  /** Player's current level in this upgrade (0..maxLevel). */
  currentLevel: number;
  /** True when currentLevel >= maxLevel. */
  isMaxed: boolean;
  /** Gold cost of the next level (0 when maxed). */
  cost: number;
  /** True when not maxed AND the player has enough gold. */
  canAfford: boolean;
}

export function resolveShopUpgradeRowState(
  upgrade: PermanentUpgrade,
  savedLevel: number | undefined,
  gold: number,
): ShopUpgradeRowState {
  const currentLevel = Math.max(0, Math.floor(savedLevel ?? 0));
  const isMaxed = currentLevel >= upgrade.maxLevel;
  const cost = isMaxed ? 0 : getUpgradeCost(upgrade, currentLevel);
  const canAfford = !isMaxed && gold >= cost;
  return { currentLevel, isMaxed, cost, canAfford };
}
