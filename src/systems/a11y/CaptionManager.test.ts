import { describe, it, expect } from 'vitest';
import { CaptionManager } from './CaptionManager';

describe('CaptionManager', () => {
  it('starts empty', () => {
    const m = new CaptionManager();
    expect(m.getActive()).toEqual([]);
  });

  it('enqueues captions up to the max', () => {
    const m = new CaptionManager({ maxActive: 2 });
    m.enqueue('a', 'one', 1000);
    m.enqueue('b', 'two', 1000);
    m.enqueue('c', 'three', 1000);
    const active = m.getActive();
    expect(active.length).toBe(2);
    expect(active.map((c) => c.id)).toContain('c');
  });

  it('evicts the nearest-to-fade caption when full', () => {
    const m = new CaptionManager({ maxActive: 2 });
    m.enqueue('a', 'one', 2000);
    m.enqueue('b', 'two', 500);
    m.enqueue('c', 'three', 1500);
    // 'b' was closest to fading — evicted.
    expect(m.getActive().map((c) => c.id).sort()).toEqual(['a', 'c']);
  });

  it('deduplicates rapid repeats of same id by refreshing timer', () => {
    const m = new CaptionManager({ dedupeWindowMs: 1000 });
    m.enqueue('combo', 'x10', 1500);
    m.update(200); // elapsed = 200, within 1000ms window
    m.enqueue('combo', 'x10 again', 2000);
    const active = m.getActive();
    expect(active.length).toBe(1);
    expect(active[0].remainingMs).toBe(2000);
    // First enqueue wins the message — rapid repeats shouldn't flicker text.
    expect(active[0].message).toBe('x10');
  });

  it('allows a new caption after dedupe window expires', () => {
    const m = new CaptionManager({ dedupeWindowMs: 500, maxActive: 5 });
    m.enqueue('boss', 'Gordon', 1000);
    m.update(600); // past dedupe window
    m.enqueue('boss', 'Gordon enraged', 1000);
    const active = m.getActive();
    // The existing 'boss' is still visible (remaining 400) and the new one
    // replaces it via id match... actually dedupe window is about "refresh"
    // not "block". After the window, subsequent enqueues on the same id
    // should refresh too, not stack a second 'boss'. This is the policy
    // the manager guarantees.
    expect(active.length).toBe(1);
  });

  it('update removes captions whose time has elapsed', () => {
    const m = new CaptionManager();
    m.enqueue('a', 'msg', 500);
    m.update(300);
    expect(m.getActive().length).toBe(1);
    m.update(300);
    expect(m.getActive().length).toBe(0);
  });

  it('clear removes all captions', () => {
    const m = new CaptionManager();
    m.enqueue('a', 'one', 1000);
    m.enqueue('b', 'two', 1000);
    m.clear();
    expect(m.getActive()).toEqual([]);
  });

  it('rejects durationMs <= 0 (no-op)', () => {
    const m = new CaptionManager();
    m.enqueue('a', 'msg', 0);
    m.enqueue('b', 'msg', -100);
    expect(m.getActive()).toEqual([]);
  });

  it('suggestedDurationMs scales with length and caps at 6s', () => {
    expect(CaptionManager.suggestedDurationMs('short')).toBe(2500 + 5 * 40);
    const huge = 'x'.repeat(500);
    expect(CaptionManager.suggestedDurationMs(huge)).toBe(6000);
  });
});
