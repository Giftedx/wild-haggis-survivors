import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { auditorPriestDrawer } from './auditorPriestFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('auditorPriestFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(auditorPriestDrawer.enemyKey).toBe('auditor_priest');
    expect(auditorPriestDrawer.canvasSize).toBe(42);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(auditorPriestDrawer.authoredStates.has('idle')).toBe(true);
    expect(auditorPriestDrawer.authoredStates.has('walking')).toBe(true);
    expect(auditorPriestDrawer.authoredStates.has('hurt')).toBe(true);
    expect(auditorPriestDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of auditorPriestDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = auditorPriestDrawer.getFrame(state, f);
        expectValidEnemyBodyFrame(frame, state + ':' + f);
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = auditorPriestDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(auditorPriestDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = auditorPriestDrawer.getFrame('idle', 0);
    expect(auditorPriestDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
