/**
 * A1 M3 — Semantic action catalog for key + gamepad remapping.
 *
 * Every gameplay-critical input route goes through an `ActionKey` rather
 * than a raw Phaser key code. `InputMapper` reads the current bindings
 * from `SettingsManager` and exposes semantic queries (`isActionDown`,
 * `isActionJustPressed`) — sites do not poke `KeyCodes` directly.
 *
 * Scope: movement (4 cardinals) + dash + pause + four active-skill keys.
 * Menu navigation
 * inside settings / almanac / chronicle stays on hard-coded cursor keys
 * for the M3 slice; a follow-up can widen the enum if needed.
 *
 * Gamepad bindings cover only dash + pause buttons. Movement on gamepad
 * stays on the left stick / D-pad (hardware-level axes, not buttons), so
 * there is no meaningful "rebind" for stick direction — InputManager
 * wires those through a dedicated gamepad-move path.
 */

export type ActionKey =
  | 'moveUp'
  | 'moveDown'
  | 'moveLeft'
  | 'moveRight'
  | 'dash'
  | 'pause'
  | 'stanceToggle'
  | 'shintyParry'
  | 'whiskyBreath'
  | 'driftMastery';

export const ACTION_KEYS: readonly ActionKey[] = [
  'moveUp',
  'moveDown',
  'moveLeft',
  'moveRight',
  'dash',
  'pause',
  'stanceToggle',
  'shintyParry',
  'whiskyBreath',
  'driftMastery',
];

/**
 * Keyboard binding per action. `primary` is `KeyboardEvent.code` (e.g.
 * `'ArrowUp'`, `'KeyW'`, `'Space'`). `secondary` is the optional second
 * key the original defaults carry (arrows + WASD era). Rebinding either
 * slot writes only that slot; the other stays untouched.
 */
export interface KeyBinding {
  primary: string;
  secondary?: string;
}

/**
 * Gamepad binding per action. Numbers match the HTML5 Standard Gamepad
 * button index (0 = South / A, 7 = RT, 9 = Start, etc). `secondary` is
 * optional for actions that traditionally accept two inputs (e.g. dash
 * = South *or* RT).
 */
export interface GamepadBinding {
  primary: number;
  secondary?: number;
}

export const DEFAULT_KEYBINDINGS: Record<ActionKey, KeyBinding> = {
  moveUp: { primary: 'ArrowUp', secondary: 'KeyW' },
  moveDown: { primary: 'ArrowDown', secondary: 'KeyS' },
  moveLeft: { primary: 'ArrowLeft', secondary: 'KeyA' },
  moveRight: { primary: 'ArrowRight', secondary: 'KeyD' },
  dash: { primary: 'Space' },
  pause: { primary: 'Escape', secondary: 'KeyP' },
  stanceToggle: { primary: 'KeyQ' },
  shintyParry: { primary: 'KeyE' },
  whiskyBreath: { primary: 'KeyF' },
  driftMastery: { primary: 'KeyG' },
};

export const DEFAULT_GAMEPAD_BINDINGS: Partial<Record<ActionKey, GamepadBinding>> = {
  dash: { primary: 0, secondary: 7 },
  pause: { primary: 9 },
};
