import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { berserkerDrawer } from './berserkerFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('berserkerFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(berserkerDrawer.enemyKey).toBe('berserker');
    expect(berserkerDrawer.canvasSize).toBe(52);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(berserkerDrawer.authoredStates.has('idle')).toBe(true);
    expect(berserkerDrawer.authoredStates.has('walking')).toBe(true);
    expect(berserkerDrawer.authoredStates.has('hurt')).toBe(true);
    expect(berserkerDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of berserkerDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = berserkerDrawer.getFrame(state, f);
        expectValidEnemyBodyFrame(frame, state + ':' + f);
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = berserkerDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(berserkerDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = berserkerDrawer.getFrame('idle', 0);
    expect(berserkerDrawer.getFrame('idle', 99)).toEqual(idle0);
  });

  it('has heavier offsets than the base angry scotsman (bulk + rage)', () => {
    const walkFrame0 = berserkerDrawer.getFrame('walking', 0);
    expect(walkFrame0.leftLegY).toBeLessThan(-2);  // wider stride than scotsman's -2
    const hurtFrame0 = berserkerDrawer.getFrame('hurt', 0);
    expect(Math.abs(hurtFrame0.bodyX ?? 0)).toBeGreaterThan(2);  // bigger flinch
  });
});
