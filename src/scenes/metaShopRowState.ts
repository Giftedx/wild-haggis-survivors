import { META_SHOP_ITEMS, type MetaShopItemKey } from '../data/metaShopItems';
import { ACHIEVEMENT_DEFS } from '../core/BalanceConfig';
import { t } from '../core/i18n';

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

/**
 * Build the "\\n{lock reason}" suffix appended to a locked item's
 * description. Empty string when the item is owned or all gates met —
 * scene appends the suffix unconditionally and it no-ops when empty.
 *
 * Two reason lines can stack (missing achievement AND missing prereq).
 */
/**
 * Colour palette for a MetaShopScene row, keyed on its resolved state.
 * Three mutually-exclusive display paths:
 *
 *   owned   → green name, muted description
 *   locked  → lilac-grey name, dimmer description
 *   buyable → white name, standard description
 */
export interface MetaShopRowPalette {
  nameColor: string;
  descColor: string;
}

export const META_SHOP_PALETTE_OWNED: MetaShopRowPalette = {
  nameColor: '#73c37d', descColor: '#9ea7b9',
};
export const META_SHOP_PALETTE_LOCKED: MetaShopRowPalette = {
  nameColor: '#8a7a98', descColor: '#7a7a8a',
};
export const META_SHOP_PALETTE_BUYABLE: MetaShopRowPalette = {
  nameColor: '#ffffff', descColor: '#9ea7b9',
};

export function resolveMetaShopRowPalette(state: MetaShopRowState): MetaShopRowPalette {
  if (state.owned) return META_SHOP_PALETTE_OWNED;
  if (state.locked) return META_SHOP_PALETTE_LOCKED;
  return META_SHOP_PALETTE_BUYABLE;
}

/**
 * Buy-button colour palette — 2-state, keyed on affordance.
 * Only consulted when a row is in the buyable path (not owned,
 * not locked). canAfford=false leaves the button visible but
 * dimmed so the cost still reads.
 */
export interface MetaShopBuyButtonPalette {
  fillColor: number;
  strokeColor: number;
  textColor: string;
}

export const META_SHOP_BUY_AFFORDABLE: MetaShopBuyButtonPalette = {
  fillColor: 0x2d6a3e, strokeColor: 0x5acf72, textColor: '#ffffff',
};
export const META_SHOP_BUY_UNAFFORDABLE: MetaShopBuyButtonPalette = {
  fillColor: 0x1a1828, strokeColor: 0x3a2a3a, textColor: '#6a5a4a',
};

export function resolveMetaShopBuyButtonPalette(canAfford: boolean): MetaShopBuyButtonPalette {
  return canAfford ? META_SHOP_BUY_AFFORDABLE : META_SHOP_BUY_UNAFFORDABLE;
}

/**
 * Pill-label colours for the "OWNED" / "LOCKED" tags that replace
 * the buy button in those two states. Kept separate from the row
 * palette because the pills read as UI chips (capitalised, bolder)
 * rather than body text, so their hue can skew a touch warmer or
 * cooler than the row name colour it sits beside.
 */
export const META_SHOP_OWNED_PILL_COLOR = '#73c37d';
export const META_SHOP_LOCKED_PILL_COLOR = '#7a6a88';

/**
 * Page navigation button (prev / next) style. Both arrows share one
 * blue-bold look — pulled to a constant so if one drifts the other
 * drifts too.
 */
export interface MetaShopPageButtonStyle {
  color: string;
  fontStyle: 'bold';
}

export const META_SHOP_PAGE_BUTTON_STYLE: MetaShopPageButtonStyle = {
  color: '#8ab8ff',
  fontStyle: 'bold',
};

export function buildMetaShopLockReasonSuffix(
  item: MetaShopItem,
  state: MetaShopRowState,
): string {
  if (state.owned) return '';
  const parts: string[] = [];
  const req = 'requiresAchievement' in item ? item.requiresAchievement : undefined;
  const prevReq = 'requiresPrevious' in item ? item.requiresPrevious : undefined;
  if (req && !state.achievementMet) {
    const achDef = ACHIEVEMENT_DEFS[req];
    parts.push(t('ui.metaShop.requires_achievement', {
      title: t(achDef.titleKey),
      hint: t(achDef.descriptionKey),
    }));
  }
  if (prevReq && !state.prevMet) {
    const prevItem = META_SHOP_ITEMS[prevReq as MetaShopItemKey];
    if (prevItem) {
      parts.push(t('ui.metaShop.requires_previous', { name: t(prevItem.nameKey) }));
    }
  }
  if (parts.length === 0) return '';
  return '\n' + parts.join('\n');
}
