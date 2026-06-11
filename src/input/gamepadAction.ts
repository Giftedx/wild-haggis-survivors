import type { GamepadBinding } from '../core/actions';

export interface GamepadButtonLike {
  readonly pressed?: boolean;
  readonly value?: number;
}

export const GAMEPAD_ANALOG_PRESS_THRESHOLD = 0.35;

export function isGamepadButtonPressed(
  buttons: readonly GamepadButtonLike[],
  index: number | undefined,
): boolean {
  if (index == null || !Number.isInteger(index) || index < 0) return false;
  const button = buttons[index];
  if (!button) return false;
  return button.pressed === true || (button.value ?? 0) > GAMEPAD_ANALOG_PRESS_THRESHOLD;
}

export function isGamepadActionPressed(
  buttons: readonly GamepadButtonLike[],
  binding: GamepadBinding | undefined,
): boolean {
  if (!binding) return false;
  return isGamepadButtonPressed(buttons, binding.primary)
    || isGamepadButtonPressed(buttons, binding.secondary);
}
