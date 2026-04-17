import { describe, it, expect } from 'vitest';
import { numberToCssColor } from './colorFormat';

describe('numberToCssColor', () => {
  it('converts a standard 6-digit colour', () => {
    expect(numberToCssColor(0xd4a017)).toBe('#d4a017');
  });

  it('zero-pads short colours (pure blue)', () => {
    expect(numberToCssColor(0x0000ff)).toBe('#0000ff');
    expect(numberToCssColor(0xff)).toBe('#0000ff');
  });

  it('white and black round-trip', () => {
    expect(numberToCssColor(0xffffff)).toBe('#ffffff');
    expect(numberToCssColor(0x000000)).toBe('#000000');
  });

  it('strips the alpha byte from ARGB numbers (drops top byte)', () => {
    // 0xff... where the leading ff is alpha, should read as RRGGBB only.
    expect(numberToCssColor(0xffd4a017)).toBe('#d4a017');
  });

  it('always returns a 7-char string (# + 6 hex digits)', () => {
    for (const c of [0x000000, 0x1, 0x0f, 0xff, 0xffff, 0xffffff, 0xd4a017]) {
      expect(numberToCssColor(c)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
