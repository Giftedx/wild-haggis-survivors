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
});
