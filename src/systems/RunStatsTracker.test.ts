import { describe, expect, it } from 'vitest';
import { RunStatsTracker, sortedWeaponDamageEntries } from './RunStatsTracker';

describe('RunStatsTracker', () => {
  it('accumulates damage per weapon key', () => {
    const t = new RunStatsTracker();
    t.addWeaponDamage('garlic', 10);
    t.addWeaponDamage('magic_wand', 100);
    t.addWeaponDamage('garlic', 5);
    expect(t.snapshot()).toEqual({ garlic: 15, magic_wand: 100 });
    expect(t.getTotalDamage()).toBe(115);
  });

  it('sortedWeaponDamageEntries orders by damage descending', () => {
    const rows = sortedWeaponDamageEntries({
      magic_wand: 15400,
      garlic: 4520,
      thistle_shot: 8000,
    });
    expect(rows.map((r) => r.key)).toEqual(['magic_wand', 'thistle_shot', 'garlic']);
    expect(rows[0].damage).toBe(15400);
  });

  it('sortedWeaponDamageEntries drops zero and negative damage', () => {
    const rows = sortedWeaponDamageEntries({
      axe: 12,
      quiet: 0,
      broken: -99,
      knife: 4,
    });
    expect(rows).toEqual([
      { key: 'axe', damage: 12 },
      { key: 'knife', damage: 4 },
    ]);
  });

  it('ignores non-positive amounts and empty keys map to unknown', () => {
    const t = new RunStatsTracker();
    t.addWeaponDamage('', 50);
    t.addWeaponDamage('x', 0);
    t.addWeaponDamage('x', -3);
    expect(t.snapshot()).toEqual({ unknown: 50 });
  });

  it('restores a persisted snapshot and drops malformed entries', () => {
    const t = new RunStatsTracker();
    t.addWeaponDamage('old', 10);
    t.restore({
      thistle_shot: 1200,
      caber_toss: -4,
      garlic: Number.NaN,
      unknown: 50.9,
    } as Record<string, number>);
    expect(t.snapshot()).toEqual({ thistle_shot: 1200, unknown: 50 });
  });
});
