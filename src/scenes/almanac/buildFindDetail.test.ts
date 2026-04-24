import { describe, expect, it } from 'vitest';
import { buildFindDetail, categoryLabelKeyFor } from './buildFindDetail';
import type { FindEntryVM } from './buildFindsEntries';

const seenEntry: FindEntryVM = {
  key: 'sporran',
  category: 'passive',
  nameKey: 'upgradeCard.add_sporran.name',
  descKey: 'upgradeCard.add_sporran.description',
  acquired: true,
  acquireCount: 4,
  firstAcquiredAt: { runId: 'run-abc', timestamp: 1700000000000 },
};

const unseenEntry: FindEntryVM = {
  ...seenEntry,
  acquired: false,
  acquireCount: 0,
  firstAcquiredAt: null,
};

describe('buildFindDetail', () => {
  it('exposes the i18n keys when acquired', () => {
    const detail = buildFindDetail(seenEntry);
    expect(detail.titleKey).toBe('upgradeCard.add_sporran.name');
    expect(detail.descKey).toBe('upgradeCard.add_sporran.description');
    expect(detail.acquired).toBe(true);
  });

  it('formats acquire count with the correct singular / plural', () => {
    expect(buildFindDetail({ ...seenEntry, acquireCount: 1 }).acquireCountText).toBe(
      '1 pick on the slate',
    );
    expect(buildFindDetail({ ...seenEntry, acquireCount: 5 }).acquireCountText).toBe(
      '5 picks on the slate',
    );
  });

  it('emits a firstAcquiredText line when timestamp is present', () => {
    const detail = buildFindDetail(seenEntry);
    expect(detail.firstAcquiredText).toContain('First found');
  });

  it('hides count + first-found metadata for unacquired finds', () => {
    const detail = buildFindDetail(unseenEntry);
    expect(detail.acquired).toBe(false);
    expect(detail.acquireCountText).toBeNull();
    expect(detail.firstAcquiredText).toBeNull();
  });

  it('never leaks the real name / desc keys on an unacquired find', () => {
    const detail = buildFindDetail(unseenEntry);
    expect(detail.titleKey).toBe('ui.almanac.find_unknown_title');
    expect(detail.descKey).toBe('ui.almanac.find_unknown_lore');
  });

  it('preserves the category on both seen + unseen so the badge still renders', () => {
    expect(buildFindDetail(seenEntry).category).toBe('passive');
    expect(buildFindDetail(unseenEntry).category).toBe('passive');
  });
});

describe('categoryLabelKeyFor', () => {
  it('maps each category to its dedicated i18n leaf', () => {
    expect(categoryLabelKeyFor('weapon')).toBe('ui.almanac.find_cat_weapon');
    expect(categoryLabelKeyFor('evolution')).toBe('ui.almanac.find_cat_evolution');
    expect(categoryLabelKeyFor('passive')).toBe('ui.almanac.find_cat_passive');
    expect(categoryLabelKeyFor('permanent')).toBe('ui.almanac.find_cat_permanent');
    expect(categoryLabelKeyFor('relic')).toBe('ui.almanac.find_cat_relic');
  });
});
