import { describe, expect, it, vi } from 'vitest';
import { resolveRouteLabels, resolveRelicLabels, resolveRuneLabels } from './runIdentityLabels';
import type { RoutePick } from '../../data/routes';
import type { RelicSystem } from '../../systems/RelicSystem';

vi.mock('../../core/i18n', () => ({
  // Identity translator: returns the key verbatim so tests assert
  // labelKey shape without depending on the SCS/EN locale chain.
  t: (k: string): string => `t:${k}`,
}));

vi.mock('../../data/routes', () => ({
  getRoute: (k: string) => {
    if (k === 'unknown_route') throw new Error('boom');
    return { labelKey: `route.${k}.label` };
  },
}));

vi.mock('../../data/runes', () => ({
  RUNES: {
    rune_a: { nameKey: 'runes.rune_a.name' },
    rune_b: { nameKey: 'runes.rune_b.name' },
    // rune_dropped is intentionally absent → resolver should silently drop
  },
}));

describe('resolveRouteLabels', () => {
  it('maps route picks → resolved labels in order', () => {
    const history: RoutePick[] = [
      { routeKey: 'mossy_burn', visitedAt: 0 } as never,
      { routeKey: 'kirkyard', visitedAt: 0 } as never,
    ];
    expect(resolveRouteLabels(history)).toEqual([
      't:route.mossy_burn.label',
      't:route.kirkyard.label',
    ]);
  });

  it('drops picks whose route lookup throws (retired ids)', () => {
    const history: RoutePick[] = [
      { routeKey: 'mossy_burn', visitedAt: 0 } as never,
      { routeKey: 'unknown_route', visitedAt: 0 } as never,
    ];
    expect(resolveRouteLabels(history)).toEqual(['t:route.mossy_burn.label']);
  });

  it('empty history → empty array', () => {
    expect(resolveRouteLabels([])).toEqual([]);
  });
});

describe('resolveRelicLabels', () => {
  it('null relicSystem → empty', () => {
    expect(resolveRelicLabels(null)).toEqual([]);
  });

  it('drops slots with no def + resolves the rest', () => {
    const fakeRelic = {
      getSlots: () => [
        { def: { nameKey: 'relic.sporran.name' } },
        { def: undefined }, // empty slot
        { def: { nameKey: 'relic.dram.name' } },
      ],
    } as unknown as RelicSystem;
    expect(resolveRelicLabels(fakeRelic)).toEqual([
      't:relic.sporran.name',
      't:relic.dram.name',
    ]);
  });
});

describe('resolveRuneLabels', () => {
  it('maps owned ids → labels', () => {
    expect(resolveRuneLabels(['rune_a', 'rune_b'])).toEqual([
      't:runes.rune_a.name',
      't:runes.rune_b.name',
    ]);
  });

  it('silently drops unknown ids', () => {
    expect(resolveRuneLabels(['rune_a', 'rune_dropped', 'rune_b'])).toEqual([
      't:runes.rune_a.name',
      't:runes.rune_b.name',
    ]);
  });

  it('empty owned list → empty array', () => {
    expect(resolveRuneLabels([])).toEqual([]);
  });
});
