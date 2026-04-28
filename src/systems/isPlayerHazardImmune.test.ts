import { describe, expect, it } from 'vitest';
import { isPlayerHazardImmune } from './isPlayerHazardImmune';

describe('isPlayerHazardImmune', () => {
  it('returns false when no immunity source is active', () => {
    expect(isPlayerHazardImmune(false, false, false, false)).toBe(false);
  });

  it('returns true when post-hit iframes are active', () => {
    expect(isPlayerHazardImmune(true, false, false, false)).toBe(true);
  });

  it('returns true when dash invincibility is active', () => {
    expect(isPlayerHazardImmune(false, true, false, false)).toBe(true);
  });

  it('returns true when Burn-Leap hazard immunity is active', () => {
    expect(isPlayerHazardImmune(false, false, true, false)).toBe(true);
  });

  it('returns true when Assist Mode invincibility is active', () => {
    expect(isPlayerHazardImmune(false, false, false, true)).toBe(true);
  });

  it('returns true when multiple sources are active simultaneously', () => {
    expect(isPlayerHazardImmune(true, true, true, true)).toBe(true);
  });
});
