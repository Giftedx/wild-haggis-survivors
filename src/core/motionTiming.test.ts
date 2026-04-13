import { describe, it, expect } from 'vitest';
import { MOTION_TIMING } from './motionTiming';
import { MOTION_TIMING as fromMusicMath } from '../systems/music/musicMath';

describe('motionTiming', () => {
  it('re-exports the same MOTION_TIMING object as musicMath', () => {
    expect(MOTION_TIMING).toBe(fromMusicMath);
  });
});
