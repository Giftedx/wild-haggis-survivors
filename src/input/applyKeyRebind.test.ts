import { describe, it, expect } from 'vitest';
import { applyKeyRebind } from './applyKeyRebind';
import { DEFAULT_KEYBINDINGS } from '../core/actions';

describe('applyKeyRebind', () => {
  it('rebinds a primary slot to a fresh key', () => {
    const result = applyKeyRebind(DEFAULT_KEYBINDINGS, 'dash', 'primary', 'ShiftLeft');
    expect(result.conflict).toBeUndefined();
    expect(result.bindings.dash.primary).toBe('ShiftLeft');
    // Other actions untouched.
    expect(result.bindings.moveUp).toEqual(DEFAULT_KEYBINDINGS.moveUp);
  });

  it('is a no-op when rebinding to the slot existing key', () => {
    const result = applyKeyRebind(DEFAULT_KEYBINDINGS, 'dash', 'primary', 'Space');
    expect(result.bindings).toBe(DEFAULT_KEYBINDINGS);
    expect(result.conflict).toBeUndefined();
  });

  it('flags a conflict when the captured key is already bound to another action', () => {
    // Bind dash to ArrowUp → conflicts with moveUp.primary.
    const result = applyKeyRebind(DEFAULT_KEYBINDINGS, 'dash', 'primary', 'ArrowUp');
    expect(result.conflict).toBe('moveUp');
    expect(result.bindings).toBe(DEFAULT_KEYBINDINGS);
  });

  it('flags a conflict when bound as secondary of another action', () => {
    // moveUp.secondary = KeyW → binding dash.primary = KeyW conflicts with moveUp.
    const result = applyKeyRebind(DEFAULT_KEYBINDINGS, 'dash', 'primary', 'KeyW');
    expect(result.conflict).toBe('moveUp');
  });

  it('swaps primary ↔ secondary when rebinding primary to own secondary', () => {
    // moveUp primary=ArrowUp, secondary=KeyW. Rebind primary → KeyW.
    const result = applyKeyRebind(DEFAULT_KEYBINDINGS, 'moveUp', 'primary', 'KeyW');
    expect(result.conflict).toBeUndefined();
    expect(result.bindings.moveUp).toEqual({ primary: 'KeyW', secondary: 'ArrowUp' });
  });

  it('rejects rebinding secondary to own primary as an ambiguous same-action conflict', () => {
    // moveUp primary=ArrowUp. Trying secondary=ArrowUp makes no sense.
    const result = applyKeyRebind(DEFAULT_KEYBINDINGS, 'moveUp', 'secondary', 'ArrowUp');
    expect(result.conflict).toBe('moveUp');
    expect(result.bindings).toBe(DEFAULT_KEYBINDINGS);
  });

  it('preserves existing secondary when rebinding only primary', () => {
    const result = applyKeyRebind(DEFAULT_KEYBINDINGS, 'pause', 'primary', 'BracketLeft');
    expect(result.bindings.pause).toEqual({ primary: 'BracketLeft', secondary: 'KeyP' });
  });

  it('writes a secondary slot on an action that has none', () => {
    const result = applyKeyRebind(DEFAULT_KEYBINDINGS, 'dash', 'secondary', 'ControlLeft');
    expect(result.bindings.dash).toEqual({ primary: 'Space', secondary: 'ControlLeft' });
  });

  it('ignores empty string captures (no change)', () => {
    const result = applyKeyRebind(DEFAULT_KEYBINDINGS, 'dash', 'primary', '');
    expect(result.bindings).toBe(DEFAULT_KEYBINDINGS);
  });
});
