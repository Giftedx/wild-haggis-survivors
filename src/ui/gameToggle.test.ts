import { describe, it, expect } from 'vitest';
import { resolveToggleVisual } from './gameToggle';

describe('resolveToggleVisual', () => {
  it('returns ON colors when value is true', () => {
    const v = resolveToggleVisual(true);
    expect(v.thumbX).toBeGreaterThan(0);
    expect(v.trackColor).not.toBe(v.trackColorOff);
  });

  it('returns OFF state when value is false', () => {
    const v = resolveToggleVisual(false);
    expect(v.thumbX).toBeLessThan(0);
    expect(v.trackColor).toBe(v.trackColorOff);
  });
});
