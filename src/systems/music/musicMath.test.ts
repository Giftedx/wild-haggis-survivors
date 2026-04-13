import { describe, it, expect } from 'vitest';
import { clamp01, smoothstep01, expApproach, logLerp, softKnee, MOTION_TIMING } from './musicMath';

describe('musicMath', () => {
  it('clamp01 saturates', () => {
    expect(clamp01(-2)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(3)).toBe(1);
  });

  it('smoothstep01 is flat at ends', () => {
    expect(smoothstep01(0)).toBe(0);
    expect(smoothstep01(1)).toBe(1);
  });

  it('expApproach moves toward target monotonically', () => {
    let v = 0;
    for (let i = 0; i < 50; i++) {
      v = expApproach(v, 1, 16, 500);
    }
    expect(v).toBeGreaterThan(0.5);
    expect(v).toBeLessThanOrEqual(1);
  });

  it('logLerp interpolates geometrically', () => {
    expect(logLerp(100, 400, 0.5)).toBeCloseTo(200, 5);
  });

  it('softKnee is bounded', () => {
    expect(softKnee(0, 5, 2)).toBeLessThan(0.5);
    expect(softKnee(20, 5, 2)).toBeGreaterThan(0.99);
  });

  it('MOTION_TIMING exposes shared audio + UI constants', () => {
    expect(MOTION_TIMING.sfxMasterRampSec).toBeGreaterThan(0);
    expect(MOTION_TIMING.musicSfxDuckRecoverMs).toBeGreaterThan(0);
    expect(MOTION_TIMING.uiFadeFastMs).toBeLessThanOrEqual(MOTION_TIMING.uiFadeStandardMs);
  });

  it('MOTION_TIMING gameplay duck impulses increase with SFX salience', () => {
    expect(MOTION_TIMING.musicDuckKill).toBeLessThan(MOTION_TIMING.musicDuckPlayerHit);
    expect(MOTION_TIMING.musicDuckPlayerHit).toBeLessThan(MOTION_TIMING.musicDuckBoss);
    expect(MOTION_TIMING.musicDuckBoss).toBeLessThan(MOTION_TIMING.musicDuckDeath);
  });
});
