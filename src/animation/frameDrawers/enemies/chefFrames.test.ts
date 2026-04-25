import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { chefDrawer } from './chefFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('chefFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(chefDrawer.enemyKey).toBe('chef');
    expect(chefDrawer.canvasSize).toBe(48);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(chefDrawer.authoredStates.has('idle')).toBe(true);
    expect(chefDrawer.authoredStates.has('walking')).toBe(true);
    expect(chefDrawer.authoredStates.has('hurt')).toBe(true);
    expect(chefDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of chefDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = chefDrawer.getFrame(state, f);
        expectValidEnemyBodyFrame(frame, state + ':' + f);
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = chefDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(chefDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = chefDrawer.getFrame('idle', 0);
    expect(chefDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
