import { describe, expect, it } from 'vitest';
import {
  CAPTION_FADE_OUT_MS,
  captionFadeAlpha,
  captionStackYOffset,
} from './captionOverlayLayout';

describe('captionFadeAlpha', () => {
  const w = CAPTION_FADE_OUT_MS;

  it('is 1 while above the fade window', () => {
    expect(captionFadeAlpha(w + 1, w)).toBe(1);
    expect(captionFadeAlpha(5000, w)).toBe(1);
  });

  it('ramps linearly inside the fade window', () => {
    expect(captionFadeAlpha(w, w)).toBe(1);
    expect(captionFadeAlpha(w / 2, w)).toBeCloseTo(0.5, 5);
    expect(captionFadeAlpha(0, w)).toBe(0);
  });

  it('is 0 for non-positive remaining time', () => {
    expect(captionFadeAlpha(0, w)).toBe(0);
    expect(captionFadeAlpha(-50, w)).toBe(0);
  });

  it('treats non-positive fade window as binary', () => {
    expect(captionFadeAlpha(10, 0)).toBe(1);
    expect(captionFadeAlpha(0, 0)).toBe(0);
  });
});

describe('captionStackYOffset', () => {
  const sp = 30;

  it('returns 0 when no lines', () => {
    expect(captionStackYOffset(0, 0, sp)).toBe(0);
  });

  it('single line has no offset', () => {
    expect(captionStackYOffset(0, 1, sp)).toBe(0);
  });

  it('stacks oldest (index 0) highest', () => {
    expect(captionStackYOffset(0, 3, sp)).toBe(-60);
    expect(captionStackYOffset(1, 3, sp)).toBe(-30);
    expect(captionStackYOffset(2, 3, sp)).toBe(0);
  });
});
