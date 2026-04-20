import { describe, it, expect } from 'vitest';
import { deanApparitionDrawer } from './deanApparitionFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('deanApparitionFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(deanApparitionDrawer.enemyKey).toBe('dean_apparition');
    expect(deanApparitionDrawer.canvasSize).toBe(44);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(deanApparitionDrawer.authoredStates.has('idle')).toBe(true);
    expect(deanApparitionDrawer.authoredStates.has('walking')).toBe(true);
    expect(deanApparitionDrawer.authoredStates.has('hurt')).toBe(true);
    expect(deanApparitionDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of deanApparitionDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = deanApparitionDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
        expect(typeof frame).toBe('object');
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = deanApparitionDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(deanApparitionDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = deanApparitionDrawer.getFrame('idle', 0);
    expect(deanApparitionDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
