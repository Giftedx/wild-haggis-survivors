import { describe, expect, it, vi } from 'vitest';
import { buildMetaShopDomFocusActions } from './metaShopDomFocusActions';
import type { MetaShopItemKey } from '../data/metaShopItems';
import type { MetaShopRowSave } from './metaShopRowState';

const emptySave: MetaShopRowSave = {
  unlockedUpgrades: [],
  unlockedAchievements: [],
  totalKills: 0,
};

describe('buildMetaShopDomFocusActions', () => {
  it('with page nav visible appends prev, next, then back', () => {
    const keys: MetaShopItemKey[] = ['speed_tier_1'];
    const actions = buildMetaShopDomFocusActions({
      pageKeys: keys,
      save: { ...emptySave, totalKills: 9999 },
      pageNavVisible: true,
      hasPrevPage: false,
      hasNextPage: true,
      onBuy: () => undefined,
      onPrevPage: () => undefined,
      onNextPage: () => undefined,
      onBack: () => undefined,
    });
    expect(actions.length).toBeGreaterThanOrEqual(4);
    expect(actions[actions.length - 3]?.id).toBe('meta-shop-page-prev');
    expect(actions[actions.length - 2]?.id).toBe('meta-shop-page-next');
    expect(actions[actions.length - 1]?.id).toBe('meta-shop-back');
  });

  it('omits prev/next when pageNavVisible is false', () => {
    const keys: MetaShopItemKey[] = ['speed_tier_1'];
    const actions = buildMetaShopDomFocusActions({
      pageKeys: keys,
      save: { ...emptySave, totalKills: 9999 },
      pageNavVisible: false,
      hasPrevPage: false,
      hasNextPage: false,
      onBuy: () => undefined,
      onPrevPage: () => undefined,
      onNextPage: () => undefined,
      onBack: () => undefined,
    });
    expect(actions.find((a) => a.id === 'meta-shop-page-prev')).toBeUndefined();
    expect(actions.find((a) => a.id === 'meta-shop-page-next')).toBeUndefined();
    expect(actions[actions.length - 1]?.id).toBe('meta-shop-back');
  });

  it('disables pagination buttons when flags are false', () => {
    const actions = buildMetaShopDomFocusActions({
      pageKeys: ['speed_tier_1'],
      save: { ...emptySave, totalKills: 9999 },
      pageNavVisible: true,
      hasPrevPage: false,
      hasNextPage: false,
      onBuy: () => undefined,
      onPrevPage: () => undefined,
      onNextPage: () => undefined,
      onBack: () => undefined,
    });
    expect(actions.find((a) => a.id === 'meta-shop-page-prev')?.disabled).toBe(true);
    expect(actions.find((a) => a.id === 'meta-shop-page-next')?.disabled).toBe(true);
  });

  it('routes onBuy for an affordable buyable row', () => {
    const onBuy = vi.fn();
    const actions = buildMetaShopDomFocusActions({
      pageKeys: ['speed_tier_1'],
      save: { ...emptySave, totalKills: 500 },
      pageNavVisible: false,
      hasPrevPage: false,
      hasNextPage: false,
      onBuy,
      onPrevPage: () => undefined,
      onNextPage: () => undefined,
      onBack: () => undefined,
    });
    const row = actions.find((a) => a.id === 'meta-shop-speed_tier_1');
    expect(row?.disabled).not.toBe(true);
    row?.onActivate();
    expect(onBuy).toHaveBeenCalledExactlyOnceWith('speed_tier_1');
  });

  it('marks owned rows disabled', () => {
    const actions = buildMetaShopDomFocusActions({
      pageKeys: ['speed_tier_1'],
      save: {
        unlockedUpgrades: ['speed_tier_1'],
        unlockedAchievements: [],
        totalKills: 0,
      },
      pageNavVisible: false,
      hasPrevPage: false,
      hasNextPage: false,
      onBuy: () => undefined,
      onPrevPage: () => undefined,
      onNextPage: () => undefined,
      onBack: () => undefined,
    });
    const row = actions.find((a) => a.id === 'meta-shop-speed_tier_1');
    expect(row?.disabled).toBe(true);
    expect(row?.label).toMatch(/Yours/i);
  });

  it('emits non-empty labels without raw i18n key leaks', () => {
    const actions = buildMetaShopDomFocusActions({
      pageKeys: ['health_tier_1'],
      save: { ...emptySave, totalKills: 500 },
      pageNavVisible: true,
      hasPrevPage: true,
      hasNextPage: true,
      onBuy: () => undefined,
      onPrevPage: () => undefined,
      onNextPage: () => undefined,
      onBack: () => undefined,
    });
    for (const action of actions) {
      expect(action.label.length).toBeGreaterThan(0);
      expect(action.label.startsWith('metaItem.')).toBe(false);
      expect(action.label.startsWith('ui.')).toBe(false);
    }
  });
});
