import { describe, it, expect, beforeEach } from 'vitest';
import {
  scaledFontSize,
  scaledStrokeThickness,
  scaledBackdropAlpha,
  contrastColor,
} from './a11yText';
import {
  getSettingsManager,
  resetSettingsManagerSingletonForTests,
} from '../core/SettingsManager';

describe('a11yText helpers', () => {
  beforeEach(() => {
    resetSettingsManagerSingletonForTests();
  });

  it('scaledFontSize applies uiScale and floors at 8px', () => {
    const sm = getSettingsManager();
    sm.update((cur) => ({ ...cur, uiScale: 1.2 }));
    expect(scaledFontSize(16)).toBe('19px');
    sm.update((cur) => ({ ...cur, uiScale: 0.8 }));
    expect(scaledFontSize(16)).toBe('13px');
    sm.update((cur) => ({ ...cur, uiScale: 0.5 }));
    // 5 * 1 = 5, floor to 8.
    expect(scaledFontSize(5)).toBe('8px');
  });

  it('scaledStrokeThickness doubles and caps at 6 when high contrast', () => {
    const sm = getSettingsManager();
    sm.update((cur) => ({ ...cur, uiScale: 1, highContrastUi: true }));
    expect(scaledStrokeThickness(3)).toBe(6);
    expect(scaledStrokeThickness(1)).toBe(2);
    sm.update((cur) => ({ ...cur, uiScale: 1, highContrastUi: false }));
    expect(scaledStrokeThickness(3)).toBe(3);
  });

  it('scaledStrokeThickness also scales with uiScale', () => {
    const sm = getSettingsManager();
    sm.update((cur) => ({ ...cur, uiScale: 1.4, highContrastUi: false }));
    expect(scaledStrokeThickness(2)).toBe(3);
  });

  it('scaledBackdropAlpha lifts alpha when high contrast, caps at 0.95', () => {
    const sm = getSettingsManager();
    sm.update((cur) => ({ ...cur, highContrastUi: true }));
    expect(scaledBackdropAlpha(0.6)).toBeCloseTo(0.85, 5);
    expect(scaledBackdropAlpha(0.9)).toBe(0.95);
    sm.update((cur) => ({ ...cur, highContrastUi: false }));
    expect(scaledBackdropAlpha(0.6)).toBe(0.6);
  });

  it('contrastColor returns override only when high contrast is on', () => {
    const sm = getSettingsManager();
    sm.update((cur) => ({ ...cur, highContrastUi: false }));
    expect(contrastColor('#888', '#fff')).toBe('#888');
    sm.update((cur) => ({ ...cur, highContrastUi: true }));
    expect(contrastColor('#888', '#fff')).toBe('#fff');
    // No override → default always.
    expect(contrastColor('#888')).toBe('#888');
  });
});
