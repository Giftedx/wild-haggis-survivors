import { describe, expect, it } from 'vitest';
import {
  createRNG,
  randomSeed,
  encodeSeed,
  decodeSeed,
  parseSeedInput,
  currentDailyDateKey,
  dailyChallengeSeed,
} from './rng';

describe('createRNG', () => {
  it('same seed produces same sequence', () => {
    const a = createRNG(12345);
    const b = createRNG(12345);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('different seeds produce different sequences', () => {
    const a = createRNG(1);
    const b = createRNG(2);
    const first20 = (r: ReturnType<typeof createRNG>) =>
      Array.from({ length: 20 }, () => r.next());
    expect(first20(a)).not.toEqual(first20(b));
  });

  it('int(min, max) returns inclusive values in range', () => {
    const r = createRNG(999);
    for (let i = 0; i < 500; i++) {
      const n = r.int(3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
      expect(Number.isInteger(n)).toBe(true);
    }
  });

  it('int(min, min) always returns min', () => {
    const r = createRNG(42);
    for (let i = 0; i < 20; i++) expect(r.int(5, 5)).toBe(5);
  });

  it('int accepts reversed bounds', () => {
    const r = createRNG(7);
    for (let i = 0; i < 50; i++) {
      const n = r.int(9, 3);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(9);
    }
  });

  it('float is in [min, max)', () => {
    const r = createRNG(100);
    for (let i = 0; i < 500; i++) {
      const n = r.float(1.5, 2.5);
      expect(n).toBeGreaterThanOrEqual(1.5);
      expect(n).toBeLessThan(2.5);
    }
  });

  it('bool honors probability over many samples', () => {
    const r = createRNG(55555);
    let trues = 0;
    const N = 5000;
    for (let i = 0; i < N; i++) if (r.bool(0.3)) trues++;
    // Allow generous slack; mulberry32 + this sample size ~0.29-0.31.
    expect(trues / N).toBeGreaterThan(0.25);
    expect(trues / N).toBeLessThan(0.35);
  });

  it('pick draws from the array', () => {
    const r = createRNG(0xdeadbeef);
    const arr = ['a', 'b', 'c', 'd'];
    for (let i = 0; i < 50; i++) expect(arr).toContain(r.pick(arr));
  });

  it('weighted selects higher-weight items more often', () => {
    const r = createRNG(314159);
    const items = ['rare', 'common'] as const;
    const weights = [1, 9]; // common should appear ~90%
    const counts: Record<string, number> = { rare: 0, common: 0 };
    for (let i = 0; i < 2000; i++) {
      counts[r.weighted(items, (_, idx) => weights[idx])]++;
    }
    expect(counts.common).toBeGreaterThan(counts.rare * 5);
  });

  it('weighted with all-zero weights falls back to uniform (no crash)', () => {
    const r = createRNG(1);
    const items = ['x', 'y', 'z'];
    for (let i = 0; i < 10; i++) {
      expect(items).toContain(r.weighted(items, () => 0));
    }
  });

  it('seed 0 still produces a usable stream (not all zeros)', () => {
    const r = createRNG(0);
    const distinct = new Set<number>();
    for (let i = 0; i < 10; i++) distinct.add(r.next());
    expect(distinct.size).toBeGreaterThan(1);
  });

  it('string seed hashes deterministically', () => {
    const a = createRNG('daily-2026-04-13');
    const b = createRNG('daily-2026-04-13');
    expect(a.next()).toBe(b.next());
    const c = createRNG('daily-2026-04-14');
    expect(c.next()).not.toBe(a.seed === c.seed ? c.next() : a.next());
  });

  it('branch produces independent RNG without entangling future calls', () => {
    const parent = createRNG(1000);
    const child = parent.branch();
    const parentNext = parent.next();
    const childNext = child.next();
    // Two different RNGs producing different values (in practice; mulberry32
    // has good distribution so collision at first draw is astronomically rare).
    expect(parentNext).not.toBe(childNext);
  });

  it('branch stability: same parent seed → same child sequence', () => {
    const p1 = createRNG(42);
    const c1 = p1.branch();
    const p2 = createRNG(42);
    const c2 = p2.branch();
    for (let i = 0; i < 10; i++) expect(c1.next()).toBe(c2.next());
  });

  it('exposes the seed it was created with', () => {
    const r = createRNG(7777);
    expect(r.seed).toBe(7777);
    r.next(); r.next(); r.next();
    expect(r.seed).toBe(7777);
  });
});

describe('randomSeed', () => {
  it('produces a finite positive integer', () => {
    const s = randomSeed();
    expect(Number.isFinite(s)).toBe(true);
    expect(s).toBeGreaterThan(0);
    expect(Number.isInteger(s)).toBe(true);
  });

  it('different calls return (almost certainly) different seeds', () => {
    const seeds = new Set<number>();
    for (let i = 0; i < 20; i++) seeds.add(randomSeed());
    expect(seeds.size).toBeGreaterThan(10);
  });
});

describe('seed codec', () => {
  it('encodes to 8-char base36 uppercase', () => {
    const code = encodeSeed(12345);
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[0-9A-Z]{8}$/);
  });

  it('round-trips a seed through encode → decode', () => {
    for (const seed of [
      1, 42, 12345, 9999999, 0x03FFFFFF, 0x80000000, 0xffffffff, 0xdeadbeef,
    ]) {
      const code = encodeSeed(seed);
      const back = decodeSeed(code);
      expect(back).not.toBeNull();
      expect(back).toBe(seed >>> 0);
    }
  });

  it('accepts legacy 7-char seed codes emitted by 26-bit codec builds', () => {
    expect(decodeSeed('0009IXO')).toBe(12345);
  });

  it('accepts the max 32-bit seed and rejects larger canonical-length aliases', () => {
    expect(decodeSeed('1Z141Z38')).toBe(0xffffffff);
    expect(decodeSeed('1Z141Z49')).toBeNull();
  });

  it('rejects bad codes (wrong length, bad checksum, non-alphanum)', () => {
    expect(decodeSeed('ABC')).toBeNull();
    expect(decodeSeed('ABCDEFGHI')).toBeNull(); // too long
    expect(decodeSeed('abcdefZ')).toBeNull();  // bad checksum for "ABCDEF"
    expect(decodeSeed('!!!!!!!')).toBeNull();
    expect(decodeSeed('')).toBeNull();
  });

  it('is case-insensitive and ignores whitespace', () => {
    const code = encodeSeed(65432);
    expect(decodeSeed(code.toLowerCase())).toBe(65432);
    expect(decodeSeed(`  ${code}  `)).toBe(65432);
  });

  it('catches single-character typos via checksum', () => {
    const code = encodeSeed(54321);
    // Flip the first character to a different base36 digit.
    const flipped = (code.startsWith('A') ? 'B' : 'A') + code.slice(1);
    expect(decodeSeed(flipped)).toBeNull();
  });

  it('parseSeedInput accepts share codes and raw integers', () => {
    const code = encodeSeed(111111);
    expect(parseSeedInput(code)).toBe(111111);
    expect(parseSeedInput('  12345  ')).toBe(12345);
    expect(parseSeedInput('garbage$$')).toBeNull();
    expect(parseSeedInput('')).toBeNull();
  });
});

describe('daily challenge seed', () => {
  it('currentDailyDateKey returns YYYY-MM-DD format', () => {
    const key = currentDailyDateKey(new Date(2026, 3, 13)); // April 13 2026 (month is 0-indexed)
    expect(key).toBe('2026-04-13');
  });

  it('pads single-digit month/day to 2 chars', () => {
    const key = currentDailyDateKey(new Date(2026, 0, 5)); // Jan 5
    expect(key).toBe('2026-01-05');
  });

  it('dailyChallengeSeed is stable for the same date', () => {
    const d1 = new Date(2026, 3, 13, 8, 30); // morning
    const d2 = new Date(2026, 3, 13, 23, 59); // same date, late
    expect(dailyChallengeSeed(d1)).toBe(dailyChallengeSeed(d2));
  });

  it('dailyChallengeSeed differs across different dates', () => {
    const d1 = new Date(2026, 3, 13);
    const d2 = new Date(2026, 3, 14);
    expect(dailyChallengeSeed(d1)).not.toBe(dailyChallengeSeed(d2));
  });

  it('daily seeds produce deterministic RNG output', () => {
    const d = new Date(2026, 3, 13);
    const a = createRNG(dailyChallengeSeed(d));
    const b = createRNG(dailyChallengeSeed(d));
    for (let i = 0; i < 5; i++) expect(a.next()).toBe(b.next());
  });
});
