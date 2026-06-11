import { describe, expect, it } from 'vitest';
import { buildWeyDetail } from './buildWeyDetail';
import type { WeyEntryVM } from './buildWeysEntries';

const seenEntry: WeyEntryVM = {
  key: 'up_the_brae',
  slot: 'A',
  labelKey: 'routes.up_the_brae.label',
  descKey: 'routes.up_the_brae.desc',
  picked: true,
  pickCount: 3,
  firstPickedAt: { runId: 'run-abc', timestamp: 1700000000000 },
};

const unseenEntry: WeyEntryVM = {
  ...seenEntry,
  picked: false,
  pickCount: 0,
  firstPickedAt: null,
};

describe('buildWeyDetail', () => {
  it('exposes the route label + desc keys when picked', () => {
    const detail = buildWeyDetail(seenEntry);
    expect(detail.titleKey).toBe('routes.up_the_brae.label');
    expect(detail.descKey).toBe('routes.up_the_brae.desc');
    expect(detail.picked).toBe(true);
  });

  it('formats pick count with the correct singular / plural', () => {
    expect(buildWeyDetail({ ...seenEntry, pickCount: 1 }).pickCountText).toBe(
      '1 walk on the slate',
    );
    expect(buildWeyDetail({ ...seenEntry, pickCount: 4 }).pickCountText).toBe(
      '4 walks on the slate',
    );
  });

  it('emits a firstPickedText line when timestamp is present', () => {
    const detail = buildWeyDetail(seenEntry);
    expect(detail.firstPickedText).toContain('First walked');
  });

  it('hides pick-count + first-picked metadata for unpicked routes', () => {
    const detail = buildWeyDetail(unseenEntry);
    expect(detail.picked).toBe(false);
    expect(detail.pickCountText).toBeNull();
    expect(detail.firstPickedText).toBeNull();
  });

  it('never leaks the real label / desc keys on an unpicked route', () => {
    const detail = buildWeyDetail(unseenEntry);
    expect(detail.titleKey).toBe('ui.almanac.wey_unknown_title');
    expect(detail.descKey).toBe('ui.almanac.wey_unknown_lore');
  });
});
