/**
 * Pure helper for ActIntermissionScene default-resolve path.
 *
 * Extracted so tests can import without pulling in Phaser (which
 * touches `window` at module eval and breaks the node-env vitest
 * config).
 */
import type { PickerSlot, RouteDef, RouteKey, RoutePick } from '../data/routes';
import { DEFAULT_ROUTE_ON_SKIP, getRoute } from '../data/routes';
import type { RunModifiers } from '../core/RunModifiers';

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

/**
 * Pure layout maths for the ActIntermission card row. Given the
 * viewport width, the count of cards, each card's width, and the
 * gap between them, returns the centred `startX` (the x-centre of
 * card 0) so the row is horizontally centred within the viewport.
 *
 * Each subsequent card sits at `startX + i * (cardW + gap)`.
 */
export function actIntermissionCardStartX(
  viewportWidth: number,
  cardCount: number,
  cardW: number,
  gap: number,
): number {
  if (cardCount <= 0) return viewportWidth / 2;
  const totalW = cardW * cardCount + gap * (cardCount - 1);
  return (viewportWidth - totalW) / 2 + cardW / 2;
}

/**
 * Map a keyboard keydown `e.key` value to the route index the
 * ActIntermissionScene should select. Supports `1`, `2`, `3` shortcut
 * digits; anything else returns null (scene ignores the press).
 *
 * Indices beyond the route count are the scene's responsibility to
 * reject — this helper is only the key→digit mapping.
 */
export function actIntermissionShortcutIndex(key: string): number | null {
  const map: Record<string, number | undefined> = { '1': 0, '2': 1, '3': 2 };
  const idx = map[key];
  return idx === undefined ? null : idx;
}

/**
 * Apply a route's `modifierDeltas` to the run-scoped `RunModifiers` bag.
 * Numeric fields multiply the current value. This preserves modifiers
 * that curses and other systems applied before the route. The function
 * skips non-numeric keys because RunActState owns the route log.
 *
 * Pure: mutates the passed `modifiers` and returns it for chaining.
 */
export function applyRouteModifierDeltas(
  modifiers: RunModifiers,
  route: RouteDef,
): RunModifiers {
  for (const [k, v] of Object.entries(route.modifierDeltas)) {
    const modifierBag = modifiers as unknown as Record<string, unknown>;
    const current = modifierBag[k];
    if (typeof current === 'number' && typeof v === 'number') {
      modifierBag[k] = current * v;
    }
  }
  return modifiers;
}
