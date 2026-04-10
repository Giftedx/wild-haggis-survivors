import Phaser from 'phaser';
import { Projectile } from '../entities/Projectile';
import { Enemy } from '../entities/Enemy';
import { WEAPON_DEFS, WeaponDef } from '../data/weapons';
import { audio } from './AudioSystem';

/** Runtime state for an equipped weapon */
export interface ActiveWeapon {
  config: WeaponDef;
  level: number;
  cooldownRemaining: number;
  damage: number;
  cooldownMs: number;
  projectileCount: number;
  pierce: number;
  aoeRadius: number;
  /** Set when weapon is evolved — changes behavior in fireWeapon */
  evolved: boolean;
  evolutionKey: string;
}

/**
 * WeaponSystem — manages all 6 weapon types with different behaviors.
 *
 * Projectile weapons (thistle_shot, caber_toss, haggis_hurler) use pooled sprites.
 * Area weapons (bagpipe_blast, scotch_mist, nessie_tentacle) directly query enemies.
 */
export class WeaponSystem {
  private scene: Phaser.Scene;
  private weapons: ActiveWeapon[] = [];
  private projectilePool: Phaser.GameObjects.Group;
  private enemyGroup: Phaser.GameObjects.Group;

  /** Last known player facing angle (radians) — used for directional weapons */
  private playerFacing: number = 0;

  /** Trail frame counter — spawn trail particles every N frames */
  private trailCounter: number = 0;

  /** Multipliers from player upgrades — set each frame by GameScene */
  private damageMultiplier: number = 1;
  private aoeMultiplier: number = 1;
  private attackSpeedMultiplier: number = 1;
  private critChance: number = 0.10;
  private critDamageMultiplier: number = 2.0;
  private cooldownReduction: number = 0;

  /** Emits 'enemyKilled' (x, y, xpValue, key, wasBoss, wasElite) and 'damageDealt' (x, y, amount, isCrit) */
  readonly events = new Phaser.Events.EventEmitter();

  /** Set true when GameScene shuts down — stops stale callbacks from touching freed state. */
  private destroyed: boolean = false;
  destroy(): void { this.destroyed = true; }

  constructor(scene: Phaser.Scene, enemyGroup: Phaser.GameObjects.Group) {
    this.scene = scene;
    this.enemyGroup = enemyGroup;

    // Projectile pool (shared across all projectile-based weapons)
    this.projectilePool = scene.add.group({
      classType: Projectile,
      maxSize: 200,
      runChildUpdate: false,
    });
    for (let i = 0; i < 30; i++) {
      this.projectilePool.add(new Projectile(scene));
    }

    // Start with Thistle Shot
    this.addWeapon('thistle_shot');

    // Projectile ↔ enemy collision
    scene.physics.add.overlap(
      this.projectilePool,
      enemyGroup,
      this.onProjectileHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
  }

  addWeapon(key: string): boolean {
    if (this.hasWeapon(key)) return false;
    const def = WEAPON_DEFS[key];
    if (!def) return false;

    this.weapons.push({
      config: def,
      level: 1,
      cooldownRemaining: 0,
      damage: def.damage,
      cooldownMs: def.cooldownMs,
      projectileCount: def.projectileCount,
      pierce: def.pierce,
      aoeRadius: def.aoeRadius,
      evolved: false,
      evolutionKey: '',
    });
    return true;
  }

  levelUpWeapon(key: string): boolean {
    const w = this.weapons.find(w => w.config.key === key);
    if (!w || w.level >= 5) return false;

    w.level++;
    const s = w.config.levelScaling;

    w.damage = Math.ceil(w.config.damage * Math.pow(s.damage, w.level - 1));
    w.cooldownMs = Math.max(200, w.config.cooldownMs * Math.pow(s.cooldown, w.level - 1));
    w.pierce = w.config.pierce + s.pierce * (w.level - 1);
    w.aoeRadius = w.config.aoeRadius * Math.pow(s.radius, w.level - 1);

    if (s.countAt.includes(w.level)) {
      w.projectileCount++;
    }

    return true;
  }

  /** Evolve a weapon — massively upgrades its behavior */
  evolveWeapon(weaponKey: string, evolutionKey: string): boolean {
    const w = this.weapons.find(w => w.config.key === weaponKey);
    if (!w || w.evolved) return false;

    w.evolved = true;
    w.evolutionKey = evolutionKey;

    // Evolved weapons get significant but not game-breaking stat boosts.
    // Previously 2.5x damage allowed Thistle Storm to one-shot the Taxman.
    // 1.8x keeps evolutions strong while preserving late-game challenge.
    w.damage = Math.ceil(w.damage * 1.8);
    w.cooldownMs = Math.max(150, w.cooldownMs * 0.5);
    w.projectileCount = Math.max(w.projectileCount, 3);
    w.aoeRadius = w.aoeRadius * 2;
    w.pierce = Math.max(w.pierce, 5);

    return true;
  }

  /** Update player facing from external source (called by GameScene) */
  setPlayerFacing(angle: number): void {
    this.playerFacing = angle;
  }

  /** Update multipliers from player stats (called by GameScene each frame) */
  setMultipliers(damage: number, aoe: number, attackSpeed: number, critChance: number = 0.10, cooldownReduction: number = 0, critDmgMul: number = 2.0): void {
    this.damageMultiplier = damage;
    this.aoeMultiplier = aoe;
    this.attackSpeedMultiplier = attackSpeed;
    this.critChance = critChance;
    this.cooldownReduction = cooldownReduction;
    this.critDamageMultiplier = critDmgMul;
  }

  update(delta: number, playerX: number, playerY: number): void {

    // Update active projectiles + spawn trail particles
    this.trailCounter++;
    const spawnTrail = this.trailCounter % 3 === 0;
    const projectiles = this.projectilePool.getChildren() as Projectile[];
    for (const proj of projectiles) {
      if (proj.active) {
        proj.update(delta);
        if (spawnTrail) {
          this.events.emit('projectileTrail', proj.x, proj.y);
        }
      }
    }

    // Tick each weapon. The reset formula below already bakes in
    // attackSpeedMultiplier and cooldownReduction, so the decrement itself
    // is plain delta — multiplying it by attackSpeedMultiplier would
    // compound and make fire rate quadratic in the stat (20% attack speed
    // was actually giving ~44% faster fire).
    for (const weapon of this.weapons) {
      weapon.cooldownRemaining -= delta;
      if (weapon.cooldownRemaining <= 0) {
        // Scale the cooldown reset by attackSpeedMultiplier and cooldownReduction.
        // Enforce an absolute 50ms minimum so extreme stacking can't produce
        // a per-frame fire rate that crashes the projectile pool.
        const effectiveCooldown = Math.max(
          50,
          (weapon.cooldownMs * (1 - this.cooldownReduction)) / this.attackSpeedMultiplier
        );
        weapon.cooldownRemaining = Math.max(weapon.cooldownRemaining, -effectiveCooldown)
          + effectiveCooldown;
        this.fireWeapon(weapon, playerX, playerY);
        // Only play shoot sound for projectile-type weapons — AoE/trail/sweep have wrong sound
        const b = weapon.config.behavior;
        if (b === 'projectile' || b === 'piercing' || b === 'bouncing') {
          audio.playShoot();
        }
      }
    }
  }

  // ── Fire dispatch ──

  /** Compute effective damage with global multiplier + crit roll */
  private effectiveDamage(w: ActiveWeapon): { damage: number; isCrit: boolean } {
    const baseDmg = Math.ceil(w.damage * this.damageMultiplier);
    const isCrit = Math.random() < this.critChance;
    return { damage: isCrit ? Math.ceil(baseDmg * this.critDamageMultiplier) : baseDmg, isCrit };
  }

  /** Compute effective AoE radius with global multiplier */
  private effectiveAoe(w: ActiveWeapon): number {
    return w.aoeRadius * this.aoeMultiplier;
  }

  private fireWeapon(w: ActiveWeapon, px: number, py: number): void {
    // Evolved weapons use dramatically different behavior
    if (w.evolved) {
      this.fireEvolved(w, px, py);
      return;
    }

    switch (w.config.behavior) {
      case 'projectile':
        this.fireProjectile(w, px, py, 'thistle');
        break;
      case 'piercing':
        this.fireProjectile(w, px, py, 'caber');
        break;
      case 'bouncing':
        this.fireBouncing(w, px, py);
        break;
      case 'aoe_pulse':
        this.fireAoePulse(w, px, py);
        break;
      case 'trail':
        this.fireTrail(w, px, py);
        break;
      case 'arc_sweep':
        this.fireArcSweep(w, px, py);
        break;
    }
  }

  // ── Projectile-based weapons (Thistle Shot, Caber Toss) ──

  private fireProjectile(w: ActiveWeapon, px: number, py: number, texture: string): void {
    const target = this.findClosestEnemy(px, py, w.config.range);
    if (!target) return;

    const count = w.projectileCount;
    const spread = count > 1 ? 15 : 0;

    for (let i = 0; i < count; i++) {
      const proj = this.getProjectile(texture);
      if (!proj) continue;

      let tx = target.x, ty = target.y;
      if (count > 1) {
        const base = Phaser.Math.Angle.Between(px, py, target.x, target.y);
        const offset = Phaser.Math.DegToRad((i - (count - 1) / 2) * spread);
        tx = px + Math.cos(base + offset) * 500;
        ty = py + Math.sin(base + offset) * 500;
      }

      const { damage, isCrit } = this.effectiveDamage(w);
      proj.fire(px, py, tx, ty, w.config.projectileSpeed, damage, w.pierce, w.config.range, isCrit);
      proj.setWeaponKey(w.config.key);
    }
  }

  // ── Bouncing weapon (Haggis Hurler) ──

  private fireBouncing(w: ActiveWeapon, px: number, py: number): void {
    const count = w.projectileCount;

    for (let i = 0; i < count; i++) {
      const proj = this.getProjectile('haggis_ball');
      if (!proj) continue;

      // Fire in a random direction
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const tx = px + Math.cos(angle) * 500;
      const ty = py + Math.sin(angle) * 500;

      const { damage, isCrit } = this.effectiveDamage(w);
      proj.fire(px, py, tx, ty, w.config.projectileSpeed, damage, 0, w.config.range, isCrit);
      proj.setBouncing();
    }
  }

  // ── AoE Pulse (Bagpipe Blast) — damages all enemies in radius ──

  private fireAoePulse(w: ActiveWeapon, px: number, py: number): void {
    const radius = this.effectiveAoe(w);
    const { damage: dmg, isCrit } = this.effectiveDamage(w);

    // Visual pulse ring
    const ring = this.scene.add.circle(px, py, 10, 0x4488ff, 0.4);
    this.scene.tweens.add({
      targets: ring,
      radius: radius,
      alpha: 0,
      duration: 300,
      onComplete: () => ring.destroy(),
    });

    // Damage + knockback all enemies in radius
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
      if (dist <= radius) {
        this.dealDamageToEnemy(enemy, dmg, isCrit);

        // Bagpipe Blast applies brief freeze (slow 50% for 1s)
        enemy.applyFreeze(0.5, 1000);

        // Knockback — uses the impulse system so behaviorChase doesn't wipe it.
        // Divided by mass so tanks resist being pushed.
        if (enemy.active && w.config.knockback > 0) {
          const angle = Phaser.Math.Angle.Between(px, py, enemy.x, enemy.y);
          const body = enemy.body as Phaser.Physics.Arcade.Body;
          const kb = w.config.knockback / body.mass;
          enemy.applyKnockback(Math.cos(angle) * kb, Math.sin(angle) * kb, 150);
        }
      }
    }
  }

  // ── Trail (Scotch Mist) — drops a damage zone at the player's position ──

  private fireTrail(w: ActiveWeapon, px: number, py: number): void {
    const radius = this.effectiveAoe(w);
    const { damage: dmg } = this.effectiveDamage(w);

    // Create a fading mist zone
    const zone = this.scene.add.circle(px, py, radius, 0x88aacc, 0.3);
    const duration = 2000;

    // Damage enemies within the zone over its lifetime
    // Guard: skip damage tick if physics is paused (level-up screen)
    const damageTimer = this.scene.time.addEvent({
      delay: 400,
      repeat: Math.floor(duration / 400) - 1,
      callback: () => {
        if (!this.scene.physics.world.isPaused) {
          const enemies = this.enemyGroup.getChildren() as Enemy[];
          for (const enemy of enemies) {
            if (!enemy.active) continue;
            const dist = Phaser.Math.Distance.Between(zone.x, zone.y, enemy.x, enemy.y);
            if (dist <= radius) {
              this.dealDamageToEnemy(enemy, dmg);
              // Scotch Mist applies poison (stacking DoT)
              enemy.applyPoison(2, 3000);
            }
          }
        }
      },
    });

    // Fade out and destroy
    this.scene.tweens.add({
      targets: zone,
      alpha: 0,
      duration: duration,
      onComplete: () => {
        damageTimer.destroy();
        if (zone.active) zone.destroy();
      },
    });
  }

  // ── Arc Sweep (Nessie's Tentacle) — damages enemies in a frontal arc ──

  private fireArcSweep(w: ActiveWeapon, px: number, py: number): void {
    const radius = this.effectiveAoe(w);
    const { damage: dmg, isCrit } = this.effectiveDamage(w);
    const halfArc = Phaser.Math.DegToRad(w.config.arcDegrees / 2);

    // If stationary, aim at nearest enemy instead of stale facing angle
    let facing = this.playerFacing;
    const nearest = this.findClosestEnemy(px, py, radius * 1.5);
    if (nearest) {
      facing = Phaser.Math.Angle.Between(px, py, nearest.x, nearest.y);
    }

    // Visual sweep arc
    const gfx = this.scene.add.graphics();
    gfx.fillStyle(0x226644, 0.4);
    gfx.slice(
      px, py, radius,
      facing - halfArc,
      facing + halfArc,
      false
    );
    gfx.fillPath();

    this.scene.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 250,
      onComplete: () => gfx.destroy(),
    });

    // Damage enemies within the arc
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
      if (dist > radius) continue;

      // Check if enemy is within the arc angle
      const angleToEnemy = Phaser.Math.Angle.Between(px, py, enemy.x, enemy.y);
      let angleDiff = angleToEnemy - facing;
      // Normalize to [-PI, PI]
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      if (Math.abs(angleDiff) <= halfArc) {
        this.dealDamageToEnemy(enemy, dmg, isCrit);

        // Knockback via impulse system (persistent for 150ms, then behavior resumes).
        if (enemy.active && w.config.knockback > 0) {
          const kbAngle = Phaser.Math.Angle.Between(px, py, enemy.x, enemy.y);
          const body = enemy.body as Phaser.Physics.Arcade.Body;
          const kb = w.config.knockback / body.mass;
          enemy.applyKnockback(Math.cos(kbAngle) * kb, Math.sin(kbAngle) * kb, 150);
        }
      }
    }
  }

  /** Central damage handler — applies damage, emits events */
  // ── Evolved weapon behaviors ──

  private fireEvolved(w: ActiveWeapon, px: number, py: number): void {
    const { damage: dmg } = this.effectiveDamage(w);
    const radius = this.effectiveAoe(w);

    switch (w.evolutionKey) {
      case 'thistle_storm':
        this.fireHomingBurst(w, px, py, dmg, 8);
        break;
      case 'highland_fling':
        this.fireExpandingRing(px, py, dmg, radius * 3);
        break;
      case 'highland_games':
        this.fireExplodingProjectile(w, px, py, dmg);
        break;
      case 'the_haar':
        this.fireMassiveFog(px, py, dmg, radius * 3);
        break;
      case 'haggis_cannon':
        this.fireRapidBounce(w, px, py, dmg, 5);
        break;
      case 'nessie_unleashed':
        this.fireFullSweep(px, py, dmg, radius * 2);
        break;
      default:
        this.fireProjectile(w, px, py, 'thistle');
        break;
    }
  }

  /** Thistle Storm — 8 projectiles that each seek a different enemy */
  private fireHomingBurst(w: ActiveWeapon, px: number, py: number, dmg: number, count: number): void {
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    // Sort by distance so projectiles target the closest enemies, not pool order
    const targets = enemies
      .filter(e => e.active)
      .sort((a, b) =>
        Phaser.Math.Distance.Squared(px, py, a.x, a.y) -
        Phaser.Math.Distance.Squared(px, py, b.x, b.y)
      )
      .slice(0, count);

    for (let i = 0; i < count; i++) {
      const proj = this.getProjectile('thistle');
      if (!proj) continue;

      // Aim at a specific enemy, or random direction if not enough targets
      let tx: number, ty: number;
      if (i < targets.length) {
        tx = targets[i].x;
        ty = targets[i].y;
      } else {
        const angle = (i / count) * Math.PI * 2;
        tx = px + Math.cos(angle) * 400;
        ty = py + Math.sin(angle) * 400;
      }

      proj.fire(px, py, tx, ty, w.config.projectileSpeed * 1.3, dmg, 2, 800);
    }
  }

  /** Highland Fling — massive expanding damage ring */
  private fireExpandingRing(px: number, py: number, dmg: number, maxRadius: number): void {
    const ring = this.scene.add.circle(px, py, 20, 0x4488ff, 0.5);
    let currentRadius = 20;
    let prevRadius = 0;
    const hitEnemies = new Set<Enemy>();

    const expandTimer = this.scene.time.addEvent({
      delay: 50,
      repeat: 15,
      callback: () => {
        if (this.destroyed || !this.scene?.sys?.isActive()) { expandTimer.destroy(); return; }
        prevRadius = currentRadius;
        currentRadius += (maxRadius - 20) / 16;
        ring.setRadius(currentRadius);
        ring.setAlpha(Math.max(0, ring.alpha - 0.5 / 16));

        // Damage enemies in the newly swept annular band (each enemy hit once)
        if (!this.scene.physics.world.isPaused) {
          const enemies = this.enemyGroup.getChildren() as Enemy[];
          for (const enemy of enemies) {
            if (!enemy.active || hitEnemies.has(enemy)) continue;
            const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
            if (dist <= currentRadius) {
              hitEnemies.add(enemy);
              this.dealDamageToEnemy(enemy, dmg);
            }
          }
        }
      },
    });

    this.scene.time.delayedCall(850, () => {
      if (this.destroyed || !this.scene?.sys?.isActive()) return;
      expandTimer.destroy();
      if (ring.active) ring.destroy();
    });
  }

  /** Highland Games — piercing caber that explodes on final hit */
  private fireExplodingProjectile(w: ActiveWeapon, px: number, py: number, dmg: number): void {
    const target = this.findClosestEnemy(px, py, w.config.range);
    if (!target) return;

    const proj = this.getProjectile('caber');
    if (!proj) return;
    proj.fire(px, py, target.x, target.y, w.config.projectileSpeed, dmg, w.pierce, w.config.range);

    // Use the safe callback field instead of monkey-patching deactivate
    proj.onDeactivateCallback = () => {
      const ex = proj.x, ey = proj.y;

      // Guard against both scene shutdown AND this WeaponSystem being replaced
      // by a fresh instance after Play Again (scene stays active on restart,
      // but `this` is the old instance — destroyed = true means we shouldn't
      // create new visuals/damage on the live scene).
      if (this.destroyed || !this.scene?.sys?.isActive()) return;

      const blast = this.scene.add.circle(ex, ey, 10, 0xff6600, 0.6);
      this.scene.tweens.add({
        targets: blast, radius: 80, alpha: 0, duration: 300,
        onComplete: () => blast.destroy(),
      });

      const enemies = this.enemyGroup.getChildren() as Enemy[];
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        if (Phaser.Math.Distance.Between(ex, ey, enemy.x, enemy.y) <= 80) {
          this.dealDamageToEnemy(enemy, Math.ceil(dmg * 0.6));
        }
      }
    };
  }

  /** The Haar — massive fog zone covering huge area */
  private fireMassiveFog(px: number, py: number, dmg: number, radius: number): void {
    const zone = this.scene.add.circle(px, py, radius, 0x88aacc, 0.25);
    const duration = 4000;

    const timer = this.scene.time.addEvent({
      delay: 300,
      repeat: Math.floor(duration / 300) - 1,
      callback: () => {
        if (this.destroyed || !this.scene?.sys?.isActive()) { timer.destroy(); return; }
        if (this.scene.physics.world.isPaused) return;
        const enemies = this.enemyGroup.getChildren() as Enemy[];
        for (const enemy of enemies) {
          if (!enemy.active) continue;
          if (Phaser.Math.Distance.Between(zone.x, zone.y, enemy.x, enemy.y) <= radius) {
            this.dealDamageToEnemy(enemy, dmg);
            // Slow enemies in the fog to 50% speed. Duration matches the
            // tick interval + a small overlap so the slow is continuous
            // rather than flickering on and off between ticks.
            enemy.applyFreeze(0.5, 500);
          }
        }
      },
    });

    this.scene.tweens.add({
      targets: zone, alpha: 0, duration,
      onComplete: () => { timer.destroy(); if (zone.active) zone.destroy(); },
    });
  }

  /** Haggis Cannon — rapid burst of bouncing projectiles in all directions */
  private fireRapidBounce(w: ActiveWeapon, px: number, py: number, dmg: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const proj = this.getProjectile('haggis_ball');
      if (!proj) continue;
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      proj.fire(px, py,
        px + Math.cos(angle) * 500, py + Math.sin(angle) * 500,
        w.config.projectileSpeed * 1.5, dmg, 0, 2000
      );
      proj.setBouncing();
    }
  }

  /** Nessie Unleashed — full 360-degree sweep */
  private fireFullSweep(px: number, py: number, dmg: number, radius: number): void {
    const gfx = this.scene.add.graphics();
    gfx.fillStyle(0x226644, 0.35);
    gfx.fillCircle(px, py, radius);

    this.scene.tweens.add({
      targets: gfx, alpha: 0, duration: 400,
      onComplete: () => gfx.destroy(),
    });

    const enemies = this.enemyGroup.getChildren() as Enemy[];
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      if (Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y) <= radius) {
        this.dealDamageToEnemy(enemy, dmg);
        // Knockback via impulse system — persistent enough to actually shove.
        const angle = Phaser.Math.Angle.Between(px, py, enemy.x, enemy.y);
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        const kb = 200 / body.mass;
        enemy.applyKnockback(Math.cos(angle) * kb, Math.sin(angle) * kb, 200);
      }
    }
  }

  private dealDamageToEnemy(enemy: Enemy, damage: number, isCrit: boolean = false): void {
    this.events.emit('damageDealt', enemy.x, enemy.y, damage, isCrit);
    const wasBoss = enemy.isBoss();
    const wasElite = enemy.isElite();
    const killed = enemy.takeDamage(damage);
    if (killed) {
      this.events.emit('enemyKilled', enemy.x, enemy.y, enemy.getXpValue(), enemy.getEnemyKey(), wasBoss, wasElite);
    }
  }

  // ── Helpers ──

  private getProjectile(texture: string): Projectile | null {
    let proj = this.projectilePool.getFirstDead(false) as Projectile | null;
    if (!proj) {
      if (this.projectilePool.getLength() >= 200) return null;
      proj = new Projectile(this.scene);
      this.projectilePool.add(proj);
    }
    proj.setTexture(texture);
    return proj;
  }

  private findClosestEnemy(fromX: number, fromY: number, maxRange: number): Enemy | null {
    let closest: Enemy | null = null;
    let closestDist = maxRange;

    const enemies = this.enemyGroup.getChildren() as Enemy[];
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dist = Phaser.Math.Distance.Between(fromX, fromY, enemy.x, enemy.y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = enemy;
      }
    }
    return closest;
  }

  private onProjectileHitEnemy(
    projObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    const proj = projObj as Projectile;
    const enemy = enemyObj as Enemy;
    if (!proj.active || !enemy.active) return;

    // Check if this hit should be processed (bouncing projectiles track per-enemy hits)
    if (proj.shouldSkipHit(enemy)) return;

    this.dealDamageToEnemy(enemy, proj.getDamage(), proj.isCrit());

    // Caber Toss applies burn (3 dps for 3s)
    if (proj.getWeaponKey() === 'caber_toss') {
      enemy.applyBurn(3, 3000);
    }

    proj.onHitEnemy();
  }

  hasWeapon(key: string): boolean {
    return this.weapons.some(w => w.config.key === key);
  }

  getWeapons(): ActiveWeapon[] {
    return this.weapons;
  }

  getProjectileGroup(): Phaser.GameObjects.Group {
    return this.projectilePool;
  }
}
