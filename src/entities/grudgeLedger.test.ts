import { describe, it, expect } from 'vitest';
import {
  createGrudgeLedger,
  recordGrudgeFinish,
  judgeGrudge,
  GRUDGE_MIN_FINISHES,
  GRUDGE_COWARD_DISTANCE_PX,
  GRUDGE_BRUISER_DISTANCE_PX,
  GRUDGE_PRECISE_HP_FRAC,
  GRUDGE_RECKLESS_HP_FRAC,
  type GrudgeFinish,
} from './grudgeLedger';

const finish = (overrides: Partial<GrudgeFinish> = {}): GrudgeFinish => ({
  distancePx: 175,
  hpFraction: 0.5,
  wasBoss: false,
  ...overrides,
});

describe('grudgeLedger', () => {
  it('returns "even" when no finishes recorded', () => {
    const s = createGrudgeLedger();
    expect(judgeGrudge(s)).toBe('even');
  });

  it('returns "even" when fewer than min finishes recorded', () => {
    const s = createGrudgeLedger();
    for (let i = 0; i < GRUDGE_MIN_FINISHES - 1; i++) {
      recordGrudgeFinish(s, finish({ hpFraction: 0.95 }));
    }
    expect(judgeGrudge(s)).toBe('even');
  });

  it('returns "precise" when median HP fraction ≥ threshold', () => {
    const s = createGrudgeLedger();
    for (let i = 0; i < GRUDGE_MIN_FINISHES; i++) {
      recordGrudgeFinish(s, finish({ hpFraction: GRUDGE_PRECISE_HP_FRAC + 0.01 }));
    }
    expect(judgeGrudge(s)).toBe('precise');
  });

  it('returns "reckless" when median HP fraction ≤ threshold', () => {
    const s = createGrudgeLedger();
    for (let i = 0; i < GRUDGE_MIN_FINISHES; i++) {
      recordGrudgeFinish(s, finish({ hpFraction: GRUDGE_RECKLESS_HP_FRAC - 0.01 }));
    }
    expect(judgeGrudge(s)).toBe('reckless');
  });

  it('returns "coward" when median distance ≥ threshold (and HP mid-band)', () => {
    const s = createGrudgeLedger();
    for (let i = 0; i < GRUDGE_MIN_FINISHES; i++) {
      recordGrudgeFinish(
        s,
        finish({ distancePx: GRUDGE_COWARD_DISTANCE_PX + 40, hpFraction: 0.5 }),
      );
    }
    expect(judgeGrudge(s)).toBe('coward');
  });

  it('returns "bruiser" when median distance ≤ threshold (and HP mid-band)', () => {
    const s = createGrudgeLedger();
    for (let i = 0; i < GRUDGE_MIN_FINISHES; i++) {
      recordGrudgeFinish(
        s,
        finish({ distancePx: GRUDGE_BRUISER_DISTANCE_PX - 40, hpFraction: 0.5 }),
      );
    }
    expect(judgeGrudge(s)).toBe('bruiser');
  });

  it('precedence: precise wins over coward when both extremes apply', () => {
    const s = createGrudgeLedger();
    for (let i = 0; i < GRUDGE_MIN_FINISHES; i++) {
      recordGrudgeFinish(s, finish({ distancePx: 320, hpFraction: 0.95 }));
    }
    expect(judgeGrudge(s)).toBe('precise');
  });

  it('precedence: reckless wins over bruiser when both extremes apply', () => {
    const s = createGrudgeLedger();
    for (let i = 0; i < GRUDGE_MIN_FINISHES; i++) {
      recordGrudgeFinish(s, finish({ distancePx: 60, hpFraction: 0.15 }));
    }
    expect(judgeGrudge(s)).toBe('reckless');
  });

  it('returns "even" for neutral pattern (mid HP, mid distance)', () => {
    const s = createGrudgeLedger();
    for (let i = 0; i < GRUDGE_MIN_FINISHES; i++) {
      recordGrudgeFinish(s, finish({ distancePx: 175, hpFraction: 0.5 }));
    }
    expect(judgeGrudge(s)).toBe('even');
  });

  it('clamps hpFraction to [0,1] on record', () => {
    const s = createGrudgeLedger();
    recordGrudgeFinish(s, finish({ hpFraction: 1.5 }));
    recordGrudgeFinish(s, finish({ hpFraction: -0.2 }));
    expect(s.finishes[0].hpFraction).toBe(1);
    expect(s.finishes[1].hpFraction).toBe(0);
  });

  it('clamps negative distance to 0 on record', () => {
    const s = createGrudgeLedger();
    recordGrudgeFinish(s, finish({ distancePx: -50 }));
    expect(s.finishes[0].distancePx).toBe(0);
  });

  it('persists wasBoss flag verbatim', () => {
    const s = createGrudgeLedger();
    recordGrudgeFinish(s, finish({ wasBoss: true }));
    recordGrudgeFinish(s, finish({ wasBoss: false }));
    expect(s.finishes[0].wasBoss).toBe(true);
    expect(s.finishes[1].wasBoss).toBe(false);
  });

  it('verdict is deterministic for identical finish streams', () => {
    const a = createGrudgeLedger();
    const b = createGrudgeLedger();
    const stream: GrudgeFinish[] = [
      finish({ distancePx: 100, hpFraction: 0.9 }),
      finish({ distancePx: 80, hpFraction: 0.95 }),
      finish({ distancePx: 60, hpFraction: 0.85 }),
      finish({ distancePx: 50, hpFraction: 0.92 }),
    ];
    stream.forEach((f) => {
      recordGrudgeFinish(a, f);
      recordGrudgeFinish(b, f);
    });
    expect(judgeGrudge(a)).toBe(judgeGrudge(b));
  });

  it('odd-length median uses middle element', () => {
    const s = createGrudgeLedger();
    recordGrudgeFinish(s, finish({ hpFraction: 0.1 }));
    recordGrudgeFinish(s, finish({ hpFraction: 0.9 }));
    recordGrudgeFinish(s, finish({ hpFraction: 0.95 }));
    expect(judgeGrudge(s)).toBe('precise');
  });

  it('even-length median averages the two middle elements', () => {
    const s = createGrudgeLedger();
    recordGrudgeFinish(s, finish({ distancePx: 50, hpFraction: 0.5 }));
    recordGrudgeFinish(s, finish({ distancePx: 90, hpFraction: 0.5 }));
    recordGrudgeFinish(s, finish({ distancePx: 110, hpFraction: 0.5 }));
    recordGrudgeFinish(s, finish({ distancePx: 200, hpFraction: 0.5 }));
    expect(judgeGrudge(s)).toBe('bruiser');
  });
});
