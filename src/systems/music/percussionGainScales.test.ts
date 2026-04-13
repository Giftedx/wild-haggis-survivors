import { describe, it, expect } from 'vitest';
import { percussionKickHatGainScales } from './PercussionLayer';

describe('percussionKickHatGainScales', () => {
  it('ducks stacked kicks at n=4 (four on downbeats)', () => {
    expect(percussionKickHatGainScales(4).kick).toBeLessThan(percussionKickHatGainScales(3).kick);
  });

  it('softens hats as phrase fills (4 → 7)', () => {
    expect(percussionKickHatGainScales(4).hat).toBeGreaterThan(percussionKickHatGainScales(7).hat);
  });

  it('boosts sparse phrase so single pulse / rare hat cut through', () => {
    expect(percussionKickHatGainScales(1).kick).toBeGreaterThan(percussionKickHatGainScales(5).kick);
    expect(percussionKickHatGainScales(1).hat).toBeGreaterThan(percussionKickHatGainScales(6).hat);
  });

  it('clamps to 1..8 pulse counts', () => {
    expect(percussionKickHatGainScales(0)).toEqual(percussionKickHatGainScales(1));
    expect(percussionKickHatGainScales(99)).toEqual(percussionKickHatGainScales(8));
  });
});
