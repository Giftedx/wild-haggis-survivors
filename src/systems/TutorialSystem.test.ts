import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';
import { TutorialSystem } from './TutorialSystem';
import { SaveManager, type StorageLike } from '../core/SaveManager';

class MemoryStorage implements StorageLike {
  private m = new Map<string, string>();
  getItem(key: string) {
    return this.m.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.m.set(key, value);
  }
  removeItem(key: string) {
    this.m.delete(key);
  }
}

function makeV5Save(over: Partial<{ hasCompletedTutorial: boolean }> = {}) {
  return {
    saveVersion: 5 as const,
    totalKills: 0,
    unlockedWeapons: [] as string[],
    unlockedUpgrades: [] as string[],
    activeRun: null,
    unlockedAchievements: [] as string[],
    hasCompletedTutorial: false,
    ...over,
  };
}

describe('TutorialSystem', () => {
  let storage: MemoryStorage;
  let save: SaveManager;
  const requests: Array<{ key: string; spec: { pausePhysics?: boolean; timeScale?: number } }> = [];
  const releases: string[] = [];

  beforeEach(() => {
    storage = new MemoryStorage();
    save = new SaveManager({ storage, key: 'tut_test' });
    requests.length = 0;
    releases.length = 0;
  });

  it('does not request pause when tutorial already completed', () => {
    save.save(makeV5Save({ hasCompletedTutorial: true }));
    const tm = {
      request: (key: string, spec: { pausePhysics?: boolean; timeScale?: number }) =>
        requests.push({ key, spec }),
      release: (key: string) => releases.push(key),
    };
    const xpEvents = new EventEmitter();
    const scene: any = {
      scale: { width: 800, height: 600 },
      add: {
        rectangle: () => ({
          setStrokeStyle() {
            return this;
          },
          setScrollFactor() {
            return this;
          },
          setDepth() {
            return this;
          },
          destroy() {},
        }),
        text: () => ({
          setOrigin() {
            return this;
          },
          setScrollFactor() {
            return this;
          },
          setDepth() {
            return this;
          },
          destroy() {},
        }),
        circle: () => ({
          setDepth() {
            return this;
          },
          destroy() {},
        }),
      },
      tweens: { add: vi.fn() },
      input: { once: vi.fn() },
      getTimeManager: () => tm,
      getXPSystem: () => ({ events: xpEvents }),
    };
    const tut = new TutorialSystem(scene, save);
    tut.startRunIfNeeded();
    expect(requests).toHaveLength(0);
  });

  it('requests a paused tutorial token for a fresh save', () => {
    save.save(makeV5Save());
    const tm = {
      request: (key: string, spec: { pausePhysics?: boolean; timeScale?: number }) =>
        requests.push({ key, spec }),
      release: (key: string) => releases.push(key),
    };
    const xpEvents = new EventEmitter();
    const scene: any = {
      scale: { width: 800, height: 600 },
      add: {
        rectangle: () => ({
          setStrokeStyle() {
            return this;
          },
          setScrollFactor() {
            return this;
          },
          setDepth() {
            return this;
          },
          destroy() {},
        }),
        text: () => ({
          setOrigin() {
            return this;
          },
          setScrollFactor() {
            return this;
          },
          setDepth() {
            return this;
          },
          destroy() {},
        }),
        circle: () => ({
          setDepth() {
            return this;
          },
          destroy() {},
        }),
      },
      tweens: { add: vi.fn() },
      input: { once: vi.fn() },
      getTimeManager: () => tm,
      getXPSystem: () => ({ events: xpEvents }),
    };
    const tut = new TutorialSystem(scene, save);
    tut.startRunIfNeeded();
    expect(requests).toHaveLength(1);
    expect(requests[0].key).toBe('TUTORIAL_MOVE');
    expect(requests[0].spec.pausePhysics).toBe(true);
    expect(requests[0].spec.timeScale).toBe(0);
  });

  it('persists hasCompletedTutorial when first level-up threshold is reached', () => {
    save.save(makeV5Save());
    const tm = {
      request: vi.fn(),
      release: vi.fn(),
    };
    const xpEvents = new EventEmitter();
    const scene: any = {
      scale: { width: 800, height: 600 },
      add: {
        rectangle: () => ({
          setStrokeStyle() {
            return this;
          },
          setScrollFactor() {
            return this;
          },
          setDepth() {
            return this;
          },
          destroy() {},
        }),
        text: () => ({
          setOrigin() {
            return this;
          },
          setScrollFactor() {
            return this;
          },
          setDepth() {
            return this;
          },
          destroy() {},
        }),
        circle: () => ({
          setDepth() {
            return this;
          },
          destroy() {},
        }),
      },
      tweens: { add: vi.fn() },
      input: { once: vi.fn() },
      getTimeManager: () => tm,
      getXPSystem: () => ({ events: xpEvents }),
    };
    const tut = new TutorialSystem(scene, save);
    tut.notifyFirstLevelReached(1);
    expect(save.load().hasCompletedTutorial).toBe(false);
    tut.notifyFirstLevelReached(2);
    expect(save.load().hasCompletedTutorial).toBe(true);
  });
});
