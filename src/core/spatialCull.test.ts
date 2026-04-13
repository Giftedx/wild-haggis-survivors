import { describe, it, expect } from 'vitest';
import { isWorldPointInSpatialActiveZone, isEnemySpatialPhysicsCulled, WorldViewRect } from './spatialCull';

const view: WorldViewRect = { x: 100, y: 100, width: 800, height: 600 };

describe('isWorldPointInSpatialActiveZone', () => {
  it('point inside view → true', () => {
    expect(isWorldPointInSpatialActiveZone(500, 400, view, 0)).toBe(true);
  });

  it('point on exact edge → true (inclusive)', () => {
    expect(isWorldPointInSpatialActiveZone(100, 100, view, 0)).toBe(true);
    expect(isWorldPointInSpatialActiveZone(900, 700, view, 0)).toBe(true);
  });

  it('point outside view → false', () => {
    expect(isWorldPointInSpatialActiveZone(99, 400, view, 0)).toBe(false);
    expect(isWorldPointInSpatialActiveZone(901, 400, view, 0)).toBe(false);
    expect(isWorldPointInSpatialActiveZone(500, 99, view, 0)).toBe(false);
    expect(isWorldPointInSpatialActiveZone(500, 701, view, 0)).toBe(false);
  });

  it('margin expands active zone', () => {
    expect(isWorldPointInSpatialActiveZone(50, 400, view, 0)).toBe(false);
    expect(isWorldPointInSpatialActiveZone(50, 400, view, 100)).toBe(true);
  });

  it('margin expands all 4 sides', () => {
    const m = 50;
    expect(isWorldPointInSpatialActiveZone(51, 400, view, m)).toBe(true);
    expect(isWorldPointInSpatialActiveZone(949, 400, view, m)).toBe(true);
    expect(isWorldPointInSpatialActiveZone(500, 51, view, m)).toBe(true);
    expect(isWorldPointInSpatialActiveZone(500, 749, view, m)).toBe(true);
  });

  it('corner outside with margin → boundary check', () => {
    expect(isWorldPointInSpatialActiveZone(50, 50, view, 50)).toBe(true);
    expect(isWorldPointInSpatialActiveZone(49, 49, view, 50)).toBe(false);
  });
});

describe('isEnemySpatialPhysicsCulled', () => {
  it('enemy inside active zone → not culled', () => {
    expect(isEnemySpatialPhysicsCulled(500, 400, view, 100, false, 'chase')).toBe(false);
  });

  it('enemy outside active zone → culled', () => {
    expect(isEnemySpatialPhysicsCulled(-500, -500, view, 100, false, 'chase')).toBe(true);
  });

  it('boss never culled even outside zone', () => {
    expect(isEnemySpatialPhysicsCulled(-999, -999, view, 0, true, 'chase')).toBe(false);
  });

  it('hazard never culled even outside zone', () => {
    expect(isEnemySpatialPhysicsCulled(-999, -999, view, 0, false, 'hazard')).toBe(false);
  });

  it('spatialCullImmune → not culled', () => {
    expect(isEnemySpatialPhysicsCulled(-999, -999, view, 0, false, 'chase', true)).toBe(false);
  });

  it('regular enemy just outside margin → culled', () => {
    expect(isEnemySpatialPhysicsCulled(-1, 400, view, 100, false, 'chase')).toBe(true);
  });

  it('regular enemy on margin edge → not culled', () => {
    expect(isEnemySpatialPhysicsCulled(0, 400, view, 100, false, 'chase')).toBe(false);
  });
});
