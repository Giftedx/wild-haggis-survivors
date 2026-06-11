import { describe, it, expect } from 'vitest';
import {
  resolveScreenShakeParams,
  BOSS_SHAKE_BASE_AMP,
  BOSS_SHAKE_DURATION_MS,
  BOSS_DEATH_SHAKE_BASE_AMP,
  BOSS_DEATH_SHAKE_DURATION_MS,
} from './screenShakeParams';

describe('resolveScreenShakeParams', () => {
  it('returns a shake with amplitude = base × motionScale and the supplied duration', () => {
    const out = resolveScreenShakeParams(0.015, 400, true, 1);
    expect(out).not.toBeNull();
    expect(out!.durationMs).toBe(400);
    expect(out!.amplitude).toBeCloseTo(0.015, 9);
  });

  it('scales amplitude by motionScale', () => {
    const half = resolveScreenShakeParams(0.02, 500, true, 0.5);
    expect(half!.amplitude).toBeCloseTo(0.01, 9);
    const double = resolveScreenShakeParams(0.02, 500, true, 2);
    expect(double!.amplitude).toBeCloseTo(0.04, 9);
  });

  it('returns null when screen shake is disabled in settings', () => {
    expect(resolveScreenShakeParams(0.015, 400, false, 1)).toBeNull();
  });

  it('returns null when motionScale collapses the amplitude to zero', () => {
    expect(resolveScreenShakeParams(0.015, 400, true, 0)).toBeNull();
  });

  it('returns null when motionScale is negative (defensive)', () => {
    expect(resolveScreenShakeParams(0.015, 400, true, -1)).toBeNull();
  });

  it('returns null when base amplitude is 0 (never meaningful)', () => {
    expect(resolveScreenShakeParams(0, 400, true, 1)).toBeNull();
  });
});

describe('tuning constants', () => {
  it('boss-hit shake is shorter + softer than boss-death shake', () => {
    expect(BOSS_SHAKE_DURATION_MS).toBeLessThan(BOSS_DEATH_SHAKE_DURATION_MS);
    expect(BOSS_SHAKE_BASE_AMP).toBeLessThan(BOSS_DEATH_SHAKE_BASE_AMP);
  });

  it('all four constants are positive', () => {
    expect(BOSS_SHAKE_BASE_AMP).toBeGreaterThan(0);
    expect(BOSS_SHAKE_DURATION_MS).toBeGreaterThan(0);
    expect(BOSS_DEATH_SHAKE_BASE_AMP).toBeGreaterThan(0);
    expect(BOSS_DEATH_SHAKE_DURATION_MS).toBeGreaterThan(0);
  });
});
