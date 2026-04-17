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

describe('resolveToggleTrackStyle', () => {
  it('on returns the green track palette', async () => {
    const { resolveToggleTrackStyle, TOGGLE_TRACK_ON } = await import('./settingsToggle');
    expect(resolveToggleTrackStyle(true)).toBe(TOGGLE_TRACK_ON);
  });

  it('off returns the lilac track palette', async () => {
    const { resolveToggleTrackStyle, TOGGLE_TRACK_OFF } = await import('./settingsToggle');
    expect(resolveToggleTrackStyle(false)).toBe(TOGGLE_TRACK_OFF);
  });

  it('every field differs between on and off', async () => {
    const { TOGGLE_TRACK_ON, TOGGLE_TRACK_OFF } = await import('./settingsToggle');
    expect(TOGGLE_TRACK_ON.trackFill).not.toBe(TOGGLE_TRACK_OFF.trackFill);
    expect(TOGGLE_TRACK_ON.trackBorder).not.toBe(TOGGLE_TRACK_OFF.trackBorder);
    expect(TOGGLE_TRACK_ON.thumbFill).not.toBe(TOGGLE_TRACK_OFF.thumbFill);
  });
});
