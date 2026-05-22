import { describe, expect, it } from 'vitest';
import {
  createEmptyDiscoveryLog,
  recordItemAcquired,
} from '../../systems/DiscoveryLog';
import { buildFindsEntries, findsDiscoverySummary } from './buildFindsEntries';
import { WEAPON_DEFS } from '../../data/weapons';
import { PASSIVE_CARDS } from '../../data/upgrades';
import { EVOLUTION_RECIPES } from '../../core/BalanceConfig';
import { PERMANENT_UPGRADES } from '../../data/permanentUpgrades';
import { RELIQUARY_CURIOS } from '../../scenes/game/reliquary';

describe('buildFindsEntries', () => {
  it('yields one entry per acquirable thing across all six categories', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog());
    const expectedCount =
      Object.keys(WEAPON_DEFS).length +
      EVOLUTION_RECIPES.length +
      PASSIVE_CARDS.length +
      PERMANENT_UPGRADES.length +
      RELIQUARY_CURIOS.length +
      25; // old drover lore arc
    expect(entries.length).toBe(expectedCount);
  });

  it('orders categories: weapon → evolution → passive → permanent → relic', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog());
    const indexOfFirst = (cat: string) => entries.findIndex((e) => e.category === cat);
    expect(indexOfFirst('weapon')).toBeLessThan(indexOfFirst('evolution'));
    expect(indexOfFirst('evolution')).toBeLessThan(indexOfFirst('passive'));
    expect(indexOfFirst('passive')).toBeLessThan(indexOfFirst('permanent'));
    expect(indexOfFirst('permanent')).toBeLessThan(indexOfFirst('relic'));
  });

  it('marks an unacquired find with acquired=false, count=0, null firstAcquiredAt', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog());
    const sporran = entries.find((e) => e.key === 'sporran')!;
    expect(sporran.acquired).toBe(false);
    expect(sporran.acquireCount).toBe(0);
    expect(sporran.firstAcquiredAt).toBeNull();
  });

  it('reads acquire count off a populated DiscoveryLog', () => {
    let log = createEmptyDiscoveryLog();
    log = recordItemAcquired(log, 'thistle_shot', 'run-1', 100);
    log = recordItemAcquired(log, 'thistle_shot', 'run-2', 200);
    log = recordItemAcquired(log, 'thick_hide', 'shop', 300);
    const entries = buildFindsEntries(log);
    const thistle = entries.find((e) => e.key === 'thistle_shot')!;
    const hide = entries.find((e) => e.key === 'thick_hide')!;
    expect(thistle.acquired).toBe(true);
    expect(thistle.acquireCount).toBe(2);
    expect(thistle.firstAcquiredAt).toEqual({ runId: 'run-1', timestamp: 100 });
    expect(hide.category).toBe('permanent');
    expect(hide.acquired).toBe(true);
  });

  it('exposes i18n keys per category so the renderer can resolve display copy', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog());
    const thistleShot = entries.find((e) => e.key === 'thistle_shot')!;
    const sporran = entries.find((e) => e.key === 'sporran')!;
    const evolution = entries.find((e) => e.category === 'evolution')!;
    const relic = entries.find((e) => e.category === 'relic')!;
    expect(thistleShot.nameKey).toBe('weapon.thistle_shot.name');
    expect(sporran.nameKey).toBe('upgradeCard.add_sporran.name');
    expect(evolution.nameKey).toMatch(/^evolution\./);
    expect(relic.nameKey).toMatch(/^ui\.reliquary\./);
  });

  it('includes the starter weapon (thistle_shot) — not just the unlockable WEAPON_CARDS', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog());
    const thistle = entries.find((e) => e.key === 'thistle_shot');
    expect(thistle).toBeDefined();
    expect(thistle!.category).toBe('weapon');
  });

  it('keeps category keys distinct — weapon "thistle_shot" doesn\'t collide with passive "thistle_crown"', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog());
    const ts = entries.find((e) => e.key === 'thistle_shot')!;
    const tc = entries.find((e) => e.key === 'thistle_crown')!;
    expect(ts.category).toBe('weapon');
    expect(tc.category).toBe('passive');
  });
});

describe('Old Drover entry — The Moor Remembers reveal arc', () => {
  it('renders 25 lore entries with acquired=false default state when 0 revealed', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog(), 0);
    const droverEntries = entries.filter((e) => e.key.startsWith('old_drover_'));
    expect(droverEntries).toHaveLength(25);
    expect(droverEntries.every((e) => e.acquired === false)).toBe(true);
  });

  it('unlocks revealed entries in narrative order when 7 revealed', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog(), 7);
    const droverEntries = entries.filter((e) => e.key.startsWith('old_drover_'));
    const unlocked = droverEntries.filter((e) => e.acquired);
    const locked = droverEntries.filter((e) => !e.acquired);
    expect(unlocked).toHaveLength(7);
    expect(locked).toHaveLength(18);
    expect(droverEntries[0].acquired).toBe(true);   // old_drover_01 unlocked
    expect(droverEntries[6].acquired).toBe(true);   // old_drover_07 unlocked
    expect(droverEntries[7].acquired).toBe(false);  // old_drover_08 locked
  });

  it('marks all 25 acquired when count is 25', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog(), 25);
    const droverEntries = entries.filter((e) => e.key.startsWith('old_drover_'));
    expect(droverEntries.every((e) => e.acquired === true)).toBe(true);
  });

  it('uses ui.cairn.grandfather.NN as both nameKey and descKey', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog(), 1);
    const first = entries.find((e) => e.key === 'old_drover_01')!;
    expect(first).toBeDefined();
    expect(first.nameKey).toBe('ui.cairn.grandfather.01');
    expect(first.descKey).toBe('ui.cairn.grandfather.01');
  });

  it('has category lore for all drover entries', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog(), 0);
    const droverEntries = entries.filter((e) => e.key.startsWith('old_drover_'));
    expect(droverEntries.every((e) => e.category === 'lore')).toBe(true);
  });

  it('appears after relics in the category ordering', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog(), 1);
    const lastRelicIdx = entries.reduce(
      (max, e, i) => (e.category === 'relic' ? i : max),
      -1,
    );
    const firstDroverIdx = entries.findIndex((e) => e.key === 'old_drover_01');
    expect(firstDroverIdx).toBeGreaterThan(lastRelicIdx);
  });

  it('defaults to 0 revealed when second arg is omitted (backward compat)', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog());
    const droverEntries = entries.filter((e) => e.key.startsWith('old_drover_'));
    expect(droverEntries).toHaveLength(25);
    expect(droverEntries.every((e) => e.acquired === false)).toBe(true);
  });
});

describe('findsDiscoverySummary', () => {
  it('counts acquired vs total', () => {
    let log = createEmptyDiscoveryLog();
    log = recordItemAcquired(log, 'thistle_shot', 'run-1', 100);
    log = recordItemAcquired(log, 'sporran', 'run-1', 200);
    const entries = buildFindsEntries(log);
    const summary = findsDiscoverySummary(entries);
    expect(summary.acquired).toBe(2);
    expect(summary.total).toBe(entries.length);
  });

  it('returns 0 acquired on a cold DiscoveryLog', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog());
    expect(findsDiscoverySummary(entries).acquired).toBe(0);
  });
});
