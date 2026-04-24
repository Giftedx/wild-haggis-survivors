import { describe, expect, it } from 'vitest';

import {
  markPhotosensitivityWarningSeen,
  shouldShowPhotosensitivityWarning,
} from './photosensitivityWarning';

describe('shouldShowPhotosensitivityWarning', () => {
  it('true when the flag is false (fresh save)', () => {
    expect(shouldShowPhotosensitivityWarning({ photosensitivityWarningSeen: false })).toBe(true);
  });

  it('false once the flag is true (player has dismissed at least once)', () => {
    expect(shouldShowPhotosensitivityWarning({ photosensitivityWarningSeen: true })).toBe(false);
  });

  it('treats malformed non-boolean values as "not seen yet" (fail-safe)', () => {
    // If the coerce path somehow lets a non-boolean through, we'd rather
    // show the splash once than silently skip it — photosensitivity is the
    // kind of warning where false-positive is cheap and false-negative is
    // expensive.
    expect(
      shouldShowPhotosensitivityWarning(
        { photosensitivityWarningSeen: 'yes' as unknown as boolean },
      ),
    ).toBe(true);
    expect(
      shouldShowPhotosensitivityWarning(
        { photosensitivityWarningSeen: 1 as unknown as boolean },
      ),
    ).toBe(true);
  });
});

describe('markPhotosensitivityWarningSeen', () => {
  it('returns a new object with the flag flipped to true', () => {
    const input = { photosensitivityWarningSeen: false };
    const output = markPhotosensitivityWarningSeen(input);
    expect(output.photosensitivityWarningSeen).toBe(true);
    // Source not mutated — pure.
    expect(input.photosensitivityWarningSeen).toBe(false);
  });

  it('passes through unrelated fields untouched', () => {
    const input = { photosensitivityWarningSeen: false, reduceFlashing: true, motionScale: 0.5 };
    const output = markPhotosensitivityWarningSeen(input);
    expect(output.reduceFlashing).toBe(true);
    expect(output.motionScale).toBe(0.5);
    expect(output.photosensitivityWarningSeen).toBe(true);
  });

  it('no-op equivalent when the flag is already true', () => {
    const input = { photosensitivityWarningSeen: true };
    const output = markPhotosensitivityWarningSeen(input);
    expect(output.photosensitivityWarningSeen).toBe(true);
  });
});
