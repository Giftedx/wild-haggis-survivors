import { describe, it, expect } from 'vitest';
import { TOAST_COLORS } from './toastPalette';

describe('TOAST_COLORS', () => {
  it('covers all semantic categories', () => {
    expect(TOAST_COLORS.reward).toBe('#ffcc44');
    expect(TOAST_COLORS.legendary).toBe('#ddaa00');
    expect(TOAST_COLORS.positive).toBe('#44dd44');
    expect(TOAST_COLORS.info).toBe('#c8d0e0');
    expect(TOAST_COLORS.warning).toBe('#ff8844');
  });
});
