import { describe, expect, it } from 'vitest';
import {
  GAMEPAD_ANALOG_PRESS_THRESHOLD,
  isGamepadActionPressed,
  isGamepadButtonPressed,
  type GamepadButtonLike,
} from './gamepadAction';

function buttons(...states: GamepadButtonLike[]): readonly GamepadButtonLike[] {
  return states;
}

describe('gamepadAction polling', () => {
  it('reads digital button presses by bound index', () => {
    const pad = buttons({ pressed: false }, { pressed: true });

    expect(isGamepadButtonPressed(pad, 1)).toBe(true);
    expect(isGamepadButtonPressed(pad, 0)).toBe(false);
  });

  it('treats analog button values above the trigger threshold as pressed', () => {
    const pad = buttons(
      { value: GAMEPAD_ANALOG_PRESS_THRESHOLD },
      { value: GAMEPAD_ANALOG_PRESS_THRESHOLD + 0.01 },
    );

    expect(isGamepadButtonPressed(pad, 0)).toBe(false);
    expect(isGamepadButtonPressed(pad, 1)).toBe(true);
  });

  it('honours primary or secondary bindings for an action', () => {
    const pad = buttons(
      { pressed: false },
      { pressed: false },
      { pressed: true },
    );

    expect(isGamepadActionPressed(pad, { primary: 0, secondary: 2 })).toBe(true);
    expect(isGamepadActionPressed(pad, { primary: 0, secondary: 1 })).toBe(false);
  });

  it('returns false for unbound or invalid buttons', () => {
    const pad = buttons({ pressed: true });

    expect(isGamepadActionPressed(pad, undefined)).toBe(false);
    expect(isGamepadButtonPressed(pad, undefined)).toBe(false);
    expect(isGamepadButtonPressed(pad, -1)).toBe(false);
    expect(isGamepadButtonPressed(pad, 99)).toBe(false);
  });
});
