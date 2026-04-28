import * as Phaser from 'phaser';
import { getSettingsManager } from '../core/SettingsManager';
import { tryCameraShake } from '../utils/cameraShake';
import { EnemyConfig, EnemyBehavior } from '../data/enemies';
import { COLORS, COLORS_CSS, ENEMIES, GAME } from '../config';
import { ISceneContext } from '../core/ISceneContext';
import { BALANCE } from '../core/BalanceConfig';
import {
  AFFIX_VOLATILE_RADIUS,
  AFFIX_VOLATILE_SPLASH_DAMAGE,
  AFFIX_BULWARK_HP_MULT,
  AFFIX_RELENTLESS_KNOCKBACK_MUL,
  AFFIX_SWIFT_SPEED_MULT,
  AFFIX_WEALTHY_XP_MULT,
  ELITE_AFFIXES,
  pickEliteAffixId,
  type EliteAffixId,
} from '../data/eliteAffixes';
import { isEnemySpatialPhysicsCulled } from '../core/spatialCull';
import { isDiveOffscreen } from './isDiveOffscreen';
import { numberToCssColor } from '../utils/colorFormat';
import { TWEEN_ONE_SHOT_PULSE } from '../utils/tweenPresets';
import { globalEventBus } from '../core/GlobalEventBus';
import { t } from '../core/i18n';
import { audio } from '../systems/AudioSystem';
import { AnimationController } from '../animation/AnimationController';
import type { AnimationSignals } from '../animation/animationStates';
import { isEnemyAnimated } from '../animation/frameDrawers/enemies/enemyFrameRegistry';

// Mini HP bar above enemies: dark backing + red/gold fill. Colours used
// in both the standard setup path and the elite upgrade path, so pinning
// them here stops the two call sites from drifting apart.
const ENEMY_HP_BAR_BG = 0x333333;
const ELITE_GOLD_TINT = 0xffdd44;

/**
 * Enemy sprite — poolable, supports multiple behavior types.
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  /** Cached settings flag — set once at scene start via Enemy.refreshSettings(). */
  static reduceParticles: boolean = false;

  /** Refresh cached settings (call at scene start and on settings change). */
  static refreshSettings(): void {
    Enemy.reduceParticles = getSettingsManager().load().reduceParticles;
  }

  /** Pre-baked rotation matrix for `behaviorFlank`. The blend `b = 0.42`
   *  produces a fixed strafe angle `θ = atan2(b, 1−b)`; `(c, s)` are the
   *  normalized rotation components. Computed once at module load so the
   *  hot path does no per-frame trig. */
  private static readonly FLANK_ROT_C = (1 - 0.42) / Math.hypot(1 - 0.42, 0.42);
  private static readonly FLANK_ROT_S = 0.42 / Math.hypot(1 - 0.42, 0.42);

  private ctx: ISceneContext;
  private ctxScene: Phaser.Scene & ISceneContext;
  private hp: number = 0;
  private maxHp: number = 0;
  private speed: number = 0;
  private damage: number = 0;
  private xpValue: number = 0;
  private enemyKey: string = '';
  private behavior: EnemyBehavior = 'chase';
  /** Dense swarms that must keep simulating when off-screen. */
  private spatialCullImmune: boolean = false;
  private bossFlag: boolean = false;
  private eliteFlag: boolean = false;
  /** Phase B Endless — purple-aura "Cursed" variant; +40% damage; non-boss. */
  private cursedFlag: boolean = false;
  /** After markAsElite — at most one affix per elite. */
  private eliteAffixId: EliteAffixId | null = null;
  /** Multiplier on incoming knockback impulses (Relentless < 1). */
  private knockbackTakenMul: number = 1;

  /**
   * M1 F1+F2 — wave tag stamped by `SpawnSystem.forceSpawn({ waveTag })`
   * when the enemy is spawned as part of a node (encounter or elite).
   * Cleared on every `spawn()` so pool re-acquire wipes stale identity;
   * `NodeWaveTracker` uses tag-identity to distinguish same-object
   * re-use from still-alive membership.
   */
  public nodeWaveTag: string | null = null;

  /** Dive enemies lock their angle on spawn and don't re-aim */
  private diveAngle: number = 0;
  private diveStarted: boolean = false;

  /** Persistent tint color to restore after damage flash (bosses = red, hazards = orange) */
  private baseTint: number = 0;
  private enraged: boolean = false;
  private phase2Done: boolean = false;

  /** Ranged enemies track distance to maintain standoff */
  private rangedCooldown: number = 0;
  private readonly RANGED_STANDOFF = BALANCE.enemy.rangedStandoffPx;

  /** Orbit enemies circle the player */
  private orbitAngle: number = 0;
  private readonly ORBIT_RADIUS = BALANCE.enemy.orbitRadiusPx;

  /** Flee enemies run away but with wool armor */
  private woolArmor: number = 0;

  /** Spawner enemies summon minions periodically */
  private spawnerCooldown: number = 0;
  /** Guard against same-frame double-fire of chemical explosion synergy */
  private chemicalExplosionFired: boolean = false;

  /** Phase enemies toggle between solid and intangible */
  private phaseTimer: number = 0;
  private isPhased: boolean = false;

  /**
   * Three-Bay Warning state — Cu Sith signature behaviour.
   *  0 = approaching (chase at base speed until within trigger radius).
   *  1, 2 = pre-charge bays — pause for hool, no movement.
   *  3 = charging — sprint at 3× speed toward last-known player position.
   *  4 = post-charge cooldown / chase fallback.
   */
  private threeBayStage: 0 | 1 | 2 | 3 | 4 = 0;
  /** Countdown ms within the current three-bay stage. */
  private threeBayTimerMs: number = 0;
  /** Charge target locked at start of stage 3. */
  private threeBayChargeTargetX: number = 0;
  private threeBayChargeTargetY: number = 0;

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
  /** Deferred recomputeSpeed — set by status ticks, flushed once at end of tickStatusEffects. */
  private speedDirty: boolean = false;
  private piperBuffCooldown: number = 0;

  /** Knockback impulse — overrides behavior-set velocity for a brief window so
   *  pushes actually push (behaviorChase overwrites velocity every frame
   *  otherwise, which made all additive `body.velocity +=` knockbacks invisible). */
  private knockbackVx: number = 0;
  private knockbackVy: number = 0;
  private knockbackTimer: number = 0;
  private knockbackTrailAccum: number = 0;

  /** Display scale anchor — set whenever the enemy's "base" visual size
   *  should change (elite 1.3×, boss 2.0-3.0×, enraged hazard 1.5×). The
   *  idle bob reads this and wobbles around it, so bob no longer wipes
   *  boss/elite scale. */
  private baseDisplayScale: number = 1;

  /** Mini HP bar for tanky enemies */
  private hpBarBg: Phaser.GameObjects.Rectangle | null = null;
  private hpBarFill: Phaser.GameObjects.Rectangle | null = null;
  private showHpBar: boolean = false;
  /** Affix name above the bar — created when `applyEliteAffix` runs. */
  private eliteAffixNameText: Phaser.GameObjects.Text | null = null;
  /** Soft ground shadow that follows the sprite */
  private shadow: Phaser.GameObjects.Image | null = null;
  /** Idle bob phase — each enemy gets a random offset so they don't bob in lockstep */
  private bobPhase: number = 0;
  /** Animation controller for texture-swap animation. Null for non-animated enemies. */
  private animController: AnimationController | null = null;
  /** Consumed-once flag for hurt animation edge. */
  private hurtEdgeThisFrame: boolean = false;

  private hazardTtlHandle: import('../utils/UpdateTickers').TickerHandle | null = null;
  private damageTintHandle: import('../utils/UpdateTickers').TickerHandle | null = null;
  private activeNetCleanup: (() => void) | null = null;

  constructor(scene: Phaser.Scene & ISceneContext, x: number, y: number) {
    super(scene, x, y, 'tourist');
    this.ctxScene = scene;
    this.ctx = scene;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
  }

  /**
   * Acquire a pooled enemy or grow the group. Phaser's Group.add() is a no-op
   * when isFull(), which would otherwise leave a stray active sprite outside
   * the pool and under-count toward MAX_ACTIVE.
   */
  static acquireFromPool(pool: Phaser.GameObjects.Group, scene: Phaser.Scene & ISceneContext): Enemy | null {
    let enemy = pool.getFirstDead(false) as Enemy | null;
    if (enemy) return enemy;
    if (pool.countActive(true) >= ENEMIES.MAX_ACTIVE) return null;
    enemy = new Enemy(scene, 0, 0);
    const lenBefore = pool.getLength();
    pool.add(enemy);
    if (pool.getLength() === lenBefore) {
      enemy.destroy();
      return null;
    }
    return enemy;
  }

  spawn(x: number, y: number, config: EnemyConfig, gameTimeSec: number): void {
    // Cancel any scheduled effects from a previous pool cycle.
    this.hazardTtlHandle?.cancel();
    this.hazardTtlHandle = null;
    this.damageTintHandle?.cancel();
    this.damageTintHandle = null;
    this.activeNetCleanup?.();
    this.activeNetCleanup = null;
    this.setPosition(x, y);
    this.setTexture(config.texture);
    if (config.texture === 'boss') {
      console.warn(`Enemy "${config.key}" is using the generic boss fallback texture. Add a dedicated texture in BootScene.`);
    }
    this.setActive(true);
    this.setVisible(true);
    this.baseDisplayScale = 1;
    this.setScale(1);
    this.setFlipX(false);
    this.setRotation(0); // dive enemies set rotation; clear for pool reuse
    this.clearTint();
    this.nodeWaveTag = null;

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
    const puff = this.ctx.getStatusFxPool().acquireArc(x, y, 12, 0xaaaaaa, 0.3);
    this.scene.tweens.add({
      targets: puff, radius: 20, alpha: 0, duration: 200,
      onComplete: () => puff.setVisible(false),
    });

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setCollideWorldBounds(false);
    body.setBounce(0, 0);

    // Size hitbox based on texture. Bigger sprites (BootScene v2) bumped most
    // canvases by ~1.5×, so radii here bump proportionally. Offset math uses
    // this.width/this.height so it tracks whichever texture is assigned.
    const r = config.key === 'tour_bus' ? 42
      : config.key === 'gordon' ? 30
      : config.key === 'the_laird' ? 28
      : config.key === 'hunter_general' ? 28
      : config.key === 'taxman' ? 30
      : config.texture.startsWith('boss') ? 32
      : config.key === 'highland_cow' ? 26
      : config.key === 'midge' ? 12
      : config.key === 'midgie_swarm' ? 10
      : config.key === 'kelpie' ? 14
      : config.key === 'sheep' ? 13
      : config.key === 'eagle' ? 19
      : config.key === 'deep_fryer' ? 20
      : config.key === 'nest' ? 16
      : config.key === 'ghost' ? 16
      : 20; // default — tourist/chef/hunter/scotsman/piper
    body.setCircle(r, this.width / 2 - r, this.height / 2 - r);

    this.enemyKey = config.key;
    this.spatialCullImmune = Boolean(config.spatialCullImmune);
    this.speed = config.speed;
    this.baseSpeed = config.speed;
    this.damage = config.damage;
    this.xpValue = config.xpValue;
    this.behavior = config.behavior;
    this.bossFlag = false;
    this.eliteFlag = false;
    this.cursedFlag = false;
    this.eliteAffixId = null;
    this.eliteAffixNameText?.setVisible(false);
    this.knockbackTakenMul = 1;
    this.baseTint = 0;
    this.diveStarted = false;
    this.rangedCooldown = 0;
    this.enraged = false;
    this.phase2Done = false;
    this.orbitAngle = Math.random() * Math.PI * 2;
    this.piperBuffCooldown = 0;
    this.burnDamage = 0; this.burnTimer = 0; this.burnTickAccum = 0;
    this.freezeTimer = 0; this.freezeSpeedMul = 1;
    this.berserkerSpeedMul = 1;
    this.buffSpeedMul = 1;
    this.buffSpeedTimer = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
    this.knockbackTimer = 0;
    this.knockbackTrailAccum = 0;
    this.speedDirty = false;
    this.poisonDamage = 0; this.poisonTimer = 0; this.poisonTickAccum = 0;
    this.chemicalExplosionFired = false;
    this.hurtEdgeThisFrame = false;
    this.woolArmor = config.key === 'sheep' ? 1 : 0;
    // Reset spawner cooldown: nests fire a first midge quickly (500ms)
    // so they matter even if killed soon after spawn, then 4s cycles after
    this.spawnerCooldown = config.behavior === 'spawner'
      ? BALANCE.enemy.spawnerWarmupMs
      : BALANCE.enemy.spawnerIntervalMs;
    // Reset Ghost phase state — if a Ghost died mid-phase, the next
    // recycled enemy would inherit invisibility + projectile-immunity
    this.phaseTimer = BALANCE.enemy.phaseToggleMs;
    this.isPhased = false;
    body.checkCollision.none = false;

    // Random idle-bob phase so a pack of enemies doesn't visually pulse in sync
    this.bobPhase = Math.random() * Math.PI * 2;

    // Animation controller — only for enemies with authored frame drawers.
    // Non-animated enemies keep static texture + bobPhase wobble.
    if (isEnemyAnimated(config.key)) {
      this.animController = new AnimationController({
        sprite: this,
        subject: config.key,
        variant: null,
      });
    } else {
      this.animController = null;
    }

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
      this.hazardTtlHandle = this.ctx.getUpdateTickers().addOnce('scaled', BALANCE.enemy.hazardTtlMs, () => {
        if (this.active && this.behavior === 'hazard') {
          this.scene.tweens.add({
            targets: this, alpha: 0, duration: 500,
            onComplete: () => this.die(),
          });
        }
      });
    }

    // Tanks resist knockback via higher mass. Individual enemies can
    // opt-in to a custom mass via `EnemyConfig.massOverride` for
    // signature collision feel (e.g. gale_wraith's shove-on-contact).
    if (config.massOverride !== undefined) {
      body.mass = config.massOverride;
    } else if (this.behavior === 'tank') {
      body.mass = 5;
    } else {
      body.mass = 1;
    }

    // Show mini HP bar for tanky enemies (HP > 15), but NOT invincible hazards.
    // Bosses use the HUD's centered boss bar instead (set after spawn via markAsBoss).
    this.showHpBar = config.hp >= 15 && config.behavior !== 'hazard';
    if (this.showHpBar) {
      if (!this.hpBarBg) {
        this.hpBarBg = this.scene.add.rectangle(0, 0, 24, 3, ENEMY_HP_BAR_BG).setDepth(30);
        this.hpBarFill = this.scene.add.rectangle(0, 0, 24, 3, COLORS.HP_RED).setOrigin(0, 0.5).setDepth(31);
      }
      this.hpBarBg.setVisible(true).setPosition(this.x, this.y - 20);
      this.hpBarFill!.setVisible(true).setPosition(this.x - 12, this.y - 20);
      this.hpBarFill!.setFillStyle(COLORS.HP_RED); // Reset to red (may have been gold from prior elite cycle)
      this.hpBarFill!.width = 24;
    } else {
      this.hpBarBg?.setVisible(false);
      this.hpBarFill?.setVisible(false);
    }
  }

  /** Re-enable Arcade body after off-screen culling — keeps hitbox aligned with the sprite. */
  private ensureSpatialPhysicsActive(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body.enable) {
      body.enable = true;
      body.reset(this.x, this.y);
      body.setCollideWorldBounds(false);
    }
  }

  /**
   * Cheap drift toward the player while physics is disabled (far outside camera).
   * Skips behavior AI, bob, and overlap checks until the enemy re-enters the margin.
   */
  private applySpatiallyCulledFrame(targetX: number, targetY: number, delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    body.setVelocity(0, 0);

    const step = delta / 1000;

    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= delta;
      const k = Math.max(0, this.knockbackTimer / 150);
      this.setPosition(
        this.x + this.knockbackVx * k * step,
        this.y + this.knockbackVy * k * step
      );
      if (this.knockbackTimer <= 0) {
        this.knockbackVx = 0;
        this.knockbackVy = 0;
      }
      return;
    }

    // Geometric drift — `dx/dist`, `dy/dist` give the same unit step as
    // `cos(atan2(dy,dx))`, `sin(atan2(dy,dx))` without any trig calls.
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-6) return;
    const stepLen = (this.speed * step) / dist;
    this.setPosition(this.x + dx * stepLen, this.y + dy * stepLen);
  }

  /** Update movement toward the player. Called by SpawnSystem each frame. */
  chaseTarget(targetX: number, targetY: number, delta: number = 16): void {
    if (!this.active) return;

    // Tick status effects (burn/freeze/poison)
    this.tickStatusEffects(delta);
    if (!this.active) return; // May have died from DoT

    const cam = this.scene.cameras.main;
    const wv = cam.worldView;
    const spatialCull = isEnemySpatialPhysicsCulled(
      this.x,
      this.y,
      wv,
      BALANCE.spatial.cullMarginPx,
      this.bossFlag,
      this.behavior,
      this.spatialCullImmune
    );

    // Update HP bar position
    if (this.showHpBar && this.hpBarBg && this.hpBarFill) {
      this.hpBarBg.setPosition(this.x, this.y - 20);
      this.hpBarFill.setPosition(this.x - 12, this.y - 20);
      this.hpBarFill.width = 24 * (this.maxHp > 0 ? this.hp / this.maxHp : 0);
    }
    if (this.eliteAffixId && this.eliteAffixNameText) {
      this.eliteAffixNameText.setPosition(this.x, this.y - 22);
    }

    // Ground shadow follows the sprite (shadow stays flat — doesn't bob).
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y + this.height * this.scaleY * 0.35);
    }

    if (spatialCull) {
      this.applySpatiallyCulledFrame(targetX, targetY, delta);
      return;
    }

    this.ensureSpatialPhysicsActive();

    // Animated enemies: tick the animation controller for texture-swap.
    // Non-animated enemies: keep the legacy scaleY bob.
    if (this.animController) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      const signals: AnimationSignals = {
        velocityMag: Math.hypot(body.velocity.x, body.velocity.y),
        hurtEdge: this.hurtEdgeThisFrame,
        attackEdge: false,
        celebrateEdge: false,
        hp: this.hp,
      };
      this.hurtEdgeThisFrame = false;
      this.animController.tick(delta, signals);
    } else if (this.behavior !== 'hazard' && this.behavior !== 'spawner') {
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

      // Faint trail during knockback — sells the push visually (pooled)
      this.knockbackTrailAccum += delta;
      if (this.knockbackTrailAccum >= 50 && this.scene && !Enemy.reduceParticles) {
        this.knockbackTrailAccum = 0;
        const dot = this.ctx.getStatusFxPool().acquireArc(this.x, this.y, 3, this.baseTint || 0xcc4444, 0.15);
        dot.setDepth(-1);
        this.scene.tweens.add({
          targets: dot, alpha: 0, scale: 0.3, duration: 200,
          onComplete: () => dot.setVisible(false),
        });
      }

      if (this.knockbackTimer <= 0) {
        this.knockbackVx = 0;
        this.knockbackVy = 0;
        this.knockbackTrailAccum = 0;
      }
      // Tick behavior-specific state-machine timers that would otherwise
      // freeze while behavior is skipped. Without this, a ghost hit by
      // repeated AoE knockback would stay phased indefinitely, and a
      // ranged enemy's firing cooldown would drift.
      if (this.behavior === 'phase') {
        this.phaseTimer -= delta;
        if (this.phaseTimer <= 0) {
          this.phaseTimer = BALANCE.enemy.phaseToggleMs;
          this.isPhased = !this.isPhased;
          this.spawnPhasePuff();
          this.scene?.tweens.add({ targets: this, alpha: this.isPhased ? 0.3 : 1, duration: 120 });
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
      case 'flank':
        this.behaviorFlank(targetX, targetY);
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
      case 'three_bay':
        this.behaviorThreeBay(targetX, targetY, delta);
        break;
    }
  }

  /**
   * Cu Sith Three-Bay Warning. Approaches the player at base speed.
   * On reaching `THREE_BAY_TRIGGER_PX` (250 px), pauses for three
   * "hools" — each ~1500 ms — then locks the player's position and
   * charges at 3× speed for ~1500 ms before reverting to chase.
   *
   * Killing the Cu Sith mid-bay cancels everything; the threat is
   * the charge, and the charge needs all three bays to land. The
   * player's window is the bay-and-a-half they get warned during.
   *
   * Stage timing is on the per-frame `delta` (gameplay time) so
   * slow-motion + pause behave the same as other behaviours.
   */
  private behaviorThreeBay(tx: number, ty: number, delta: number): void {
    const THREE_BAY_TRIGGER_PX = 250;
    const HOOL_DURATION_MS = 1500;
    const CHARGE_DURATION_MS = 1500;
    const CHARGE_SPEED_MUL = 3;

    if (this.threeBayStage === 0) {
      // Approach phase — chase at base speed until inside trigger radius.
      const dx = tx - this.x;
      const dy = ty - this.y;
      const distSq = dx * dx + dy * dy;
      if (distSq <= THREE_BAY_TRIGGER_PX * THREE_BAY_TRIGGER_PX) {
        this.threeBayStage = 1;
        this.threeBayTimerMs = HOOL_DURATION_MS;
        this.setVelocity(0, 0);
        // First bay — fires the moment the trigger radius is crossed.
        globalEventBus.emit('CU_SITH_BAY', { stage: 1, x: this.x, y: this.y });
      } else {
        this.setVelocityToward(tx, ty, this.speed);
      }
      return;
    }

    if (this.threeBayStage === 1 || this.threeBayStage === 2) {
      // Pre-charge bays — frozen in place, telegraphing.
      this.setVelocity(0, 0);
      this.threeBayTimerMs -= delta;
      if (this.threeBayTimerMs <= 0) {
        const next = (this.threeBayStage + 1) as 2 | 3;
        this.threeBayStage = next;
        this.threeBayTimerMs = next === 3 ? CHARGE_DURATION_MS : HOOL_DURATION_MS;
        if (next === 3) {
          // Lock player position at charge start so the player can side-
          // step the third bay if they read it.
          this.threeBayChargeTargetX = tx;
          this.threeBayChargeTargetY = ty;
        }
        // Bay 2 fires when stage moves 1→2; bay 3 fires when stage 2→3
        // (charge lock-on coincides with third bay).
        globalEventBus.emit('CU_SITH_BAY', { stage: next, x: this.x, y: this.y });
      }
      return;
    }

    if (this.threeBayStage === 3) {
      // Charge phase — sprint toward the locked target. The locked
      // target can be sidestepped by a quick player; the third hool
      // is the warning, the lock-on is the read.
      this.setVelocityToward(
        this.threeBayChargeTargetX,
        this.threeBayChargeTargetY,
        this.speed * CHARGE_SPEED_MUL,
      );
      this.threeBayTimerMs -= delta;
      if (this.threeBayTimerMs <= 0) {
        this.threeBayStage = 4;
      }
      return;
    }

    // Stage 4 — post-charge fallback to ordinary chase. The Cu Sith
    // doesn't re-trigger; one warning per encounter.
    this.setVelocityToward(tx, ty, this.speed);
  }

  /**
   * Steer toward (tx, ty) at `speed`. Geometric substitution: instead of
   * `atan2 → cos → sin → multiply by speed` (3 transcendentals per call),
   * we normalize the displacement vector directly — `dx/dist`, `dy/dist`
   * are *exactly* `cos(angle)`, `sin(angle)` of the same angle, so the
   * trig round-trip is mathematically redundant. One sqrt replaces three
   * transcendentals at ~5–10× the speed; called per-enemy per-frame on
   * 300+ enemies, this is the single biggest win in the chase loop.
   *
   * Negative `speed` flees: it inverts both components so the velocity
   * points away from the target. `dist < 1e-6` is the degenerate
   * "standing on the player" case — fall back to zero rather than emit
   * NaN from a divide-by-zero.
   */
  private setVelocityToward(tx: number, ty: number, speed: number): void {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-6) { this.setVelocity(0, 0); return; }
    const inv = speed / dist;
    this.setVelocity(dx * inv, dy * inv);
  }

  private behaviorChase(tx: number, ty: number): void {
    this.setVelocityToward(tx, ty, this.speed);
  }

  /** Blend chase with perpendicular strafe so the enemy tries to circle the
   *  player. The blend `b = 0.42` produces a fixed rotation of the
   *  toward-player unit vector by `θ = atan2(b, 1−b)` ≈ 35.9°. We pre-bake
   *  the rotation matrix entries so the per-frame call is a normalize
   *  plus a 2×2 matrix multiply — no trig at all. */
  private behaviorFlank(tx: number, ty: number): void {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-6) { this.setVelocity(0, 0); return; }
    const inv = this.speed / dist;
    const ux = dx * inv;
    const uy = dy * inv;
    this.setVelocity(
      Enemy.FLANK_ROT_C * ux - Enemy.FLANK_ROT_S * uy,
      Enemy.FLANK_ROT_S * ux + Enemy.FLANK_ROT_C * uy,
    );
  }

  private behaviorTank(tx: number, ty: number): void {
    // Same as chase — high HP and low speed define the tank feel.
    this.setVelocityToward(tx, ty, this.speed);
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

    // Self-destruct if way off screen (account for camera zoom + world rect).
    if (isDiveOffscreen(
      this.x, this.y, this.scene.cameras.main,
      GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT,
      BALANCE.enemy.diveDespawnMarginPx,
    )) {
      this.die();
    }
  }

  private behaviorRanged(tx: number, ty: number, delta: number): void {
    // Single sqrt feeds three decisions: standoff bands + cooldown gate.
    // The unit components `(dx/dist, dy/dist)` are exactly `cos(angle), sin(angle)`
    // — no atan2 round-trip needed for the velocity write.
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    const standoff = this.RANGED_STANDOFF;

    if (dist < 1e-6) {
      this.setVelocity(0, 0);
    } else if (dist > standoff) {
      const inv = this.speed / dist;
      this.setVelocity(dx * inv, dy * inv);
    } else if (dist < standoff * 0.7) {
      const inv = -this.speed / dist;
      this.setVelocity(dx * inv, dy * inv);
    } else {
      // Strafe perpendicular at half speed: rotating (dx,dy) by +π/2 sends
      // (cos, sin) → (-sin, cos), which is just (-dy, dx) on the geometric vector.
      const inv = (this.speed * 0.5) / dist;
      this.setVelocity(-dy * inv, dx * inv);
    }

    // Fire a "net" (slowing projectile) at the player on cooldown
    this.rangedCooldown -= delta;
    if (this.rangedCooldown <= 0 && dist <= standoff * 1.5) {
      this.rangedCooldown = BALANCE.enemy.rangedCooldownMs;
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
    const spawnedPlayer = this.ctx.getPlayer();

    const cleanup = () => {
      if (hit) return;
      hit = true;
      if (this.activeNetCleanup === cleanup) this.activeNetCleanup = null;
      try {
        this.scene.physics.world.removeCollider(overlapRef);
        if (net.active) net.destroy();
      } catch { /* scene may have restarted */ }
    };
    this.activeNetCleanup?.();
    this.activeNetCleanup = cleanup;

    const overlapRef = this.scene.physics.add.overlap(net, spawnedPlayer, () => {
      if (hit) return;
      cleanup();

      // Guard: only apply slow if this is still the same player (not a new run)
      const currentPlayer = this.ctx.getPlayer();
      if (currentPlayer !== spawnedPlayer) return;

      // Apply a game-tick net slow (duration freezes with timeScale/pause).
      spawnedPlayer.applyNetSlow(2000);
    });

    // Auto-cleanup after 2 seconds if it misses (raw = wall-clock, survives pause)
    this.ctx.getUpdateTickers().addOnce('raw', 2000, cleanup);
  }

  private behaviorOrbit(tx: number, ty: number, delta: number): void {
    // Circle the player at ORBIT_RADIUS distance. The orbit-angle cos/sin
    // is unavoidable (we're plotting a point on the orbit circle), but the
    // chase-to-orbit-target step uses the geometric form — one sqrt for
    // both the speed-clamp and the velocity write.
    this.orbitAngle += (this.speed / this.ORBIT_RADIUS) * (delta / 1000);
    const targetX = tx + Math.cos(this.orbitAngle) * this.ORBIT_RADIUS;
    const targetY = ty + Math.sin(this.orbitAngle) * this.ORBIT_RADIUS;
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-6) {
      this.setVelocity(0, 0);
    } else {
      const moveSpeed = Math.min(this.speed, dist * 2); // slow as approach target
      const inv = moveSpeed / dist;
      this.setVelocity(dx * inv, dy * inv);
    }

    this.piperBuffCooldown -= delta;
    if (this.piperBuffCooldown > 0) return;
    this.piperBuffCooldown = 250;

    const piperDx = this.x - tx;
    const piperDy = this.y - ty;
    if (piperDx * piperDx + piperDy * piperDy > 500 * 500) return;

    const BUFF_RANGE_SQ = 120 * 120;
    const enemies = this.ctx.getSpawnSystem().getEnemyGroup().getChildren() as Enemy[];
    for (const e of enemies) {
      if (!e.active || e === this || e.isBoss()) continue;
      const dx = this.x - e.x;
      const dy = this.y - e.y;
      if (dx * dx + dy * dy < BUFF_RANGE_SQ) {
        e.applySpeedBuff(1.3, 500);
      }
    }
  }

  private behaviorPhase(tx: number, ty: number, delta: number): void {
    // Chase the player
    this.setVelocityToward(tx, ty, this.speed);

    // Toggle phased state every 2 seconds
    this.phaseTimer -= delta;
    if (this.phaseTimer <= 0) {
      this.phaseTimer = BALANCE.enemy.phaseToggleMs;
      this.isPhased = !this.isPhased;
      this.spawnPhasePuff();
      this.scene?.tweens.add({ targets: this, alpha: this.isPhased ? 0.3 : 1, duration: 120 });
      // When phased, disable physics body so projectiles pass through
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (this.isPhased) {
        body.checkCollision.none = true;
      } else {
        body.checkCollision.none = false;
      }
    }
  }

  /** Subtle particle puff when ghost toggles phase state (pooled) */
  private spawnPhasePuff(): void {
    if (!this.scene || !this.active) return;
    if (Enemy.reduceParticles) return;
    const pool = this.ctx.getStatusFxPool();
    const color = this.isPhased ? 0xaaddff : 0x8899cc;
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + Math.random() * 0.5;
      const px = this.x + Math.cos(angle) * 6;
      const py = this.y + Math.sin(angle) * 6;
      const dot = pool.acquireArc(px, py, 2, color, 0.5);
      this.scene.tweens.add({
        targets: dot,
        x: px + Math.cos(angle) * 14,
        y: py + Math.sin(angle) * 14,
        alpha: 0, scale: 0.3, duration: 200,
        onComplete: () => dot.setVisible(false),
      });
    }
  }

  private behaviorSpawner(delta: number): void {
    // Stationary — summon a midge on spawnerCooldown interval
    this.setVelocity(0, 0);
    this.spawnerCooldown -= delta;
    if (this.spawnerCooldown <= 0) {
      this.spawnerCooldown = BALANCE.enemy.spawnerIntervalMs;
      const spawnSystem = this.ctx.getSpawnSystem();
      const pool = spawnSystem.getEnemyGroup();
      const minion = Enemy.acquireFromPool(pool, this.ctxScene);
      if (!minion) return;
      const angle = Math.random() * Math.PI * 2;
      const dist = 20;
      const midge = { key: 'midge', texture: 'midge', speed: 130, hp: 2, damage: 3, xpValue: 1, appearsAt: 0, behavior: 'swarm' as EnemyBehavior, packSize: 1 };
      // Pass current game time so spawned midges inherit HP/damage scaling
      const gameTime = spawnSystem.getGameTimeSec?.() ?? 0;
      minion.spawn(this.x + Math.cos(angle) * dist, this.y + Math.sin(angle) * dist, midge, gameTime);
    }
  }

  private behaviorFlee(tx: number, ty: number): void {
    // Run away from the player — negative speed inverts the toward-vector.
    this.setVelocityToward(tx, ty, -this.speed);
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
    if (this.burnTimer <= 0) this.chemicalExplosionFired = false;
    this.burnDamage = Math.max(this.burnDamage, dps); // Refresh, don't stack
    this.burnTimer = Math.max(this.burnTimer, durationMs);
    this.maybeFireChemicalExplosion();
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
    const m = this.knockbackTakenMul;
    this.knockbackVx = vx * m;
    this.knockbackVy = vy * m;
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
    if (this.poisonTimer <= 0) this.chemicalExplosionFired = false;
    this.poisonDamage += dps; // Stacks!
    this.poisonTimer = Math.max(this.poisonTimer, durationMs);
    this.maybeFireChemicalExplosion();
  }

  /** Synergy: Burn + Poison = Chemical Explosion (50 damage + 25 AoE).
   *  Called from both applyBurn and applyPoison so order of application
   *  doesn't change whether the synergy lands. */
  private maybeFireChemicalExplosion(): void {
    if (!(this.burnTimer > 0 && this.poisonTimer > 0 && !this.chemicalExplosionFired)) return;
    this.chemicalExplosionFired = true;
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
      const pool = this.ctx.getSpawnSystem().getEnemyGroup();
      const nearby = pool.getChildren() as Enemy[];
      const splashRadiusSq = 60 * 60;
      for (const e of nearby) {
        if (!e.active || e === this) continue;
        const dx = e.x - ex;
        const dy = e.y - ey;
        if (dx * dx + dy * dy <= splashRadiusSq) e.takeDamageWithKillEvents(25);
      }
    }
  }

  /** Public wrapper for status-effect AoE damage — ensures kill events fire */
  takeDamageInternalPublic(amount: number): boolean {
    return this.takeDamageInternal(amount);
  }

  /** Tick status effects — call each frame from chaseTarget */
  private tickStatusEffects(delta: number): void {
    const reduceParticles = Enemy.reduceParticles;
    const pool = this.ctx.getStatusFxPool();

    // Burn: periodic damage + orange tint
    if (this.burnTimer > 0) {
      this.burnTimer -= delta;
      this.burnTickAccum += delta;
      if (this.burnTickAccum >= 500) { // tick every 500ms
        this.burnTickAccum -= 500;
        const killed = this.takeDamageInternal(Math.ceil(this.burnDamage * 0.5));
        // Fire particle (pooled)
        if (this.active && !reduceParticles) {
          const spark = pool.acquireArc(
            this.x + Phaser.Math.Between(-8, 8),
            this.y + Phaser.Math.Between(-8, 8),
            2, 0xff6600, 0.8
          );
          this.scene.tweens.add({
            targets: spark, y: spark.y - 10, alpha: 0, duration: 300,
            onComplete: () => spark.setVisible(false),
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
      this.speedDirty = true;
      // baseTint is set for bosses/hazards/elites — don't clobber their persistent tints,
      // instead spawn a snowflake particle so the player still sees the freeze effect
      if (!this.baseTint) {
        this.setTint(0x6688ff);
      } else if (this.active && !reduceParticles && Math.random() < 0.08) {
        // Sprite-based snowflake (pooled)
        const flake = pool.acquireImage(
          this.x + Phaser.Math.Between(-10, 10), this.y - 12
        );
        this.scene.tweens.add({
          targets: flake, y: flake.y - 12, alpha: 0, duration: 500,
          onComplete: () => flake.setVisible(false),
        });
      }
      if (this.freezeTimer <= 0) {
        this.freezeSpeedMul = 1;
        this.speedDirty = true;
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
        // Poison bubble (pooled)
        if (this.active && !reduceParticles) {
          const bubble = pool.acquireArc(
            this.x + Phaser.Math.Between(-6, 6), this.y - 5,
            Phaser.Math.Between(1, 3), 0x44cc44, 0.7
          );
          this.scene.tweens.add({
            targets: bubble, y: bubble.y - 8, alpha: 0, scale: 0, duration: 400,
            onComplete: () => bubble.setVisible(false),
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
        this.speedDirty = true;
      }
    }

    // Flush deferred speed recomputation — at most once per frame per enemy
    if (this.speedDirty) {
      this.speedDirty = false;
      this.recomputeSpeed();
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
    if (!this.active) return false;
    this.hp -= amount;
    this.hurtEdgeThisFrame = true;
    if (this.hp <= 0) {
      const wasBoss = this.bossFlag;
      const wasElite = this.eliteFlag;
      const killX = this.x, killY = this.y;
      const xp = this.xpValue, key = this.enemyKey;
      this.die();
      this.emitKillEvents(killX, killY, xp, key, wasBoss, wasElite);
      return true;
    }
    return false;
  }

  private emitKillEvents(
    killX: number,
    killY: number,
    xp: number,
    key: string,
    wasBoss: boolean,
    wasElite: boolean
  ): void {
    const ws = this.ctx.getWeaponSystem();
    ws.events.emit(
      'enemyKilled',
      killX,
      killY,
      xp,
      key,
      wasBoss,
      wasElite,
      wasElite ? this.eliteAffixId : undefined,
    );
    globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
      enemyKey: key,
      xpValue: xp,
      wasBoss,
      wasElite,
      eliteAffixId: wasElite ? this.eliteAffixId : undefined,
    });
  }

  takeDamage(amount: number): boolean {
    if (this.behavior === 'hazard') return false; // invincible
    if (!this.active) return false; // already dead — volatile splash chains must not re-enter

    // Ghost: 50% damage resistance while phased (in addition to projectile pass-through)
    if (this.behavior === 'phase' && this.isPhased) {
      amount = Math.ceil(amount * 0.5);
    }

    // Wool armor absorbs one hit
    if (this.woolArmor > 0) {
      this.woolArmor--;
      this.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      this.damageTintHandle?.cancel();
      this.damageTintHandle = this.ctx.getUpdateTickers().addOnce('scaled', 80, () => {
        if (!this.active) return;
        this.clearTint();
        if (this.baseTint) this.setTint(this.baseTint);
      });
      return false;
    }

    this.hp -= amount;
    this.hurtEdgeThisFrame = true;
    if (this.hp <= 0) {
      this.die();
      return true;
    }

    // Berserker: speed increases as HP drops (up to 2x at 1 HP).
    // Writes to the multiplier (not this.speed) so it composes with freeze.
    if (this.enemyKey === 'berserker') {
      const hpFrac = this.getHpFraction();
      this.berserkerSpeedMul = 1 + (1 - hpFrac);
      this.recomputeSpeed();
    }

    // Boss phase 2 at 25% HP — summon 3 minions
    if (this.bossFlag && !this.phase2Done && this.hp <= this.maxHp * 0.25) {
      this.phase2Done = true;
      const spawnSystem = this.ctx.getSpawnSystem();
      const pool = spawnSystem.getEnemyGroup();
      for (let i = 0; i < 3; i++) {
        const minion = Enemy.acquireFromPool(pool, this.ctxScene);
        if (!minion) break;
        const a = (i / 3) * Math.PI * 2;
        const chef = { key: 'chef', texture: 'chef', speed: 100, hp: 8, damage: 8, xpValue: 3, appearsAt: 0, behavior: 'chase' as EnemyBehavior, packSize: 1 };
        // Use current game time so late-game phase-2 minions scale with the run
        const gameTime = spawnSystem.getGameTimeSec?.() ?? 0;
        minion.spawn(this.x + Math.cos(a) * 30, this.y + Math.sin(a) * 30, chef, gameTime);
        // Phase-2 minions respect the same elite gate as wave spawns — the
        // player has already learned what the gold glow means at minute 2,
        // and auto-eliting every minion gifted unintended XP + speed mid-boss.
        // Seeded so daily runs have consistent phase-2 composition.
        if (gameTime > BALANCE.enemy.ELITE_UNLOCK_SEC
            && this.ctx.getRunRng().bool(BALANCE.enemy.ELITE_SPAWN_CHANCE)) {
          minion.markAsElite();
          const ax = pickEliteAffixId(minion.getBehavior(), this.ctx.getRunRng());
          if (ax) minion.applyEliteAffix(ax);
        }
      }
      // Visual indicator
      tryCameraShake(this.scene.cameras.main, 150, 0.008, getSettingsManager());
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
      tryCameraShake(this.scene.cameras.main, 400, 0.02, getSettingsManager());

      // Dramatic enrage spectacle — expanding red ring + scale pulse + particles (pooled)
      if (this.scene) {
        const enragePool = this.ctx.getStatusFxPool();
        // Expanding red ring
        const ring = enragePool.acquireArc(this.x, this.y, 10, 0xff2200, 0.7);
        this.scene.tweens.add({
          targets: ring, scaleX: 5, scaleY: 5, alpha: 0, duration: 350,
          ease: 'Cubic.easeOut', onComplete: () => ring.setVisible(false),
        });

        // Scale pulse — boss swells briefly then settles
        const origScale = this.baseDisplayScale;
        this.scene.tweens.add({
          targets: this, scaleX: origScale * 1.2, scaleY: origScale * 1.2,
          duration: 150, ...TWEEN_ONE_SHOT_PULSE,
        });

        // Red particles radiating outward
        const settings = getSettingsManager().load();
        const count = settings.reduceParticles ? 3 : 6;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const px = this.x + Math.cos(angle) * 8;
          const py = this.y + Math.sin(angle) * 8;
          const dot = enragePool.acquireArc(px, py, 3, 0xff4444, 0.8);
          this.scene.tweens.add({
            targets: dot,
            x: px + Math.cos(angle) * 40,
            y: py + Math.sin(angle) * 40,
            alpha: 0, scale: 0, duration: 300 + Math.random() * 150,
            onComplete: () => dot.setVisible(false),
          });
        }
      }

      // Notify GameScene for toast
      globalEventBus.emit('bossEnraged', this.enemyKey);
    }

    this.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.damageTintHandle?.cancel();
    this.damageTintHandle = this.ctx.getUpdateTickers().addOnce('scaled', 60, () => {
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

  /** External damage path that preserves kill-side effects when lethal. */
  takeDamageWithKillEvents(amount: number): boolean {
    if (!this.active) return false;
    const wasBoss = this.bossFlag;
    const wasElite = this.eliteFlag;
    const killX = this.x;
    const killY = this.y;
    const xp = this.xpValue;
    const key = this.enemyKey;
    const killed = this.takeDamage(amount);
    if (killed) this.emitKillEvents(killX, killY, xp, key, wasBoss, wasElite);
    return killed;
  }

  private die(): void {
    if (!this.active) return;

    const volatileSplash = this.eliteAffixId === 'volatile' && this.scene?.sys.isActive();
    if (volatileSplash) {
      this.ctx.getSFXManager().tryPlay('elite_volatile_death', () => audio.playEliteVolatileDeathImmediate());
    }

    // Mark dead before volatile splash: nested volatile deaths must not apply damage to
    // this instance again (would recurse: die → splash → neighbor.die → splash → this.die).
    this.setActive(false);
    this.setVisible(false);

    if (volatileSplash) {
      const pool = this.ctx.getSpawnSystem().getEnemyGroup();
      const nearby = pool.getChildren() as Enemy[];
      const r2 = AFFIX_VOLATILE_RADIUS * AFFIX_VOLATILE_RADIUS;
      for (const e of nearby) {
        if (!e.active || e === this) continue;
        const dx = e.x - this.x;
        const dy = e.y - this.y;
        if (dx * dx + dy * dy <= r2) {
          e.takeDamageWithKillEvents(AFFIX_VOLATILE_SPLASH_DAMAGE);
        }
      }
      const fx = this.ctx.getStatusFxPool();
      const ring = fx.acquireArc(this.x, this.y, 12, ELITE_AFFIXES.volatile.indicatorTint, 0.55);
      this.scene.tweens.add({
        targets: ring, scaleX: 5.5, scaleY: 5.5, alpha: 0, duration: 300,
        ease: 'Cubic.easeOut',
        onComplete: () => ring.setVisible(false),
      });
    }
    this.hazardTtlHandle?.cancel();
    this.hazardTtlHandle = null;
    this.damageTintHandle?.cancel();
    this.damageTintHandle = null;
    this.activeNetCleanup?.();
    this.activeNetCleanup = null;
    this.scene.tweens.killTweensOf(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.setVelocity(0, 0);
    this.hpBarBg?.setVisible(false);
    this.hpBarFill?.setVisible(false);
    this.eliteAffixNameText?.setVisible(false);
    this.shadow?.setVisible(false);
  }

  destroy(fromScene?: boolean): void {
    this.activeNetCleanup?.();
    this.activeNetCleanup = null;
    this.scene?.tweens.killTweensOf(this);
    this.hpBarBg?.destroy();
    this.hpBarFill?.destroy();
    this.eliteAffixNameText?.destroy();
    this.shadow?.destroy();
    this.hpBarBg = null;
    this.hpBarFill = null;
    this.eliteAffixNameText = null;
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

  /**
   * Scale HP and speed by post-bell multipliers. Applied AFTER `spawn` (and
   * after any elite upgrade) so the escalation stacks on top of the normal
   * difficulty curve instead of replacing it. Speed is baked into
   * `baseSpeed` so freeze/buff effects compose via `recomputeSpeed()`.
   */
  applyPostBellScaling(hpMul: number, speedMul: number): void {
    if (hpMul !== 1) {
      this.maxHp = Math.ceil(this.maxHp * hpMul);
      this.hp = this.maxHp;
    }
    if (speedMul !== 1) {
      this.baseSpeed = Math.ceil(this.baseSpeed * speedMul);
      this.recomputeSpeed();
    }
  }

  markAsBoss(): void {
    this.bossFlag = true;
    // Bosses use the HUD's centered boss bar — hide the mini HP bar
    this.showHpBar = false;
    this.hpBarBg?.setVisible(false);
    this.hpBarFill?.setVisible(false);
    this.eliteAffixNameText?.setVisible(false);
  }

  /** Make this enemy an elite variant — bigger, tougher, more rewarding.
   *  Idempotent: subsequent calls on an already-elite enemy are no-ops,
   *  preventing HP/scale from compounding if the same enemy is elite-marked
   *  twice through different code paths. */
  /**
   * Apply a single elite affix after `markAsElite()` — extra speed, HP,
   * knockback resist, XP, or death splash. Idempotent if already affixed.
   */
  applyEliteAffix(id: EliteAffixId): void {
    if (!this.eliteFlag || this.eliteAffixId !== null) return;
    this.eliteAffixId = id;
    switch (id) {
      case 'swift':
        this.baseSpeed = Math.ceil(this.baseSpeed * AFFIX_SWIFT_SPEED_MULT);
        this.recomputeSpeed();
        break;
      case 'bulwark':
        this.maxHp = Math.ceil(this.maxHp * AFFIX_BULWARK_HP_MULT);
        this.hp = this.maxHp;
        break;
      case 'relentless':
        this.knockbackTakenMul = AFFIX_RELENTLESS_KNOCKBACK_MUL;
        break;
      case 'wealthy':
        this.xpValue = Math.ceil(this.xpValue * AFFIX_WEALTHY_XP_MULT);
        break;
      case 'volatile':
        break;
      default:
        break;
    }
    this.ensureEliteAffixNameLabel();
    const tint = ELITE_AFFIXES[id].indicatorTint;
    const css = numberToCssColor(tint);
    this.eliteAffixNameText!
      .setText(t(`ui.elite_affix.${id}.name`))
      .setColor(css)
      .setPosition(this.x, this.y - 22)
      .setVisible(true);
    this.ctx.getTutorialSystem().notifyEliteAffixIfFirst(id);
    this.ctx.getSFXManager().tryPlay('elite_affix_spawn', () => audio.playEliteAffixSpawnImmediate(id));
  }

  /** World-space name tag — matches edge/minimap affix hue. */
  private ensureEliteAffixNameLabel(): void {
    if (this.eliteAffixNameText) return;
    const uiScale = getSettingsManager().load().uiScale;
    const px = Math.max(7, Math.round(10 * uiScale));
    this.eliteAffixNameText = this.scene.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: `${px}px`,
      fontStyle: 'bold',
      stroke: COLORS_CSS.BLACK,
      strokeThickness: 2,
    }).setDepth(32).setOrigin(0.5, 1);
  }

  getEliteAffixId(): EliteAffixId | null {
    return this.eliteAffixId;
  }

  /** Minimap / edge arrow tint; null = default elite gold only. */
  getEliteAffixIndicatorTint(): number | null {
    return this.eliteAffixId ? ELITE_AFFIXES[this.eliteAffixId].indicatorTint : null;
  }

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
    this.setBaseTint(ELITE_GOLD_TINT); // golden glow
    this.showHpBar = true;
    if (!this.hpBarBg) {
      this.hpBarBg = this.scene.add.rectangle(0, 0, 24, 3, ENEMY_HP_BAR_BG).setDepth(30);
      this.hpBarFill = this.scene.add.rectangle(0, 0, 24, 3, ELITE_GOLD_TINT).setOrigin(0, 0.5).setDepth(31);
    }
    this.hpBarBg!.setVisible(true);
    this.hpBarFill!.setVisible(true).setFillStyle(ELITE_GOLD_TINT);
  }

  isElite(): boolean { return this.eliteFlag; }

  /**
   * Phase B Endless — mark this enemy as a "Cursed" variant. Visually
   * distinct via a purple aura tint and slightly bumped scale; mechanically
   * +40% damage. Idempotent. Bosses, hazards, and already-elites are
   * filtered at the call site (SpawnSystem) — this method does not gate
   * itself so tests can opt enemies in directly.
   */
  markAsCursed(): void {
    if (this.cursedFlag) return;
    this.cursedFlag = true;
    this.damage = Math.ceil(this.damage * 1.4);
    // Soft purple base tint — composes with damage flash via clearTint
    // restore path. 0xaa66dd reads as cursed/spectral against the
    // existing palette without bleeding into rune (yellow) or boss (red).
    this.setBaseTint(0xaa66dd);
    // Subtle scale bump — bigger than baseline, smaller than elite, so a
    // cursed-non-elite reads as off without competing with elite gold.
    this.baseDisplayScale = this.baseDisplayScale * 1.1;
    this.setScale(this.baseDisplayScale);
  }

  isCursed(): boolean { return this.cursedFlag; }
}
