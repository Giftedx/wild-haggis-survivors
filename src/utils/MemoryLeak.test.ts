import { EventEmitter } from 'events';
import { describe, expect, it, vi } from 'vitest';

// Phaser expects a browser environment. For this test we only need InputManager
// to register/unregister pointer listeners on the scene input emitter.
vi.mock('phaser', () => {
  return {
    default: {
      Input: {
        Keyboard: {
          KeyCodes: { W: 87, A: 65, S: 83, D: 68 },
        },
      },
      Math: {},
    },
  };
});

function countListeners(emitter: any, event: string): number {
  if (typeof emitter.listenerCount === 'function') return emitter.listenerCount(event);
  if (typeof emitter.listeners === 'function') return emitter.listeners(event).length;
  return 0;
}

describe('Memory leak guardrails', () => {
  it('InputManager destroys pointer listeners (touch joystick)', async () => {
    const inputEmitter = new EventEmitter();

    const makeCircle = () => {
      const obj: any = {};
      obj.setScrollFactor = () => obj;
      obj.setDepth = () => obj;
      obj.setVisible = () => obj;
      obj.setPosition = () => obj;
      obj.destroy = () => {};
      return obj;
    };

    const scene: any = {
      sys: { game: { device: { input: { touch: true } } } },
      scale: { width: 800, height: 600 },
      input: {
        on: inputEmitter.on.bind(inputEmitter),
        off: inputEmitter.off.bind(inputEmitter),
        listeners: inputEmitter.listeners.bind(inputEmitter),
        listenerCount: inputEmitter.listenerCount?.bind(inputEmitter),
        hitTestPointer: () => [],
      },
      add: {
        circle: () => makeCircle(),
      },
    };

    expect(countListeners(scene.input, 'pointerdown')).toBe(0);
    expect(countListeners(scene.input, 'pointermove')).toBe(0);
    expect(countListeners(scene.input, 'pointerup')).toBe(0);

    // Import after mocking Phaser.
    const { InputManager } = await import('./input');
    const mgr = new InputManager(scene);
    expect(countListeners(scene.input, 'pointerdown')).toBe(1);
    expect(countListeners(scene.input, 'pointermove')).toBe(1);
    expect(countListeners(scene.input, 'pointerup')).toBe(1);

    mgr.destroy();
    expect(countListeners(scene.input, 'pointerdown')).toBe(0);
    expect(countListeners(scene.input, 'pointermove')).toBe(0);
    expect(countListeners(scene.input, 'pointerup')).toBe(0);
  });
});

