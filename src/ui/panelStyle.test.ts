import { describe, it, expect } from 'vitest';
import { PANEL_STROKE } from './panelStyle';

describe('PANEL_STROKE', () => {
  it('defines standard and accent presets', () => {
    expect(PANEL_STROKE.standard).toEqual({ width: 2, color: 0x2a3450, alpha: 0.8 });
    expect(PANEL_STROKE.accent).toEqual({ width: 2, color: 0xd4a017, alpha: 0.6 });
  });
});
