import { describe, expect, it, vi } from 'vitest';

// Lightweight Phaser mock: enough for TimeManager/XPSystem/SpawnSystem constructors.
vi.mock('phaser', () => {
  class EE {
    private listenersMap = new Map<string, Set<Function>>();
    on(event: string, fn: Function) {
      if (!this.listenersMap.has(event)) this.listenersMap.set(event, new Set());
      this.listenersMap.get(event)!.add(fn);
    }
    off(event: string, fn: Function) {
      this.listenersMap.get(event)?.delete(fn);
    }
    emit(event: string, ...args: any[]) {
      for (const fn of this.listenersMap.get(event) ?? []) fn(...args);
    }
    removeAllListeners() {
      this.listenersMap.clear();
    }
    listenerCount(event: string) {
      return this.listenersMap.get(event)?.size ?? 0;
    }
  }

  class Group {
    private children: any[] = [];
    add(obj: any) { this.children.push(obj); return obj; }
    getChildren() { return this.children; }
    getFirstDead() { return this.children.find(c => !c.active) ?? null; }
    getLength() { return this.children.length; }
    countActive() { return this.children.filter(c => c.active).length; }
    clear() { this.children = []; }
  }

  return {
    default: {
      Events: { EventEmitter: EE },
      Math: {},
      GameObjects: { Group },
    },
  };
});

// Mock pooled entities used by systems so we don't pull in Phaser internals.
vi.mock('../entities/XPGem', () => {
  class XPGem {
    active = false;
    drop() { this.active = true; }
    collect() { this.active = false; return 0; }
    forceCollect() { this.active = true; }
    updateMagnet() {}
    destroy() {}
  }
  return { XPGem };
});

vi.mock('../entities/Enemy', () => {
  const MAX = 400;
  class Enemy {
    active = false;
    visible = false;
    constructor() {}
    spawn() { this.active = true; this.visible = true; }
    chaseTarget() {}
    isBoss() { return false; }
    isElite() { return false; }
    markAsBoss() {}
    markAsElite() {}
    setBaseDisplayScale() {}
    setBaseTint() {}
    destroy() { this.active = false; this.visible = false; }
    static acquireFromPool(pool: any, _scene: any) {
      const e = pool.getFirstDead(false);
      if (e) return e;
      if (pool.countActive(true) >= MAX) return null;
      const n = new Enemy();
      pool.add(n);
      return n;
    }
  }
  return { Enemy };
});

import { TimeManager } from '../systems/TimeManager';
import { XPSystem } from '../systems/XPSystem';
import { SpawnSystem } from '../systems/SpawnSystem';

async function makeFakeScene(tm: TimeManager) {
  // Avoid relying on Phaser's Group constructor signature (typings expect args).
  class SimpleGroup {
    private children: any[] = [];
    add(obj: any) { this.children.push(obj); return obj; }
    getChildren() { return this.children; }
    getFirstDead() { return this.children.find(c => !c.active) ?? null; }
    getLength() { return this.children.length; }
    countActive(_includeChildren?: boolean) { return this.children.filter(c => c.active).length; }
    clear() { this.children = []; }
  }
  const scene: any = {
    add: {
      group: () => new SimpleGroup(),
    },
    cameras: { main: { width: 800, height: 600, zoom: 1, shake: () => {} } },
    scale: { width: 800, height: 600 },
    tweens: { add: () => {} },
    getTimeManager: () => tm,
    getUpdateTickers: () => ({ addOnce: () => ({ cancel() {} }) }),
    getPlayer: () => ({ x: 0, y: 0 }),
    getSFXManager: () => ({ tryPlay: (_k: string, fn: () => void) => { fn(); }, clear: () => {} }),
  };
  return scene;
}

describe('Cross-run state isolation', () => {
  it('Run 2 is pristine (XP=0, enemies=0, tokens=0) after Run 1 teardown', async () => {
    // Run 1
    const adapter = {
      setTimeScale: () => {},
      pausePhysics: () => {},
      resumePhysics: () => {},
      getPhysicsPaused: () => false,
    };
    const tm1 = new TimeManager(adapter);
    const fullScene1: any = await makeFakeScene(tm1);
    const xp1 = new XPSystem(fullScene1);
    const sp1 = new SpawnSystem(fullScene1);

    // Give player 100 XP (direct state mutation for deterministic test)
    (xp1 as any).currentXP = 100;
    // Spawn 5 enemies by marking pooled entries active
    const enemies1 = sp1.getEnemyGroup().getChildren() as any[];
    for (let i = 0; i < 5; i++) enemies1[i].active = true;
    // Push SLOW_MO token
    tm1.request('SLOW_MO', { timeScale: 0.3 });
    expect(tm1.getTokenCount()).toBeGreaterThan(0);

    // Teardown Run 1
    xp1.destroy();
    sp1.destroy();
    tm1.destroy();

    // Run 2
    const tm2 = new TimeManager(adapter);
    const fullScene2: any = await makeFakeScene(tm2);
    const xp2 = new XPSystem(fullScene2);
    const sp2 = new SpawnSystem(fullScene2);

    expect(xp2.getCurrentXP()).toBe(0);
    expect(sp2.getEnemyGroup().countActive(true)).toBe(0);
    expect(tm2.getTokenCount()).toBe(0);
  });
});

