import { describe, expect, it } from 'vitest';
import { COLORS, COLORS_CSS } from './config';
import { numberToCssColor } from './utils/colorFormat';

/**
 * COLORS_CSS is a hand-maintained string mirror of the numeric palette.
 * These tests catch the next time someone retunes a numeric colour and
 * forgets to update its string twin.
 */
describe('COLORS_CSS mirrors COLORS', () => {
  it('WHISKY_GOLD matches the numeric palette', () => {
    expect(COLORS_CSS.WHISKY_GOLD).toBe(numberToCssColor(COLORS.WHISKY_GOLD));
  });

  it('WHITE is the conventional CSS white', () => {
    expect(COLORS_CSS.WHITE).toBe('#ffffff');
  });

  it('BG_DARK matches the numeric palette', () => {
    expect(COLORS_CSS.BG_DARK).toBe(numberToCssColor(COLORS.BG_DARK));
  });

  it('INK is the warm-black stroke colour (distinct from pure #000)', () => {
    // Kept separate from #000 deliberately — warm shift over moor-blue.
    expect(COLORS_CSS.INK).toBe('#0a0a14');
  });

  it('HP_RED matches the numeric palette', () => {
    expect(COLORS_CSS.HP_RED).toBe(numberToCssColor(COLORS.HP_RED));
  });
});
