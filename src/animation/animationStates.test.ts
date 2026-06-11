import { describe, expect, it } from 'vitest';
import {
  evaluateAnimationState,
  type AnimationState,
  type AnimationSignals,
} from './animationStates';

const NEUTRAL_SIGNALS: AnimationSignals = {
  velocityMag: 0,
  hurtEdge: false,
  attackEdge: false,
  celebrateEdge: false,
  hp: 100,
};

describe('evaluateAnimationState', () => {
  it('stays idle when velocity is below threshold and no edges fire', () => {
    const next = evaluateAnimationState('idle', NEUTRAL_SIGNALS);
    expect(next).toBe('idle');
  });

  it('transitions idle → walking when velocity crosses threshold', () => {
    const next = evaluateAnimationState('idle', { ...NEUTRAL_SIGNALS, velocityMag: 50 });
    expect(next).toBe('walking');
  });

  it('transitions walking → idle when velocity drops below threshold', () => {
    const next = evaluateAnimationState('walking', NEUTRAL_SIGNALS);
    expect(next).toBe('idle');
  });

  it('hurtEdge interrupts any state to hurt', () => {
    const states: AnimationState[] = ['idle', 'walking', 'attacking', 'celebrating'];
    for (const s of states) {
      const next = evaluateAnimationState(s, { ...NEUTRAL_SIGNALS, hurtEdge: true });
      expect(next).toBe('hurt');
    }
  });

  it('dying is terminal — no signal escapes it', () => {
    const next = evaluateAnimationState('dying', {
      velocityMag: 100,
      hurtEdge: true,
      attackEdge: true,
      celebrateEdge: true,
      hp: 50,
    });
    expect(next).toBe('dying');
  });

  it('hp <= 0 transitions any non-dying state to dying', () => {
    const states: AnimationState[] = ['idle', 'walking', 'attacking', 'hurt', 'celebrating'];
    for (const s of states) {
      const next = evaluateAnimationState(s, { ...NEUTRAL_SIGNALS, hp: 0 });
      expect(next).toBe('dying');
    }
  });

  it('attackEdge transitions non-hurt/dying to attacking', () => {
    const next = evaluateAnimationState('walking', { ...NEUTRAL_SIGNALS, attackEdge: true });
    expect(next).toBe('attacking');
  });

  it('hurt takes priority over attack edge when both fire', () => {
    const next = evaluateAnimationState('idle', {
      ...NEUTRAL_SIGNALS,
      hurtEdge: true,
      attackEdge: true,
    });
    expect(next).toBe('hurt');
  });

  it('celebrateEdge transitions idle/walking to celebrating', () => {
    expect(evaluateAnimationState('idle', { ...NEUTRAL_SIGNALS, celebrateEdge: true })).toBe('celebrating');
    expect(evaluateAnimationState('walking', { ...NEUTRAL_SIGNALS, celebrateEdge: true })).toBe('celebrating');
  });
});
