import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { ceilidhCallerDrawer } from './ceilidhCallerFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('ceilidhCallerFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(ceilidhCallerDrawer.enemyKey).toBe('ceilidh_caller');
    expect(ceilidhCallerDrawer.canvasSize).toBe(42);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(ceilidhCallerDrawer.authoredStates.has('idle')).toBe(true);
    expect(ceilidhCallerDrawer.authoredStates.has('walking')).toBe(true);
    expect(ceilidhCallerDrawer.authoredStates.has('hurt')).toBe(true);
    expect(ceilidhCallerDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of ceilidhCallerDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = ceilidhCallerDrawer.getFrame(state, f);
        expectValidEnemyBodyFrame(frame, state + ':' + f);
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = ceilidhCallerDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(ceilidhCallerDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = ceilidhCallerDrawer.getFrame('idle', 0);
    expect(ceilidhCallerDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
