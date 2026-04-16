/**
 * Pure helper for ActIntermissionScene default-resolve path.
 *
 * Extracted so tests can import without pulling in Phaser (which
 * touches `window` at module eval and breaks the node-env vitest
 * config).
 */
import type { PickerSlot, RouteDef, RouteKey, RoutePick } from '../data/routes';
import { DEFAULT_ROUTE_ON_SKIP, getRoute } from '../data/routes';

/**
 * Pure factory for the RoutePick emitted when the player picks a card
 * (or when the Skip path resolves a default). Extracted so integration
 * tests can call it without instantiating a Phaser Scene.
 */
export function buildRoutePick(
  route: RouteDef,
  atGameTimeSec: number,
  opts?: { defaultedBySetting?: boolean },
): RoutePick {
  return {
    slot: route.slot,
    routeKey: route.key,
    atGameTimeSec,
    defaultedBySetting: opts?.defaultedBySetting ?? false,
  };
}

/**
 * Produce the slot's DEFAULT_ROUTE_ON_SKIP pick + route without
 * rendering. Used by GameScene when skipActIntermissions=true.
 */
export function resolveDefaultRoute(
  slot: PickerSlot,
  atGameTimeSec: number,
): { pick: RoutePick; route: RouteDef } {
  const key: RouteKey = DEFAULT_ROUTE_ON_SKIP[slot];
  const route = getRoute(key);
  const pick: RoutePick = {
    slot,
    routeKey: key,
    atGameTimeSec,
    defaultedBySetting: true,
  };
  return { pick, route };
}
