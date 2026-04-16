import { describe, expect, it } from 'vitest';
import { ROUTES, ROUTES_BY_SLOT, getRoute, type RouteKey } from './routes';

describe('ROUTES table', () => {
  it('contains exactly 6 routes', () => {
    expect(ROUTES).toHaveLength(6);
  });

  it('exposes 3 routes per picker slot', () => {
    expect(ROUTES_BY_SLOT.A).toHaveLength(3);
    expect(ROUTES_BY_SLOT.B).toHaveLength(3);
  });

  it('all route keys are unique', () => {
    const keys = new Set(ROUTES.map((r) => r.key));
    expect(keys.size).toBe(ROUTES.length);
  });

  it('picker A contains up_the_brae / round_the_loch / through_the_kirkyard', () => {
    const keys = ROUTES_BY_SLOT.A.map((r) => r.key).sort();
    expect(keys).toEqual(['round_the_loch', 'through_the_kirkyard', 'up_the_brae']);
  });

  it('picker B contains buckie_pitstop / run_for_the_hills / stand_yer_ground', () => {
    const keys = ROUTES_BY_SLOT.B.map((r) => r.key).sort();
    expect(keys).toEqual(['buckie_pitstop', 'run_for_the_hills', 'stand_yer_ground']);
  });

  it('every route has non-empty labelKey and descKey', () => {
    for (const r of ROUTES) {
      expect(r.labelKey).toMatch(/^routes\.[a-z_]+\.label$/);
      expect(r.descKey).toMatch(/^routes\.[a-z_]+\.desc$/);
    }
  });

  it('getRoute looks up by key', () => {
    const k: RouteKey = 'up_the_brae';
    expect(getRoute(k).slot).toBe('A');
  });

  it('getRoute throws on unknown key', () => {
    expect(() => getRoute('not_a_route' as RouteKey)).toThrow(/unknown route key/);
  });
});
