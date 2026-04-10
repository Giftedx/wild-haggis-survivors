import { describe, expect, it } from 'vitest';
import { BALANCE } from './BalanceConfig';
import {
  isEnemySpatialPhysicsCulled,
  isWorldPointInSpatialActiveZone,
} from './spatialCull';

/** Stand-in for `cameras.main.worldView` — 800×600 viewport at origin. */
const VIEW_800_600 = { x: 0, y: 0, width: 800, height: 600 };

describe('spatial culling (camera margin)', () => {
  it('treats a point ~2000px east of the view as outside the active zone', () => {
    const m = BALANCE.spatial.cullMarginPx;
    expect(isWorldPointInSpatialActiveZone(2500, 300, VIEW_800_600, m)).toBe(false);
    expect(
      isEnemySpatialPhysicsCulled(2500, 300, VIEW_800_600, m, false, 'chase')
    ).toBe(true);
  });

  it('treats a point 500px inside the horizontal span as inside the active zone', () => {
    const m = BALANCE.spatial.cullMarginPx;
    expect(isWorldPointInSpatialActiveZone(500, 300, VIEW_800_600, m)).toBe(true);
    expect(
      isEnemySpatialPhysicsCulled(500, 300, VIEW_800_600, m, false, 'chase')
    ).toBe(false);
  });

  it('never culls bosses or hazards (physics stay on for overlap semantics)', () => {
    const m = BALANCE.spatial.cullMarginPx;
    expect(
      isEnemySpatialPhysicsCulled(2500, 300, VIEW_800_600, m, true, 'chase')
    ).toBe(false);
    expect(
      isEnemySpatialPhysicsCulled(2500, 300, VIEW_800_600, m, false, 'hazard')
    ).toBe(false);
  });

  it('never culls midgie-style swarms flagged spatialCullImmune', () => {
    const m = BALANCE.spatial.cullMarginPx;
    expect(
      isEnemySpatialPhysicsCulled(2500, 300, VIEW_800_600, m, false, 'swarm', true)
    ).toBe(false);
  });
});
