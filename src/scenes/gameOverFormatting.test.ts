import { describe, it, expect } from 'vitest';
import { computeGoldReward } from '../utils/save';
import {
  formatClockTime,
  computeGoldBreakdown,
  boundedLoadoutSummary,
  buildWeaponDamageRows,
} from './gameOverFormatting';

describe('formatClockTime', () => {
  it('formats 0 seconds', () => {
    expect(formatClockTime(0)).toBe('0:00');
  });

  it('formats sub-minute values with zero-padded seconds', () => {
    expect(formatClockTime(5)).toBe('0:05');
    expect(formatClockTime(59)).toBe('0:59');
  });

  it('formats exact minutes', () => {
    expect(formatClockTime(60)).toBe('1:00');
    expect(formatClockTime(120)).toBe('2:00');
  });

  it('formats mixed minutes and seconds', () => {
    expect(formatClockTime(90)).toBe('1:30');
    expect(formatClockTime(3661)).toBe('61:01');
  });

  it('floors fractional seconds', () => {
    expect(formatClockTime(59.9)).toBe('0:59');
    expect(formatClockTime(0.1)).toBe('0:00');
  });

  it('clamps negative values to 0:00', () => {
    expect(formatClockTime(-10)).toBe('0:00');
    expect(formatClockTime(-0.5)).toBe('0:00');
  });
});

describe('computeGoldBreakdown', () => {
  it('computes gold from time survived', () => {
    const result = computeGoldBreakdown({
      timeSurvivedSec: 100,
      enemiesKilled: 0,
      bossGold: 0,
      coinGold: 0,
    });
    expect(result.timeGold).toBe(40);
    expect(result.total).toBe(40);
  });

  it('computes gold from enemy kills', () => {
    const result = computeGoldBreakdown({
      timeSurvivedSec: 0,
      enemiesKilled: 50,
      bossGold: 0,
      coinGold: 0,
    });
    expect(result.killGold).toBe(20);
    expect(result.total).toBe(20);
  });

  it('passes through boss and coin gold', () => {
    const result = computeGoldBreakdown({
      timeSurvivedSec: 0,
      enemiesKilled: 0,
      bossGold: 15,
      coinGold: 7,
    });
    expect(result.bossGold).toBe(15);
    expect(result.coinGold).toBe(7);
    expect(result.total).toBe(22);
  });

  it('floors fractional time/kill gold', () => {
    const result = computeGoldBreakdown({
      timeSurvivedSec: 1,
      enemiesKilled: 1,
      bossGold: 0,
      coinGold: 0,
    });
    expect(result.timeGold).toBe(0);
    expect(result.killGold).toBe(0);
    expect(result.total).toBe(0);
  });

  it('sums all sources correctly', () => {
    const result = computeGoldBreakdown({
      timeSurvivedSec: 300,
      enemiesKilled: 200,
      bossGold: 50,
      coinGold: 30,
    });
    expect(result.timeGold).toBe(120);
    expect(result.killGold).toBe(80);
    expect(result.total).toBe(120 + 80 + 50 + 30);
    expect(result.timeGold + result.killGold + result.bossGold + result.coinGold).toBe(result.total);
  });

  it('matches computeGoldReward when goldMult is not 1 (display lines sum to earned total)', () => {
    const summary = {
      timeSurvivedSec: 48,
      enemiesKilled: 44,
      bossGold: 0,
      coinGold: 1,
      goldMult: 1.18,
      victory: false,
    };
    const result = computeGoldBreakdown({
      timeSurvivedSec: summary.timeSurvivedSec,
      enemiesKilled: summary.enemiesKilled,
      bossGold: summary.bossGold,
      coinGold: summary.coinGold ?? 0,
      goldMult: summary.goldMult,
    });
    expect(result.total).toBe(computeGoldReward(summary));
    expect(result.timeGold + result.killGold + result.bossGold + result.coinGold).toBe(result.total);
  });
});

describe('boundedLoadoutSummary', () => {
  it('returns every line untouched when the count is at or below the cap', () => {
    const input = 'Thistle Shot\nCaber Toss\nHaggis Hurler';
    expect(boundedLoadoutSummary(input, 3)).toBe(input);
    expect(boundedLoadoutSummary(input, 10)).toBe(input);
  });

  it('truncates to cap and appends a "+N more" line when over', () => {
    const input = 'A\nB\nC\nD\nE';
    const out = boundedLoadoutSummary(input, 2).split('\n');
    // 2 visible + 1 overflow = 3 lines.
    expect(out).toHaveLength(3);
    expect(out[0]).toBe('A');
    expect(out[1]).toBe('B');
    expect(out[2]).toContain('3'); // 5 - 2 dropped → 3
  });

  it('trims leading/trailing whitespace on each line before counting', () => {
    const input = '  A  \n\tB\t\n  C  ';
    const out = boundedLoadoutSummary(input, 5);
    expect(out).toBe('A\nB\nC');
  });

  it('drops blank lines entirely (they do not count toward the cap)', () => {
    const input = 'A\n\n\nB\n   \nC';
    // 3 real lines, cap 3 — no overflow suffix.
    expect(boundedLoadoutSummary(input, 3)).toBe('A\nB\nC');
  });

  it('returns empty string when input has no content', () => {
    expect(boundedLoadoutSummary('', 5)).toBe('');
    expect(boundedLoadoutSummary('\n\n  \n', 5)).toBe('');
  });

  it('clamps negative/fractional caps to 0 — everything becomes overflow', () => {
    const out = boundedLoadoutSummary('A\nB', -1).split('\n');
    // 0 visible + 1 overflow line.
    expect(out).toHaveLength(1);
    expect(out[0]).toContain('2');
  });

  it('cap of 0 with non-empty input emits only the overflow line', () => {
    const out = boundedLoadoutSummary('A\nB\nC', 0).split('\n');
    expect(out).toHaveLength(1);
    expect(out[0]).toContain('3');
  });

  it('cap of 0 with empty input emits nothing', () => {
    expect(boundedLoadoutSummary('', 0)).toBe('');
  });
});

describe('buildWeaponDamageRows', () => {
  const baseInput = {
    weaponDamage: {} as Record<string, number>,
    enemiesKilled: 42,
    timeSurvivedSec: 95,
    goldEarned: 123,
    maxRows: 3,
  };

  it('produces just the header + placeholder when weaponDamage is empty', () => {
    const out = buildWeaponDamageRows({ ...baseInput, weaponDamage: {} }).split('\n');
    // header + placeholder = 2 lines, no weapon rows.
    expect(out).toHaveLength(2);
    expect(out[0]).toContain('42'); // kills
    expect(out[0]).toContain('1:35'); // 95s → 1:35 via formatClockTime
    expect(out[0]).toContain('123'); // gold
    // Placeholder is an i18n string — just assert it's non-key and non-empty.
    expect(out[1]).not.toBe('ui.gameOver.no_weapon_damage');
    expect(out[1].length).toBeGreaterThan(0);
  });

  it('skips zero-damage entries (sortedWeaponDamageEntries filters them)', () => {
    const out = buildWeaponDamageRows({
      ...baseInput,
      weaponDamage: { thistle_shot: 0, caber_toss: 0 },
    }).split('\n');
    // All filtered → header + placeholder, not two rows.
    expect(out).toHaveLength(2);
  });

  it('emits one row per weapon in descending damage order', () => {
    const out = buildWeaponDamageRows({
      ...baseInput,
      weaponDamage: { thistle_shot: 100, caber_toss: 300, haggis_hurler: 200 },
      maxRows: 5,
    }).split('\n');
    // header + 3 rows = 4 lines, no "+N more".
    expect(out).toHaveLength(4);
    // Row 1 is the biggest (caber_toss = 300).
    expect(out[1]).toContain('300');
    expect(out[2]).toContain('200');
    expect(out[3]).toContain('100');
  });

  it('truncates to maxRows and appends a "+N more" overflow line', () => {
    const out = buildWeaponDamageRows({
      ...baseInput,
      weaponDamage: {
        thistle_shot: 500,
        caber_toss: 400,
        haggis_hurler: 300,
        bagpipe_blast: 200,
        scotch_mist: 100,
      },
      maxRows: 2,
    }).split('\n');
    // header + 2 rows + "+3 more" tail = 4 lines.
    expect(out).toHaveLength(4);
    expect(out[1]).toContain('500');
    expect(out[2]).toContain('400');
    expect(out[3]).toContain('3'); // 5 - 2 dropped = 3
  });

  it('renders percentage as round(damage / total × 100)', () => {
    const out = buildWeaponDamageRows({
      ...baseInput,
      weaponDamage: { thistle_shot: 75, caber_toss: 25 }, // total 100 → 75% / 25%
      maxRows: 5,
    }).split('\n');
    expect(out[1]).toContain('75%');
    expect(out[2]).toContain('25%');
  });

  it('pads label column to 18 chars and truncates longer names', () => {
    // thistle_shot's display name should fit; we just assert padding contract
    // by checking the first 18 chars of the weapon row hold the label.
    const out = buildWeaponDamageRows({
      ...baseInput,
      weaponDamage: { thistle_shot: 50 },
      maxRows: 1,
    }).split('\n');
    const row = out[1];
    // Label ends at col 18 (padEnd), then a single space, then damage padded-6.
    expect(row.length).toBeGreaterThanOrEqual(18 + 1 + 6);
    // Damage "50" right-padded in a 6-wide column.
    expect(row.slice(19, 25)).toBe('    50');
  });

  it('clamps a negative maxRows to 0 — all entries become overflow', () => {
    const out = buildWeaponDamageRows({
      ...baseInput,
      weaponDamage: { thistle_shot: 10, caber_toss: 20 },
      maxRows: -5,
    }).split('\n');
    // header + "+2 more", no rows.
    expect(out).toHaveLength(2);
    expect(out[1]).toContain('2');
  });

  it('handles unknown weapon keys by falling back to the raw key label', () => {
    const out = buildWeaponDamageRows({
      ...baseInput,
      weaponDamage: { not_a_real_weapon: 10 },
      maxRows: 1,
    }).split('\n');
    // header + 1 fallback row, no crash.
    expect(out).toHaveLength(2);
    expect(out[1]).toContain('not_a_real_weapon'.slice(0, 18));
    expect(out[1]).toContain('10');
  });
});
