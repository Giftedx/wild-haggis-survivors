import { describe, expect, it } from 'vitest';
import {
  computeRelicHistogram,
  formatRelicHistogramRow,
} from './relicHistogram';
import type { RunHistoryEntry } from '../../utils/save';

function entry(relics: RunHistoryEntry['relics']): RunHistoryEntry {
  return {
    timestamp: 0,
    timeSurvivedSec: 0,
    enemiesKilled: 0,
    level: 1,
    bossKills: 0,
    goldEarned: 0,
    bestCombo: 0,
    variantKey: 'classic',
    isVictory: false,
    weaponKeys: [],
    relics,
  };
}

describe('computeRelicHistogram (R1 M4.5 P6 T29)', () => {
  it('returns zero sample when no entries have relics field', () => {
    const { sampleRuns, runsWithAnyRelic, rows } = computeRelicHistogram([]);
    expect(sampleRuns).toBe(0);
    expect(runsWithAnyRelic).toBe(0);
    expect(rows.every((r) => r.pickCount === 0)).toBe(true);
  });

  it('skips pre-R1 entries (no relics field) so they do not dilute the denominator', () => {
    const pre = { ...entry([]), relics: undefined as unknown as RunHistoryEntry['relics'] };
    const r1 = entry(['sporran_of_holding']);
    const summary = computeRelicHistogram([pre, r1]);
    expect(summary.sampleRuns).toBe(1);
    expect(summary.runsWithAnyRelic).toBe(1);
  });

  it('counts each relic once per run (dedupes within a run)', () => {
    const e = entry(['sporran_of_holding', 'sporran_of_holding', 'grans_thimble']);
    const summary = computeRelicHistogram([e]);
    const sporran = summary.rows.find((r) => r.relicKey === 'sporran_of_holding');
    const thimble = summary.rows.find((r) => r.relicKey === 'grans_thimble');
    expect(sporran?.pickCount).toBe(1);
    expect(thimble?.pickCount).toBe(1);
  });

  it('rate = pickCount / sampleRuns, and rows sort by pickCount desc', () => {
    const e1 = entry(['sporran_of_holding']);
    const e2 = entry(['sporran_of_holding', 'grans_thimble']);
    const e3 = entry([]); // ran but held nothing — still counts in denominator
    const summary = computeRelicHistogram([e1, e2, e3]);
    expect(summary.sampleRuns).toBe(3);
    expect(summary.runsWithAnyRelic).toBe(2);
    const top = summary.rows[0];
    expect(top.relicKey).toBe('sporran_of_holding');
    expect(top.pickCount).toBe(2);
    expect(top.pickRate).toBeCloseTo(2 / 3);
  });

  it('ignores relic keys outside RELIC_KEYS (guard for stale save rows)', () => {
    const bogus = entry(['not_a_real_relic' as never]);
    const summary = computeRelicHistogram([bogus]);
    expect(summary.sampleRuns).toBe(1);
    expect(summary.runsWithAnyRelic).toBe(1);
    // No row should have pickCount 1 since the fake key isn't in RELIC_KEYS.
    expect(summary.rows.every((r) => r.pickCount === 0)).toBe(true);
  });

  it('formatRelicHistogramRow produces readable text', () => {
    const row = { relicKey: 'sporran_of_holding' as const, pickCount: 4, pickRate: 0.5 };
    expect(formatRelicHistogramRow(row, 8)).toBe('sporran_of_holding — 4/8 (50%)');
  });
});
