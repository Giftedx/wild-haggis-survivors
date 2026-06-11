import { describe, expect, it } from 'vitest';
import { applyCullodenMemorial } from './cullodenMemorial';
import type { RunModifiers } from '../core/RunModifiers';

const modifiers = {} as RunModifiers;

describe('applyCullodenMemorial', () => {
  it('fires when the active event is culloden', () => {
    const result = applyCullodenMemorial('culloden', modifiers);
    expect(result.applied).toBe(true);
  });

  it('grants no HP heal — memorial only, no gameplay buff', () => {
    const result = applyCullodenMemorial('culloden', modifiers);
    expect(result.extraStartingHpHeal).toBe(0);
  });

  it('does not fire for other seasonal events', () => {
    for (const key of ['hogmanay', 'burns_night', 'beltane', 'samhain', 'bannockburn']) {
      expect(applyCullodenMemorial(key, modifiers).applied).toBe(false);
    }
  });

  it('does not fire when there is no seasonal event (null)', () => {
    expect(applyCullodenMemorial(null, modifiers).applied).toBe(false);
  });

  it('always returns zero HP heal regardless of event', () => {
    expect(applyCullodenMemorial('culloden', modifiers).extraStartingHpHeal).toBe(0);
    expect(applyCullodenMemorial(null, modifiers).extraStartingHpHeal).toBe(0);
  });
});
