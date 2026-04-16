import { describe, expect, it } from 'vitest';
import { buildRoutePick, resolveDefaultRoute } from './actIntermissionResolve';
import { DEFAULT_ROUTE_ON_SKIP, ROUTES_BY_SLOT } from '../data/routes';

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
