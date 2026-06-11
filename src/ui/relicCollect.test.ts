import { describe, expect, it } from 'vitest';
import { decideRelicCollect, resolveRelicDiscard } from './relicCollect';

describe('decideRelicCollect', () => {
  it('adds when held < cap and not duplicate', () => {
    expect(decideRelicCollect({ heldCount: 0, isDuplicate: false, slotCap: 3 })).toBe('add');
    expect(decideRelicCollect({ heldCount: 1, isDuplicate: false, slotCap: 3 })).toBe('add');
    expect(decideRelicCollect({ heldCount: 2, isDuplicate: false, slotCap: 3 })).toBe('add');
  });

  it('opens discard UI when slots are full (4th offered)', () => {
    expect(decideRelicCollect({ heldCount: 3, isDuplicate: false, slotCap: 3 })).toBe('discard_ui');
  });

  it('skips when duplicate, regardless of slot count', () => {
    expect(decideRelicCollect({ heldCount: 0, isDuplicate: true, slotCap: 3 })).toBe('skip_duplicate');
    expect(decideRelicCollect({ heldCount: 3, isDuplicate: true, slotCap: 3 })).toBe('skip_duplicate');
  });

  it('respects custom slotCap (hypothetical Phase 2 +slots variant)', () => {
    expect(decideRelicCollect({ heldCount: 3, isDuplicate: false, slotCap: 4 })).toBe('add');
    expect(decideRelicCollect({ heldCount: 4, isDuplicate: false, slotCap: 4 })).toBe('discard_ui');
  });
});

describe('resolveRelicDiscard', () => {
  it('replace_held returns the target slot index', () => {
    expect(resolveRelicDiscard({ kind: 'replace_held', slotIndex: 0 })).toEqual({ replaceIndex: 0 });
    expect(resolveRelicDiscard({ kind: 'replace_held', slotIndex: 1 })).toEqual({ replaceIndex: 1 });
    expect(resolveRelicDiscard({ kind: 'replace_held', slotIndex: 2 })).toEqual({ replaceIndex: 2 });
  });

  it('reject_incoming returns a null replace index', () => {
    expect(resolveRelicDiscard({ kind: 'reject_incoming' })).toEqual({ replaceIndex: null });
  });
});
