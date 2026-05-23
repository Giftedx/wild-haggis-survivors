/**
 * Wild Living World Phase 2 — companion picker view-model tests.
 *
 * The picker rows + click-resolution helpers are pure functions on
 * top of `companionTypes`. These tests pin the row ordering, the
 * lock/unlock styling contract, and the click-resolution rules so
 * the Croft scene's interactive picker stays predictable when more
 * companions ship.
 */

import { describe, expect, it } from 'vitest';
import {
  buildCompanionPickerRows,
  resolveNextSelection,
  type CompanionPickerRow,
} from './companionPicker';

describe('buildCompanionPickerRows', () => {
  it('renders every companion key in stable order regardless of unlock state', () => {
    const rows = buildCompanionPickerRows({
      unlockedCompanions: ['sheepdog'],
      selectedCompanion: 'sheepdog',
    });
    // [sheepdog, stoat_scout, eagle, kelpie_foal, opt_out]
    expect(rows.length).toBe(5);
    expect(rows[0]).toMatchObject({ key: 'sheepdog', unlocked: true, selected: true });
    expect(rows[1]).toMatchObject({ key: 'stoat_scout', unlocked: false, selected: false });
    expect(rows[2]).toMatchObject({ key: 'eagle', unlocked: false, selected: false });
    expect(rows[3]).toMatchObject({ key: 'kelpie_foal', unlocked: false, selected: false });
    expect(rows[rows.length - 1]).toMatchObject({ kind: 'opt_out', selected: false });
  });

  it('marks stoat_scout as unlocked + selected after the player picks it', () => {
    const rows = buildCompanionPickerRows({
      unlockedCompanions: ['sheepdog', 'stoat_scout'],
      selectedCompanion: 'stoat_scout',
    });
    expect(rows[0]).toMatchObject({ key: 'sheepdog', unlocked: true, selected: false });
    expect(rows[1]).toMatchObject({ key: 'stoat_scout', unlocked: true, selected: true });
  });

  it('marks the opt-out row as selected when selectedCompanion is null', () => {
    const rows = buildCompanionPickerRows({
      unlockedCompanions: ['sheepdog'],
      selectedCompanion: null,
    });
    // opt_out is always the last row
    expect(rows[rows.length - 1]).toMatchObject({ kind: 'opt_out', selected: true });
    // None of the companion rows are selected in opt-out mode.
    expect(rows[0]).toMatchObject({ key: 'sheepdog', selected: false });
  });
});

describe('resolveNextSelection', () => {
  function defaultRows(): CompanionPickerRow[] {
    return buildCompanionPickerRows({
      unlockedCompanions: ['sheepdog', 'stoat_scout'],
      selectedCompanion: 'sheepdog',
    });
  }

  it('switches to an unlocked sibling when clicked', () => {
    const next = resolveNextSelection(defaultRows(), 1, 'sheepdog');
    expect(next).toBe('stoat_scout');
  });

  it('is a no-op when clicking the already-selected row', () => {
    const next = resolveNextSelection(defaultRows(), 0, 'sheepdog');
    expect(next).toBe('sheepdog');
  });

  it('rejects clicks on locked rows', () => {
    const lockedRows = buildCompanionPickerRows({
      unlockedCompanions: ['sheepdog'],
      selectedCompanion: 'sheepdog',
    });
    const next = resolveNextSelection(lockedRows, 1, 'sheepdog');
    expect(next).toBe('sheepdog');
  });

  it('opts out when the player clicks the no-companion row', () => {
    const rows = defaultRows();
    // opt_out is always the last row
    const next = resolveNextSelection(rows, rows.length - 1, 'sheepdog');
    expect(next).toBeNull();
  });

  it('returns input for out-of-range indices (defensive)', () => {
    const rows = defaultRows();
    expect(resolveNextSelection(rows, -1, 'sheepdog')).toBe('sheepdog');
    expect(resolveNextSelection(rows, 99, 'sheepdog')).toBe('sheepdog');
  });
});
