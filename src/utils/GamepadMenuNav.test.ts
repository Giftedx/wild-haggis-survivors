import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({ default: {} }));

import type Phaser from 'phaser';
import { GamepadMenuNav, stepGamepadMenuIndex } from './GamepadMenuNav';

function makeRect(active = true): Phaser.GameObjects.Rectangle {
  return { active, setStrokeStyle: vi.fn() } as unknown as Phaser.GameObjects.Rectangle;
}

function makeScene() {
  const updateFns = new Set<(time: number, delta: number) => void>();
  return {
    events: {
      on: vi.fn((ev: string, fn: (time: number, delta: number) => void) => {
        if (ev === 'update') updateFns.add(fn);
        return {} as Phaser.Events.EventEmitter;
      }),
      off: vi.fn((ev: string, fn: (time: number, delta: number) => void) => {
        if (ev === 'update') updateFns.delete(fn);
      }),
    },
    input: { gamepad: { pad1: null } },
    __fireUpdate(delta = 16) {
      for (const fn of updateFns) fn(0, delta);
    },
  } as unknown as Phaser.Scene & { __fireUpdate(delta?: number): void };
}

describe('stepGamepadMenuIndex', () => {
  it('returns 0 when length is 0', () => {
    expect(stepGamepadMenuIndex(3, 0, 1)).toBe(0);
    expect(stepGamepadMenuIndex(3, 0, -1)).toBe(0);
  });

  it('wraps down from last to first', () => {
    expect(stepGamepadMenuIndex(2, 3, 1)).toBe(0);
  });

  it('wraps up from first to last', () => {
    expect(stepGamepadMenuIndex(0, 3, -1)).toBe(2);
  });

  it('steps within range', () => {
    expect(stepGamepadMenuIndex(1, 4, 1)).toBe(2);
    expect(stepGamepadMenuIndex(1, 4, -1)).toBe(0);
  });

  it('single entry is stable', () => {
    expect(stepGamepadMenuIndex(0, 1, 1)).toBe(0);
    expect(stepGamepadMenuIndex(0, 1, -1)).toBe(0);
  });
});

describe('GamepadMenuNav', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fires onHighlightChange after construction and on step', () => {
    const scene = makeScene();
    const highlights: number[] = [];
    const r0 = makeRect();
    const r1 = makeRect();
    const nav = new GamepadMenuNav(
      scene,
      [
        { rect: r0, activate: () => undefined },
        { rect: r1, activate: () => undefined },
      ],
      { onHighlightChange: (i) => highlights.push(i) },
    );
    expect(highlights).toEqual([0]);
    nav.step(1);
    expect(nav.getIndex()).toBe(1);
    expect(highlights).toEqual([0, 1]);
    nav.destroy();
  });

  it('syncExternalIndex clamps to bounds', () => {
    const scene = makeScene();
    const r0 = makeRect();
    const r1 = makeRect();
    const nav = new GamepadMenuNav(scene, [
      { rect: r0, activate: () => undefined },
      { rect: r1, activate: () => undefined },
    ]);
    nav.syncExternalIndex(99);
    expect(nav.getIndex()).toBe(1);
    nav.syncExternalIndex(-3);
    expect(nav.getIndex()).toBe(0);
    nav.destroy();
  });

  it('activateIndex moves highlight then runs activate', () => {
    const scene = makeScene();
    const activated: string[] = [];
    const r0 = makeRect();
    const r1 = makeRect();
    const nav = new GamepadMenuNav(scene, [
      { rect: r0, activate: () => activated.push('a') },
      { rect: r1, activate: () => activated.push('b') },
    ]);
    nav.activateIndex(1);
    expect(activated).toEqual(['b']);
    expect(r1.setStrokeStyle).toHaveBeenCalled();
    nav.destroy();
  });

  it('getEntryCount matches constructor entries', () => {
    const scene = makeScene();
    const nav = new GamepadMenuNav(scene, [{ rect: makeRect(), activate: () => undefined }]);
    expect(nav.getEntryCount()).toBe(1);
    nav.destroy();
  });
});
