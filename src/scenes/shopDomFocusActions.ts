import { t } from '../core/i18n';
import type { PermanentUpgrade } from '../data/permanentUpgrades';
import { resolveShopUpgradeRowState } from './shopUpgradeRowState';
import type { DomFocusAction } from '../ui/domFocusLayer';

/**
 * T407 — DOM-visible focus mirror for ShopScene (permanent upgrades).
 *
 * Pure helper: builds `DomFocusAction[]` for `createDomFocusLayer`. Phaser-
 * free aside from `t()` so Vitest can assert ordering + id stability.
 *
 * Action order matches the scene layout: current page rows (top → bottom),
 * then Prev page, Next page, Back to menu.
 */
export interface ShopDomActionInput {
  readonly visibleUpgrades: readonly PermanentUpgrade[];
  readonly upgrades: Readonly<Record<string, number>>;
  readonly gold: number;
  readonly hasPrevPage: boolean;
  readonly hasNextPage: boolean;
  readonly onBuy: (upgradeKey: string) => void;
  readonly onPrevPage: () => void;
  readonly onNextPage: () => void;
  readonly onBack: () => void;
}

export function buildShopDomFocusActions(input: ShopDomActionInput): DomFocusAction[] {
  const actions: DomFocusAction[] = [];

  for (const upgrade of input.visibleUpgrades) {
    const currentLevel = input.upgrades[upgrade.key] ?? 0;
    const rowState = resolveShopUpgradeRowState(upgrade, currentLevel, input.gold);
    const name = t(upgrade.nameKey);
    const id = `shop-upgrade-${upgrade.key}`;

    if (rowState.isMaxed) {
      actions.push({
        id,
        label: `${name} — ${t('ui.shop.max')}`,
        disabled: true,
        onActivate: () => undefined,
      });
      continue;
    }

    const costLabel = t('ui.shop.cost_gold', { cost: rowState.cost });
    actions.push({
      id,
      label: `${name} — ${costLabel}`,
      disabled: !rowState.canAfford,
      onActivate: () => {
        if (!rowState.canAfford) return;
        input.onBuy(upgrade.key);
      },
    });
  }

  actions.push({
    id: 'shop-page-prev',
    label: t('ui.shop.prev'),
    disabled: !input.hasPrevPage,
    onActivate: () => {
      if (!input.hasPrevPage) return;
      input.onPrevPage();
    },
  });
  actions.push({
    id: 'shop-page-next',
    label: t('ui.shop.next'),
    disabled: !input.hasNextPage,
    onActivate: () => {
      if (!input.hasNextPage) return;
      input.onNextPage();
    },
  });
  actions.push({
    id: 'shop-back',
    label: t('ui.shop.back_to_menu'),
    onActivate: () => input.onBack(),
  });

  return actions;
}
