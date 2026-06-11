import { describe, it, expect } from 'vitest';
import { RING_TIMING, FLASH_TIMING, PARTICLE_DURATION } from './effectTimingPresets';

describe('effectTimingPresets', () => {
  it('RING_TIMING has tight < medium < grand', () => {
    expect(RING_TIMING.tight).toBeLessThan(RING_TIMING.medium);
    expect(RING_TIMING.medium).toBeLessThan(RING_TIMING.grand);
  });

  it('FLASH_TIMING has short < medium < long < epic', () => {
    expect(FLASH_TIMING.short).toBeLessThan(FLASH_TIMING.medium);
    expect(FLASH_TIMING.medium).toBeLessThan(FLASH_TIMING.long);
    expect(FLASH_TIMING.long).toBeLessThan(FLASH_TIMING.epic);
  });

  it('PARTICLE_DURATION ranges are valid', () => {
    for (const range of Object.values(PARTICLE_DURATION)) {
      expect(range.min).toBeLessThan(range.max);
    }
  });
});
