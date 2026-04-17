import { describe, it, expect } from 'vitest';
import {
  toggleStateDisplay,
  TOGGLE_ON_LABEL_COLOR,
  TOGGLE_OFF_LABEL_COLOR,
} from './settingsToggle';

describe('toggleStateDisplay', () => {
  it('returns the ON palette when isOn = true', () => {
    const s = toggleStateDisplay(true);
    expect(s.color).toBe(TOGGLE_ON_LABEL_COLOR);
    expect(s.text.length).toBeGreaterThan(0);
    // i18n should resolve — key itself must not leak.
    expect(s.text).not.toBe('ui.settings.on');
  });

  it('returns the OFF palette when isOn = false', () => {
    const s = toggleStateDisplay(false);
    expect(s.color).toBe(TOGGLE_OFF_LABEL_COLOR);
    expect(s.text).not.toBe('ui.settings.off');
  });

  it('ON and OFF produce distinct display copy', () => {
    expect(toggleStateDisplay(true).text).not.toBe(toggleStateDisplay(false).text);
  });

  it('ON and OFF palettes differ', () => {
    expect(TOGGLE_ON_LABEL_COLOR).not.toBe(TOGGLE_OFF_LABEL_COLOR);
  });

  it('is deterministic for the same input', () => {
    expect(toggleStateDisplay(true)).toEqual(toggleStateDisplay(true));
    expect(toggleStateDisplay(false)).toEqual(toggleStateDisplay(false));
  });
});
