import {
  ACTION_KEYS,
  type ActionKey,
  type KeyBinding,
} from '../core/actions';

export type RebindSlot = 'primary' | 'secondary';

export interface RebindResult {
  bindings: Record<ActionKey, KeyBinding>;
  /** Action that already holds the captured code; absent on success. */
  conflict?: ActionKey;
  /** Captured code the caller can echo back in UI feedback. */
  captured: string;
}

/**
 * A1 M3 — pure resolver for a key-rebind capture.
 *
 * Input: the current `keyBindings` map, the action + slot the user is
 * rebinding, and the `KeyboardEvent.code` they just pressed.
 *
 * Output: the (possibly unchanged) bindings map + an optional `conflict`
 * action key if the captured code is already bound elsewhere. Callers
 * show a warning + keep the old binding; a future feature could offer
 * auto-swap, but M3 stays conservative — player decides.
 *
 * Edge rules:
 *  - Rebinding to the same slot's existing code is a no-op (success).
 *  - Rebinding primary = current secondary of *same* action promotes
 *    the secondary to primary (UX: this is the "swap" the player
 *    intended since both slots belong to them).
 *  - Rebinding to a key held by another action → conflict, no change.
 */
export function applyKeyRebind(
  current: Record<ActionKey, KeyBinding>,
  action: ActionKey,
  slot: RebindSlot,
  code: string,
): RebindResult {
  const empty: RebindResult = { bindings: current, captured: code };
  if (!code) return empty;

  const own = current[action];
  if (slot === 'primary' && own.primary === code) return empty;
  if (slot === 'secondary' && own.secondary === code) return empty;

  // Intra-action swap: primary ↔ secondary on the same action.
  if (slot === 'primary' && own.secondary === code) {
    return {
      bindings: {
        ...current,
        [action]: { primary: code, secondary: own.primary },
      },
      captured: code,
    };
  }
  if (slot === 'secondary' && own.primary === code) {
    // Nothing to do — primary stays; secondary slot is ambiguous.
    // Treat as a reject: caller should warn "already the primary".
    return { bindings: current, conflict: action, captured: code };
  }

  // Inter-action conflict: any other action uses this code.
  for (const other of ACTION_KEYS) {
    if (other === action) continue;
    const b = current[other];
    if (b.primary === code || b.secondary === code) {
      return { bindings: current, conflict: other, captured: code };
    }
  }

  // Apply.
  const updated: KeyBinding = slot === 'primary'
    ? { primary: code, ...(own.secondary ? { secondary: own.secondary } : {}) }
    : { primary: own.primary, secondary: code };
  return {
    bindings: { ...current, [action]: updated },
    captured: code,
  };
}
