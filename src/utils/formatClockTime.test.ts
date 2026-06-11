import { describe, it, expect } from 'vitest';
import { formatClockTime } from './formatClockTime';

describe('formatClockTime', () => {
  it('zero is 0:00', () => {
    expect(formatClockTime(0)).toBe('0:00');
  });

  it('under a minute pads seconds', () => {
    expect(formatClockTime(5)).toBe('0:05');
    expect(formatClockTime(59)).toBe('0:59');
  });

  it('exact minute boundary', () => {
    expect(formatClockTime(60)).toBe('1:00');
    expect(formatClockTime(120)).toBe('2:00');
  });

  it('mid-minute formats both fields', () => {
    expect(formatClockTime(90)).toBe('1:30');
    expect(formatClockTime(185)).toBe('3:05');
  });

  it('past an hour: minutes exceed 60 without padding', () => {
    expect(formatClockTime(3661)).toBe('61:01');
  });

  it('fractional seconds floor (never rounds up)', () => {
    expect(formatClockTime(59.9)).toBe('0:59');
    expect(formatClockTime(0.1)).toBe('0:00');
  });

  it('negative input clamps at 0:00', () => {
    expect(formatClockTime(-10)).toBe('0:00');
    expect(formatClockTime(-0.5)).toBe('0:00');
  });
});
