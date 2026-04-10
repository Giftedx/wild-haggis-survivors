import { describe, expect, it, vi } from 'vitest';

// Projectile imports Phaser; mock it for Node test environment.
vi.mock('phaser', () => {
  class Sprite {}
  return {
    default: {
      Physics: { Arcade: { Sprite } },
      Math: {},
      Utils: { Array: {} },
    },
  };
});

describe('Projectile bouncing hit history', () => {
  it('prevents a single bouncing projectile from hitting same enemy twice, but allows distinct enemies', async () => {
    const { Projectile } = await import('./Projectile');

    // Avoid running the real constructor (which touches scene/physics).
    const p: any = Object.create(Projectile.prototype);
    p.isBouncing = true;
    p.hitTargets = new Set();

    const e1 = {};
    const e2 = {};

    expect(p.shouldSkipHit(e1)).toBe(false);
    expect(p.shouldSkipHit(e1)).toBe(true);
    expect(p.shouldSkipHit(e2)).toBe(false);
    expect(p.shouldSkipHit(e2)).toBe(true);
  });
});

