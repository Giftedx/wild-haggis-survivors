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
    p.hitTargets = new WeakSet();

    // Real enemies always carry `active: true` while alive — without setting
    // it explicitly the test would coerce the missing prop to falsy and mask
    // bugs in the recycle-detection branch.
    const e1 = { active: true };
    const e2 = { active: true };

    expect(p.shouldSkipHit(e1)).toBe(false);
    expect(p.shouldSkipHit(e1)).toBe(true);
    expect(p.shouldSkipHit(e2)).toBe(false);
    expect(p.shouldSkipHit(e2)).toBe(true);
  });

  it('still skips after enemy reports active=true on every overlap frame (piercing weapons)', async () => {
    const { Projectile } = await import('./Projectile');

    const p: any = Object.create(Projectile.prototype);
    p.isBouncing = false;
    p.hitTargets = new WeakSet();

    const target = { active: true };

    // First overlap frame — register the hit.
    expect(p.shouldSkipHit(target)).toBe(false);
    // Phaser fires the overlap every physics frame while bodies intersect.
    // The next 5 frames must all report skip — otherwise piercing weapons
    // burn through their pierce count on a single tanky enemy.
    for (let frame = 0; frame < 5; frame++) {
      expect(p.shouldSkipHit(target)).toBe(true);
    }
  });
});

