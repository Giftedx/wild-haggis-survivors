import { describe, it, expect } from 'vitest';
import {
  xpGemMagnetSpeed,
  XP_GEM_MAGNET_MIN_SPEED,
  XP_GEM_MAGNET_BASE_SPEED,
  XP_GEM_MAGNET_SLOPE,
} from './xpGemMagnet';

describe('xpGemMagnetSpeed — linear ramp with floor', () => {
  it('at distance 0 returns the base speed', () => {
    expect(xpGemMagnetSpeed(0)).toBe(XP_GEM_MAGNET_BASE_SPEED);
  });

  it('decreases by slope per pixel of distance', () => {
    expect(xpGemMagnetSpeed(50)).toBe(XP_GEM_MAGNET_BASE_SPEED - 50 * XP_GEM_MAGNET_SLOPE);
  });

  it('clamps at the minimum speed for far-away gems', () => {
    expect(xpGemMagnetSpeed(1000)).toBe(XP_GEM_MAGNET_MIN_SPEED);
  });

  it('never drops below the minimum speed (invariant)', () => {
    for (let d = 0; d < 2000; d += 10) {
      expect(xpGemMagnetSpeed(d)).toBeGreaterThanOrEqual(XP_GEM_MAGNET_MIN_SPEED);
    }
  });

  it('is monotonically non-increasing', () => {
    let prev = Infinity;
    for (let d = 0; d < 2000; d += 10) {
      const s = xpGemMagnetSpeed(d);
      expect(s).toBeLessThanOrEqual(prev);
      prev = s;
    }
  });

  it('the floor kicks in at the exact expected distance', () => {
    // base - slope * d = floor → d = (base - floor) / slope
    const kickDist = (XP_GEM_MAGNET_BASE_SPEED - XP_GEM_MAGNET_MIN_SPEED) / XP_GEM_MAGNET_SLOPE;
    expect(xpGemMagnetSpeed(kickDist)).toBe(XP_GEM_MAGNET_MIN_SPEED);
    expect(xpGemMagnetSpeed(kickDist - 1)).toBeGreaterThan(XP_GEM_MAGNET_MIN_SPEED);
  });
});
