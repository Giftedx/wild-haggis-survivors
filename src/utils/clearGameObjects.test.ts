import { describe, it, expect, vi } from 'vitest';
import { clearGameObjects } from './clearGameObjects';

/**
 * `clearGameObjects` is pure enough to test without Phaser — we only
 * rely on each element having a `.destroy()` method, which is the
 * contract every `Phaser.GameObjects.GameObject` already honours.
 */
describe('clearGameObjects', () => {
  it('calls destroy on every element', () => {
    const a = { destroy: vi.fn() };
    const b = { destroy: vi.fn() };
    const c = { destroy: vi.fn() };
    const arr = [a, b, c];
    clearGameObjects(arr as never);
    expect(a.destroy).toHaveBeenCalledOnce();
    expect(b.destroy).toHaveBeenCalledOnce();
    expect(c.destroy).toHaveBeenCalledOnce();
  });

  it('resets the array length to zero so the buffer can be reused', () => {
    const arr = [{ destroy: vi.fn() }, { destroy: vi.fn() }];
    clearGameObjects(arr as never);
    expect(arr.length).toBe(0);
  });

  it('no-ops on an empty array', () => {
    const arr: { destroy: () => void }[] = [];
    expect(() => clearGameObjects(arr as never)).not.toThrow();
    expect(arr.length).toBe(0);
  });
});
