import { describe, it, expect } from 'vitest';
import { MAIN_MENU_HEARTH } from './mainMenuHearthPalette';

describe('MAIN_MENU_HEARTH palette', () => {
  it('every layer has an alpha in (0, 1]', () => {
    const alphas = [
      MAIN_MENU_HEARTH.baseAlpha,
      MAIN_MENU_HEARTH.glowOuterAlpha,
      MAIN_MENU_HEARTH.glowInnerAlpha,
      MAIN_MENU_HEARTH.coreAlpha,
      MAIN_MENU_HEARTH.emberAlpha,
    ];
    for (const a of alphas) {
      expect(a).toBeGreaterThan(0);
      expect(a).toBeLessThanOrEqual(1);
    }
  });

  it('core colour matches ember colour (same hot orange drifts up)', () => {
    expect(MAIN_MENU_HEARTH.core).toBe(MAIN_MENU_HEARTH.ember);
  });

  it('inner glow is brighter (higher alpha) than outer glow', () => {
    expect(MAIN_MENU_HEARTH.glowInnerAlpha).toBeGreaterThan(MAIN_MENU_HEARTH.glowOuterAlpha);
  });

  it('base charcoal is distinct from the warm palette', () => {
    const warm = new Set([
      MAIN_MENU_HEARTH.glowOuter,
      MAIN_MENU_HEARTH.glowInner,
      MAIN_MENU_HEARTH.core,
      MAIN_MENU_HEARTH.ember,
    ]);
    expect(warm.has(MAIN_MENU_HEARTH.base)).toBe(false);
  });

  it('smoke tint is a muted warm grey (not in the hot-orange family)', () => {
    expect(MAIN_MENU_HEARTH.smoke).toBe(0xccbbaa);
  });
});
