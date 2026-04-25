import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { blueManOfMinchDrawer } from './blueManOfMinchFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('blueManOfMinchFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(blueManOfMinchDrawer.enemyKey).toBe('blue_man_of_minch');
    expect(blueManOfMinchDrawer.canvasSize).toBe(48);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(blueManOfMinchDrawer.authoredStates.has('idle')).toBe(true);
    expect(blueManOfMinchDrawer.authoredStates.has('walking')).toBe(true);
    expect(blueManOfMinchDrawer.authoredStates.has('hurt')).toBe(true);
    expect(blueManOfMinchDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of blueManOfMinchDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = blueManOfMinchDrawer.getFrame(state, f);
        expectValidEnemyBodyFrame(frame, state + ':' + f);
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = blueManOfMinchDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(blueManOfMinchDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = blueManOfMinchDrawer.getFrame('idle', 0);
    expect(blueManOfMinchDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
