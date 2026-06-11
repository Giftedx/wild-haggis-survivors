import { describe, it, expect } from 'vitest';
import {
  resolveVariantPanelStroke,
  resolveVariantNameColor,
  resolveVariantTallyColor,
  VARIANT_PANEL_STROKE_UNLOCKED,
  VARIANT_PANEL_STROKE_LOCKED,
  VARIANT_NAME_COLOR_UNLOCKED,
  VARIANT_NAME_COLOR_LOCKED,
  VARIANT_TALLY_COLOR_HAS_WINS,
  VARIANT_TALLY_COLOR_NO_WINS,
} from './variantPanelStyle';

describe('resolveVariantPanelStroke', () => {
  it('unlocked picks the brighter slate', () => {
    expect(resolveVariantPanelStroke(true)).toBe(VARIANT_PANEL_STROKE_UNLOCKED);
  });
  it('locked picks the muted charcoal', () => {
    expect(resolveVariantPanelStroke(false)).toBe(VARIANT_PANEL_STROKE_LOCKED);
  });
  it('unlocked numerically differs from locked', () => {
    expect(VARIANT_PANEL_STROKE_UNLOCKED).not.toBe(VARIANT_PANEL_STROKE_LOCKED);
  });
});

describe('resolveVariantNameColor', () => {
  it('unlocked reads pure white; locked reads dimmer', () => {
    expect(resolveVariantNameColor(true)).toBe(VARIANT_NAME_COLOR_UNLOCKED);
    expect(resolveVariantNameColor(false)).toBe(VARIANT_NAME_COLOR_LOCKED);
    expect(VARIANT_NAME_COLOR_UNLOCKED).toBe('#ffffff');
  });
});

describe('resolveVariantTallyColor', () => {
  it('0 wins returns the quiet slate', () => {
    expect(resolveVariantTallyColor(0)).toBe(VARIANT_TALLY_COLOR_NO_WINS);
  });
  it('1+ wins returns the mint green', () => {
    expect(resolveVariantTallyColor(1)).toBe(VARIANT_TALLY_COLOR_HAS_WINS);
    expect(resolveVariantTallyColor(17)).toBe(VARIANT_TALLY_COLOR_HAS_WINS);
  });
  it('negative wins treated as "no wins" (defensive)', () => {
    expect(resolveVariantTallyColor(-1)).toBe(VARIANT_TALLY_COLOR_NO_WINS);
  });
});
