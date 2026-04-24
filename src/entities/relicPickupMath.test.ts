import { describe, expect, it } from 'vitest';
import {
  RELIC_PICKUP_LIFETIME_MS,
  RELIC_PICKUP_RADIUS_PX,
  isDespawned,
  isWithinPickupRange,
} from './relicPickupMath';

describe('relicPickupMath — constants', () => {
  it('pickup radius is 34px to match the Reliquary', () => {
    expect(RELIC_PICKUP_RADIUS_PX).toBe(34);
  });

  it('lifetime is 60s per spec §6', () => {
    expect(RELIC_PICKUP_LIFETIME_MS).toBe(60_000);
  });
});

describe('isWithinPickupRange', () => {
  it('returns true at origin', () => {
    expect(isWithinPickupRange(0, 0, 0, 0)).toBe(true);
  });

  it('returns true just inside the radius', () => {
    expect(isWithinPickupRange(0, 0, 30, 0)).toBe(true);
  });

  it('returns true exactly at the boundary', () => {
    expect(isWithinPickupRange(0, 0, RELIC_PICKUP_RADIUS_PX, 0)).toBe(true);
  });

  it('returns false just outside the radius', () => {
    expect(isWithinPickupRange(0, 0, RELIC_PICKUP_RADIUS_PX + 1, 0)).toBe(false);
  });

  it('handles 2D distances', () => {
    // hypot(24, 24) ≈ 33.94 — inside
    expect(isWithinPickupRange(0, 0, 24, 24)).toBe(true);
    // hypot(25, 25) ≈ 35.36 — outside
    expect(isWithinPickupRange(0, 0, 25, 25)).toBe(false);
  });

  it('accepts a custom radius override', () => {
    expect(isWithinPickupRange(0, 0, 100, 0, 50)).toBe(false);
    expect(isWithinPickupRange(0, 0, 100, 0, 150)).toBe(true);
  });
});

describe('isDespawned', () => {
  it('false before lifetime elapses', () => {
    expect(isDespawned(0)).toBe(false);
    expect(isDespawned(30_000)).toBe(false);
    expect(isDespawned(59_999)).toBe(false);
  });

  it('true at or after lifetime', () => {
    expect(isDespawned(60_000)).toBe(true);
    expect(isDespawned(120_000)).toBe(true);
  });

  it('accepts a custom lifetime override', () => {
    expect(isDespawned(5_000, 10_000)).toBe(false);
    expect(isDespawned(10_000, 10_000)).toBe(true);
  });
});
