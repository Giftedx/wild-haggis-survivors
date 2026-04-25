import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { lairdDrawer } from './lairdFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('lairdFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(lairdDrawer.enemyKey).toBe('the_laird');
    expect(lairdDrawer.canvasSize).toBe(80);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(lairdDrawer.authoredStates.has('idle')).toBe(true);
    expect(lairdDrawer.authoredStates.has('walking')).toBe(true);
    expect(lairdDrawer.authoredStates.has('hurt')).toBe(true);
    expect(lairdDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of lairdDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = lairdDrawer.getFrame(state, f);
        expectValidEnemyBodyFrame(frame, state + ':' + f);
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = lairdDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(lairdDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = lairdDrawer.getFrame('idle', 0);
    expect(lairdDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
