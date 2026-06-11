import { describe, it, expect } from 'vitest';
import {
  clamp01,
  smoothstep,
  smoothstep01,
  expApproach,
  logLerp,
  softKnee,
  MOTION_TIMING,
} from './musicMath';

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

  it('smoothstep matches smoothstep01 for a 0..1 window', () => {
    expect(smoothstep(0, 1, 0.25)).toBe(smoothstep01(0.25));
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 2)).toBe(1);
  });

  it('smoothstep is 1 when both edges coincide', () => {
    expect(smoothstep(3, 3, 0)).toBe(1);
    expect(smoothstep(3, 3, 99)).toBe(1);
  });

  it('expApproach snaps to target when tauMs is non-positive', () => {
    expect(expApproach(0.5, 1, 16, 0)).toBe(1);
    expect(expApproach(0.5, 1, 16, -40)).toBe(1);
    expect(expApproach(0.8, 0, 10, 0)).toBe(0);
  });

  it('logLerp uses linear blend when an endpoint is non-positive', () => {
    expect(logLerp(0, 100, 0.25)).toBe(25);
    expect(logLerp(100, 0, 0.5)).toBe(50);
  });

  it('expApproach moves toward target monotonically', () => {
    let v = 0;
    for (let i = 0; i < 50; i++) {
      v = expApproach(v, 1, 16, 500);
    }
    expect(v).toBeGreaterThan(0.5);
    expect(v).toBeLessThanOrEqual(1);
  });

  it('expApproach toward zero matches legacy musicSfxDuck decay step', () => {
    const duck = 0.73;
    const deltaMs = 16;
    const tau = MOTION_TIMING.musicSfxDuckRecoverMs;
    const a = 1 - Math.exp(-deltaMs / tau);
    const legacy = duck + (0 - duck) * Math.min(1, a);
    expect(expApproach(duck, 0, deltaMs, tau)).toBeCloseTo(legacy, 12);
  });

  it('logLerp interpolates geometrically', () => {
    expect(logLerp(100, 400, 0.5)).toBeCloseTo(200, 5);
  });

  it('logLerp clamps t to 0..1 in geometric mode', () => {
    expect(logLerp(100, 400, -1)).toBeCloseTo(100, 5);
    expect(logLerp(100, 400, 2)).toBeCloseTo(400, 5);
  });

  it('softKnee is bounded', () => {
    expect(softKnee(0, 5, 2)).toBeLessThan(0.5);
    expect(softKnee(20, 5, 2)).toBeGreaterThan(0.99);
  });

  it('softKnee is a hard step when span is non-positive', () => {
    expect(softKnee(4, 5, 0)).toBe(0);
    expect(softKnee(5, 5, 0)).toBe(1);
    expect(softKnee(6, 5, 0)).toBe(1);
    expect(softKnee(4, 5, -1)).toBe(0);
  });

  it('MOTION_TIMING exposes shared audio + UI constants', () => {
    expect(MOTION_TIMING.sfxMasterRampSec).toBeGreaterThan(0);
    expect(MOTION_TIMING.musicSfxDuckRecoverMs).toBeGreaterThan(0);
    expect(MOTION_TIMING.uiFadeFastMs).toBeLessThanOrEqual(MOTION_TIMING.uiFadeStandardMs);
  });

  it('MOTION_TIMING gameplay duck impulses increase with SFX salience', () => {
    expect(MOTION_TIMING.musicDuckAchievement).toBeLessThan(MOTION_TIMING.musicDuckPurchase);
    expect(MOTION_TIMING.musicDuckPurchase).toBeLessThan(MOTION_TIMING.musicDuckLevelUp);
    expect(MOTION_TIMING.musicDuckLevelUp).toBeLessThan(MOTION_TIMING.musicDuckKill);
    expect(MOTION_TIMING.musicDuckKill).toBeLessThan(MOTION_TIMING.musicDuckPlayerHit);
    expect(MOTION_TIMING.musicDuckPlayerHit).toBeLessThan(MOTION_TIMING.musicDuckBoss);
    expect(MOTION_TIMING.musicDuckBoss).toBeLessThan(MOTION_TIMING.musicDuckDeath);
  });
});
