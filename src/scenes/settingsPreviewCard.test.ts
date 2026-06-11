import { describe, expect, it } from 'vitest';
import { describeSettingsPreview } from './settingsPreviewCard';

const base = {
  uiScale: 1,
  damageNumbers: true,
  highContrastUi: false,
  screenShake: true,
};

describe('describeSettingsPreview', () => {
  it('damage number visible iff damageNumbers is true', () => {
    expect(describeSettingsPreview({ ...base, damageNumbers: true }).damage.visible).toBe(true);
    expect(describeSettingsPreview({ ...base, damageNumbers: false }).damage.visible).toBe(false);
  });

  it('shake indicator visible iff screenShake is true', () => {
    expect(describeSettingsPreview({ ...base, screenShake: true }).shakeIndicator.visible).toBe(true);
    expect(describeSettingsPreview({ ...base, screenShake: false }).shakeIndicator.visible).toBe(false);
  });

  it('label font size scales linearly with uiScale', () => {
    const a = describeSettingsPreview({ ...base, uiScale: 1.0 }).label.fontSize;
    const b = describeSettingsPreview({ ...base, uiScale: 1.4 }).label.fontSize;
    expect(b).toBeGreaterThan(a);
    expect(b).toBe(Math.round(14 * 1.4));
  });

  it('damage font size scales linearly with uiScale', () => {
    expect(describeSettingsPreview({ ...base, uiScale: 0.8 }).damage.fontSize).toBe(Math.round(16 * 0.8));
    expect(describeSettingsPreview({ ...base, uiScale: 1.2 }).damage.fontSize).toBe(Math.round(16 * 1.2));
  });

  it('high-contrast panel swaps palette + bumps stroke', () => {
    const lo = describeSettingsPreview({ ...base, highContrastUi: false });
    const hi = describeSettingsPreview({ ...base, highContrastUi: true });
    expect(hi.panel.strokeWidth).toBe(2);
    expect(lo.panel.strokeWidth).toBe(1);
    expect(hi.panel.strokeColor).not.toBe(lo.panel.strokeColor);
    expect(hi.label.color).not.toBe(lo.label.color);
  });

  it('damage visibility is independent of high-contrast', () => {
    const combos = [
      { hc: true, dn: true, expect: true },
      { hc: true, dn: false, expect: false },
      { hc: false, dn: true, expect: true },
      { hc: false, dn: false, expect: false },
    ];
    for (const c of combos) {
      expect(
        describeSettingsPreview({ ...base, damageNumbers: c.dn, highContrastUi: c.hc }).damage.visible,
        `hc=${c.hc} dn=${c.dn}`,
      ).toBe(c.expect);
    }
  });
});
