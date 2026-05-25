import { describe, expect, it } from 'vitest';
import type { KeyBinding } from '../core/actions';
import { keyBindingsOverlap, stanceBindingOverlapsPause } from './skillKeyBindings';

describe('skillKeyBindings overlap helpers', () => {
  it('detects shared primary codes', () => {
    const a: KeyBinding = { primary: 'KeyQ' };
    const b: KeyBinding = { primary: 'KeyQ', secondary: 'KeyP' };
    expect(keyBindingsOverlap(a, b)).toBe(true);
  });

  it('returns false for disjoint bindings', () => {
    expect(
      keyBindingsOverlap({ primary: 'KeyQ' }, { primary: 'Escape', secondary: 'KeyP' }),
    ).toBe(false);
  });

  it('stanceBindingOverlapsPause mirrors pause-on-Q conflict', () => {
    expect(
      stanceBindingOverlapsPause(
        { primary: 'KeyQ' },
        { primary: 'Escape', secondary: 'KeyQ' },
      ),
    ).toBe(true);
  });
});
