import { describe, it, expect } from 'vitest';
import { TWEEN_INFINITE_BREATHE } from './tweenPresets';

describe('TWEEN_INFINITE_BREATHE — shared ambient loop fragment', () => {
  it('loops forever (repeat: -1)', () => {
    expect(TWEEN_INFINITE_BREATHE.repeat).toBe(-1);
  });

  it('yoyos between the two ends of each driven property', () => {
    expect(TWEEN_INFINITE_BREATHE.yoyo).toBe(true);
  });

  it('uses the Sine.easeInOut curve for smooth breathing', () => {
    expect(TWEEN_INFINITE_BREATHE.ease).toBe('Sine.easeInOut');
  });

  it('exposes exactly the three loop-configuration keys — callers supply targets + duration', () => {
    expect(Object.keys(TWEEN_INFINITE_BREATHE).sort()).toEqual([
      'ease', 'repeat', 'yoyo',
    ]);
  });
});
