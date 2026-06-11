import { describe, expect, it } from 'vitest';
import type { RouteDef } from '../data/routes';
import { buildRoutePick } from './actIntermissionResolve';

/**
 * Integration test for the Scene → GameScene onResolve callback contract.
 *
 * Exercises `buildRoutePick` directly instead of the scene class — the
 * scene delegates resolve() to this helper, so testing it proves the
 * payload shape without loading Phaser under the node-env vitest config.
 */
describe('ActIntermissionScene.resolve contract', () => {
  it('builds a complete RoutePick on a direct pick', () => {
    const route: RouteDef = {
      key: 'up_the_brae', slot: 'A',
      labelKey: 'routes.up_the_brae.label',
      descKey: 'routes.up_the_brae.desc',
      modifierDeltas: {},
    };
    const pick = buildRoutePick(route, 305);
    expect(pick).toEqual({
      slot: 'A', routeKey: 'up_the_brae',
      atGameTimeSec: 305, defaultedBySetting: false,
    });
  });

  it('flags defaultedBySetting when the skip path resolves', () => {
    const route: RouteDef = {
      key: 'stand_yer_ground', slot: 'B',
      labelKey: 'routes.stand_yer_ground.label',
      descKey: 'routes.stand_yer_ground.desc',
      modifierDeltas: {},
    };
    const pick = buildRoutePick(route, 605, { defaultedBySetting: true });
    expect(pick.defaultedBySetting).toBe(true);
    expect(pick.slot).toBe('B');
    expect(pick.routeKey).toBe('stand_yer_ground');
    expect(pick.atGameTimeSec).toBe(605);
  });

  it('full happy-path chain — buildRoutePick feeds GameScene onResolve shape', () => {
    const calls: Array<{ pick: unknown; routeKey: string }> = [];
    // Simulates the GameScene onResolve closure written in Task 14.
    const fakeOnResolve = (pick: ReturnType<typeof buildRoutePick>, route: RouteDef) => {
      calls.push({ pick, routeKey: route.key });
    };
    const route: RouteDef = {
      key: 'through_the_kirkyard', slot: 'A',
      labelKey: 'routes.through_the_kirkyard.label',
      descKey: 'routes.through_the_kirkyard.desc',
      modifierDeltas: { spawnIntervalMult: 0.7 },
    };
    fakeOnResolve(buildRoutePick(route, 300), route);

    expect(calls).toHaveLength(1);
    expect(calls[0].routeKey).toBe('through_the_kirkyard');
    expect(calls[0].pick).toMatchObject({
      slot: 'A', routeKey: 'through_the_kirkyard',
      atGameTimeSec: 300, defaultedBySetting: false,
    });
  });
});
