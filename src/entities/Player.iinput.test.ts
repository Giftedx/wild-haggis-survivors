import { describe, expect, it, vi } from 'vitest';

// Same Phaser + subscription-bag shims as Player.stats.test.ts — enough of
// the runtime to let Player's constructor run under node-env vitest.
vi.mock('phaser', () => {
  class Body {
    setCircle() {}
    setCollideWorldBounds() {}
    velocity = { x: 0, y: 0 };
  }
  class Sprite {
    scene: unknown;
    x = 0;
    y = 0;
    body = new Body();
    width = 48;
    height = 48;
    setCollideWorldBounds() {}
    setScale() {
      return this;
    }
    setDepth() {
      return this;
    }
    setTexture() {
      return this;
    }
    setOrigin() {
      return this;
    }
    constructor(scene: unknown, x: number, y: number, _tex: string) {
      this.scene = scene;
      this.x = x;
      this.y = y;
    }
  }
  return {
    default: {
      Physics: { Arcade: { Sprite, Body } },
      Math: {
        Angle: {
          Between: (x1: number, y1: number, x2: number, y2: number) =>
            Math.atan2(y2 - y1, x2 - x1),
        },
        Clamp: (v: number, min: number, max: number) =>
          Math.min(max, Math.max(min, v)),
      },
    },
  };
});

vi.mock('../utils/input', () => ({
  InputManager: class LiveInputManager {
    getDirection() {
      return { x: 0, y: 0 };
    }
    consumeDashPressed() {
      return false;
    }
    consumeMenuPausePressed() {
      return false;
    }
    peekReplayFrame() {
      return { dx: 0, dy: 0, dash: false, menu: false };
    }
    destroy() {}
  },
}));

vi.mock('../utils/SubscriptionBag', () => ({
  SubscriptionBag: class {
    add() {}
    listen() {}
    dispose() {}
  },
}));

import { Player } from './Player';
import type { IInput } from '../utils/iInput';

function makeScene(): unknown {
  const spriteStub = () => ({
    setVisible: () => spriteStub(),
    setDepth: () => spriteStub(),
    setPosition: () => spriteStub(),
    setRotation: () => spriteStub(),
    setScale: () => spriteStub(),
    setTexture: () => spriteStub(),
    destroy: () => {},
    depth: 0,
    x: 0,
    y: 0,
  });
  return {
    add: {
      existing: vi.fn(),
      image: () => ({ setDepth: () => ({ setScale: () => ({}) }) }),
      sprite: spriteStub,
    },
    physics: {
      add: { existing: vi.fn() },
    },
    input: { on: vi.fn(), off: vi.fn() },
    scale: { width: 800, height: 600 },
  };
}

function makeTimeManager(): unknown {
  return {
    isGameplayPaused: () => false,
  };
}

/**
 * A deterministic, introspectable IInput. Records every method call so a
 * test can assert Player consumed the injected source and not the live
 * InputManager. Mirrors the shape ReplayInput exports.
 */
function makeStubInput(): IInput & { calls: string[] } {
  const stub = {
    calls: [] as string[],
    getDirection() {
      this.calls.push('getDirection');
      return { x: 1, y: 0 };
    },
    consumeDashPressed() {
      this.calls.push('consumeDashPressed');
      return true;
    },
    consumeMenuPausePressed() {
      this.calls.push('consumeMenuPausePressed');
      return false;
    },
    peekReplayFrame() {
      this.calls.push('peekReplayFrame');
      return { dx: 1, dy: 0, dash: false, menu: false };
    },
    destroy() {
      this.calls.push('destroy');
    },
  };
  return stub;
}

describe('Player IInput dependency injection', () => {
  it('falls back to a live InputManager when no source is injected', () => {
    const player = new Player(
      makeScene() as never,
      0,
      0,
      'haggis_classic',
      makeTimeManager() as never,
    );
    // consumePauseMenuEdge delegates through the (mock) live manager.
    expect(player.consumePauseMenuEdge()).toBe(false);
  });

  it('uses the injected IInput for menu + replay peek', () => {
    const stub = makeStubInput();
    const player = new Player(
      makeScene() as never,
      0,
      0,
      'haggis_classic',
      makeTimeManager() as never,
      undefined,
      stub,
    );
    expect(player.consumePauseMenuEdge()).toBe(false);
    expect(stub.calls).toContain('consumeMenuPausePressed');

    const snap = player.peekReplayInputFrame();
    expect(snap).toEqual({ dx: 1, dy: 0, dash: false, menu: false });
    expect(stub.calls).toContain('peekReplayFrame');
  });

  it('does NOT route through the injected source when a different method is called on Player', () => {
    const stub = makeStubInput();
    const player = new Player(
      makeScene() as never,
      0,
      0,
      'haggis_classic',
      makeTimeManager() as never,
      undefined,
      stub,
    );
    // No call yet — stub should be quiet until Player forwards.
    expect(stub.calls).toEqual([]);
    player.peekReplayInputFrame();
    expect(stub.calls).toEqual(['peekReplayFrame']);
  });
});
