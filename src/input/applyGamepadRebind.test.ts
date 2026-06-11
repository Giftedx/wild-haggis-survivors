import { describe, it, expect } from 'vitest';
import { applyGamepadRebind } from './applyGamepadRebind';
import { DEFAULT_GAMEPAD_BINDINGS } from '../core/actions';

describe('applyGamepadRebind', () => {
  it('rebinds dash primary to a fresh button', () => {
    const result = applyGamepadRebind(DEFAULT_GAMEPAD_BINDINGS, 'dash', 'primary', 2);
    expect(result.conflict).toBeUndefined();
    expect(result.bindings.dash).toEqual({ primary: 2, secondary: 7 });
  });

  it('is a no-op when rebinding to the existing slot', () => {
    const result = applyGamepadRebind(DEFAULT_GAMEPAD_BINDINGS, 'dash', 'primary', 0);
    expect(result.bindings).toBe(DEFAULT_GAMEPAD_BINDINGS);
  });

  it('flags a conflict when the captured button belongs to another action', () => {
    // pause.primary = 9 → rebinding dash.primary = 9 conflicts.
    const result = applyGamepadRebind(DEFAULT_GAMEPAD_BINDINGS, 'dash', 'primary', 9);
    expect(result.conflict).toBe('pause');
    expect(result.bindings).toBe(DEFAULT_GAMEPAD_BINDINGS);
  });

  it('swaps primary and secondary within the same action', () => {
    // dash primary=0 secondary=7. Rebind primary → 7.
    const result = applyGamepadRebind(DEFAULT_GAMEPAD_BINDINGS, 'dash', 'primary', 7);
    expect(result.bindings.dash).toEqual({ primary: 7, secondary: 0 });
  });

  it('rejects rebinding secondary to own primary', () => {
    const result = applyGamepadRebind(DEFAULT_GAMEPAD_BINDINGS, 'dash', 'secondary', 0);
    expect(result.conflict).toBe('dash');
    expect(result.bindings).toBe(DEFAULT_GAMEPAD_BINDINGS);
  });

  it('ignores actions that do not have a gamepad binding (movement)', () => {
    const result = applyGamepadRebind(DEFAULT_GAMEPAD_BINDINGS, 'moveUp', 'primary', 3);
    expect(result.bindings).toBe(DEFAULT_GAMEPAD_BINDINGS);
  });

  it('rejects out-of-range button indices', () => {
    expect(applyGamepadRebind(DEFAULT_GAMEPAD_BINDINGS, 'dash', 'primary', -1).bindings)
      .toBe(DEFAULT_GAMEPAD_BINDINGS);
    expect(applyGamepadRebind(DEFAULT_GAMEPAD_BINDINGS, 'dash', 'primary', 99).bindings)
      .toBe(DEFAULT_GAMEPAD_BINDINGS);
  });

  it('writes a secondary slot when previously unset', () => {
    // pause ships with primary=9 only (no secondary).
    const result = applyGamepadRebind(DEFAULT_GAMEPAD_BINDINGS, 'pause', 'secondary', 8);
    expect(result.bindings.pause).toEqual({ primary: 9, secondary: 8 });
  });
});
