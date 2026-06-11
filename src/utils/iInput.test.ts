import { describe, expect, it } from 'vitest';
import type { IInput } from './iInput';
import { ReplayInput } from '../replay/ReplayInput';
import { createEmptyReplayBlob, type ReplayBlob, type ReplayFrame } from '../replay/replayBlob';

/**
 * Shape tests — any type that claims to implement IInput must answer
 * the five methods with the expected shape. We can't reflect at
 * runtime in TypeScript so this is a compile-time constraint: if the
 * assignment below type-errors, the class doesn't conform.
 *
 * ReplayInput is used as a concrete witness here because `InputManager`
 * pulls in the `phaser` module, which breaks node-env vitest. The live
 * `InputManager` conformance is enforced purely by the `implements IInput`
 * annotation in `src/utils/input.ts` (tsc catches drift).
 */
function makeBlob(frames: ReplayFrame[]): ReplayBlob {
  const b = createEmptyReplayBlob({ build: 't', seed: 1, variantKey: 'classic' });
  b.frames = frames;
  b.frameCount = frames.length;
  return b;
}

describe('IInput contract', () => {
  it('ReplayInput is assignable to IInput', () => {
    const player = new ReplayInput(makeBlob([]));
    const handle: IInput = player;
    expect(typeof handle.getDirection).toBe('function');
    expect(typeof handle.consumeDashPressed).toBe('function');
    expect(typeof handle.consumeMenuPausePressed).toBe('function');
    expect(typeof handle.peekReplayFrame).toBe('function');
    expect(typeof handle.destroy).toBe('function');
  });

  it('ReplayInput returns the IInput-specified shape for each method', () => {
    const player = new ReplayInput(
      makeBlob([{ dtMs: 16, dx: 0.5, dy: -0.5, dash: true, menu: false }]),
    );
    player.advanceFrame();

    const dir = player.getDirection();
    expect(typeof dir.x).toBe('number');
    expect(typeof dir.y).toBe('number');

    expect(player.consumeDashPressed()).toBe(true);
    expect(player.consumeDashPressed()).toBe(false); // idempotent per frame
    expect(player.consumeMenuPausePressed()).toBe(false);

    const snap = player.peekReplayFrame();
    expect(typeof snap.dx).toBe('number');
    expect(typeof snap.dy).toBe('number');
    expect(typeof snap.dash).toBe('boolean');
    expect(typeof snap.menu).toBe('boolean');

    expect(() => player.destroy()).not.toThrow();
  });
});
