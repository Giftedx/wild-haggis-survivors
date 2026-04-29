import { describe, expect, it } from 'vitest';
import {
  SEASONAL_EVENTS,
  activeSeasonalEvents,
  getActiveSeasonalEventKey,
  isInWindow,
  isSeasonalEventActive,
} from './SeasonalEventManager';

/**
 * Build a Date at local-midnight for (yyyy, m-1-indexed, d). Using
 * local-time constructor matches what `isSeasonalEventActive` reads
 * via `getMonth` / `getDate`. Does NOT touch UTC — player device time
 * is the contract.
 */
function d(y: number, m: number, day: number): Date {
  return new Date(y, m - 1, day, 12, 0, 0, 0);
}

describe('E1 SeasonalEventManager — isInWindow (pure)', () => {
  it('same-year window: in-range dates return true', () => {
    const w = { startMonth: 1, startDay: 18, endMonth: 2, endDay: 1 };
    expect(isInWindow({ m: 1, d: 18 }, w)).toBe(true);
    expect(isInWindow({ m: 1, d: 25 }, w)).toBe(true);
    expect(isInWindow({ m: 2, d: 1 }, w)).toBe(true);
  });

  it('same-year window: out-of-range dates return false', () => {
    const w = { startMonth: 1, startDay: 18, endMonth: 2, endDay: 1 };
    expect(isInWindow({ m: 1, d: 17 }, w)).toBe(false);
    expect(isInWindow({ m: 2, d: 2 }, w)).toBe(false);
    expect(isInWindow({ m: 7, d: 4 }, w)).toBe(false);
    expect(isInWindow({ m: 12, d: 31 }, w)).toBe(false);
  });

  it('year-wrap window: both sides of the new year return true', () => {
    // Hypothetical Hogmanay Dec 28 - Jan 3.
    const w = { startMonth: 12, startDay: 28, endMonth: 1, endDay: 3 };
    expect(isInWindow({ m: 12, d: 28 }, w)).toBe(true);
    expect(isInWindow({ m: 12, d: 31 }, w)).toBe(true);
    expect(isInWindow({ m: 1, d: 1 }, w)).toBe(true);
    expect(isInWindow({ m: 1, d: 3 }, w)).toBe(true);
  });

  it('year-wrap window: mid-year dates return false', () => {
    const w = { startMonth: 12, startDay: 28, endMonth: 1, endDay: 3 };
    expect(isInWindow({ m: 1, d: 4 }, w)).toBe(false);
    expect(isInWindow({ m: 6, d: 15 }, w)).toBe(false);
    expect(isInWindow({ m: 12, d: 27 }, w)).toBe(false);
  });
});

describe('E1 SeasonalEventManager — Burns Night', () => {
  it('is active on Burns Night itself (25 January)', () => {
    expect(isSeasonalEventActive('burns_night', d(2027, 1, 25))).toBe(true);
  });

  it('is active on the window edges (Jan 18 + Feb 1)', () => {
    expect(isSeasonalEventActive('burns_night', d(2027, 1, 18))).toBe(true);
    expect(isSeasonalEventActive('burns_night', d(2027, 2, 1))).toBe(true);
  });

  it('is inactive the day before + day after the window', () => {
    expect(isSeasonalEventActive('burns_night', d(2027, 1, 17))).toBe(false);
    expect(isSeasonalEventActive('burns_night', d(2027, 2, 2))).toBe(false);
  });

  it('is inactive in summer', () => {
    expect(isSeasonalEventActive('burns_night', d(2027, 7, 4))).toBe(false);
  });

  it('is year-agnostic (works in 2027 and 2028 identically)', () => {
    expect(isSeasonalEventActive('burns_night', d(2027, 1, 25))).toBe(true);
    expect(isSeasonalEventActive('burns_night', d(2028, 1, 25))).toBe(true);
    expect(isSeasonalEventActive('burns_night', d(2028, 2, 29))).toBe(false);
  });
});

describe('E1 SeasonalEventManager — activation helpers', () => {
  it('activeSeasonalEvents includes burns_night during its window', () => {
    expect(activeSeasonalEvents(d(2027, 1, 25))).toContain('burns_night');
  });

  it('activeSeasonalEvents is empty outside every event window', () => {
    expect(activeSeasonalEvents(d(2027, 7, 4))).toEqual([]);
  });

  it('getActiveSeasonalEventKey returns burns_night during the window', () => {
    expect(getActiveSeasonalEventKey(d(2027, 1, 25))).toBe('burns_night');
  });

  it('getActiveSeasonalEventKey returns null outside every window', () => {
    expect(getActiveSeasonalEventKey(d(2027, 7, 4))).toBeNull();
  });

  it('unknown event key never activates', () => {
    expect(isSeasonalEventActive('not_a_real_event', d(2027, 1, 25))).toBe(false);
  });

  it('E1 M4 opt-out — disabled=true short-circuits to empty regardless of date', () => {
    const burnsDate = d(2027, 1, 25);
    expect(activeSeasonalEvents(burnsDate, false)).toContain('burns_night');
    expect(activeSeasonalEvents(burnsDate, true)).toEqual([]);
    expect(getActiveSeasonalEventKey(burnsDate, false)).toBe('burns_night');
    expect(getActiveSeasonalEventKey(burnsDate, true)).toBeNull();
  });
});

describe('E1 SeasonalEventManager — time-sensitivity immunity', () => {
  it('same calendar date at any wall-clock hour resolves identically', () => {
    const early = new Date(2027, 0, 25, 0, 0, 1, 0);
    const late = new Date(2027, 0, 25, 23, 59, 59, 999);
    expect(isSeasonalEventActive('burns_night', early)).toBe(true);
    expect(isSeasonalEventActive('burns_night', late)).toBe(true);
  });

  it('leap-year Feb 29 does not trip window math', () => {
    // 2028 is a leap year. Feb 29 falls outside the 1/18-2/1 window.
    expect(isSeasonalEventActive('burns_night', d(2028, 2, 29))).toBe(false);
  });
});

describe('E1 SeasonalEventManager — data shape', () => {
  it('Burns Night is a registered event', () => {
    expect(Object.keys(SEASONAL_EVENTS)).toContain('burns_night');
    expect(SEASONAL_EVENTS.burns_night.nameKey).toBe('seasonalEvent.burns_night.name');
    expect(SEASONAL_EVENTS.burns_night.descriptionKey).toBe(
      'seasonalEvent.burns_night.description',
    );
  });

  it('Hogmanay is a registered event with year-wrap window (E1 follow-up)', () => {
    expect(Object.keys(SEASONAL_EVENTS)).toContain('hogmanay');
    const hog = SEASONAL_EVENTS.hogmanay;
    expect(hog.dateWindow.startMonth).toBe(12);
    expect(hog.dateWindow.startDay).toBe(28);
    expect(hog.dateWindow.endMonth).toBe(1);
    expect(hog.dateWindow.endDay).toBe(3);
  });
});

describe('E1 Samhain + St Andrew\'s Day — autumn events', () => {
  it('Samhain is active across Halloween', () => {
    expect(isSeasonalEventActive('samhain', d(2027, 10, 31))).toBe(true);
    expect(isSeasonalEventActive('samhain', d(2027, 10, 28))).toBe(true);
    expect(isSeasonalEventActive('samhain', d(2027, 11, 3))).toBe(true);
  });

  it('Samhain is inactive outside the window', () => {
    expect(isSeasonalEventActive('samhain', d(2027, 10, 27))).toBe(false);
    expect(isSeasonalEventActive('samhain', d(2027, 11, 4))).toBe(false);
    expect(isSeasonalEventActive('samhain', d(2027, 6, 15))).toBe(false);
  });

  it('St Andrew\'s Day covers Nov 30', () => {
    expect(isSeasonalEventActive('st_andrews', d(2027, 11, 30))).toBe(true);
    expect(isSeasonalEventActive('st_andrews', d(2027, 11, 27))).toBe(true);
    expect(isSeasonalEventActive('st_andrews', d(2027, 12, 3))).toBe(true);
  });

  it('St Andrew\'s Day does not bleed into Hogmanay', () => {
    expect(isSeasonalEventActive('st_andrews', d(2027, 12, 28))).toBe(false);
    expect(isSeasonalEventActive('hogmanay', d(2027, 11, 30))).toBe(false);
  });

  it('Beltane covers May Day', () => {
    expect(isSeasonalEventActive('beltane', d(2027, 5, 1))).toBe(true);
    expect(isSeasonalEventActive('beltane', d(2027, 4, 28))).toBe(true);
    expect(isSeasonalEventActive('beltane', d(2027, 5, 4))).toBe(true);
  });

  it('Beltane is inactive outside the window', () => {
    expect(isSeasonalEventActive('beltane', d(2027, 4, 27))).toBe(false);
    expect(isSeasonalEventActive('beltane', d(2027, 5, 5))).toBe(false);
  });

  it('no two events ever overlap in `activeSeasonalEvents` across the calendar', () => {
    // Sweep every day of the year; assert at most one event is active
    // at any time. Catches accidental overlaps when new events ship.
    for (let m = 1; m <= 12; m++) {
      for (let day = 1; day <= 31; day++) {
        // Skip impossible dates (e.g. Feb 30). The Date constructor
        // normalises, so `new Date(2027, 1, 30)` becomes Mar 2 —
        // filter those out by comparing the read-back month.
        const date = d(2027, m, day);
        if (date.getMonth() + 1 !== m) continue;
        const active = activeSeasonalEvents(date);
        expect(active.length).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('E1 Hogmanay — year-wrap calendar', () => {
  it('is active on New Year\'s Eve + Day', () => {
    expect(isSeasonalEventActive('hogmanay', d(2027, 12, 31))).toBe(true);
    expect(isSeasonalEventActive('hogmanay', d(2028, 1, 1))).toBe(true);
  });

  it('is active on the window edges (Dec 28 + Jan 3)', () => {
    expect(isSeasonalEventActive('hogmanay', d(2027, 12, 28))).toBe(true);
    expect(isSeasonalEventActive('hogmanay', d(2028, 1, 3))).toBe(true);
  });

  it('is inactive the day before + day after the window', () => {
    expect(isSeasonalEventActive('hogmanay', d(2027, 12, 27))).toBe(false);
    expect(isSeasonalEventActive('hogmanay', d(2028, 1, 4))).toBe(false);
  });

  it('is inactive in midsummer', () => {
    expect(isSeasonalEventActive('hogmanay', d(2027, 7, 4))).toBe(false);
  });

  it('does not bleed into the Burns Night window', () => {
    // On Jan 25 only Burns Night should be active; Hogmanay is long gone.
    const keys = activeSeasonalEvents(d(2027, 1, 25));
    expect(keys).toContain('burns_night');
    expect(keys).not.toContain('hogmanay');
  });
});

describe('E1 Imbolc — Brigid\'s Day (Gaelic first-of-spring)', () => {
  it('is active on Imbolc traditional date (Feb 2)', () => {
    expect(isSeasonalEventActive('imbolc', d(2027, 2, 2))).toBe(true);
  });

  it('is active on the window edges (Feb 2 + Feb 8)', () => {
    expect(isSeasonalEventActive('imbolc', d(2027, 2, 2))).toBe(true);
    expect(isSeasonalEventActive('imbolc', d(2027, 2, 8))).toBe(true);
  });

  it('is inactive the day before + day after the window', () => {
    // Feb 1 is Burns Night's last day, not Imbolc's.
    expect(isSeasonalEventActive('imbolc', d(2027, 2, 1))).toBe(false);
    expect(isSeasonalEventActive('imbolc', d(2027, 2, 9))).toBe(false);
  });

  it('does not overlap Burns Night (the disjoint design carries)', () => {
    // Feb 1 — only Burns Night.
    const burnsKeys = activeSeasonalEvents(d(2027, 2, 1));
    expect(burnsKeys).toContain('burns_night');
    expect(burnsKeys).not.toContain('imbolc');
    // Feb 2 — only Imbolc, Burns Night just closed.
    const imbolcKeys = activeSeasonalEvents(d(2027, 2, 2));
    expect(imbolcKeys).toContain('imbolc');
    expect(imbolcKeys).not.toContain('burns_night');
  });

  it('is inactive in midsummer', () => {
    expect(isSeasonalEventActive('imbolc', d(2027, 7, 4))).toBe(false);
  });
});
