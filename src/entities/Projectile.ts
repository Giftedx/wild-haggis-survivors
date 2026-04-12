import Phaser from 'phaser';
import type { StatusFxPool } from '../systems/StatusFxPool';

/**
 * Projectile — poolable sprite that travels in a direction and damages enemies.
 * Deactivated after hitting an enemy or traveling beyond max range.
 */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  /** Shared FX pool — set once by WeaponSystem on init. */
  static fxPool: StatusFxPool | null = null;
  private damage: number = 0;
  private critFlag: boolean = false;
  private pierceCount: number = 0;
  private weaponKey: string = '';
  private maxRange: number = 600;
  private spawnX: number = 0;
  private spawnY: number = 0;
  private isBouncing: boolean = false;
  /** Time-to-live in ms for bouncing projectiles (range check is unreliable with bounces) */
  private bouncingTTL: number = 0;
  /** Tracks enemies already hit by this projectile (prevents per-frame multi-hits on one enemy for both piercing and bouncing projectiles). */
  private hitTargets: Set<Phaser.GameObjects.GameObject> = new Set();
  /** Optional callback fired when this projectile deactivates (used by Highland Games explosion) */
  onDeactivateCallback: (() => void) | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'thistle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
  }

  /** Fire this projectile from a position toward a target */
  fire(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    speed: number,
    damage: number,
    pierce: number = 0,
    maxRange: number = 600,
    isCrit: boolean = false
  ): void {
    this.setPosition(fromX, fromY);
    this.setActive(true);
    this.setVisible(true);
    this.spawnX = fromX;
    this.spawnY = fromY;
    this.damage = damage;
    this.critFlag = isCrit;
    this.pierceCount = pierce;
    this.maxRange = maxRange;
    this.isBouncing = false;
    this.hitTargets.clear();
    this.onDeactivateCallback = null; // Clear any prior override
    // Clear weapon key — non-projectile fire paths (bouncing, homing,
    // exploding, rapid bounce) don't set it, so a stale 'caber_toss' key
    // from a previous run of this pool slot would incorrectly trigger
    // burn application in onProjectileHitEnemy.
    this.weaponKey = '';

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setCollideWorldBounds(false);
    body.setBounce(0, 0);

    const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);
    this.setRotation(angle);
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  update(delta: number = 16): void {
    if (!this.active) return;

    // Bouncing projectiles use a TTL instead of distance (bounces make distance unreliable)
    if (this.isBouncing) {
      this.bouncingTTL -= delta;
      if (this.bouncingTTL <= 0) {
        this.deactivate();
      }
      return;
    }

    // Deactivate if beyond max range
    const dist = Phaser.Math.Distance.Between(
      this.spawnX, this.spawnY, this.x, this.y
    );
    if (dist > this.maxRange) {
      this.deactivate();
    }
  }

  /**
   * Guard against per-frame repeat-hits on the same enemy. Phaser's overlap
   * callback fires every physics frame while bodies intersect, so without
   * this a single piercing caber "hits" the same enemy 3-10 times per pass
   * and burns through its pierce count on one target. Also prevents bouncing
   * projectiles from re-damaging enemies they already passed through.
   *
   * Pooled enemy note: if the enemy was killed and recycled by the pool into
   * a fresh activation, the `active` flag flips back to true — treat it as a
   * new enemy and allow the hit.
   */
  shouldSkipHit(enemy: Phaser.GameObjects.GameObject): boolean {
    if (this.hitTargets.has(enemy)) {
      if ((enemy as Phaser.GameObjects.GameObject & { active: boolean }).active) {
        // Recycled pool slot — stale reference, clear and allow the hit.
        this.hitTargets.delete(enemy);
      } else {
        return true;
      }
    }
    this.hitTargets.add(enemy);
    return false;
  }

  /** Called when this projectile hits an enemy. Returns true if projectile should die. */
  onHitEnemy(): boolean {
    // Bouncing projectiles pass through enemies — they live until range expires
    if (this.isBouncing) return false;

    if (this.pierceCount > 0) {
      this.pierceCount--;
      return false;
    }
    this.deactivate();
    return true;
  }

  /** Mark this projectile as a bouncing type (survives enemy hits, uses TTL) */
  setBouncing(ttlMs: number = 5000): void {
    this.isBouncing = true;
    this.bouncingTTL = ttlMs;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setBounce(1, 1);
  }

  deactivate(): void {
    if (!this.active) return;

    // Fire optional callback (e.g., Highland Games explosion)
    if (this.onDeactivateCallback) {
      const cb = this.onDeactivateCallback;
      this.onDeactivateCallback = null; // Clear to prevent re-firing
      cb();
    }

    // Small pop effect so projectiles don't just vanish
    if (this.scene && this.visible) {
      const pool = Projectile.fxPool;
      if (pool) {
        const pop = pool.acquireArc(this.x, this.y, 3, 0xffffff, 0.5);
        this.scene.tweens.add({
          targets: pop, scaleX: 2.5, scaleY: 2.5, alpha: 0, duration: 120,
          ease: 'Cubic.easeOut',
          onComplete: () => { pop.setVisible(false); },
        });
      }
    }

    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    this.hitTargets.clear(); // Prevent stale refs leaking into next pool cycle
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
  }

  getDamage(): number { return this.damage; }
  isCrit(): boolean { return this.critFlag; }
  getWeaponKey(): string { return this.weaponKey; }
  setWeaponKey(key: string): void { this.weaponKey = key; }
}
