import { describe, it, expect } from 'vitest';
import {
  playerLevelSpeedMul,
  playerLevelDriftMul,
  SPEED_FLOOR_MUL,
  DRIFT_FLOOR_MUL,
} from './playerLevelScaling';
import { PLAYER } from '../config';

describe('playerLevelSpeedMul — level 1 is unit, decays to 0.7 floor', () => {
  it('level 1 returns exactly 1.0', () => {
    expect(playerLevelSpeedMul(1)).toBe(1);
  });

  it('level 2 subtracts one tick of SPEED_REDUCTION_PER_LEVEL', () => {
    expect(playerLevelSpeedMul(2)).toBeCloseTo(1 - PLAYER.SPEED_REDUCTION_PER_LEVEL, 10);
  });

  it('clamps at SPEED_FLOOR_MUL for high levels', () => {
    expect(playerLevelSpeedMul(999)).toBe(SPEED_FLOOR_MUL);
  });

  it('never dips below SPEED_FLOOR_MUL across sampled levels', () => {
    for (let level = 1; level < 500; level++) {
      expect(playerLevelSpeedMul(level)).toBeGreaterThanOrEqual(SPEED_FLOOR_MUL);
    }
  });

  it('is monotonically non-increasing', () => {
    let prev = Infinity;
    for (let level = 1; level < 100; level++) {
      const mul = playerLevelSpeedMul(level);
      expect(mul).toBeLessThanOrEqual(prev);
      prev = mul;
    }
  });
});

describe('playerLevelDriftMul — level 1 is unit, decays to 0.3 floor', () => {
  it('level 1 returns exactly 1.0', () => {
    expect(playerLevelDriftMul(1)).toBe(1);
  });

  it('level 2 subtracts one tick of DRIFT_REDUCTION_PER_LEVEL', () => {
    expect(playerLevelDriftMul(2)).toBeCloseTo(1 - PLAYER.DRIFT_REDUCTION_PER_LEVEL, 10);
  });

  it('clamps at DRIFT_FLOOR_MUL for high levels', () => {
    expect(playerLevelDriftMul(999)).toBe(DRIFT_FLOOR_MUL);
  });

  it('drift floor (0.3) is lower than speed floor (0.7) — drift shrinks more aggressively', () => {
    expect(DRIFT_FLOOR_MUL).toBeLessThan(SPEED_FLOOR_MUL);
  });
});
