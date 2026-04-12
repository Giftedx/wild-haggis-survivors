import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';
import { TutorialSystem } from './TutorialSystem';
import { SaveManager, type RunHistoryEntry } from '../core/SaveManager';
import { MemoryStorage } from '../test/MemoryStorage';

function makeV6Save(over: Partial<{ hasCompletedTutorial: boolean }> = {}) {
  return {
    saveVersion: 7 as const,
    totalKills: 0,
    totalKillsSpent: 0,
    unlockedWeapons: [] as string[],
    unlockedUpgrades: [] as string[],
    activeRun: null,
    unlockedAchievements: [] as string[],
    hasCompletedTutorial: false,
    hasSeenDriftTutorial: false,
    runHistory: [] as RunHistoryEntry[],
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
    save.save(makeV6Save({ hasCompletedTutorial: true }));
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
          setInteractive() {
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
      time: { delayedCall: vi.fn(() => ({ destroy: vi.fn() })) },
      getUpdateTickers: () => ({ addOnce: vi.fn(() => ({ cancel: vi.fn() })) }),
      getTimeManager: () => tm,
      getXPSystem: () => ({ events: xpEvents }),
    };
    const tut = new TutorialSystem(scene, save);
    tut.startRunIfNeeded();
    expect(requests).toHaveLength(0);
  });

  it('requests a paused tutorial token for a fresh save', () => {
    save.save(makeV6Save());
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
          setInteractive() {
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
      time: { delayedCall: vi.fn(() => ({ destroy: vi.fn() })) },
      getUpdateTickers: () => ({ addOnce: vi.fn(() => ({ cancel: vi.fn() })) }),
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

  it('does not start tutorial overlays on resumed runs', () => {
    save.save(makeV6Save());
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
          setInteractive() {
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
      time: { delayedCall: vi.fn(() => ({ destroy: vi.fn() })) },
      getUpdateTickers: () => ({ addOnce: vi.fn(() => ({ cancel: vi.fn() })) }),
      getTimeManager: () => tm,
      getXPSystem: () => ({ events: xpEvents }),
    };
    const tut = new TutorialSystem(scene, save);
    tut.startRunIfNeeded({ resumeRun: true });
    expect(requests).toHaveLength(0);
  });

  it('persists hasCompletedTutorial when first level-up threshold is reached', () => {
    save.save(makeV6Save());
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
          setInteractive() {
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
      time: { delayedCall: vi.fn(() => ({ destroy: vi.fn() })) },
      getUpdateTickers: () => ({ addOnce: vi.fn(() => ({ cancel: vi.fn() })) }),
      getTimeManager: () => tm,
      getXPSystem: () => ({ events: xpEvents }),
    };
    const tut = new TutorialSystem(scene, save);
    tut.notifyFirstLevelReached(1);
    expect(save.load().hasCompletedTutorial).toBe(false);
    tut.notifyFirstLevelReached(2);
    expect(save.load().hasCompletedTutorial).toBe(true);
  });

  it('lays tutorial overlays out against the UI viewport', () => {
    save.save(makeV6Save());
    const rectangles: Array<{ x: number; y: number; width: number; height: number }> = [];
    const tm = {
      request: (key: string, spec: { pausePhysics?: boolean; timeScale?: number }) =>
        requests.push({ key, spec }),
      release: (key: string) => releases.push(key),
    };
    const xpEvents = new EventEmitter();
    const scene: any = {
      scale: { width: 800, height: 600 },
      cameras: { main: { zoom: 1.25 } },
      add: {
        rectangle: (x: number, y: number, width: number, height: number) => {
          rectangles.push({ x, y, width, height });
          return {
            setStrokeStyle() {
              return this;
            },
            setScrollFactor() {
              return this;
            },
            setDepth() {
              return this;
            },
            setInteractive() {
              return this;
            },
            destroy() {},
          };
        },
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
      time: { delayedCall: vi.fn(() => ({ destroy: vi.fn() })) },
      getUpdateTickers: () => ({ addOnce: vi.fn(() => ({ cancel: vi.fn() })) }),
      getTimeManager: () => tm,
      getXPSystem: () => ({ events: xpEvents }),
    };

    const tut = new TutorialSystem(scene, save);
    tut.startRunIfNeeded();

    expect(rectangles[0]).toEqual({ x: 400, y: 300, width: 640, height: 480 });
    expect(rectangles[1]?.x).toBe(400);
    expect(rectangles[1]?.y).toBe(300);
  });
});
