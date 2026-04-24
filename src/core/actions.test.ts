import { describe, it, expect } from 'vitest';
import {
  ACTION_KEYS,
  DEFAULT_KEYBINDINGS,
  DEFAULT_GAMEPAD_BINDINGS,
  type ActionKey,
  type KeyBinding,
  type GamepadBinding,
} from './actions';

describe('ActionKey catalog', () => {
  it('covers the six remappable actions', () => {
    expect(ACTION_KEYS).toEqual([
      'moveUp',
      'moveDown',
      'moveLeft',
      'moveRight',
      'dash',
      'pause',
    ] satisfies ActionKey[]);
  });

  it('defines a primary keyboard code for every action', () => {
    for (const action of ACTION_KEYS) {
      const binding = DEFAULT_KEYBINDINGS[action];
      expect(binding.primary, `${action} has a primary`).toBeTypeOf('string');
      expect(binding.primary.length, `${action} primary not empty`).toBeGreaterThan(0);
    }
  });

  it('uses the classic Vampire Survivors defaults (arrows + WASD + Space + Escape)', () => {
    const expected: Record<ActionKey, KeyBinding> = {
      moveUp: { primary: 'ArrowUp', secondary: 'KeyW' },
      moveDown: { primary: 'ArrowDown', secondary: 'KeyS' },
      moveLeft: { primary: 'ArrowLeft', secondary: 'KeyA' },
      moveRight: { primary: 'ArrowRight', secondary: 'KeyD' },
      dash: { primary: 'Space' },
      pause: { primary: 'Escape', secondary: 'KeyP' },
    };
    expect(DEFAULT_KEYBINDINGS).toEqual(expected);
  });

  it('binds gamepad actions to standard layout buttons', () => {
    // Only dash + pause are gamepad-rebindable in M3.
    // Movement stays on sticks / D-pad (handled in InputManager, not ActionKey).
    const expected: Partial<Record<ActionKey, GamepadBinding>> = {
      dash: { primary: 0, secondary: 7 },
      pause: { primary: 9 },
    };
    expect(DEFAULT_GAMEPAD_BINDINGS).toEqual(expected);
  });

  it('no default keyboard binding is reused across actions', () => {
    const seen = new Set<string>();
    for (const action of ACTION_KEYS) {
      const { primary, secondary } = DEFAULT_KEYBINDINGS[action];
      expect(seen.has(primary), `${action} primary ${primary} unique`).toBe(false);
      seen.add(primary);
      if (secondary) {
        expect(seen.has(secondary), `${action} secondary ${secondary} unique`).toBe(false);
        seen.add(secondary);
      }
    }
  });
});
