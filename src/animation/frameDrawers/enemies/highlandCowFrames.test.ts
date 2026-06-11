import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { highlandCowDrawer } from './highlandCowFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('highlandCowFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(highlandCowDrawer.enemyKey).toBe('highland_cow');
    expect(highlandCowDrawer.canvasSize).toBe(64);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(highlandCowDrawer.authoredStates.has('idle')).toBe(true);
    expect(highlandCowDrawer.authoredStates.has('walking')).toBe(true);
    expect(highlandCowDrawer.authoredStates.has('hurt')).toBe(true);
    expect(highlandCowDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of highlandCowDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = highlandCowDrawer.getFrame(state, f);
        expectValidEnemyBodyFrame(frame, state + ':' + f);
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = highlandCowDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(highlandCowDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = highlandCowDrawer.getFrame('idle', 0);
    expect(highlandCowDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
