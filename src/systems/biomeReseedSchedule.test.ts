import { describe, it, expect } from 'vitest';
import { shouldReseedAtSec, POST_BELL_RESEED_INTERVAL_SEC } from './biomeReseedSchedule';

describe('shouldReseedAtSec', () => {
  it('never reseeds when secondsPastBell is non-positive', () => {
    expect(shouldReseedAtSec(0, 0)).toBe(false);
    expect(shouldReseedAtSec(-30, 0)).toBe(false);
  });

  it('does not reseed before the first interval elapses', () => {
    expect(shouldReseedAtSec(60, 0)).toBe(false);
    expect(shouldReseedAtSec(POST_BELL_RESEED_INTERVAL_SEC - 1, 0)).toBe(false);
  });

  it('reseeds at the first interval boundary', () => {
    expect(shouldReseedAtSec(POST_BELL_RESEED_INTERVAL_SEC, 0)).toBe(true);
    expect(shouldReseedAtSec(POST_BELL_RESEED_INTERVAL_SEC + 5, 0)).toBe(true);
  });

  it('does not reseed inside the same window', () => {
    expect(shouldReseedAtSec(360, 180)).toBe(true);
    expect(shouldReseedAtSec(300, 180)).toBe(false);
  });

  it('respects custom interval (testability)', () => {
    expect(shouldReseedAtSec(60, 0, 60)).toBe(true);
    expect(shouldReseedAtSec(59, 0, 60)).toBe(false);
  });
});
