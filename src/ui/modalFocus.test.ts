import { describe, expect, it } from 'vitest';
import {
  firstEnabledModalFocusIndex,
  moveModalFocusIndex,
} from './modalFocus';

describe('modal focus navigation', () => {
  it('finds the first enabled entry', () => {
    expect(firstEnabledModalFocusIndex([{ disabled: true }, {}, {}])).toBe(1);
    expect(firstEnabledModalFocusIndex([{ disabled: true }])).toBe(-1);
    expect(firstEnabledModalFocusIndex([])).toBe(-1);
  });

  it('wraps through enabled entries and skips disabled entries', () => {
    const entries = [{}, { disabled: true }, {}];
    expect(moveModalFocusIndex(entries, 0, 1)).toBe(2);
    expect(moveModalFocusIndex(entries, 2, 1)).toBe(0);
    expect(moveModalFocusIndex(entries, 0, -1)).toBe(2);
  });

  it('recovers from an invalid current index', () => {
    const entries = [{ disabled: true }, {}, {}];
    expect(moveModalFocusIndex(entries, -1, 1)).toBe(1);
    expect(moveModalFocusIndex(entries, 99, -1)).toBe(1);
  });
});
