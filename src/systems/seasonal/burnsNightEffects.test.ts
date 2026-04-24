/**
 * E1 M2 T9/T10 — Burns Night effect helpers (pure).
 *
 * Pure date-gated lookups + pickup-buff math. The scene wires the
 * return values to audio, banter, physics overlaps, and the weapon
 * damage multiplier chain. Tests pass `now` explicitly so there is
 * no global-Date dependency.
 */
import { describe, expect, it } from 'vitest';
import {
  BURNS_PIPER_ACCENT_COOLDOWN_MS,
  BURNS_PIPER_ACCENT_MIN_INTENSITY,
  BURNS_PLATTER_BUFF_MS,
  BURNS_PLATTER_BUFF_MULT,
  BURNS_PLATTER_SPAWN_MS,
  burnsPlatterDamageBuff,
  seasonalRunStartCeremony,
  shouldConsiderBurnsPiperAccent,
  shouldSpawnBurnsPlatter,
} from './burnsNightEffects';

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

  it('returns Hogmanay ceremony with bells stinger inside its window', () => {
    const ceremony = seasonalRunStartCeremony(d(2027, 12, 31), false);
    expect(ceremony).not.toBeNull();
    expect(ceremony?.eventKey).toBe('hogmanay');
    expect(ceremony?.stingerId).toBe('hogmanay_bells');
    expect(ceremony?.bannerKey).toBe('seasonalEvent.hogmanay.ceremony_banner');
  });

  it('Hogmanay ceremony spans the year-wrap boundary', () => {
    expect(seasonalRunStartCeremony(d(2027, 12, 28), false)?.eventKey).toBe('hogmanay');
    expect(seasonalRunStartCeremony(d(2028, 1, 3), false)?.eventKey).toBe('hogmanay');
  });
});

describe('E1 T10 shouldSpawnBurnsPlatter', () => {
  it('spawns when Burns Night active and not yet spawned', () => {
    expect(shouldSpawnBurnsPlatter(d(2027, 1, 25), false, false)).toBe(true);
  });

  it('does not spawn twice in the same run', () => {
    expect(shouldSpawnBurnsPlatter(d(2027, 1, 25), false, true)).toBe(false);
  });

  it('does not spawn outside the event window', () => {
    expect(shouldSpawnBurnsPlatter(d(2027, 7, 4), false, false)).toBe(false);
  });

  it('does not spawn when seasonal events are disabled', () => {
    expect(shouldSpawnBurnsPlatter(d(2027, 1, 25), true, false)).toBe(false);
  });
});

describe('E1 T10 burnsPlatterDamageBuff', () => {
  it('returns 1 (identity) when platter has not been collected', () => {
    expect(burnsPlatterDamageBuff(10_000, null)).toBe(1);
  });

  it('returns buff multiplier inside the buff window', () => {
    const pickedUpAt = 5_000;
    expect(burnsPlatterDamageBuff(pickedUpAt, pickedUpAt)).toBe(BURNS_PLATTER_BUFF_MULT);
    expect(burnsPlatterDamageBuff(pickedUpAt + 1_000, pickedUpAt)).toBe(BURNS_PLATTER_BUFF_MULT);
    expect(burnsPlatterDamageBuff(
      pickedUpAt + BURNS_PLATTER_BUFF_MS - 1,
      pickedUpAt,
    )).toBe(BURNS_PLATTER_BUFF_MULT);
  });

  it('returns 1 (identity) once the buff expires', () => {
    const pickedUpAt = 5_000;
    expect(burnsPlatterDamageBuff(pickedUpAt + BURNS_PLATTER_BUFF_MS, pickedUpAt)).toBe(1);
    expect(burnsPlatterDamageBuff(pickedUpAt + BURNS_PLATTER_BUFF_MS + 1, pickedUpAt)).toBe(1);
    expect(burnsPlatterDamageBuff(pickedUpAt + 3_600_000, pickedUpAt)).toBe(1);
  });

  it('spawn delay is early-run so it lands in the first 3 nodes', () => {
    // Plan target: "first 3 nodes of a run" — W2 act 1 starts around 3:00.
    // A 30 s delay reliably drops the platter before the first act gate.
    expect(BURNS_PLATTER_SPAWN_MS).toBeGreaterThanOrEqual(10_000);
    expect(BURNS_PLATTER_SPAWN_MS).toBeLessThanOrEqual(60_000);
  });
});

describe('E1 T21 shouldConsiderBurnsPiperAccent', () => {
  it('returns false when Burns Night is not active', () => {
    expect(shouldConsiderBurnsPiperAccent(100_000, 0, 0.7, false)).toBe(false);
  });

  it('returns false when intensity is below the combat threshold', () => {
    expect(shouldConsiderBurnsPiperAccent(
      100_000, 0, BURNS_PIPER_ACCENT_MIN_INTENSITY - 0.001, true,
    )).toBe(false);
  });

  it('returns false inside the cooldown even when Burns + intensity clear', () => {
    const last = 100_000;
    expect(shouldConsiderBurnsPiperAccent(
      last + BURNS_PIPER_ACCENT_COOLDOWN_MS - 1, last, 0.8, true,
    )).toBe(false);
  });

  it('returns true once cooldown clears and intensity meets the threshold', () => {
    const last = 100_000;
    expect(shouldConsiderBurnsPiperAccent(
      last + BURNS_PIPER_ACCENT_COOLDOWN_MS, last, BURNS_PIPER_ACCENT_MIN_INTENSITY, true,
    )).toBe(true);
    expect(shouldConsiderBurnsPiperAccent(
      last + BURNS_PIPER_ACCENT_COOLDOWN_MS + 5_000, last, 0.9, true,
    )).toBe(true);
  });

  it('cooldown is at least 15 s (sparse colour, not another instrument)', () => {
    expect(BURNS_PIPER_ACCENT_COOLDOWN_MS).toBeGreaterThanOrEqual(15_000);
  });
});
