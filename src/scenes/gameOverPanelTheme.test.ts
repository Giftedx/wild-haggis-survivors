import { describe, it, expect } from 'vitest';
import {
  resolveGameOverPanelTheme,
  pickGameOverTitleKeys,
  GAME_OVER_DEATH_TITLE_KEYS,
  GAME_OVER_DEATH_SUB_KEYS,
  GAME_OVER_VICTORY_TITLE_KEY,
  GAME_OVER_VICTORY_SUB_KEY,
} from './gameOverPanelTheme';
import { COLORS } from '../config';

describe('resolveGameOverPanelTheme', () => {
  it('victory renders in whisky/gold palette', () => {
    const v = resolveGameOverPanelTheme(true);
    expect(v.titleColor).toBe('#d4a017');
    expect(v.panelStroke).toBe(COLORS.WHISKY_GOLD);
  });

  it('death renders in red/maroon palette', () => {
    const d = resolveGameOverPanelTheme(false);
    expect(d.titleColor).toBe('#cc3333');
    expect(d.panelStroke).toBe(0xaa4444);
  });

  it('victory title is larger (celebration) than death', () => {
    const v = resolveGameOverPanelTheme(true);
    const d = resolveGameOverPanelTheme(false);
    // Both return CSS px strings — parse and compare.
    const vPx = parseInt(v.titleFontSize, 10);
    const dPx = parseInt(d.titleFontSize, 10);
    expect(vPx).toBeGreaterThan(dPx);
  });

  it('victory title starts small and grows in (scale < 1)', () => {
    const v = resolveGameOverPanelTheme(true);
    expect(v.titleStartScale).toBeLessThan(1);
  });

  it('death title starts big and settles down (scale > 1)', () => {
    const d = resolveGameOverPanelTheme(false);
    expect(d.titleStartScale).toBeGreaterThan(1);
  });

  it('victory and death return fully distinct themes (no field overlaps)', () => {
    const v = resolveGameOverPanelTheme(true);
    const d = resolveGameOverPanelTheme(false);
    expect(v.titleColor).not.toBe(d.titleColor);
    expect(v.panelStroke).not.toBe(d.panelStroke);
    expect(v.titleFontSize).not.toBe(d.titleFontSize);
    expect(v.titleStartScale).not.toBe(d.titleStartScale);
  });

  it('the same input returns the same output (no random / clock dependency)', () => {
    expect(resolveGameOverPanelTheme(true)).toEqual(resolveGameOverPanelTheme(true));
    expect(resolveGameOverPanelTheme(false)).toEqual(resolveGameOverPanelTheme(false));
  });
});

describe('pickGameOverTitleKeys', () => {
  it('victory always uses the single victory pair', () => {
    for (let t = 0; t < 10; t++) {
      for (let s = 0; s < 10; s++) {
        const out = pickGameOverTitleKeys(true, t, s);
        expect(out.titleKey).toBe(GAME_OVER_VICTORY_TITLE_KEY);
        expect(out.subKey).toBe(GAME_OVER_VICTORY_SUB_KEY);
      }
    }
  });

  it('death maps indices 0..3 directly into the pools', () => {
    for (let i = 0; i < GAME_OVER_DEATH_TITLE_KEYS.length; i++) {
      const out = pickGameOverTitleKeys(false, i, i);
      expect(out.titleKey).toBe(GAME_OVER_DEATH_TITLE_KEYS[i]);
      expect(out.subKey).toBe(GAME_OVER_DEATH_SUB_KEYS[i]);
    }
  });

  it('death title and sub can differ (independent indices)', () => {
    const out = pickGameOverTitleKeys(false, 0, 2);
    expect(out.titleKey).toBe(GAME_OVER_DEATH_TITLE_KEYS[0]);
    expect(out.subKey).toBe(GAME_OVER_DEATH_SUB_KEYS[2]);
  });

  it('wraps out-of-range indices with modulo', () => {
    const len = GAME_OVER_DEATH_TITLE_KEYS.length;
    const out = pickGameOverTitleKeys(false, len + 1, len * 2 + 3);
    expect(out.titleKey).toBe(GAME_OVER_DEATH_TITLE_KEYS[1]);
    expect(out.subKey).toBe(GAME_OVER_DEATH_SUB_KEYS[3]);
  });

  it('handles negative indices (defensive)', () => {
    const out = pickGameOverTitleKeys(false, -1, -4);
    // -1 mod 4 → 3; -4 mod 4 → 0
    expect(out.titleKey).toBe(GAME_OVER_DEATH_TITLE_KEYS[3]);
    expect(out.subKey).toBe(GAME_OVER_DEATH_SUB_KEYS[0]);
  });

  it('floors fractional indices', () => {
    expect(pickGameOverTitleKeys(false, 1.9, 2.1).titleKey)
      .toBe(GAME_OVER_DEATH_TITLE_KEYS[1]);
    expect(pickGameOverTitleKeys(false, 1.9, 2.1).subKey)
      .toBe(GAME_OVER_DEATH_SUB_KEYS[2]);
  });
});
