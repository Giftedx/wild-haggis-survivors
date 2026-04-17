import { describe, expect, it } from 'vitest';
import {
  computeCurseStats,
  computeStandingStonesStats,
  formatAncestralEchoesLine,
  formatCurseStatsLine,
  formatHearthBeatsLine,
  formatPostBellLine,
  formatStandingStonesLine,
} from './chronicleAggregates';
import { createDefaultSave, migrateSave, type RunHistoryEntry, type SaveData } from '../utils/save';

function makeSave(overrides: Partial<SaveData> = {}): SaveData {
  return { ...createDefaultSave(), ...overrides };
}

describe('computeStandingStonesStats', () => {
  it('returns zeros for a save with no stone picks', () => {
    const s = computeStandingStonesStats(makeSave());
    expect(s.total).toBe(0);
    expect(s.byBoon).toEqual({});
    expect(s.favouriteBoon).toBeNull();
  });

  it('sums all boon picks into total', () => {
    const s = computeStandingStonesStats(makeSave({
      standingStonesPicked: { mending: 3, fire: 2, haste: 5 },
    }));
    expect(s.total).toBe(10);
    expect(s.byBoon).toEqual({ mending: 3, fire: 2, haste: 5 });
  });

  it('picks the highest-count boon as favourite', () => {
    const s = computeStandingStonesStats(makeSave({
      standingStonesPicked: { mending: 1, fire: 7, haste: 3 },
    }));
    expect(s.favouriteBoon).toBe('fire');
  });

  it('first-seen wins when two boons tie', () => {
    const s = computeStandingStonesStats(makeSave({
      standingStonesPicked: { mending: 4, fire: 4 },
    }));
    expect(['mending', 'fire']).toContain(s.favouriteBoon);
  });
});

describe('formatStandingStonesLine', () => {
  it('returns empty string when total is 0', () => {
    expect(formatStandingStonesLine({
      total: 0, byBoon: {}, favouriteBoon: null,
    })).toBe('');
  });

  it('formats "Stones walked: N (mending X · fire Y · haste Z)"', () => {
    const line = formatStandingStonesLine({
      total: 10,
      byBoon: { mending: 3, fire: 2, haste: 5 },
      favouriteBoon: 'haste',
    });
    expect(line).toContain('Stones walked: 10');
    expect(line).toContain('mending 3');
    expect(line).toContain('fire 2');
    expect(line).toContain('haste 5');
  });

  it('shows zero for missing boons (no undefined holes)', () => {
    const line = formatStandingStonesLine({
      total: 3,
      byBoon: { mending: 3 },
      favouriteBoon: 'mending',
    });
    expect(line).toContain('fire 0');
    expect(line).toContain('haste 0');
    expect(line).not.toContain('undefined');
  });

  it('appends favourite stone title when sample is large enough', () => {
    const line = formatStandingStonesLine({
      total: 10,
      byBoon: { mending: 3, fire: 2, haste: 5 },
      favouriteBoon: 'haste',
    });
    expect(line.toLowerCase()).toContain('favourite');
    expect(line.toLowerCase()).toContain('haste');
  });

  it('omits favourite suffix below sample threshold', () => {
    const line = formatStandingStonesLine({
      total: 2,
      byBoon: { mending: 1, fire: 1 },
      favouriteBoon: 'mending',
    });
    expect(line.toLowerCase()).not.toContain('favourite');
  });

  it('omits favourite suffix when favouriteBoon is null', () => {
    const line = formatStandingStonesLine({
      total: 9,
      byBoon: { mending: 3, fire: 3, haste: 3 },
      favouriteBoon: null,
    });
    expect(line.toLowerCase()).not.toContain('favourite');
  });
});

describe('formatHearthBeatsLine', () => {
  it('returns empty string when count is 0', () => {
    expect(formatHearthBeatsLine(0)).toBe('');
  });

  it('returns empty string for negative input (defensive)', () => {
    expect(formatHearthBeatsLine(-3)).toBe('');
  });

  it('floors fractional input', () => {
    expect(formatHearthBeatsLine(7.9)).toBe('🌾 Hearth beats: 7');
  });

  it('formats positive counts', () => {
    expect(formatHearthBeatsLine(42)).toBe('🌾 Hearth beats: 42');
  });
});

describe('formatPostBellLine', () => {
  it('returns empty string when bestEndlessSeconds is 0 / undefined', () => {
    expect(formatPostBellLine(makeSave())).toBe('');
    expect(formatPostBellLine(makeSave({ bestEndlessSeconds: 0 }))).toBe('');
  });

  it('returns empty string for negative values (defensive)', () => {
    expect(formatPostBellLine(makeSave({ bestEndlessSeconds: -5 }))).toBe('');
  });

  it('formats "M:SS" with zero-padded seconds', () => {
    expect(formatPostBellLine(makeSave({ bestEndlessSeconds: 65 }))).toBe('🔔 Past the bell — best 1:05');
  });

  it('handles sub-minute durations', () => {
    expect(formatPostBellLine(makeSave({ bestEndlessSeconds: 7 }))).toBe('🔔 Past the bell — best 0:07');
  });

  it('handles long Post-Bell streaks (multi-minute)', () => {
    expect(formatPostBellLine(makeSave({ bestEndlessSeconds: 645 }))).toBe('🔔 Past the bell — best 10:45');
  });
});

describe('formatAncestralEchoesLine', () => {
  it('returns empty string when 0', () => {
    expect(formatAncestralEchoesLine(makeSave())).toBe('');
    expect(formatAncestralEchoesLine(makeSave({ ancestralEchoesTouched: 0 }))).toBe('');
  });

  it('formats "Echoes touched: N" when positive', () => {
    expect(formatAncestralEchoesLine(makeSave({ ancestralEchoesTouched: 4 }))).toBe('⟡ Echoes touched: 4');
  });

  it('handles undefined field (back-compat)', () => {
    const s = makeSave();
    // Explicit undefined — pre-feature save
    expect(formatAncestralEchoesLine({ ...s, ancestralEchoesTouched: undefined })).toBe('');
  });
});

describe('save migration — stonesPicked + echoesTouched', () => {
  it('preserves valid standingStonesPicked', () => {
    const input = {
      ...createDefaultSave(),
      standingStonesPicked: { mending: 2, fire: 3 },
    };
    const migrated = migrateSave(input);
    expect(migrated.standingStonesPicked).toEqual({ mending: 2, fire: 3 });
  });

  it('drops standingStonesPicked with non-numeric / non-finite values', () => {
    const input: Record<string, unknown> = {
      ...createDefaultSave(),
      standingStonesPicked: { mending: 'three', fire: Number.NaN },
    };
    expect(migrateSave(input).standingStonesPicked).toBeUndefined();
  });

  it('drops standingStonesPicked with negative / zero values', () => {
    const input: Record<string, unknown> = {
      ...createDefaultSave(),
      standingStonesPicked: { mending: -1, fire: 0, haste: 2 },
    };
    expect(migrateSave(input).standingStonesPicked).toEqual({ haste: 2 });
  });

  it('floors fractional pick counts', () => {
    const input: Record<string, unknown> = {
      ...createDefaultSave(),
      standingStonesPicked: { mending: 2.9 },
    };
    expect(migrateSave(input).standingStonesPicked).toEqual({ mending: 2 });
  });

  it('defaults ancestralEchoesTouched to 0 on a fresh / legacy save', () => {
    expect(migrateSave(createDefaultSave()).ancestralEchoesTouched).toBe(0);
  });

  it('preserves valid ancestralEchoesTouched', () => {
    const migrated = migrateSave({ ...createDefaultSave(), ancestralEchoesTouched: 7 });
    expect(migrated.ancestralEchoesTouched).toBe(7);
  });

  it('coerces non-numeric ancestralEchoesTouched to 0', () => {
    const migrated = migrateSave({
      ...createDefaultSave(),
      ancestralEchoesTouched: 'nope' as unknown as number,
    });
    expect(migrated.ancestralEchoesTouched).toBe(0);
  });
});

function makeEntry(over: Partial<RunHistoryEntry> = {}): RunHistoryEntry {
  return {
    timestamp: 1,
    timeSurvivedSec: 120,
    enemiesKilled: 50,
    level: 5,
    bossKills: 0,
    goldEarned: 10,
    bestCombo: 3,
    variantKey: 'classic',
    isVictory: false,
    weaponKeys: [],
    ...over,
  };
}

describe('computeCurseStats', () => {
  it('returns zeros when no runs bore a curse', () => {
    const stats = computeCurseStats([makeEntry(), makeEntry({ isVictory: true })]);
    expect(stats).toEqual({
      curseRunsTotal: 0,
      curseVictories: 0,
      distinctCursesBested: 0,
      distinctCursesAttempted: 0,
    });
  });

  it('counts attempts and victories per distinct curse', () => {
    const stats = computeCurseStats([
      makeEntry({ curseKey: 'heavy_legs', isVictory: false }),
      makeEntry({ curseKey: 'heavy_legs', isVictory: true }),
      makeEntry({ curseKey: 'thin_hide', isVictory: true }),
      makeEntry({ curseKey: 'restless_spirits', isVictory: false }),
    ]);
    expect(stats.curseRunsTotal).toBe(4);
    expect(stats.curseVictories).toBe(2);
    expect(stats.distinctCursesBested).toBe(2);
    expect(stats.distinctCursesAttempted).toBe(3);
  });

  it('ignores empty / missing curseKey strings', () => {
    const stats = computeCurseStats([
      makeEntry({ curseKey: '', isVictory: true }),
      makeEntry({ curseKey: undefined, isVictory: true }),
      makeEntry({ curseKey: 'heavy_legs', isVictory: true }),
    ]);
    expect(stats.curseRunsTotal).toBe(1);
    expect(stats.distinctCursesBested).toBe(1);
  });

  it('does not double-count same-curse multi-wins in distinctCursesBested', () => {
    const stats = computeCurseStats([
      makeEntry({ curseKey: 'heavy_legs', isVictory: true }),
      makeEntry({ curseKey: 'heavy_legs', isVictory: true }),
      makeEntry({ curseKey: 'heavy_legs', isVictory: true }),
    ]);
    expect(stats.curseVictories).toBe(3);
    expect(stats.distinctCursesBested).toBe(1);
  });
});

describe('formatCurseStatsLine', () => {
  it('is blank when no cursed runs have occurred', () => {
    const line = formatCurseStatsLine(
      { curseRunsTotal: 0, curseVictories: 0, distinctCursesBested: 0, distinctCursesAttempted: 0 },
      5,
    );
    expect(line).toBe('');
  });

  it('renders counts once the player has tried at least one curse', () => {
    const line = formatCurseStatsLine(
      { curseRunsTotal: 4, curseVictories: 2, distinctCursesBested: 2, distinctCursesAttempted: 3 },
      5,
    );
    expect(line).toContain('2 / 5');
    expect(line).toContain('2');
    expect(line).toContain('4');
  });

  it('clamps total to at least 1 defensively', () => {
    const line = formatCurseStatsLine(
      { curseRunsTotal: 1, curseVictories: 0, distinctCursesBested: 0, distinctCursesAttempted: 1 },
      0,
    );
    expect(line).toContain('0 / 1');
  });
});
