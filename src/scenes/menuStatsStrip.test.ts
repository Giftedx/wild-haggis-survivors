import { describe, it, expect } from 'vitest';
import { formatMenuStatsStrip, type MenuStatsInput } from './menuStatsStrip';

function base(overrides: Partial<MenuStatsInput> = {}): MenuStatsInput {
  return {
    bestTime: 120,
    bestKills: 50,
    bestCombo: 10,
    totalRuns: 3,
    victories: 1,
    gold: 42,
    viewWidth: 1280,
    ...overrides,
  };
}

describe('formatMenuStatsStrip', () => {
  it('picks the short variant when viewWidth < 1150', () => {
    const narrow = formatMenuStatsStrip(base({ viewWidth: 1149 }));
    const wide = formatMenuStatsStrip(base({ viewWidth: 1150 }));
    // The two i18n keys resolve to different strings — we just need the
    // line to flip at the threshold.
    expect(narrow).not.toBe(wide);
  });

  it('picks the long variant at the exact 1150 threshold', () => {
    const at = formatMenuStatsStrip(base({ viewWidth: 1150 }));
    const above = formatMenuStatsStrip(base({ viewWidth: 1600 }));
    expect(at).toBe(above);
  });

  it('formats bestTime as M:SS with zero-padded seconds', () => {
    const out = formatMenuStatsStrip(base({ bestTime: 65, viewWidth: 1600 }));
    expect(out).toContain('1:05');
  });

  it('handles sub-minute bestTime', () => {
    const out = formatMenuStatsStrip(base({ bestTime: 9, viewWidth: 1600 }));
    expect(out).toContain('0:09');
  });

  it('clamps negative bestTime to 0:00', () => {
    const out = formatMenuStatsStrip(base({ bestTime: -10, viewWidth: 1600 }));
    expect(out).toContain('0:00');
    expect(out).not.toContain('-');
  });

  it('floors fractional bestTime', () => {
    const out = formatMenuStatsStrip(base({ bestTime: 59.9, viewWidth: 1600 }));
    expect(out).toContain('0:59');
  });

  it('surfaces headline counters in the output line', () => {
    const out = formatMenuStatsStrip(base({
      bestKills: 777,
      bestCombo: 123,
      totalRuns: 45,
      victories: 9,
      gold: 2024,
      viewWidth: 1600,
    }));
    // Each counter should appear verbatim in the long variant.
    expect(out).toContain('777');
    expect(out).toContain('123');
    expect(out).toContain('45');
    expect(out).toContain('9');
    expect(out).toContain('2024');
  });
});
