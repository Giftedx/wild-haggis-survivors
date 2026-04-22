import { describe, expect, it } from 'vitest';
import {
  FIRST_NAMES,
  EPITHETS,
  KIN_TERMS,
  generateHaggisName,
  generateHaggisNameFromHash,
} from './haggisNames';

describe('haggis name pools', () => {
  it('has at least 30 first names', () => {
    expect(FIRST_NAMES.length).toBeGreaterThanOrEqual(30);
  });

  it('has at least 12 epithets', () => {
    expect(EPITHETS.length).toBeGreaterThanOrEqual(12);
  });

  it('has at least 8 kin terms', () => {
    expect(KIN_TERMS.length).toBeGreaterThanOrEqual(8);
  });

  it('first names have no duplicates', () => {
    expect(new Set(FIRST_NAMES).size).toBe(FIRST_NAMES.length);
  });
});

describe('generateHaggisName', () => {
  it('always returns a non-empty string', () => {
    for (let i = 0; i < 100; i++) {
      const name = generateHaggisName(() => Math.random());
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it('applies epithets some of the time (30–60% band over 1000 samples)', () => {
    let withEpithet = 0;
    for (let i = 0; i < 1000; i++) {
      const name = generateHaggisName(() => Math.random());
      if (EPITHETS.some((e) => name.includes(e))) withEpithet++;
    }
    expect(withEpithet).toBeGreaterThan(300);
    expect(withEpithet).toBeLessThan(600);
  });
});

describe('generateHaggisNameFromHash', () => {
  it('same hash input always produces same name (determinism)', () => {
    const a = generateHaggisNameFromHash('seed-xyz-12345');
    const b = generateHaggisNameFromHash('seed-xyz-12345');
    expect(a).toBe(b);
  });

  it('different hash inputs usually produce different names', () => {
    const a = generateHaggisNameFromHash('seed-a');
    const b = generateHaggisNameFromHash('seed-b');
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBeGreaterThan(0);
  });
});
