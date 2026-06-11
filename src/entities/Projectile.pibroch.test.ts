import { describe, expect, it, vi } from 'vitest';

// Projectile imports Phaser; mock it for Node test environment.
vi.mock('phaser', () => {
  class Sprite {}
  const __m = {
    Physics: { Arcade: { Sprite } },
    Math: { Angle: { Between: () => 0 } },
    Utils: { Array: {} },
  };
  return { default: __m, ...__m };
});

/**
 * On-fire stamping (DESIGN_IDEAS §1 Pibroch Crescendo) — projectiles
 * snapshot the alignment flag at fire time and the hit handler reads
 * the stamped value, so flight-desync stops punishing rhythm play.
 *
 * The pool reuse path is the dangerous one: a "yes" stamp from shot
 * N must NOT carry into shot N+1. fire() resets unconditionally; if
 * the caller forgets to stamp the new shot, the default is "no
 * bonus" — a missed-stamp degrades to today's behaviour for that
 * shot, never accidentally awards an unearned bonus.
 */
describe('Projectile.setPibrochAligned / isPibrochAlignedAtFire', () => {
  it('defaults to false on a fresh instance', async () => {
    const { Projectile } = await import('./Projectile');
    const p: any = Object.create(Projectile.prototype);
    p.pibrochAlignedAtFire = false;
    expect(p.isPibrochAlignedAtFire()).toBe(false);
  });

  it('setPibrochAligned(true) flips the stamp', async () => {
    const { Projectile } = await import('./Projectile');
    const p: any = Object.create(Projectile.prototype);
    p.pibrochAlignedAtFire = false;
    p.setPibrochAligned(true);
    expect(p.isPibrochAlignedAtFire()).toBe(true);
  });

  it('setPibrochAligned(false) clears the stamp', async () => {
    const { Projectile } = await import('./Projectile');
    const p: any = Object.create(Projectile.prototype);
    p.pibrochAlignedAtFire = true;
    p.setPibrochAligned(false);
    expect(p.isPibrochAlignedAtFire()).toBe(false);
  });

  it('fire() resets the stamp so a recycled pool slot cannot carry a stale yes', async () => {
    const { Projectile } = await import('./Projectile');
    const p: any = Object.create(Projectile.prototype);
    // Seed the minimum surface fire() touches.
    p.pibrochAlignedAtFire = true; // pretend prior shot was aligned
    p.spawnX = 0;
    p.spawnY = 0;
    p.damage = 0;
    p.critFlag = false;
    p.pierceCount = 0;
    p.maxRange = 0;
    p.isBouncing = false;
    p.weaponKey = 'caber_toss'; // would otherwise leak into the next slot
    p.hitTargets = new WeakSet();
    p.onDeactivateCallback = null;
    p.body = { enable: false, setCollideWorldBounds: () => {}, setBounce: () => {} };
    p.setPosition = () => {};
    p.setActive = () => {};
    p.setVisible = () => {};
    p.setRotation = () => {};
    p.setVelocity = () => {};

    p.fire(0, 0, 100, 0, 200, 5, 0, 600, false);

    expect(p.isPibrochAlignedAtFire()).toBe(false);
    // Sibling reset already covered by Projectile.bounce.test.ts;
    // assert here too so a future fire() refactor that drops the
    // pibroch reset shows up in this file's failure rather than
    // silently reintroducing the bag.
    expect(p.weaponKey).toBe('');
  });
});
