import { describe, it, expect } from 'vitest';
import { piperDrawer } from './piperFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('piperFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(piperDrawer.enemyKey).toBe('piper');
    expect(piperDrawer.canvasSize).toBe(48);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(piperDrawer.authoredStates.has('idle')).toBe(true);
    expect(piperDrawer.authoredStates.has('walking')).toBe(true);
    expect(piperDrawer.authoredStates.has('hurt')).toBe(true);
    expect(piperDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of piperDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = piperDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
        expect(typeof frame).toBe('object');
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = piperDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(piperDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = piperDrawer.getFrame('idle', 0);
    expect(piperDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
