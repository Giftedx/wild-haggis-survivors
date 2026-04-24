import { describe, expect, it } from 'vitest';
import { dispatchStretchComplete } from './dispatchStretchComplete';
import { BOSSES } from '../../data/enemies';

describe('dispatchStretchComplete', () => {
  it('returns 2 for the_laird (advance pre-Laird → post-Laird)', () => {
    expect(dispatchStretchComplete('the_laird')).toEqual({ stretchToLoad: 2 });
  });

  it('returns 3 for hunter_general (advance post-Laird → post-Hunter)', () => {
    expect(dispatchStretchComplete('hunter_general')).toEqual({ stretchToLoad: 3 });
  });

  it('returns null for gordon (act-gating boss, not stretch-gating)', () => {
    expect(dispatchStretchComplete('gordon')).toEqual({ stretchToLoad: null });
  });

  it('returns null for tour_bus (act-gating boss, not stretch-gating)', () => {
    expect(dispatchStretchComplete('tour_bus')).toEqual({ stretchToLoad: null });
  });

  it('returns null for taxman (victory path — no stretch advance)', () => {
    expect(dispatchStretchComplete('taxman')).toEqual({ stretchToLoad: null });
  });

  it('returns null for unknown boss keys', () => {
    expect(dispatchStretchComplete('mystery_boss')).toEqual({ stretchToLoad: null });
  });

  it('returns null for non-boss enemy keys', () => {
    expect(dispatchStretchComplete('tourist')).toEqual({ stretchToLoad: null });
  });

  /**
   * Guards against a renamed / removed Act 3 boss silently breaking the
   * stretch switch: both stretch-gating keys must still appear in
   * BOSSES. If a future refactor renames `the_laird` to `the_lord`,
   * this assertion catches it before a real run silently skips the
   * stretch 2 bank.
   */
  it('stretch-gating boss keys exist in BOSSES definitions', () => {
    const bossKeys = new Set(BOSSES.map((b) => b.key));
    expect(bossKeys.has('the_laird'), 'the_laird missing from BOSSES').toBe(true);
    expect(bossKeys.has('hunter_general'), 'hunter_general missing from BOSSES').toBe(true);
  });
});
