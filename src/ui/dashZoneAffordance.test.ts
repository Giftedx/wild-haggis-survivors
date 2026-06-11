import { describe, expect, it } from 'vitest';
import {
  DASH_ZONE_X_FRACTION,
  dashZoneHintPulseAlpha,
  resolveDashZoneBounds,
  shouldShowDashZoneHint,
} from './dashZoneAffordance';

describe('resolveDashZoneBounds', () => {
  it('places the dash zone at the right 40% of an 800x600 canvas', () => {
    const b = resolveDashZoneBounds(800, 600);
    expect(b.x).toBeCloseTo(800 * DASH_ZONE_X_FRACTION);
    expect(b.width).toBeCloseTo(800 * (1 - DASH_ZONE_X_FRACTION));
    expect(b.height).toBe(600);
    expect(b.centreX).toBeCloseTo(b.x + b.width / 2);
    expect(b.centreY).toBe(300);
  });

  it('keeps the zone at 40% of width across the canonical mobile viewports', () => {
    // Mirrors the mobile-viewport-reflow.spec.ts sweep so the helper +
    // the e2e share a baseline.
    for (const width of [360, 414, 768, 1024]) {
      const b = resolveDashZoneBounds(width, 800);
      expect(b.x).toBeCloseTo(width * 0.6);
      expect(b.width).toBeCloseTo(width * 0.4);
      expect(b.x + b.width).toBeCloseTo(width);
    }
  });

  it('zeros out gracefully for a degenerate width', () => {
    const b = resolveDashZoneBounds(0, 600);
    expect(b.x).toBe(0);
    expect(b.width).toBe(0);
    expect(b.centreX).toBe(0);
  });
});

describe('shouldShowDashZoneHint', () => {
  it('shows the hint on first mobile run before any dash use', () => {
    expect(shouldShowDashZoneHint({
      isTouchPrimary: true,
      hasUsedTouchDash: false,
      isGameActive: true,
    })).toBe(true);
  });

  it('hides the hint once the player has tapped the zone for the first dash', () => {
    expect(shouldShowDashZoneHint({
      isTouchPrimary: true,
      hasUsedTouchDash: true,
      isGameActive: true,
    })).toBe(false);
  });

  it('hides the hint on desktop / non-touch devices', () => {
    expect(shouldShowDashZoneHint({
      isTouchPrimary: false,
      hasUsedTouchDash: false,
      isGameActive: true,
    })).toBe(false);
  });

  it('hides the hint while the game is paused / over', () => {
    expect(shouldShowDashZoneHint({
      isTouchPrimary: true,
      hasUsedTouchDash: false,
      isGameActive: false,
    })).toBe(false);
  });
});

describe('dashZoneHintPulseAlpha', () => {
  it('stays inside the [min, max] window across a full period', () => {
    for (let t = 0; t <= 1800; t += 30) {
      const a = dashZoneHintPulseAlpha(t);
      expect(a).toBeGreaterThanOrEqual(0.18 - 1e-9);
      expect(a).toBeLessThanOrEqual(0.32 + 1e-9);
    }
  });

  it('returns the minimum at t=0 and t=period', () => {
    expect(dashZoneHintPulseAlpha(0)).toBeCloseTo(0.18, 5);
    expect(dashZoneHintPulseAlpha(1800)).toBeCloseTo(0.18, 5);
  });

  it('returns the maximum at the half-period peak', () => {
    expect(dashZoneHintPulseAlpha(900)).toBeCloseTo(0.32, 5);
  });

  it('respects custom min/max/period', () => {
    expect(dashZoneHintPulseAlpha(500, 0.1, 0.4, 1000)).toBeCloseTo(0.4, 5);
    expect(dashZoneHintPulseAlpha(0, 0.1, 0.4, 1000)).toBeCloseTo(0.1, 5);
  });
});
