import { describe, expect, it } from 'vitest';
import {
  actIntermissionCardStartX,
  actIntermissionShortcutIndex,
  applyRouteModifierDeltas,
  buildRoutePick,
  resolveDefaultRoute,
} from './actIntermissionResolve';
import { DEFAULT_ROUTE_ON_SKIP, ROUTES_BY_SLOT, getRoute, type RouteDef } from '../data/routes';
import { defaultModifiers } from '../core/RunModifiers';

/**
 * W2 Moor Road: pure helpers that GameScene calls when
 * skipActIntermissions=true (resolveDefaultRoute) and that
 * ActIntermissionScene uses when a card is clicked (buildRoutePick).
 * Verifies the contract the scene depends on so refactors can't silently
 * change the saved RoutePick shape.
 */
describe('buildRoutePick', () => {
  const route = ROUTES_BY_SLOT.A[0];

  it('mirrors the RouteDef slot + key', () => {
    const pick = buildRoutePick(route, 120);
    expect(pick.slot).toBe(route.slot);
    expect(pick.routeKey).toBe(route.key);
  });

  it('records the passed game time', () => {
    const pick = buildRoutePick(route, 456.7);
    expect(pick.atGameTimeSec).toBe(456.7);
  });

  it('defaults defaultedBySetting to false when omitted', () => {
    const pick = buildRoutePick(route, 0);
    expect(pick.defaultedBySetting).toBe(false);
  });

  it('respects defaultedBySetting=true when passed', () => {
    const pick = buildRoutePick(route, 0, { defaultedBySetting: true });
    expect(pick.defaultedBySetting).toBe(true);
  });

  it('respects defaultedBySetting=false when passed explicitly', () => {
    const pick = buildRoutePick(route, 0, { defaultedBySetting: false });
    expect(pick.defaultedBySetting).toBe(false);
  });
});

describe('resolveDefaultRoute', () => {
  it('returns the slot-A default when slot=A', () => {
    const { pick, route } = resolveDefaultRoute('A', 60);
    expect(pick.slot).toBe('A');
    expect(pick.routeKey).toBe(DEFAULT_ROUTE_ON_SKIP.A);
    expect(route.key).toBe(DEFAULT_ROUTE_ON_SKIP.A);
    expect(route.slot).toBe('A');
  });

  it('returns the slot-B default when slot=B', () => {
    const { pick, route } = resolveDefaultRoute('B', 900);
    expect(pick.slot).toBe('B');
    expect(pick.routeKey).toBe(DEFAULT_ROUTE_ON_SKIP.B);
    expect(route.key).toBe(DEFAULT_ROUTE_ON_SKIP.B);
    expect(route.slot).toBe('B');
  });

  it('marks the pick as defaultedBySetting=true (always)', () => {
    expect(resolveDefaultRoute('A', 0).pick.defaultedBySetting).toBe(true);
    expect(resolveDefaultRoute('B', 0).pick.defaultedBySetting).toBe(true);
  });

  it('records the passed game time', () => {
    expect(resolveDefaultRoute('A', 123).pick.atGameTimeSec).toBe(123);
    expect(resolveDefaultRoute('B', 456).pick.atGameTimeSec).toBe(456);
  });
});

describe('applyRouteModifierDeltas', () => {
  it('replaces numeric fields on the modifiers bag', () => {
    const m = defaultModifiers();
    // through_the_kirkyard sets spawnIntervalMult: 0.7
    const route = getRoute('through_the_kirkyard');
    expect(route.modifierDeltas.spawnIntervalMult).toBeDefined();
    applyRouteModifierDeltas(m, route);
    expect(m.spawnIntervalMult).toBe(route.modifierDeltas.spawnIntervalMult);
  });

  it('returns the same modifier reference for chaining', () => {
    const m = defaultModifiers();
    const ret = applyRouteModifierDeltas(m, getRoute('through_the_kirkyard'));
    expect(ret).toBe(m);
  });

  it('leaves untouched fields at their existing values', () => {
    const m = defaultModifiers();
    m.goldMult = 1.5; // pre-existing curse-applied bonus
    applyRouteModifierDeltas(m, getRoute('through_the_kirkyard'));
    expect(m.goldMult).toBe(1.5);
  });

  it('skips non-numeric keys (routePicks array is owned by RunActState)', () => {
    const m = defaultModifiers();
    const beforePicks = m.routePicks;
    // Synthesize a route-like with a stray array delta — should NOT overwrite picks.
    // Cast bypasses the narrowed `RouteModifierDeltaKey` contract to
    // prove the applicator stays defensive even against malformed data.
    const fakeRoute = {
      ...getRoute('up_the_brae'),
      modifierDeltas: { routePicks: [{}] } as unknown as RouteDef['modifierDeltas'],
    };
    applyRouteModifierDeltas(m, fakeRoute);
    expect(m.routePicks).toBe(beforePicks);
  });

  it('routes with empty modifierDeltas leave the bag unchanged', () => {
    const m = defaultModifiers();
    const original = { ...m };
    applyRouteModifierDeltas(m, {
      ...getRoute('up_the_brae'),
      modifierDeltas: {},
    });
    expect(m).toEqual(original);
  });

  it('propagates a weaponCooldownMult delta onto the bag (so onResolve can resync the cache)', () => {
    // No authored route currently writes this field, but the narrowed
    // RouteModifierDeltaKey contract allows it — exercise the path so
    // a future route doesn't ship with the field silently rounded off.
    const m = defaultModifiers();
    const route: RouteDef = {
      ...getRoute('up_the_brae'),
      modifierDeltas: { weaponCooldownMult: 1.2 },
    };
    applyRouteModifierDeltas(m, route);
    expect(m.weaponCooldownMult).toBe(1.2);
  });

  it('propagates a damageTakenMult delta onto the bag (live-read by hazard + player hit paths)', () => {
    const m = defaultModifiers();
    const route: RouteDef = {
      ...getRoute('up_the_brae'),
      modifierDeltas: { damageTakenMult: 0.85 },
    };
    applyRouteModifierDeltas(m, route);
    expect(m.damageTakenMult).toBe(0.85);
  });

  it('propagates a goldMult delta onto the bag (live-read at run end)', () => {
    const m = defaultModifiers();
    const route: RouteDef = {
      ...getRoute('up_the_brae'),
      modifierDeltas: { goldMult: 1.25 },
    };
    applyRouteModifierDeltas(m, route);
    expect(m.goldMult).toBe(1.25);
  });
});

describe('actIntermissionCardStartX', () => {
  it('centres a single card at viewport middle', () => {
    // One card, width 240 → startX is its centre = viewport / 2.
    expect(actIntermissionCardStartX(1000, 1, 240, 32)).toBe(500);
  });

  it('centres a three-card row symmetrically', () => {
    // 3 cards * 240 + 2 gaps * 32 = 784 total; (1000-784)/2 + 120 = 108 + 120 = 228.
    const startX = actIntermissionCardStartX(1000, 3, 240, 32);
    expect(startX).toBe(228);
    // Card 2 centre = startX + 2 * (240 + 32) = 228 + 544 = 772.
    // The row spans from (startX - cardW/2) = 108 to (card2Centre + cardW/2) = 892.
    // Total span = 892 - 108 = 784 — matches the totalW computation.
    expect(772 + 120 - (228 - 120)).toBe(784);
  });

  it('returns viewport centre for a 0-card row (defensive)', () => {
    expect(actIntermissionCardStartX(1000, 0, 240, 32)).toBe(500);
  });

  it('gap of 0 collapses row width to cardCount * cardW', () => {
    // 3 cards at 100 with 0 gap → totalW = 300; startX = (1000-300)/2 + 50 = 400.
    expect(actIntermissionCardStartX(1000, 3, 100, 0)).toBe(400);
  });

  it('narrow viewport pushes the row off-centre consistently', () => {
    // 3 cards at 240 + 2 * 32 gap = 784 total; viewport 500 < total.
    // startX = (500 - 784)/2 + 120 = -142 + 120 = -22 (negative, cards draw partly off-screen).
    expect(actIntermissionCardStartX(500, 3, 240, 32)).toBe(-22);
  });
});

describe('actIntermissionShortcutIndex', () => {
  it('maps "1", "2", "3" to zero-based indices', () => {
    expect(actIntermissionShortcutIndex('1')).toBe(0);
    expect(actIntermissionShortcutIndex('2')).toBe(1);
    expect(actIntermissionShortcutIndex('3')).toBe(2);
  });

  it('returns null for keys outside the 1..3 range', () => {
    expect(actIntermissionShortcutIndex('0')).toBeNull();
    expect(actIntermissionShortcutIndex('4')).toBeNull();
    expect(actIntermissionShortcutIndex('9')).toBeNull();
  });

  it('returns null for non-digit keys', () => {
    expect(actIntermissionShortcutIndex('a')).toBeNull();
    expect(actIntermissionShortcutIndex('Enter')).toBeNull();
    expect(actIntermissionShortcutIndex(' ')).toBeNull();
    expect(actIntermissionShortcutIndex('')).toBeNull();
  });

  it('is case sensitive — "A" (not a digit) returns null', () => {
    expect(actIntermissionShortcutIndex('A')).toBeNull();
  });
});
