import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { redcapDrawer } from './redcapFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('redcapFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(redcapDrawer.enemyKey).toBe('redcap');
    expect(redcapDrawer.canvasSize).toBe(32);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(redcapDrawer.authoredStates.has('idle')).toBe(true);
    expect(redcapDrawer.authoredStates.has('walking')).toBe(true);
    expect(redcapDrawer.authoredStates.has('hurt')).toBe(true);
    expect(redcapDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of redcapDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = redcapDrawer.getFrame(state, f);
        expectValidEnemyBodyFrame(frame, state + ':' + f);
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = redcapDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(redcapDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = redcapDrawer.getFrame('idle', 0);
    expect(redcapDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
