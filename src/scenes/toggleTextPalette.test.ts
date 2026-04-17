import { describe, it, expect } from 'vitest';
import {
  resolveToggleTextColor,
  TOGGLE_TEXT_ON_COLOR,
  TOGGLE_TEXT_OFF_COLOR,
} from './toggleTextPalette';

describe('resolveToggleTextColor', () => {
  it('returns the warm green when on', () => {
    expect(resolveToggleTextColor(true)).toBe(TOGGLE_TEXT_ON_COLOR);
    expect(TOGGLE_TEXT_ON_COLOR).toBe('#88cc88');
  });

  it('returns the muted rust when off', () => {
    expect(resolveToggleTextColor(false)).toBe(TOGGLE_TEXT_OFF_COLOR);
    expect(TOGGLE_TEXT_OFF_COLOR).toBe('#886666');
  });

  it('on and off colours differ', () => {
    expect(TOGGLE_TEXT_ON_COLOR).not.toBe(TOGGLE_TEXT_OFF_COLOR);
  });
});
