import { describe, expect, it } from 'vitest';
import { computeTimeOfDayKey, type TimeOfDayKey } from './computeTimeOfDayKey';

describe('computeTimeOfDayKey', () => {
  const cases: Array<[label: string, runTimeMs: number, expected: TimeOfDayKey]> = [
    ['run start',                       0,                     'dawn'],
    ['1 min in',                        60_000,                'dawn'],
    ['just under 5 min',                5 * 60_000 - 1,        'dawn'],
    ['exactly 5 min — boundary day',    5 * 60_000,            'day'],
    ['10 min mid-combat',               10 * 60_000,           'day'],
    ['just under 15 min',               15 * 60_000 - 1,       'day'],
    ['exactly 15 min — boundary dusk',  15 * 60_000,           'dusk'],
    ['18 min gloaming window',          18 * 60_000,           'dusk'],
    ['just under 22 min',               22 * 60_000 - 1,       'dusk'],
    ['exactly 22 min — boundary night', 22 * 60_000,           'night'],
    ['25 min taxman tick',              25 * 60_000,           'night'],
  ];

  for (const [label, ms, expected] of cases) {
    it(`${label}: ${ms} ms → ${expected}`, () => {
      expect(computeTimeOfDayKey(ms)).toBe(expected);
    });
  }

  it('handles negative run time (defensive — should never happen but degrade gracefully)', () => {
    expect(computeTimeOfDayKey(-1)).toBe('dawn');
  });
});
