/**
 * E1 M2 T9 — Burns Night run-start ceremony (pure).
 *
 * Pure date-gated lookup of per-event ceremony config. The scene wires
 * the return value to audio stinger, banner render, and banter request.
 * Tests pass `now` explicitly so there is no global-Date dependency.
 */
import { describe, expect, it } from 'vitest';
import { seasonalRunStartCeremony } from './burnsNightEffects';

function d(y: number, m: number, day: number): Date {
  return new Date(y, m - 1, day, 12, 0, 0, 0);
}

describe('E1 T9 seasonalRunStartCeremony', () => {
  it('returns Burns Night ceremony config when event window active', () => {
    const ceremony = seasonalRunStartCeremony(d(2027, 1, 25), false);
    expect(ceremony).not.toBeNull();
    expect(ceremony?.eventKey).toBe('burns_night');
    expect(ceremony?.stingerId).toBe('burns_pipes_in');
    expect(ceremony?.banterContext).toBe('gran_commentary');
    expect(ceremony?.banterTag).toBe('seasonal_event');
    expect(ceremony?.bannerKey).toBe('seasonalEvent.burns_night.ceremony_banner');
  });

  it('returns Burns ceremony at each window edge', () => {
    expect(seasonalRunStartCeremony(d(2027, 1, 18), false)?.eventKey).toBe('burns_night');
    expect(seasonalRunStartCeremony(d(2027, 2, 1), false)?.eventKey).toBe('burns_night');
  });

  it('returns null outside the event window', () => {
    expect(seasonalRunStartCeremony(d(2027, 7, 4), false)).toBeNull();
    expect(seasonalRunStartCeremony(d(2027, 1, 17), false)).toBeNull();
    expect(seasonalRunStartCeremony(d(2027, 2, 2), false)).toBeNull();
  });

  it('returns null when seasonal events are disabled even inside window', () => {
    expect(seasonalRunStartCeremony(d(2027, 1, 25), true)).toBeNull();
  });

  it('is year-agnostic', () => {
    expect(seasonalRunStartCeremony(d(2028, 1, 25), false)?.eventKey).toBe('burns_night');
    expect(seasonalRunStartCeremony(d(2099, 1, 25), false)?.eventKey).toBe('burns_night');
  });
});
