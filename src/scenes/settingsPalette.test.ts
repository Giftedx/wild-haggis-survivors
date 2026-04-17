import { describe, it, expect } from 'vitest';
import { resolveSettingsPalette, type SettingsPalette } from './settingsPalette';

describe('resolveSettingsPalette — 2-state comfort palette', () => {
  it('default (highContrastUi off) returns warm cozy swatches', () => {
    const p = resolveSettingsPalette(false);
    expect(p.titleColor).toBe('#ffd98a');
    expect(p.sectionColor).toBe('#d8b877');
    expect(p.sectionAccent).toBe(0xd8b877);
    expect(p.dangerAccent).toBe(0xb84a2a);
    expect(p.emberGlow).toBe(0x2a1a0c);
  });

  it('highContrastUi on returns brighter, punchier swatches', () => {
    const p = resolveSettingsPalette(true);
    expect(p.titleColor).toBe('#ffe6a8');
    expect(p.sectionColor).toBe('#ffe066');
    expect(p.sectionAccent).toBe(0xffe066);
    expect(p.dangerAccent).toBe(0xff6a4a);
    expect(p.emberGlow).toBe(0x4a2a12);
  });

  it('every text colour differs between the two states', () => {
    const base = resolveSettingsPalette(false);
    const hc = resolveSettingsPalette(true);
    const keys: (keyof SettingsPalette)[] = [
      'titleColor',
      'subtitleColor',
      'hintColor',
      'labelColor',
      'sectionColor',
      'valueColor',
    ];
    for (const k of keys) {
      expect(base[k]).not.toBe(hc[k]);
    }
  });

  it('sectionColor string matches sectionAccent number (single source of warm accent)', () => {
    const base = resolveSettingsPalette(false);
    expect(parseInt(base.sectionColor.slice(1), 16)).toBe(base.sectionAccent);
    const hc = resolveSettingsPalette(true);
    expect(parseInt(hc.sectionColor.slice(1), 16)).toBe(hc.sectionAccent);
  });

  it('dangerAccent differs from sectionAccent (reds vs warms are distinct)', () => {
    const base = resolveSettingsPalette(false);
    const hc = resolveSettingsPalette(true);
    expect(base.dangerAccent).not.toBe(base.sectionAccent);
    expect(hc.dangerAccent).not.toBe(hc.sectionAccent);
  });
});
