import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { taxmanDrawer } from './taxmanFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('taxmanFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(taxmanDrawer.enemyKey).toBe('taxman');
    expect(taxmanDrawer.canvasSize).toBe(80);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(taxmanDrawer.authoredStates.has('idle')).toBe(true);
    expect(taxmanDrawer.authoredStates.has('walking')).toBe(true);
    expect(taxmanDrawer.authoredStates.has('hurt')).toBe(true);
    expect(taxmanDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of taxmanDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = taxmanDrawer.getFrame(state, f);
        expectValidEnemyBodyFrame(frame, state + ':' + f);
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = taxmanDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(taxmanDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = taxmanDrawer.getFrame('idle', 0);
    expect(taxmanDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
