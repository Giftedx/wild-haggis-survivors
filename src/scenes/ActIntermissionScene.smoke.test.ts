import { describe, expect, it } from 'vitest';
import type { RouteDef, RoutePick } from '../data/routes';
import { getRoute } from '../data/routes';
import { resolveDefaultRoute } from './actIntermissionResolve';

/**
 * Tests the pure resolveDefaultRoute helper directly — importing
 * ActIntermissionScene.ts would pull in Phaser, which touches `window`
 * at module eval and blows up under the node-env vitest config.
 */
describe('resolveDefaultRoute', () => {
  it('produces a defaultedBySetting RoutePick for slot A (round_the_loch)', () => {
    const { pick, route } = resolveDefaultRoute('A', 305);
    expect(pick).toEqual<RoutePick>({
      slot: 'A',
      routeKey: 'round_the_loch',
      atGameTimeSec: 305,
      defaultedBySetting: true,
    });
    expect(route).toEqual<RouteDef>(getRoute('round_the_loch'));
  });

  it('produces a defaultedBySetting RoutePick for slot B (stand_yer_ground)', () => {
    const { pick, route } = resolveDefaultRoute('B', 610);
    expect(pick.routeKey).toBe('stand_yer_ground');
    expect(pick.defaultedBySetting).toBe(true);
    expect(route.slot).toBe('B');
  });
});
