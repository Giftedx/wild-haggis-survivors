import { describe, expect, it } from 'vitest';
import { createExpandState, isExpanded, toggleExpanded, closeExpanded } from './expandState';

describe('Almanac expandState', () => {
  it('starts with nothing expanded', () => {
    const state = createExpandState();
    expect(state.expandedKey).toBeNull();
    expect(isExpanded(state, 'tourist')).toBe(false);
  });

  it('toggling a fresh key opens it', () => {
    const state = toggleExpanded(createExpandState(), 'tourist');
    expect(state.expandedKey).toBe('tourist');
    expect(isExpanded(state, 'tourist')).toBe(true);
    expect(isExpanded(state, 'chef')).toBe(false);
  });

  it('toggling the same key closes it', () => {
    const opened = toggleExpanded(createExpandState(), 'tourist');
    const closed = toggleExpanded(opened, 'tourist');
    expect(closed.expandedKey).toBeNull();
  });

  it('toggling a different key swaps which entry is open', () => {
    const a = toggleExpanded(createExpandState(), 'tourist');
    const b = toggleExpanded(a, 'gordon');
    expect(b.expandedKey).toBe('gordon');
    expect(isExpanded(b, 'tourist')).toBe(false);
  });

  it('closeExpanded is idempotent + always returns a closed state', () => {
    expect(closeExpanded(createExpandState()).expandedKey).toBeNull();
    expect(closeExpanded(toggleExpanded(createExpandState(), 'x')).expandedKey).toBeNull();
  });

  it('toggling never mutates the input state — each call returns a fresh object', () => {
    const a = createExpandState();
    const b = toggleExpanded(a, 'tourist');
    expect(a.expandedKey).toBeNull();
    expect(b).not.toBe(a);
  });
});
