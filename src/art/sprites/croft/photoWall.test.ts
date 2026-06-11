import { describe, expect, it } from 'vitest';
import {
  PHOTO_WALL_COLUMNS,
  PHOTO_WALL_ROUTE_ORDER,
  computePhotoWallSlots,
} from './photoWall';

describe('PHOTO_WALL_ROUTE_ORDER', () => {
  it('covers all six shipped Moor Road routes', () => {
    expect(PHOTO_WALL_ROUTE_ORDER.length).toBe(6);
    expect(new Set(PHOTO_WALL_ROUTE_ORDER).size).toBe(6);
  });

  it('contains the canonical six-route list from data/routes.ts', () => {
    expect(new Set(PHOTO_WALL_ROUTE_ORDER)).toEqual(
      new Set([
        'up_the_brae',
        'round_the_loch',
        'through_the_kirkyard',
        'stand_yer_ground',
        'run_for_the_hills',
        'buckie_pitstop',
      ]),
    );
  });
});

describe('computePhotoWallSlots', () => {
  const region = { x: 0, y: 0, w: 200, h: 150 };

  it('returns one slot per route, arranged in the configured column count', () => {
    const slots = computePhotoWallSlots(region, PHOTO_WALL_ROUTE_ORDER.length);
    expect(slots).toHaveLength(PHOTO_WALL_ROUTE_ORDER.length);
    // 6 slots at default 3 cols = 2 rows; first column shares x with slot 3.
    expect(slots[0].x).toBeCloseTo(slots[PHOTO_WALL_COLUMNS].x);
    // First row shares y with itself, second row shifts down.
    expect(slots[0].y).toBeLessThan(slots[PHOTO_WALL_COLUMNS].y);
  });

  it('slots are uniformly sized', () => {
    const slots = computePhotoWallSlots(region, PHOTO_WALL_ROUTE_ORDER.length);
    const w0 = slots[0].w;
    const h0 = slots[0].h;
    for (const s of slots) {
      expect(s.w).toBeCloseTo(w0);
      expect(s.h).toBeCloseTo(h0);
    }
  });

  it('slots stay inside the region bounds', () => {
    const slots = computePhotoWallSlots(region, PHOTO_WALL_ROUTE_ORDER.length);
    for (const s of slots) {
      expect(s.x).toBeGreaterThanOrEqual(region.x);
      expect(s.y).toBeGreaterThanOrEqual(region.y);
      expect(s.x + s.w).toBeLessThanOrEqual(region.x + region.w + 0.01);
      expect(s.y + s.h).toBeLessThanOrEqual(region.y + region.h + 0.01);
    }
  });

  it('scales with region origin', () => {
    const a = computePhotoWallSlots({ x: 0, y: 0, w: 200, h: 150 }, 6);
    const b = computePhotoWallSlots({ x: 100, y: 50, w: 200, h: 150 }, 6);
    for (let i = 0; i < a.length; i++) {
      expect(b[i].x).toBeCloseTo(a[i].x + 100);
      expect(b[i].y).toBeCloseTo(a[i].y + 50);
    }
  });

  it('returns an empty array on zero or negative count / cols', () => {
    expect(computePhotoWallSlots(region, 0)).toEqual([]);
    expect(computePhotoWallSlots(region, 6, 0)).toEqual([]);
    expect(computePhotoWallSlots(region, -1)).toEqual([]);
  });
});
