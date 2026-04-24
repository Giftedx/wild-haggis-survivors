import { describe, expect, it } from 'vitest';
import { createExpandState, toggleExpanded, type ExpandState } from './expandState';
import type { AlmanacTabKey } from './tabNavigation';
import {
  resolveAlmanacEnterToggle,
  resolveAlmanacEsc,
} from './keyboardNav';

function buildExpandStates(
  overrides: Partial<Record<AlmanacTabKey, ExpandState>> = {},
): Record<AlmanacTabKey, ExpandState> {
  return {
    beasties: createExpandState(),
    weys: createExpandState(),
    finds: createExpandState(),
    banter: createExpandState(),
    ...overrides,
  };
}

describe('resolveAlmanacEsc', () => {
  it('exits the scene when no entry is expanded on the active tab', () => {
    expect(resolveAlmanacEsc('beasties', buildExpandStates())).toBe('exit-scene');
  });

  it('closes the expansion when the active tab has an entry open', () => {
    const states = buildExpandStates({
      beasties: toggleExpanded(createExpandState(), 'tourist'),
    });
    expect(resolveAlmanacEsc('beasties', states)).toBe('close-expanded');
  });

  it('ignores expansions on other tabs — only the active tab decides', () => {
    const states = buildExpandStates({
      weys: toggleExpanded(createExpandState(), 'glen'),
    });
    expect(resolveAlmanacEsc('beasties', states)).toBe('exit-scene');
  });
});

describe('resolveAlmanacEnterToggle', () => {
  it('is a no-op when the book is empty and nothing is expanded', () => {
    expect(resolveAlmanacEnterToggle(null, createExpandState())).toEqual({
      action: 'none',
      key: null,
    });
  });

  it('expands the first entry when nothing is expanded', () => {
    expect(resolveAlmanacEnterToggle('tourist', createExpandState())).toEqual({
      action: 'expand',
      key: 'tourist',
    });
  });

  it('collapses the currently expanded entry regardless of the first-entry key', () => {
    const expanded = toggleExpanded(createExpandState(), 'chef');
    expect(resolveAlmanacEnterToggle('tourist', expanded)).toEqual({
      action: 'collapse',
      key: 'chef',
    });
  });

  it('collapses cleanly even when the first-entry key is null', () => {
    const expanded = toggleExpanded(createExpandState(), 'chef');
    expect(resolveAlmanacEnterToggle(null, expanded)).toEqual({
      action: 'collapse',
      key: 'chef',
    });
  });
});
