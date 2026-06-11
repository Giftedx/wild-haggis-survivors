import { describe, it, expect } from 'vitest';
import {
  resolveShopUpgradeRowState,
  resolveShopPipStyle,
  resolveShopBuyButtonPalette,
  resolveShopPageButtonPalette,
  SHOP_PIP_FILLED,
  SHOP_PIP_EMPTY,
  SHOP_BUY_AFFORDABLE,
  SHOP_BUY_UNAFFORDABLE,
  SHOP_PAGE_BUTTON_ENABLED,
  SHOP_PAGE_BUTTON_DISABLED,
} from './shopUpgradeRowState';
import type { PermanentUpgrade } from '../data/permanentUpgrades';

function upgrade(overrides: Partial<PermanentUpgrade> = {}): PermanentUpgrade {
  return {
    key: 'test_upg',
    nameKey: 'test.upg.name',
    descriptionKey: 'test.upg.desc',
    maxLevel: 3,
    baseCost: 100,
    costMultiplier: 2,
    effectPerLevel: '+1',
    ...overrides,
  };
}

describe('resolveShopUpgradeRowState', () => {
  it('treats undefined savedLevel as level 0', () => {
    const s = resolveShopUpgradeRowState(upgrade(), undefined, 0);
    expect(s.currentLevel).toBe(0);
    expect(s.isMaxed).toBe(false);
    expect(s.cost).toBeGreaterThan(0);
  });

  it('reports maxed when currentLevel >= maxLevel, with cost 0 and canAfford false', () => {
    const s = resolveShopUpgradeRowState(upgrade({ maxLevel: 3 }), 3, 99_999);
    expect(s.isMaxed).toBe(true);
    expect(s.cost).toBe(0);
    // Contract: maxed rows never show as affordable — even with infinite gold.
    expect(s.canAfford).toBe(false);
  });

  it('reports maxed when currentLevel > maxLevel (corrupted save guard)', () => {
    const s = resolveShopUpgradeRowState(upgrade({ maxLevel: 3 }), 10, 99_999);
    expect(s.isMaxed).toBe(true);
  });

  it('sets canAfford when gold >= cost and not maxed', () => {
    const s = resolveShopUpgradeRowState(upgrade({ baseCost: 100, maxLevel: 5 }), 1, 500);
    // Next tier cost is baseCost * costMultiplier ^ currentLevel = 100 * 2 = 200.
    expect(s.cost).toBe(200);
    expect(s.canAfford).toBe(true);
  });

  it('clears canAfford when gold < cost', () => {
    const s = resolveShopUpgradeRowState(upgrade({ baseCost: 100 }), 0, 50);
    expect(s.cost).toBe(100);
    expect(s.canAfford).toBe(false);
  });

  it('canAfford when gold exactly equals cost (>= not >)', () => {
    const s = resolveShopUpgradeRowState(upgrade({ baseCost: 100 }), 0, 100);
    expect(s.canAfford).toBe(true);
  });

  it('clamps negative savedLevel to 0', () => {
    const s = resolveShopUpgradeRowState(upgrade(), -5, 0);
    expect(s.currentLevel).toBe(0);
  });

  it('floors fractional savedLevel', () => {
    const s = resolveShopUpgradeRowState(upgrade({ maxLevel: 5 }), 1.9, 1000);
    expect(s.currentLevel).toBe(1);
  });
});

describe('resolveShopPipStyle', () => {
  it('filled → gold palette', () => {
    expect(resolveShopPipStyle(true)).toBe(SHOP_PIP_FILLED);
  });
  it('empty → slate palette', () => {
    expect(resolveShopPipStyle(false)).toBe(SHOP_PIP_EMPTY);
  });
  it('filled and empty palettes never share a field', () => {
    expect(SHOP_PIP_FILLED.fillColor).not.toBe(SHOP_PIP_EMPTY.fillColor);
    expect(SHOP_PIP_FILLED.strokeColor).not.toBe(SHOP_PIP_EMPTY.strokeColor);
  });
});

describe('resolveShopBuyButtonPalette', () => {
  it('affordable → blue palette', () => {
    expect(resolveShopBuyButtonPalette(true)).toBe(SHOP_BUY_AFFORDABLE);
  });
  it('not affordable → dim palette', () => {
    expect(resolveShopBuyButtonPalette(false)).toBe(SHOP_BUY_UNAFFORDABLE);
  });
  it('two palettes differ on every field', () => {
    expect(SHOP_BUY_AFFORDABLE.fillColor).not.toBe(SHOP_BUY_UNAFFORDABLE.fillColor);
    expect(SHOP_BUY_AFFORDABLE.strokeColor).not.toBe(SHOP_BUY_UNAFFORDABLE.strokeColor);
    expect(SHOP_BUY_AFFORDABLE.textColor).not.toBe(SHOP_BUY_UNAFFORDABLE.textColor);
  });
});

describe('resolveShopPageButtonPalette', () => {
  it('enabled → bright navy palette', () => {
    expect(resolveShopPageButtonPalette(true)).toBe(SHOP_PAGE_BUTTON_ENABLED);
  });
  it('disabled → dim slate palette', () => {
    expect(resolveShopPageButtonPalette(false)).toBe(SHOP_PAGE_BUTTON_DISABLED);
  });
  it('two palettes differ on every field', () => {
    expect(SHOP_PAGE_BUTTON_ENABLED.fillColor).not.toBe(SHOP_PAGE_BUTTON_DISABLED.fillColor);
    expect(SHOP_PAGE_BUTTON_ENABLED.strokeColor).not.toBe(SHOP_PAGE_BUTTON_DISABLED.strokeColor);
    expect(SHOP_PAGE_BUTTON_ENABLED.textColor).not.toBe(SHOP_PAGE_BUTTON_DISABLED.textColor);
  });
});
