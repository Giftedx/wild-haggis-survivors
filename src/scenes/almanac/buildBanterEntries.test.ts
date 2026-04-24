import { describe, expect, it } from 'vitest';
import {
  createEmptyDiscoveryLog,
  recordBanterHeard,
} from '../../systems/DiscoveryLog';
import { BANTER_POOLS } from '../../data/banter';
import { buildBanterEntries, banterDiscoverySummary } from './buildBanterEntries';

describe('buildBanterEntries', () => {
  it('yields one entry per declared BanterPool', () => {
    const entries = buildBanterEntries(createEmptyDiscoveryLog());
    expect(entries.length).toBe(BANTER_POOLS.length);
  });

  it('orders pools by priority descending (first_time@110 leads)', () => {
    const entries = buildBanterEntries(createEmptyDiscoveryLog());
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i - 1].priority).toBeGreaterThanOrEqual(entries[i].priority);
    }
    expect(entries[0].context).toBe('first_time');
  });

  it('flattens every generic and sub-pool key into lines with the correct tag', () => {
    const entries = buildBanterEntries(createEmptyDiscoveryLog());
    const bossWarn = entries.find((e) => e.context === 'boss_warn')!;
    const pool = BANTER_POOLS.find((p) => p.context === 'boss_warn')!;
    const generic = bossWarn.lines.filter((l) => l.tag === null);
    expect(generic.map((l) => l.key)).toEqual(pool.keys);
    const gordon = bossWarn.lines.filter((l) => l.tag === 'gordon');
    expect(gordon.map((l) => l.key)).toEqual(pool.keysByTag!.gordon);
  });

  it('counts heard lines and preserves hearCount + firstHeardAt from the log', () => {
    let log = createEmptyDiscoveryLog();
    log = recordBanterHeard(log, 'ui.banter.low_hp.a', 'run-1', 500);
    log = recordBanterHeard(log, 'ui.banter.low_hp.a', 'run-1', 501);
    const lowHp = buildBanterEntries(log).find((e) => e.context === 'low_hp')!;
    expect(lowHp.heardLines).toBe(1);
    const heardLine = lowHp.lines.find((l) => l.key === 'ui.banter.low_hp.a')!;
    expect(heardLine.heard).toBe(true);
    expect(heardLine.hearCount).toBe(2);
    expect(heardLine.firstHeardAt).toEqual({ runId: 'run-1', timestamp: 500 });
  });

  it('flags rare pools (first_time, burns_citation, reliquary_pick) and not regular ones', () => {
    const entries = buildBanterEntries(createEmptyDiscoveryLog());
    const byKey = Object.fromEntries(entries.map((e) => [e.context, e]));
    expect(byKey.first_time.rare).toBe(true);
    expect(byKey.burns_citation.rare).toBe(true);
    expect(byKey.reliquary_pick.rare).toBe(true);
    expect(byKey.idle.rare).toBe(false);
    expect(byKey.boss_warn.rare).toBe(false);
  });
});

describe('banterDiscoverySummary', () => {
  it('reports zero on an empty log', () => {
    const s = banterDiscoverySummary(buildBanterEntries(createEmptyDiscoveryLog()));
    expect(s.heardLines).toBe(0);
    expect(s.poolsDiscovered).toBe(0);
    expect(s.poolsTotal).toBe(BANTER_POOLS.length);
    expect(s.totalLines).toBeGreaterThan(0); // every pool declares keys
  });

  it('counts pools with at least one heard line as discovered', () => {
    let log = createEmptyDiscoveryLog();
    log = recordBanterHeard(log, 'ui.banter.idle.a', 'run-1', 1);
    log = recordBanterHeard(log, 'ui.banter.low_hp.b', 'run-1', 2);
    const s = banterDiscoverySummary(buildBanterEntries(log));
    expect(s.heardLines).toBe(2);
    expect(s.poolsDiscovered).toBe(2);
  });
});
