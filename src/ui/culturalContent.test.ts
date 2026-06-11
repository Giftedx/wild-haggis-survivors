import { describe, expect, it } from 'vitest';
import {
  shouldShowCulturalContentSplash,
  markCulturalContentSplashSeen,
} from './culturalContent';

describe('culturalContent gate', () => {
  describe('shouldShowCulturalContentSplash', () => {
    it('shows on a fresh save (flag false)', () => {
      expect(shouldShowCulturalContentSplash({ culturalContentSplashSeen: false })).toBe(true);
    });

    it('hides on a returning save (flag true)', () => {
      expect(shouldShowCulturalContentSplash({ culturalContentSplashSeen: true })).toBe(false);
    });

    it('treats non-true values as "still show" (fail-safe — malformed save reads as not seen)', () => {
      // Defensive: if the flag arrives as undefined / null / 'yes' string due
      // to storage corruption, the gate returns true so the splash is shown
      // again rather than silently swallowed.
      const cases = [
        { culturalContentSplashSeen: undefined as unknown as boolean },
        { culturalContentSplashSeen: null as unknown as boolean },
        { culturalContentSplashSeen: 'yes' as unknown as boolean },
        { culturalContentSplashSeen: 1 as unknown as boolean },
      ];
      for (const c of cases) {
        expect(shouldShowCulturalContentSplash(c)).toBe(true);
      }
    });
  });

  describe('markCulturalContentSplashSeen', () => {
    it('flips the flag without mutating the input', () => {
      const before = { culturalContentSplashSeen: false, otherField: 'x' };
      const after = markCulturalContentSplashSeen(before);
      expect(after.culturalContentSplashSeen).toBe(true);
      expect(before.culturalContentSplashSeen).toBe(false);
      // Unrelated fields preserved (the function takes a generic).
      expect(after.otherField).toBe('x');
    });

    it('is idempotent on an already-seen save', () => {
      const before = { culturalContentSplashSeen: true };
      const after = markCulturalContentSplashSeen(before);
      expect(after.culturalContentSplashSeen).toBe(true);
    });
  });
});
