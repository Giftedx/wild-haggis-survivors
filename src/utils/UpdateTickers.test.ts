import { describe, expect, it } from 'vitest';
import { UpdateTickers } from './UpdateTickers';

describe('UpdateTickers', () => {
  it('advances scaled once ticker when tickScaled(delta>0) is called', () => {
    const t = new UpdateTickers();
    let fired = 0;
    t.addOnce('scaled', 16, () => { fired++; });
    t.tickScaled(16);
    expect(fired).toBe(1);
  });

  it('does not advance scaled ticker when tickScaled(0) is called (timeScale===0 simulation)', () => {
    const t = new UpdateTickers();
    let fired = 0;
    t.addOnce('scaled', 16, () => { fired++; });
    t.tickScaled(0);
    expect(fired).toBe(0);
  });

  it('advances raw ticker while scaled is frozen', () => {
    const t = new UpdateTickers();
    let scaledFired = 0;
    let rawFired = 0;
    t.addOnce('scaled', 16, () => { scaledFired++; });
    t.addOnce('raw', 16, () => { rawFired++; });

    // Simulate gameplay pause: scaled delta is 0, raw delta still advances.
    t.tickScaled(0);
    t.tickRaw(16);

    expect(scaledFired).toBe(0);
    expect(rawFired).toBe(1);
  });

  it('interval ticker fires on a cadence then stops when repeats are exhausted', () => {
    const t = new UpdateTickers();
    let n = 0;
    t.addInterval('scaled', 30, () => { n++; }, { repeats: 2, startDelayMs: 30 });
    t.tickScaled(30);
    expect(n).toBe(1);
    t.tickScaled(30);
    expect(n).toBe(2);
    t.tickScaled(300);
    expect(n).toBe(2);
  });

  it('cancelling a pending once ticker prevents fire', () => {
    const t = new UpdateTickers();
    let n = 0;
    const h = t.addOnce('scaled', 25, () => { n++; });
    h.cancel();
    expect(h.cancelled).toBe(true);
    t.tickScaled(25);
    expect(n).toBe(0);
  });

  it('cancelling an interval ticker before first fire prevents any callback', () => {
    const t = new UpdateTickers();
    let n = 0;
    const h = t.addInterval('raw', 20, () => { n++; }, { startDelayMs: 50 });
    h.cancel();
    t.tickRaw(100);
    expect(n).toBe(0);
  });

  it('clear() removes pending once and interval tickers in both modes', () => {
    const t = new UpdateTickers();
    let once = 0;
    let interval = 0;
    t.addOnce('scaled', 10, () => { once++; });
    t.addInterval('raw', 10, () => { interval++; }, { startDelayMs: 10 });
    t.clear();
    t.tickScaled(100);
    t.tickRaw(100);
    expect(once).toBe(0);
    expect(interval).toBe(0);
  });

  it('ignores non-positive delta (no accidental catch-up)', () => {
    const t = new UpdateTickers();
    let n = 0;
    t.addOnce('scaled', 5, () => { n++; });
    t.tickScaled(-1);
    t.tickScaled(0);
    expect(n).toBe(0);
    t.tickScaled(5);
    expect(n).toBe(1);
  });
});

