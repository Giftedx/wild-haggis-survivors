import * as Phaser from 'phaser';
import { Projectile } from '../entities/Projectile';
import { Enemy } from '../entities/Enemy';
import { WEAPON_DEFS, WeaponDef } from '../data/weapons';
import { audio } from './AudioSystem';
import { ISceneContext } from '../core/ISceneContext';
import { BALANCE } from '../core/BalanceConfig';
import { globalEventBus } from '../core/GlobalEventBus';
import { computeLevelScaledWeaponStats } from './weaponLevelScaling';
import { applyWeaponEvolutionStats } from './weaponEvolutionStats';
import { resolveEffectiveCooldownMs } from './effectiveWeaponCooldown';
import { resolveMuzzleFlashColor, resolveWeaponVfxColor } from './muzzleFlashColors';
import { fillCirclePool } from './fillCirclePool';

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
  private scene: Phaser.Scene & ISceneContext;
  private weapons: ActiveWeapon[] = [];
  private projectilePool: Phaser.GameObjects.Group;
  private enemyGroup: Phaser.GameObjects.Group;

  /** Last known player facing angle (radians) — used for directional weapons */
  private playerFacing: number = 0;

  /** Trail frame counter — spawn trail particles every N frames */
  private trailCounter: number = 0;

  /** Per-frame cache: active enemies sorted by distance to player.
   *  Built lazily on first findClosestEnemy() call per frame. */
  private cachedSortedEnemies: Enemy[] = [];
  private cachedSortedDistSq: number[] = [];
  private enemyCacheFrame: number = -1;
  private cachePlayerX: number = 0;
  private cachePlayerY: number = 0;
  private frameCounter: number = 0;

  /** Pooled VFX circles for weapon visual effects (pulse rings, zones, blasts). */
  private vfxCirclePool: Phaser.GameObjects.Arc[] = [];
  private vfxCircleIdx: number = 0;

  /** Pooled VFX graphics for arc sweep visuals. */
  private vfxGfxPool: Phaser.GameObjects.Graphics[] = [];
  private vfxGfxIdx: number = 0;

  /** Multipliers from player upgrades — set each frame by GameScene */
  private damageMultiplier: number = 1;
  private aoeMultiplier: number = 1;
  private attackSpeedMultiplier: number = 1;
  private critChance: number = 0.10;
  private critDamageMultiplier: number = 2.0;
  private cooldownReduction: number = 0;
  /** Run-scoped curse multiplier. 1.0 identity; >1 slower fire. */
  private curseCooldownMul: number = 1;

  /** Emits 'enemyKilled' (x, y, xpValue, key, wasBoss, wasElite, eliteAffixId?) and 'damageDealt' (x, y, amount, isCrit, weaponKey) */
  readonly events = new Phaser.Events.EventEmitter();

  /** Set true when GameScene shuts down — stops stale callbacks from touching freed state. */
  private destroyed: boolean = false;
  destroy(): void {
    this.destroyed = true;
    // Clear run-scoped state so pooled objects can't bleed into a new run
    this.events.removeAllListeners();
    this.weapons = [];
    this.trailCounter = 0;
    this.playerFacing = 0;

    const projectiles = this.projectilePool.getChildren() as Projectile[];
    for (const p of projectiles) {
      if (p.active) {
        try { p.destroy(); } catch { /* ignore */ }
        p.active = false;
        p.visible = false;
      }
    }
    try { this.projectilePool.clear(true, true); } catch { /* ignore */ }

    // Clean up VFX pools
    for (const c of this.vfxCirclePool) {
      this.scene.tweens.killTweensOf(c);
      c.destroy();
    }
    for (const g of this.vfxGfxPool) {
      this.scene.tweens.killTweensOf(g);
      g.destroy();
    }
    this.vfxCirclePool = [];
    this.vfxGfxPool = [];
  }

  constructor(scene: Phaser.Scene & ISceneContext, enemyGroup: Phaser.GameObjects.Group) {
    this.scene = scene;
    this.enemyGroup = enemyGroup;

    // Projectile pool (shared across all projectile-based weapons)
    this.projectilePool = scene.add.group({
      classType: Projectile,
      maxSize: BALANCE.weapons.projectilePoolMax,
      runChildUpdate: false,
    });
    for (let i = 0; i < BALANCE.weapons.projectilePrewarm; i++) {
      this.projectilePool.add(new Projectile(scene));
    }
    // Wire shared FX pool for projectile pop effects
    Projectile.fxPool = scene.getStatusFxPool();

    // Pre-allocate VFX circle pool — 30 covers all weapon visual effects
    // (pulse rings, zones, blasts) with headroom above ~13 max simultaneous.
    fillCirclePool(scene, this.vfxCirclePool, 30, 10, 0xffffff, 0.5, 10);
    // Pre-allocate VFX graphics pool — 5 covers arc sweep visuals
    for (let i = 0; i < 5; i++) {
      const g = scene.add.graphics().setDepth(10).setVisible(false);
      this.vfxGfxPool.push(g);
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

  /** Acquire a pooled VFX circle, resetting it for reuse. O(1) circular indexing. */
  private acquireVfxCircle(x: number, y: number, radius: number, color: number, alpha: number): Phaser.GameObjects.Arc {
    const c = this.vfxCirclePool[this.vfxCircleIdx];
    this.vfxCircleIdx = (this.vfxCircleIdx + 1) % this.vfxCirclePool.length;
    this.scene.tweens.killTweensOf(c);
    c.setPosition(x, y);
    c.setRadius(radius);
    c.setFillStyle(color, alpha);
    c.setAlpha(alpha);
    c.setScale(1);
    c.setVisible(true);
    return c;
  }

  /** Acquire a pooled VFX graphics object, clearing it for reuse. */
  private acquireVfxGraphics(): Phaser.GameObjects.Graphics {
    const g = this.vfxGfxPool[this.vfxGfxIdx];
    this.vfxGfxIdx = (this.vfxGfxIdx + 1) % this.vfxGfxPool.length;
    this.scene.tweens.killTweensOf(g);
    g.clear();
    g.setAlpha(1);
    g.setVisible(true);
    return g;
  }

  addWeapon(key: string): boolean {
    if (this.hasWeapon(key)) return false;
    const def = WEAPON_DEFS[key as import('../data/weapons').WeaponKey];
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
    const scaled = computeLevelScaledWeaponStats(w.config, w.level);
    w.damage = scaled.damage;
    w.cooldownMs = scaled.cooldownMs;
    w.pierce = scaled.pierce;
    w.aoeRadius = scaled.aoeRadius;

    if (w.config.levelScaling.countAt.includes(w.level)) {
      w.projectileCount++;
    }

    return true;
  }

  /**
   * Evolve a weapon in-place: the base slot stays the source weapon key for saves,
   * but combat switches to `evolutionKey` (see fireEvolved). Idempotent — returns
   * false if already evolved or missing.
   */
  evolveWeapon(weaponKey: string, evolutionKey: string): boolean {
    const w = this.weapons.find(w => w.config.key === weaponKey);
    if (!w || w.evolved) return false;

    w.evolved = true;
    w.evolutionKey = evolutionKey;

    // Evolved weapons get a ~3.5× effective-DPS spike — big but not
    // single-slot-wins. Tuning lives in weaponEvolutionStats.ts.
    const boosted = applyWeaponEvolutionStats({
      damage: w.damage,
      cooldownMs: w.cooldownMs,
      projectileCount: w.projectileCount,
      aoeRadius: w.aoeRadius,
      pierce: w.pierce,
    });
    w.damage = boosted.damage;
    w.cooldownMs = boosted.cooldownMs;
    w.projectileCount = boosted.projectileCount;
    w.aoeRadius = boosted.aoeRadius;
    w.pierce = boosted.pierce;

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

  /** Run-scoped curse modifier — clamps >=0.05 so a bug can't freeze fire. */
  setCurseCooldownMul(mul: number): void {
    this.curseCooldownMul = Math.max(0.05, Number.isFinite(mul) ? mul : 1);
  }

  getCurseCooldownMul(): number {
    return this.curseCooldownMul;
  }

  /**
   * R1 M3 T20d — per-hit damage modifier. Called inside dealDamageToEnemy
   * with the resolved damage + wall-clock ms + elite flag + enemy velocity
   * dot toward player; return value replaces the damage before it lands.
   * Used for bronze_clasp's first-hit-per-second bonus, highland_torque's
   * +100% elite damage, and (R1 M4.5 P3) fishermens_net's +30% for
   * enemies fleeing the haggis. Null = identity. Cleared on scene restart.
   */
  setHitDamageModifier(
    fn: ((damage: number, nowMs: number, isElite: boolean, velocityDotTowardPlayer: number) => number) | null,
  ): void {
    this.hitDamageModifier = fn;
  }

  private hitDamageModifier:
    | ((damage: number, nowMs: number, isElite: boolean, velocityDotTowardPlayer: number) => number)
    | null = null;

  update(delta: number, playerX: number, playerY: number): void {
    this.frameCounter++;
    this.cachePlayerX = playerX;
    this.cachePlayerY = playerY;

    // Update active projectiles + spawn trail particles
    this.trailCounter++;
    const spawnTrail = this.trailCounter % BALANCE.weapons.trailEveryNFrames === 0;
    const projectiles = this.projectilePool.getChildren() as Projectile[];
    for (const proj of projectiles) {
      if (proj.active) {
        proj.update(delta);
        if (spawnTrail) {
          const wKey = proj.getWeaponKey();
          const isEvolved = wKey ? this.weapons.some(w => w.config.key === wKey && w.evolved) : false;
          this.events.emit('projectileTrail', proj.x, proj.y, isEvolved, wKey);
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
        // Scale the cooldown reset by all run-scoped multipliers (attack
        // speed, cooldown reduction, curse). resolveEffectiveCooldownMs
        // enforces the absolute floor + the asp-clamp.
        const effectiveCooldown = resolveEffectiveCooldownMs(
          weapon.cooldownMs,
          this.attackSpeedMultiplier,
          this.cooldownReduction,
          this.curseCooldownMul,
        );
        weapon.cooldownRemaining = Math.max(weapon.cooldownRemaining, -effectiveCooldown)
          + effectiveCooldown;
        this.fireWeapon(weapon, playerX, playerY);
        // Only play shoot sound for projectile-type weapons — AoE/trail/sweep have wrong sound
        const b = weapon.config.behavior;
        if (b === 'projectile' || b === 'piercing' || b === 'bouncing') {
          this.scene.getSFXManager().tryPlay('shoot', () => audio.playShootImmediate());
        }
      }
    }
  }

  // ── Fire dispatch ──

  /** Compute effective damage with global multiplier + crit roll */
  private effectiveDamage(w: ActiveWeapon): { damage: number; isCrit: boolean } {
    const baseDmg = Math.ceil(w.damage * this.damageMultiplier);
    // Crit via seeded RNG — replaying a run with the same seed produces the
    // same crits on the same enemies, which is what makes shared seeds fair.
    const isCrit = this.scene.getRunRng().bool(this.critChance);
    return { damage: isCrit ? Math.ceil(baseDmg * this.critDamageMultiplier) : baseDmg, isCrit };
  }

  /** Compute effective AoE radius with global multiplier */
  private effectiveAoe(w: ActiveWeapon): number {
    return w.aoeRadius * this.aoeMultiplier;
  }

  private fireWeapon(w: ActiveWeapon, px: number, py: number): void {
    // Animation trigger: the haggis pulses forward on any weapon fire.
    // One-shot gating in AnimationController absorbs duplicate emits from
    // multi-weapon frames — the next fire after the beat retriggers.
    this.events.emit('weaponFired');

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
        break; // AoE has its own visual ring — no muzzle flash needed
      case 'trail':
        this.fireTrail(w, px, py);
        break; // trail weapon doesn't "fire" from origin
      case 'arc_sweep':
        this.fireArcSweep(w, px, py);
        break;
      case 'aura_pulse':
        this.fireAuraPulse(w, px, py);
        break; // aura has its own visual
    }
    const flashColor = resolveMuzzleFlashColor(w.config.behavior);
    if (flashColor !== null) this.spawnMuzzleFlash(px, py, flashColor);
  }

  /** Small muzzle flash at projectile fire point — weapon-coloured spark burst.
   *  Routed through `StatusFxPool` (acquireArc) instead of `scene.add.circle` so
   *  a fast-firing player doesn't churn 30-50 GameObjects/sec through GC. */
  private spawnMuzzleFlash(x: number, y: number, color: number): void {
    const scene = this.scene;
    const pool = scene.getStatusFxPool();
    // Central flash circle — bright, fades fast
    const flash = pool.acquireArc(x, y, 8, color, 0.8);
    flash.setDepth(4);
    scene.tweens.add({
      targets: flash, scale: 2, alpha: 0,
      duration: 180, ease: 'Quad.easeOut',
      onComplete: () => flash.setVisible(false),
    });
    // 4 tiny sparks radiating out
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.random() * 0.5;
      const spark = pool.acquireArc(x, y, 2, color, 0.9);
      spark.setDepth(4);
      scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 12,
        y: y + Math.sin(angle) * 12,
        alpha: 0, scale: 0.3,
        duration: 220,
        ease: 'Quad.easeOut',
        onComplete: () => spark.setVisible(false),
      });
    }
  }

  // ── Projectile-based weapons (Thistle Shot, Caber Toss) ──

  private fireProjectile(w: ActiveWeapon, px: number, py: number, texture: string): void {
    const target = this.findClosestEnemy(px, py, w.config.range);
    if (!target) return;

    const count = w.projectileCount;
    const maxShot = this.maxExtraProjectilesThisFrame(w.config.key, count);
    const spread = maxShot > 1 ? 15 : 0;

    for (let i = 0; i < maxShot; i++) {
      const proj = this.getProjectile(texture);
      if (!proj) continue;

      let tx = target.x, ty = target.y;
      if (maxShot > 1) {
        const base = Phaser.Math.Angle.Between(px, py, target.x, target.y);
        const offset = Phaser.Math.DegToRad((i - (maxShot - 1) / 2) * spread);
        tx = px + Math.cos(base + offset) * 500;
        ty = py + Math.sin(base + offset) * 500;
      }

      const { damage, isCrit } = this.effectiveDamage(w);
      proj.fire(px, py, tx, ty, w.config.projectileSpeed, damage, w.pierce, w.config.range, isCrit);
      proj.setWeaponKey(w.config.key);
      this.applyProjectileVisual(proj, texture);
    }
  }

  // ── Bouncing weapon (Jobby Hurler) ──

  private fireBouncing(w: ActiveWeapon, px: number, py: number): void {
    const count = this.maxExtraProjectilesThisFrame(w.config.key, w.projectileCount);

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
      proj.setWeaponKey(w.config.key);
      this.applyProjectileVisual(proj, 'haggis_ball');
    }
  }

  // ── AoE Pulse (Bagpipe Blast) — damages all enemies in radius ──

  private fireAoePulse(w: ActiveWeapon, px: number, py: number): void {
    const radius = this.effectiveAoe(w);
    const { damage: dmg, isCrit } = this.effectiveDamage(w);

    // Visual pulse ring — pooled
    const ring = this.acquireVfxCircle(px, py, 10, resolveWeaponVfxColor(w.config.behavior), 0.4);
    this.scene.tweens.add({
      targets: ring,
      radius: radius,
      alpha: 0,
      duration: 300,
      onComplete: () => ring.setVisible(false),
    });

    // Damage + knockback all enemies in radius. Squared-distance gate
    // skips sqrt for the (majority of) enemies outside the pulse — only
    // the ones that get hit pay for it, and even then we reuse the same
    // dx/dy as the knockback direction (no atan2 → cos/sin round-trip).
    const radiusSq = radius * radius;
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - px;
      const dy = enemy.y - py;
      const distSq = dx * dx + dy * dy;
      if (distSq <= radiusSq) {
        this.dealDamageToEnemy(enemy, dmg, isCrit, w.config.key);

        // Bagpipe Blast applies brief freeze (slow 50% for 1s)
        enemy.applyFreeze(0.5, 1000);

        // Knockback — uses the impulse system so behaviorChase doesn't wipe it.
        // Divided by mass so tanks resist being pushed.
        if (enemy.active && w.config.knockback > 0) {
          const dist = Math.sqrt(distSq);
          if (dist > 1e-6) {
            const body = enemy.body as Phaser.Physics.Arcade.Body;
            const mass = Math.max(0.05, body.mass);
            const kb = w.config.knockback / mass / dist;
            enemy.applyKnockback(dx * kb, dy * kb, 150);
          }
        }
      }
    }
  }

  // ── Trail (Scotch Mist) — drops a damage zone at the player's position ──

  private fireTrail(w: ActiveWeapon, px: number, py: number): void {
    const radius = this.effectiveAoe(w);
    const weaponKey = w.config.key;

    // Create a fading mist zone — pooled
    const zone = this.acquireVfxCircle(px, py, radius, resolveWeaponVfxColor(w.config.behavior), 0.3);
    const duration = 2000;

    // Damage enemies within the zone over its lifetime.
    // Each tick rolls damage+crit independently — baking a single isCrit at
    // spawn time would lock the entire zone into 2× damage when it rolled
    // crit, producing 4× DPS spikes when two overlapping zones both critted.
    // Cap repeats one short of `duration / interval` so the final tick lands
    // safely before the tween's onComplete cancel races it.
    const intervalMs = 400;
    const damageHandle = this.scene.getUpdateTickers().addInterval(
      'scaled',
      intervalMs,
      () => {
        if (this.scene.getTimeManager().isGameplayPaused()) return;
        const { damage: dmg, isCrit } = this.effectiveDamage(w);
        const enemies = this.enemyGroup.getChildren() as Enemy[];
        const radiusSq = radius * radius;
        for (const enemy of enemies) {
          if (!enemy.active) continue;
          const dx = enemy.x - zone.x;
          const dy = enemy.y - zone.y;
          if (dx * dx + dy * dy <= radiusSq) {
            this.dealDamageToEnemy(enemy, dmg, isCrit, weaponKey);
            // Scotch Mist applies poison (stacking DoT)
            enemy.applyPoison(2, 3000);
          }
        }
      },
      { repeats: Math.max(1, Math.floor(duration / intervalMs) - 1) }
    );

    // Fade out and destroy
    this.scene.tweens.add({
      targets: zone,
      alpha: 0,
      duration: duration,
      onComplete: () => {
        damageHandle.cancel();
        zone.setVisible(false);
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

    // Visual sweep arc — steel wedge for claymore, murky green for Nessie — pooled
    const gfx = this.acquireVfxGraphics();
    const isClaymore = w.config.key === 'claymore';
    gfx.fillStyle(isClaymore ? 0xc8d8e8 : 0x226644, isClaymore ? 0.35 : 0.4);
    gfx.slice(
      px, py, radius,
      facing - halfArc,
      facing + halfArc,
      false
    );
    gfx.fillPath();
    if (isClaymore) {
      gfx.lineStyle(2, 0x8899aa, 0.55);
      gfx.beginPath();
      gfx.arc(px, py, radius * 0.92, facing - halfArc, facing + halfArc, false);
      gfx.strokePath();
    }

    this.scene.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 250,
      onComplete: () => { gfx.setVisible(false); gfx.clear(); },
    });

    // Damage enemies within the arc.
    //
    // Replace two atan2s + angle-wrap loops with a dot product. The arc
    // test "is the enemy direction within ±halfArc of facing?" is exactly
    // `dot(enemyDir, facingDir) >= cos(halfArc)` for unit vectors —
    // monotonic in the angle, no branch normalization needed. We pre-bake
    // facing's cos/sin and the arc threshold once per call; per enemy
    // does one sqrt and one dot product.
    const radiusSq = radius * radius;
    const fcos = Math.cos(facing);
    const fsin = Math.sin(facing);
    const arcThresh = Math.cos(halfArc);
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - px;
      const dy = enemy.y - py;
      const distSq = dx * dx + dy * dy;
      if (distSq > radiusSq) continue;

      const dist = Math.sqrt(distSq);
      if (dist < 1e-6) continue;
      const nx = dx / dist;
      const ny = dy / dist;
      const dot = nx * fcos + ny * fsin;
      if (dot < arcThresh) continue;

      this.dealDamageToEnemy(enemy, dmg, isCrit, w.config.key);

      // Knockback via impulse system (persistent for 150ms, then behavior resumes).
      // Reuses the same dx/dy: knockback direction == enemy direction.
      if (enemy.active && w.config.knockback > 0) {
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        const mass = Math.max(0.05, body.mass);
        const kb = w.config.knockback / mass;
        enemy.applyKnockback(nx * kb, ny * kb, 150);
      }
    }
  }

  /** Central damage handler — applies damage, emits events */
  // ── Evolved weapon behaviors ──

  private fireEvolved(w: ActiveWeapon, px: number, py: number): void {
    const { damage: dmg, isCrit } = this.effectiveDamage(w);
    const radius = this.effectiveAoe(w);

    switch (w.evolutionKey) {
      case 'thistle_storm':
        this.fireHomingBurst(w, px, py, dmg, 6, isCrit);
        break;
      case 'highland_fling':
        this.fireExpandingRing(px, py, dmg, radius * 2.2, w.config.key, isCrit);
        break;
      case 'highland_games':
        this.fireExplodingProjectile(w, px, py, dmg, isCrit);
        break;
      case 'the_haar':
        this.fireMassiveFog(px, py, dmg, radius * 2, w.config.key, isCrit);
        break;
      case 'haggis_cannon':
        this.fireRapidBounce(w, px, py, dmg, 4, isCrit);
        break;
      case 'nessie_unleashed':
        this.fireFullSweep(px, py, dmg, radius * 1.6, w.config.key, isCrit);
        break;
      case 'william_blade':
        this.fireWilliamBladeWaves(w, px, py, dmg, isCrit);
        break;
      default:
        this.fireProjectile(w, px, py, 'thistle');
        break;
    }
  }

  /** Thistle Storm — 8 projectiles that each seek a different enemy */
  private fireHomingBurst(w: ActiveWeapon, px: number, py: number, dmg: number, count: number, isCrit: boolean = false): void {
    this.ensureEnemyCache();
    const targets = this.cachedSortedEnemies;
    const maxShot = this.maxExtraProjectilesThisFrame(w.config.key, count);
    const targetCount = Math.min(targets.length, maxShot);

    for (let i = 0; i < maxShot; i++) {
      const proj = this.getProjectile('thistle');
      if (!proj) continue;

      // Aim at a specific enemy, or random direction if not enough targets
      let tx: number, ty: number;
      if (i < targetCount) {
        tx = targets[i].x;
        ty = targets[i].y;
      } else {
        const angle = (i / Math.max(1, maxShot)) * Math.PI * 2;
        tx = px + Math.cos(angle) * 400;
        ty = py + Math.sin(angle) * 400;
      }

      proj.fire(px, py, tx, ty, w.config.projectileSpeed * 1.3, dmg, 2, 800, isCrit);
      proj.setWeaponKey(w.config.key);
      this.applyProjectileVisual(proj, 'thistle');
    }
  }

  /** Ceòl Mòr bagpipes — pulse damage + slow in a standing ring. */
  private fireAuraPulse(w: ActiveWeapon, px: number, py: number): void {
    const radius = this.effectiveAoe(w);
    const { damage: dmg, isCrit } = this.effectiveDamage(w);
    const ring = this.acquireVfxCircle(px, py, radius, resolveWeaponVfxColor(w.config.behavior), 0.38);
    this.scene.tweens.add({
      targets: ring,
      alpha: 0.1,
      duration: 280,
      yoyo: true,
      onComplete: () => ring.setVisible(false),
    });

    const radiusSq = radius * radius;
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - px;
      const dy = enemy.y - py;
      if (dx * dx + dy * dy <= radiusSq) {
        this.dealDamageToEnemy(enemy, dmg, isCrit, w.config.key);
        enemy.applyFreeze(0.42, 1400);
      }
    }
  }

  /** William Blade — chained sonic shockwaves from the claymore stance. */
  private fireWilliamBladeWaves(w: ActiveWeapon, px: number, py: number, baseDmg: number, isCrit: boolean = false): void {
    const maxR = this.effectiveAoe(w) * 2.9;
    const waveDmg = Math.ceil(baseDmg * 0.45);
    const weaponKey = w.config.key;
    for (let wave = 0; wave < 3; wave++) {
      // Wave 0 at delay 0 fires inside the same `tickScaled` pass that
      // created it, racing with pooled-VFX cleanup timers for adjacent
      // rings. Shift by one interval so the 3 waves fire at 170/340/510 ms
      // on clean frame boundaries.
      this.scene.getUpdateTickers().addOnce('scaled', (wave + 1) * 170, () => {
        if (this.destroyed || !this.scene?.sys?.isActive()) return;
        this.fireExpandingRing(px, py, waveDmg, maxR, weaponKey, isCrit);
      });
    }
  }

  /** Highland Fling — massive expanding damage ring */
  private fireExpandingRing(px: number, py: number, dmg: number, maxRadius: number, weaponKey: string, isCrit: boolean = false): void {
    const ring = this.acquireVfxCircle(px, py, 20, 0x4488ff, 0.5);
    let currentRadius = 20;
    const hitEnemies = new Set<Enemy>();

    const expandHandle = this.scene.getUpdateTickers().addInterval('scaled', 50, () => {
      if (this.destroyed || !this.scene?.sys?.isActive()) return;
      currentRadius += (maxRadius - 20) / 16;
      ring.setRadius(currentRadius);
      ring.setAlpha(Math.max(0, ring.alpha - 0.5 / 16));

      // Damage enemies who just entered the ring — each hit at most once
      // per ring lifetime. The squared-distance gate skips sqrt entirely.
      // (Mid-expansion pool-recycle into a fresh enemy reusing the same JS
      // object will get one frame's worth of immunity from the Set; that's
      // a tiny acceptable miss compared to the previously broken
      // delete-then-add re-hit pattern.)
      if (!this.scene.getTimeManager().isGameplayPaused()) {
        const enemies = this.enemyGroup.getChildren() as Enemy[];
        const currentRadiusSq = currentRadius * currentRadius;
        for (const enemy of enemies) {
          if (!enemy.active) continue;
          if (hitEnemies.has(enemy)) continue;
          const dx = enemy.x - px;
          const dy = enemy.y - py;
          if (dx * dx + dy * dy <= currentRadiusSq) {
            hitEnemies.add(enemy);
            this.dealDamageToEnemy(enemy, dmg, isCrit, weaponKey);
          }
        }
      }
    }, { repeats: 16 });

    this.scene.getUpdateTickers().addOnce('scaled', 850, () => {
      expandHandle.cancel();
      ring.setVisible(false);
    });
  }

  /** Highland Games — piercing caber that explodes on final hit */
  private fireExplodingProjectile(w: ActiveWeapon, px: number, py: number, dmg: number, isCrit: boolean = false): void {
    const target = this.findClosestEnemy(px, py, w.config.range);
    if (!target) return;
    if (this.maxExtraProjectilesThisFrame(w.config.key, 1) < 1) return;

    const proj = this.getProjectile('caber');
    if (!proj) return;
    const weaponKey = w.config.key;
    proj.fire(px, py, target.x, target.y, w.config.projectileSpeed, dmg, w.pierce, w.config.range, isCrit);
    proj.setWeaponKey(weaponKey);
    this.applyProjectileVisual(proj, 'caber');

    // Use the safe callback field instead of monkey-patching deactivate
    proj.onDeactivateCallback = () => {
      const ex = proj.x, ey = proj.y;

      // Guard against both scene shutdown AND this WeaponSystem being replaced
      // by a fresh instance after Play Again (scene stays active on restart,
      // but `this` is the old instance — destroyed = true means we shouldn't
      // create new visuals/damage on the live scene).
      if (this.destroyed || !this.scene?.sys?.isActive()) return;

      const blast = this.acquireVfxCircle(ex, ey, 10, 0xff6600, 0.6);
      this.scene.tweens.add({
        targets: blast, radius: 80, alpha: 0, duration: 300,
        onComplete: () => blast.setVisible(false),
      });

      const enemies = this.enemyGroup.getChildren() as Enemy[];
      const blastRadiusSq = 80 * 80;
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - ex;
        const dy = enemy.y - ey;
        if (dx * dx + dy * dy <= blastRadiusSq) {
          this.dealDamageToEnemy(enemy, Math.ceil(dmg * 0.6), isCrit, weaponKey);
        }
      }
    };
  }

  /** The Haar — massive fog zone covering huge area */
  private fireMassiveFog(px: number, py: number, dmg: number, radius: number, weaponKey: string, isCrit: boolean = false): void {
    const zone = this.acquireVfxCircle(px, py, radius, 0x88aacc, 0.25);
    const duration = 2600;

    const tickHandle = this.scene.getUpdateTickers().addInterval('scaled', 350, () => {
      if (this.destroyed || !this.scene?.sys?.isActive()) return;
      if (this.scene.getTimeManager().isGameplayPaused()) return;
      const enemies = this.enemyGroup.getChildren() as Enemy[];
      const radiusSq = radius * radius;
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - zone.x;
        const dy = enemy.y - zone.y;
        if (dx * dx + dy * dy <= radiusSq) {
          this.dealDamageToEnemy(enemy, dmg, isCrit, weaponKey);
          // Slow enemies in the fog to 50% speed. Duration matches the
          // tick interval + a small overlap so the slow is continuous
          // rather than flickering on and off between ticks.
          enemy.applyFreeze(0.5, 500);
        }
      }
    }, { repeats: Math.floor(duration / 350) });

    this.scene.tweens.add({
      targets: zone, alpha: 0, duration,
      onComplete: () => { tickHandle.cancel(); zone.setVisible(false); },
    });
  }

  /** Jobby Cannon — rapid burst of wee jobbies in all directions */
  private fireRapidBounce(w: ActiveWeapon, px: number, py: number, dmg: number, count: number, isCrit: boolean = false): void {
    const maxShot = this.maxExtraProjectilesThisFrame(w.config.key, count);
    const sectors = Math.max(1, maxShot);
    const rng = this.scene.getRunRng();
    for (let i = 0; i < maxShot; i++) {
      const proj = this.getProjectile('haggis_ball');
      if (!proj) continue;
      // Space by actual shots fired — `count` can exceed `maxShot` when the pool caps fire rate.
      // Jitter draws from runRng so the seed reproduces Jobby Cannon trajectories byte-for-byte.
      const angle = (i / sectors) * Math.PI * 2 + rng.float(0, 0.3);
      proj.fire(px, py,
        px + Math.cos(angle) * 500, py + Math.sin(angle) * 500,
        w.config.projectileSpeed * 1.5, dmg, 0, 2000, isCrit
      );
      proj.setBouncing();
      proj.setWeaponKey(w.config.key);
      this.applyProjectileVisual(proj, 'haggis_ball');
    }
  }

  /** Nessie Unleashed — full 360-degree sweep */
  private fireFullSweep(px: number, py: number, dmg: number, radius: number, weaponKey: string, isCrit: boolean = false): void {
    const gfx = this.acquireVfxGraphics();
    gfx.fillStyle(0x226644, 0.35);
    gfx.fillCircle(px, py, radius);

    this.scene.tweens.add({
      targets: gfx, alpha: 0, duration: 400,
      onComplete: () => { gfx.setVisible(false); gfx.clear(); },
    });

    const enemies = this.enemyGroup.getChildren() as Enemy[];
    const radiusSq = radius * radius;
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - px;
      const dy = enemy.y - py;
      const distSq = dx * dx + dy * dy;
      if (distSq <= radiusSq) {
        this.dealDamageToEnemy(enemy, dmg, isCrit, weaponKey);
        // Knockback via impulse system — same dx/dy supplies the direction,
        // no separate atan2 needed.
        const dist = Math.sqrt(distSq);
        if (dist > 1e-6) {
          const body = enemy.body as Phaser.Physics.Arcade.Body;
          const mass = Math.max(0.05, body.mass);
          const kb = 200 / mass / dist;
          enemy.applyKnockback(dx * kb, dy * kb, 200);
        }
      }
    }
  }

  private dealDamageToEnemy(
    enemy: Enemy,
    damage: number,
    isCrit: boolean = false,
    weaponKey: string = 'unknown'
  ): void {
    // R1 M3 T20d + M4 + M4.5 P3 — per-hit damage modifier runs first so
    // damageDealt + enemy.takeDamage + damage logs all see the same
    // final number. Covers bronze_clasp, highland_torque elite mult,
    // fishermens_net (velocity-aware +30% when fleeing).
    let finalDamage = damage;
    if (this.hitDamageModifier) {
      const body = enemy.body as Phaser.Physics.Arcade.Body | null;
      const vx = body?.velocity?.x ?? 0;
      const vy = body?.velocity?.y ?? 0;
      // dot = enemyVelocity · (playerPos − enemyPos). > 0 toward, < 0 away.
      const velocityDotTowardPlayer =
        vx * (this.cachePlayerX - enemy.x) + vy * (this.cachePlayerY - enemy.y);
      finalDamage = Math.max(
        0,
        Math.ceil(
          this.hitDamageModifier(
            damage,
            this.scene.time.now,
            enemy.isElite(),
            velocityDotTowardPlayer,
          ),
        ),
      );
    }
    this.events.emit('damageDealt', enemy.x, enemy.y, finalDamage, isCrit, weaponKey);
    const wasBoss = enemy.isBoss();
    const wasElite = enemy.isElite();
    const killed = enemy.takeDamage(finalDamage);
    if (killed) {
      this.events.emit(
        'enemyKilled',
        enemy.x,
        enemy.y,
        enemy.getXpValue(),
        enemy.getEnemyKey(),
        wasBoss,
        wasElite,
        wasElite ? enemy.getEliteAffixId() : undefined,
      );
      globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
        enemyKey: enemy.getEnemyKey(),
        xpValue: enemy.getXpValue(),
        wasBoss,
        wasElite,
        eliteAffixId: wasElite ? enemy.getEliteAffixId() : undefined,
      });
    }
  }

  // ── Helpers ──

  /** Throttle pool warnings to once per 5 seconds */
  private lastPoolWarnTime: number = 0;

  private countActiveProjectilesForWeapon(weaponKey: string): number {
    const entries = this.projectilePool.getChildren() as Projectile[];
    let n = 0;
    for (let i = 0; i < entries.length; i++) {
      const p = entries[i];
      if (p.active && p.getWeaponKey() === weaponKey) n++;
    }
    return n;
  }

  /** How many more projectiles this weapon may spawn this frame (readability cap). */
  private maxExtraProjectilesThisFrame(weaponKey: string, desired: number): number {
    const cap = BALANCE.weapons.maxSimultaneousProjectilesPerWeapon;
    const cur = this.countActiveProjectilesForWeapon(weaponKey);
    return Math.max(0, Math.min(desired, cap - cur));
  }

  /** Apply spinning/pulsing visual to a freshly fired projectile based on its texture. */
  private applyProjectileVisual(proj: Projectile, texture: string): void {
    const body = proj.body as Phaser.Physics.Arcade.Body;
    if (texture === 'caber') {
      body.setAllowRotation(true);
      body.setAngularVelocity(720);
    } else if (texture === 'thistle') {
      this.scene.tweens.add({
        targets: proj, scaleX: 1.15, scaleY: 1.15,
        duration: 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    } else if (texture === 'haggis_ball') {
      body.setAllowRotation(true);
      body.setAngularVelocity(540);
    }
  }

  private getProjectile(texture: string): Projectile | null {
    let proj = this.projectilePool.getFirstDead(false) as Projectile | null;
    if (!proj) {
      if (this.projectilePool.getLength() >= BALANCE.weapons.projectilePoolMax) {
        // Pool exhausted — weapon fires but produces no projectile.
        // Emit event so HUD/JuiceSystem can show feedback.
        this.events.emit('projectileDropped');
        if (import.meta.env.DEV) {
          const now = performance.now();
          if (now - this.lastPoolWarnTime > 5000) {
            this.lastPoolWarnTime = now;
            console.warn(`[WeaponSystem] projectile pool exhausted (${BALANCE.weapons.projectilePoolMax}/${BALANCE.weapons.projectilePoolMax})`);
          }
        }
        return null;
      }
      proj = new Projectile(this.scene);
      this.projectilePool.add(proj);
    }
    // Dev warning when pool is >80% utilized
    if (import.meta.env.DEV) {
      const usage = this.projectilePool.countActive(true);
      if (usage > BALANCE.weapons.projectilePoolMax * 0.8) {
        const now = performance.now();
        if (now - this.lastPoolWarnTime > 5000) {
          this.lastPoolWarnTime = now;
          console.warn(`[WeaponSystem] projectile pool >80%: ${usage}/${BALANCE.weapons.projectilePoolMax}`);
        }
      }
    }
    proj.setTexture(texture);
    return proj;
  }

  /** Build sorted-by-distance cache of active enemies. Called once per update(). */
  private buildEnemyCache(px: number, py: number): void {
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    const sorted = this.cachedSortedEnemies;
    const distSq = this.cachedSortedDistSq;
    let count = 0;

    for (let i = 0, len = enemies.length; i < len; i++) {
      const e = enemies[i];
      if (!e.active) continue;
      const dx = e.x - px, dy = e.y - py;
      sorted[count] = e;
      distSq[count] = dx * dx + dy * dy;
      count++;
    }
    // Truncate stale tail entries
    sorted.length = count;
    distSq.length = count;

    // Insertion sort — nearly sorted in practice (enemies don't teleport),
    // so this beats Array.sort's overhead for typical counts.
    for (let i = 1; i < count; i++) {
      const dSq = distSq[i];
      const enemy = sorted[i];
      let j = i - 1;
      while (j >= 0 && distSq[j] > dSq) {
        distSq[j + 1] = distSq[j];
        sorted[j + 1] = sorted[j];
        j--;
      }
      distSq[j + 1] = dSq;
      sorted[j + 1] = enemy;
    }
  }

  private ensureEnemyCache(): void {
    if (this.enemyCacheFrame === this.frameCounter) return;
    this.enemyCacheFrame = this.frameCounter;
    this.buildEnemyCache(this.cachePlayerX, this.cachePlayerY);
  }

  private findClosestEnemy(_fromX: number, _fromY: number, maxRange: number): Enemy | null {
    this.ensureEnemyCache();
    const maxRangeSq = maxRange * maxRange;
    const sorted = this.cachedSortedEnemies;
    const distSq = this.cachedSortedDistSq;
    for (let i = 0, len = sorted.length; i < len; i++) {
      if (distSq[i] > maxRangeSq) break;
      return sorted[i];
    }
    return null;
  }

  private onProjectileHitEnemy(
    projObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    if (this.destroyed || !this.scene?.sys?.isActive()) return;
    const proj = projObj as Projectile;
    const enemy = enemyObj as Enemy;
    if (!proj.active || !enemy.active) return;

    // Check if this hit should be processed (bouncing projectiles track per-enemy hits)
    if (proj.shouldSkipHit(enemy)) return;

    this.dealDamageToEnemy(enemy, proj.getDamage(), proj.isCrit(), proj.getWeaponKey() || 'unknown');

    // Caber Toss applies burn (3 dps for 3s)
    if (proj.getWeaponKey() === 'caber_toss') {
      enemy.applyBurn(3, 3000);
    }

    proj.onHitEnemy();
  }

  hasWeapon(key: string): boolean {
    return this.weapons.some(w => w.config.key === key);
  }

  /** Replace loadout from a saved run (default starter is restored if list is empty). */
  replaceWeaponsFromRun(
    slots: { key: string; level: number; evolved: boolean; evolutionKey: string }[]
  ): void {
    this.weapons = [];
    for (const s of slots) {
      if (!WEAPON_DEFS[s.key as import('../data/weapons').WeaponKey]) continue;
      if (!this.addWeapon(s.key)) continue;
      for (let lv = 2; lv <= Math.max(1, s.level); lv++) {
        this.levelUpWeapon(s.key);
      }
      if (s.evolved && s.evolutionKey) {
        this.evolveWeapon(s.key, s.evolutionKey);
      }
    }
    if (this.weapons.length === 0) {
      this.addWeapon('thistle_shot');
    }
  }

  getWeapons(): ActiveWeapon[] {
    return this.weapons;
  }

  /**
   * V2 Track 3 — number of currently-held weapons that have fired their
   * evolution (reached evolved form via chest). Read by the run-end
   * recorder to decide the Burns's Wee Beastie unlock.
   */
  getEvolvedWeaponCount(): number {
    return this.weapons.reduce((n, w) => (w.evolved ? n + 1 : n), 0);
  }

  getProjectileGroup(): Phaser.GameObjects.Group {
    return this.projectilePool;
  }
}
