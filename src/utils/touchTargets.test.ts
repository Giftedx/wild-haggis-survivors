import { describe, expect, it } from 'vitest';
import {
  MIN_TOUCH_TARGET_PX,
  computeMinTapHitArea,
  detectTouchPrimary,
  isMobileViewportWidth,
} from './touchTargets';

describe('computeMinTapHitArea', () => {
  it('inflates a small element to the 44pt minimum', () => {
    const area = computeMinTapHitArea(20, 20);
    expect(area.width).toBe(MIN_TOUCH_TARGET_PX);
    expect(area.height).toBe(MIN_TOUCH_TARGET_PX);
  });

  it('passes through an element already larger than the minimum', () => {
    const area = computeMinTapHitArea(80, 60);
    expect(area.width).toBe(80);
    expect(area.height).toBe(60);
  });

  it('inflates only the smaller axis when one is large', () => {
    const area = computeMinTapHitArea(120, 18);
    expect(area.width).toBe(120);
    expect(area.height).toBe(MIN_TOUCH_TARGET_PX);
  });

  it('centers the inflated rect on a top-left-origin object', () => {
    const area = computeMinTapHitArea(20, 20, { x: 0, y: 0 });
    expect(area.x).toBe(-12);
    expect(area.y).toBe(-12);
  });

  it('centers the inflated rect on a center-origin object', () => {
    const area = computeMinTapHitArea(20, 20, { x: 0.5, y: 0.5 });
    expect(area.x).toBe(-22);
    expect(area.y).toBe(-22);
  });

  it('centers the inflated rect on a top-right-origin object', () => {
    const area = computeMinTapHitArea(20, 20, { x: 1, y: 0 });
    expect(area.x).toBe(-32);
    expect(area.y).toBe(-12);
  });

  it('respects a custom minSize', () => {
    const area = computeMinTapHitArea(10, 10, { x: 0, y: 0 }, 60);
    expect(area.width).toBe(60);
    expect(area.height).toBe(60);
  });

  it('produces a hit area that contains the original at its origin', () => {
    const area = computeMinTapHitArea(20, 20, { x: 0.5, y: 0.5 });
    const halfW = 20 / 2;
    const halfH = 20 / 2;
    expect(area.x).toBeLessThanOrEqual(-halfW);
    expect(area.y).toBeLessThanOrEqual(-halfH);
    expect(area.x + area.width).toBeGreaterThanOrEqual(halfW);
    expect(area.y + area.height).toBeGreaterThanOrEqual(halfH);
  });
});

describe('isMobileViewportWidth', () => {
  it('reports phone widths as mobile', () => {
    expect(isMobileViewportWidth(360)).toBe(true);
    expect(isMobileViewportWidth(414)).toBe(true);
  });

  it('reports tablet portrait as desktop-class above default threshold', () => {
    expect(isMobileViewportWidth(768)).toBe(false);
    expect(isMobileViewportWidth(1024)).toBe(false);
  });

  it('respects a custom threshold (tablet portrait still narrow)', () => {
    expect(isMobileViewportWidth(768, 900)).toBe(true);
  });

  it('returns false at exactly the threshold (strict inequality)', () => {
    expect(isMobileViewportWidth(600)).toBe(false);
  });
});

describe('detectTouchPrimary', () => {
  it('returns false in a node environment with no window', () => {
    expect(detectTouchPrimary()).toBe(false);
  });
});
