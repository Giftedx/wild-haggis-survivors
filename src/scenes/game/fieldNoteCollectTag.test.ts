import { describe, expect, it } from 'vitest';
import { FOUNDATION_THRESHOLDS } from '../almanac/buildFindsEntries';
import { pickFieldNoteCollectTag } from './fieldNoteCollectTag';

describe('pickFieldNoteCollectTag', () => {
  it('pre-bump 0 → first (the discovery beat owns threshold 1 too)', () => {
    expect(pickFieldNoteCollectTag(0)).toBe('first');
  });

  it('collect that crosses a Foundation threshold → page', () => {
    // Pre-bump 2 means this collect lands the count on 3 — the second
    // field-guide page unlocks in the Almanac.
    expect(pickFieldNoteCollectTag(2)).toBe('page');
    expect(pickFieldNoteCollectTag(6)).toBe('page'); // → 7
    expect(pickFieldNoteCollectTag(164)).toBe('page'); // → 165, last page
  });

  it('ordinary mid-gap collect → undefined (flat pool fallback)', () => {
    expect(pickFieldNoteCollectTag(1)).toBeUndefined(); // → 2, no page
    expect(pickFieldNoteCollectTag(3)).toBeUndefined(); // → 4, no page
    expect(pickFieldNoteCollectTag(200)).toBeUndefined(); // past the book
  });

  it('storage-failure sentinel never trips either gate', () => {
    expect(pickFieldNoteCollectTag(Number.MAX_SAFE_INTEGER)).toBeUndefined();
  });

  it('every Almanac threshold beyond the first maps to a page beat', () => {
    // Guards the export coupling: if the Almanac grows a 15th page, the
    // collect-time beat follows automatically — no second list to sync.
    for (const threshold of FOUNDATION_THRESHOLDS) {
      const tag = pickFieldNoteCollectTag(threshold - 1);
      expect(tag).toBe(threshold === 1 ? 'first' : 'page');
    }
  });
});
