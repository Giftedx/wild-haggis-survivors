import { describe, expect, it } from 'vitest';
import {
  computeStandingStonesStats,
  formatAncestralEchoesLine,
  formatStandingStonesLine,
} from './chronicleAggregates';
import { createDefaultSave, migrateSave, type SaveData } from '../utils/save';

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
