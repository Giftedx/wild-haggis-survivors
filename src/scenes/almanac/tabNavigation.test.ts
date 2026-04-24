import { describe, expect, it } from 'vitest';
import {
  ALMANAC_TAB_KEYS,
  DEFAULT_ALMANAC_TAB,
  almanacTabAtIndex,
  almanacTabIndex,
  almanacTabLabelKey,
  cycleAlmanacTab,
} from './tabNavigation';

describe('Almanac tabNavigation', () => {
  it('exposes the four books in spec order', () => {
    expect(ALMANAC_TAB_KEYS).toEqual(['beasties', 'weys', 'finds', 'banter']);
  });

  it('defaults to Beasties — first book opens on scene entry', () => {
    expect(DEFAULT_ALMANAC_TAB).toBe('beasties');
  });

  it('maps each tab key to its i18n label path', () => {
    expect(almanacTabLabelKey('beasties')).toBe('ui.almanac.tab_beasties');
    expect(almanacTabLabelKey('weys')).toBe('ui.almanac.tab_weys');
    expect(almanacTabLabelKey('finds')).toBe('ui.almanac.tab_finds');
    expect(almanacTabLabelKey('banter')).toBe('ui.almanac.tab_banter');
  });

  it('round-trips key ↔ index', () => {
    for (const key of ALMANAC_TAB_KEYS) {
      expect(almanacTabAtIndex(almanacTabIndex(key))).toBe(key);
    }
  });

  it('wraps indices out of range (negative + overflow)', () => {
    expect(almanacTabAtIndex(-1)).toBe('banter');
    expect(almanacTabAtIndex(4)).toBe('beasties');
    expect(almanacTabAtIndex(-5)).toBe('banter');
    expect(almanacTabAtIndex(8)).toBe('beasties');
  });

  it('cycles forward through every tab then wraps to start', () => {
    let tab = DEFAULT_ALMANAC_TAB;
    const visited: string[] = [tab];
    for (let i = 0; i < ALMANAC_TAB_KEYS.length; i++) {
      tab = cycleAlmanacTab(tab, 'next');
      visited.push(tab);
    }
    expect(visited).toEqual(['beasties', 'weys', 'finds', 'banter', 'beasties']);
  });

  it('cycles backward through every tab then wraps past start', () => {
    expect(cycleAlmanacTab('beasties', 'prev')).toBe('banter');
    expect(cycleAlmanacTab('weys', 'prev')).toBe('beasties');
    expect(cycleAlmanacTab('finds', 'prev')).toBe('weys');
    expect(cycleAlmanacTab('banter', 'prev')).toBe('finds');
  });
});
