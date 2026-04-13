import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMotionScale,
  scaledShakeAmplitude,
  scaledFlashAlpha,
  scaledSlowMoDurationMs,
  scaledParticleCount,
  scaledTweenDurationMs,
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
});
