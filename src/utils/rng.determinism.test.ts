import { describe, expect, it } from 'vitest';
import { createRNG, dailyChallengeSeed, encodeSeed, decodeSeed } from './rng';
import { buildCardPool, drawCards, PASSIVE_KEYS, type UpgradeCard } from '../data/upgrades';

/**
 * End-to-end determinism checks for the seeded-run system. These are the
 * invariants that give Daily Challenges + shareable seeds their social
 * value: two players running the same seed must see the same cards, the
 * same crit sequence, and the same spawn order. Break any of these and
 * the "try to beat my time on today's seed" promise is empty.
 */
describe('seeded run determinism — card draws', () => {
  const makeFullPool = (): UpgradeCard[] =>
    buildCardPool([], [], {}, []);

  it('same seed produces identical card draws', () => {
    const pool = makeFullPool();
    const a = createRNG(42);
    const b = createRNG(42);
    const drawA = drawCards(pool, 3, 0, () => a.next());
    const drawB = drawCards(pool, 3, 0, () => b.next());
    expect(drawA.map((c) => c.id)).toEqual(drawB.map((c) => c.id));
  });

  it('same seed over many levels produces identical long card histories', () => {
    const pool = makeFullPool();
    const a = createRNG(7777);
    const b = createRNG(7777);
    const historyA: string[] = [];
    const historyB: string[] = [];
    for (let level = 0; level < 20; level++) {
      historyA.push(...drawCards(pool, 3, 0, () => a.next()).map((c) => c.id));
      historyB.push(...drawCards(pool, 3, 0, () => b.next()).map((c) => c.id));
    }
    expect(historyA).toEqual(historyB);
  });

  it('different seeds produce (almost certainly) different card histories', () => {
    const pool = makeFullPool();
    const a = createRNG(1);
    const b = createRNG(2);
    const drawA = drawCards(pool, 3, 0, () => a.next()).map((c) => c.id);
    const drawB = drawCards(pool, 3, 0, () => b.next()).map((c) => c.id);
    // With 3 cards drawn from a pool of ~20, collision probability is low.
    expect(drawA).not.toEqual(drawB);
  });

  it('luck bonus composes deterministically with seed', () => {
    const pool = makeFullPool();
    const a = createRNG(123);
    const b = createRNG(123);
    const drawA = drawCards(pool, 3, 40, () => a.next()).map((c) => c.id);
    const drawB = drawCards(pool, 3, 40, () => b.next()).map((c) => c.id);
    expect(drawA).toEqual(drawB);
  });
});

describe('seeded run determinism — crit rolls', () => {
  it('same seed produces identical crit sequences at a given crit chance', () => {
    const a = createRNG(9999);
    const b = createRNG(9999);
    const critChance = 0.25;
    const seqA = Array.from({ length: 100 }, () => a.bool(critChance));
    const seqB = Array.from({ length: 100 }, () => b.bool(critChance));
    expect(seqA).toEqual(seqB);
  });

  it('crit-rate converges to chance over many rolls (spot-check 0.25 rate)', () => {
    const r = createRNG(1337);
    let crits = 0;
    const N = 5000;
    for (let i = 0; i < N; i++) if (r.bool(0.25)) crits++;
    // Allow slack; at N=5000 a 0.25 rate should sit within roughly ±0.03.
    expect(crits / N).toBeGreaterThan(0.22);
    expect(crits / N).toBeLessThan(0.28);
  });
});

describe('seeded run determinism — passive picks (pool-draw mimic)', () => {
  it('same seed picks the same "lucky start" passive', () => {
    const a = createRNG(555);
    const b = createRNG(555);
    expect(a.pick(PASSIVE_KEYS)).toBe(b.pick(PASSIVE_KEYS));
  });

  it('different seeds can pick different passives', () => {
    const a = createRNG(100);
    const b = createRNG(200);
    // Not strictly required but in practice ~7/8 of the time they differ.
    const picks: string[] = [];
    for (let i = 0; i < 20; i++) {
      const r1 = createRNG(i * 1000 + 1);
      const r2 = createRNG(i * 1000 + 2);
      picks.push(`${r1.pick(PASSIVE_KEYS)}|${r2.pick(PASSIVE_KEYS)}`);
    }
    // Expect at least SOME variety across 20 different seed pairs.
    const uniqueCrosses = new Set(picks).size;
    expect(uniqueCrosses).toBeGreaterThan(1);
    // Silence unused-var warnings.
    expect(a.seed).not.toBe(b.seed);
  });
});

describe('daily seed stability', () => {
  it('daily seed is the same across the whole calendar day (hours don\'t shift it)', () => {
    const morning = new Date(2026, 3, 13, 5, 0, 0);
    const noon = new Date(2026, 3, 13, 12, 0, 0);
    const night = new Date(2026, 3, 13, 23, 59, 59);
    expect(dailyChallengeSeed(morning)).toBe(dailyChallengeSeed(noon));
    expect(dailyChallengeSeed(noon)).toBe(dailyChallengeSeed(night));
  });

  it('daily seed changes across calendar day boundaries', () => {
    const today = new Date(2026, 3, 13);
    const tomorrow = new Date(2026, 3, 14);
    expect(dailyChallengeSeed(today)).not.toBe(dailyChallengeSeed(tomorrow));
  });

  it('seeded card draws are stable end-to-end from daily seed', () => {
    const pool = buildCardPool([], [], {}, []);
    const today = new Date(2026, 3, 13);
    const a = createRNG(dailyChallengeSeed(today));
    const b = createRNG(dailyChallengeSeed(today));
    expect(drawCards(pool, 3, 0, () => a.next()).map((c) => c.id))
      .toEqual(drawCards(pool, 3, 0, () => b.next()).map((c) => c.id));
  });
});

describe('seed share codes', () => {
  it('round-trip through encode/decode reproduces the effective seed', () => {
    const original = 42;
    const code = encodeSeed(original);
    const decoded = decodeSeed(code);
    expect(decoded).not.toBeNull();
    // Then seed an RNG with both and confirm they produce the same stream
    // (the codec masks to 26 bits, but for small inputs they match).
    const a = createRNG(original);
    const b = createRNG(decoded!);
    expect(a.next()).toBe(b.next());
  });

  it('players pasting a shared code get the same card draws as the sender', () => {
    const senderSeed = 123456;
    const senderCode = encodeSeed(senderSeed);
    const receiverSeed = decodeSeed(senderCode)!;
    const pool = buildCardPool([], [], {}, []);
    const senderRng = createRNG(senderSeed);
    const receiverRng = createRNG(receiverSeed);
    const senderCards = drawCards(pool, 3, 0, () => senderRng.next()).map((c) => c.id);
    const receiverCards = drawCards(pool, 3, 0, () => receiverRng.next()).map((c) => c.id);
    expect(senderCards).toEqual(receiverCards);
  });
});
