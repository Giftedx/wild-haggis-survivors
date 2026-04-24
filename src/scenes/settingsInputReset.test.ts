import { describe, it, expect, beforeEach } from 'vitest';
import {
  SettingsManager,
  resetSettingsManagerSingletonForTests,
} from '../core/SettingsManager';
import { DEFAULT_KEYBINDINGS, DEFAULT_GAMEPAD_BINDINGS } from '../core/actions';
import { applyKeyRebind } from '../input/applyKeyRebind';
import { applyGamepadRebind } from '../input/applyGamepadRebind';
import { MemoryStorage } from '../test/MemoryStorage';

/**
 * Covers the persistence + reset contract T23 ships.
 *
 * The scene itself is a thin shell around:
 *   1. `applyKeyRebind` / `applyGamepadRebind` (pure, already covered)
 *   2. `SettingsManager.update(cur => ({ ...cur, keyBindings: next }))`
 *   3. `SettingsManager.update(cur => ({ ...cur, keyBindings: defaults }))`
 *
 * This test exercises (2) + (3) without needing a live Phaser scene:
 * rebind a few slots, confirm the changes persist across a manager
 * reload, then reset and confirm every field snaps back to DEFAULT.
 */
describe('SettingsInputScene persistence + reset contract', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    resetSettingsManagerSingletonForTests();
    storage = new MemoryStorage();
  });

  function manager(): SettingsManager {
    return new SettingsManager({ storage, key: 's' });
  }

  it('rebinds persist across a SettingsManager reload', () => {
    const sm = manager();
    const initial = sm.load();
    const result = applyKeyRebind(initial.keyBindings, 'dash', 'primary', 'ShiftLeft');
    sm.update((cur) => ({ ...cur, keyBindings: result.bindings }));

    // Fresh manager over the same storage — simulates a scene restart
    // or a fresh process picking up the saved settings.
    expect(manager().load().keyBindings.dash.primary).toBe('ShiftLeft');
  });

  it('gamepad rebinds persist across reload', () => {
    const sm = manager();
    const initial = sm.load();
    const result = applyGamepadRebind(initial.gamepadBindings, 'dash', 'primary', 3);
    sm.update((cur) => ({ ...cur, gamepadBindings: result.bindings }));

    expect(manager().load().gamepadBindings.dash?.primary).toBe(3);
  });

  it('reset-to-defaults wipes every keyBinding back to DEFAULT_KEYBINDINGS', () => {
    const sm = manager();
    // Chain a handful of rebinds across different actions.
    sm.update((cur) => {
      const r1 = applyKeyRebind(cur.keyBindings, 'dash', 'primary', 'ShiftLeft');
      const r2 = applyKeyRebind(r1.bindings, 'pause', 'primary', 'KeyQ');
      const r3 = applyKeyRebind(r2.bindings, 'moveUp', 'primary', 'KeyI');
      return { ...cur, keyBindings: r3.bindings };
    });
    // Reset.
    sm.update((cur) => ({
      ...cur,
      keyBindings: structuredClone(DEFAULT_KEYBINDINGS),
      gamepadBindings: structuredClone(DEFAULT_GAMEPAD_BINDINGS),
    }));
    const loaded = sm.load();
    for (const action of Object.keys(DEFAULT_KEYBINDINGS) as (keyof typeof DEFAULT_KEYBINDINGS)[]) {
      expect(loaded.keyBindings[action], action).toEqual(DEFAULT_KEYBINDINGS[action]);
    }
    expect(loaded.gamepadBindings).toEqual(DEFAULT_GAMEPAD_BINDINGS);
  });

  it('reset does not leak the DEFAULT_KEYBINDINGS reference back into storage', () => {
    const sm = manager();
    sm.update((cur) => ({
      ...cur,
      keyBindings: structuredClone(DEFAULT_KEYBINDINGS),
    }));
    const loaded = sm.load();
    // Mutating the loaded object must NOT mutate the shared DEFAULT
    // constant — otherwise the next reset would read pre-poisoned data.
    loaded.keyBindings.dash.primary = 'Backspace';
    expect(DEFAULT_KEYBINDINGS.dash.primary).toBe('Space');
  });
});
