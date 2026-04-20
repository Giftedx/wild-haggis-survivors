import { describe, it, expect } from 'vitest';
import { gordonDrawer } from './gordonFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('gordonFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(gordonDrawer.enemyKey).toBe('gordon');
    expect(gordonDrawer.canvasSize).toBe(80);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(gordonDrawer.authoredStates.has('idle')).toBe(true);
    expect(gordonDrawer.authoredStates.has('walking')).toBe(true);
    expect(gordonDrawer.authoredStates.has('hurt')).toBe(true);
    expect(gordonDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of gordonDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = gordonDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
        expect(typeof frame).toBe('object');
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = gordonDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(gordonDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = gordonDrawer.getFrame('idle', 0);
    expect(gordonDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
