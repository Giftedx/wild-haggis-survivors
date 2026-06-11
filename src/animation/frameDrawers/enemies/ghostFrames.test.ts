import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { ghostDrawer } from './ghostFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('ghostFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(ghostDrawer.enemyKey).toBe('ghost');
    expect(ghostDrawer.canvasSize).toBe(40);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(ghostDrawer.authoredStates.has('idle')).toBe(true);
    expect(ghostDrawer.authoredStates.has('walking')).toBe(true);
    expect(ghostDrawer.authoredStates.has('hurt')).toBe(true);
    expect(ghostDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of ghostDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = ghostDrawer.getFrame(state, f);
        expectValidEnemyBodyFrame(frame, state + ':' + f);
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = ghostDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(ghostDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = ghostDrawer.getFrame('idle', 0);
    expect(ghostDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
