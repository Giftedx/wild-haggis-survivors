import { describe, expect, it } from 'vitest';
import { stepGamepadMenuIndex } from './GamepadMenuNav';

describe('stepGamepadMenuIndex', () => {
  it('returns 0 when length is 0', () => {
    expect(stepGamepadMenuIndex(3, 0, 1)).toBe(0);
    expect(stepGamepadMenuIndex(3, 0, -1)).toBe(0);
  });

  it('wraps down from last to first', () => {
    expect(stepGamepadMenuIndex(2, 3, 1)).toBe(0);
  });

  it('wraps up from first to last', () => {
    expect(stepGamepadMenuIndex(0, 3, -1)).toBe(2);
  });

  it('steps within range', () => {
    expect(stepGamepadMenuIndex(1, 4, 1)).toBe(2);
    expect(stepGamepadMenuIndex(1, 4, -1)).toBe(0);
  });

  it('single entry is stable', () => {
    expect(stepGamepadMenuIndex(0, 1, 1)).toBe(0);
    expect(stepGamepadMenuIndex(0, 1, -1)).toBe(0);
  });
});
