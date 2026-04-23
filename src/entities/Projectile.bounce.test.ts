import { describe, expect, it, vi } from 'vitest';

// Projectile imports Phaser; mock it for Node test environment.
vi.mock('phaser', () => {
  class Sprite {}
  const __m = {
      Physics: { Arcade: { Sprite } },
      Math: {},
      Utils: { Array: {} },
    };
  return { default: __m, ...__m };
});

describe('Projectile.onHitEnemy pierce logic', () => {
  it('piercing projectile survives hits until pierce count exhausted', async () => {
    const { Projectile } = await import('./Projectile');
    const p: any = Object.create(Projectile.prototype);
    p.isBouncing = false;
    p.pierceCount = 2;
    p.active = true;
    p.visible = true;
    p.scene = null;
    p.body = { enable: true };
    p.hitTargets = new WeakSet();
    p.onDeactivateCallback = null;
    p.setActive = function(v: boolean) { this.active = v; };
    p.setVisible = function(v: boolean) { this.visible = v; };
    p.setVelocity = function() {};

    expect(p.onHitEnemy()).toBe(false); // pierce 2→1
    expect(p.onHitEnemy()).toBe(false); // pierce 1→0
    expect(p.onHitEnemy()).toBe(true);  // pierce 0 → deactivate
    expect(p.active).toBe(false);
  });

  it('bouncing projectile never dies from enemy hits', async () => {
    const { Projectile } = await import('./Projectile');
    const p: any = Object.create(Projectile.prototype);
    p.isBouncing = true;
    p.pierceCount = 0;

    expect(p.onHitEnemy()).toBe(false);
    expect(p.onHitEnemy()).toBe(false);
    expect(p.onHitEnemy()).toBe(false);
  });

  it('zero-pierce projectile dies on first hit', async () => {
    const { Projectile } = await import('./Projectile');
    const p: any = Object.create(Projectile.prototype);
    p.isBouncing = false;
    p.pierceCount = 0;
    p.active = true;
    p.visible = true;
    p.scene = null;
    p.body = { enable: true };
    p.hitTargets = new WeakSet();
    p.onDeactivateCallback = null;
    p.setActive = function(v: boolean) { this.active = v; };
    p.setVisible = function(v: boolean) { this.visible = v; };
    p.setVelocity = function() {};

    expect(p.onHitEnemy()).toBe(true);
    expect(p.active).toBe(false);
  });
});

describe('Projectile.update range + TTL deactivation', () => {
  it('deactivates when distance exceeds maxRange', async () => {
    const { Projectile } = await import('./Projectile');
    const p: any = Object.create(Projectile.prototype);
    p.active = true;
    p.visible = true;
    p.isBouncing = false;
    p.maxRange = 100;
    p.spawnX = 0;
    p.spawnY = 0;
    p.x = 101; // beyond range
    p.y = 0;
    p.scene = null;
    p.body = { enable: true };
    p.hitTargets = new WeakSet();
    p.onDeactivateCallback = null;
    p.setActive = function(v: boolean) { this.active = v; };
    p.setVisible = function(v: boolean) { this.visible = v; };
    p.setVelocity = function() {};

    p.update(16);
    expect(p.active).toBe(false);
  });

  it('stays active when within maxRange', async () => {
    const { Projectile } = await import('./Projectile');
    const p: any = Object.create(Projectile.prototype);
    p.active = true;
    p.isBouncing = false;
    p.maxRange = 100;
    p.spawnX = 0;
    p.spawnY = 0;
    p.x = 50;
    p.y = 0;

    p.update(16);
    expect(p.active).toBe(true);
  });

  it('bouncing TTL counts down and deactivates at 0', async () => {
    const { Projectile } = await import('./Projectile');
    const p: any = Object.create(Projectile.prototype);
    p.active = true;
    p.visible = true;
    p.isBouncing = true;
    p.bouncingTTL = 100;
    p.scene = null;
    p.body = { enable: true };
    p.hitTargets = new WeakSet();
    p.onDeactivateCallback = null;
    p.setActive = function(v: boolean) { this.active = v; };
    p.setVisible = function(v: boolean) { this.visible = v; };
    p.setVelocity = function() {};

    p.update(50); // TTL = 50
    expect(p.active).toBe(true);
    p.update(50); // TTL = 0
    expect(p.active).toBe(false);
  });
});

describe('Projectile.deactivate callback', () => {
  it('fires onDeactivateCallback once on deactivate', async () => {
    const { Projectile } = await import('./Projectile');
    const p: any = Object.create(Projectile.prototype);
    p.active = true;
    p.visible = true;
    p.scene = null;
    p.body = { enable: true };
    p.hitTargets = new WeakSet();
    p.setActive = function(v: boolean) { this.active = v; };
    p.setVisible = function(v: boolean) { this.visible = v; };
    p.setVelocity = function() {};

    let callCount = 0;
    p.onDeactivateCallback = () => { callCount++; };

    p.deactivate();
    expect(callCount).toBe(1);
    expect(p.onDeactivateCallback).toBeNull();

    // Second deactivate should not fire callback again
    p.active = true; // pretend re-pooled
    p.deactivate();
    expect(callCount).toBe(1);
  });
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

