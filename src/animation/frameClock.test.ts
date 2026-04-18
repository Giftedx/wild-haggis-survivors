import { describe, expect, it } from 'vitest';
import {
  advanceFrameClock,
  getFrameCountForState,
  getTempoForState,
  type AnimationState,
} from './frameClock';

describe('advanceFrameClock', () => {
  it('advances frame when accumulator exceeds 1000/fps ms', () => {
    // idle runs at 2 fps → 500 ms per frame
    const r = advanceFrameClock({
      accMs: 0,
      frameIndex: 0,
      state: 'idle',
      scaledDelta: 500,
    });
    expect(r.frameIndex).toBe(1);
    expect(r.accMs).toBe(0);
  });

  it('preserves sub-frame accumulation', () => {
    const r = advanceFrameClock({
      accMs: 300,
      frameIndex: 1,
      state: 'idle',
      scaledDelta: 150,
    });
    expect(r.frameIndex).toBe(1);
    expect(r.accMs).toBe(450);
  });

  it('looping states wrap frame index at state frame count', () => {
    // idle has 2 frames; after 2 advances it wraps to 0
    let r = advanceFrameClock({ accMs: 0, frameIndex: 1, state: 'idle', scaledDelta: 500 });
    expect(r.frameIndex).toBe(0); // wrapped from 2 back to 0
  });

  it('one-shot states clamp at final frame (no wrap)', () => {
    // dying has 3 frames; advancing at frame 2 keeps frame 2
    const r = advanceFrameClock({
      accMs: 500,
      frameIndex: 2,
      state: 'dying',
      scaledDelta: 500,
    });
    expect(r.frameIndex).toBe(2);
  });

  it('handles multiple frame advances in one tick (catch-up)', () => {
    // walking at 24 fps → ~41.67 ms per frame; a 200 ms spike advances ~4 frames
    const r = advanceFrameClock({
      accMs: 0,
      frameIndex: 0,
      state: 'walking',
      scaledDelta: 200,
    });
    expect(r.frameIndex).toBe(0); // wrapped: 4 mod 4 = 0
  });

  it('zero or negative scaledDelta does not advance frames', () => {
    const r1 = advanceFrameClock({ accMs: 100, frameIndex: 1, state: 'walking', scaledDelta: 0 });
    expect(r1).toEqual({ accMs: 100, frameIndex: 1 });
    const r2 = advanceFrameClock({ accMs: 100, frameIndex: 1, state: 'walking', scaledDelta: -50 });
    expect(r2).toEqual({ accMs: 100, frameIndex: 1 });
  });
});

describe('getFrameCountForState / getTempoForState', () => {
  const states: AnimationState[] = ['idle', 'walking', 'attacking', 'hurt', 'celebrating', 'dying'];

  it('returns a positive integer frame count per state', () => {
    for (const s of states) {
      const n = getFrameCountForState(s);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(n)).toBe(true);
    }
  });

  it('walking is the highest-tempo looping state at 24 fps', () => {
    expect(getTempoForState('walking')).toBe(24);
  });

  it('idle is the lowest-tempo looping state at 2 fps', () => {
    expect(getTempoForState('idle')).toBe(2);
  });
});
