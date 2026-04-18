import { describe, expect, it } from 'vitest';
import {
  BURN_LEAP_DIR_DOT_THRESHOLD,
  BURN_LEAP_DIR_MIN_LEN,
  BURN_LEAP_DOUBLE_TAP_WINDOW_MS,
  evaluateBurnLeap,
} from './burnLeapInput';

const ZERO = { x: 0, y: 0 };
const RIGHT = { x: 1, y: 0 };
const LEFT = { x: -1, y: 0 };
const UP = { x: 0, y: -1 };
const UP_RIGHT = { x: Math.SQRT1_2, y: -Math.SQRT1_2 };

describe('evaluateBurnLeap', () => {
  it('returns no trigger and no release update on a pure idle frame', () => {
    const r = evaluateBurnLeap({
      prevDir: ZERO, currDir: ZERO,
      nowMs: 100,
      lastReleaseTimeMs: -99999,
      lastReleaseDir: null,
      cooldownActive: false,
    });
    expect(r.trigger).toBe(false);
    expect(r.triggerDir).toBeNull();
    expect(r.nextLastReleaseTimeMs).toBe(-99999);
    expect(r.nextLastReleaseDir).toBeNull();
  });

  it('records the release when direction drops from non-zero to zero', () => {
    const r = evaluateBurnLeap({
      prevDir: RIGHT, currDir: ZERO,
      nowMs: 500,
      lastReleaseTimeMs: -99999,
      lastReleaseDir: null,
      cooldownActive: false,
    });
    expect(r.trigger).toBe(false);
    expect(r.nextLastReleaseTimeMs).toBe(500);
    expect(r.nextLastReleaseDir).toEqual({ x: 1, y: 0 });
  });

  it('normalizes the release direction regardless of input magnitude', () => {
    const r = evaluateBurnLeap({
      prevDir: { x: 0.6, y: 0.8 },
      currDir: ZERO,
      nowMs: 300,
      lastReleaseTimeMs: -99999,
      lastReleaseDir: null,
      cooldownActive: false,
    });
    expect(r.nextLastReleaseDir?.x).toBeCloseTo(0.6, 5);
    expect(r.nextLastReleaseDir?.y).toBeCloseTo(0.8, 5);
  });

  it('does not trigger on the first press (no prior release)', () => {
    const r = evaluateBurnLeap({
      prevDir: ZERO, currDir: RIGHT,
      nowMs: 100,
      lastReleaseTimeMs: -99999,
      lastReleaseDir: null,
      cooldownActive: false,
    });
    expect(r.trigger).toBe(false);
  });

  it('triggers a leap when press follows release within the window and direction aligns', () => {
    const r = evaluateBurnLeap({
      prevDir: ZERO, currDir: RIGHT,
      nowMs: 150,
      lastReleaseTimeMs: 100,
      lastReleaseDir: { x: 1, y: 0 },
      cooldownActive: false,
    });
    expect(r.trigger).toBe(true);
    expect(r.triggerDir).toEqual({ x: 1, y: 0 });
  });

  it('does not trigger when the press comes after the window', () => {
    const r = evaluateBurnLeap({
      prevDir: ZERO, currDir: RIGHT,
      nowMs: 100 + BURN_LEAP_DOUBLE_TAP_WINDOW_MS + 5,
      lastReleaseTimeMs: 100,
      lastReleaseDir: { x: 1, y: 0 },
      cooldownActive: false,
    });
    expect(r.trigger).toBe(false);
  });

  it('does not trigger when the press direction opposes the release', () => {
    const r = evaluateBurnLeap({
      prevDir: ZERO, currDir: LEFT,
      nowMs: 150,
      lastReleaseTimeMs: 100,
      lastReleaseDir: { x: 1, y: 0 },
      cooldownActive: false,
    });
    expect(r.trigger).toBe(false);
  });

  it('does not trigger when the press direction is perpendicular (dot below threshold)', () => {
    const r = evaluateBurnLeap({
      prevDir: ZERO, currDir: UP,
      nowMs: 150,
      lastReleaseTimeMs: 100,
      lastReleaseDir: { x: 1, y: 0 },
      cooldownActive: false,
    });
    expect(r.trigger).toBe(false);
  });

  it('triggers on diagonal→diagonal re-press when dot-product passes the threshold', () => {
    const r = evaluateBurnLeap({
      prevDir: ZERO, currDir: UP_RIGHT,
      nowMs: 150,
      lastReleaseTimeMs: 100,
      lastReleaseDir: { x: Math.SQRT1_2, y: -Math.SQRT1_2 },
      cooldownActive: false,
    });
    expect(r.trigger).toBe(true);
    expect(r.triggerDir?.x).toBeCloseTo(Math.SQRT1_2, 5);
    expect(r.triggerDir?.y).toBeCloseTo(-Math.SQRT1_2, 5);
  });

  it('swallows the trigger while cooldown is active', () => {
    const r = evaluateBurnLeap({
      prevDir: ZERO, currDir: RIGHT,
      nowMs: 150,
      lastReleaseTimeMs: 100,
      lastReleaseDir: { x: 1, y: 0 },
      cooldownActive: true,
    });
    expect(r.trigger).toBe(false);
  });

  it('on trigger, bumps the stored release timestamp out of the window so one leap does not chain again', () => {
    const r = evaluateBurnLeap({
      prevDir: ZERO, currDir: RIGHT,
      nowMs: 150,
      lastReleaseTimeMs: 100,
      lastReleaseDir: { x: 1, y: 0 },
      cooldownActive: false,
    });
    expect(r.trigger).toBe(true);
    // Next frame: same press held (prev = curr = RIGHT) must not re-trigger.
    const r2 = evaluateBurnLeap({
      prevDir: RIGHT, currDir: RIGHT,
      nowMs: 151,
      lastReleaseTimeMs: r.nextLastReleaseTimeMs,
      lastReleaseDir: r.nextLastReleaseDir,
      cooldownActive: false,
    });
    expect(r2.trigger).toBe(false);
  });

  it('treats sub-deadzone direction as zero for release detection', () => {
    // Prev is noise (length < MIN_LEN), curr is real press — should NOT read
    // as a release edge, so no leap armed.
    const tiny = BURN_LEAP_DIR_MIN_LEN / 2;
    const r = evaluateBurnLeap({
      prevDir: { x: tiny, y: 0 },
      currDir: RIGHT,
      nowMs: 100,
      lastReleaseTimeMs: -99999,
      lastReleaseDir: null,
      cooldownActive: false,
    });
    expect(r.trigger).toBe(false);
  });

  it('treats sub-deadzone direction as zero for press detection', () => {
    // A soft drift away from zero (below MIN_LEN) must not re-arm as a press
    // after a prior release — avoids stick drift triggering leaps.
    const tiny = BURN_LEAP_DIR_MIN_LEN / 2;
    const r = evaluateBurnLeap({
      prevDir: ZERO,
      currDir: { x: tiny, y: 0 },
      nowMs: 150,
      lastReleaseTimeMs: 100,
      lastReleaseDir: { x: 1, y: 0 },
      cooldownActive: false,
    });
    expect(r.trigger).toBe(false);
  });

  it('ignores negative elapsed time (clock went backwards)', () => {
    const r = evaluateBurnLeap({
      prevDir: ZERO, currDir: RIGHT,
      nowMs: 50,
      lastReleaseTimeMs: 100,
      lastReleaseDir: { x: 1, y: 0 },
      cooldownActive: false,
    });
    expect(r.trigger).toBe(false);
  });

  it('dot threshold matches the exported constant', () => {
    // A direction exactly at the threshold fires; one degree off does not.
    const thresholdAngle = Math.acos(BURN_LEAP_DIR_DOT_THRESHOLD);
    // At-threshold press → triggers.
    const atThresholdDir = { x: Math.cos(-thresholdAngle), y: Math.sin(-thresholdAngle) };
    const r1 = evaluateBurnLeap({
      prevDir: ZERO, currDir: atThresholdDir,
      nowMs: 150,
      lastReleaseTimeMs: 100,
      lastReleaseDir: { x: 1, y: 0 },
      cooldownActive: false,
    });
    expect(r1.trigger).toBe(true);
    // 1° past threshold → does not.
    const past = thresholdAngle + (1 * Math.PI) / 180;
    const pastDir = { x: Math.cos(-past), y: Math.sin(-past) };
    const r2 = evaluateBurnLeap({
      prevDir: ZERO, currDir: pastDir,
      nowMs: 150,
      lastReleaseTimeMs: 100,
      lastReleaseDir: { x: 1, y: 0 },
      cooldownActive: false,
    });
    expect(r2.trigger).toBe(false);
  });
});
