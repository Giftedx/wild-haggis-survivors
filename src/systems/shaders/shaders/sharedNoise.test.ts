import { describe, expect, it } from 'vitest';

import { createNoiseBuffer, DEFAULT_NOISE_SEED, DEFAULT_NOISE_SIZE } from './sharedNoise';

describe('createNoiseBuffer', () => {
  it('returns an RGBA buffer of the requested size', () => {
    const noise = createNoiseBuffer(64, 42);
    expect(noise.width).toBe(64);
    expect(noise.height).toBe(64);
    expect(noise.data.length).toBe(64 * 64 * 4);
  });

  it('is deterministic per seed — same seed, same bytes', () => {
    const a = createNoiseBuffer(32, 7);
    const b = createNoiseBuffer(32, 7);
    expect(a.data).toEqual(b.data);
  });

  it('differs across seeds', () => {
    const a = createNoiseBuffer(32, 1);
    const b = createNoiseBuffer(32, 2);
    // Different seeds must produce at least some differing pixels; byte-equal
    // would only happen by infinitesimal chance on mulberry32.
    let same = true;
    for (let i = 0; i < a.data.length; i++) {
      if (a.data[i] !== b.data[i]) { same = false; break; }
    }
    expect(same).toBe(false);
  });

  it('writes fully opaque alpha (A=255) on every pixel', () => {
    const noise = createNoiseBuffer(16, 5);
    for (let p = 0; p < noise.width * noise.height; p++) {
      expect(noise.data[p * 4 + 3]).toBe(255);
    }
  });

  it('writes greyscale (R === G === B) on every pixel', () => {
    const noise = createNoiseBuffer(16, 5);
    for (let p = 0; p < noise.width * noise.height; p++) {
      const r = noise.data[p * 4 + 0];
      const g = noise.data[p * 4 + 1];
      const b = noise.data[p * 4 + 2];
      expect(g).toBe(r);
      expect(b).toBe(r);
    }
  });

  it('produces values spanning a reasonable range (not flat grey)', () => {
    const noise = createNoiseBuffer(64, 42);
    let min = 255;
    let max = 0;
    for (let p = 0; p < noise.width * noise.height; p++) {
      const r = noise.data[p * 4];
      if (r < min) min = r;
      if (r > max) max = r;
    }
    // 2-octave value noise should reach near the full 0–255 range — soft but
    // not washed out. Loose bounds to avoid brittleness as the algorithm evolves.
    expect(max - min).toBeGreaterThanOrEqual(100);
  });

  it('defaults: DEFAULT_NOISE_SIZE=256, DEFAULT_NOISE_SEED=42 are exported', () => {
    expect(DEFAULT_NOISE_SIZE).toBe(256);
    expect(DEFAULT_NOISE_SEED).toBe(42);
  });
});
