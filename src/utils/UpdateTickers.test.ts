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
});

