import { describe, expect, it } from 'vitest';
import {
  CEILIDH_MAGNET_DURATION_MS,
  CEILIDH_MAGNET_FLAT_PX,
  CEILIDH_PULSE_PERIOD,
  isCeilidhPulseMoment,
} from './ceilidhChain';
import { t } from '../core/i18n';

describe('isCeilidhPulseMoment', () => {
  it('returns true at the first pulse (combo === PERIOD)', () => {
    expect(isCeilidhPulseMoment(CEILIDH_PULSE_PERIOD)).toBe(true);
  });

  it('returns true at every multiple of the period after the first', () => {
    for (let n = 1; n <= 10; n++) {
      expect(
        isCeilidhPulseMoment(n * CEILIDH_PULSE_PERIOD),
        `combo ${n * CEILIDH_PULSE_PERIOD}`,
      ).toBe(true);
    }
  });

  it('returns false below the first-pulse threshold (even on multiples of period)', () => {
    // 0 is a multiple of 8 but we skip it — the very first pulse must be a reward,
    // not a cold-start freebie.
    expect(isCeilidhPulseMoment(0)).toBe(false);
  });

  it('returns false at non-period combos', () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 9, 10, 15, 17, 23, 99]) {
      expect(isCeilidhPulseMoment(n), `combo ${n}`).toBe(false);
    }
  });

  it('rejects fractional inputs (guards buggy callers)', () => {
    expect(isCeilidhPulseMoment(8.5)).toBe(false);
    expect(isCeilidhPulseMoment(16.0001)).toBe(false);
  });

  it('rejects negative / non-finite / NaN inputs', () => {
    expect(isCeilidhPulseMoment(-8)).toBe(false);
    expect(isCeilidhPulseMoment(-1)).toBe(false);
    expect(isCeilidhPulseMoment(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isCeilidhPulseMoment(Number.NaN)).toBe(false);
  });
});

describe('ceilidh chain constants', () => {
  it('magnet flat is positive and reasonable', () => {
    expect(CEILIDH_MAGNET_FLAT_PX).toBeGreaterThan(0);
    expect(CEILIDH_MAGNET_FLAT_PX).toBeLessThan(200);
  });

  it('magnet duration is positive and reasonable (1–5s)', () => {
    expect(CEILIDH_MAGNET_DURATION_MS).toBeGreaterThan(500);
    expect(CEILIDH_MAGNET_DURATION_MS).toBeLessThan(5000);
  });

  it('pulse period is a positive integer ≥ 4 (so it feels like a streak reward, not every kill)', () => {
    expect(Number.isInteger(CEILIDH_PULSE_PERIOD)).toBe(true);
    expect(CEILIDH_PULSE_PERIOD).toBeGreaterThanOrEqual(4);
  });
});

describe('ceilidh i18n', () => {
  it('ui.game.ceilidh_pulse resolves through t()', () => {
    const resolved = t('ui.game.ceilidh_pulse');
    expect(resolved).not.toBe('ui.game.ceilidh_pulse');
    expect(resolved.length).toBeGreaterThan(0);
    // Register check — Glesga voice, not System message.
    expect(resolved.toLowerCase()).toContain('ceilidh');
  });
});
