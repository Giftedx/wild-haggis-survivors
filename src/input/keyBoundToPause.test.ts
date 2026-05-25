import { describe, expect, it } from 'vitest';
import { keyCodeBoundToPause } from './keyBoundToPause';

describe('keyCodeBoundToPause', () => {
  it('matches primary and secondary pause slots', () => {
    const pause = { primary: 'Escape', secondary: 'KeyP' };
    expect(keyCodeBoundToPause('Escape', pause)).toBe(true);
    expect(keyCodeBoundToPause('KeyP', pause)).toBe(true);
    expect(keyCodeBoundToPause('KeyQ', pause)).toBe(false);
  });

  it('treats a rebound pause on Q as a conflict for stance', () => {
    const pause = { primary: 'KeyQ' };
    expect(keyCodeBoundToPause('KeyQ', pause)).toBe(true);
  });
});
