import { describe, it, expect } from 'vitest';
import {
  resolveComboDisplay,
  COMBO_VISIBLE_THRESHOLD,
  COMBO_AMBER_TIER,
  COMBO_FIRE_TIER,
  COMBO_COLOR_FIRE,
  COMBO_COLOR_AMBER,
  COMBO_COLOR_ORANGE,
  COMBO_COLOR_HIDDEN,
} from './comboDisplay';

describe('resolveComboDisplay — visibility gate', () => {
  it('is hidden when comboCount < threshold', () => {
    const s = resolveComboDisplay(COMBO_VISIBLE_THRESHOLD - 1, 1000);
    expect(s.visible).toBe(false);
    expect(s.color).toBe(COMBO_COLOR_HIDDEN);
    expect(s.text).toBe('');
  });

  it('is hidden when comboTimer has expired (<= 0)', () => {
    const s = resolveComboDisplay(20, 0);
    expect(s.visible).toBe(false);
    const neg = resolveComboDisplay(20, -5);
    expect(neg.visible).toBe(false);
  });

  it('becomes visible at the exact threshold with a live timer', () => {
    const s = resolveComboDisplay(COMBO_VISIBLE_THRESHOLD, 1);
    expect(s.visible).toBe(true);
    expect(s.text.length).toBeGreaterThan(0);
  });
});

describe('resolveComboDisplay — colour tiers', () => {
  it('orange below the amber tier', () => {
    expect(resolveComboDisplay(COMBO_AMBER_TIER - 1, 500).color).toBe(COMBO_COLOR_ORANGE);
  });

  it('amber at and above the amber tier (but below fire)', () => {
    expect(resolveComboDisplay(COMBO_AMBER_TIER, 500).color).toBe(COMBO_COLOR_AMBER);
    expect(resolveComboDisplay(COMBO_FIRE_TIER - 1, 500).color).toBe(COMBO_COLOR_AMBER);
  });

  it('fire-gold at and above the fire tier', () => {
    expect(resolveComboDisplay(COMBO_FIRE_TIER, 500).color).toBe(COMBO_COLOR_FIRE);
    expect(resolveComboDisplay(COMBO_FIRE_TIER + 50, 500).color).toBe(COMBO_COLOR_FIRE);
  });

  it('thresholds form a strict ascending chain', () => {
    expect(COMBO_VISIBLE_THRESHOLD).toBeLessThan(COMBO_AMBER_TIER);
    expect(COMBO_AMBER_TIER).toBeLessThan(COMBO_FIRE_TIER);
  });

  it('all three tier colours are distinct', () => {
    const s = new Set([COMBO_COLOR_FIRE, COMBO_COLOR_AMBER, COMBO_COLOR_ORANGE]);
    expect(s.size).toBe(3);
  });
});

describe('resolveComboDisplay — scale tiers', () => {
  it('scale is 1.0 below amber tier', () => {
    const s = resolveComboDisplay(COMBO_VISIBLE_THRESHOLD, 500);
    expect(s.scale).toBe(1.0);
    const s2 = resolveComboDisplay(COMBO_AMBER_TIER - 1, 500);
    expect(s2.scale).toBe(1.0);
  });

  it('scale is 1.15 at amber tier', () => {
    expect(resolveComboDisplay(COMBO_AMBER_TIER, 500).scale).toBe(1.15);
    expect(resolveComboDisplay(COMBO_FIRE_TIER - 1, 500).scale).toBe(1.15);
  });

  it('scale is 1.3 at fire tier (50+)', () => {
    expect(resolveComboDisplay(COMBO_FIRE_TIER, 500).scale).toBe(1.3);
    expect(resolveComboDisplay(COMBO_FIRE_TIER + 100, 500).scale).toBe(1.3);
  });

  it('hidden state has scale 1.0', () => {
    expect(resolveComboDisplay(COMBO_VISIBLE_THRESHOLD - 1, 1000).scale).toBe(1.0);
    expect(resolveComboDisplay(20, 0).scale).toBe(1.0);
  });
});

describe('resolveComboDisplay — text payload', () => {
  it('visible text contains the combo count', () => {
    const s = resolveComboDisplay(15, 500);
    expect(s.text).toContain('15');
  });

  it('low-combo hides the +% bonus line (comboDamageBonusPct = 0)', () => {
    // comboDamageBonusPct returns 0 for count < COMBO_TIER_SIZE (10).
    const s = resolveComboDisplay(5, 500);
    // Text must exist but should not contain a "+" sign from the bonus line.
    expect(s.text).not.toContain('+5%');
  });

  it('surfaces the +% bonus line when comboDamageBonusPct > 0', () => {
    // At combo 10 → 1 tier × 5% = 5%.
    const s = resolveComboDisplay(10, 500);
    expect(s.text).toContain('5');
  });
});
