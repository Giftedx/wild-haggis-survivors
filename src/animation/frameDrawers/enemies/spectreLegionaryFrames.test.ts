import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { spectreLegionaryDrawer } from './spectreLegionaryFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('spectreLegionaryFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(spectreLegionaryDrawer.enemyKey).toBe('spectre_legionary');
    expect(spectreLegionaryDrawer.canvasSize).toBe(32);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(spectreLegionaryDrawer.authoredStates.has('idle')).toBe(true);
    expect(spectreLegionaryDrawer.authoredStates.has('walking')).toBe(true);
    expect(spectreLegionaryDrawer.authoredStates.has('hurt')).toBe(true);
    expect(spectreLegionaryDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of spectreLegionaryDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = spectreLegionaryDrawer.getFrame(state, f);
        expectValidEnemyBodyFrame(frame, state + ':' + f);
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = spectreLegionaryDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(spectreLegionaryDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = spectreLegionaryDrawer.getFrame('idle', 0);
    expect(spectreLegionaryDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
