import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMotionScale,
  scaledShakeAmplitude,
  scaledFlashAlpha,
  scaledFlashDurationMs,
  scaledSlowMoDurationMs,
  scaledParticleCount,
  scaledTweenDurationMs,
  isReduceFlashingOn,
} from './a11yMotion';
import {
  getSettingsManager,
  resetSettingsManagerSingletonForTests,
} from './SettingsManager';

describe('a11yMotion helpers', () => {
  beforeEach(() => {
    resetSettingsManagerSingletonForTests();
  });

  it('reads motionScale live from settings', () => {
    const sm = getSettingsManager();
    sm.update((cur) => ({ ...cur, motionScale: 0.4 }));
    expect(getMotionScale()).toBe(0.4);
    sm.update((cur) => ({ ...cur, motionScale: 1 }));
    expect(getMotionScale()).toBe(1);
  });

  it('scales shake amplitude proportionally', () => {
    const sm = getSettingsManager();
    sm.update((cur) => ({ ...cur, motionScale: 0.5 }));
    expect(scaledShakeAmplitude(0.02)).toBeCloseTo(0.01, 5);
    sm.update((cur) => ({ ...cur, motionScale: 0 }));
    expect(scaledShakeAmplitude(0.02)).toBe(0);
  });

  it('scales flash alpha with floor at 0', () => {
    const sm = getSettingsManager();
    sm.update((cur) => ({ ...cur, motionScale: 0.3 }));
    expect(scaledFlashAlpha(0.4)).toBeCloseTo(0.12, 5);
    sm.update((cur) => ({ ...cur, motionScale: 0 }));
    expect(scaledFlashAlpha(0.4)).toBe(0);
  });

  it('clamps slow-mo duration at 60ms floor', () => {
    const sm = getSettingsManager();
    sm.update((cur) => ({ ...cur, motionScale: 0.1 }));
    expect(scaledSlowMoDurationMs(300)).toBe(60);
    sm.update((cur) => ({ ...cur, motionScale: 1 }));
    expect(scaledSlowMoDurationMs(300)).toBe(300);
  });

  it('particle count respects floor and rounds up', () => {
    const sm = getSettingsManager();
    sm.update((cur) => ({ ...cur, motionScale: 0.1 }));
    expect(scaledParticleCount(30)).toBe(4);
    sm.update((cur) => ({ ...cur, motionScale: 0.5 }));
    expect(scaledParticleCount(30)).toBe(15);
    sm.update((cur) => ({ ...cur, motionScale: 1 }));
    expect(scaledParticleCount(30)).toBe(30);
  });

  it('tween duration never drops below 120ms', () => {
    const sm = getSettingsManager();
    sm.update((cur) => ({ ...cur, motionScale: 0.1 }));
    expect(scaledTweenDurationMs(300)).toBe(120);
    sm.update((cur) => ({ ...cur, motionScale: 1 }));
    expect(scaledTweenDurationMs(300)).toBe(300);
  });

  describe('reduceFlashing', () => {
    it('reads live from settings via isReduceFlashingOn', () => {
      const sm = getSettingsManager();
      sm.update((cur) => ({ ...cur, reduceFlashing: true }));
      expect(isReduceFlashingOn()).toBe(true);
      sm.update((cur) => ({ ...cur, reduceFlashing: false }));
      expect(isReduceFlashingOn()).toBe(false);
    });

    it('caps flash alpha at 0.4 when reduceFlashing is on', () => {
      const sm = getSettingsManager();
      // baseline: full motion, flashing allowed — unclipped
      sm.update((cur) => ({ ...cur, motionScale: 1, reduceFlashing: false }));
      expect(scaledFlashAlpha(0.8)).toBeCloseTo(0.8, 5);
      // reduceFlashing clips to 0.4
      sm.update((cur) => ({ ...cur, motionScale: 1, reduceFlashing: true }));
      expect(scaledFlashAlpha(0.8)).toBeCloseTo(0.4, 5);
      // and honours the stricter of (motionScale, reduceFlashing cap)
      sm.update((cur) => ({ ...cur, motionScale: 0.2, reduceFlashing: true }));
      expect(scaledFlashAlpha(0.8)).toBeCloseTo(0.16, 5);
    });

    it('lowers the flash alpha cap below 0.4 if base is already below', () => {
      const sm = getSettingsManager();
      sm.update((cur) => ({ ...cur, motionScale: 1, reduceFlashing: true }));
      expect(scaledFlashAlpha(0.2)).toBeCloseTo(0.2, 5);
    });

    it('scaledFlashDurationMs passes through at default settings', () => {
      const sm = getSettingsManager();
      sm.update((cur) => ({ ...cur, reduceFlashing: false }));
      expect(scaledFlashDurationMs(150)).toBe(150);
      expect(scaledFlashDurationMs(400)).toBe(400);
    });

    it('scaledFlashDurationMs floors at 200ms when reduceFlashing is on', () => {
      const sm = getSettingsManager();
      sm.update((cur) => ({ ...cur, reduceFlashing: true }));
      expect(scaledFlashDurationMs(100)).toBe(200);
      expect(scaledFlashDurationMs(150)).toBe(200);
      expect(scaledFlashDurationMs(250)).toBe(250);
    });
  });
});
