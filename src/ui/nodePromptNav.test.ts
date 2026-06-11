import { describe, expect, it } from 'vitest';
import { firstEnabledPromptEntryIndex, movePromptFocusIndex } from './nodePromptNav';

describe('node prompt navigation', () => {
  it('finds the first enabled entry', () => {
    expect(firstEnabledPromptEntryIndex([{ disabled: true }, {}, {}])).toBe(1);
    expect(firstEnabledPromptEntryIndex([{ disabled: true }])).toBe(-1);
  });

  it('wraps through enabled entries', () => {
    const entries = [{}, { disabled: true }, {}];
    expect(movePromptFocusIndex(entries, 0, 1)).toBe(2);
    expect(movePromptFocusIndex(entries, 2, 1)).toBe(0);
    expect(movePromptFocusIndex(entries, 0, -1)).toBe(2);
  });

  it('recovers from an invalid current index', () => {
    const entries = [{ disabled: true }, {}, {}];
    expect(movePromptFocusIndex(entries, -1, 1)).toBe(1);
    expect(movePromptFocusIndex(entries, 99, -1)).toBe(1);
  });
});
