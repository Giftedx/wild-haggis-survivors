import type Phaser from 'phaser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SETTINGS_STORAGE_KEY, resetSettingsManagerSingletonForTests } from '../core/SettingsManager';
import { MemoryStorage } from '../test/MemoryStorage';
import { InputManager } from './input';

vi.mock('phaser', () => {
  const phaser = {
    Input: {
      Keyboard: {
        JustDown: () => false,
      },
    },
  };
  return { default: phaser, ...phaser };
});

interface ButtonState {
  pressed: boolean;
  value: number;
}

function makeButtons(count: number): ButtonState[] {
  return Array.from({ length: count }, () => ({ pressed: false, value: 0 }));
}

function makeScene(buttons: ButtonState[]): Phaser.Scene {
  return {
    sys: { game: { device: { input: { touch: false } } } },
    input: {
      keyboard: null,
      gamepad: {
        pad1: {
          connected: true,
          buttons,
          leftStick: { x: 0, y: 0 },
          rightStick: { x: 0, y: 0 },
          left: false,
          right: false,
          up: false,
          down: false,
        },
      },
    },
    scale: { width: 800, height: 600 },
  } as unknown as Phaser.Scene;
}

function seedSettings(storage: MemoryStorage, dashPrimary: number, pausePrimary: number): void {
  storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
    settingsVersion: 1,
    gamepadBindings: {
      dash: { primary: dashPrimary },
      pause: { primary: pausePrimary },
    },
  }));
}

describe('InputManager gamepad bindings', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
    resetSettingsManagerSingletonForTests();
  });

  afterEach(() => {
    resetSettingsManagerSingletonForTests();
    vi.unstubAllGlobals();
  });

  it('uses saved gamepad bindings for dash instead of hardcoded defaults', () => {
    seedSettings(storage, 2, 8);
    const buttons = makeButtons(10);
    const input = new InputManager(makeScene(buttons));

    buttons[0].pressed = true;
    expect(input.consumeDashPressed()).toBe(false);

    buttons[0].pressed = false;
    buttons[2].pressed = true;
    expect(input.consumeDashPressed()).toBe(true);
    expect(input.consumeDashPressed()).toBe(false);
  });

  it('uses saved gamepad bindings for pause instead of hardcoded Start', () => {
    seedSettings(storage, 2, 8);
    const buttons = makeButtons(10);
    const input = new InputManager(makeScene(buttons));

    buttons[9].pressed = true;
    expect(input.consumeMenuPausePressed()).toBe(false);

    buttons[9].pressed = false;
    buttons[8].pressed = true;
    expect(input.consumeMenuPausePressed()).toBe(true);
    expect(input.consumeMenuPausePressed()).toBe(false);
  });

  it('refreshKeyBindings also refreshes gamepad bindings for live scenes', () => {
    seedSettings(storage, 2, 8);
    const buttons = makeButtons(10);
    const input = new InputManager(makeScene(buttons));

    seedSettings(storage, 3, 8);
    input.refreshKeyBindings();

    buttons[2].pressed = true;
    expect(input.consumeDashPressed()).toBe(false);

    buttons[2].pressed = false;
    buttons[3].pressed = true;
    expect(input.consumeDashPressed()).toBe(true);
  });
});
