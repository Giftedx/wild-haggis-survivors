import { afterEach, describe, expect, it } from 'vitest';
import type { RouteDef, RoutePick } from '../data/routes';
import { getRoute } from '../data/routes';
import { resolveDefaultRoute } from './actIntermissionResolve';
import { DEFAULT_LOCALE, setLocale, t } from '../core/i18n';

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

const ROUTE_KEYS = [
  'up_the_brae', 'round_the_loch', 'through_the_kirkyard',
  'stand_yer_ground', 'run_for_the_hills', 'buckie_pitstop',
] as const;

describe('W2 M3 voice pass: copy quality guardrails', () => {
  it('route labels are <= 5 words', () => {
    for (const k of ROUTE_KEYS) {
      const label = t(`routes.${k}.label`);
      const words = label.split(/\s+/).filter(Boolean);
      expect(words.length, `label "${label}" exceeds 5 words`).toBeLessThanOrEqual(5);
    }
  });

  it('route descriptions are <= 15 words', () => {
    for (const k of ROUTE_KEYS) {
      const desc = t(`routes.${k}.desc`);
      const words = desc.split(/\s+/).filter(Boolean);
      expect(words.length, `desc "${desc}" exceeds 15 words`).toBeLessThanOrEqual(15);
    }
  });

  it('no route string is a bare placeholder (TODO / TBD / XXX / PLACEHOLDER)', () => {
    for (const k of ROUTE_KEYS) {
      for (const suffix of ['label', 'desc'] as const) {
        const s = t(`routes.${k}.${suffix}`).toUpperCase();
        expect(s).not.toMatch(/\b(TODO|TBD|XXX|FIXME|PLACEHOLDER)\b/);
      }
    }
  });
});

/**
 * The W2 M3 voice card budget (label ≤5 words, desc ≤15 words) protects
 * the picker layout — long route copy overflows the card. The Scots
 * overlay must respect the same budget or the layout breaks under
 * `localeKey: 'scs'`.
 */
describe('W18 Scots overlay: route copy still fits voice-card budget', () => {
  afterEach(() => setLocale(DEFAULT_LOCALE));

  it('Scots route labels are <= 5 words', () => {
    setLocale('scs');
    for (const k of ROUTE_KEYS) {
      const label = t(`routes.${k}.label`);
      const words = label.split(/\s+/).filter(Boolean);
      expect(words.length, `scs label "${label}" exceeds 5 words`).toBeLessThanOrEqual(5);
    }
  });

  it('Scots route descriptions are <= 15 words', () => {
    setLocale('scs');
    for (const k of ROUTE_KEYS) {
      const desc = t(`routes.${k}.desc`);
      const words = desc.split(/\s+/).filter(Boolean);
      expect(words.length, `scs desc "${desc}" exceeds 15 words`).toBeLessThanOrEqual(15);
    }
  });
});
