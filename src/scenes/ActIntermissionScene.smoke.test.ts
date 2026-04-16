import { describe, expect, it } from 'vitest';
import type { RouteDef, RoutePick } from '../data/routes';
import { getRoute } from '../data/routes';
import { resolveDefaultRoute } from './actIntermissionResolve';
import { t } from '../core/i18n';

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

describe('ActIntermissionScene: i18n keys present', () => {
  it('resolves route labels + descs for all 6 keys', () => {
    const keys = [
      'up_the_brae', 'round_the_loch', 'through_the_kirkyard',
      'stand_yer_ground', 'run_for_the_hills', 'buckie_pitstop',
    ] as const;
    for (const k of keys) {
      const labelKey = `routes.${k}.label`;
      const descKey = `routes.${k}.desc`;
      expect(t(labelKey), labelKey).not.toBe(labelKey);
      expect(t(descKey), descKey).not.toBe(descKey);
    }
  });

  it('resolves the two picker titles, hint, and settings label', () => {
    expect(t('ui.actIntermission.title_act_1')).not.toBe('ui.actIntermission.title_act_1');
    expect(t('ui.actIntermission.title_act_2')).not.toBe('ui.actIntermission.title_act_2');
    expect(t('ui.actIntermission.pick_hint')).not.toBe('ui.actIntermission.pick_hint');
    expect(t('ui.settings.skipActIntermissions')).not.toBe('ui.settings.skipActIntermissions');
  });
});
