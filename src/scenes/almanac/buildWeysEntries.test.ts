import { describe, expect, it } from 'vitest';
import {
  createEmptyDiscoveryLog,
  recordRoutePicked,
} from '../../systems/DiscoveryLog';
import { buildWeysEntries, weysDiscoverySummary } from './buildWeysEntries';
import { ROUTES } from '../../data/routes';

describe('buildWeysEntries', () => {
  it('yields one entry per route in the registry', () => {
    const entries = buildWeysEntries(createEmptyDiscoveryLog());
    expect(entries.length).toBe(ROUTES.length);
  });

  it('orders slot A first, then slot B (matches in-run reveal order)', () => {
    const entries = buildWeysEntries(createEmptyDiscoveryLog());
    const slotASection = entries.filter((e) => e.slot === 'A');
    const slotBSection = entries.filter((e) => e.slot === 'B');
    // All A entries come before any B entry.
    const lastA = entries.lastIndexOf(slotASection[slotASection.length - 1]);
    const firstB = entries.indexOf(slotBSection[0]);
    expect(lastA).toBeLessThan(firstB);
  });

  it('marks an unwalked route with picked=false, pickCount=0, null firstPickedAt', () => {
    const entries = buildWeysEntries(createEmptyDiscoveryLog());
    const brae = entries.find((e) => e.key === 'up_the_brae')!;
    expect(brae.picked).toBe(false);
    expect(brae.pickCount).toBe(0);
    expect(brae.firstPickedAt).toBeNull();
  });

  it('reads pick counts off a populated DiscoveryLog', () => {
    let log = createEmptyDiscoveryLog();
    log = recordRoutePicked(log, 'up_the_brae', 'run-1', 100);
    log = recordRoutePicked(log, 'up_the_brae', 'run-2', 200);
    log = recordRoutePicked(log, 'round_the_loch', 'run-3', 300);
    const entries = buildWeysEntries(log);
    const brae = entries.find((e) => e.key === 'up_the_brae')!;
    const loch = entries.find((e) => e.key === 'round_the_loch')!;
    expect(brae.picked).toBe(true);
    expect(brae.pickCount).toBe(2);
    expect(brae.firstPickedAt).toEqual({ runId: 'run-1', timestamp: 100 });
    expect(loch.pickCount).toBe(1);
    expect(loch.firstPickedAt).toEqual({ runId: 'run-3', timestamp: 300 });
  });

  it('exposes the route i18n keys so the renderer can resolve label + desc', () => {
    const entries = buildWeysEntries(createEmptyDiscoveryLog());
    const brae = entries.find((e) => e.key === 'up_the_brae')!;
    expect(brae.labelKey).toBe('routes.up_the_brae.label');
    expect(brae.descKey).toBe('routes.up_the_brae.desc');
  });
});

describe('weysDiscoverySummary', () => {
  it('counts picked vs total', () => {
    let log = createEmptyDiscoveryLog();
    log = recordRoutePicked(log, 'up_the_brae', 'run-1', 100);
    log = recordRoutePicked(log, 'stand_yer_ground', 'run-1', 200);
    const entries = buildWeysEntries(log);
    const summary = weysDiscoverySummary(entries);
    expect(summary.picked).toBe(2);
    expect(summary.total).toBe(entries.length);
  });

  it('returns 0 picked on a cold DiscoveryLog', () => {
    const entries = buildWeysEntries(createEmptyDiscoveryLog());
    expect(weysDiscoverySummary(entries).picked).toBe(0);
  });
});
