import { BALANCE } from './BalanceConfig';

/** World-view rectangle in screen/world space (Phaser `worldView` shape). */
export type WorldViewRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * True when the point lies inside the camera world view expanded by `marginPx`
 * on all sides — the region where Arcade physics and full AI run.
 */
export function isWorldPointInSpatialActiveZone(
  worldX: number,
  worldY: number,
  view: WorldViewRect,
  marginPx: number = BALANCE.spatial.cullMarginPx
): boolean {
  const left = view.x - marginPx;
  const right = view.x + view.width + marginPx;
  const top = view.y - marginPx;
  const bottom = view.y + view.height + marginPx;
  return worldX >= left && worldX <= right && worldY >= top && worldY <= bottom;
}

/**
 * When true, `Enemy.chaseTarget` disables the Arcade body and runs cheap drift only.
 * Bosses and hazards are never culled.
 */
export function isEnemySpatialPhysicsCulled(
  worldX: number,
  worldY: number,
  view: WorldViewRect,
  marginPx: number,
  bossFlag: boolean,
  behavior: string,
  spatialCullImmune: boolean = false
): boolean {
  if (bossFlag || behavior === 'hazard' || spatialCullImmune) return false;
  return !isWorldPointInSpatialActiveZone(worldX, worldY, view, marginPx);
}
