import { describe, it, expect } from 'vitest';
import {
  MAIN_MENU_ABANDON_PALETTE,
  MAIN_MENU_DAILY_PALETTE,
  MAIN_MENU_META_PALETTE,
  MAIN_MENU_CHRONICLE_PALETTE,
  MAIN_MENU_DEEDS_PALETTE,
  MAIN_MENU_OPTIONS_PALETTE,
  type MenuButtonPalette,
} from './mainMenuButtonPalettes';

const ALL_PALETTES: ReadonlyArray<[string, MenuButtonPalette]> = [
  ['abandon', MAIN_MENU_ABANDON_PALETTE],
  ['daily', MAIN_MENU_DAILY_PALETTE],
  ['meta', MAIN_MENU_META_PALETTE],
  ['chronicle', MAIN_MENU_CHRONICLE_PALETTE],
  ['deeds', MAIN_MENU_DEEDS_PALETTE],
  ['options', MAIN_MENU_OPTIONS_PALETTE],
];

describe('mainMenuButtonPalettes — structural invariants', () => {
  for (const [name, palette] of ALL_PALETTES) {
    it(`${name}: idle and hover colours differ (hover affordance reads)`, () => {
      expect(palette.idle).not.toBe(palette.hover);
    });

    it(`${name}: hover fill is numerically brighter than idle (naïve sum > idle sum)`, () => {
      // Sum of R+G+B channels — a cheap "hover is brighter than idle" heuristic
      // that every hand-tuned palette here should satisfy.
      const sumChannels = (c: number) =>
        ((c >> 16) & 0xff) + ((c >> 8) & 0xff) + (c & 0xff);
      expect(sumChannels(palette.hover)).toBeGreaterThan(sumChannels(palette.idle));
    });
  }
});

describe('mainMenuButtonPalettes — cross-palette uniqueness', () => {
  it('every idle hue is distinct across the six buttons (no accidental dup)', () => {
    const idles = ALL_PALETTES.map(([, p]) => p.idle);
    expect(new Set(idles).size).toBe(idles.length);
  });

  it('every hover hue is distinct across the six buttons', () => {
    const hovers = ALL_PALETTES.map(([, p]) => p.hover);
    expect(new Set(hovers).size).toBe(hovers.length);
  });
});
