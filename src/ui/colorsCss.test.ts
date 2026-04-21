import { describe, it, expect } from 'vitest';
import { COLORS, COLORS_CSS } from '../config';

/**
 * Enforce that COLORS (hex integers) and COLORS_CSS (CSS strings) stay in
 * sync for keys that exist in both objects.  A `0xRRGGBB` integer and its
 * `#rrggbb` counterpart must encode the same colour — this test catches
 * accidental drift when either value is edited.
 */
function hexToCss(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0');
}

describe('COLORS / COLORS_CSS parity — shared numeric+string keys', () => {
  it('CRIT_GOLD: hex and CSS encode the same colour', () => {
    expect(hexToCss(COLORS.CRIT_GOLD)).toBe(COLORS_CSS.CRIT_GOLD);
  });

  it('REWARD_GOLD: hex and CSS encode the same colour', () => {
    expect(hexToCss(COLORS.REWARD_GOLD)).toBe(COLORS_CSS.REWARD_GOLD);
  });

  it('POSITIVE_GREEN: hex and CSS encode the same colour', () => {
    expect(hexToCss(COLORS.POSITIVE_GREEN)).toBe(COLORS_CSS.POSITIVE_GREEN);
  });

  it('COMBO_AMBER: hex and CSS encode the same colour', () => {
    expect(hexToCss(COLORS.COMBO_AMBER)).toBe(COLORS_CSS.COMBO_AMBER);
  });
});
