import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { hunterGeneralDrawer } from './hunterGeneralFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('hunterGeneralFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(hunterGeneralDrawer.enemyKey).toBe('hunter_general');
    expect(hunterGeneralDrawer.canvasSize).toBe(80);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(hunterGeneralDrawer.authoredStates.has('idle')).toBe(true);
    expect(hunterGeneralDrawer.authoredStates.has('walking')).toBe(true);
    expect(hunterGeneralDrawer.authoredStates.has('hurt')).toBe(true);
    expect(hunterGeneralDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of hunterGeneralDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = hunterGeneralDrawer.getFrame(state, f);
        expectValidEnemyBodyFrame(frame, state + ':' + f);
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = hunterGeneralDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(hunterGeneralDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = hunterGeneralDrawer.getFrame('idle', 0);
    expect(hunterGeneralDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
