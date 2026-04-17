import { describe, expect, it, vi } from 'vitest';
import { StatusFxPool } from './StatusFxPool';
import type Phaser from 'phaser';

interface MockArc {
  x: number; y: number; radius: number; color: number; alpha: number;
  scale: number; visible: boolean; depth: number;
  setPosition(x: number, y: number): MockArc;
  setRadius(r: number): MockArc;
  setFillStyle(c: number, a: number): MockArc;
  setScale(s: number): MockArc;
  setAlpha(a: number): MockArc;
  setVisible(v: boolean): MockArc;
  setDepth(d: number): MockArc;
  destroy(): void;
}

interface MockImg {
  x: number; y: number; texture: string; scale: number; alpha: number;
  visible: boolean; depth: number; origin: number;
  setPosition(x: number, y: number): MockImg;
  setTexture(t: string): MockImg;
  setScale(s: number): MockImg;
  setAlpha(a: number): MockImg;
  setVisible(v: boolean): MockImg;
  setDepth(d: number): MockImg;
  setOrigin(o: number): MockImg;
  destroy(): void;
}

function makeArc(): MockArc {
  const a: MockArc = {
    x: 0, y: 0, radius: 3, color: 0xffffff, alpha: 0, scale: 1,
    visible: false, depth: 0,
    setPosition(x, y) { this.x = x; this.y = y; return this; },
    setRadius(r) { this.radius = r; return this; },
    setFillStyle(c, a2) { this.color = c; this.alpha = a2; return this; },
    setScale(s) { this.scale = s; return this; },
    setAlpha(a2) { this.alpha = a2; return this; },
    setVisible(v) { this.visible = v; return this; },
    setDepth(d) { this.depth = d; return this; },
    destroy: vi.fn(),
  };
  return a;
}

function makeImg(): MockImg {
  const i: MockImg = {
    x: 0, y: 0, texture: 'fx_snowflake', scale: 1, alpha: 0,
    visible: false, depth: 0, origin: 0.5,
    setPosition(x, y) { this.x = x; this.y = y; return this; },
    setTexture(t) { this.texture = t; return this; },
    setScale(s) { this.scale = s; return this; },
    setAlpha(a) { this.alpha = a; return this; },
    setVisible(v) { this.visible = v; return this; },
    setDepth(d) { this.depth = d; return this; },
    setOrigin(o) { this.origin = o; return this; },
    destroy: vi.fn(),
  };
  return i;
}

function makeScene(): {
  scene: Phaser.Scene;
  arcs: MockArc[];
  imgs: MockImg[];
  killTweensOf: ReturnType<typeof vi.fn>;
} {
  const arcs: MockArc[] = [];
  const imgs: MockImg[] = [];
  const killTweensOf = vi.fn();
  const scene = {
    add: {
      circle: () => {
        const a = makeArc();
        arcs.push(a);
        return a;
      },
      image: () => {
        const i = makeImg();
        imgs.push(i);
        return i;
      },
    },
    tweens: { killTweensOf },
  } as unknown as Phaser.Scene;
  return { scene, arcs, imgs, killTweensOf };
}

describe('StatusFxPool — construction', () => {
  it('pre-allocates the requested arc + image counts', () => {
    const { scene, arcs, imgs } = makeScene();
    new StatusFxPool(scene, 5, 3);
    expect(arcs).toHaveLength(5);
    expect(imgs).toHaveLength(3);
  });

  it('all pre-allocated objects start invisible', () => {
    const { scene, arcs, imgs } = makeScene();
    new StatusFxPool(scene, 4, 2);
    expect(arcs.every((a) => !a.visible)).toBe(true);
    expect(imgs.every((i) => !i.visible)).toBe(true);
  });

  it('honours default sizes when not specified', () => {
    const { scene, arcs, imgs } = makeScene();
    new StatusFxPool(scene);
    expect(arcs).toHaveLength(100);
    expect(imgs).toHaveLength(24);
  });
});

describe('StatusFxPool.acquireArc', () => {
  it('returns the first slot, sets position + style, marks visible', () => {
    const { scene, arcs } = makeScene();
    const pool = new StatusFxPool(scene, 3, 2);
    const a = pool.acquireArc(10, 20, 4, 0xff00ff, 0.7);
    expect(a).toBe(arcs[0]);
    const m = a as unknown as MockArc;
    expect(m.x).toBe(10);
    expect(m.y).toBe(20);
    expect(m.radius).toBe(4);
    expect(m.color).toBe(0xff00ff);
    expect(m.alpha).toBe(0.7);
    expect(m.visible).toBe(true);
  });

  it('round-robins across slots', () => {
    const { scene, arcs } = makeScene();
    const pool = new StatusFxPool(scene, 3, 2);
    expect(pool.acquireArc(0, 0, 1, 0, 1)).toBe(arcs[0]);
    expect(pool.acquireArc(0, 0, 1, 0, 1)).toBe(arcs[1]);
    expect(pool.acquireArc(0, 0, 1, 0, 1)).toBe(arcs[2]);
    expect(pool.acquireArc(0, 0, 1, 0, 1)).toBe(arcs[0]); // wraps
  });

  it('kills outstanding tweens on the slot before reuse', () => {
    const { scene, arcs, killTweensOf } = makeScene();
    const pool = new StatusFxPool(scene, 2, 1);
    pool.acquireArc(0, 0, 1, 0, 1);
    expect(killTweensOf).toHaveBeenLastCalledWith(arcs[0]);
  });
});

describe('StatusFxPool.acquireImage', () => {
  it('returns the first slot, sets position + texture, marks visible', () => {
    const { scene, imgs } = makeScene();
    const pool = new StatusFxPool(scene, 1, 2);
    const i = pool.acquireImage(50, 60);
    expect(i).toBe(imgs[0]);
    const m = i as unknown as MockImg;
    expect(m.x).toBe(50);
    expect(m.y).toBe(60);
    expect(m.texture).toBe('fx_snowflake');
    expect(m.visible).toBe(true);
  });

  it('round-robins across image slots', () => {
    const { scene, imgs } = makeScene();
    const pool = new StatusFxPool(scene, 1, 3);
    expect(pool.acquireImage(0, 0)).toBe(imgs[0]);
    expect(pool.acquireImage(0, 0)).toBe(imgs[1]);
    expect(pool.acquireImage(0, 0)).toBe(imgs[2]);
    expect(pool.acquireImage(0, 0)).toBe(imgs[0]);
  });

  it('arc and image rotors are independent', () => {
    const { scene, arcs, imgs } = makeScene();
    const pool = new StatusFxPool(scene, 2, 2);
    pool.acquireArc(0, 0, 1, 0, 1); // arcIdx → 1
    pool.acquireArc(0, 0, 1, 0, 1); // arcIdx → 2
    expect(pool.acquireImage(0, 0)).toBe(imgs[0]);
    expect(pool.acquireArc(0, 0, 1, 0, 1)).toBe(arcs[0]); // arc resumes at 0
  });
});

describe('StatusFxPool.destroy', () => {
  it('destroys every arc + image and empties the pool', () => {
    const { scene, arcs, imgs } = makeScene();
    const pool = new StatusFxPool(scene, 4, 2);
    pool.destroy();
    for (const a of arcs) expect(a.destroy).toHaveBeenCalled();
    for (const i of imgs) expect(i.destroy).toHaveBeenCalled();
  });

  it('subsequent acquireArc throws on the empty pool (defensive)', () => {
    const { scene } = makeScene();
    const pool = new StatusFxPool(scene, 4, 2);
    pool.destroy();
    // Spec note: destroy is terminal — calling acquire after is a programmer error.
    expect(() => pool.acquireArc(0, 0, 1, 0, 1)).toThrow();
  });
});
