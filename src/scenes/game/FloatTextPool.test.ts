import { describe, expect, it, vi } from 'vitest';
import { FloatTextPool } from './FloatTextPool';
import type Phaser from 'phaser';

interface MockText {
  visible: boolean;
  alpha: number;
  scale: number;
  text: string;
  color: string;
  x: number;
  y: number;
  fontSize: string;
  depth: number;
  setText(s: string): MockText;
  setPosition(x: number, y: number): MockText;
  setVisible(v: boolean): MockText;
  setAlpha(a: number): MockText;
  setScale(s: number): MockText;
  setColor(c: string): MockText;
  setFontSize(s: string): MockText;
  setDepth(d: number): MockText;
  destroy(): void;
}

function makeText(): MockText {
  const t: MockText = {
    visible: true,
    alpha: 1,
    scale: 1,
    text: '',
    color: '#ffffff',
    x: 0,
    y: 0,
    fontSize: '16px',
    depth: 0,
    setText(s) { this.text = s; return this; },
    setPosition(x, y) { this.x = x; this.y = y; return this; },
    setVisible(v) { this.visible = v; return this; },
    setAlpha(a) { this.alpha = a; return this; },
    setScale(s) { this.scale = s; return this; },
    setColor(c) { this.color = c; return this; },
    setFontSize(s) { this.fontSize = s; return this; },
    setDepth(d) { this.depth = d; return this; },
    destroy: vi.fn(),
  };
  return t;
}

function makeScene(): { scene: Phaser.Scene; created: MockText[] } {
  const created: MockText[] = [];
  const scene = {
    add: {
      text: () => {
        const t = makeText();
        created.push(t);
        return t;
      },
    },
  } as unknown as Phaser.Scene;
  return { scene, created };
}

describe('FloatTextPool.init', () => {
  it('creates exactly 12 text objects', () => {
    const pool = new FloatTextPool();
    const { scene, created } = makeScene();
    pool.init(scene);
    expect(created).toHaveLength(12);
  });

  it('all texts start invisible — ready for acquire', () => {
    const pool = new FloatTextPool();
    const { scene, created } = makeScene();
    pool.init(scene);
    expect(created.every((t) => !t.visible)).toBe(true);
  });

  it('init twice destroys the previous batch', () => {
    const pool = new FloatTextPool();
    const { scene, created } = makeScene();
    pool.init(scene);
    const firstBatch = [...created];
    pool.init(scene);
    for (const t of firstBatch) {
      expect(t.destroy).toHaveBeenCalled();
    }
  });
});

describe('FloatTextPool.acquire', () => {
  it('returns the first invisible text — sets position + content', () => {
    const pool = new FloatTextPool();
    const { scene, created } = makeScene();
    pool.init(scene);
    const t = pool.acquire(50, 75, '+10', '#ff0');
    expect(t).not.toBeNull();
    expect(t!.x).toBe(50);
    expect(t!.y).toBe(75);
    expect(t!.text).toBe('+10');
    expect(t!.color).toBe('#ff0');
    expect(t!.visible).toBe(true);
    expect(created[0]).toBe(t);
  });

  it('uses defaults for fontSize and depth', () => {
    const pool = new FloatTextPool();
    const { scene } = makeScene();
    pool.init(scene);
    const t = pool.acquire(0, 0, 'hi', '#fff');
    expect(t!.fontSize).toBe('16px');
    expect(t!.depth).toBe(85);
  });

  it('respects custom fontSize and depth overrides', () => {
    const pool = new FloatTextPool();
    const { scene } = makeScene();
    pool.init(scene);
    const t = pool.acquire(0, 0, 'big', '#fff', '24px', 99);
    expect(t!.fontSize).toBe('24px');
    expect(t!.depth).toBe(99);
  });

  it('returns null when the pool is exhausted', () => {
    const pool = new FloatTextPool();
    const { scene } = makeScene();
    pool.init(scene);
    for (let i = 0; i < 12; i++) {
      expect(pool.acquire(i, 0, 'n', '#fff')).not.toBeNull();
    }
    expect(pool.acquire(0, 0, 'overflow', '#fff')).toBeNull();
  });

  it('returns to availability when caller sets a slot invisible', () => {
    const pool = new FloatTextPool();
    const { scene, created } = makeScene();
    pool.init(scene);
    for (let i = 0; i < 12; i++) pool.acquire(i, 0, 'n', '#fff');
    expect(pool.acquire(0, 0, 'overflow', '#fff')).toBeNull();
    created[3]?.setVisible(false);
    const reused = pool.acquire(99, 99, 'recycled', '#000');
    expect(reused).toBe(created[3]);
    expect(reused!.text).toBe('recycled');
  });

  it('resets alpha and scale on acquire (fresh slot)', () => {
    const pool = new FloatTextPool();
    const { scene, created } = makeScene();
    pool.init(scene);
    const t1 = pool.acquire(0, 0, 'a', '#fff')!;
    t1.setAlpha(0.2).setScale(0.4); // simulate tween mid-fade
    t1.setVisible(false);
    const t2 = pool.acquire(0, 0, 'b', '#fff')!;
    expect(t2).toBe(created[0]);
    expect(t2.alpha).toBe(1);
    expect(t2.scale).toBe(1);
  });
});

describe('FloatTextPool.destroyAll', () => {
  it('destroys every text and empties the pool', () => {
    const pool = new FloatTextPool();
    const { scene, created } = makeScene();
    pool.init(scene);
    pool.destroyAll();
    for (const t of created) {
      expect(t.destroy).toHaveBeenCalled();
    }
    expect(pool.acquire(0, 0, 'after', '#fff')).toBeNull();
  });

  it('swallows destroy() exceptions (best-effort shutdown)', () => {
    const pool = new FloatTextPool();
    const { scene, created } = makeScene();
    pool.init(scene);
    created[3]!.destroy = (() => { throw new Error('phaser shutdown race'); }) as () => void;
    expect(() => pool.destroyAll()).not.toThrow();
  });
});
