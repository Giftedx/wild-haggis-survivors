import * as Phaser from 'phaser';
import { getSettingsManager } from '../core/SettingsManager';
import { tryCameraShake } from '../utils/cameraShake';
import { EnemyConfig, EnemyBehavior, ENEMY_TYPES } from '../data/enemies';
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
import { simulateWailBehaviour, WAIL_PULSE_RADIUS_PX, WAIL_PULSE_DAMAGE, type WailState } from './wailBehaviour';
import { simulateCardDealBehaviour, CARD_DEAL_FAN_COUNT, CARD_DEAL_SPREAD_RAD, CARD_DEAL_SPEED, CARD_DEAL_DAMAGE, CARD_DEAL_RANGE_MS, type CardDealState } from './cardDealBehaviour';
import { simulateHushBehaviour, HUSH_RADIUS_PX, HUSH_DAMAGE, HUSH_SLOW_MS, HUSH_TELEGRAPH_MS, type HushState } from './hushBehaviour';
import {
  simulateStormCailleachBehaviour,
  initialStormCailleachState,
  STORM_HAAR_RADIUS_PX, STORM_HAAR_DAMAGE, STORM_HAAR_SLOW_MS,
  STORM_LANCE_COUNT, STORM_LANCE_SPREAD_RAD, STORM_LANCE_SPEED, STORM_LANCE_DAMAGE, STORM_LANCE_SLOW_MS,
  STORM_HAIL_COUNT, STORM_HAIL_SPEED, STORM_HAIL_DAMAGE, STORM_HAIL_SPREAD_RAD,
  type StormCailleachState,
} from './stormCailleachBehaviour';
import {
  simulateTwinStoneBehaviour,
  initialTwinStoneState,
  TWIN_RING_SHARD_COUNT, TWIN_RING_SHARD_SPEED, TWIN_RING_SHARD_DAMAGE,
  TWIN_FAN_SHARD_COUNT, TWIN_FAN_SHARD_SPEED, TWIN_FAN_SHARD_DAMAGE, TWIN_FAN_SPREAD_RAD,
  TWIN_SHADOW_ORBIT_RAD_PER_SEC, TWIN_SHADOW_ORBIT_RADIUS, TWIN_SHADOW_FLANK_DIST, TWIN_SHADOW_RING_DELAY_MS,
  type TwinStoneState,
} from './twinStoneBehaviour';
import {
  simulateWickerHaggisBehaviour,
  initialWickerHaggisState,
  WICKER_RING_SHARD_COUNT, WICKER_RING_SHARD_SPEED, WICKER_RING_SHARD_DAMAGE,
  WICKER_SCATTER_SHARD_COUNT, WICKER_SCATTER_SHARD_SPEED, WICKER_SCATTER_SHARD_DAMAGE,
  WICKER_SCATTER_INNER_SPREAD_RAD, WICKER_SCATTER_OUTER_SPREAD_RAD,
  WICKER_TRANSITION_SHARD_COUNT, WICKER_TRANSITION_SHARD_SPEED, WICKER_TRANSITION_SHARD_DAMAGE,
  type WickerHaggisState,
} from './wickerHaggisBehaviour';
import {
  simulateNessieBehaviour,
  initialNessieState,
  NESSIE_SWEEP_SHARD_COUNT, NESSIE_SWEEP_SHARD_SPEED, NESSIE_SWEEP_SHARD_DAMAGE, NESSIE_SWEEP_SPREAD_RAD,
  NESSIE_PLUNGE_SHARD_COUNT, NESSIE_PLUNGE_SHARD_SPEED, NESSIE_PLUNGE_SHARD_DAMAGE, NESSIE_PLUNGE_SPREAD_RAD,
  type NessieState,
} from './nessieBehaviour';
import {
  simulateAuldReekieBehaviour,
  initialAuldReekieState,
  LANTERN_SPEED, LANTERN_DAMAGE,
  TRIPLE_FAN_COUNT, TRIPLE_FAN_SPREAD_RAD,
  GAS_RADIUS_PX, GAS_DAMAGE, GAS_SLOW_MS,
  LAMP_ANCHOR_RADIUS_PX, LAMP_ANCHOR_RNG_JITTER,
  type AuldReekieState,
} from './auldReekieBehaviour';
import {
  simulateTaxmanGrudgeBehaviour,
  initialTaxmanGrudgeState,
  type TaxmanGrudgeState,
} from './taxmanGrudgeBehaviour';
import { judgeGrudge } from './grudgeLedger';
import {
  simulateStoorWormBehaviour,
  initialStoorWormState,
  STOOR_WORM_SCALE_LOCK_DR,
  type StoorWormState,
} from './stoorWormBehaviour';
import {
  simulateNinthLegionBehaviour,
  initialNinthLegionState,
  NINTH_LEGION_SHROUD_DR,
  NINTH_LEGION_WAVE_SIZE,
  NINTH_LEGION_REARGUARD_SIZE,
  type NinthLegionState,
} from './ninthLegionBehaviour';
import { numberToCssColor } from '../utils/colorFormat';
import { TWEEN_ONE_SHOT_PULSE } from '../utils/tweenPresets';
import { globalEventBus } from '../core/GlobalEventBus';
import { t } from '../core/i18n';
import { audio } from '../systems/AudioSystem';
import { AnimationController } from '../animation/AnimationController';
import type { AnimationSignals } from '../animation/animationStates';
import { isEnemyAnimated } from '../animation/frameDrawers/enemies/enemyFrameRegistry';
import { pickInitialOrbitAngle, pickSpawnerMinionAngle } from './enemyAngleSeed';

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
  /** Configured minion key for spawner enemies — null falls back to midge.
   *  Set per-spawn from `config.spawnerMinionKey` so Nicnevin (the only
   *  current non-default user) summons unseelie_fiddler instead of midge. */
  private spawnerMinionKey: string | null = null;
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
  /** V2 — Cailleach Gauntlet boss state (only used when behavior === 'wail'). */
  private wailState: WailState = { msSinceLastLance: 0, hasWailed: false };
  /** Earl Beardie boss state (only used when behavior === 'card_deal'). */
  private cardDealState: CardDealState = { msSinceLastDeal: 0 };
  /** Black Douglas boss state (only used when behavior === 'hush'). */
  private hushState: HushState = { msSinceLastShout: 0, telegraphing: false, msTelegraphElapsed: 0, shouldDamage: false };
  /** Storm Cailleach boss state (only used when behavior === 'storm_phases'). */
  private stormCailleachState: StormCailleachState = initialStormCailleachState();
  /** Twin Stones of Callanish boss state (only used when behavior === 'twin_stones'). */
  private twinStoneState: TwinStoneState = initialTwinStoneState();
  /** Cosmetic Stone B image — created on first tick, destroyed in die(). */
  private twinStoneShadow: Phaser.GameObjects.Image | null = null;
  /** Orbit angle for Stone B (radians). */
  private twinStoneShadowAngle: number = 0;
  /** True once the shadow image has been created for the current spawn. */
  private twinStoneShadowInitialized: boolean = false;
  /** Wicker Haggis boss state (only used when behavior === 'wicker_haggis'). */
  private wickerHaggisState: WickerHaggisState = initialWickerHaggisState();
  /** True once the phase-2 burning tint has been applied (avoid re-applying each tick). */
  private wickerPhaseTwoTinted: boolean = false;
  /** Nessie boss state (only used when behavior === 'loch_emergence'). */
  private nessieState: NessieState = initialNessieState();
  /** Auld Reekie Ghaist boss state (only used when behavior === 'auld_reekie'). */
  private auldReekieState: AuldReekieState = initialAuldReekieState();
  /** Taxman Phase 2 state (only used when behavior === 'taxman_grudge'). */
  private taxmanGrudgeState: TaxmanGrudgeState = initialTaxmanGrudgeState();
  /** Stoor Worm boss state (only used when behavior === 'stoor_worm'). */
  private stoorWormState: StoorWormState = initialStoorWormState();
  /** Ninth Legion boss state (only used when behavior === 'ninth_legion'). */
  private ninthLegionState: NinthLegionState = initialNinthLegionState();
  /** Gas-lamp post sprites anchored near the Auld Reekie arena. Destroyed in die(). */
  private lampPostSprites: Phaser.GameObjects.Image[] = [];
  /** Seeded anchor positions for lamp posts — set once on first tick. */
  private lampAnchorPositions: Array<{ x: number; y: number }> = [];
  /** True once lamp posts have been spawned for the current boss encounter. */
  private auldReekieInitialized: boolean = false;
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
  /** Charm status — charmed enemies walk toward other enemies instead of the player. */
  private charmTimer: number = 0;
  private charmTargetEnemy: Enemy | null = null;
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
    const r = (config.key === 'tour_bus' || config.key === 'boss_tour_bus' || config.texture === 'boss_tour_bus') ? 42
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
    this.orbitAngle = pickInitialOrbitAngle(this.ctx.getRunRng());
    this.piperBuffCooldown = 0;
    this.burnDamage = 0; this.burnTimer = 0; this.burnTickAccum = 0;
    this.freezeTimer = 0; this.freezeSpeedMul = 1;
    this.charmTimer = 0; this.charmTargetEnemy = null;
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
    // Stamp the configured minion key — null falls through to the
    // historical 'midge' default in behaviorSpawner so existing nests
    // are unaffected.
    this.spawnerMinionKey = config.spawnerMinionKey ?? null;
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
      // Damage scales at 0.8× the HP curve (was 0.5×) — playtester
      // 2026-05-12 reported standing-still pre-boss was viable because
      // contact chip damage never built. At 0.8× the late-game brawler
      // still loses the trade if they sit, but the early minutes stay
      // forgiving (delta vs HP curve is small until ~min 8).
      const dmgMul = 1 + (ENEMIES.HP_SCALE_PER_MINUTE * 0.8) * (gameTimeSec / 60);
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

    // Fleeing enemies (sheep packs etc.) that have escaped well outside
    // the camera silently despawn. Without this, the spatial-cull path
    // would keep them alive in the pool indefinitely — over a long run
    // the 400-slot ENEMIES.MAX_ACTIVE cap eventually saturates with
    // off-screen sheep and no new hostiles can spawn. Threshold sits
    // comfortably beyond the cull margin (200) plus a camera half-view
    // so an on-screen flee → re-engage flicker never trips it.
    if (this.behavior === 'flee') {
      const dx = this.x - targetX;
      const dy = this.y - targetY;
      if (dx * dx + dy * dy > 900 * 900) {
        this.die();
        return;
      }
    }

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

    // Charm override — charmed enemies chase another enemy instead of the player.
    if (this.charmTimer > 0) {
      this.charmTimer -= delta;
      if (this.charmTimer <= 0) {
        this.clearCharm();
      } else {
        this.behaviorCharm();
        return;
      }
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
      case 'wail':
        this.behaviorWail(targetX, targetY, delta);
        break;
      case 'card_deal':
        this.behaviorCardDeal(targetX, targetY, delta);
        break;
      case 'hush':
        this.behaviorHush(targetX, targetY, delta);
        break;
      case 'storm_phases':
        this.behaviorStormCailleach(targetX, targetY, delta);
        break;
      case 'twin_stones':
        this.behaviorTwinStones(targetX, targetY, delta);
        break;
      case 'wicker_haggis':
        this.behaviorWickerHaggis(targetX, targetY, delta);
        break;
      case 'loch_emergence':
        this.behaviorNessie(targetX, targetY, delta);
        break;
      case 'auld_reekie':
        this.behaviorAuldReekie(targetX, targetY, delta);
        break;
      case 'taxman_grudge':
        this.behaviorTaxmanGrudge(targetX, targetY, delta);
        break;
      case 'stoor_worm':
        this.behaviorStoorWorm(targetX, targetY, delta);
        break;
      case 'ninth_legion':
        this.behaviorNinthLegion(targetX, targetY, delta);
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

  /**
   * V2 — Cailleach Gauntlet boss behaviour. Slow chase + 4 s ice-lance
   * cadence + one-shot 600 px radial slow pulse at 50 % HP. Pure helper
   * (`wailBehaviour.ts`) drives the decision; this method handles the
   * scene-side effects (chase velocity, projectile spawn, pulse VFX).
   *
   * Spec: `docs/superpowers/specs/2026-05-22-moor-remembers-v2-design.md`.
   */
  private behaviorWail(tx: number, ty: number, delta: number): void {
    // Default chase movement.
    this.behaviorChase(tx, ty);

    const hpPct = this.maxHp > 0 ? this.hp / this.maxHp : 1.0;
    const next = simulateWailBehaviour(this.wailState, { deltaMs: delta, hpPct });
    this.wailState = next;

    if (next.shouldFireLance) {
      this.fireIceLance(tx, ty);
    }
    if (next.shouldFireWail) {
      this.fireWailPulse();
    }
  }

  /**
   * V2 — Cailleach's ice-lance projectile. Mirrors `fireNet` shape but
   * with a frost-blue tint and the wail-tuned damage (18) + slow on hit
   * (player.applyNetSlow). The standard Shinty Parry hook (`tryParry
   * Projectile`) negates the lance if the player has an active parry
   * window — sister to net/fang.
   */
  private fireIceLance(tx: number, ty: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const speed = 320;

    const lance = this.scene.add.circle(this.x, this.y, 6, 0xb9d6f0, 0.95);
    this.scene.physics.add.existing(lance);
    const body = lance.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    let hit = false;
    const spawnedPlayer = this.ctx.getPlayer();

    const cleanup = () => {
      if (hit) return;
      hit = true;
      try {
        this.scene.physics.world.removeCollider(overlapRef);
        if (lance.active) lance.destroy();
      } catch { /* scene may have restarted */ }
    };

    const overlapRef = this.scene.physics.add.overlap(lance, spawnedPlayer, () => {
      if (hit) return;
      cleanup();
      const currentPlayer = this.ctx.getPlayer();
      if (currentPlayer !== spawnedPlayer) return;
      if (currentPlayer.tryParryProjectile()) return;
      currentPlayer.takeDamage(18);
      currentPlayer.applyNetSlow(1200);
    });

    // Auto-cleanup after 2 seconds if it misses
    this.ctx.getUpdateTickers().addOnce('raw', 2000, cleanup);
  }

  /**
   * V2 — Cailleach's "Blue Hag's Wail" radial slow pulse. Single-shot
   * at 50 % HP. 600 px radius around the boss; if the player is
   * inside, applies 30 damage + 2 s net slow (existing slow channel).
   * Visual: an expanding frost-blue ring sketched on the scene.
   */
  private fireWailPulse(): void {
    const player = this.ctx.getPlayer();
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    if (dx * dx + dy * dy <= WAIL_PULSE_RADIUS_PX * WAIL_PULSE_RADIUS_PX) {
      // Hazard immunity respected via the existing damage path.
      player.takeDamage(WAIL_PULSE_DAMAGE);
      player.applyNetSlow(2000);
    }

    // Visual: expanding ring. Cheap circle that scales up + alpha 0
    // over 500 ms. Guarded against missing scene tween on test stubs.
    try {
      const ring = this.scene.add.circle(this.x, this.y, 16, 0xb9d6f0, 0.0);
      ring.setStrokeStyle(4, 0xe8f5ff, 0.9);
      this.scene.tweens.add({
        targets: ring,
        radius: WAIL_PULSE_RADIUS_PX,
        alpha: { from: 0.9, to: 0 },
        duration: 500,
        onComplete: () => ring.destroy(),
      });
    } catch { /* test stubs without tweens */ }
  }

  /**
   * Earl Beardie — slow chase with spectral card-fan projectile every
   * 3.5 s. Mirrors `behaviorWail` shape. The sealed-room ghost is not
   * fast; the danger is the card fan, not the chase speed.
   */
  private behaviorCardDeal(tx: number, ty: number, delta: number): void {
    this.behaviorChase(tx, ty);
    const next = simulateCardDealBehaviour(this.cardDealState, { deltaMs: delta });
    this.cardDealState = next;
    if (next.shouldDeal) {
      this.fireCardFan(tx, ty);
    }
  }

  /**
   * Fire a fan of spectral playing cards toward the player.
   * Three cards at evenly-spaced angles around the aim vector — like
   * a card deal flicked across a table. Parryable via Shinty Parry.
   */
  private fireCardFan(tx: number, ty: number): void {
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const spawnedPlayer = this.ctx.getPlayer();

    for (let i = 0; i < CARD_DEAL_FAN_COUNT; i++) {
      const offset = (i - Math.floor(CARD_DEAL_FAN_COUNT / 2)) * CARD_DEAL_SPREAD_RAD;
      const angle = baseAngle + offset;
      const vx = Math.cos(angle) * CARD_DEAL_SPEED;
      const vy = Math.sin(angle) * CARD_DEAL_SPEED;

      // Spectral card: small rectangle (6×9) with baize-green tint.
      const card = this.scene.add.rectangle(this.x, this.y, 6, 9, 0x40904a, 0.90);
      this.scene.physics.add.existing(card);
      const body = card.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(vx, vy);
      card.setRotation(angle + Math.PI / 2);

      let hit = false;
      const cleanup = () => {
        if (hit) return;
        hit = true;
        try {
          this.scene.physics.world.removeCollider(overlapRef);
          if (card.active) card.destroy();
        } catch { /* scene may have restarted */ }
      };

      const overlapRef = this.scene.physics.add.overlap(card, spawnedPlayer, () => {
        if (hit) return;
        cleanup();
        const currentPlayer = this.ctx.getPlayer();
        if (currentPlayer !== spawnedPlayer) return;
        if (currentPlayer.tryParryProjectile()) return;
        currentPlayer.takeDamage(CARD_DEAL_DAMAGE);
      });

      this.ctx.getUpdateTickers().addOnce('raw', CARD_DEAL_RANGE_MS, cleanup);
    }
  }

  /**
   * Black Douglas — fast chase with periodic "Hush!" fear-shout.
   * Telegraph: dark expanding ring over HUSH_TELEGRAPH_MS. Damage: 18
   * + 1.5 s net-slow if player is within HUSH_RADIUS_PX.
   * Post-bell exclusive. Refs: SCOTTISH_RESEARCH_DEEP.md §6.3.
   */
  private behaviorHush(tx: number, ty: number, delta: number): void {
    this.behaviorChase(tx, ty);
    const prev = this.hushState;
    const next = simulateHushBehaviour(prev, { deltaMs: delta });
    this.hushState = next;
    if (next.telegraphing && next.msTelegraphElapsed === 0) {
      this.showHushTelegraph();
    }
    if (next.shouldDamage) {
      this.fireHushPulse();
    }
  }

  private showHushTelegraph(): void {
    try {
      const ring = this.scene.add.circle(this.x, this.y, 16, 0x111130, 0.0);
      ring.setStrokeStyle(3, 0x404090, 0.85);
      this.scene.tweens.add({
        targets: ring,
        radius: HUSH_RADIUS_PX,
        alpha: { from: 0.85, to: 0 },
        duration: HUSH_TELEGRAPH_MS,
        onComplete: () => ring.destroy(),
      });
    } catch { /* test stubs without tweens */ }
  }

  private fireHushPulse(): void {
    const player = this.ctx.getPlayer();
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    if (dx * dx + dy * dy <= HUSH_RADIUS_PX * HUSH_RADIUS_PX) {
      player.takeDamage(HUSH_DAMAGE);
      player.applyNetSlow(HUSH_SLOW_MS);
    }
  }

  /**
   * Storm Cailleach — three-phase escalating boss.
   * Phase 1: haar veil — slow chase + smoky pulse.
   * Phase 2: ice fury — faster chase + lance fan.
   * Phase 3: hail storm — fastest chase + bolt burst.
   * Post-bell exclusive. Refs: SCOTTISH_RESEARCH.md §1.1.
   */
  private behaviorStormCailleach(tx: number, ty: number, delta: number): void {
    const hpPct = this.maxHp > 0 ? this.hp / this.maxHp : 1.0;
    const next = simulateStormCailleachBehaviour(this.stormCailleachState, { deltaMs: delta, hpPct });
    this.stormCailleachState = next;

    this.setVelocityToward(tx, ty, this.speed * next.speedMul);

    if (next.shouldFireHaarPulse) {
      this.fireStormHaarPulse();
    }
    if (next.shouldFireIceLances) {
      this.fireStormIceLances(tx, ty);
    }
    if (next.shouldFireHailBurst) {
      this.fireStormHailBurst(tx, ty);
    }
  }

  /** Storm Cailleach Phase 1 — haar slow-pulse: expanding smoky grey ring. */
  private fireStormHaarPulse(): void {
    const player = this.ctx.getPlayer();
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    if (dx * dx + dy * dy <= STORM_HAAR_RADIUS_PX * STORM_HAAR_RADIUS_PX) {
      player.takeDamage(STORM_HAAR_DAMAGE);
      player.applyNetSlow(STORM_HAAR_SLOW_MS);
    }
    try {
      const ring = this.scene.add.circle(this.x, this.y, 16, 0x7090b0, 0.0);
      ring.setStrokeStyle(3, 0xa8b8cc, 0.75);
      this.scene.tweens.add({
        targets: ring,
        radius: STORM_HAAR_RADIUS_PX,
        alpha: { from: 0.75, to: 0 },
        duration: 700,
        onComplete: () => ring.destroy(),
      });
    } catch { /* test stubs without tweens */ }
  }

  /** Storm Cailleach Phase 2 — ice lances in a fan toward the player. */
  private fireStormIceLances(tx: number, ty: number): void {
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const step = STORM_LANCE_COUNT > 1 ? (STORM_LANCE_SPREAD_RAD * 2) / (STORM_LANCE_COUNT - 1) : 0;
    const startAngle = baseAngle - STORM_LANCE_SPREAD_RAD;
    const spawnedPlayer = this.ctx.getPlayer();

    for (let i = 0; i < STORM_LANCE_COUNT; i++) {
      const angle = startAngle + step * i;
      const lance = this.scene.add.circle(this.x, this.y, 5, 0xb9d6f0, 0.90);
      this.scene.physics.add.existing(lance);
      const body = lance.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * STORM_LANCE_SPEED, Math.sin(angle) * STORM_LANCE_SPEED);

      let hit = false;
      const cleanup = () => {
        if (hit) return;
        hit = true;
        try {
          this.scene.physics.world.removeCollider(overlapRef);
          if (lance.active) lance.destroy();
        } catch { /* scene may have restarted */ }
      };
      const overlapRef = this.scene.physics.add.overlap(lance, spawnedPlayer, () => {
        if (hit) return;
        cleanup();
        const cur = this.ctx.getPlayer();
        if (cur !== spawnedPlayer) return;
        if (cur.tryParryProjectile()) return;
        cur.takeDamage(STORM_LANCE_DAMAGE);
        cur.applyNetSlow(STORM_LANCE_SLOW_MS);
      });
      this.ctx.getUpdateTickers().addOnce('raw', 1800, cleanup);
    }
  }

  /** Storm Cailleach Phase 3 — hail bolts scattered around the player direction. */
  private fireStormHailBurst(tx: number, ty: number): void {
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const halfSpread = STORM_HAIL_SPREAD_RAD / 2;
    const spawnedPlayer = this.ctx.getPlayer();

    for (let i = 0; i < STORM_HAIL_COUNT; i++) {
      const angle = baseAngle - halfSpread + (STORM_HAIL_SPREAD_RAD * i) / (STORM_HAIL_COUNT - 1);
      const bolt = this.scene.add.circle(this.x, this.y, 4, 0xe0f0ff, 0.85);
      this.scene.physics.add.existing(bolt);
      const body = bolt.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * STORM_HAIL_SPEED, Math.sin(angle) * STORM_HAIL_SPEED);

      let hit = false;
      const cleanup = () => {
        if (hit) return;
        hit = true;
        try {
          this.scene.physics.world.removeCollider(overlapRef);
          if (bolt.active) bolt.destroy();
        } catch { /* scene may have restarted */ }
      };
      const overlapRef = this.scene.physics.add.overlap(bolt, spawnedPlayer, () => {
        if (hit) return;
        cleanup();
        const cur = this.ctx.getPlayer();
        if (cur !== spawnedPlayer) return;
        if (cur.tryParryProjectile()) return;
        cur.takeDamage(STORM_HAIL_DAMAGE);
      });
      this.ctx.getUpdateTickers().addOnce('raw', 1400, cleanup);
    }
  }

  /**
   * Twin Stones of Callanish — two Fir Bhreige with one shared HP bar.
   * Stone A is this entity. Stone B is a cosmetic Image that orbits (P1)
   * or flanks perpendicular to the player (P2). Both fire shards.
   * Post-bell exclusive. Refs: SCOTTISH_RESEARCH.md §1.8.
   */
  private behaviorTwinStones(tx: number, ty: number, delta: number): void {
    const hpPct = this.maxHp > 0 ? this.hp / this.maxHp : 1.0;
    const next = simulateTwinStoneBehaviour(this.twinStoneState, { deltaMs: delta, hpPct });
    this.twinStoneState = next;

    this.setVelocityToward(tx, ty, this.speed * next.speedMul);

    // Lazy-create Stone B shadow image on first tick (BootScene must have run).
    if (!this.twinStoneShadowInitialized && this.scene?.sys.isActive()) {
      try {
        if (this.scene.textures.exists('boss_twin_stone_b')) {
          this.twinStoneShadow = this.scene.add.image(this.x, this.y, 'boss_twin_stone_b');
          this.twinStoneShadow.setScale(2.4);
          this.twinStoneShadow.setDepth(this.depth - 1);
          this.twinStoneShadowInitialized = true;
        }
      } catch { /* test stubs without scene */ }
    }

    // Position Stone B.
    if (this.twinStoneShadow?.active) {
      if (next.phase === 1) {
        this.twinStoneShadowAngle += TWIN_SHADOW_ORBIT_RAD_PER_SEC * (delta / 1000);
        this.twinStoneShadow.setPosition(
          this.x + Math.cos(this.twinStoneShadowAngle) * TWIN_SHADOW_ORBIT_RADIUS,
          this.y + Math.sin(this.twinStoneShadowAngle) * TWIN_SHADOW_ORBIT_RADIUS,
        );
      } else {
        const perp = Phaser.Math.Angle.Between(this.x, this.y, tx, ty) + Math.PI / 2;
        this.twinStoneShadow.setPosition(
          this.x + Math.cos(perp) * TWIN_SHADOW_FLANK_DIST,
          this.y + Math.sin(perp) * TWIN_SHADOW_FLANK_DIST,
        );
      }
    }

    if (next.shouldFireRing) {
      this.fireTwinStoneRing(this.x, this.y);
      const sx = this.twinStoneShadow?.x ?? this.x;
      const sy = this.twinStoneShadow?.y ?? this.y;
      this.ctx.getUpdateTickers().addOnce('raw', TWIN_SHADOW_RING_DELAY_MS, () => {
        this.fireTwinStoneRing(sx, sy);
      });
    }
    if (next.shouldFireFan) {
      this.fireTwinStoneFan(this.x, this.y, tx, ty);
      const sx = this.twinStoneShadow?.x ?? this.x;
      const sy = this.twinStoneShadow?.y ?? this.y;
      this.fireTwinStoneFan(sx, sy, tx, ty);
    }
  }

  /** Stone shard ring — TWIN_RING_SHARD_COUNT evenly-spread shards from (fromX, fromY). */
  private fireTwinStoneRing(fromX: number, fromY: number): void {
    const step = (Math.PI * 2) / TWIN_RING_SHARD_COUNT;
    const spawnedPlayer = this.ctx.getPlayer();
    for (let i = 0; i < TWIN_RING_SHARD_COUNT; i++) {
      const angle = step * i;
      const shard = this.scene.add.circle(fromX, fromY, 5, 0x8c7858, 0.88);
      this.scene.physics.add.existing(shard);
      const body = shard.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * TWIN_RING_SHARD_SPEED, Math.sin(angle) * TWIN_RING_SHARD_SPEED);
      let hit = false;
      const cleanup = () => {
        if (hit) return;
        hit = true;
        try { this.scene.physics.world.removeCollider(overlapRef); if (shard.active) shard.destroy(); } catch { /* scene restart */ }
      };
      const overlapRef = this.scene.physics.add.overlap(shard, spawnedPlayer, () => {
        if (hit) return;
        cleanup();
        const cur = this.ctx.getPlayer();
        if (cur !== spawnedPlayer) return;
        if (cur.tryParryProjectile()) return;
        cur.takeDamage(TWIN_RING_SHARD_DAMAGE);
      });
      this.ctx.getUpdateTickers().addOnce('raw', 2000, cleanup);
    }
  }

  /** Stone shard fan — TWIN_FAN_SHARD_COUNT shards in a spread toward the player. */
  private fireTwinStoneFan(fromX: number, fromY: number, tx: number, ty: number): void {
    const baseAngle = Phaser.Math.Angle.Between(fromX, fromY, tx, ty);
    const halfSpread = TWIN_FAN_SPREAD_RAD / 2;
    const step = TWIN_FAN_SHARD_COUNT > 1 ? TWIN_FAN_SPREAD_RAD / (TWIN_FAN_SHARD_COUNT - 1) : 0;
    const spawnedPlayer = this.ctx.getPlayer();
    for (let i = 0; i < TWIN_FAN_SHARD_COUNT; i++) {
      const angle = baseAngle - halfSpread + step * i;
      const shard = this.scene.add.circle(fromX, fromY, 5, 0x8c7858, 0.90);
      this.scene.physics.add.existing(shard);
      const body = shard.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * TWIN_FAN_SHARD_SPEED, Math.sin(angle) * TWIN_FAN_SHARD_SPEED);
      let hit = false;
      const cleanup = () => {
        if (hit) return;
        hit = true;
        try { this.scene.physics.world.removeCollider(overlapRef); if (shard.active) shard.destroy(); } catch { /* scene restart */ }
      };
      const overlapRef = this.scene.physics.add.overlap(shard, spawnedPlayer, () => {
        if (hit) return;
        cleanup();
        const cur = this.ctx.getPlayer();
        if (cur !== spawnedPlayer) return;
        if (cur.tryParryProjectile()) return;
        cur.takeDamage(TWIN_FAN_SHARD_DAMAGE);
      });
      this.ctx.getUpdateTickers().addOnce('raw', 2000, cleanup);
    }
  }

  /** Wicker Haggis — Bealltainn's Tribute (post-bell, two-phase fire boss). */
  private behaviorWickerHaggis(tx: number, ty: number, delta: number): void {
    const hpPct = this.maxHp > 0 ? this.hp / this.maxHp : 1.0;
    const next = simulateWickerHaggisBehaviour(this.wickerHaggisState, { deltaMs: delta, hpPct });
    this.wickerHaggisState = next;

    // Phase-2 burning tint — brighter amber-orange over the default boss orange.
    if (next.phase === 2 && !this.wickerPhaseTwoTinted) {
      this.baseTint = 0xff3300;
      this.setTint(0xff3300);
      this.wickerPhaseTwoTinted = true;
    }

    this.setVelocityToward(tx, ty, this.speed * next.speedMul);

    if (next.shouldFireTransitionBurst) this.fireWickerTransitionBurst(this.x, this.y);
    if (next.shouldFireRing) this.fireWickerRing(this.x, this.y);
    if (next.shouldFireScatter) this.fireWickerScatter(this.x, this.y, tx, ty);
  }

  /** Phase 1 — 6-shard outward fire ring. */
  private fireWickerRing(fromX: number, fromY: number): void {
    const step = (Math.PI * 2) / WICKER_RING_SHARD_COUNT;
    const spawnedPlayer = this.ctx.getPlayer();
    for (let i = 0; i < WICKER_RING_SHARD_COUNT; i++) {
      const angle = step * i;
      const shard = this.scene.add.circle(fromX, fromY, 5, 0xf05a00, 0.90);
      this.scene.physics.add.existing(shard);
      const body = shard.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * WICKER_RING_SHARD_SPEED, Math.sin(angle) * WICKER_RING_SHARD_SPEED);
      let hit = false;
      const cleanup = () => {
        if (hit) return;
        hit = true;
        try { this.scene.physics.world.removeCollider(overlapRef); if (shard.active) shard.destroy(); } catch { /* scene restart */ }
      };
      const overlapRef = this.scene.physics.add.overlap(shard, spawnedPlayer, () => {
        if (hit) return;
        cleanup();
        const cur = this.ctx.getPlayer();
        if (cur !== spawnedPlayer) return;
        if (cur.tryParryProjectile()) return;
        cur.takeDamage(WICKER_RING_SHARD_DAMAGE);
      });
      this.ctx.getUpdateTickers().addOnce('raw', 2200, cleanup);
    }
  }

  /** Phase transition — 8 slow ember shards radiate outward as the wicker ignites. */
  private fireWickerTransitionBurst(fromX: number, fromY: number): void {
    const step = (Math.PI * 2) / WICKER_TRANSITION_SHARD_COUNT;
    const spawnedPlayer = this.ctx.getPlayer();
    for (let i = 0; i < WICKER_TRANSITION_SHARD_COUNT; i++) {
      const angle = step * i;
      const shard = this.scene.add.circle(fromX, fromY, 6, 0xffb830, 0.85);
      this.scene.physics.add.existing(shard);
      const body = shard.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * WICKER_TRANSITION_SHARD_SPEED, Math.sin(angle) * WICKER_TRANSITION_SHARD_SPEED);
      let hit = false;
      const cleanup = () => {
        if (hit) return;
        hit = true;
        try { this.scene.physics.world.removeCollider(overlapRef); if (shard.active) shard.destroy(); } catch { /* scene restart */ }
      };
      const overlapRef = this.scene.physics.add.overlap(shard, spawnedPlayer, () => {
        if (hit) return;
        cleanup();
        const cur = this.ctx.getPlayer();
        if (cur !== spawnedPlayer) return;
        if (cur.tryParryProjectile()) return;
        cur.takeDamage(WICKER_TRANSITION_SHARD_DAMAGE);
      });
      this.ctx.getUpdateTickers().addOnce('raw', 3200, cleanup);
    }
  }

  /** Phase 2 — 4-shard ember scatter: 2 inner (±20°) + 2 outer (±60°) from player bearing. */
  private fireWickerScatter(fromX: number, fromY: number, tx: number, ty: number): void {
    const baseAngle = Phaser.Math.Angle.Between(fromX, fromY, tx, ty);
    const offsets = [
      -WICKER_SCATTER_INNER_SPREAD_RAD,
      WICKER_SCATTER_INNER_SPREAD_RAD,
      -WICKER_SCATTER_OUTER_SPREAD_RAD,
      WICKER_SCATTER_OUTER_SPREAD_RAD,
    ];
    const spawnedPlayer = this.ctx.getPlayer();
    for (let i = 0; i < WICKER_SCATTER_SHARD_COUNT; i++) {
      const angle = baseAngle + offsets[i];
      const shard = this.scene.add.circle(fromX, fromY, 5, 0xf05a00, 0.92);
      this.scene.physics.add.existing(shard);
      const body = shard.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * WICKER_SCATTER_SHARD_SPEED, Math.sin(angle) * WICKER_SCATTER_SHARD_SPEED);
      let hit = false;
      const cleanup = () => {
        if (hit) return;
        hit = true;
        try { this.scene.physics.world.removeCollider(overlapRef); if (shard.active) shard.destroy(); } catch { /* scene restart */ }
      };
      const overlapRef = this.scene.physics.add.overlap(shard, spawnedPlayer, () => {
        if (hit) return;
        cleanup();
        const cur = this.ctx.getPlayer();
        if (cur !== spawnedPlayer) return;
        if (cur.tryParryProjectile()) return;
        cur.takeDamage(WICKER_SCATTER_SHARD_DAMAGE);
      });
      this.ctx.getUpdateTickers().addOnce('raw', 2000, cleanup);
    }
  }

  // ── Nessie, Reconsidered (loch_emergence) ──

  private behaviorNessie(tx: number, ty: number, delta: number): void {
    const hpPct = this.maxHp > 0 ? this.hp / this.maxHp : 1.0;
    const next = simulateNessieBehaviour(this.nessieState, { deltaMs: delta, hpPct });
    this.nessieState = next;
    this.setVelocityToward(tx, ty, this.speed * next.speedMul);
    if (next.shouldFireSweep) this.fireNessieSweep(this.x, this.y, tx, ty);
    if (next.shouldFirePlunge) this.fireNessiePlunge(this.x, this.y, tx, ty);
  }

  private fireNessieSweep(fromX: number, fromY: number, tx: number, ty: number): void {
    const baseAngle = Phaser.Math.Angle.Between(fromX, fromY, tx, ty);
    const step = (NESSIE_SWEEP_SPREAD_RAD * 2) / (NESSIE_SWEEP_SHARD_COUNT - 1);
    const startAngle = baseAngle - NESSIE_SWEEP_SPREAD_RAD;
    const spawnedPlayer = this.ctx.getPlayer();
    this.ctx.getSFXManager().tryPlay('nessie_sweep', () => audio.playHit());
    for (let i = 0; i < NESSIE_SWEEP_SHARD_COUNT; i++) {
      const angle = startAngle + step * i;
      const shard = this.scene.add.circle(fromX, fromY, 6, 0x4a8c7e, 0.88);
      this.scene.physics.add.existing(shard);
      const body = shard.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * NESSIE_SWEEP_SHARD_SPEED, Math.sin(angle) * NESSIE_SWEEP_SHARD_SPEED);
      let hit = false;
      const cleanup = () => {
        if (hit) return;
        hit = true;
        try { this.scene.physics.world.removeCollider(overlapRef); if (shard.active) shard.destroy(); } catch { /* scene restart */ }
      };
      const overlapRef = this.scene.physics.add.overlap(shard, spawnedPlayer, () => {
        if (hit) return;
        cleanup();
        const cur = this.ctx.getPlayer();
        if (cur !== spawnedPlayer) return;
        if (cur.tryParryProjectile()) return;
        cur.takeDamage(NESSIE_SWEEP_SHARD_DAMAGE);
      });
      this.ctx.getUpdateTickers().addOnce('raw', 2000, cleanup);
    }
  }

  private fireNessiePlunge(fromX: number, fromY: number, tx: number, ty: number): void {
    const baseAngle = Phaser.Math.Angle.Between(fromX, fromY, tx, ty);
    const step = (NESSIE_PLUNGE_SPREAD_RAD * 2) / (NESSIE_PLUNGE_SHARD_COUNT - 1);
    const startAngle = baseAngle - NESSIE_PLUNGE_SPREAD_RAD;
    const spawnedPlayer = this.ctx.getPlayer();
    this.ctx.getSFXManager().tryPlay('nessie_plunge', () => audio.playHit());
    for (let i = 0; i < NESSIE_PLUNGE_SHARD_COUNT; i++) {
      const angle = startAngle + step * i;
      const shard = this.scene.add.circle(fromX, fromY, 5, 0x2a5e52, 0.92);
      this.scene.physics.add.existing(shard);
      const body = shard.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * NESSIE_PLUNGE_SHARD_SPEED, Math.sin(angle) * NESSIE_PLUNGE_SHARD_SPEED);
      let hit = false;
      const cleanup = () => {
        if (hit) return;
        hit = true;
        try { this.scene.physics.world.removeCollider(overlapRef); if (shard.active) shard.destroy(); } catch { /* scene restart */ }
      };
      const overlapRef = this.scene.physics.add.overlap(shard, spawnedPlayer, () => {
        if (hit) return;
        cleanup();
        const cur = this.ctx.getPlayer();
        if (cur !== spawnedPlayer) return;
        if (cur.tryParryProjectile()) return;
        cur.takeDamage(NESSIE_PLUNGE_SHARD_DAMAGE);
      });
      this.ctx.getUpdateTickers().addOnce('raw', 1800, cleanup);
    }
  }

  // ── Auld Reekie Ghaist (auld_reekie) ──

  private behaviorAuldReekie(tx: number, ty: number, delta: number): void {
    // Lazy-init lamp posts on first tick (seeded positions for replay determinism).
    if (!this.auldReekieInitialized) {
      this.auldReekieInitialized = true;
      const rng = this.ctx.getRunRng();
      const LAMP_COUNT = 4;
      this.lampAnchorPositions = [];
      for (let i = 0; i < LAMP_COUNT; i++) {
        const baseAngle = ((Math.PI * 2) / LAMP_COUNT) * i;
        const jitter = (rng.int(-LAMP_ANCHOR_RNG_JITTER, LAMP_ANCHOR_RNG_JITTER));
        const angle = baseAngle + (jitter / LAMP_ANCHOR_RNG_JITTER) * 0.4;
        const pos = {
          x: this.x + Math.cos(angle) * LAMP_ANCHOR_RADIUS_PX,
          y: this.y + Math.sin(angle) * LAMP_ANCHOR_RADIUS_PX,
        };
        this.lampAnchorPositions.push(pos);
        if (this.scene.textures.exists('prop_gas_lamp')) {
          const lamp = this.scene.add.image(pos.x, pos.y, 'prop_gas_lamp');
          lamp.setDepth(0.5);
          this.lampPostSprites.push(lamp);
        }
      }
      this.ctx.caption('auld_reekie_entry', t('boss.auld_reekie.entryCaption'));
      this.ctx.getSFXManager().tryPlay('auld_reekie_entry', () => audio.playAuldReekieEntry());
    }

    const hpPct = this.maxHp > 0 ? this.hp / this.maxHp : 1.0;
    const next = simulateAuldReekieBehaviour(this.auldReekieState, { deltaMs: delta, hpPct });
    this.auldReekieState = next;

    this.setVelocityToward(tx, ty, this.speed * next.speedMul);

    if (next.shouldSummonPack > 0) this.spawnTouristPack(next.shouldSummonPack);
    if (next.shouldFireLantern)    this.fireLanternOrb(tx, ty);
    if (next.shouldFireTripleFan)  this.fireLanternFan(tx, ty);
    if (next.shouldStartBlinkTelegraph) this.showBlinkTelegraph();
    if (next.shouldExecuteBlink)   this.executeBlink(tx, ty);
    if (next.shouldStartGasTelegraph) this.showGasTelegraph();
    if (next.shouldFireGas)        this.fireGasPulse();
  }

  private spawnTouristPack(count: number): void {
    const spawnSystem = this.ctx.getSpawnSystem();
    const pool = spawnSystem.getEnemyGroup();
    const config = ENEMY_TYPES['tourist_ghost'];
    if (!config) return;
    const gameTime = spawnSystem.getGameTimeSec?.() ?? 0;
    for (let i = 0; i < count; i++) {
      const minion = Enemy.acquireFromPool(pool, this.ctxScene);
      if (!minion) break;
      const angle = ((Math.PI * 2) / count) * i;
      minion.spawn(
        this.x + Math.cos(angle) * 35,
        this.y + Math.sin(angle) * 35,
        config,
        gameTime,
      );
    }
  }

  private fireLanternOrb(tx: number, ty: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    this.ctx.getSFXManager().tryPlay('lantern_lob', () => audio.playLanternLob());
    const spawnedPlayer = this.ctx.getPlayer();
    const orb = this.scene.add.circle(this.x, this.y, 8, 0xf5a623, 0.88);
    this.scene.physics.add.existing(orb);
    const body = orb.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(Math.cos(angle) * LANTERN_SPEED, Math.sin(angle) * LANTERN_SPEED);
    let hit = false;
    const cleanup = () => {
      if (hit) return;
      hit = true;
      try { this.scene.physics.world.removeCollider(overlapRef); if (orb.active) orb.destroy(); } catch { /* scene restart */ }
    };
    const overlapRef = this.scene.physics.add.overlap(orb, spawnedPlayer, () => {
      if (hit) return;
      cleanup();
      const cur = this.ctx.getPlayer();
      if (cur !== spawnedPlayer) return;
      if (cur.tryParryProjectile()) return;
      cur.takeDamage(LANTERN_DAMAGE);
    });
    this.ctx.getUpdateTickers().addOnce('raw', 2500, cleanup);
  }

  private fireLanternFan(tx: number, ty: number): void {
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    this.ctx.getSFXManager().tryPlay('lantern_lob', () => audio.playLanternLob());
    const spawnedPlayer = this.ctx.getPlayer();
    for (let i = 0; i < TRIPLE_FAN_COUNT; i++) {
      const offset = (i - 1) * TRIPLE_FAN_SPREAD_RAD;
      const angle = baseAngle + offset;
      const orb = this.scene.add.circle(this.x, this.y, 8, 0xf5a623, 0.88);
      this.scene.physics.add.existing(orb);
      const body = orb.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * LANTERN_SPEED, Math.sin(angle) * LANTERN_SPEED);
      let hit = false;
      const cleanup = () => {
        if (hit) return;
        hit = true;
        try { this.scene.physics.world.removeCollider(overlapRef); if (orb.active) orb.destroy(); } catch { /* scene restart */ }
      };
      const overlapRef = this.scene.physics.add.overlap(orb, spawnedPlayer, () => {
        if (hit) return;
        cleanup();
        const cur = this.ctx.getPlayer();
        if (cur !== spawnedPlayer) return;
        if (cur.tryParryProjectile()) return;
        cur.takeDamage(LANTERN_DAMAGE);
      });
      this.ctx.getUpdateTickers().addOnce('raw', 2500, cleanup);
    }
  }

  private showBlinkTelegraph(): void {
    // Flash the boss amber for the telegraph window.
    this.setTint(0xf5a623);
    this.ctx.getSFXManager().tryPlay('ghaist_blink', () => audio.playGhaistBlink());
    this.ctx.getUpdateTickers().addOnce('raw', 600, () => {
      if (this.active) this.setTint(this.baseTint);
    });
  }

  private executeBlink(tx: number, ty: number): void {
    // Blink to the nearest lamp anchor position that isn't right on top of the player.
    if (this.lampAnchorPositions.length === 0) return;
    let best = this.lampAnchorPositions[0];
    let bestDistSq = Infinity;
    for (const pos of this.lampAnchorPositions) {
      const dx = pos.x - tx;
      const dy = pos.y - ty;
      const distSq = dx * dx + dy * dy;
      if (distSq < bestDistSq && distSq > 60 * 60) {
        bestDistSq = distSq;
        best = pos;
      }
    }
    this.setPosition(best.x, best.y);
    (this.body as Phaser.Physics.Arcade.Body).reset(best.x, best.y);
  }

  private showGasTelegraph(): void {
    // Amber ring expanding from boss position — warns of AoE.
    this.ctx.getSFXManager().tryPlay('gas_leak', () => audio.playGasLeak());
    if (this.scene.textures.exists('arc')) {
      const fx = this.ctx.getStatusFxPool();
      const ring = fx.acquireArc(this.x, this.y, GAS_RADIUS_PX * 0.15, 0xb8e04a, 0.4);
      this.scene.tweens.add({
        targets: ring,
        scaleX: GAS_RADIUS_PX / (GAS_RADIUS_PX * 0.15),
        scaleY: GAS_RADIUS_PX / (GAS_RADIUS_PX * 0.15),
        alpha: 0,
        duration: 1000,
        ease: 'Cubic.easeOut',
        onComplete: () => ring.setVisible(false),
      });
    }
  }

  private fireGasPulse(): void {
    const player = this.ctx.getPlayer();
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    if (dx * dx + dy * dy <= GAS_RADIUS_PX * GAS_RADIUS_PX) {
      player.takeDamage(GAS_DAMAGE);
      player.applyNetSlow(GAS_SLOW_MS);
    }
  }

  /**
   * Father Taxman — grudge-reactive phase boss (DESIGN_IDEAS §1 + §3).
   * Phase 1: standard chase. At 50% HP: 1.5 s dramatic pause, reads the
   * current GrudgeVerdict, declares via banter, then enters a Phase 2
   * attack pattern that counters the player's run-wide fighting style.
   */
  private behaviorTaxmanGrudge(tx: number, ty: number, delta: number): void {
    const verdict = judgeGrudge(this.ctx.getGrudgeLedger());
    const next = simulateTaxmanGrudgeBehaviour(this.taxmanGrudgeState, {
      deltaMs: delta,
      hpPct: this.maxHp > 0 ? this.hp / this.maxHp : 1.0,
      resolvedVerdict: verdict,
    });
    this.taxmanGrudgeState = next;

    if (next.isPaused) {
      this.setVelocity(0, 0);
    } else {
      this.setVelocityToward(tx, ty, this.speed * next.speedMul);
    }

    if (next.shouldFireTransition) {
      this.ctx.requestBanter('taxman_grudge_phase2', verdict);
      // White flash → settle to a dark grey-green (ledger-ink menace).
      this.setTint(0xffffff);
      this.ctx.getUpdateTickers().addOnce('raw', 250, () => {
        if (this.active) {
          this.baseTint = 0x445533;
          this.setTint(0x445533);
        }
      });
      // Expanding ledger-slam ring VFX.
      try {
        const ring = this.scene.add.circle(this.x, this.y, 18, 0xcccc88, 0.0);
        ring.setStrokeStyle(3, 0x99aa66, 0.8);
        this.scene.tweens.add({
          targets: ring,
          radius: 260,
          alpha: { from: 0.8, to: 0 },
          duration: 900,
          ease: 'Cubic.easeOut',
          onComplete: () => ring.destroy(),
        });
      } catch { /* test stubs without tweens */ }
    }

    if (next.shouldFireAttack) {
      switch (next.verdict) {
        case 'coward':   this.fireTaxmanDemands(tx, ty); break;
        case 'bruiser':  this.fireTaxmanPenalty(); break;
        case 'precise':  this.fireTaxmanAssessment(tx, ty); break;
        case 'reckless': this.fireTaxmanInterest(tx, ty); break;
        case 'even':     this.fireTaxmanStandardFan(tx, ty); break;
      }
    }
  }

  /** coward verdict — Tax Demands: 3 dark-blue projectiles in a spread.
   *  Slower than standard attacks but persistent — tax demands follow ye. */
  private fireTaxmanDemands(tx: number, ty: number): void {
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const offsets = [-0.35, 0, 0.35];
    const spawnedPlayer = this.ctx.getPlayer();
    for (const off of offsets) {
      const angle = baseAngle + off;
      const proj = this.scene.add.circle(this.x, this.y, 7, 0x334488, 0.9);
      this.scene.physics.add.existing(proj);
      const body = proj.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * 90, Math.sin(angle) * 90);
      let hit = false;
      const cleanup = () => {
        if (hit) return; hit = true;
        try { this.scene.physics.world.removeCollider(overlapRef); if (proj.active) proj.destroy(); } catch { /* scene restart */ }
      };
      const overlapRef = this.scene.physics.add.overlap(proj, spawnedPlayer, () => {
        if (hit) return; cleanup();
        const cur = this.ctx.getPlayer();
        if (cur !== spawnedPlayer) return;
        if (cur.tryParryProjectile()) return;
        cur.takeDamage(22);
        cur.applyNetSlow(900);
      });
      this.ctx.getUpdateTickers().addOnce('raw', 3800, cleanup);
    }
  }

  /** bruiser verdict — Penalty Notice: 6-shard radial burst.
   *  Pushes the brawler back — Revenue Scotland keeps its distance. */
  private fireTaxmanPenalty(): void {
    const step = (Math.PI * 2) / 6;
    const spawnedPlayer = this.ctx.getPlayer();
    for (let i = 0; i < 6; i++) {
      const angle = step * i;
      const proj = this.scene.add.circle(this.x, this.y, 8, 0xcc2222, 0.9);
      this.scene.physics.add.existing(proj);
      const body = proj.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
      let hit = false;
      const cleanup = () => {
        if (hit) return; hit = true;
        try { this.scene.physics.world.removeCollider(overlapRef); if (proj.active) proj.destroy(); } catch { /* scene restart */ }
      };
      const overlapRef = this.scene.physics.add.overlap(proj, spawnedPlayer, () => {
        if (hit) return; cleanup();
        const cur = this.ctx.getPlayer();
        if (cur !== spawnedPlayer) return;
        if (cur.tryParryProjectile()) return;
        cur.takeDamage(20);
        cur.applyNetSlow(700);
      });
      this.ctx.getUpdateTickers().addOnce('raw', 2000, cleanup);
    }
  }

  /** precise verdict — Wealth Assessment: 1 large slow blob that deals
   *  12% of the player's current HP on contact — auditing the surplus. */
  private fireTaxmanAssessment(tx: number, ty: number): void {
    const spawnedPlayer = this.ctx.getPlayer();
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const proj = this.scene.add.circle(this.x, this.y, 18, 0xfffacc, 0.85);
    this.scene.physics.add.existing(proj);
    const body = proj.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(Math.cos(angle) * 70, Math.sin(angle) * 70);
    let hit = false;
    const cleanup = () => {
      if (hit) return; hit = true;
      try { this.scene.physics.world.removeCollider(overlapRef); if (proj.active) proj.destroy(); } catch { /* scene restart */ }
    };
    const overlapRef = this.scene.physics.add.overlap(proj, spawnedPlayer, () => {
      if (hit) return; cleanup();
      const cur = this.ctx.getPlayer();
      if (cur !== spawnedPlayer) return;
      if (cur.tryParryProjectile()) return;
      cur.takeDamage(Math.max(8, Math.floor(cur.getHp() * 0.12)));
    });
    this.ctx.getUpdateTickers().addOnce('raw', 5500, cleanup);
  }

  /** reckless verdict — Interest Charges: 7-shard fan matching the
   *  player's chaotic energy. Fixed ±45° spread (deterministic, no RNG). */
  private fireTaxmanInterest(tx: number, ty: number): void {
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const spawnedPlayer = this.ctx.getPlayer();
    const count = 7;
    const spread = Math.PI * 0.5; // 90° total
    const step = count > 1 ? spread / (count - 1) : 0;
    for (let i = 0; i < count; i++) {
      const angle = baseAngle - spread / 2 + step * i;
      const proj = this.scene.add.circle(this.x, this.y, 5, 0xff4422, 0.9);
      this.scene.physics.add.existing(proj);
      const body = proj.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * 230, Math.sin(angle) * 230);
      let hit = false;
      const cleanup = () => {
        if (hit) return; hit = true;
        try { this.scene.physics.world.removeCollider(overlapRef); if (proj.active) proj.destroy(); } catch { /* scene restart */ }
      };
      const overlapRef = this.scene.physics.add.overlap(proj, spawnedPlayer, () => {
        if (hit) return; cleanup();
        const cur = this.ctx.getPlayer();
        if (cur !== spawnedPlayer) return;
        if (cur.tryParryProjectile()) return;
        cur.takeDamage(14);
      });
      this.ctx.getUpdateTickers().addOnce('raw', 2200, cleanup);
    }
  }

  /** even verdict — Standard Assessment: 4-shard gold fan + speed bump. */
  private fireTaxmanStandardFan(tx: number, ty: number): void {
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const spawnedPlayer = this.ctx.getPlayer();
    const count = 4;
    const spread = Math.PI * 0.45;
    const step = count > 1 ? spread / (count - 1) : 0;
    for (let i = 0; i < count; i++) {
      const angle = baseAngle - spread / 2 + step * i;
      const proj = this.scene.add.circle(this.x, this.y, 6, 0xffd700, 0.9);
      this.scene.physics.add.existing(proj);
      const body = proj.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * 155, Math.sin(angle) * 155);
      let hit = false;
      const cleanup = () => {
        if (hit) return; hit = true;
        try { this.scene.physics.world.removeCollider(overlapRef); if (proj.active) proj.destroy(); } catch { /* scene restart */ }
      };
      const overlapRef = this.scene.physics.add.overlap(proj, spawnedPlayer, () => {
        if (hit) return; cleanup();
        const cur = this.ctx.getPlayer();
        if (cur !== spawnedPlayer) return;
        if (cur.tryParryProjectile()) return;
        cur.takeDamage(18);
      });
      this.ctx.getUpdateTickers().addOnce('raw', 2600, cleanup);
    }
  }

  // ── Stoor Worm ────────────────────────────────────────────────────────────

  private behaviorStoorWorm(tx: number, ty: number, delta: number): void {
    const next = simulateStoorWormBehaviour(this.stoorWormState, {
      deltaMs: delta,
      hpPct: this.maxHp > 0 ? this.hp / this.maxHp : 1.0,
    });
    this.stoorWormState = next;

    // Scale lock: tint sealed/gaping — green sealed, yellow gaping.
    if (next.isScaleLocked) {
      this.baseTint = 0x446622;
      this.setTint(0x446622);
    } else if (next.scaleLockState === 'gaping') {
      this.baseTint = 0xcc8800;
      this.setTint(0xcc8800);
    }
    if (next.didPhaseChange && next.phase === 3) {
      // Death thrash — turn a sickly pale.
      this.baseTint = 0xaaccaa;
      this.setTint(0xaaccaa);
      this.ctx.requestBanter('boss_down', this.enemyKey);
    }

    this.setVelocityToward(tx, ty, this.speed * next.speedMul);

    if (next.shouldFireAttack) {
      switch (next.phase) {
        case 1: case 2: this.fireStoorWormSpray(tx, ty, next.phase === 2 ? 5 : 3); break;
        case 3:         this.fireStoorWormThrash(); break;
      }
    }
  }

  /** Stoor Worm acid/bile fan — shardCount 3 (phase 1) or 5 (phase 2). */
  private fireStoorWormSpray(tx: number, ty: number, shardCount: number): void {
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const spread = 0.55;
    const step = shardCount > 1 ? spread / (shardCount - 1) : 0;
    const spawnedPlayer = this.ctx.getPlayer();
    const color = shardCount === 3 ? 0x44aa22 : 0x88cc00;
    for (let i = 0; i < shardCount; i++) {
      const angle = baseAngle - spread / 2 + step * i;
      const proj = this.scene.add.circle(this.x, this.y, 8, color, 0.9);
      this.scene.physics.add.existing(proj);
      const body = proj.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * 130, Math.sin(angle) * 130);
      let hit = false;
      const cleanup = () => {
        if (hit) return; hit = true;
        try { this.scene.physics.world.removeCollider(ol); if (proj.active) proj.destroy(); } catch { /* scene restart */ }
      };
      const dmg = this.damage;
      const ol = this.scene.physics.add.overlap(proj, spawnedPlayer, () => {
        if (hit) return; cleanup();
        const cur = this.ctx.getPlayer();
        if (cur !== spawnedPlayer) return;
        if (cur.tryParryProjectile()) return;
        cur.takeDamage(Math.round(dmg * 0.7));
        cur.applyNetSlow(600);
      });
      this.ctx.getUpdateTickers().addOnce('raw', 3500, cleanup);
    }
  }

  /** Stoor Worm Phase 3 Death Thrash — 360° 8-shard burst. */
  private fireStoorWormThrash(): void {
    const shardCount = 8;
    const spawnedPlayer = this.ctx.getPlayer();
    for (let i = 0; i < shardCount; i++) {
      const angle = (Math.PI * 2 * i) / shardCount;
      const proj = this.scene.add.circle(this.x, this.y, 7, 0xaacc44, 0.9);
      this.scene.physics.add.existing(proj);
      const body = proj.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * 160, Math.sin(angle) * 160);
      let hit = false;
      const cleanup = () => {
        if (hit) return; hit = true;
        try { this.scene.physics.world.removeCollider(ol); if (proj.active) proj.destroy(); } catch { /* scene restart */ }
      };
      const dmg = this.damage;
      const ol = this.scene.physics.add.overlap(proj, spawnedPlayer, () => {
        if (hit) return; cleanup();
        const cur = this.ctx.getPlayer();
        if (cur !== spawnedPlayer) return;
        if (cur.tryParryProjectile()) return;
        cur.takeDamage(Math.round(dmg * 0.55));
      });
      this.ctx.getUpdateTickers().addOnce('raw', 2800, cleanup);
    }
  }

  // ── Ninth Legion ───────────────────────────────────────────────────────────

  private behaviorNinthLegion(tx: number, ty: number, delta: number): void {
    const next = simulateNinthLegionBehaviour(this.ninthLegionState, {
      deltaMs: delta,
      hpPct: this.maxHp > 0 ? this.hp / this.maxHp : 1.0,
    });
    this.ninthLegionState = next;

    if (next.shouldLiftShroud) {
      // Shroud lifts — silver centurion reveals.
      this.baseTint = 0xcccccc;
      this.setTint(0xcccccc);
      this.ctx.requestBanter('boss_warn', this.enemyKey);
    }

    if (next.isShrouded) {
      // Slow drift toward player while shrouded.
      this.setVelocityToward(tx, ty, this.speed * 0.4);
    } else {
      this.setVelocityToward(tx, ty, this.speed * next.speedMul);
    }

    if (next.shouldSpawnWave) {
      this.spawnNinthLegionWave(NINTH_LEGION_WAVE_SIZE);
    }
    if (next.shouldFireAttack) {
      this.fireNinthLegionFormation(tx, ty);
    }
    if (next.shouldSpawnRearguard) {
      this.spawnNinthLegionWave(NINTH_LEGION_REARGUARD_SIZE);
    }
  }

  private spawnNinthLegionWave(count: number): void {
    const spawnSystem = this.ctx.getSpawnSystem();
    const pool = spawnSystem.getEnemyGroup();
    const config = ENEMY_TYPES['spectre_legionary'];
    if (!config) return;
    const gameTime = spawnSystem.getGameTimeSec?.() ?? 0;
    for (let i = 0; i < count; i++) {
      const minion = Enemy.acquireFromPool(pool, this.ctxScene);
      if (!minion) break;
      const angle = ((Math.PI * 2) / count) * i;
      minion.spawn(
        this.x + Math.cos(angle) * 60,
        this.y + Math.sin(angle) * 60,
        config,
        gameTime,
      );
    }
  }

  /** Ninth Legion formation attack — 3 simultaneous pilum throws in a spread. */
  private fireNinthLegionFormation(tx: number, ty: number): void {
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const offsets = [-0.35, 0, 0.35];
    const spawnedPlayer = this.ctx.getPlayer();
    for (const off of offsets) {
      const angle = baseAngle + off;
      const proj = this.scene.add.rectangle(this.x, this.y, 14, 4, 0xccccaa, 0.9);
      this.scene.physics.add.existing(proj);
      const body = proj.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
      let hit = false;
      const cleanup = () => {
        if (hit) return; hit = true;
        try { this.scene.physics.world.removeCollider(ol); if (proj.active) proj.destroy(); } catch { /* scene restart */ }
      };
      const dmg = this.damage;
      const ol = this.scene.physics.add.overlap(proj, spawnedPlayer, () => {
        if (hit) return; cleanup();
        const cur = this.ctx.getPlayer();
        if (cur !== spawnedPlayer) return;
        if (cur.tryParryProjectile()) return;
        cur.takeDamage(Math.round(dmg * 0.65));
      });
      this.ctx.getUpdateTickers().addOnce('raw', 2200, cleanup);
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

    // Fire a "net" (slowing projectile) at the player on cooldown.
    // Beithir is a ranged enemy whose projectile is a venom fang
    // (Race the Beithir mechanic, DESIGN_IDEAS §1) rather than a net,
    // so it forks here keyed on config — sister to WeaponSystem.fire
    // Bouncing's shinty_stick texture fork. The strafe + standoff AI
    // is the same; only the projectile behaviour changes.
    this.rangedCooldown -= delta;
    if (this.rangedCooldown <= 0 && dist <= standoff * 1.5) {
      this.rangedCooldown = BALANCE.enemy.rangedCooldownMs;
      if (this.enemyKey === 'beithir') this.fireBeithirFang(tx, ty);
      else this.fireNet(tx, ty);
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

      // Shinty Parry (DESIGN_IDEAS §1) — if the player has an active
      // parry window, the projectile is negated. tryParryProjectile
      // returns true on consume + handles SFX/banter/tutorial caption
      // internally so the contact site stays a single check. The net
      // is already destroyed (cleanup() above), so a parried hit just
      // skips the slow.
      if (currentPlayer.tryParryProjectile()) return;

      // Apply a game-tick net slow (duration freezes with timeScale/pause).
      spawnedPlayer.applyNetSlow(2000);
    });

    // Auto-cleanup after 2 seconds if it misses (raw = wall-clock, survives pause)
    this.ctx.getUpdateTickers().addOnce('raw', 2000, cleanup);
  }

  /**
   * Fire a venom fang (Race the Beithir, DESIGN_IDEAS §1). Mirrors
   * `fireNet`'s shape — Phaser sprite + Arcade body + parry hook +
   * cleanup ticker — but on contact applies the sting via
   * `Player.applyBeithirStingFromFang` instead of the net's slow.
   *
   * Visual: baked `beithir_fang` sprite — sharp asymmetric fang
   * silhouette (rust-bronze body, cream outline, green venom bead).
   * Distinct *shape* from the net's circle so colorblind players
   * read fang-vs-net by silhouette, not just colour. Rotated to
   * point along the velocity vector. Falls back to the prior radius-
   * 4 rust-bronze circle when the texture is missing (unit-test
   * stubs that skip BootScene baking, per CLAUDE.md sister-system
   * safety pattern (c)). Speed 220 (vs net's 180): a sharper threat,
   * not a held area-denial.
   *
   * Hitbox stays a radius-4 circle either way — same physics as the
   * prior implementation, so the parry hook + immunity gates
   * (`isPlayerHazardImmune`) keep the same geometry.
   *
   * Single-projectile invariant per enemy: reuses `activeNetCleanup`
   * because rangedCooldown > the cleanup TTL (2 s), so a Beithir
   * never has two fangs in flight at once.
   */
  private fireBeithirFang(tx: number, ty: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const speed = 220;

    const fang: Phaser.GameObjects.Image | Phaser.GameObjects.Arc = this.scene.textures.exists('beithir_fang')
      ? this.scene.add.image(this.x, this.y, 'beithir_fang').setRotation(angle)
      : this.scene.add.circle(this.x, this.y, 4, 0xb88a4a, 0.95);
    this.scene.physics.add.existing(fang);
    const body = fang.body as Phaser.Physics.Arcade.Body;
    if ('texture' in fang) {
      // Image branch: AABB body defaults to displaySize. Re-anchor as
      // a radius-4 circle centred on the visual mid so collision
      // matches the prior `add.circle(r=4)` exactly. Offsets are in
      // image-local pixels: top-left of the inscribed 8×8 box.
      body.setCircle(4, fang.displayWidth / 2 - 4, fang.displayHeight / 2 - 4);
    }
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    let hit = false;
    const spawnedPlayer = this.ctx.getPlayer();

    const cleanup = () => {
      if (hit) return;
      hit = true;
      if (this.activeNetCleanup === cleanup) this.activeNetCleanup = null;
      try {
        this.scene.physics.world.removeCollider(overlapRef);
        if (fang.active) fang.destroy();
      } catch { /* scene may have restarted */ }
    };
    this.activeNetCleanup?.();
    this.activeNetCleanup = cleanup;

    const overlapRef = this.scene.physics.add.overlap(fang, spawnedPlayer, () => {
      if (hit) return;
      cleanup();

      const currentPlayer = this.ctx.getPlayer();
      if (currentPlayer !== spawnedPlayer) return;

      // Same parry hook as fireNet — a parried fang is fully negated,
      // no sting applied, the player keeps the agency beat. Sister to
      // the existing parry/applyNetSlow chain so future projectile
      // types pick up parry support uniformly.
      if (currentPlayer.tryParryProjectile()) return;

      currentPlayer.applyBeithirStingFromFang(this.eliteFlag);
    });

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
    // Stationary — summon a configured minion on spawnerCooldown interval.
    // Default minion is midge (nest's historical contract); Nicnevin overrides
    // via `spawnerMinionKey: 'unseelie_fiddler'` for the Unseelie ring fantasy.
    this.setVelocity(0, 0);
    this.spawnerCooldown -= delta;
    if (this.spawnerCooldown <= 0) {
      this.spawnerCooldown = BALANCE.enemy.spawnerIntervalMs;
      const spawnSystem = this.ctx.getSpawnSystem();
      const pool = spawnSystem.getEnemyGroup();
      const minion = Enemy.acquireFromPool(pool, this.ctxScene);
      if (!minion) return;
      const angle = pickSpawnerMinionAngle(this.ctx.getRunRng());
      const dist = 20;
      const minionConfig: EnemyConfig =
        (this.spawnerMinionKey && ENEMY_TYPES[this.spawnerMinionKey])
          || { key: 'midge', texture: 'midge', speed: 130, hp: 2, damage: 3, xpValue: 1, appearsAt: 0, behavior: 'swarm' as EnemyBehavior, packSize: 1 };
      // Pass current game time so spawned minions inherit HP/damage scaling
      const gameTime = spawnSystem.getGameTimeSec?.() ?? 0;
      minion.spawn(this.x + Math.cos(angle) * dist, this.y + Math.sin(angle) * dist, minionConfig, gameTime);
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

  /**
   * Selkie Song charm — redirect enemy toward other enemies for durationMs.
   * Charmed enemies stop targeting the player and walk toward the nearest
   * non-boss enemy instead. Bosses and hazards are immune.
   */
  applyCharm(durationMs: number): void {
    if (this.behavior === 'hazard' || this.bossFlag) return;
    this.charmTimer = Math.max(this.charmTimer, durationMs);
    if (!this.charmTargetEnemy?.active) this.pickCharmTarget();
    this.setTint(0x88ccee);
  }

  private pickCharmTarget(): void {
    const pool = this.ctx.getSpawnSystem().getEnemyGroup().getChildren() as Enemy[];
    let nearest: Enemy | null = null;
    let nearestD2 = Infinity;
    for (const e of pool) {
      if (!e.active || e === this || e.isBoss()) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < nearestD2) { nearestD2 = d2; nearest = e; }
    }
    this.charmTargetEnemy = nearest;
  }

  private clearCharm(): void {
    this.charmTimer = 0;
    this.charmTargetEnemy = null;
    if (this.baseTint) this.setTint(this.baseTint);
    else this.clearTint();
  }

  private behaviorCharm(): void {
    if (!this.charmTargetEnemy?.active) this.pickCharmTarget();
    if (!this.charmTargetEnemy?.active) { this.setVelocity(0, 0); return; }
    this.setVelocityToward(this.charmTargetEnemy.x, this.charmTargetEnemy.y, this.speed);
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
    // Taxman Grudge Ledger — fire `eliteOrBossFinished` for elite/boss
    // finishes routed through Enemy (hazard / DoT / drown / debug-kill).
    // The weapon-damage path emits the same event from `WeaponSystem`
    // directly — paths are disjoint (WeaponSystem calls `enemy.takeDamage`
    // which doesn't reach this method), so no double-count. Distance is
    // measured from the live player position because external death
    // sources don't precompute it the way `WeaponSystem` does.
    if (wasBoss || wasElite) {
      const player = this.ctx.getPlayer();
      const distancePx = Math.hypot(killX - player.x, killY - player.y);
      ws.events.emit('eliteOrBossFinished', {
        enemyKey: key,
        wasBoss,
        distancePx,
      });
    }
  }

  takeDamage(amount: number): boolean {
    if (this.behavior === 'hazard') return false; // invincible
    if (!this.active) return false; // already dead — volatile splash chains must not re-enter

    // Ghost: 50% damage resistance while phased (in addition to projectile pass-through)
    if (this.behavior === 'phase' && this.isPhased) {
      amount = Math.ceil(amount * 0.5);
    }

    // Stoor Worm: 80% DR while scale-locked (sealed window).
    if (this.behavior === 'stoor_worm' && this.stoorWormState.isScaleLocked) {
      amount = Math.max(1, Math.round(amount * (1 - STOOR_WORM_SCALE_LOCK_DR)));
    }

    // Ninth Legion: 90% DR while centurion is shrouded (phase 1).
    if (this.behavior === 'ninth_legion' && this.ninthLegionState.isShrouded) {
      amount = Math.max(1, Math.round(amount * (1 - NINTH_LEGION_SHROUD_DR)));
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

    // Race the Beithir (DESIGN_IDEAS §1) — slaying ANY beithir cleanses
    // the venom in folklore. Hooked at the top of die() so the cure
    // fires regardless of how the beithir died (weapon, hazard, DoT).
    // No-op when the player isn't currently stung.
    if (this.enemyKey === 'beithir') {
      this.ctx.getPlayer().cureBeithirStingFromKill();
    }

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
    // Twin Stones — destroy cosmetic Stone B so pool re-use gets a fresh shadow.
    if (this.twinStoneShadow) {
      try { this.twinStoneShadow.destroy(); } catch { /* scene restart */ }
      this.twinStoneShadow = null;
      this.twinStoneShadowInitialized = false;
    }
    // Wicker Haggis — reset phase state so pool re-use starts in Phase 1.
    this.wickerHaggisState = initialWickerHaggisState();
    this.wickerPhaseTwoTinted = false;
    // Nessie — reset so pool re-use starts in Phase 1.
    this.nessieState = initialNessieState();
    // Auld Reekie — destroy lamp posts and reset state.
    for (const lamp of this.lampPostSprites) {
      try { lamp.destroy(); } catch { /* scene restart */ }
    }
    this.lampPostSprites = [];
    this.lampAnchorPositions = [];
    this.auldReekieInitialized = false;
    this.auldReekieState = initialAuldReekieState();
    // Taxman — reset phase state so pool re-use starts in Phase 1.
    this.taxmanGrudgeState = initialTaxmanGrudgeState();
    this.stoorWormState = initialStoorWormState();
    this.ninthLegionState = initialNinthLegionState();
  }

  destroy(fromScene?: boolean): void {
    this.activeNetCleanup?.();
    this.activeNetCleanup = null;
    this.scene?.tweens.killTweensOf(this);
    this.hpBarBg?.destroy();
    this.hpBarFill?.destroy();
    this.eliteAffixNameText?.destroy();
    this.shadow?.destroy();
    this.twinStoneShadow?.destroy();
    this.hpBarBg = null;
    this.hpBarFill = null;
    this.eliteAffixNameText = null;
    this.shadow = null;
    this.twinStoneShadow = null;
    this.twinStoneShadowInitialized = false;
    this.wickerHaggisState = initialWickerHaggisState();
    this.wickerPhaseTwoTinted = false;
    this.nessieState = initialNessieState();
    for (const lamp of this.lampPostSprites) {
      try { lamp.destroy(); } catch { /* scene restart */ }
    }
    this.lampPostSprites = [];
    this.lampAnchorPositions = [];
    this.auldReekieInitialized = false;
    this.auldReekieState = initialAuldReekieState();
    this.taxmanGrudgeState = initialTaxmanGrudgeState();
    this.stoorWormState = initialStoorWormState();
    this.ninthLegionState = initialNinthLegionState();
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
