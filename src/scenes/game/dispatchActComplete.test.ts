import { describe, expect, it } from 'vitest';
import { dispatchActComplete } from './dispatchActComplete';

describe('dispatchActComplete', () => {
  it('returns 1 for gordon', () => {
    expect(dispatchActComplete('gordon')).toEqual({ actToComplete: 1 });
  });

  it('returns 2 for tour_bus', () => {
    expect(dispatchActComplete('tour_bus')).toEqual({ actToComplete: 2 });
  });

  it('returns null for the_laird (mid-act-3 boss, no picker)', () => {
    expect(dispatchActComplete('the_laird')).toEqual({ actToComplete: null });
  });

  it('returns null for hunter_general (mid-act-3 boss, no picker)', () => {
    expect(dispatchActComplete('hunter_general')).toEqual({ actToComplete: null });
  });

  it('returns null for taxman (victory path — handled separately, not via this dispatch)', () => {
    expect(dispatchActComplete('taxman')).toEqual({ actToComplete: null });
  });

  it('returns null for unknown boss keys', () => {
    expect(dispatchActComplete('mystery_boss')).toEqual({ actToComplete: null });
  });

  it('returns null for non-boss enemy keys', () => {
    expect(dispatchActComplete('tourist')).toEqual({ actToComplete: null });
  });
});
