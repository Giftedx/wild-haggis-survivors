import { describe, it, expect } from 'vitest';
import { formatSpeedrunTime } from './formatSpeedrunTime';

describe('formatSpeedrunTime', () => {
  it('zero seconds is 0:00.00', () => {
    expect(formatSpeedrunTime(0)).toBe('0:00.00');
  });

  it('1.23 seconds is 0:01.23', () => {
    expect(formatSpeedrunTime(1.23)).toBe('0:01.23');
  });

  it('65.5 seconds is 1:05.50', () => {
    expect(formatSpeedrunTime(65.5)).toBe('1:05.50');
  });

  it('centiseconds floor — 1.999 is 0:01.99, not 0:02.00', () => {
    expect(formatSpeedrunTime(1.999)).toBe('0:01.99');
  });

  it('minutes are not zero-padded', () => {
    expect(formatSpeedrunTime(61)).toBe('1:01.00');
    expect(formatSpeedrunTime(601)).toBe('10:01.00');
  });

  it('seconds and centiseconds are padded to 2 digits', () => {
    expect(formatSpeedrunTime(65.05)).toBe('1:05.05');
    expect(formatSpeedrunTime(5.07)).toBe('0:05.07');
  });

  it('negative input clamps to zero', () => {
    expect(formatSpeedrunTime(-3)).toBe('0:00.00');
  });

  it('stays monotonic as seconds increase', () => {
    const samples = [0, 0.01, 0.99, 1.0, 59.99, 60.0, 125.5];
    const results = samples.map(formatSpeedrunTime);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].localeCompare(results[i - 1]), `${samples[i]} vs ${samples[i - 1]}`).toBeGreaterThan(0);
    }
  });
});
