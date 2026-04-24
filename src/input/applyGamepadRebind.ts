import {
  ACTION_KEYS,
  type ActionKey,
  type GamepadBinding,
} from '../core/actions';
import type { RebindSlot } from './applyKeyRebind';

export interface GamepadRebindResult {
  bindings: Partial<Record<ActionKey, GamepadBinding>>;
  conflict?: ActionKey;
  captured: number;
}

/**
 * A1 M3 — pure resolver for a gamepad-button rebind capture.
 *
 * Only the actions already present in `current` are gamepad-bindable
 * (M3 scope: dash + pause). Trying to rebind an action not in the map
 * is a no-op — the UI shouldn't offer the chip for un-bindable actions
 * in the first place.
 *
 * Conflict detection mirrors `applyKeyRebind`: same-slot no-op,
 * intra-action primary↔secondary swap, inter-action conflict reject.
 */
export function applyGamepadRebind(
  current: Partial<Record<ActionKey, GamepadBinding>>,
  action: ActionKey,
  slot: RebindSlot,
  button: number,
): GamepadRebindResult {
  const own = current[action];
  const empty: GamepadRebindResult = { bindings: current, captured: button };
  if (!own) return empty;
  if (!Number.isInteger(button) || button < 0 || button > 31) return empty;

  if (slot === 'primary' && own.primary === button) return empty;
  if (slot === 'secondary' && own.secondary === button) return empty;

  if (slot === 'primary' && own.secondary === button) {
    return {
      bindings: {
        ...current,
        [action]: { primary: button, secondary: own.primary },
      },
      captured: button,
    };
  }
  if (slot === 'secondary' && own.primary === button) {
    return { bindings: current, conflict: action, captured: button };
  }

  for (const other of ACTION_KEYS) {
    if (other === action) continue;
    const b = current[other];
    if (!b) continue;
    if (b.primary === button || b.secondary === button) {
      return { bindings: current, conflict: other, captured: button };
    }
  }

  const updated: GamepadBinding = slot === 'primary'
    ? { primary: button, ...(own.secondary != null ? { secondary: own.secondary } : {}) }
    : { primary: own.primary, secondary: button };
  return {
    bindings: { ...current, [action]: updated },
    captured: button,
  };
}
