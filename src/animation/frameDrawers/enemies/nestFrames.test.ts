import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { nestDrawer } from './nestFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('nestFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(nestDrawer.enemyKey).toBe('nest');
    expect(nestDrawer.canvasSize).toBe(40);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(nestDrawer.authoredStates.has('idle')).toBe(true);
    expect(nestDrawer.authoredStates.has('walking')).toBe(true);
    expect(nestDrawer.authoredStates.has('hurt')).toBe(true);
    expect(nestDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of nestDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = nestDrawer.getFrame(state, f);
        expectValidEnemyBodyFrame(frame, state + ':' + f);
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = nestDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(nestDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = nestDrawer.getFrame('idle', 0);
    expect(nestDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
