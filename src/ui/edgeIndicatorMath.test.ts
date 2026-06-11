import { describe, it, expect } from 'vitest';
import {
  insertionSortOffScreenByDist,
  isOnCameraViewport,
  projectThreatAngleToScreenEdge,
  type OffScreenScratch,
} from './edgeIndicatorMath';

describe('isOnCameraViewport', () => {
  const L = 100;
  const R = 300;
  const T = 50;
  const B = 250;

  it('returns true for a point strictly inside', () => {
    expect(isOnCameraViewport(200, 150, L, R, T, B)).toBe(true);
  });

  it('returns true on inclusive edges and corners', () => {
    expect(isOnCameraViewport(100, 150, L, R, T, B)).toBe(true);
    expect(isOnCameraViewport(300, 150, L, R, T, B)).toBe(true);
    expect(isOnCameraViewport(200, 50, L, R, T, B)).toBe(true);
    expect(isOnCameraViewport(200, 250, L, R, T, B)).toBe(true);
    expect(isOnCameraViewport(100, 50, L, R, T, B)).toBe(true);
  });

  it('returns false when outside on any side', () => {
    expect(isOnCameraViewport(99, 150, L, R, T, B)).toBe(false);
    expect(isOnCameraViewport(301, 150, L, R, T, B)).toBe(false);
    expect(isOnCameraViewport(200, 49, L, R, T, B)).toBe(false);
    expect(isOnCameraViewport(200, 251, L, R, T, B)).toBe(false);
  });
});

describe('projectThreatAngleToScreenEdge', () => {
  const screenW = 800;
  const screenH = 600;
  const margin = 20;

  it('places east/west threats on left and right inner edges', () => {
    const right = projectThreatAngleToScreenEdge(0, screenW, screenH, margin);
    expect(right.sx).toBeCloseTo(screenW - margin, 5);
    expect(right.sy).toBeCloseTo(screenH / 2, 5);

    const left = projectThreatAngleToScreenEdge(Math.PI, screenW, screenH, margin);
    expect(left.sx).toBeCloseTo(margin, 5);
    expect(left.sy).toBeCloseTo(screenH / 2, 5);
  });

  it('places north/south threats on top and bottom when cos is near zero', () => {
    const down = projectThreatAngleToScreenEdge(Math.PI / 2, screenW, screenH, margin);
    expect(down.sx).toBeCloseTo(screenW / 2, 5);
    expect(down.sy).toBeCloseTo(screenH - margin, 5);

    const up = projectThreatAngleToScreenEdge(-Math.PI / 2, screenW, screenH, margin);
    expect(up.sx).toBeCloseTo(screenW / 2, 5);
    expect(up.sy).toBeCloseTo(margin, 5);
  });

  it('hits top/bottom branch when the ray meets vertical edges first', () => {
    const steep = projectThreatAngleToScreenEdge(Math.PI / 2 - 0.05, screenW, screenH, margin);
    expect(steep.sy).toBeGreaterThan(screenH / 2);
    expect(steep.sx).toBeGreaterThan(0);
    expect(steep.sx).toBeLessThan(screenW);
  });
});

describe('insertionSortOffScreenByDist', () => {
  const entry = (dist: number, tag = 0): OffScreenScratch => ({
    x: tag,
    y: 0,
    dist,
    boss: false,
    elite: false,
    eliteDisplayTint: 0xd4a017,
  });

  it('is a no-op for count 0 or 1', () => {
    const a: OffScreenScratch[] = [entry(5), entry(3)];
    insertionSortOffScreenByDist(a, 0);
    expect(a[0].dist).toBe(5);
    insertionSortOffScreenByDist(a, 1);
    expect(a[0].dist).toBe(5);
  });

  it('sorts the first count elements by dist ascending', () => {
    const buf: OffScreenScratch[] = [
      entry(30, 1),
      entry(10, 2),
      entry(20, 3),
      entry(99, 4),
    ];
    insertionSortOffScreenByDist(buf, 3);
    expect(buf.slice(0, 3).map((e) => e.dist)).toEqual([10, 20, 30]);
    expect(buf[3].dist).toBe(99);
  });

  it('is stable for equal distances', () => {
    const buf: OffScreenScratch[] = [entry(5, 1), entry(5, 2), entry(5, 3)];
    insertionSortOffScreenByDist(buf, 3);
    expect(buf.map((e) => e.x)).toEqual([1, 2, 3]);
  });
});
