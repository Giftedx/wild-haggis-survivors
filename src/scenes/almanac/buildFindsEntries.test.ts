import { afterEach, describe, expect, it } from 'vitest';
import {
  createEmptyDiscoveryLog,
  recordItemAcquired,
} from '../../systems/DiscoveryLog';
import { buildFindsEntries, findsDiscoverySummary } from './buildFindsEntries';
import { DEFAULT_LOCALE, ensureLocaleReady, setLocale, t } from '../../core/i18n';
import { WEAPON_DEFS } from '../../data/weapons';
import { PASSIVE_CARDS } from '../../data/upgrades';
import { EVOLUTION_RECIPES } from '../../core/BalanceConfig';
import { PERMANENT_UPGRADES } from '../../data/permanentUpgrades';
import { RELIQUARY_CURIOS } from '../../scenes/game/reliquary';
import { buildFindDetail } from './buildFindDetail';

const RECENT_MECHANIC_FIELD_NOTES = [
  'foundation_09',
  'foundation_10',
  'foundation_11',
  'foundation_12',
  'foundation_13',
  'foundation_14',
] as const;

afterEach(() => {
  setLocale(DEFAULT_LOCALE);
});

describe('buildFindsEntries', () => {
  it('yields one entry per acquirable thing across all seven categories', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog());
    const expectedCount =
      Object.keys(WEAPON_DEFS).length +
      EVOLUTION_RECIPES.length +
      PASSIVE_CARDS.length +
      PERMANENT_UPGRADES.length +
      RELIQUARY_CURIOS.length +
      25 + // old drover lore arc
      1 +  // maker's-note colophon (DESIGN_IDEAS §13)
      14;  // foundation lore arc
    expect(entries.length).toBe(expectedCount);
  });

  it('orders categories: weapon → evolution → passive → permanent → relic → lore → foundation', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog());
    const indexOfFirst = (cat: string) => entries.findIndex((e) => e.category === cat);
    expect(indexOfFirst('weapon')).toBeLessThan(indexOfFirst('evolution'));
    expect(indexOfFirst('evolution')).toBeLessThan(indexOfFirst('passive'));
    expect(indexOfFirst('passive')).toBeLessThan(indexOfFirst('permanent'));
    expect(indexOfFirst('permanent')).toBeLessThan(indexOfFirst('relic'));
    expect(indexOfFirst('relic')).toBeLessThan(indexOfFirst('lore'));
    expect(indexOfFirst('lore')).toBeLessThan(indexOfFirst('foundation'));
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

describe("maker's-note colophon — Celtic pattern credit (DESIGN_IDEAS §13)", () => {
  it('sits at the tail of the lore book, after the 25 drover slots', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog());
    const loreEntries = entries.filter((e) => e.category === 'lore');
    expect(loreEntries).toHaveLength(26);
    expect(loreEntries[loreEntries.length - 1].key).toBe('makers_note');
  });

  it('is always acquired — a colophon, not a collectible', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog(), 0, 0);
    const note = entries.find((e) => e.key === 'makers_note')!;
    expect(note.acquired).toBe(true);
    expect(note.acquireCount).toBe(1);
    expect(note.category).toBe('lore');
  });

  it('title and body resolve to real copy in both locales', async () => {
    const note = buildFindsEntries(createEmptyDiscoveryLog()).find(
      (e) => e.key === 'makers_note',
    )!;
    await ensureLocaleReady('scs');
    for (const locale of ['en', 'scs'] as const) {
      setLocale(locale);
      const title = t(note.nameKey);
      const body = t(note.descKey);
      expect(title, `${locale} title`).not.toBe(note.nameKey);
      expect(body, `${locale} body`).not.toBe(note.descKey);
      // The credit must actually name the three traditions it honours.
      expect(body).toMatch(/Pict/);
      expect(body).toMatch(/Mackintosh/);
      expect(body).toMatch(/Iona/);
    }
  });
});

describe('Foundation entries — Haggis Wildlife Foundation lore arc', () => {
  it('renders 14 foundation entries with acquired=false when fieldNotesLifetime=0', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog(), 0, 0);
    const found = entries.filter((e) => e.key.startsWith('foundation_'));
    expect(found).toHaveLength(14);
    expect(found.every((e) => e.acquired === false)).toBe(true);
  });

  it('unlocks entries in threshold order [1,3,7,12,20,30,50,75]', () => {
    const thresholds = [1, 3, 7, 12, 20, 30, 50, 75] as const;
    for (let i = 0; i < thresholds.length; i++) {
      const entries = buildFindsEntries(createEmptyDiscoveryLog(), 0, thresholds[i]);
      const found = entries.filter((e) => e.key.startsWith('foundation_'));
      const unlocked = found.filter((e) => e.acquired);
      expect(unlocked).toHaveLength(i + 1);
    }
  });

  it('unlocks none when fieldNotesLifetime is below first threshold (1)', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog(), 0, 0);
    const found = entries.filter((e) => e.key.startsWith('foundation_'));
    expect(found.every((e) => e.acquired === false)).toBe(true);
  });

  it('unlocks the original 8-note Foundation arc when fieldNotesLifetime >= 75', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog(), 0, 75);
    const found = entries.filter((e) => e.key.startsWith('foundation_'));
    expect(found.slice(0, 8).every((e) => e.acquired === true)).toBe(true);
    expect(found.slice(8).every((e) => e.acquired === false)).toBe(true);
  });

  it('adds recent-mechanic field notes after the original Foundation arc', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog(), 0, 165);
    const recentNotes = entries.filter((e) =>
      RECENT_MECHANIC_FIELD_NOTES.includes(e.key as typeof RECENT_MECHANIC_FIELD_NOTES[number]),
    );
    expect(recentNotes.map((e) => e.key)).toEqual([...RECENT_MECHANIC_FIELD_NOTES]);
    expect(recentNotes.every((e) => e.category === 'foundation')).toBe(true);
    expect(recentNotes.every((e) => e.acquired === true)).toBe(true);
  });

  it('recent-mechanic field notes resolve in EN and SCS without raw keys', async () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog(), 0, 165);
    const recentNotes = entries.filter((e) =>
      RECENT_MECHANIC_FIELD_NOTES.includes(e.key as typeof RECENT_MECHANIC_FIELD_NOTES[number]),
    );
    expect(recentNotes).toHaveLength(RECENT_MECHANIC_FIELD_NOTES.length);

    for (const entry of recentNotes) {
      const detail = buildFindDetail(entry);
      setLocale('en');
      expect(t(detail.titleKey), entry.key + ' EN title').not.toBe(detail.titleKey);
      expect(t(detail.descKey), entry.key + ' EN desc').not.toBe(detail.descKey);

      await ensureLocaleReady('scs');
      setLocale('scs');
      expect(t(detail.titleKey), entry.key + ' SCS title').not.toBe(detail.titleKey);
      expect(t(detail.descKey), entry.key + ' SCS desc').not.toBe(detail.descKey);
    }
  });

  it('all foundation entries have category "foundation"', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog(), 0, 0);
    const found = entries.filter((e) => e.key.startsWith('foundation_'));
    expect(found.every((e) => e.category === 'foundation')).toBe(true);
  });

  it('uses ui.almanac.foundation.NN as both nameKey and descKey', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog(), 0, 1);
    const first = entries.find((e) => e.key === 'foundation_01')!;
    expect(first).toBeDefined();
    expect(first.nameKey).toBe('ui.almanac.foundation.01');
    expect(first.descKey).toBe('ui.almanac.foundation.01');
  });

  it('appears after lore (Old Drover) in the category ordering', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog(), 1, 1);
    const lastDroverIdx = entries.reduce(
      (max, e, i) => (e.category === 'lore' ? i : max),
      -1,
    );
    const firstFoundationIdx = entries.findIndex((e) => e.category === 'foundation');
    expect(firstFoundationIdx).toBeGreaterThan(lastDroverIdx);
  });

  it('defaults to 0 fieldNotesLifetime when third arg is omitted (backward compat)', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog(), 0);
    const found = entries.filter((e) => e.key.startsWith('foundation_'));
    expect(found).toHaveLength(14);
    expect(found.every((e) => e.acquired === false)).toBe(true);
  });
});

describe('findsDiscoverySummary', () => {
  it('counts acquired vs total', () => {
    let log = createEmptyDiscoveryLog();
    log = recordItemAcquired(log, 'thistle_shot', 'run-1', 100);
    log = recordItemAcquired(log, 'sporran', 'run-1', 200);
    const entries = buildFindsEntries(log);
    const summary = findsDiscoverySummary(entries);
    // 2 acquired items + the always-acquired maker's-note colophon.
    expect(summary.acquired).toBe(3);
    expect(summary.total).toBe(entries.length);
  });

  it('a cold DiscoveryLog counts only the always-acquired colophon', () => {
    const entries = buildFindsEntries(createEmptyDiscoveryLog());
    expect(findsDiscoverySummary(entries).acquired).toBe(1);
  });
});
