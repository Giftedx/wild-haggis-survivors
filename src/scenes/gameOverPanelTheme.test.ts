import { describe, it, expect } from 'vitest';
import { resolveGameOverPanelTheme } from './gameOverPanelTheme';
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
