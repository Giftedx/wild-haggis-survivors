import { describe, it, expect } from 'vitest';
import {
  resolveButtonStyle,
  type ButtonTier,
} from './gameButton';

describe('resolveButtonStyle', () => {
  it('primary tier uses SCOTTISH_BLUE fill', () => {
    const s = resolveButtonStyle('primary');
    expect(s.fill).toBe(0x005eb8);
  });

  it('secondary tier uses slate fill', () => {
    const s = resolveButtonStyle('secondary');
    expect(s.fill).toBe(0x3a4357);
  });

  it('tertiary tier uses dark navy fill', () => {
    const s = resolveButtonStyle('tertiary');
    expect(s.fill).toBe(0x252540);
  });

  it('all tiers define hover fill different from idle', () => {
    for (const tier of ['primary', 'secondary', 'tertiary'] as ButtonTier[]) {
      const s = resolveButtonStyle(tier);
      expect(s.hover).not.toBe(s.fill);
    }
  });

  it('all tiers define text color', () => {
    for (const tier of ['primary', 'secondary', 'tertiary'] as ButtonTier[]) {
      const s = resolveButtonStyle(tier);
      expect(s.textColor).toBeTruthy();
    }
  });

  it('all tiers define fontSize', () => {
    for (const tier of ['primary', 'secondary', 'tertiary'] as ButtonTier[]) {
      const s = resolveButtonStyle(tier);
      expect(s.fontSize).toMatch(/^\d+px$/);
    }
  });

  it('all tiers have strokeThickness >= 2', () => {
    for (const tier of ['primary', 'secondary', 'tertiary'] as ButtonTier[]) {
      const s = resolveButtonStyle(tier);
      expect(s.strokeThickness).toBeGreaterThanOrEqual(2);
    }
  });
});
