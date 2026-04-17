import { describe, it, expect } from 'vitest';
import {
  resolveLoadoutBadgeStyle,
  formatVariantRequirementLine,
  VARIANT_REQUIREMENT_COLOR_READY,
  VARIANT_REQUIREMENT_COLOR_LOCKED,
} from './loadoutBadge';
import { COLORS } from '../config';
import type { VariantUnlockProgress } from '../data/variants';

describe('resolveLoadoutBadgeStyle — 3 mutually-exclusive states', () => {
  it('selected (any unlocked flag) renders in green with "current" status', () => {
    // selected is always unlocked at the scene layer, but both combos should
    // produce the selected palette — selected wins over unlocked.
    const s1 = resolveLoadoutBadgeStyle(true, true);
    const s2 = resolveLoadoutBadgeStyle(true, false);
    expect(s1.fillColor).toBe(0x2c7d45);
    expect(s2.fillColor).toBe(0x2c7d45);
    expect(s1.labelText).not.toBe('ui.loadout.selected');
    expect(s1.statusText).not.toBe('ui.loadout.status_current');
    expect(s1.labelColor).toBe('#ffffff');
  });

  it('unlocked + not selected renders in the Scottish blue', () => {
    const s = resolveLoadoutBadgeStyle(false, true);
    expect(s.fillColor).toBe(COLORS.SCOTTISH_BLUE);
    expect(s.labelColor).toBe('#ffffff');
    expect(s.labelText).not.toBe('ui.loadout.select');
  });

  it('locked renders in slate with muted label text', () => {
    const s = resolveLoadoutBadgeStyle(false, false);
    expect(s.fillColor).toBe(0x3a3f4d);
    expect(s.labelColor).toBe('#a4a9b4'); // dimmer than the white active colour
    expect(s.labelText).not.toBe('ui.loadout.locked');
  });

  it('every state produces non-empty label + status text', () => {
    const states: Array<[boolean, boolean]> = [[true, true], [false, true], [false, false]];
    for (const [sel, unl] of states) {
      const s = resolveLoadoutBadgeStyle(sel, unl);
      expect(s.labelText.length).toBeGreaterThan(0);
      expect(s.statusText.length).toBeGreaterThan(0);
    }
  });

  it('locked stroke is darker than unlocked/selected stroke (visible ring)', () => {
    const unlocked = resolveLoadoutBadgeStyle(false, true);
    const locked = resolveLoadoutBadgeStyle(false, false);
    expect(unlocked.strokeColor).toBe(0x8bb4ff);
    expect(locked.strokeColor).toBe(0x5a6070);
    // Simple lightness-ish proxy — the unlocked stroke integer is numerically
    // larger because its red channel is >= 0x8b.
    expect(unlocked.strokeColor).toBeGreaterThan(locked.strokeColor);
  });

  it('each state uses a distinct fill colour', () => {
    const s = new Set([
      resolveLoadoutBadgeStyle(true, true).fillColor,
      resolveLoadoutBadgeStyle(false, true).fillColor,
      resolveLoadoutBadgeStyle(false, false).fillColor,
    ]);
    expect(s.size).toBe(3);
  });
});

describe('formatVariantRequirementLine', () => {
  const progress: VariantUnlockProgress = {
    label: 'Survive 5 minutes',
    current: 2,
    required: 5,
    currentText: '2',
    requiredText: '5',
    ratio: 0.4,
  };

  it('unlocked returns the green "ready" line', () => {
    const out = formatVariantRequirementLine(true, progress);
    expect(out.color).toBe(VARIANT_REQUIREMENT_COLOR_READY);
    expect(out.text).not.toBe('ui.loadout.requirement_ready');
  });

  it('locked with progress returns the amber "X/Y" line', () => {
    const out = formatVariantRequirementLine(false, progress);
    expect(out.color).toBe(VARIANT_REQUIREMENT_COLOR_LOCKED);
    expect(out.text).toContain('2');
    expect(out.text).toContain('5');
    expect(out.text).toContain('Survive 5 minutes');
  });

  it('locked with null progress falls back to the "requirement_locked" label', () => {
    const out = formatVariantRequirementLine(false, null);
    expect(out.color).toBe(VARIANT_REQUIREMENT_COLOR_LOCKED);
    // Scene feeds i18n-resolved strings; here we assert defaults ("0" / "0") are used.
    expect(out.text).toContain('0');
  });

  it('ready + locked colours differ', () => {
    expect(VARIANT_REQUIREMENT_COLOR_READY).not.toBe(VARIANT_REQUIREMENT_COLOR_LOCKED);
  });
});
