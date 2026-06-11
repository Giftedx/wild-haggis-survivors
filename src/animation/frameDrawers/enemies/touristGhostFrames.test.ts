import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { touristGhostDrawer } from './touristGhostFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('touristGhostFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(touristGhostDrawer.enemyKey).toBe('tourist_ghost');
    expect(touristGhostDrawer.canvasSize).toBe(28);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(touristGhostDrawer.authoredStates.has('idle')).toBe(true);
    expect(touristGhostDrawer.authoredStates.has('walking')).toBe(true);
    expect(touristGhostDrawer.authoredStates.has('hurt')).toBe(true);
    expect(touristGhostDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of touristGhostDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = touristGhostDrawer.getFrame(state, f);
        expectValidEnemyBodyFrame(frame, state + ':' + f);
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = touristGhostDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(touristGhostDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = touristGhostDrawer.getFrame('idle', 0);
    expect(touristGhostDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
