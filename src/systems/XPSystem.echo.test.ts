import { describe, expect, it, vi } from 'vitest';

// Phaser touches `window` at eval time, so tests that import XPSystem must
// stub the relevant Phaser surface first (mirrors RunHydration.test.ts).
vi.mock('./AudioSystem', () => ({
  audio: { playXPCollectImmediate: vi.fn(), playLevelUp: vi.fn() },
}));

vi.mock('../entities/XPGem', () => ({
  XPGem: class XPGem {
    active = false;
    constructor(_scene: unknown) {}
    collect() { return 0; }
    drop() { this.active = true; }
    forceCollect() { return 0; }
    updateMagnet() {}
    destroy() {}
  },
}));

vi.mock('phaser', () => {
  class EE {
    private handlers: Record<string, ((...args: unknown[]) => void)[]> = {};
    on(ev: string, fn: (...args: unknown[]) => void) {
      (this.handlers[ev] ??= []).push(fn);
      return this;
    }
    emit(ev: string, ...args: unknown[]) {
      for (const fn of this.handlers[ev] ?? []) fn(...args);
    }
    removeAllListeners() { this.handlers = {}; }
  }
  class Group {
    private _children: unknown[] = [];
    get children() { return { entries: this._children }; }
    add(obj: unknown) { this._children.push(obj); return obj; }
    getChildren() { return this._children; }
    getFirstDead() { return null; }
    getLength() { return this._children.length; }
    clear() { this._children = []; }
  }
  return {
    default: {
      Events: { EventEmitter: EE },
      Math: {},
      GameObjects: { Group },
    },
  };
});

import { XPSystem } from './XPSystem';
import { XP } from '../config';

/**
 * Post-cap echo card trigger — XP collected past MAX_LEVEL accumulates
 * into a buffer that fires `echoReady` each ECHO_XP_THRESHOLD crossing.
 * Gold overflow still runs in parallel; the two paths are independent.
 */
describe('XPSystem post-cap echoes', () => {
  function makeScene(): {
    overflowGoldGrants: number;
    scene: ConstructorParameters<typeof XPSystem>[0];
  } {
    const ctx = {
      overflowGoldGrants: 0,
    } as { overflowGoldGrants: number; scene: ConstructorParameters<typeof XPSystem>[0] };
    ctx.scene = {
      grantXpOverflowGold: (g: number) => { ctx.overflowGoldGrants += g; },
      getSFXManager: () => ({
        tryPlay: (_k: string, fn: () => void) => { fn(); },
        clear: () => {},
      }),
      add: {
        group: () => {
          const pool: unknown[] = [];
          return {
            add: (x?: unknown) => { if (x) pool.push(x); return x; },
            children: { entries: pool },
            getChildren: () => pool,
            getFirstDead: () => null,
            getLength: () => pool.length,
            clear: () => { pool.length = 0; },
          };
        },
      },
      tweens: { killTweensOf: () => {} },
      getPlayer: () => null,
    } as unknown as ConstructorParameters<typeof XPSystem>[0];
    return ctx;
  }

  it('does not emit echoReady before max level is reached', () => {
    const { scene } = makeScene();
    const xp = new XPSystem(scene);
    let echoes = 0;
    xp.events.on('echoReady', () => { echoes++; });

    // Lvl-1 player: XP goes into the level-up queue, never touches the
    // echo buffer. Guarantees echoes can't fire without max-level gating.
    xp.grantBonusXp(XP.ECHO_XP_THRESHOLD - 1);
    expect(echoes).toBe(0);
  });

  it('emits echoReady once when post-cap XP crosses the threshold', () => {
    const { scene } = makeScene();
    const xp = new XPSystem(scene);
    xp.hydrateRunState(XP.MAX_LEVEL, 0);
    let echoes = 0;
    xp.events.on('echoReady', () => { echoes++; });

    xp.grantBonusXp(XP.ECHO_XP_THRESHOLD);
    expect(echoes).toBe(1);
  });

  it('queues additional echoes instead of firing them back-to-back', () => {
    const { scene } = makeScene();
    const xp = new XPSystem(scene);
    xp.hydrateRunState(XP.MAX_LEVEL, 0);
    let echoes = 0;
    xp.events.on('echoReady', () => { echoes++; });

    // Three thresholds' worth of XP at once — one fires immediately,
    // the other two stay queued until processNextEcho runs.
    xp.grantBonusXp(XP.ECHO_XP_THRESHOLD * 3);
    expect(echoes).toBe(1);
    expect(xp.hasPendingEchoes()).toBe(true);

    xp.processNextEcho();
    expect(echoes).toBe(2);
    xp.processNextEcho();
    expect(echoes).toBe(3);
    xp.processNextEcho(); // drains the queue, no new emit
    expect(echoes).toBe(3);
    expect(xp.hasPendingEchoes()).toBe(false);
  });

  it('isEchoInProgress flips false only after the last pick drains the queue', () => {
    const { scene } = makeScene();
    const xp = new XPSystem(scene);
    xp.hydrateRunState(XP.MAX_LEVEL, 0);

    xp.grantBonusXp(XP.ECHO_XP_THRESHOLD * 2);
    // First echo showing; one more queued.
    expect(xp.isEchoInProgress()).toBe(true);

    xp.processNextEcho();  // pick first, show second
    expect(xp.isEchoInProgress()).toBe(true);  // still showing

    xp.processNextEcho();  // pick second, queue drained
    expect(xp.isEchoInProgress()).toBe(false);  // teardown ok
  });

  it('still grants overflow gold on the same XP that fires an echo', () => {
    const ctx = makeScene();
    const xp = new XPSystem(ctx.scene);
    xp.hydrateRunState(XP.MAX_LEVEL, 0);

    xp.grantBonusXp(XP.ECHO_XP_THRESHOLD);
    // Both paths ran: echo fired AND gold was granted for the overflow XP.
    expect(ctx.overflowGoldGrants).toBeGreaterThan(0);
  });

  it('resetRunState clears the echo buffer and queue', () => {
    const { scene } = makeScene();
    const xp = new XPSystem(scene);
    xp.hydrateRunState(XP.MAX_LEVEL, 0);
    xp.grantBonusXp(XP.ECHO_XP_THRESHOLD * 2);

    xp.resetRunState();
    expect(xp.getPostCapEchoBuffer()).toBe(0);
    expect(xp.hasPendingEchoes()).toBe(false);
  });
});
