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
  private enraged: boolean = false;
  private phase2Done: boolean = false;

  /** Ranged enemies track distance to maintain standoff */
  private rangedCooldown: number = 0;
  private readonly RANGED_STANDOFF = 200;

  /** Orbit enemies circle the player */
  private orbitAngle: number = 0;
  private readonly ORBIT_RADIUS = 180;

  /** Flee enemies run away but with wool armor */
  private woolArmor: number = 0;

  /** Spawner enemies summon minions periodically */
  private spawnerCooldown: number = 0;

  /** Phase enemies toggle between solid and intangible */
  private phaseTimer: number = 0;
  private isPhased: boolean = false;

  /** Status effects */
  private burnDamage: number = 0;
  private burnTimer: number = 0;
  private burnTickAccum: number = 0;
  private freezeTimer: number = 0;
  private freezeSpeedMul: number = 1;
  private poisonDamage: number = 0;
  private poisonTimer: number = 0;
  private poisonTickAccum: number = 0;
  /** Unscaled base speed (config.speed) — reference point for derivative scaling */
  private baseSpeed: number = 0;
  /** Berserker HP-based scaling applied on top of baseSpeed (1.0 = no scaling) */
  private berserkerSpeedMul: number = 1;
  /** Temporary speed buff (e.g. Piper aura) composed into recomputeSpeed. Decays over time. */
  private buffSpeedMul: number = 1;
  private buffSpeedTimer: number = 0;

  /** Knockback impulse — overrides behavior-set velocity for a brief window so
   *  pushes actually push (behaviorChase overwrites velocity every frame
   *  otherwise, which made all additive `body.velocity +=` knockbacks invisible). */
  private knockbackVx: number = 0;
  private knockbackVy: number = 0;
  private knockbackTimer: number = 0;

  /** Display scale anchor — set whenever the enemy's "base" visual size
   *  should change (elite 1.3×, boss 2.0-3.0×, enraged hazard 1.5×). The
   *  idle bob reads this and wobbles around it, so bob no longer wipes
   *  boss/elite scale. */
  private baseDisplayScale: number = 1;

  /** Mini HP bar for tanky enemies */
  private hpBarBg: Phaser.GameObjects.Rectangle | null = null;
  private hpBarFill: Phaser.GameObjects.Rectangle | null = null;
  private showHpBar: boolean = false;
  /** Soft ground shadow that follows the sprite */
  private shadow: Phaser.GameObjects.Image | null = null;
  /** Idle bob phase — each enemy gets a random offset so they don't bob in lockstep */
  private bobPhase: number = 0;

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
    this.baseDisplayScale = 1;
    this.setScale(1);
    this.setFlipX(false);
    this.setRotation(0); // dive enemies set rotation; clear for pool reuse
    this.clearTint();

    // Ground shadow — boss uses the bigger shadow texture. Depth -1 sits
    // above the terrain (-10 to -5) but below entities (default 0).
    const shadowKey = config.texture.startsWith('boss') ? 'boss_shadow' : 'entity_shadow';
    if (!this.shadow) {
      this.shadow = this.scene.add.image(x, y, shadowKey).setDepth(-2);
    } else {
      this.shadow.setTexture(shadowKey);
    }
    this.shadow.setVisible(true).setActive(true).setPosition(x, y).setAlpha(1);
    // Hazards don't need a shadow (they're static props)
    if (config.behavior === 'hazard') this.shadow.setVisible(false);

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

    // Size hitbox based on texture. Bigger sprites (BootScene v2) bumped most
    // canvases by ~1.5×, so radii here bump proportionally. Offset math uses
    // this.width/this.height so it tracks whichever texture is assigned.
    const r = config.texture.startsWith('boss') ? 32
      : config.key === 'highland_cow' ? 26
      : config.key === 'terrier' ? 12
      : config.key === 'sheep' ? 13
      : config.key === 'eagle' ? 16
      : config.key === 'deep_fryer' ? 20
      : config.key === 'nest' ? 16
      : config.key === 'ghost' ? 16
      : 20; // default — tourist/chef/hunter/scotsman/piper
    body.setCircle(r, this.width / 2 - r, this.height / 2 - r);

    this.enemyKey = config.key;
    this.speed = config.speed;
    this.baseSpeed = config.speed;
    this.damage = config.damage;
    this.xpValue = config.xpValue;
    this.behavior = config.behavior;
    this.bossFlag = false;
    this.eliteFlag = false;
    this.baseTint = 0;
    this.diveStarted = false;
    this.rangedCooldown = 0;
    this.enraged = false;
    this.phase2Done = false;
    this.orbitAngle = Math.random() * Math.PI * 2;
    this.burnDamage = 0; this.burnTimer = 0; this.burnTickAccum = 0;
    this.freezeTimer = 0; this.freezeSpeedMul = 1;
    this.berserkerSpeedMul = 1;
    this.buffSpeedMul = 1;
    this.buffSpeedTimer = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
    this.knockbackTimer = 0;
    this.poisonDamage = 0; this.poisonTimer = 0; this.poisonTickAccum = 0;
    this.woolArmor = config.key === 'sheep' ? 1 : 0;
    // Reset spawner cooldown: nests fire a first terrier quickly (500ms)
    // so they matter even if killed soon after spawn, then 4s cycles after
    this.spawnerCooldown = config.behavior === 'spawner' ? 500 : 4000;
    // Reset Ghost phase state — if a Ghost died mid-phase, the next
    // recycled enemy would inherit invisibility + projectile-immunity
    this.phaseTimer = 2000;
    this.isPhased = false;
    body.checkCollision.none = false;

    // Reset bouncing-projectile hit tracking ID so recycled pool objects
    // aren't confused with their prior incarnation
    (this as any).__bouncingHitId = Math.random();

    // Random idle-bob phase so a pack of enemies doesn't visually pulse in sync
    this.bobPhase = Math.random() * Math.PI * 2;

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
      this.baseDisplayScale = 1.5;
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
      this.hpBarFill!.setFillStyle(0xcc3333); // Reset to red (may have been gold from prior elite cycle)
      this.hpBarFill!.width = 24;
    } else {
      this.hpBarBg?.setVisible(false);
      this.hpBarFill?.setVisible(false);
    }
  }

  /** Update movement toward the player. Called by SpawnSystem each frame. */
  chaseTarget(targetX: number, targetY: number, delta: number = 16): void {
    if (!this.active) return;

    // Tick status effects (burn/freeze/poison)
    this.tickStatusEffects(delta);
    if (!this.active) return; // May have died from DoT

    // Update HP bar position
    if (this.showHpBar && this.hpBarBg && this.hpBarFill) {
      this.hpBarBg.setPosition(this.x, this.y - 20);
      this.hpBarFill.setPosition(this.x - 12, this.y - 20);
      this.hpBarFill.width = 24 * (this.hp / this.maxHp);
    }

    // Ground shadow follows the sprite (shadow stays flat — doesn't bob).
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y + this.height * this.scaleY * 0.35);
    }

    // Idle breathing — subtle scaleY wobble anchored to baseDisplayScale
    // (tracks elite 1.3×, boss 2.0-3.0×, enraged hazard 1.5×). Hazards and
    // spawners stay static; everything else breathes, bosses included.
    if (this.behavior !== 'hazard' && this.behavior !== 'spawner') {
      this.bobPhase += 0.08;
      const wobble = Math.sin(this.bobPhase) * 0.04;
      const base = this.baseDisplayScale;
      this.setScale(base, base * (1 + wobble));
    }

    // Face direction of travel via horizontal flip. Skips:
    //  - bosses (asymmetric art would teleport weapons between sides)
    //  - hazards (static)
    //  - dive enemies (the crow/eagle uses full rotation in behaviorDive
    //    instead, so the sprite points along its flight path; flipping
    //    would fight the rotation)
    if (!this.bossFlag && this.behavior !== 'hazard' && this.behavior !== 'dive') {
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (Math.abs(body.velocity.x) > 10) {
        this.setFlipX(body.velocity.x < 0);
      }
    }

    // Knockback impulse takes priority over behavior velocity for the
    // duration, then decays out. Without this, behaviorChase's setVelocity
    // next frame would completely overwrite any `body.velocity +=` nudge
    // the weapons try to apply — knockback would be invisible.
    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= delta;
      const k = Math.max(0, this.knockbackTimer / 150);
      this.setVelocity(this.knockbackVx * k, this.knockbackVy * k);
      if (this.knockbackTimer <= 0) {
        this.knockbackVx = 0;
        this.knockbackVy = 0;
      }
      // Tick behavior-specific state-machine timers that would otherwise
      // freeze while behavior is skipped. Without this, a ghost hit by
      // repeated AoE knockback would stay phased indefinitely, and a
      // ranged enemy's firing cooldown would drift.
      if (this.behavior === 'phase') {
        this.phaseTimer -= delta;
        if (this.phaseTimer <= 0) {
          this.phaseTimer = 2000;
          this.isPhased = !this.isPhased;
          this.setAlpha(this.isPhased ? 0.3 : 1);
          const body = this.body as Phaser.Physics.Arcade.Body;
          body.checkCollision.none = this.isPhased;
        }
      } else if (this.behavior === 'ranged') {
        this.rangedCooldown -= delta;
      } else if (this.behavior === 'spawner') {
        this.spawnerCooldown -= delta;
      }
      return; // skip behavior — the push is what the enemy is doing this frame
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
      case 'orbit':
        this.behaviorOrbit(targetX, targetY, delta);
        break;
      case 'flee':
        this.behaviorFlee(targetX, targetY);
        break;
      case 'spawner':
        this.behaviorSpawner(delta);
        break;
      case 'phase':
        this.behaviorPhase(targetX, targetY, delta);
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
    // Rotate the sprite to point along the dive direction. The crow sprite
    // is drawn facing +X at rotation 0, so setRotation(diveAngle) lines its
    // head up with the direction of flight. Without this the crow would
    // look sideways when diving vertically.
    this.setRotation(this.diveAngle);

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
    const spawnedPlayer = (this.scene as any).getPlayer?.();
    if (!spawnedPlayer) { net.destroy(); return; }

    const cleanup = () => {
      if (hit) return;
      hit = true;
      try {
        this.scene.physics.world.removeCollider(overlapRef);
        if (net.active) net.destroy();
      } catch { /* scene may have restarted */ }
    };

    const overlapRef = this.scene.physics.add.overlap(net, spawnedPlayer, () => {
      if (hit) return;
      cleanup();

      // Guard: only apply slow if this is still the same player (not a new run)
      const currentPlayer = (this.scene as any).getPlayer?.();
      if (currentPlayer !== spawnedPlayer) return;

      spawnedPlayer.applyNetSlow();
      // Use real setTimeout — delayedCall respects timeScale, so slow-motion
      // after a boss kill would stretch the 2s slow to ~7s of real time
      const capturedPlayer = spawnedPlayer;
      setTimeout(() => {
        try {
          const stillSamePlayer = (this.scene as any).getPlayer?.();
          if (stillSamePlayer === capturedPlayer) {
            capturedPlayer.removeNetSlow();
          }
        } catch { /* scene may have been destroyed */ }
      }, 2000);
    });

    // Auto-cleanup after 2 seconds if it misses
    this.scene.time.delayedCall(2000, cleanup);
  }

  private behaviorOrbit(tx: number, ty: number, delta: number): void {
    // Circle the player at ORBIT_RADIUS distance
    this.orbitAngle += (this.speed / this.ORBIT_RADIUS) * (delta / 1000);
    const targetX = tx + Math.cos(this.orbitAngle) * this.ORBIT_RADIUS;
    const targetY = ty + Math.sin(this.orbitAngle) * this.ORBIT_RADIUS;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    const moveSpeed = Math.min(this.speed, dist * 2); // slow as approach target
    this.setVelocity(Math.cos(angle) * moveSpeed, Math.sin(angle) * moveSpeed);

    // Pipers buff nearby enemies — 30% faster for 500ms, composed through
    // recomputeSpeed() via the buffSpeedMul field. Previously used a one-frame
    // body.velocity multiplication that behaviorChase promptly overwrote, so
    // the buff was visually absent most frames; now it's a real speed stat
    // change that persists and re-applies naturally every frame from spawn
    // behavior's setVelocity(... * this.speed).
    const enemies = (this.scene as any).getSpawnSystem?.()?.getEnemyGroup?.()?.getChildren?.();
    if (enemies) {
      for (const e of enemies) {
        if (!e.active || e === this || (e as Enemy).isBoss()) continue;
        const d = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
        if (d < 120) {
          (e as Enemy).applySpeedBuff(1.3, 500);
        }
      }
    }
  }

  private behaviorPhase(tx: number, ty: number, delta: number): void {
    // Chase the player
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);

    // Toggle phased state every 2 seconds
    this.phaseTimer -= delta;
    if (this.phaseTimer <= 0) {
      this.phaseTimer = 2000;
      this.isPhased = !this.isPhased;
      this.setAlpha(this.isPhased ? 0.3 : 1);
      // When phased, disable physics body so projectiles pass through
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (this.isPhased) {
        body.checkCollision.none = true;
      } else {
        body.checkCollision.none = false;
      }
    }
  }

  private behaviorSpawner(delta: number): void {
    // Stationary — summon a terrier on spawnerCooldown interval
    this.setVelocity(0, 0);
    this.spawnerCooldown -= delta;
    if (this.spawnerCooldown <= 0) {
      this.spawnerCooldown = 4000;
      const spawnSystem = (this.scene as any).getSpawnSystem?.();
      if (!spawnSystem) return;
      const pool = spawnSystem.getEnemyGroup();
      let minion = pool.getFirstDead(false) as Enemy | null;
      if (!minion) {
        if (pool.countActive(true) >= ENEMIES.MAX_ACTIVE) return;
        minion = new Enemy(this.scene, 0, 0);
        pool.add(minion);
      }
      const angle = Math.random() * Math.PI * 2;
      const dist = 20;
      const terrier = { key: 'terrier', texture: 'terrier', speed: 130, hp: 2, damage: 3, xpValue: 1, appearsAt: 0, behavior: 'swarm' as EnemyBehavior, packSize: 1 };
      // Pass current game time so spawned terriers inherit HP/damage scaling
      const gameTime = spawnSystem.getGameTimeSec?.() ?? 0;
      minion.spawn(this.x + Math.cos(angle) * dist, this.y + Math.sin(angle) * dist, terrier, gameTime);
    }
  }

  private behaviorFlee(tx: number, ty: number): void {
    // Run away from the player
    const angle = Phaser.Math.Angle.Between(tx, ty, this.x, this.y);
    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
  }

  /** Recompute this.speed from baseSpeed × all active multipliers.
   *  Call whenever any contributing factor changes (freeze, berserker HP-scaling, enrage, piper buff).
   *  Enrage is baked into baseSpeed directly because it's permanent. */
  private recomputeSpeed(): void {
    this.speed = Math.ceil(
      this.baseSpeed * this.berserkerSpeedMul * this.freezeSpeedMul * this.buffSpeedMul
    );
  }

  // ── Status Effects ──

  /** Apply burn: damage over time for duration */
  applyBurn(dps: number, durationMs: number): void {
    if (this.behavior === 'hazard') return;
    this.burnDamage = Math.max(this.burnDamage, dps); // Refresh, don't stack
    this.burnTimer = Math.max(this.burnTimer, durationMs);
  }

  /** Apply freeze: slow movement for duration */
  applyFreeze(speedMul: number, durationMs: number): void {
    if (this.behavior === 'hazard') return;
    this.freezeSpeedMul = Math.min(this.freezeSpeedMul, speedMul);
    this.freezeTimer = Math.max(this.freezeTimer, durationMs);
    this.recomputeSpeed();
  }

  /** Temporary speed buff (e.g. Piper aura). Composes through recomputeSpeed
   *  so it's bounded by its multiplier — no compound runaway. */
  applySpeedBuff(mul: number, durationMs: number): void {
    if (this.behavior === 'hazard') return;
    this.buffSpeedMul = Math.max(this.buffSpeedMul, mul); // strongest wins
    this.buffSpeedTimer = Math.max(this.buffSpeedTimer, durationMs);
    this.recomputeSpeed();
  }

  /** Apply a knockback impulse that persists for durationMs, decaying linearly.
   *  Unlike `body.velocity +=` (which behaviorChase wipes next frame), this
   *  takes priority over behavior velocity for the duration, so knockback is
   *  actually visible. */
  applyKnockback(vx: number, vy: number, durationMs: number = 150): void {
    if (this.behavior === 'hazard') return;
    this.knockbackVx = vx;
    this.knockbackVy = vy;
    this.knockbackTimer = durationMs;
    // Dive enemies lock their angle on the first behaviorDive tick; if one
    // is mid-flight when knockback hits, the lock is now stale because the
    // push moved us sideways. Reset so the next behaviorDive tick re-locks
    // toward the current player position.
    if (this.behavior === 'dive') this.diveStarted = false;
  }

  /** Apply poison: stacking damage over time */
  applyPoison(dps: number, durationMs: number): void {
    if (this.behavior === 'hazard') return;
    this.poisonDamage += dps; // Stacks!
    this.poisonTimer = Math.max(this.poisonTimer, durationMs);

    // Synergy: Burn + Poison = Chemical Explosion (50 damage + 25 AoE)
    if (this.burnTimer > 0 && this.poisonTimer > 0) {
      this.burnTimer = 0; this.poisonTimer = 0;
      this.burnDamage = 0; this.poisonDamage = 0;
      // Capture scene ref before takeDamageInternal (which may call die() and clear state)
      const scene = this.scene;
      const ex = this.x, ey = this.y;
      this.takeDamageInternal(50);
      // Visual explosion
      if (scene && scene.sys.isActive()) {
        const blast = scene.add.circle(ex, ey, 10, 0xff8800, 0.6);
        scene.tweens.add({
          targets: blast, radius: 60, alpha: 0, duration: 300,
          onComplete: () => blast.destroy(),
        });
        // Damage nearby enemies. Use takeDamage() (not the internal path)
        // so wool armor still blocks the splash — sheep caught in a
        // chemical explosion shouldn't lose their one-hit shield.
        const pool = (scene as any).getSpawnSystem?.()?.getEnemyGroup?.();
        if (pool) {
          const nearby = pool.getChildren() as Enemy[];
          for (const e of nearby) {
            if (!e.active || e === this) continue;
            const d = Phaser.Math.Distance.Between(ex, ey, e.x, e.y);
            if (d <= 60) (e as Enemy).takeDamage(25);
          }
        }
      }
    }
  }

  /** Public wrapper for status-effect AoE damage — ensures kill events fire */
  takeDamageInternalPublic(amount: number): boolean {
    return this.takeDamageInternal(amount);
  }

  /** Tick status effects — call each frame from chaseTarget */
  private tickStatusEffects(delta: number): void {
    // Burn: periodic damage + orange tint
    if (this.burnTimer > 0) {
      this.burnTimer -= delta;
      this.burnTickAccum += delta;
      if (this.burnTickAccum >= 500) { // tick every 500ms
        this.burnTickAccum -= 500;
        const killed = this.takeDamageInternal(Math.ceil(this.burnDamage * 0.5));
        // Fire particle
        if (this.active) {
          const spark = this.scene.add.circle(
            this.x + Phaser.Math.Between(-8, 8),
            this.y + Phaser.Math.Between(-8, 8),
            2, 0xff6600, 0.8
          );
          this.scene.tweens.add({
            targets: spark, y: spark.y - 10, alpha: 0, duration: 300,
            onComplete: () => spark.destroy(),
          });
        }
        if (killed) return;
      }
      if (this.burnTimer <= 0) { this.burnDamage = 0; this.burnTickAccum = 0; }
    }

    // Freeze: slow speed + blue tint (basic enemies) or snowflake particle (elites/bosses).
    // Does not write this.speed directly — recomputeSpeed() composes all
    // active multipliers (baseSpeed × berserkerSpeedMul × freezeSpeedMul).
    if (this.freezeTimer > 0) {
      this.freezeTimer -= delta;
      this.recomputeSpeed();
      // baseTint is set for bosses/hazards/elites — don't clobber their persistent tints,
      // instead spawn a snowflake particle so the player still sees the freeze effect
      if (!this.baseTint) {
        this.setTint(0x6688ff);
      } else if (this.active && Math.random() < 0.08) {
        const flake = this.scene.add.text(
          this.x + Phaser.Math.Between(-10, 10), this.y - 12,
          '❄', { fontSize: '14px', color: '#88ccff' }
        ).setDepth(15).setOrigin(0.5);
        this.scene.tweens.add({
          targets: flake, y: flake.y - 12, alpha: 0, duration: 500,
          onComplete: () => flake.destroy(),
        });
      }
      if (this.freezeTimer <= 0) {
        this.freezeSpeedMul = 1;
        this.recomputeSpeed();
        if (!this.baseTint) this.clearTint();
        if (this.baseTint) this.setTint(this.baseTint);
      }
    }

    // Poison: stacking DoT + green tint
    if (this.poisonTimer > 0) {
      this.poisonTimer -= delta;
      this.poisonTickAccum += delta;
      if (this.poisonTickAccum >= 400) { // tick every 400ms
        this.poisonTickAccum -= 400;
        const killed = this.takeDamageInternal(Math.ceil(this.poisonDamage * 0.4));
        // Poison bubble
        if (this.active) {
          const bubble = this.scene.add.circle(
            this.x + Phaser.Math.Between(-6, 6), this.y - 5,
            Phaser.Math.Between(1, 3), 0x44cc44, 0.7
          );
          this.scene.tweens.add({
            targets: bubble, y: bubble.y - 8, alpha: 0, scale: 0, duration: 400,
            onComplete: () => bubble.destroy(),
          });
        }
        if (killed) return;
      }
      if (this.poisonTimer <= 0) { this.poisonDamage = 0; this.poisonTickAccum = 0; }
    }

    // Speed buff (Piper aura etc.) — decay to 1.0 when timer expires
    if (this.buffSpeedTimer > 0) {
      this.buffSpeedTimer -= delta;
      if (this.buffSpeedTimer <= 0) {
        this.buffSpeedMul = 1;
        this.recomputeSpeed();
      }
    }
  }

  /** Force-kill this enemy bypassing wool armor / invincibility.
   *  Used by banish-style effects. Returns true if killed. */
  forceKill(): boolean {
    if (this.behavior === 'hazard') return false;
    this.hp = 0;
    this.woolArmor = 0;
    this.die();
    return true;
  }

  /** Internal damage that triggers kill events via the scene's WeaponSystem
   *  (ensures DoT kills give XP and count toward kill totals) */
  private takeDamageInternal(amount: number): boolean {
    if (this.behavior === 'hazard') return false;
    this.hp -= amount;
    if (this.hp <= 0) {
      const wasBoss = this.bossFlag;
      const wasElite = this.eliteFlag;
      const killX = this.x, killY = this.y;
      const xp = this.xpValue, key = this.enemyKey;
      this.die();
      // Emit kill event through the scene's WeaponSystem so XP gems drop
      const ws = (this.scene as any).getWeaponSystem?.();
      ws?.events?.emit('enemyKilled', killX, killY, xp, key, wasBoss, wasElite);
      return true;
    }
    return false;
  }

  takeDamage(amount: number): boolean {
    if (this.behavior === 'hazard') return false; // invincible

    // Ghost: 50% damage resistance while phased (in addition to projectile pass-through)
    if (this.behavior === 'phase' && this.isPhased) {
      amount = Math.ceil(amount * 0.5);
    }

    // Wool armor absorbs one hit
    if (this.woolArmor > 0) {
      this.woolArmor--;
      this.setTintFill(0xffffff);
      this.scene.time.delayedCall(80, () => {
        if (!this.active) return;
        this.clearTint();
        if (this.baseTint) this.setTint(this.baseTint);
      });
      return false;
    }

    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
      return true;
    }

    // Berserker: speed increases as HP drops (up to 2x at 1 HP).
    // Writes to the multiplier (not this.speed) so it composes with freeze.
    if (this.enemyKey === 'berserker') {
      const hpFrac = this.hp / this.maxHp;
      this.berserkerSpeedMul = 1 + (1 - hpFrac);
      this.recomputeSpeed();
    }

    // Boss phase 2 at 25% HP — summon 3 minions
    if (this.bossFlag && !this.phase2Done && this.hp <= this.maxHp * 0.25) {
      this.phase2Done = true;
      const spawnSystem = (this.scene as any).getSpawnSystem?.();
      if (spawnSystem) {
        const pool = spawnSystem.getEnemyGroup();
        for (let i = 0; i < 3; i++) {
          let minion = pool.getFirstDead(false) as Enemy | null;
          if (!minion) {
            if (pool.countActive(true) >= ENEMIES.MAX_ACTIVE) break;
            minion = new Enemy(this.scene, 0, 0);
            pool.add(minion);
          }
          const a = (i / 3) * Math.PI * 2;
          const chef = { key: 'chef', texture: 'chef', speed: 100, hp: 8, damage: 8, xpValue: 3, appearsAt: 0, behavior: 'chase' as EnemyBehavior, packSize: 1 };
          // Use current game time so late-game phase-2 minions scale with the run
          const gameTime = spawnSystem.getGameTimeSec?.() ?? 0;
          minion.spawn(this.x + Math.cos(a) * 30, this.y + Math.sin(a) * 30, chef, gameTime);
          minion.markAsElite();
        }
      }
      // Visual indicator
      this.scene.cameras.main.shake(150, 0.008);
    }

    // Boss enrage at 50% HP — speed +50%, tint changes to bright red.
    // Bake into baseSpeed so freeze/berserker multipliers still apply on top.
    if (this.bossFlag && !this.enraged && this.hp <= this.maxHp * 0.5) {
      this.enraged = true;
      this.baseSpeed = Math.ceil(this.baseSpeed * 1.5);
      this.recomputeSpeed();
      this.damage = Math.ceil(this.damage * 1.25);
      this.baseTint = 0xff2200;
      this.setTint(0xff2200);
      this.scene.cameras.main.shake(200, 0.01);
    }

    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (!this.active) return;
      // Restore persistent tint (e.g. boss red, elite gold) instead of clearing all tints
      this.clearTint();
      if (this.baseTint) this.setTint(this.baseTint);
    });

    // Impact ring burst is spawned from the GameScene damageDealt listener
    // via the shared JuiceSystem pool — keeps per-hit GameObject allocation
    // out of the hot path (was 600+ rings/sec on piercing weapons).

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
    this.shadow?.setVisible(false);
  }

  destroy(fromScene?: boolean): void {
    this.hpBarBg?.destroy();
    this.hpBarFill?.destroy();
    this.shadow?.destroy();
    this.hpBarBg = null;
    this.hpBarFill = null;
    this.shadow = null;
    super.destroy(fromScene);
  }

  getDamage(): number { return this.damage; }
  getXpValue(): number { return this.xpValue; }
  getEnemyKey(): string { return this.enemyKey; }
  getBehavior(): EnemyBehavior { return this.behavior; }
  getHpFraction(): number { return this.maxHp > 0 ? this.hp / this.maxHp : 0; }
  getHp(): number { return this.hp; }
  getMaxHp(): number { return this.maxHp; }
  isBoss(): boolean { return this.bossFlag; }
  /** Public getter for base speed — used by Piper buff to clamp the compound buff. */
  getBaseSpeed(): number { return this.baseSpeed; }
  /** Set the anchor scale used by the idle bob. Used by SpawnSystem to size
   *  bosses correctly (2.0-3.0× from BossConfig). Applies the scale immediately. */
  setBaseDisplayScale(scale: number): void {
    this.baseDisplayScale = scale;
    this.setScale(scale);
  }
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

  /** Make this enemy an elite variant — bigger, tougher, more rewarding.
   *  Idempotent: subsequent calls on an already-elite enemy are no-ops,
   *  preventing HP/scale from compounding if the same enemy is elite-marked
   *  twice through different code paths. */
  markAsElite(): void {
    if (this.eliteFlag) return;
    this.eliteFlag = true;
    this.maxHp = Math.ceil(this.maxHp * 2);
    this.hp = this.maxHp;
    // Bake speed bonus into baseSpeed so freeze/berserker multipliers
    // compose on top via recomputeSpeed() — writing this.speed directly
    // would be wiped by the first status-effect recompute.
    this.baseSpeed = Math.ceil(this.baseSpeed * 1.3);
    this.recomputeSpeed();
    this.xpValue = this.xpValue * 3;
    // Bump the anchor scale so the idle bob wobbles around 1.3× instead of 1×
    this.baseDisplayScale = this.baseDisplayScale * 1.3;
    this.setScale(this.baseDisplayScale);
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
