import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DebugTimeTravelApi } from './DebugTimeTravelApi';

/**
 * Vitest runs under environment: 'node' — no `window` global. Stub a
 * minimal EventTarget-like window so install/uninstall paths exercise
 * the real keydown branches; dispatch via the captured handler (not
 * window.dispatchEvent) so tests don't depend on DOM APIs we didn't
 * bring in.
 */
function stubWindow() {
  const listeners = new Map<string, ((e: KeyboardEvent) => void)[]>();
  const fake = {
    addEventListener: vi.fn((type: string, fn: (e: KeyboardEvent) => void) => {
      const arr = listeners.get(type) ?? [];
      arr.push(fn);
      listeners.set(type, arr);
    }),
    removeEventListener: vi.fn((type: string, fn: (e: KeyboardEvent) => void) => {
      const arr = (listeners.get(type) ?? []).filter((f) => f !== fn);
      listeners.set(type, arr);
    }),
  };
  vi.stubGlobal('window', fake);
  return {
    fire(type: string, event: Partial<KeyboardEvent>) {
      for (const fn of listeners.get(type) ?? []) fn(event as KeyboardEvent);
    },
    listeners,
  };
}

describe('DebugTimeTravelApi', () => {
  let timeTravelToSeconds: ReturnType<typeof vi.fn>;
  let getGameTimeSec: ReturnType<typeof vi.fn>;
  let api: DebugTimeTravelApi;
  let winStub: ReturnType<typeof stubWindow>;

  beforeEach(() => {
    winStub = stubWindow();
    timeTravelToSeconds = vi.fn();
    getGameTimeSec = vi.fn(() => 120);
    api = new DebugTimeTravelApi({
      getSpawnSystem: () =>
        ({
          timeTravelToSeconds,
          getGameTimeSec,
        }) as never,
      isSceneActive: () => true,
    });
  });

  afterEach(() => {
    api.uninstall();
    vi.unstubAllGlobals();
  });

  describe('global DEBUG API', () => {
    it('skipToMinute(m) travels to m*60 seconds', () => {
      api.install();
      (globalThis as unknown as { DEBUG: { skipToMinute: (m: number) => void } }).DEBUG.skipToMinute(5);
      expect(timeTravelToSeconds).toHaveBeenCalledWith(300);
    });

    it('skipToGameSecond(s) travels to s seconds', () => {
      api.install();
      (globalThis as unknown as { DEBUG: { skipToGameSecond: (s: number) => void } }).DEBUG.skipToGameSecond(42);
      expect(timeTravelToSeconds).toHaveBeenCalledWith(42);
    });

    it('clamps negative inputs to 0', () => {
      api.install();
      const d = (globalThis as unknown as { DEBUG: { skipToMinute: (m: number) => void } }).DEBUG;
      d.skipToMinute(-1);
      expect(timeTravelToSeconds).toHaveBeenCalledWith(0);
    });

    it('coerces non-numeric inputs to 0', () => {
      api.install();
      const d = (globalThis as unknown as { DEBUG: { skipToMinute: (m: unknown) => void } }).DEBUG;
      d.skipToMinute('not a number');
      expect(timeTravelToSeconds).toHaveBeenCalledWith(0);
    });
  });

  describe('killCurrentBoss', () => {
    it('returns false when no boss is active', () => {
      const findActiveBoss = vi.fn(() => null);
      const custom = new DebugTimeTravelApi({
        getSpawnSystem: () => ({ timeTravelToSeconds, getGameTimeSec, findActiveBoss }) as never,
        isSceneActive: () => true,
      });
      custom.install();
      const result = (globalThis as unknown as { DEBUG: { killCurrentBoss: () => boolean } }).DEBUG.killCurrentBoss();
      expect(result).toBe(false);
      expect(findActiveBoss).toHaveBeenCalled();
      custom.uninstall();
    });

    it('calls takeDamageWithKillEvents (not takeDamage) so enemyKilled fires', () => {
      const takeDamageWithKillEvents = vi.fn(() => true);
      const takeDamage = vi.fn();
      const findActiveBoss = vi.fn(() => ({ takeDamageWithKillEvents, takeDamage }));
      const custom = new DebugTimeTravelApi({
        getSpawnSystem: () => ({ timeTravelToSeconds, getGameTimeSec, findActiveBoss }) as never,
        isSceneActive: () => true,
      });
      custom.install();
      const result = (globalThis as unknown as { DEBUG: { killCurrentBoss: () => boolean } }).DEBUG.killCurrentBoss();
      expect(result).toBe(true);
      expect(takeDamageWithKillEvents).toHaveBeenCalledWith(expect.any(Number));
      expect(takeDamage).not.toHaveBeenCalled();
      custom.uninstall();
    });
  });

  describe('uninstall', () => {
    it('removes the DEBUG global', () => {
      api.install();
      const g = globalThis as unknown as { DEBUG?: unknown };
      expect(g.DEBUG).toBeDefined();
      api.uninstall();
      expect(g.DEBUG).toBeUndefined();
    });

    it('is idempotent (second uninstall is a no-op)', () => {
      api.install();
      api.uninstall();
      expect(() => api.uninstall()).not.toThrow();
    });
  });

  describe('keydown handler', () => {
    it('Shift+] advances spawn clock by 60 seconds', () => {
      api.install();
      winStub.fire('keydown', { code: 'BracketRight', shiftKey: true, preventDefault: vi.fn() });
      expect(timeTravelToSeconds).toHaveBeenCalledWith(180); // 120 + 60
    });

    it('ignores ] without Shift', () => {
      api.install();
      winStub.fire('keydown', { code: 'BracketRight', shiftKey: false, preventDefault: vi.fn() });
      expect(timeTravelToSeconds).not.toHaveBeenCalled();
    });

    it('ignores Shift with a non-] key', () => {
      api.install();
      winStub.fire('keydown', { code: 'KeyA', shiftKey: true, preventDefault: vi.fn() });
      expect(timeTravelToSeconds).not.toHaveBeenCalled();
    });

    it('ignores the keybind when the scene is inactive', () => {
      const inactive = new DebugTimeTravelApi({
        getSpawnSystem: () => ({ timeTravelToSeconds, getGameTimeSec }) as never,
        isSceneActive: () => false,
      });
      inactive.install();
      winStub.fire('keydown', { code: 'BracketRight', shiftKey: true, preventDefault: vi.fn() });
      expect(timeTravelToSeconds).not.toHaveBeenCalled();
      inactive.uninstall();
    });

    it('removes the listener on uninstall', () => {
      api.install();
      api.uninstall();
      winStub.fire('keydown', { code: 'BracketRight', shiftKey: true, preventDefault: vi.fn() });
      expect(timeTravelToSeconds).not.toHaveBeenCalled();
    });
  });
});
