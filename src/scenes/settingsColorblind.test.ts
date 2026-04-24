import { describe, it, expect } from 'vitest';
import { cycleColorblindMode, COLORBLIND_MODE_ORDER, labelForColorblindMode } from './settingsColorblind';

describe('settingsColorblind', () => {
  it('cycle steps through every mode in order + wraps', () => {
    let mode = COLORBLIND_MODE_ORDER[0];
    for (let i = 1; i < COLORBLIND_MODE_ORDER.length; i++) {
      mode = cycleColorblindMode(mode);
      expect(mode).toBe(COLORBLIND_MODE_ORDER[i]);
    }
    // Wrap back to 'off'.
    mode = cycleColorblindMode(mode);
    expect(mode).toBe('off');
  });

  it('labelForColorblindMode resolves every enum value to non-empty copy', () => {
    for (const mode of COLORBLIND_MODE_ORDER) {
      const label = labelForColorblindMode(mode);
      expect(label.length, mode).toBeGreaterThan(0);
      expect(label.startsWith('ui.settings.'), `${mode} is unresolved`).toBe(false);
    }
  });
});
