import { t } from '../core/i18n';
import { META_SHOP_ITEMS, type MetaShopItemKey } from '../data/metaShopItems';
import {
  buildMetaShopLockReasonSuffix,
  resolveMetaShopRowState,
  type MetaShopRowSave,
} from './metaShopRowState';
import type { DomFocusAction } from '../ui/domFocusLayer';

/**
 * T407 — DOM-visible focus mirror for MetaShopScene (kill-credit upgrades).
 *
 * Pure helper for `createDomFocusLayer`. Phaser-free aside from `t()`.
 *
 * Row order matches `MetaShopScene.renderRows` slice order. When
 * `pageNavVisible` is false (single page of items), Prev/Next actions are
 * omitted so the DOM layer matches `createPaginationNav`'s no-op layout.
 */
export interface MetaShopDomActionInput {
  readonly pageKeys: readonly MetaShopItemKey[];
  readonly save: MetaShopRowSave;
  /** Mirrors `paginationState(...).pageVisible` — multi-page catalogue only. */
  readonly pageNavVisible: boolean;
  readonly hasPrevPage: boolean;
  readonly hasNextPage: boolean;
  readonly onBuy: (key: MetaShopItemKey) => void;
  readonly onPrevPage: () => void;
  readonly onNextPage: () => void;
  readonly onBack: () => void;
}

function flattenLockSuffix(s: string): string {
  return s.replace(/\s*\n+\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

export function buildMetaShopDomFocusActions(input: MetaShopDomActionInput): DomFocusAction[] {
  const actions: DomFocusAction[] = [];

  for (const key of input.pageKeys) {
    const item = META_SHOP_ITEMS[key];
    const state = resolveMetaShopRowState(item, key, input.save);
    const name = t(item.nameKey);
    const id = `meta-shop-${key}`;

    if (state.owned) {
      actions.push({
        id,
        label: `${name} — ${t('ui.common.owned')}`,
        disabled: true,
        onActivate: () => undefined,
      });
      continue;
    }

    if (state.locked) {
      const rawSuffix = buildMetaShopLockReasonSuffix(item, state);
      const suffix = flattenLockSuffix(rawSuffix);
      const label = suffix.length > 0
        ? `${name} — ${t('ui.common.locked')}. ${suffix}`
        : `${name} — ${t('ui.common.locked')}`;
      actions.push({
        id,
        label,
        disabled: true,
        onActivate: () => undefined,
      });
      continue;
    }

    const costLabel = t('ui.common.buy_kills', { cost: item.cost });
    actions.push({
      id,
      label: `${name} — ${costLabel}`,
      disabled: !state.canAfford,
      onActivate: () => input.onBuy(key),
    });
  }

  if (input.pageNavVisible) {
    actions.push({
      id: 'meta-shop-page-prev',
      label: t('ui.shop.prev'),
      disabled: !input.hasPrevPage,
      onActivate: () => {
        if (!input.hasPrevPage) return;
        input.onPrevPage();
      },
    });
    actions.push({
      id: 'meta-shop-page-next',
      label: t('ui.shop.next'),
      disabled: !input.hasNextPage,
      onActivate: () => {
        if (!input.hasNextPage) return;
        input.onNextPage();
      },
    });
  }

  actions.push({
    id: 'meta-shop-back',
    label: t('ui.metaShop.back'),
    onActivate: () => input.onBack(),
  });

  return actions;
}
