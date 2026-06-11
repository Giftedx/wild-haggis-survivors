import { describe, expect, it } from 'vitest';
import type { BeastieEntryVM } from './buildBeastiesEntries';
import { buildBeastieDetail } from './buildBeastieDetail';

function vm(overrides: Partial<BeastieEntryVM>): BeastieEntryVM {
  return {
    key: 'tourist',
    displayName: 'Tourist',
    texture: 'tourist',
    isBoss: false,
    appearsAt: 0,
    seen: true,
    killCount: 0,
    firstSeenAt: null,
    ...overrides,
  };
}

describe('buildBeastieDetail', () => {
  it('surfaces the real name + lore key for a seen entry', () => {
    const detail = buildBeastieDetail(vm({ seen: true, displayName: 'Tourist' }));
    expect(detail.titleText).toBe('Tourist');
    expect(detail.loreKey).toBe('beastie.tourist.lore');
    expect(detail.loreFallback.length).toBeGreaterThan(0);
    expect(detail.isSilhouette).toBe(false);
  });

  it('hides identity on unseen entries — title + lore are generic', () => {
    const detail = buildBeastieDetail(vm({ seen: false, displayName: 'Gordon the Chef' }));
    expect(detail.titleText).toBe('???');
    expect(detail.loreKey).toBe('ui.almanac.beastie_unknown_lore');
    expect(detail.loreFallback).not.toContain('Gordon');
    expect(detail.isSilhouette).toBe(true);
  });

  it('formats "where found" as a minute mark — seen only', () => {
    const seen = buildBeastieDetail(vm({ seen: true, appearsAt: 300 }));
    expect(seen.whereFoundText).toMatch(/Minute 5/);
    const later = buildBeastieDetail(vm({ seen: true, appearsAt: 690 })); // 11:30 → minute 12
    expect(later.whereFoundText).toMatch(/Minute 12/);
    // Unseen hides the timing cue to preserve mystery.
    const unseen = buildBeastieDetail(vm({ seen: false, appearsAt: 300 }));
    expect(unseen.whereFoundText).toBeNull();
  });

  it('minute-0 enemies read as "From the off"', () => {
    const tourist = buildBeastieDetail(vm({ seen: true, appearsAt: 0 }));
    expect(tourist.whereFoundText).toBe('From the off');
  });

  it('kill-count line hidden for seen-but-not-killed entries (e.g. fled the moor)', () => {
    const seenNoKill = buildBeastieDetail(vm({ seen: true, killCount: 0 }));
    expect(seenNoKill.killCountText).toBeNull();
    const killed = buildBeastieDetail(vm({ seen: true, killCount: 12 }));
    expect(killed.killCountText).toMatch(/12/);
  });

  it('kill-count line is pluralised — singular for 1, plural for 2+', () => {
    const one = buildBeastieDetail(vm({ seen: true, killCount: 1 }));
    expect(one.killCountText).toMatch(/\b1 cull\b/);
    const many = buildBeastieDetail(vm({ seen: true, killCount: 5 }));
    expect(many.killCountText).toMatch(/\b5 culls\b/);
  });

  it('first-seen line absent when no timestamp, present otherwise', () => {
    expect(buildBeastieDetail(vm({ seen: false })).firstSeenText).toBeNull();
    expect(buildBeastieDetail(vm({
      seen: true,
      firstSeenAt: { runId: 'run-abc', timestamp: 1700000000000 },
    })).firstSeenText).not.toBeNull();
  });
});
