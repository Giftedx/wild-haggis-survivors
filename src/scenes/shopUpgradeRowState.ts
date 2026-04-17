import { getUpgradeCost, type PermanentUpgrade } from '../data/permanentUpgrades';
import { COLORS } from '../config';

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

/** Upgrade pip colours — filled (owned level) vs empty (future level). */
export interface ShopPipStyle {
  fillColor: number;
  strokeColor: number;
}
export const SHOP_PIP_FILLED: ShopPipStyle = { fillColor: COLORS.WHISKY_GOLD, strokeColor: 0xffcc44 };
export const SHOP_PIP_EMPTY: ShopPipStyle = { fillColor: 0x273043, strokeColor: 0x4a5569 };
export function resolveShopPipStyle(filled: boolean): ShopPipStyle {
  return filled ? SHOP_PIP_FILLED : SHOP_PIP_EMPTY;
}

/** Buy-button palette — 2-state, keyed on affordance. */
export interface ShopBuyButtonPalette {
  fillColor: number;
  strokeColor: number;
  textColor: string;
}
export const SHOP_BUY_AFFORDABLE: ShopBuyButtonPalette = {
  fillColor: COLORS.SCOTTISH_BLUE, strokeColor: 0x8bb4ff, textColor: '#ffffff',
};
export const SHOP_BUY_UNAFFORDABLE: ShopBuyButtonPalette = {
  fillColor: 0x1a1828, strokeColor: 0x3a2a3a, textColor: '#6a5a4a',
};
export function resolveShopBuyButtonPalette(canAfford: boolean): ShopBuyButtonPalette {
  return canAfford ? SHOP_BUY_AFFORDABLE : SHOP_BUY_UNAFFORDABLE;
}

/**
 * Page-nav button palette — enabled + hover-accent, or a dim
 * "greyed out" look when the button is the current-edge (prev on
 * page 0 / next on last page). Mirrors the 3-field buy-button
 * pattern so visual style stays consistent.
 */
export interface ShopPageButtonPalette {
  fillColor: number;
  strokeColor: number;
  textColor: string;
}

export const SHOP_PAGE_BUTTON_ENABLED: ShopPageButtonPalette = {
  fillColor: 0x24314f, strokeColor: 0x698ac2, textColor: '#d6e3ff',
};
export const SHOP_PAGE_BUTTON_DISABLED: ShopPageButtonPalette = {
  fillColor: 0x1b2230, strokeColor: 0x343c4b, textColor: '#6a7384',
};
/** Hover-accent fill for enabled page buttons. */
export const SHOP_PAGE_BUTTON_HOVER_FILL = 0x304269;

export function resolveShopPageButtonPalette(enabled: boolean): ShopPageButtonPalette {
  return enabled ? SHOP_PAGE_BUTTON_ENABLED : SHOP_PAGE_BUTTON_DISABLED;
}
