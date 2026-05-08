/**
 * Per-frame gamepad input handler for SettingsScene — extracted as part
 * of the Phase 5 settings drain. Reads navigation edges off the active
 * pad, advances / wraps the focused row index, fires slider min/plus on
 * left/right edges, and confirms via A or Start. Pure helper: the caller
 * owns the state struct and the row registry; the helper mutates state
 * in place.
 *
 * Edge-only — held-direction repeat is intentionally not implemented (the
 * keyboard path matches). The previous inline version accepted `delta` for
 * a future accumulator; the helper drops it because the call site can
 * pass nothing.
 *
 * Determinism: behaviour is wholly determined by (pad, state, rows). No
 * RNG, no scene-time reads, no globals.
 */
import type * as Phaser from 'phaser';
import { audio } from '../../systems/AudioSystem';
import type { SettingsGpRow } from './rowContext';

export interface SettingsGamepadState {
  index: number;
  prevU: boolean;
  prevD: boolean;
  prevL: boolean;
  prevR: boolean;
  prevA: boolean;
}

export function createSettingsGamepadState(): SettingsGamepadState {
  return {
    index: 0,
    prevU: false,
    prevD: false,
    prevL: false,
    prevR: false,
    prevA: false,
  };
}

export function tickSettingsGamepad(
  pad: Phaser.Input.Gamepad.Gamepad | null | undefined,
  state: SettingsGamepadState,
  rows: SettingsGpRow[],
  applyHighlight: () => void,
): void {
  if (!pad?.connected) {
    state.prevU = state.prevD = state.prevL = state.prevR = state.prevA = false;
    return;
  }

  const up = pad.up || pad.leftStick.y < -0.5;
  const down = pad.down || pad.leftStick.y > 0.5;
  const uE = up && !state.prevU;
  const dE = down && !state.prevD;
  state.prevU = up;
  state.prevD = down;

  if (uE) {
    state.index = (state.index - 1 + rows.length) % rows.length;
    applyHighlight();
  } else if (dE) {
    state.index = (state.index + 1) % rows.length;
    applyHighlight();
  }

  const row = rows[state.index];
  if (!row) return;

  const left = pad.left || pad.leftStick.x < -0.45;
  const right = pad.right || pad.leftStick.x > 0.45;
  const lE = left && !state.prevL;
  const rE = right && !state.prevR;
  state.prevL = left;
  state.prevR = right;

  if (row.kind === 'slider') {
    if (lE) {
      audio.playClick();
      row.minus();
    }
    if (rE) {
      audio.playClick();
      row.plus();
    }
  }

  const a = pad.buttons[0]?.pressed ?? false;
  const startB = pad.buttons[9]?.pressed ?? false;
  const confirm = a || startB;
  const aE = confirm && !state.prevA;
  state.prevA = confirm;
  if (aE) {
    if (row.kind === 'slider') {
      audio.playClick();
      row.plus();
    } else if (row.kind === 'toggle') {
      row.toggle();
    } else {
      row.go();
    }
  }
}
