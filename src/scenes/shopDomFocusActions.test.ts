import { describe, expect, it, vi } from 'vitest';
import { buildShopDomFocusActions } from './shopDomFocusActions';
import type { PermanentUpgrade } from '../data/permanentUpgrades';

const stubUpgrade = (key: string, maxLevel = 5): PermanentUpgrade => ({
  key,
  nameKey: 'permanentUpgrade.thick_hide.name',
  descriptionKey: 'permanentUpgrade.thick_hide.description',
  maxLevel,
  baseCost: 10,
  costMultiplier: 1.2,
  effectPerLevel: 'hp_5pct',
});

describe('buildShopDomFocusActions', () => {
  it('emits one action per visible row plus prev, next, and back', () => {
    const visible = [stubUpgrade('a'), stubUpgrade('b')];
    const actions = buildShopDomFocusActions({
      visibleUpgrades: visible,
      upgrades: {},
      gold: 9999,
      hasPrevPage: true,
      hasNextPage: true,
      onBuy: () => undefined,
      onPrevPage: () => undefined,
      onNextPage: () => undefined,
      onBack: () => undefined,
    });
    expect(actions).toHaveLength(visible.length + 3);
    expect(actions[actions.length - 3]?.id).toBe('shop-page-prev');
    expect(actions[actions.length - 2]?.id).toBe('shop-page-next');
    expect(actions[actions.length - 1]?.id).toBe('shop-back');
  });

  it('disables prev/next when pagination flags are false', () => {
    const actions = buildShopDomFocusActions({
      visibleUpgrades: [stubUpgrade('x')],
      upgrades: {},
      gold: 0,
      hasPrevPage: false,
      hasNextPage: false,
      onBuy: () => undefined,
      onPrevPage: () => undefined,
      onNextPage: () => undefined,
      onBack: () => undefined,
    });
    const prev = actions.find((a) => a.id === 'shop-page-prev');
    const next = actions.find((a) => a.id === 'shop-page-next');
    expect(prev?.disabled).toBe(true);
    expect(next?.disabled).toBe(true);
  });

  it('marks maxed rows disabled with MAX in the label', () => {
    const up = stubUpgrade('thick_hide', 1);
    const actions = buildShopDomFocusActions({
      visibleUpgrades: [up],
      upgrades: { thick_hide: 1 },
      gold: 9999,
      hasPrevPage: false,
      hasNextPage: false,
      onBuy: () => undefined,
      onPrevPage: () => undefined,
      onNextPage: () => undefined,
      onBack: () => undefined,
    });
    const row = actions.find((a) => a.id === 'shop-upgrade-thick_hide');
    expect(row?.disabled).toBe(true);
    expect(row?.label).toMatch(/MAX/i);
  });

  it('routes onBuy only when the row is affordable', () => {
    const onBuy = vi.fn();
    const up = stubUpgrade('strong_legs', 5);
    const actions = buildShopDomFocusActions({
      visibleUpgrades: [up],
      upgrades: {},
      gold: 0,
      hasPrevPage: false,
      hasNextPage: false,
      onBuy,
      onPrevPage: () => undefined,
      onNextPage: () => undefined,
      onBack: () => undefined,
    });
    const row = actions.find((a) => a.id === 'shop-upgrade-strong_legs');
    expect(row?.disabled).toBe(true);
    row?.onActivate();
    expect(onBuy).not.toHaveBeenCalled();

    const rich = buildShopDomFocusActions({
      visibleUpgrades: [up],
      upgrades: {},
      gold: 99999,
      hasPrevPage: false,
      hasNextPage: false,
      onBuy,
      onPrevPage: () => undefined,
      onNextPage: () => undefined,
      onBack: () => undefined,
    });
    const row2 = rich.find((a) => a.id === 'shop-upgrade-strong_legs');
    expect(row2?.disabled).not.toBe(true);
    row2?.onActivate();
    expect(onBuy).toHaveBeenCalledExactlyOnceWith('strong_legs');
  });

  it('routes footer callbacks', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const onBack = vi.fn();
    const actions = buildShopDomFocusActions({
      visibleUpgrades: [],
      upgrades: {},
      gold: 0,
      hasPrevPage: true,
      hasNextPage: true,
      onBuy: () => undefined,
      onPrevPage: onPrev,
      onNextPage: onNext,
      onBack: onBack,
    });
    actions.find((a) => a.id === 'shop-page-prev')?.onActivate();
    actions.find((a) => a.id === 'shop-page-next')?.onActivate();
    actions.find((a) => a.id === 'shop-back')?.onActivate();
    expect(onPrev).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('emits non-empty resolved labels — i18n keys must not leak', () => {
    const actions = buildShopDomFocusActions({
      visibleUpgrades: [stubUpgrade('sharp_thistles')],
      upgrades: {},
      gold: 50,
      hasPrevPage: false,
      hasNextPage: true,
      onBuy: () => undefined,
      onPrevPage: () => undefined,
      onNextPage: () => undefined,
      onBack: () => undefined,
    });
    for (const action of actions) {
      expect(action.label.length).toBeGreaterThan(0);
      expect(action.label.startsWith('permanentUpgrade.')).toBe(false);
      expect(action.label.startsWith('ui.shop.')).toBe(false);
    }
  });
});
