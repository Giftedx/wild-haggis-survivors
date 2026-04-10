import Phaser from 'phaser';

/**
 * Projectile — poolable sprite that travels in a direction and damages enemies.
 * Deactivated after hitting an enemy or traveling beyond max range.
 */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
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
  /** Tracks enemies already hit by bouncing projectiles to prevent per-frame damage */
  private bouncingHitEnemies: Set<number> = new Set();
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
    this.bouncingHitEnemies.clear();
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
   * For bouncing projectiles: checks if this enemy was already hit recently.
   * Records the hit and sets a cooldown so the same enemy can be hit again on a later bounce.
   * Returns true if the hit should be skipped (already hit recently).
   */
  shouldSkipHit(enemy: Phaser.GameObjects.GameObject): boolean {
    if (!this.isBouncing) return false;

    const id = (enemy as any).__bouncingHitId ?? ((enemy as any).__bouncingHitId = Math.random());
    if (this.bouncingHitEnemies.has(id)) return true;

    this.bouncingHitEnemies.add(id);
    this.scene.time.delayedCall(500, () => {
      if (this.active) this.bouncingHitEnemies.delete(id);
    });
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
    // Fire optional callback (e.g., Highland Games explosion)
    if (this.onDeactivateCallback) {
      const cb = this.onDeactivateCallback;
      this.onDeactivateCallback = null; // Clear to prevent re-firing
      cb();
    }
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    this.bouncingHitEnemies.clear(); // Prevent stale IDs leaking into next pool cycle
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
  }

  getDamage(): number { return this.damage; }
  isCrit(): boolean { return this.critFlag; }
  getWeaponKey(): string { return this.weaponKey; }
  setWeaponKey(key: string): void { this.weaponKey = key; }
}
