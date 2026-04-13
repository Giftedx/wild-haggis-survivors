import { describe, it, expect } from 'vitest';
import { formatClockTime, computeGoldBreakdown } from './gameOverFormatting';

describe('formatClockTime', () => {
  it('formats 0 seconds', () => {
    expect(formatClockTime(0)).toBe('0:00');
  });

  it('formats sub-minute values with zero-padded seconds', () => {
    expect(formatClockTime(5)).toBe('0:05');
    expect(formatClockTime(59)).toBe('0:59');
  });

  it('formats exact minutes', () => {
    expect(formatClockTime(60)).toBe('1:00');
    expect(formatClockTime(120)).toBe('2:00');
  });

  it('formats mixed minutes and seconds', () => {
    expect(formatClockTime(90)).toBe('1:30');
    expect(formatClockTime(3661)).toBe('61:01');
  });

  it('floors fractional seconds', () => {
    expect(formatClockTime(59.9)).toBe('0:59');
    expect(formatClockTime(0.1)).toBe('0:00');
  });

  it('clamps negative values to 0:00', () => {
    expect(formatClockTime(-10)).toBe('0:00');
    expect(formatClockTime(-0.5)).toBe('0:00');
  });
});

describe('computeGoldBreakdown', () => {
  it('computes gold from time survived', () => {
    const result = computeGoldBreakdown({
      timeSurvivedSec: 100,
      enemiesKilled: 0,
      bossGold: 0,
      coinGold: 0,
    });
    expect(result.timeGold).toBe(40);
    expect(result.total).toBe(40);
  });

  it('computes gold from enemy kills', () => {
    const result = computeGoldBreakdown({
      timeSurvivedSec: 0,
      enemiesKilled: 50,
      bossGold: 0,
      coinGold: 0,
    });
    expect(result.killGold).toBe(20);
    expect(result.total).toBe(20);
  });

  it('passes through boss and coin gold', () => {
    const result = computeGoldBreakdown({
      timeSurvivedSec: 0,
      enemiesKilled: 0,
      bossGold: 15,
      coinGold: 7,
    });
    expect(result.bossGold).toBe(15);
    expect(result.coinGold).toBe(7);
    expect(result.total).toBe(22);
  });

  it('floors fractional time/kill gold', () => {
    const result = computeGoldBreakdown({
      timeSurvivedSec: 1,
      enemiesKilled: 1,
      bossGold: 0,
      coinGold: 0,
    });
    expect(result.timeGold).toBe(0);
    expect(result.killGold).toBe(0);
    expect(result.total).toBe(0);
  });

  it('sums all sources correctly', () => {
    const result = computeGoldBreakdown({
      timeSurvivedSec: 300,
      enemiesKilled: 200,
      bossGold: 50,
      coinGold: 30,
    });
    expect(result.timeGold).toBe(120);
    expect(result.killGold).toBe(80);
    expect(result.total).toBe(120 + 80 + 50 + 30);
  });
});
