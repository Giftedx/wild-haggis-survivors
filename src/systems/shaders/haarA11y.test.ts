import { describe, expect, it } from 'vitest';

import { capHaarForA11y, type HaarA11ySettings } from './haarA11y';

const NEUTRAL: HaarA11ySettings = { motionScale: 1, reduceParticles: false };

describe('capHaarForA11y', () => {
  it('returns inputs unchanged at neutral settings', () => {
    const out = capHaarForA11y(NEUTRAL, 0.8, { rampInMs: 800, holdMs: 500, rampOutMs: 1000 });
    expect(out.density).toBe(0.8);
    expect(out.transition).toEqual({ rampInMs: 800, holdMs: 500, rampOutMs: 1000 });
  });

  it('motionScale 0 caps density at 0.4 (photosensitivity-safe)', () => {
    const out = capHaarForA11y({ ...NEUTRAL, motionScale: 0 }, 0.8, { rampInMs: 800, holdMs: 500, rampOutMs: 1000 });
    expect(out.density).toBe(0.4);
  });

  it('motionScale 0 doubles ramp durations (slower, less jarring)', () => {
    const out = capHaarForA11y({ ...NEUTRAL, motionScale: 0 }, 0.8, { rampInMs: 800, holdMs: 500, rampOutMs: 1000 });
    expect(out.transition.rampInMs).toBe(1600);
    expect(out.transition.rampOutMs).toBe(2000);
    // Hold is unchanged — the hold isn't motion, it's stillness, so keeping
    // it at 500ms keeps the cinematic beat intact.
    expect(out.transition.holdMs).toBe(500);
  });

  it('motionScale 0.5 interpolates density cap toward 0.7 and ramp toward 1.5×', () => {
    const out = capHaarForA11y({ ...NEUTRAL, motionScale: 0.5 }, 1, { rampInMs: 800, holdMs: 500, rampOutMs: 1000 });
    // Linear cap: 0.4 (at m=0) → 1.0 (at m=1). At m=0.5 → 0.7.
    expect(out.density).toBeCloseTo(0.7, 5);
    // Linear ramp scale: 1× (m=1) → 2× (m=0). At m=0.5 → 1.5×.
    expect(out.transition.rampInMs).toBe(1200);
    expect(out.transition.rampOutMs).toBe(1500);
  });

  it('does not raise density beyond its inbound value', () => {
    // If the caller asks for 0.2 and the a11y cap would allow 0.7, output
    // stays at 0.2 — caps only ever reduce.
    const out = capHaarForA11y({ ...NEUTRAL, motionScale: 0.5 }, 0.2, { rampInMs: 800, holdMs: 500, rampOutMs: 1000 });
    expect(out.density).toBe(0.2);
  });

  it('reduceParticles=true hard-caps density at 0.5 regardless of motionScale', () => {
    const out = capHaarForA11y({ motionScale: 1, reduceParticles: true }, 0.8, { rampInMs: 800, holdMs: 500, rampOutMs: 1000 });
    expect(out.density).toBe(0.5);
  });

  it('reduceParticles + motionScale 0 take the stricter cap', () => {
    // reduceParticles caps at 0.5; motionScale 0 caps at 0.4. The stricter
    // (lower) cap wins.
    const out = capHaarForA11y({ motionScale: 0, reduceParticles: true }, 0.8, { rampInMs: 800, holdMs: 500, rampOutMs: 1000 });
    expect(out.density).toBe(0.4);
  });

  it('clamps negative densities to 0', () => {
    const out = capHaarForA11y(NEUTRAL, -0.3, { rampInMs: 100, holdMs: 50, rampOutMs: 100 });
    expect(out.density).toBe(0);
  });
});
