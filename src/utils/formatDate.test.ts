import { describe, expect, it } from 'vitest';
import { formatLocalYmd } from './formatDate';

describe('formatLocalYmd', () => {
  it('zero-pads single-digit months and days', () => {
    // Jan 5 local — constructor with (year, monthIndex, day) is local time.
    expect(formatLocalYmd(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('preserves two-digit months and days', () => {
    expect(formatLocalYmd(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('handles year boundaries', () => {
    expect(formatLocalYmd(new Date(1999, 0, 1))).toBe('1999-01-01');
    expect(formatLocalYmd(new Date(2000, 0, 1))).toBe('2000-01-01');
  });
});
