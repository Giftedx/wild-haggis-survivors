import Phaser from 'phaser';
import { EnemyConfig, EnemyBehavior } from '../data/enemies';
import { ENEMIES } from '../config';

/**
 * Enemy sprite — poolable, supports multiple behavior types.
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private hp: number = 0;
  private maxHp: number = 0;
  private speed: number = 0;
  private damage: number = 0;
  private xpValue: number = 0;
  private enemyKey: string = '';
  private behavior: EnemyBehavior = 'chase';
  private bossFlag: boolean = false;
  private eliteFlag: boolean = false;

  /** Dive enemies lock their angle on spawn and don't re-aim */
  private diveAngle: number = 0;
  private diveStarted: boolean = false;

  /** Persistent tint color to restore after damage flash (bosses = red, hazards = orange) */
  private baseTint: number = 0;

  /** Ranged enemies track distance to maintain standoff */
  private rangedCooldown: number = 0;
  private readonly RANGED_STANDOFF = 200;

  /** Mini HP bar for tanky enemies */
  private hpBarBg: Phaser.GameObjects.Rectangle | null = null;
  private hpBarFill: Phaser.GameObjects.Rectangle | null = null;
  private showHpBar: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'tourist');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
  }

  spawn(x: number, y: number, config: EnemyConfig, gameTimeSec: number): void {
    this.setPosition(x, y);
    this.setTexture(config.texture);
    this.setActive(true);
    this.setVisible(true);
    this.setScale(1);
    this.clearTint();

    // Kill stale tweens from prior pool cycle, then fade in
    this.scene.tweens.killTweensOf(this);
    this.setAlpha(0);
    this.scene.tweens.add({ targets: this, alpha: 1, duration: 150 });
    const puff = this.scene.add.circle(x, y, 12, 0xaaaaaa, 0.3);
    this.scene.tweens.add({
      targets: puff, radius: 20, alpha: 0, duration: 200,
      onComplete: () => puff.destroy(),
    });

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setCollideWorldBounds(false);
    body.setBounce(0, 0);

    // Size hitbox based on texture — boss texture is 60x60, others are 20-44px
    const r = config.texture === 'boss' ? 24
      : config.key === 'highland_cow' ? 18
      : config.key === 'terrier' ? 8
      : 14;
    body.setCircle(r, this.width / 2 - r, this.height / 2 - r);

    this.enemyKey = config.key;
    this.speed = config.speed;
    this.damage = config.damage;
    this.xpValue = config.xpValue;
    this.behavior = config.behavior;
    this.bossFlag = false;
    this.eliteFlag = false;
    this.baseTint = 0;
    this.diveStarted = false;
    this.rangedCooldown = 0;

    // Reset bouncing-projectile hit tracking ID so recycled pool objects
    // aren't confused with their prior incarnation
    (this as any).__bouncingHitId = Math.random();

    // Scale HP and damage with game time
    const hpMul = 1 + ENEMIES.HP_SCALE_PER_MINUTE * (gameTimeSec / 60);
    this.maxHp = Math.ceil(config.hp * hpMul);
    this.hp = this.maxHp;
    // Damage scales at half the rate of HP — enemies get tougher but not overwhelming
    // Hazards use flat damage (invincible static obstacles — scaling would be unfair)
    if (config.behavior !== 'hazard') {
      const dmgMul = 1 + (ENEMIES.HP_SCALE_PER_MINUTE * 0.5) * (gameTimeSec / 60);
      this.damage = Math.ceil(config.damage * dmgMul);
    }

    // Hazards are stationary and visually distinct
    if (this.behavior === 'hazard') {
      this.baseTint = 0xff6600;
      this.setTint(0xff6600);
      this.setScale(1.5);
      this.setVelocity(0, 0);
      // Hazards despawn after 10 seconds to prevent permanent pool slot exhaustion
      // (they're invincible, so without a TTL they accumulate until no enemies can spawn)
      this.scene.time.delayedCall(10000, () => {
        if (this.active && this.behavior === 'hazard') {
          this.scene.tweens.add({
            targets: this, alpha: 0, duration: 500,
            onComplete: () => this.die(),
          });
        }
      });
    }

    // Tanks resist knockback via higher mass
    if (this.behavior === 'tank') {
      body.mass = 5;
    } else {
      body.mass = 1;
    }

    // Show mini HP bar for tanky enemies (HP > 15), but NOT invincible hazards.
    // Bosses use the HUD's centered boss bar instead (set after spawn via markAsBoss).
    this.showHpBar = config.hp >= 15 && config.behavior !== 'hazard';
    if (this.showHpBar) {
      if (!this.hpBarBg) {
        this.hpBarBg = this.scene.add.rectangle(0, 0, 24, 3, 0x333333).setDepth(30);
        this.hpBarFill = this.scene.add.rectangle(0, 0, 24, 3, 0xcc3333).setOrigin(0, 0.5).setDepth(31);
      }
      this.hpBarBg.setVisible(true).setPosition(this.x, this.y - 20);
      this.hpBarFill!.setVisible(true).setPosition(this.x - 12, this.y - 20);
      this.hpBarFill!.width = 24;
    } else {
      this.hpBarBg?.setVisible(false);
      this.hpBarFill?.setVisible(false);
    }
  }

  /** Update movement toward the player. Called by SpawnSystem each frame. */
  chaseTarget(targetX: number, targetY: number, delta: number = 16): void {
    if (!this.active) return;

    // Update HP bar position
    if (this.showHpBar && this.hpBarBg && this.hpBarFill) {
      this.hpBarBg.setPosition(this.x, this.y - 20);
      this.hpBarFill.setPosition(this.x - 12, this.y - 20);
      this.hpBarFill.width = 24 * (this.hp / this.maxHp);
    }

    switch (this.behavior) {
      case 'chase':
      case 'swarm':
        this.behaviorChase(targetX, targetY);
        break;
      case 'tank':
        this.behaviorTank(targetX, targetY);
        break;
      case 'dive':
        this.behaviorDive(targetX, targetY);
        break;
      case 'ranged':
        this.behaviorRanged(targetX, targetY, delta);
        break;
      case 'hazard':
        // Static — do nothing
        break;
    }
  }

  private behaviorChase(tx: number, ty: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
  }

  private behaviorTank(tx: number, ty: number): void {
    // Same as chase but the high HP and low speed define the tank feel
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
  }

  private behaviorDive(tx: number, ty: number): void {
    if (!this.diveStarted) {
      // Lock angle toward player once, then charge in a straight line
      this.diveAngle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
      this.diveStarted = true;
    }
    this.setVelocity(
      Math.cos(this.diveAngle) * this.speed,
      Math.sin(this.diveAngle) * this.speed
    );

    // Self-destruct if way off screen (account for camera zoom)
    const cam = this.scene.cameras.main;
    const viewW = cam.width / cam.zoom;
    const viewH = cam.height / cam.zoom;
    const margin = 300;
    if (
      this.x < cam.scrollX - margin || this.x > cam.scrollX + viewW + margin ||
      this.y < cam.scrollY - margin || this.y > cam.scrollY + viewH + margin
    ) {
      this.die();
    }
  }

  private behaviorRanged(tx: number, ty: number, delta: number): void {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, tx, ty);
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);

    if (dist > this.RANGED_STANDOFF) {
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    } else if (dist < this.RANGED_STANDOFF * 0.7) {
      this.setVelocity(-Math.cos(angle) * this.speed, -Math.sin(angle) * this.speed);
    } else {
      this.setVelocity(
        Math.cos(angle + Math.PI / 2) * this.speed * 0.5,
        Math.sin(angle + Math.PI / 2) * this.speed * 0.5
      );
    }

    // Fire a "net" (slowing projectile) at the player on cooldown
    this.rangedCooldown -= delta;
    if (this.rangedCooldown <= 0 && dist <= this.RANGED_STANDOFF * 1.5) {
      this.rangedCooldown = 3000; // 3 second cooldown
      this.fireNet(tx, ty);
    }
  }

  /** Fire a visual "net" that slows the player on contact */
  private fireNet(tx: number, ty: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const speed = 180;

    const net = this.scene.add.circle(this.x, this.y, 5, 0x336633, 0.8);
    this.scene.physics.add.existing(net);
    const body = net.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    let hit = false;

    const cleanup = () => {
      if (!hit) {
        hit = true;
        this.scene.physics.world.removeCollider(overlapRef);
        net.destroy();
      }
    };

    const gameScene = this.scene as any;
    const player = gameScene.getPlayer?.();
    if (!player) { net.destroy(); return; }

    const overlapRef = this.scene.physics.add.overlap(net, player, () => {
      if (hit) return;
      cleanup();

      // Debuff-stack safe: only one slow applied regardless of how many nets hit
      player.applyNetSlow();
      this.scene.time.delayedCall(2000, () => {
        player.removeNetSlow();
      });
    });

    // Auto-cleanup after 2 seconds if it misses
    this.scene.time.delayedCall(2000, cleanup);
  }

  takeDamage(amount: number): boolean {
    if (this.behavior === 'hazard') return false; // invincible

    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
      return true;
    }
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (!this.active) return;
      // Restore persistent tint (e.g. boss red) instead of clearing all tints
      if (this.baseTint) {
        this.clearTint();
        this.setTint(this.baseTint);
      } else {
        this.clearTint();
      }
    });
    return false;
  }

  private die(): void {
    this.setActive(false);
    this.setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.setVelocity(0, 0);
    this.hpBarBg?.setVisible(false);
    this.hpBarFill?.setVisible(false);
  }

  getDamage(): number { return this.damage; }
  getXpValue(): number { return this.xpValue; }
  getEnemyKey(): string { return this.enemyKey; }
  getBehavior(): EnemyBehavior { return this.behavior; }
  getHpFraction(): number { return this.maxHp > 0 ? this.hp / this.maxHp : 0; }
  getHp(): number { return this.hp; }
  getMaxHp(): number { return this.maxHp; }
  isBoss(): boolean { return this.bossFlag; }
  setBaseTint(color: number): void {
    this.baseTint = color;
    this.setTint(color);
  }

  markAsBoss(): void {
    this.bossFlag = true;
    // Bosses use the HUD's centered boss bar — hide the mini HP bar
    this.showHpBar = false;
    this.hpBarBg?.setVisible(false);
    this.hpBarFill?.setVisible(false);
  }

  /** Make this enemy an elite variant — bigger, tougher, more rewarding */
  markAsElite(): void {
    this.eliteFlag = true;
    this.maxHp = Math.ceil(this.maxHp * 2);
    this.hp = this.maxHp;
    this.speed = Math.ceil(this.speed * 1.3);
    this.xpValue = this.xpValue * 3;
    this.setScale(this.scaleX * 1.3);
    this.setBaseTint(0xffdd44); // golden glow
    this.showHpBar = true;
    if (!this.hpBarBg) {
      this.hpBarBg = this.scene.add.rectangle(0, 0, 24, 3, 0x333333).setDepth(30);
      this.hpBarFill = this.scene.add.rectangle(0, 0, 24, 3, 0xffdd44).setOrigin(0, 0.5).setDepth(31);
    }
    this.hpBarBg!.setVisible(true);
    this.hpBarFill!.setVisible(true).setFillStyle(0xffdd44);
  }

  isElite(): boolean { return this.eliteFlag; }
}
