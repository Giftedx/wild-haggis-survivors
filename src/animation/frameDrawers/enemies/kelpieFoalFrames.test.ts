import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { kelpieFoalDrawer } from './kelpieFoalFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('kelpieFoalFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(kelpieFoalDrawer.enemyKey).toBe('kelpie_foal');
    expect(kelpieFoalDrawer.canvasSize).toBe(36);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(kelpieFoalDrawer.authoredStates.has('idle')).toBe(true);
    expect(kelpieFoalDrawer.authoredStates.has('walking')).toBe(true);
    expect(kelpieFoalDrawer.authoredStates.has('hurt')).toBe(true);
    expect(kelpieFoalDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of kelpieFoalDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = kelpieFoalDrawer.getFrame(state, f);
        expectValidEnemyBodyFrame(frame, state + ':' + f);
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = kelpieFoalDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(kelpieFoalDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = kelpieFoalDrawer.getFrame('idle', 0);
    expect(kelpieFoalDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
