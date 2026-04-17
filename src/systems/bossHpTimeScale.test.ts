import { describe, it, expect } from 'vitest';
import {
  bossHpTimeScale,
  BOSS_HP_SCALE_GRACE_SEC,
  BOSS_HP_SCALE_PER_SEC,
} from './bossHpTimeScale';

describe('bossHpTimeScale — grace then linear ramp', () => {
  it('returns 1.0 at game start (no scaling during early game)', () => {
    expect(bossHpTimeScale(0)).toBe(1);
  });

  it('returns 1.0 throughout the grace period', () => {
    expect(bossHpTimeScale(60)).toBe(1);
    expect(bossHpTimeScale(BOSS_HP_SCALE_GRACE_SEC - 1)).toBe(1);
  });

  it('returns exactly 1.0 at the grace threshold (not scaling yet)', () => {
    expect(bossHpTimeScale(BOSS_HP_SCALE_GRACE_SEC)).toBe(1);
  });

  it('grows linearly past the grace period', () => {
    // One extra minute past grace: 60 * 0.002 = 0.12 → 1.12×
    expect(bossHpTimeScale(BOSS_HP_SCALE_GRACE_SEC + 60))
      .toBeCloseTo(1 + 60 * BOSS_HP_SCALE_PER_SEC, 10);
  });

  it('matches the documented headline numbers (1.0× / 1.6× / 2.2×)', () => {
    expect(bossHpTimeScale(5 * 60)).toBe(1);
    expect(bossHpTimeScale(10 * 60)).toBeCloseTo(1.6, 10);
    expect(bossHpTimeScale(15 * 60)).toBeCloseTo(2.2, 10);
  });

  it('never drops below 1 regardless of input (negative time passed in error)', () => {
    expect(bossHpTimeScale(-100)).toBe(1);
  });
});
