import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { deepFryerDrawer } from './deepFryerFrames';
import { getFrameCountForState } from '../../frameClock';

describe('deepFryerFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(deepFryerDrawer.enemyKey).toBe('deep_fryer');
    expect(deepFryerDrawer.canvasSize).toBe(48);
  });

  it('authors only idle (static hazard — no walk, hurt, or dying states)', () => {
    expect(deepFryerDrawer.authoredStates.has('idle')).toBe(true);
    expect(deepFryerDrawer.authoredStates.has('walking')).toBe(false);
    expect(deepFryerDrawer.authoredStates.has('hurt')).toBe(false);
    expect(deepFryerDrawer.authoredStates.has('dying')).toBe(false);
  });

  it('returns valid frames for idle state', () => {
    const count = getFrameCountForState('idle');
    for (let f = 0; f < count; f++) {
      const frame = deepFryerDrawer.getFrame('idle', f);
      expectValidEnemyBodyFrame(frame, 'idle:' + f);
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const idle0 = deepFryerDrawer.getFrame('idle', 0);
    const nonAuthored = ['walking', 'hurt', 'dying', 'attacking'] as const;
    for (const state of nonAuthored) {
      expect(deepFryerDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = deepFryerDrawer.getFrame('idle', 0);
    expect(deepFryerDrawer.getFrame('idle', 99)).toEqual(idle0);
  });

  it('frame 1 has negative breathY — oil-pressure lift', () => {
    const frame1 = deepFryerDrawer.getFrame('idle', 1);
    expect(frame1.breathY).toBeLessThan(0);
  });
});
