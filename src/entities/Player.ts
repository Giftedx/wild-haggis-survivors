import * as Phaser from 'phaser';
import { COLORS, PLAYER, GAME } from '../config';
import { InputManager } from '../utils/input';
import type { IInput } from '../utils/iInput';
import { getSettingsManager } from '../core/SettingsManager';
import {
  loadSkillKeyHandles,
  stanceBindingOverlapsPause,
} from '../input/skillKeyBindings';
import { rotateVectorIntoPrecomputed } from '../utils/math';
import { evaluateBurnLeap } from './burnLeapInput';
import { audio } from '../systems/AudioSystem';
import { softBoundarySteer } from './softBoundarySteer';
import { playerGrowthScale } from './playerGrowthScale';
import { playerLevelSpeedMul, playerLevelDriftMul } from './playerLevelScaling';
import { TimeManager } from '../systems/TimeManager';
import type { TickerHandle } from '../utils/UpdateTickers';
import { SubscriptionBag } from '../utils/SubscriptionBag';
import { BALANCE } from '../core/BalanceConfig';
import type { PlayerComposedSheet } from '../core/StatComposer';
import type { ISceneContext } from '../core/ISceneContext';
import { AnimationController } from '../animation/AnimationController';
import type { AnimationState } from '../animation/animationStates';
import { HaggisContainer } from './haggisComposition/HaggisContainer';
import type { AccessoryDrawer } from './haggisComposition/AccessoryDrawer';
import { getAccessoryDrawer } from './haggisComposition/accessoryRegistry';
import type { MantleTier } from '../animation/mantleTier';
import { applyMantleTier } from './Player.mantle';
import {
  MANTLE_PULSE_RADIUS_PX,
  MANTLE_PULSE_TWEEN_MS,
  tickMantlePulseTimer,
} from './mantlePulse';
import {
  STUMBLE_DURATION_MS,
  STUMBLE_SPEED_MUL,
  detectDashReverse,
} from './dashReverseStumble';
import {
  computeBagpipeLureVector,
  type BagpipeLureSource,
} from '../systems/bagpipeLure';
import {
  type DriftMasteryState,
  createDriftMasteryState,
  tickDriftMastery,
} from './driftMastery';
import {
  type WhiskyBreathState,
  createWhiskyBreathState,
  tickWhiskyBreath,
  STACKS_MAX,
} from './whiskyBreath';
import {
  type Stance,
  DEFAULT_STANCE,
  cycleStance,
  getStanceModifiers,
} from './stanceToggle';
import {
  type ShintyParryState,
  createShintyParryState,
  tickShintyParry,
  consumeParry,
  isParryActive,
  isParryReady,
  parryCooldownFraction,
} from './shintyParry';
import {
  type RaceTheBeithirState,
  initialBeithirState,
  applyBeithirSting,
  cureBeithirSting,
  tickBeithir,
  isStung as isBeithirStungHelper,
  stingRemainingFraction,
  computeStingExpireDamage,
  RACE_DURATION_MS,
  RACE_DURATION_ELITE_BONUS_MS,
} from './raceTheBeithir';
import {
  type SelkieForm,
  type SelkieFormState,
  createSelkieFormState,
  getSelkieFormModifiers,
  toggleSelkieFormOnDashEdge,
} from './selkieForm';
import type { Enemy } from './Enemy';
import { bumpBeithirCured } from '../utils/save/bumpers';
import {
  isExtendedIFramesEnabled,
  isInvincibilityEnabled,
} from '../systems/accessibility/AssistMode';
import type { RuneEffectBag } from '../systems/runes/runeEffects';
import { getPostDashGraceMs } from './playerDashAssist';
import {
  composeDamageMul,
  composeMaxHpMul,
  composeSpeedMul,
  composeXpMul,
  composeCritBonus,
  composeLuckBonus,
} from '../systems/runes/runeConsumer';

/**
 * Player — the wild haggis.
 *
 * Movement uses "The Drift": a constant clockwise rotational offset
 * applied to the input vector, simulating the creature's uneven legs.
 * The player must constantly correct to move in a straight line,
 * while clockwise circling feels natural.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private inputManager: IInput;
  private time: TimeManager;
  private subs = new SubscriptionBag();
  /** Reused in update() — avoids allocating a fresh vector for drift each frame. */
  private readonly driftScratch = { x: 0, y: 0 };

  /** Write the input components into the shared scratch and return it.
   *  Used by the Drift Mastery burst path so a cancelled-drift frame
   *  shares the same vector identity as the normal drift-rotated frame
   *  (downstream code reads `drifted.x` / `drifted.y` either way). */
  private assignScratch(x: number, y: number): { x: number; y: number } {
    this.driftScratch.x = x;
    this.driftScratch.y = y;
    return this.driftScratch;
  }
  /** Last non-zero movement intent, used as a dash fallback direction. */
  private readonly lastMoveDir = { x: 0, y: -1 };
  /** When set, overrides joystick/keyboard for automated balance runs. */
  private autoBattleSteering: { x: number; y: number } | null = null;

  /** Run baseline before variant / shop modifiers (from StatComposer + level scaling). */
  private readonly runBaseSpeed: number;
  private readonly runBaseMaxHp: number;
  private readonly runBaseDrift: number;
  private readonly runBasePickup: number;

  // Base stats (from level scaling only)
  private baseMoveSpeed: number = PLAYER.SPEED;
  private baseDriftDegrees: number = PLAYER.DRIFT_DEGREES;

  // Accumulated upgrade bonuses (preserved across level-ups)
  private bonusSpeed: number = 0;
  private bonusDriftReduction: number = 0;  // Fraction reduced (0-1)
  /**
   * Sign of the Drift. +1 = clockwise (classic), -1 = anticlockwise
   * (the second wild-haggis subspecies — SCOTTISH_RESEARCH_DEEP §11.5).
   * Applied in recalcStats() to the pre-baked drift rotation matrix.
   */
  private driftSign: 1 | -1 = 1;
  private bonusMaxHp: number = 0;
  private bonusPickupRadius: number = 0;
  /** Moor moment — temporary vacuum wider than level scaling; ticks down in update(). */
  private moorMomentPickupFlat: number = 0;
  private moorMomentPickupRemainingMs: number = 0;
  /** Ceilidh Chain — stacks additively with moorMomentPickupFlat. */
  private ceilidhPickupFlat: number = 0;
  private ceilidhPickupRemainingMs: number = 0;
  private bonusDamageMultiplier: number = 1.0;  // Global damage multiplier
  private bonusAoeMultiplier: number = 1.0;     // AoE radius multiplier
  private bonusAttackSpeedMultiplier: number = 1.0; // Cooldown multiplier
  private bonusCritChance: number = 0;             // Added to base 10%
  private bonusArmor: number = 0;                  // Flat damage reduction
  private hpRegen: number = 0;                     // HP per second
  private regenAccumulator: number = 0;            // Sub-HP regen accumulator
  private bonusCooldownReduction: number = 0;      // Fraction reduced (0-1)
  private bonusXpMultiplier: number = 1.0;         // XP gain multiplier
  private bonusLifesteal: number = 0;              // HP healed per kill
  private bonusCritDamageMultiplier: number = 2.0; // Crit damage multiplier (base 2x)
  private thornsDamage: number = 0;                // Damage reflected on contact
  private bonusProjectileSpeedMul: number = 1.0;   // Projectile speed multiplier
  private bonusKnockbackMul: number = 1.0;         // Knockback multiplier
  private bonusBossHealFrac: number = 0;           // HP% healed on boss kill
  /** Additive luck bonus passed to level-up card draw weights (same scale as sporran +15). */
  private bonusLuckDraw: number = 0;
  private shieldActive: boolean = false;           // One-time death prevention
  private shieldCooldown: number = 0;              // Shield recharge timer
  private readonly SHIELD_COOLDOWN_MS = BALANCE.player.shieldCooldownMs;

  // Final computed stats
  private moveSpeed: number = PLAYER.SPEED;
  /** Biome-driven speed multiplier — e.g. 0.85 in the bog. 1 = no effect. */
  private biomeSpeedMul: number = 1;
  /** Hazard-driven slick slowdown — true while the player stands on a
   *  buckfast-bottle slick zone. HazardZones ticks this each frame so
   *  stepping off restores full speed without manual timer bookkeeping. */
  private inSlick: boolean = false;
  /** Movement multiplier applied while `inSlick` — 0.55 = 45 % slow. */
  private readonly SLICK_SPEED_MUL = 0.55;
  /** Hazard-driven fog drift — true while the player stands inside a
   *  haar-wraith fog patch. Halves the pickup radius so magnet farms
   *  get interrupted; no speed / damage penalty (slick already covers
   *  movement pressure). */
  private inFog: boolean = false;
  /** Pickup-radius multiplier applied while `inFog`. */
  private readonly FOG_PICKUP_MUL = 0.5;
  /** Biome-driven knockback bonus applied on incoming damage. 1 = no effect. */
  private biomeKnockbackBonus: number = 1;
  /** Biome-driven XP gem value multiplier — read by XPSystem at collect time. */
  private biomeXpMul: number = 1;
  /** Biome-driven drift multiplier — baked into recalcStats, not read at use-time. */
  private biomeDriftMul: number = 1;
  /** Constant wind force applied every frame (px/s). Non-zero only on Ben Nevis. */
  private biomeWindX: number = 0;
  private biomeWindY: number = 0;
  private driftDegrees: number = PLAYER.DRIFT_DEGREES;
  /** Pre-baked rotation matrix entries for `driftDegrees`. Refreshed in
   *  `recalcStats()` so the per-frame drift apply collapses to four
   *  multiplies — `Math.cos`/`Math.sin` only fire when stats actually change. */
  private driftCos: number = 1;
  private driftSin: number = 0;

  // Drift Mastery (DESIGN_IDEAS §1) — sustained motion banks Grip pips;
  // pressing Q (`gripBurstKey`) spends one pip for a short drift-cancel
  // burst with a small move-speed kicker. Pure-helper-driven so replay
  // determinism holds; the helper consumes the same scaledDelta /
  // input stream the rest of update() uses.
  private driftMasteryState: DriftMasteryState = createDriftMasteryState();
  private gripBurstKey: Phaser.Input.Keyboard.Key | null = null;
  private gripBurstKeyPrevDown: boolean = false;
  /** True until the player banks the first pip in this run; flips false
   *  on first bank and stays so for the rest of the run. Drives the
   *  one-shot tutorial toast. */
  private gripFirstBankPending: boolean = true;
  /** Same shape for the first-burst tutorial toast. */
  private gripFirstBurstPending: boolean = true;

  // Whisky Breath (DESIGN_IDEAS §1) — kill-stack mechanic. Each non-
  // boss kill banks a stack; W key consumes them as an AOE damage
  // burst around the haggis. Pure-helper-driven so replay determinism
  // holds (helper consumes the same kill stream + input edge a replay
  // would replay). Damage application iterates the live enemy group
  // via `sceneCtx.getSpawnSystem().getEnemyGroup()`.
  private whiskyBreathState: WhiskyBreathState = createWhiskyBreathState();
  private whiskyBreathKey: Phaser.Input.Keyboard.Key | null = null;
  private whiskyBreathKeyPrevDown: boolean = false;
  /** Kill events buffered between Player.update ticks. Subscribed to
   *  `weaponSystem.events.on('enemyKilled', …)` in the constructor;
   *  flushed to the helper as `killsThisFrame` and reset to 0. Excludes
   *  bosses (handled in the listener). */
  private whiskyBreathKillsBuffer: number = 0;
  /** First-bank tutorial caption — fires once per run on the first
   *  whisky stack banked. */
  private whiskyBreathFirstBankPending: boolean = true;
  /** First-burst tutorial caption — fires once per run on the first
   *  successful breath. */
  private whiskyBreathFirstBurstPending: boolean = true;

  // Stance Toggle (DESIGN_IDEAS §1) — third skill-expression layer
  // alongside Drift Mastery (burst) + Whisky Breath (kill-stack burst).
  // A persistent posture the player cycles with Q: loose (neutral) →
  // braced (slow + drift halved) → reeling (fast + drift amplified).
  // No charge meter; the mode itself is the loop. Stance modifies
  // `driftDegrees` via recalcStats() so the precomputed drift matrix
  // re-bakes on cycle (rare event, cheap), and feeds a `stanceSpeedMul`
  // into the velocity-apply line alongside the other multipliers.
  // Replay-deterministic: cycle is an edge-driven enum step.
  private stance: Stance = DEFAULT_STANCE;
  private stanceCycleKey: Phaser.Input.Keyboard.Key | null = null;
  private stanceCycleKeyPrevDown: boolean = false;
  /** First-cycle tutorial caption — fires once per run on the first
   *  Q-press. */
  private stanceFirstCyclePending: boolean = true;

  // Shinty Parry (DESIGN_IDEAS §1) — fourth skill-expression layer.
  // E-edge opens a short timed window (`PARRY_WINDOW_MS`); any enemy
  // projectile contact during the window is negated, transitions the
  // helper to cooldown, and grants a brief iframe burst. Pure-helper
  // driven so replay determinism holds; the consume path is invoked
  // by Enemy.fireNet's overlap callback through `tryParryProjectile`.
  private shintyParryState: ShintyParryState = createShintyParryState();
  private shintyParryKey: Phaser.Input.Keyboard.Key | null = null;
  private shintyParryKeyPrevDown: boolean = false;
  /** First-success tutorial caption — fires once per run on the first
   *  consumed parry. */
  private parryFirstSuccessPending: boolean = true;

  // Race the Beithir (DESIGN_IDEAS §1) — venom-fang projectile from
  // the Beithir enemy opens an 8 s race window. While stung, the
  // player is unimpaired but the timer drains; on expire, takes a
  // slice of max-HP. Cure paths: touch a heal patch (HazardZones
  // folkloric "running water under a bridge") OR kill the Beithir
  // (Enemy.die when key === 'beithir'). The pure helper owns state;
  // Player owns the SFX/banter/damage side-effects + max-HP lock.
  private beithirState: RaceTheBeithirState = initialBeithirState();
  /** Locked at sting time so a max-HP shift mid-race (level-up,
   *  rune-bag, relic) doesn't drift the expire damage. Mirrors
   *  clootieTree's runBaseMaxHp lock. */
  private beithirMaxHpAtSting: number = 0;

  // Wild Living World — Selkie Dual-Form state. Only meaningful when
  // the active variant is `selkie`; for other runs the dash-edge
  // helper short-circuits and the form stays `haggis`. The Player
  // owns the state so the form survives weapon/spawn ticks; HUD reads
  // through `getSelkieForm()`.
  private selkieFormState: SelkieFormState = createSelkieFormState();
  /**
   * Snapshot of the variant key captured at run start. Cached because
   * the Player doesn't re-bind the variant mid-run and we want the
   * dash-edge helper to short-circuit on every dash without an
   * indirect lookup.
   */
  private selkieVariantKey: string = 'classic';
  /**
   * Callback used to notify the LivingWorld director of a form
   * shift. Optional — `null` for tests or scenes that don't wire
   * the director. The Player invokes it AFTER the state mutation so
   * listeners read the new form.
   */
  private onSelkieFormShifted: ((form: SelkieForm) => void) | null = null;
  /**
   * Wild Living World Phase 2 — biome accessor for the Selkie coastal
   * affinity bloom. Returns the biome ID the Player currently stands
   * in, or `null` when the BiomeController isn't bound (tests / scene
   * tear-down). The accessor is queried each call to
   * `getMoveSpeed` / `getDriftDegrees` / `getEffectivePickupRadius`,
   * so the bloom resolves against the live biome with no extra plumbing.
   */
  private biomeAccessor: (() => string | null) | null = null;

  // Burn Leap (M8) — double-tap direction for a short hazard-iframe hop.
  // Distinct from dash: no enemy-damage immunity, shorter windows, own
  // cooldown. It's a routing tool for moor patches (slick / fog / lava),
  // not a combat escape. Timers tick with scaledDelta so slow-motion and
  // pause behave the same as dash. The `burnLeapPrevDir` + release-edge
  // fields drive the pure detector in `burnLeapInput.ts`, kept here so
  // the replay playback path re-detects the same leaps deterministically
  // from the recorded direction stream.
  // Hebridean variant — immune to water-type hazards (burn_water / tidal_wrack).
  // Set via applyVariantModifiers at run start; reset by class construction.
  private _waterHazardImmune: boolean = false;

  // Iron Brew variant — each hit taken stacks +2% outgoing damage (cap 20 stacks).
  private _ironBrewStacking = false;
  private _ironBrewStacks = 0;
  private static readonly IRON_BREW_DMG_PER_STACK = 0.02;
  private static readonly IRON_BREW_MAX_STACKS = 20;

  // Gran's Best variant — +30% damage while HP ≤ 40% of max.
  private _granBestEnabled = false;
  private static readonly GRAN_BEST_THRESHOLD = 0.40;
  private static readonly GRAN_BEST_BONUS = 0.30;

  // Jacobite variant — Flora's Plaid: 2s invincibility every 60s.
  private _floraPlaidEnabled = false;
  private _floraPlaidCooldownRemainingMs = 0;
  private _floraPlaidActiveRemainingMs = 0;
  private static readonly FLORA_PLAID_COOLDOWN_MS = 60000;
  private static readonly FLORA_PLAID_ACTIVE_MS = 2000;

  private burnLeapActiveRemainingMs: number = 0;
  private burnLeapBoostRemainingMs: number = 0;
  private burnLeapCooldownRemainingMs: number = 0;
  private burnLeapTimeMs: number = 0;
  private burnLeapReleaseTimeMs: number = -99999;
  private burnLeapReleaseDir: { x: number; y: number } | null = null;
  private burnLeapPrevDir: { x: number; y: number } = { x: 0, y: 0 };
  private readonly BURN_LEAP_ACTIVE_MS = 280;
  private readonly BURN_LEAP_BOOST_MS = 180;
  private readonly BURN_LEAP_COOLDOWN_MS = 700;
  private readonly BURN_LEAP_SPEED_MUL = 1.55;

  // Dash ability — charge-based so Double Dash perk can grant a 2nd charge
  private dashCooldown: number = 0;
  private DASH_COOLDOWN_MS: number = BALANCE.player.dashCooldownMs;
  private readonly DASH_SPEED = BALANCE.player.dashSpeed;
  private readonly DASH_DURATION_MS = BALANCE.player.dashDurationMs;
  private isDashing: boolean = false;
  private dashInvincible: boolean = false;
  private dashRemainingMs: number = 0;
  private postDashInvincibilityRemainingMs: number = 0;
  private maxDashCharges: number = 1;
  private dashCharges: number = 1;

  private animController!: AnimationController;
  private hurtEdgeThisFrame = false;
  private attackEdgeThisFrame = false;
  private celebrateEdgeThisFrame = false;
  private animStateOverride: AnimationState | null = null;
  private haggisContainer!: HaggisContainer;
  /** Stored so variant-aware accessories (kilt) use the correct atlas. */
  private variantKey: string = 'classic';
  private mantleOverlay: Phaser.GameObjects.Sprite | null = null;
  private mantleTier: MantleTier = 0;
  private mantleLastScale = 1;
  /** Accumulated ms since the last mantle pulse fired. Tier-2 only. */
  private mantlePulseAccumMs = 0;

  // Falls-If-Turning gag (DESIGN_IDEAS §1; SCOTTISH_RESEARCH_DEEP §11.5).
  // Track the previous dash direction + time so the next dash can be
  // checked against it; if the new dash reverses inside a short window,
  // the haggis stumbles after the dash completes.
  private lastDashDir: { x: number; y: number } | null = null;
  private lastDashTimeMs: number = -Infinity;
  /** Set during a reverse dash; consumed when isDashing flips false. */
  private pendingStumbleAfterDash: boolean = false;
  /** Remaining stumble duration. Halves move speed while > 0. */
  private stumbleRemainingMs: number = 0;
  private ownedAccessories: Array<{
    id: string;
    drawer: AccessoryDrawer;
    controller: AnimationController;
  }> = [];

  /** Soft ground shadow that follows the player */
  private shadow: Phaser.GameObjects.Image | null = null;

  // Net slow debuff tracking — only apply once regardless of how many nets hit
  private netSlowStacks: number = 0;
  private readonly NET_SLOW_AMOUNT = BALANCE.player.netSlowAmount;
  private netSlowTimersMs: number[] = [];
  private currentLevel: number = 1;
  private hp: number;
  private maxHp: number;
  private pickupRadius: number;

  private readonly BASE_HITBOX_RADIUS = BALANCE.player.baseHitboxRadius;
  private dashTrailHandles: TickerHandle[] = [];

  /**
   * U1 M4 — RuneEffectBag accessor. Set by GameScene right after Player
   * construction; getters fold the bag into final stat multipliers without
   * touching `recalcStats` per frame. Returns null when no rune system is
   * attached (tests, Phaser-free harnesses) — getters degrade to identity.
   *
   * The accessor is a function rather than a direct reference so the
   * GameScene-side bag can be replaced on run reset without re-wiring.
   */
  private runeBagAccessor: (() => RuneEffectBag | null) = () => null;

  /** Inject the rune bag accessor. Called once in GameScene.create(). */
  setRuneBagAccessor(accessor: (() => RuneEffectBag | null) | null): void {
    this.runeBagAccessor = accessor ?? (() => null);
  }

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string = 'haggis_classic',
    timeManager: TimeManager,
    composed?: PlayerComposedSheet,
    /**
     * T1 replay — optional input source. Defaults to `new InputManager(scene)`
     * for live play. GameScene injects a `ReplayInput` when replay mode is
     * `play`, which drives Player from a recorded frame stream instead of
     * live keyboard/gamepad. The injected source owns its own teardown via
     * the `IInput.destroy()` contract.
     */
    inputSource?: IInput,
  ) {
    if (!timeManager) {
      throw new Error('Player requires a TimeManager (strict DI).');
    }
    super(scene, x, y, textureKey);

    this.runBaseSpeed = composed?.speed ?? PLAYER.SPEED;
    this.runBaseMaxHp = composed?.maxHp ?? PLAYER.MAX_HP;
    this.runBaseDrift = composed?.driftDegrees ?? PLAYER.DRIFT_DEGREES;
    this.runBasePickup = composed?.pickupRadius ?? PLAYER.PICKUP_RADIUS;

    this.baseMoveSpeed = this.runBaseSpeed;
    this.baseDriftDegrees = this.runBaseDrift;
    this.hp = this.runBaseMaxHp;
    this.maxHp = this.runBaseMaxHp;
    this.pickupRadius = this.runBasePickup;
    this.moveSpeed = this.runBaseSpeed;
    this.driftDegrees = this.runBaseDrift;

    if (composed?.damagePctBonus) {
      this.addDamageMultiplier(composed.damagePctBonus);
    }
    if (composed?.hpRegen) this.addHpRegen(composed.hpRegen);
    if (composed?.critBonus) this.addCritChance(composed.critBonus);
    if (composed?.cooldownReduction) this.addCooldownReduction(composed.cooldownReduction);
    if (composed?.xpGainBonus) this.addXpMultiplier(composed.xpGainBonus);
    if (composed?.armorBonus) this.addArmor(composed.armorBonus);
    if (composed?.dashCooldownReduction) {
      this.DASH_COOLDOWN_MS = Math.round(BALANCE.player.dashCooldownMs * (1 - composed.dashCooldownReduction));
    }

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.refreshSkillKeyBindings(scene);
    // Subscribe to the run's enemy-kill stream so the helper can bank
    // a stack per kill. Bosses excluded — Whisky Breath rewards the
    // sustained mob-clear rhythm, not boss damage. SubscriptionBag
    // owns the listener so a scene-restart cleanly drops it.
    const sceneCtxInit = scene as Phaser.Scene & Partial<ISceneContext>;
    const ws = sceneCtxInit.getWeaponSystem?.();
    if (ws) {
      const killHandler = (
        _x: number, _y: number, _xp: number, _key: string, wasBoss: boolean,
      ): void => {
        if (wasBoss) return;
        this.whiskyBreathKillsBuffer += 1;
      };
      ws.events.on('enemyKilled', killHandler);
      this.subs.add(() => ws.events.off('enemyKilled', killHandler));
    }

    // Soft boundary — no hard wall, player slows near edges
    this.setCollideWorldBounds(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    // Dynamic offset so the hitbox stays centered regardless of texture size
    // (haggis texture grew from 48 → 56 in the art pass).
    body.setCircle(
      this.BASE_HITBOX_RADIUS,
      (this.width / 2) - this.BASE_HITBOX_RADIUS,
      (this.height / 2) - this.BASE_HITBOX_RADIUS
    );

    // Ground shadow — rendered below the sprite. Terrain lives at depth -10 to -5,
    // so depth -1 places the shadow above terrain but below all entities (which
    // default to depth 0).
    this.shadow = scene.add.image(x, y + 22, 'entity_shadow').setDepth(-2).setScale(1.1);

    // Derive the variant key from the legacy texture key so the same
    // variant selected upstream drives the animated atlas. All variant
    // atlases are pre-baked at boot; runtime just binds by key.
    const variantKey = textureKey.startsWith('haggis_')
      ? textureKey.slice('haggis_'.length)
      : 'classic';
    this.variantKey = variantKey;
    // W71 Phase 2 — heather mantle overlay. Starts invisible; GameScene
    // will call setMantleTier immediately after spawn to pre-seed from
    // current kill count. Tier 1 texture is the initial key because the
    // sprite needs some texture to exist at construction; it is not
    // visible until a tier is actually shown.
    this.mantleOverlay = scene.add.sprite(x, y, `mantle_${this.variantKey}_1`);
    // Depth sits just behind the body (-0.5 offset) so the haggis silhouette
    // covers the front half of the cape/collar. HAGGIS_LAYER_DEPTHS reserves
    // integer offsets (behind:-1, body:0, front:1, above:2) for the
    // accessory container; the half-step keeps the mantle above `behind`
    // accessories without colliding with any of the named slots.
    this.mantleOverlay.setDepth(this.depth - 0.5);
    this.mantleOverlay.setAlpha(0);
    this.mantleOverlay.setVisible(false);
    this.mantleLastScale = 1;
    this.animController = new AnimationController({
      sprite: this,
      subject: 'haggis',
      variant: variantKey,
    });

    this.haggisContainer = new HaggisContainer(scene, this, variantKey);

    this.inputManager = inputSource ?? new InputManager(scene);
    this.time = timeManager;
  }

  /**
   * Burn Leap visual cue — cyan burst ring at the player's feet on trigger.
   * Reads at a glance as "something happened" without competing with the
   * whiskey-gold dash after-images. Cosmetic-only — uses `Math.random()`
   * per the rng.ts policy, so cosmetic jitter stays outside the replay
   * determinism contract.
   */
  private spawnBurnLeapFlash(): void {
    if (!this.active) return;
    const ring = this.scene.add
      .circle(this.x, this.y, 12, 0x80eefc, 0.55)
      .setDepth(4);
    this.scene.tweens.add({
      targets: ring,
      scale: 3.2,
      alpha: 0,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
    const inner = this.scene.add
      .circle(this.x, this.y, 7, 0xf0fcff, 0.7)
      .setDepth(5);
    this.scene.tweens.add({
      targets: inner,
      scale: 2.2,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => inner.destroy(),
    });
  }

  /**
   * Whisky Breath AOE burst — iterates the live enemy group, applies
   * `damage` to every non-hazard enemy within `radius` of the player,
   * and spawns a warm-amber expanding ring + inner ember flash to
   * sell the exhale visually. Damage path is
   * `takeDamageWithKillEvents` so kill credit + drops route through
   * the standard kill cascade (bumps killCount, fires drops, banks
   * the next whisky stack on overlap kills — small kill-loop
   * compound, intentional).
   */
  private applyWhiskyBreathBurst(radius: number, damage: number): void {
    if (!this.active) return;
    const sceneCtxLocal = this.scene as Phaser.Scene & Partial<ISceneContext>;
    const enemyGroup = sceneCtxLocal.getSpawnSystem?.().getEnemyGroup();
    const radSq = radius * radius;
    if (enemyGroup) {
      const enemies = enemyGroup.getChildren() as Enemy[];
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i]!;
        if (!e.active) continue;
        const dx = e.x - this.x;
        const dy = e.y - this.y;
        if (dx * dx + dy * dy > radSq) continue;
        e.takeDamageWithKillEvents(damage);
      }
    }
    // Slice 2 — leave a burning whisky puddle at the burst origin.
    // DoT-per-tick scales with the instant damage so a full-charge
    // breath leaves a meaner residue (caller passes ceil(damage / 4)
    // — instant burst lands ~5× the puddle's per-tick damage, six
    // tick-windows over the puddle lifetime). Player bypasses this
    // path silently when the scene doesn't wire it (test stubs).
    sceneCtxLocal.spawnWhiskyPuddle?.(this.x, this.y, Math.max(1, Math.ceil(damage / 4)));
    // Warm-amber expanding ring (whisky-cask glow), 220 ms life.
    const ring = this.scene.add
      .circle(this.x, this.y, 18, 0xd4a040, 0.55)
      .setDepth(4);
    this.scene.tweens.add({
      targets: ring,
      scale: radius / 18,
      alpha: 0,
      duration: 240,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
    // Inner ember flash — brighter cream-white core fades fast.
    const inner = this.scene.add
      .circle(this.x, this.y, 9, 0xfff0c8, 0.8)
      .setDepth(5);
    this.scene.tweens.add({
      targets: inner,
      scale: 2.4,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => inner.destroy(),
    });
  }

  private tryDash(): void {
    if (this.dashCharges <= 0 || this.isDashing) return;
    const inputDir = this.inputManager.getDirection();
    const dir = { x: inputDir.x, y: inputDir.y };
    if (dir.x === 0 && dir.y === 0) {
      // Dash should still trigger when the player taps dash slightly before
      // movement input settles on the same frame.
      dir.x = this.lastMoveDir.x;
      dir.y = this.lastMoveDir.y;
    }
    if (dir.x === 0 && dir.y === 0) {
      // Ultimate fallback: current facing (sprite points "up", so subtract PI/2).
      const facing = this.rotation - Math.PI / 2;
      dir.x = Math.cos(facing);
      dir.y = Math.sin(facing);
    }
    const len = Math.hypot(dir.x, dir.y);
    if (len <= 0.0001) return;
    dir.x /= len;
    dir.y /= len;

    // Falls-If-Turning detection (DESIGN_IDEAS §1). Compare the new
    // dash direction with the previous one; if it reverses inside the
    // 2 s window, queue a stumble for when this dash ends. Pure fact:
    // wild-haggis legs lock the curve. Fight them, fall over.
    const reverseDetected = detectDashReverse({
      prevDir: this.lastDashDir,
      prevDashTimeMs: Number.isFinite(this.lastDashTimeMs)
        ? this.lastDashTimeMs
        : null,
      newDir: dir,
      currentTimeMs: this.scene.time.now,
    });
    if (reverseDetected) this.pendingStumbleAfterDash = true;
    this.lastDashDir = { x: dir.x, y: dir.y };
    this.lastDashTimeMs = this.scene.time.now;

    this.isDashing = true;
    this.dashInvincible = true;
    this.dashRemainingMs = this.DASH_DURATION_MS;
    this.postDashInvincibilityRemainingMs = 0;
    this.dashCharges--;

    // Wild Living World — Selkie Dual-Form toggle on dash edge. The
    // helper short-circuits for non-selkie variants so this stays
    // free for every other run.
    const newForm = toggleSelkieFormOnDashEdge(this.selkieFormState, this.selkieVariantKey);
    if (newForm !== null) {
      this.onSelkieFormShifted?.(newForm);
    }
    // Start regen timer only if it isn't already running (sharing one timer
    // across all missing charges).
    if (this.dashCooldown <= 0) this.dashCooldown = this.DASH_COOLDOWN_MS;
    this.setAlpha(0.5);

    // Apply burst velocity in movement direction
    this.setVelocity(dir.x * this.DASH_SPEED, dir.y * this.DASH_SPEED);

    // Dash trail effect
    const trailCount = BALANCE.player.dashAfterImageCount;
    for (const h of this.dashTrailHandles) h.cancel();
    this.dashTrailHandles = [];
    const tickers = (this.scene as Phaser.Scene & ISceneContext).getUpdateTickers?.();
    for (let i = 0; i < trailCount; i++) {
      const delay = i * (this.DASH_DURATION_MS / trailCount);
      const handle = tickers?.addOnce('scaled', delay, () => {
        if (!this.active) return;
        const afterImage = this.scene.add.circle(this.x, this.y, 12, COLORS.WHISKY_GOLD, 0.4).setDepth(3);
        this.scene.tweens.add({
          targets: afterImage, alpha: 0, scale: 0.3, duration: 200,
          onComplete: () => afterImage.destroy(),
        });
      });
      if (handle) this.dashTrailHandles.push(handle);
    }
  }

  update(delta: number = 16): void {
    const timeScale = this.time.getEffectiveTimeScale();
    const scaledDelta = delta * timeScale;

    // Keep the ground shadow locked under the haggis at all times.
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y + this.height * this.scaleY * 0.4);
    }

    if (this.mantleOverlay) {
      this.mantleOverlay.setPosition(this.x, this.y);
      if (this.scaleX !== this.mantleLastScale) {
        this.mantleOverlay.setScale(this.scaleX, this.scaleY);
        this.mantleLastScale = this.scaleX;
      }
    }

    // Tick dash cooldown — regen one charge at a time, then re-arm if still
    // below max (so Double Dash takes 2 × DASH_COOLDOWN_MS to fully refill).
    if (this.dashCharges < this.maxDashCharges && this.dashCooldown > 0) {
      this.dashCooldown -= scaledDelta;
      if (this.dashCooldown <= 0) {
        this.dashCharges++;
        this.dashCooldown = this.dashCharges < this.maxDashCharges ? this.DASH_COOLDOWN_MS : 0;
      }
    }
    // Tick shield cooldown
    if (this.shieldCooldown > 0) this.shieldCooldown -= scaledDelta;

    // Tick Burn Leap timers. `burnLeapTimeMs` is a monotonic accumulator
    // fed to the pure detector so double-tap windows measure in scaled
    // time — slow-motion widens the window the same way it widens dash
    // recovery, keeping feel consistent under curse effects.
    this.burnLeapTimeMs += scaledDelta;
    if (this.burnLeapActiveRemainingMs > 0) {
      this.burnLeapActiveRemainingMs = Math.max(0, this.burnLeapActiveRemainingMs - scaledDelta);
    }
    if (this.burnLeapBoostRemainingMs > 0) {
      this.burnLeapBoostRemainingMs = Math.max(0, this.burnLeapBoostRemainingMs - scaledDelta);
    }
    if (this.burnLeapCooldownRemainingMs > 0) {
      this.burnLeapCooldownRemainingMs = Math.max(0, this.burnLeapCooldownRemainingMs - scaledDelta);
    }
    // Falls-If-Turning stumble timer — independent from dash + burn-leap
    // so a stumble fired by the previous dash doesn't get clobbered by
    // a fresh leap cooldown.
    if (this.stumbleRemainingMs > 0) {
      this.stumbleRemainingMs = Math.max(0, this.stumbleRemainingMs - scaledDelta);
    }

    // Tick dash lifecycle (bound to timeScale)
    if (this.isDashing) {
      this.dashRemainingMs -= scaledDelta;
      if (this.dashRemainingMs <= 0) {
        this.isDashing = false;
        // Brief post-dash invincibility extra grace
        this.postDashInvincibilityRemainingMs = getPostDashGraceMs(
          BALANCE.player.postDashGraceMs,
          isExtendedIFramesEnabled(),
        );
        // Falls-If-Turning — queued stumble fires now that the dash is
        // done. Activates the speed-halve mul for STUMBLE_DURATION_MS.
        if (this.pendingStumbleAfterDash) {
          this.pendingStumbleAfterDash = false;
          this.stumbleRemainingMs = STUMBLE_DURATION_MS;
        }
      }
    }
    if (!this.isDashing && this.dashInvincible && this.postDashInvincibilityRemainingMs > 0) {
      this.postDashInvincibilityRemainingMs -= scaledDelta;
      if (this.postDashInvincibilityRemainingMs <= 0) {
        this.dashInvincible = false;
        if (this.active) this.setAlpha(1);
      }
    }

    // Jacobite — Flora's Plaid: cycle between 60s cooldown and 2s invincibility.
    if (this._floraPlaidEnabled) {
      if (this._floraPlaidActiveRemainingMs > 0) {
        this._floraPlaidActiveRemainingMs -= scaledDelta;
        if (this._floraPlaidActiveRemainingMs <= 0) {
          this._floraPlaidActiveRemainingMs = 0;
          this._floraPlaidCooldownRemainingMs = Player.FLORA_PLAID_COOLDOWN_MS;
          if (this.active) this.setAlpha(1);
        }
      } else {
        this._floraPlaidCooldownRemainingMs -= scaledDelta;
        if (this._floraPlaidCooldownRemainingMs <= 0) {
          this._floraPlaidActiveRemainingMs = Player.FLORA_PLAID_ACTIVE_MS;
          if (this.active) this.setAlpha(0.45);
        }
      }
    }

    // Tick net slow debuff timers (bound to timeScale)
    if (this.netSlowTimersMs.length > 0) {
      for (let i = this.netSlowTimersMs.length - 1; i >= 0; i--) {
        this.netSlowTimersMs[i] -= scaledDelta;
        if (this.netSlowTimersMs[i] <= 0) {
          this.netSlowTimersMs.splice(i, 1);
          this.removeNetSlow();
        }
      }
    }

    if (this.moorMomentPickupRemainingMs > 0) {
      this.moorMomentPickupRemainingMs -= scaledDelta;
      if (this.moorMomentPickupRemainingMs <= 0) {
        this.moorMomentPickupRemainingMs = 0;
        this.moorMomentPickupFlat = 0;
        this.recalcStats();
      }
    }

    if (this.ceilidhPickupRemainingMs > 0) {
      this.ceilidhPickupRemainingMs -= scaledDelta;
      if (this.ceilidhPickupRemainingMs <= 0) {
        this.ceilidhPickupRemainingMs = 0;
        this.ceilidhPickupFlat = 0;
        this.recalcStats();
      }
    }

    // Skip normal movement during dash — velocity is set by tryDash.
    // Still tick + sync animation so accessories follow the dash.
    if (this.isDashing) {
      this.clampInsideWorld();
      this.tickAnimationAndSync(scaledDelta);
      return;
    }

    if (!this.autoBattleSteering && this.inputManager.consumeDashPressed()) {
      this.tryDash();
      if (this.isDashing) {
        this.tickAnimationAndSync(scaledDelta);
        return;
      }
    }

    const dir = this.autoBattleSteering
      ? { x: this.autoBattleSteering.x, y: this.autoBattleSteering.y }
      : this.inputManager.getDirection();

    // Burn Leap double-tap detection — evaluate against last frame's direction.
    // Skipped when auto-battle is driving so the AI doesn't thrash-arm leaps.
    if (!this.autoBattleSteering) {
      const leap = evaluateBurnLeap({
        prevDir: this.burnLeapPrevDir,
        currDir: dir,
        nowMs: this.burnLeapTimeMs,
        lastReleaseTimeMs: this.burnLeapReleaseTimeMs,
        lastReleaseDir: this.burnLeapReleaseDir,
        cooldownActive: this.burnLeapCooldownRemainingMs > 0,
      });
      this.burnLeapReleaseTimeMs = leap.nextLastReleaseTimeMs;
      this.burnLeapReleaseDir = leap.nextLastReleaseDir;
      if (leap.trigger) {
        this.burnLeapActiveRemainingMs = this.BURN_LEAP_ACTIVE_MS;
        this.burnLeapBoostRemainingMs = this.BURN_LEAP_BOOST_MS;
        this.burnLeapCooldownRemainingMs = this.BURN_LEAP_COOLDOWN_MS;
        this.spawnBurnLeapFlash();
        audio.playBurnLeap();
      }
    }
    this.burnLeapPrevDir = { x: dir.x, y: dir.y };

    if (dir.x !== 0 || dir.y !== 0) {
      this.lastMoveDir.x = dir.x;
      this.lastMoveDir.y = dir.y;
    }

    // Bagpipe Lure (DESIGN_IDEAS §1) — wild-haggis is drawn to pipe drone.
    // Computed every frame regardless of player input so the pull is felt
    // even when the player is standing still. The lure pulls in px·s⁻¹
    // (a few px max) so it never overrides input — it supplements.
    const sceneCtx = this.scene as Phaser.Scene & Partial<ISceneContext>;
    const enemyGroup = sceneCtx.getSpawnSystem?.().getEnemyGroup();
    const lureSources = (enemyGroup?.getChildren() ?? []) as unknown as readonly BagpipeLureSource[];
    const lureVector = computeBagpipeLureVector(this.x, this.y, lureSources);

    // Drift Mastery (DESIGN_IDEAS §1) — sustained motion banks Grip
    // pips; Q-tap consumes one for a short drift-cancel + speed kicker.
    // Tick BEFORE the early-return for stationary input so charge can
    // decay even while idle (the helper's own dead-zone handles that
    // case correctly). The consumePressed edge is `down && !prev-down`
    // so a held key fires once.
    const gripDown = this.gripBurstKey?.isDown ?? false;
    const consumePressed = gripDown && !this.gripBurstKeyPrevDown;
    this.gripBurstKeyPrevDown = gripDown;
    const driftMasteryResult = tickDriftMastery(this.driftMasteryState, {
      inputX: dir.x,
      inputY: dir.y,
      driftSign: this.driftSign,
      dtMs: scaledDelta,
      consumePressed,
    });
    this.driftMasteryState = driftMasteryResult.state;
    // First-bank + first-burst tutorial toasts. Fire once per run via
    // pending-edge fields; the GameScene caption layer is the surface
    // here because the banter pipeline would route through priority
    // arbitration (and these are pure UX hints, not voice).
    if (this.gripFirstBankPending && this.driftMasteryState.pips >= 1) {
      this.gripFirstBankPending = false;
      sceneCtx.caption?.('grip_banked', 'Grip banked. G to spend.', '#a8d4f0', 2400);
    }
    if (driftMasteryResult.burstFiredEdge) {
      audio.playGripBurst();
      if (this.gripFirstBurstPending) {
        this.gripFirstBurstPending = false;
        sceneCtx.caption?.('grip_burst', 'Drift mastered.', '#a8d4f0', 1800);
      }
      // Burns echo — "Scots, wha hae wi' Wallace bled" Bannockburn
      // charge couplet. Drift Mastery burst is the player's
      // signature charge moment; the burns_citation pool's `charge`
      // sub-pool surfaces here. Banter cooldown + no-repeat ring
      // keep it sparse without scene-side gating.
      sceneCtx.requestBanter?.('burns_citation', 'charge');
    }

    // Whisky Breath (DESIGN_IDEAS §1) — kill-stack mechanic. The
    // `whiskyBreathKillsBuffer` field is incremented by the
    // `enemyKilled` listener wired in the constructor; flush it to
    // the helper as `killsThisFrame` and reset to 0 each tick. The
    // input edge is a W-key down-press (debounced via prevDown).
    const breathDown = this.whiskyBreathKey?.isDown ?? false;
    const breathPressed = breathDown && !this.whiskyBreathKeyPrevDown;
    this.whiskyBreathKeyPrevDown = breathDown;
    const whiskyResult = tickWhiskyBreath(this.whiskyBreathState, {
      killsThisFrame: this.whiskyBreathKillsBuffer,
      breathPressed,
    });
    this.whiskyBreathKillsBuffer = 0;
    this.whiskyBreathState = whiskyResult.state;
    if (this.whiskyBreathFirstBankPending && this.whiskyBreathState.stacks >= 1) {
      this.whiskyBreathFirstBankPending = false;
      sceneCtx.caption?.('whisky_first_bank', 'Whisky stacks bankin\'. Press F when ready.', '#e8b070', 2400);
    }
    if (whiskyResult.burstFiredEdge && whiskyResult.burst) {
      this.applyWhiskyBreathBurst(whiskyResult.burst.radius, whiskyResult.burst.damage);
      audio.playWhiskyBreath?.();
      if (this.whiskyBreathFirstBurstPending) {
        this.whiskyBreathFirstBurstPending = false;
        sceneCtx.caption?.('whisky_first_burst', 'Whisky breath — fae the belly.', '#e8b070', 1800);
      }
      // Burns echo — symmetry with Drift Mastery G-burst above. Whisky
      // Breath F-burst is the player's other "charge" moment; the
      // burns_citation `charge` sub-pool ("Scots, wha hae wi' Wallace
      // bled") fires from both signature mechanics. The 8 s banter
      // cooldown keeps double-fires sparse on dense F→G play.
      sceneCtx.requestBanter?.('burns_citation', 'charge');
    }

    // Stance Toggle (DESIGN_IDEAS §1) — Q-edge cycles the stance.
    // recalcStats() re-bakes the drift matrix with the new stance
    // driftMul; the stance speedMul is read in the velocity line below.
    // Cycle event also requests a banter beat — a small voice of "the
    // haggis is changing posture" that grounds the input in fiction.
    const stanceDown = this.stanceCycleKey?.isDown ?? false;
    const stancePressed = stanceDown && !this.stanceCycleKeyPrevDown;
    this.stanceCycleKeyPrevDown = stanceDown;
    if (stancePressed) {
      const { keyBindings } = getSettingsManager().load();
      if (!stanceBindingOverlapsPause(keyBindings.stanceToggle, keyBindings.pause)) {
        const prev = this.stance;
        this.stance = cycleStance(prev);
        this.recalcStats();
        audio.playGripBurst?.();
        if (this.stanceFirstCyclePending) {
          this.stanceFirstCyclePending = false;
          sceneCtx.caption?.('stance_first_cycle', 'Stance shift. Q to cycle.', '#d4c8a8', 2400);
        }
        sceneCtx.requestBanter?.('stance_change', this.stance);
      }
    }

    // Shinty Parry (DESIGN_IDEAS §1) — E-edge opens the parry window.
    // The helper owns the cooldown gate; presses during cooldown are
    // no-ops. `consumeParry` is called from Enemy.fireNet's overlap
    // path via `tryParryProjectile` (below), keeping the negation
    // logic at the contact site rather than inside Player.update.
    const parryDown = this.shintyParryKey?.isDown ?? false;
    const parryPressedEdge = parryDown && !this.shintyParryKeyPrevDown;
    this.shintyParryKeyPrevDown = parryDown;
    const parryResult = tickShintyParry(this.shintyParryState, {
      dtMs: scaledDelta,
      parryPressed: parryPressedEdge,
    });
    this.shintyParryState = parryResult.state;
    if (parryResult.windowOpenedEdge) {
      audio.playShintyParryOpen?.();
    }

    // Race the Beithir (DESIGN_IDEAS §1) — drain the race timer; on
    // expire, the venom commits and the player eats a slice of max-HP.
    // Cure paths (heal-patch overlap in HazardZones, kill the Beithir
    // in Enemy.die) call the public cure methods directly and short-
    // circuit this drain. Pause/slow-mo respect scaledDelta so the
    // race freezes with the rest of gameplay.
    const beithirTick = tickBeithir(this.beithirState, scaledDelta);
    this.beithirState = beithirTick.state;
    if (beithirTick.expiredEdge) {
      this.fireBeithirExpired();
    }

    if (dir.x === 0 && dir.y === 0) {
      this.setVelocity(lureVector.pullX + this.biomeWindX, lureVector.pullY + this.biomeWindY);
      this.tickAnimationAndSync(scaledDelta);
      return;
    }

    // Apply a fixed clockwise rotation bias to the input vector. Uses the
    // pre-baked drift matrix from `recalcStats()` so this hot path costs
    // four multiplies instead of two transcendentals. During a Drift
    // Mastery burst, `driftCancelLerp` is 0 → the drifted vector
    // collapses to the raw input direction (drift cancelled). Outside
    // the burst, lerp is 1 → standard drift behaviour.
    const drifted = driftMasteryResult.driftCancelLerp === 0
      ? this.assignScratch(dir.x, dir.y)
      : rotateVectorIntoPrecomputed(this.driftScratch, dir.x, dir.y, this.driftCos, this.driftSin);

    // Soft boundary — slow down near edges + gentle push-back near the wall.
    const { edgeMul, pushX, pushY } = softBoundarySteer(
      this.x, this.y, GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT,
    );

    // Burn Leap immunity suppresses slick slow while the iframe window is
    // open — the patch visuals still render so the player keeps the spatial
    // cue, but movement is unhampered.
    const hazardLeaping = this.burnLeapActiveRemainingMs > 0;
    const slickMul = this.inSlick && !hazardLeaping ? this.SLICK_SPEED_MUL : 1;
    const leapBoostMul = this.burnLeapBoostRemainingMs > 0 ? this.BURN_LEAP_SPEED_MUL : 1;
    // Falls-If-Turning stumble (DESIGN_IDEAS §1). Tier with slick + leap
    // multiplicatively — a stumbling haggis on a slick patch under a
    // burn-leap is a sliding cartoon, by design.
    const stumbleMul = this.stumbleRemainingMs > 0 ? STUMBLE_SPEED_MUL : 1;
    // Drift Mastery burst speed kicker (1.15× during burst, 1× otherwise).
    // Composes multiplicatively with every other speed multiplier so a
    // burst-while-stumbling (or burst-while-leaping) folds cleanly.
    const gripBurstMul = driftMasteryResult.speedMul;
    // Stance Toggle speed multiplier — 0.80 braced / 1.00 loose / 1.25
    // reeling. Composes multiplicatively alongside the other muls; a
    // braced-stumble-on-slick is dramatically slow by design.
    const stanceSpeedMul = getStanceModifiers(this.stance).speedMul;
    // U1 M4 — getMoveSpeed() folds the rune bag (Trek / Peat / Frost speed
    // muls + allStats); identity when no rune is active.
    const speed = this.getMoveSpeed();
    this.setVelocity(
      drifted.x * speed * edgeMul * this.biomeSpeedMul * slickMul * leapBoostMul * stumbleMul * gripBurstMul * stanceSpeedMul + pushX + lureVector.pullX + this.biomeWindX,
      drifted.y * speed * edgeMul * this.biomeSpeedMul * slickMul * leapBoostMul * stumbleMul * gripBurstMul * stanceSpeedMul + pushY + lureVector.pullY + this.biomeWindY
    );

    // Rotate sprite to face movement direction
    const angle = Math.atan2(drifted.y, drifted.x);
    this.setRotation(angle + Math.PI / 2);

    this.tickAnimationAndSync(scaledDelta);
    this.setScale(playerGrowthScale(this.currentLevel));
  }

  /**
   * Tick the Player + all accessory AnimationControllers from the
   * current-frame velocity + signals, then sync the HaggisContainer
   * accessory sprites to the Player's position / rotation / scale.
   *
   * Called from every exit path in `update()` (dash, idle, and the
   * normal movement branch) so accessories never desync from the
   * Player — a dash without this call would leave the tam frozen
   * at the pre-dash position while the haggis flies off.
   */
  private tickAnimationAndSync(scaledDelta: number): void {
    const vx = (this.body as Phaser.Physics.Arcade.Body | null)?.velocity.x ?? 0;
    const vy = (this.body as Phaser.Physics.Arcade.Body | null)?.velocity.y ?? 0;
    const signals = {
      velocityMag: Math.hypot(vx, vy),
      hurtEdge: this.consumeHurtEdge(),
      attackEdge: this.consumeAttackEdge(),
      celebrateEdge: this.consumeCelebrateEdge(),
      hp: this.hp,
    };
    // Dev-only force-state override — tampers signals so the FSM
    // transitions on the next tick. No-op in production.
    if (this.animStateOverride !== null) {
      switch (this.animStateOverride) {
        case 'walking':
          signals.velocityMag = 1000;
          break;
        case 'hurt':
          signals.hurtEdge = true;
          break;
        case 'attacking':
          signals.attackEdge = true;
          break;
        case 'celebrating':
          signals.celebrateEdge = true;
          break;
        case 'dying':
          signals.hp = 0;
          break;
        case 'idle':
        default:
          signals.velocityMag = 0;
          break;
      }
    }
    this.animController.tick(scaledDelta, signals);
    for (const a of this.ownedAccessories) {
      a.controller.tick(scaledDelta, signals);
    }
    this.haggisContainer.syncToAnchor();
  }

  /** Recalculate all stats from base + level scaling + upgrade bonuses */
  onLevelUp(newLevel: number): void {
    this.currentLevel = newLevel;
    this.recalcStats();

    // Visual growth + hitbox scaling
    this.setScale(playerGrowthScale(newLevel));

    // Reset hitbox with UNSCALED radius — Phaser's updateBounds automatically
    // scales sourceWidth/sourceHeight by the sprite's scale each frame.
    // Passing a pre-scaled radius causes double-scaling.
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(
      this.BASE_HITBOX_RADIUS,
      (this.width / 2) - this.BASE_HITBOX_RADIUS,
      (this.height / 2) - this.BASE_HITBOX_RADIUS
    );
  }

  /** Central stat recalculation: base * level scaling + upgrade bonuses */
  private recalcStats(): void {
    const level = this.currentLevel;

    // Speed: base * level reduction + flat bonus from upgrades
    this.baseMoveSpeed = this.runBaseSpeed * playerLevelSpeedMul(level);
    this.moveSpeed = Math.max(20, this.baseMoveSpeed + this.bonusSpeed);

    // Drift: base * level reduction * upgrade reduction * stance * sign
    this.baseDriftDegrees = this.runBaseDrift * playerLevelDriftMul(level);
    // Stance Toggle (DESIGN_IDEAS §1) — driftMul scales the drift before
    // the matrix bakes. Braced halves drift (precision); reeling
    // amplifies it (rush). recalcStats is called on stance cycle so
    // the per-frame hot path keeps the cheap pre-baked sin/cos.
    const stanceDriftMul = getStanceModifiers(this.stance).driftMul;
    this.driftDegrees = this.baseDriftDegrees * (1 - this.bonusDriftReduction) * stanceDriftMul * this.biomeDriftMul;
    // Pre-bake the drift rotation matrix so per-frame movement skips the trig.
    // Sign flip mirrors the Drift (anticlockwise subspecies) without changing magnitude.
    const driftRad = this.driftDegrees * (Math.PI / 180) * this.driftSign;
    this.driftCos = Math.cos(driftRad);
    this.driftSin = Math.sin(driftRad);

    // Max HP: base + upgrade bonus (level doesn't reduce HP)
    this.maxHp = this.runBaseMaxHp + this.bonusMaxHp;

    // Pickup radius: base + upgrade bonus + moor pulse + 3% per level (satisfying vacuum growth)
    this.pickupRadius = (this.runBasePickup + this.bonusPickupRadius
      + this.moorMomentPickupFlat + this.ceilidhPickupFlat)
      * (1 + 0.03 * (level - 1));
  }

  private consumeHurtEdge(): boolean {
    const v = this.hurtEdgeThisFrame;
    this.hurtEdgeThisFrame = false;
    return v;
  }

  private consumeAttackEdge(): boolean {
    const v = this.attackEdgeThisFrame;
    this.attackEdgeThisFrame = false;
    return v;
  }

  /**
   * Called by WeaponSystem on every weapon fire. Flags the attacking
   * one-shot for the next animation tick. Multiple fires in the same
   * frame coalesce to one flag — the one-shot gating in
   * `AnimationController` then plays the whole 167 ms attack beat
   * before accepting the next retrigger.
   */
  public notifyWeaponFired(): void {
    this.attackEdgeThisFrame = true;
  }

  private consumeCelebrateEdge(): boolean {
    const v = this.celebrateEdgeThisFrame;
    this.celebrateEdgeThisFrame = false;
    return v;
  }

  /**
   * Called by GameScene on level-up and other celebration moments.
   * Flags the celebrating loop state. The 4-frame hop-cycle plays
   * while the upgrade overlay is up and returns to idle/walking on
   * next edge.
   */
  public notifyCelebrate(): void {
    this.celebrateEdgeThisFrame = true;
  }

  takeDamage(amount: number): boolean {
    // Flora's Plaid: full invincibility window — no damage, no stacks, no edges.
    if (this._floraPlaidActiveRemainingMs > 0) return false;
    this.hurtEdgeThisFrame = true;
    // Iron Brew: each hit stacks +2% outgoing damage (cap 20 stacks).
    if (this._ironBrewStacking && this._ironBrewStacks < Player.IRON_BREW_MAX_STACKS) {
      this._ironBrewStacks++;
      this.addDamageMultiplier(Player.IRON_BREW_DMG_PER_STACK);
    }
    // Armor reduces incoming damage (minimum 1)
    const mitigated = Math.max(1, amount - this.bonusArmor);
    this.hp -= mitigated;
    if (this.hp <= 0) {
      // Highland Shield: survive one lethal hit with 1 HP
      if (this.shieldActive && this.shieldCooldown <= 0) {
        this.hp = 1;
        this.shieldCooldown = this.SHIELD_COOLDOWN_MS;
        return false;
      }
      this.hp = 0;
      return true;
    }
    return false;
  }

  heal(amount: number): void {
    // U1 M4 — clamp against folded max HP so a Loch / Drover / Ceilidh
    // Chain rune actually lets the player heal above the base bar.
    this.hp = Math.min(this.hp + amount, this.getMaxHp());
  }

  public equipAccessory(id: string): void {
    const drawer = getAccessoryDrawer(id);
    if (!drawer) {
      console.warn(`Player.equipAccessory: unknown id ${id}`);
      return;
    }
    if (this.ownedAccessories.some((a) => a.id === id)) return; // no-op on re-equip

    // Variant-aware accessories (kilt) have per-variant atlas textures;
    // others use the variant-agnostic atlas.
    const variant = drawer.variantAware ? this.variantKey : null;
    const initialKey = variant !== null
      ? `${id}_${variant}_idle_0`
      : `${id}_idle_0`;
    const layerSprite = this.haggisContainer.equipLayer(
      id,
      drawer.layer,
      initialKey,
    );
    const controller = new AnimationController({
      sprite: layerSprite,
      subject: id,
      variant,
    });
    this.ownedAccessories.push({ id, drawer, controller });
  }

  public unequipAccessory(id: string): void {
    const idx = this.ownedAccessories.findIndex((a) => a.id === id);
    if (idx === -1) return;
    const [removed] = this.ownedAccessories.splice(idx, 1);
    this.haggisContainer.unequipLayer(removed.id);
  }

  /** Mid-run resume — clamp to current max HP after stats are rebuilt. */
  setResumeHealth(hp: number): void {
    this.hp = Math.max(0, Math.min(Math.floor(hp), this.maxHp));
  }

  /** Mid-run resume — restore remaining shield cooldown if present. */
  setResumeShieldCooldown(ms: number | undefined): void {
    if (ms === undefined) return;
    this.shieldCooldown = Math.max(0, Math.floor(ms));
  }

  /** Mid-run resume — restore partial dash recharge state if present. */
  setResumeDashState(charges: number | undefined, cooldownMs: number | undefined): void {
    if (charges === undefined && cooldownMs === undefined) return;
    if (charges !== undefined) {
      this.dashCharges = Phaser.Math.Clamp(Math.floor(charges), 0, this.maxDashCharges);
    }
    if (cooldownMs !== undefined) {
      this.dashCooldown = Math.max(0, Math.floor(cooldownMs));
    }
    if (this.dashCharges >= this.maxDashCharges) {
      this.dashCooldown = 0;
    }
  }

  // ── Getters ──

  getHp(): number { return this.hp; }
  getMaxHp(): number {
    // U1 M4 — fold rune-bag max-HP multiplier (haggis_loch / drover /
    // ceilidh-chain). Identity when no bag attached.
    const bag = this.runeBagAccessor();
    if (!bag) return this.maxHp;
    return Math.max(1, Math.round(this.maxHp * composeMaxHpMul(bag)));
  }
  /** Raw max-HP (pre-rune fold). Used by recalcStats / hp clamp. */
  getMaxHpBase(): number { return this.maxHp; }
  /** Safe ratio for HUD / magnet / juice — avoids NaN if maxHp is ever pathological. */
  getHpFraction(): number {
    if (this.maxHp <= 0) return 1;
    return Math.min(1, Math.max(0, this.hp / this.maxHp));
  }
  getRunBaseSpeed(): number { return this.runBaseSpeed; }
  getRunBaseMaxHp(): number { return this.runBaseMaxHp; }
  getRunBasePickupRadius(): number { return this.runBasePickup; }
  getRunBaseDriftDegrees(): number { return this.runBaseDrift; }
  getLevel(): number { return this.currentLevel; }
  /**
   * Pickup radius readback. Selkie seal form adds a small flat bonus
   * (`SelkieFormModifiers.pickupRadiusFlat`) to widen the seal's "tide
   * ring" feel; haggis form / non-selkie runs return identity.
   */
  getPickupRadius(): number {
    // Burn Leap iframe also suppresses fog's magnet halving — same justification
    // as the slick suppression: leap is the routing escape valve for hazards.
    const fogMul = this.inFog && this.burnLeapActiveRemainingMs <= 0 ? this.FOG_PICKUP_MUL : 1;
    const biome = this.biomeAccessor?.() ?? null;
    const selkieBonus = getSelkieFormModifiers(this.selkieFormState.form, biome).pickupRadiusFlat;
    return this.pickupRadius * fogMul + selkieBonus;
  }
  getMoveSpeed(): number {
    // U1 M4 — Trek / Peat / Frost runes (peat slows speed, trek boosts it).
    const bag = this.runeBagAccessor();
    const runeMul = bag ? composeSpeedMul(bag) : 1;
    // Wild Living World — Selkie speed multiplier. Base seal form is
    // 1.08 in seal, 1 in haggis. Phase 2 adds a small coastal-affinity
    // bloom on loch/pine biomes (the seal "feels at home"). Bloom is
    // a small extra multiplicative — bounded under 1.2 total to keep
    // the dash-toggle game-feel the dominant variable.
    const biome = this.biomeAccessor?.() ?? null;
    const selkieMul = getSelkieFormModifiers(this.selkieFormState.form, biome).speedMul;
    return this.moveSpeed * runeMul * selkieMul;
  }
  getDriftDegrees(): number {
    // Wild Living World — Selkie seal form damps the drift so a player
    // in the sea-body banks tighter. Haggis form is unchanged. Phase 2
    // bloom multiplies the seal-form drift damping further only when
    // the bloom is active (loch / pine biomes); both factors collapse
    // to identity off-biome.
    const biome = this.biomeAccessor?.() ?? null;
    const selkieMul = getSelkieFormModifiers(this.selkieFormState.form, biome).driftMul;
    return this.driftDegrees * selkieMul;
  }

  /**
   * Wild Living World — bind the Selkie form to the active variant
   * + a listener callback. GameScene calls this once per run from
   * runStartCeremony after `applyVariantModifiers`.
   */
  bindSelkieRun(variantKey: string, listener: ((form: SelkieForm) => void) | null): void {
    this.selkieVariantKey = variantKey;
    this.selkieFormState = createSelkieFormState();
    this.onSelkieFormShifted = listener;
    // Clear the biome accessor on each bind so a stale BiomeController
    // reference from a prior run can't leak. GameScene re-installs the
    // live accessor immediately after `bindSelkieRun` returns.
    this.biomeAccessor = null;
  }

  /**
   * Wild Living World Phase 2 — wire the Player's Selkie coastal-affinity
   * resolver into a scene-side biome accessor. Accepts `null` to clear
   * the binding (test scenes / scene tear-down). Called once per run by
   * GameScene right after `bindSelkieRun`.
   *
   * Why a callback and not a direct BiomeController reference: keeps
   * Player free of scene-internal types and lets unit tests inject a
   * deterministic biome with no Phaser imports.
   */
  setBiomeAccessor(accessor: (() => string | null) | null): void {
    this.biomeAccessor = accessor;
  }

  /** Read-only — current Selkie form. */
  getSelkieForm(): SelkieForm {
    return this.selkieFormState.form;
  }

  /** Read-only — number of dash-driven form shifts this run. */
  getSelkieShiftCount(): number {
    return this.selkieFormState.shiftCount;
  }

  /**
   * HUD accessor — read-only snapshot of the Drift Mastery state for
   * the pip widget. Returned object is the live reference; consumers
   * read fields immediately and don't retain. `pips` is 0..3 (banked
   * Grip count); `burstRemainingMs > 0` means a burst is currently
   * active (HUD pulses to confirm).
   */
  getDriftMasteryState(): DriftMasteryState { return this.driftMasteryState; }

  /**
   * HUD accessor — read-only snapshot of the Whisky Breath state.
   * Caller (HUD) renders the stack readout / ready glow. Stack count
   * is 0..STACKS_MAX; ready-to-fire predicate lives on the helper.
   */
  getWhiskyBreathState(): WhiskyBreathState { return this.whiskyBreathState; }

  /**
   * HUD accessor — current Stance Toggle posture. HUD renders a small
   * chip showing the active stance; the cycle is a value, not a state
   * machine, so no further fields are exposed.
   */
  getStance(): Stance { return this.stance; }
  getDamageMultiplier(): number {
    // U1 M4 — Haar / Peat / Thirst / Warden / cascade dmg fold here so
    // every weapon path picks them up via WeaponSystem.setMultipliers.
    const bag = this.runeBagAccessor();
    const runeMul = bag ? composeDamageMul(bag) : 1;
    // Gran's Best: +30% when HP ≤ 40%. Dynamic per-frame check.
    const granMul = (this._granBestEnabled && this.maxHp > 0 && this.hp / this.maxHp <= Player.GRAN_BEST_THRESHOLD)
      ? (1 + Player.GRAN_BEST_BONUS)
      : 1;
    return this.bonusDamageMultiplier * runeMul * granMul;
  }
  getAoeMultiplier(): number { return this.bonusAoeMultiplier; }
  getAttackSpeedMultiplier(): number { return this.bonusAttackSpeedMultiplier; }
  getCritChance(): number {
    // U1 M4 — Gloaming / Flush rune crit additive.
    const bag = this.runeBagAccessor();
    const runeBonus = bag ? composeCritBonus(bag) : 0;
    return 0.10 + this.bonusCritChance + runeBonus;
  }
  getArmor(): number { return this.bonusArmor; }
  getHpRegen(): number { return this.hpRegen; }
  getCooldownReduction(): number { return this.bonusCooldownReduction; }
  isDashInvincible(): boolean { return this.dashInvincible; }
  /** Burn Leap iframe window — hazard-only immunity, no enemy damage immunity. */
  isHazardLeaping(): boolean { return this.burnLeapActiveRemainingMs > 0; }
  /** Hebridean variant — immune to water-type hazards (burn_water / tidal_wrack). */
  isWaterHazardImmune(): boolean { return this._waterHazardImmune; }
  setWaterHazardImmune(v: boolean): void { this._waterHazardImmune = v; }

  /** Iron Brew variant — stacks a +2% damage bonus per hit, cap 20 stacks. */
  setIronBrewStacking(v: boolean): void { this._ironBrewStacking = v; }
  getIronBrewStacks(): number { return this._ironBrewStacks; }

  /** Gran's Best variant — true when bonus is active (HP ≤ 40% of max). */
  setGranBestEnabled(v: boolean): void { this._granBestEnabled = v; }
  isGranBestActive(): boolean {
    return this._granBestEnabled && this.maxHp > 0 && this.hp / this.maxHp <= Player.GRAN_BEST_THRESHOLD;
  }

  /** Jacobite variant — true during the 2s Flora's Plaid invincibility window. */
  setFloraPlaidEnabled(v: boolean): void { this._floraPlaidEnabled = v; }
  isFloraPlaidActive(): boolean { return this._floraPlaidActiveRemainingMs > 0; }

  /** 0 when any charge is ready, otherwise fraction of the current charge's regen timer. */
  getDashCooldownFraction(): number {
    if (this.dashCharges >= this.maxDashCharges) return 0;
    return Math.max(0, this.dashCooldown / this.DASH_COOLDOWN_MS);
  }
  getDashCharges(): number { return this.dashCharges; }

  /**
   * A1 M3 follow-up — rebuild skill-layer Phaser keys from Settings.
   * Called from the constructor; safe to call again after a rebind
   * when the scene is still active (next run's `create()` also seeds).
   */
  refreshSkillKeyBindings(scene: Phaser.Scene): void {
    const handles = loadSkillKeyHandles(scene);
    this.stanceCycleKey = handles.stanceToggle;
    this.shintyParryKey = handles.shintyParry;
    this.whiskyBreathKey = handles.whiskyBreath;
    this.gripBurstKey = handles.driftMastery;
  }

  /** Gamepad Start/Options (edge) — `GameScene` uses this for pause alongside ESC/P. */
  consumePauseMenuEdge(): boolean {
    return this.inputManager.consumeMenuPausePressed();
  }

  /**
   * T1 replay — one-call snapshot of this tick's input for the recorder.
   * Clears edge flags (dash, menu) on read. Delegated to the InputManager
   * so the whole replay capture surface lives in one place.
   */
  peekReplayInputFrame(): { dx: number; dy: number; dash: boolean; menu: boolean } {
    return this.inputManager.peekReplayFrame();
  }
  getMaxDashCharges(): number { return this.maxDashCharges; }
  /** Double Dash perk: grant an extra max charge (also tops up current charges). */
  addDashCharge(): void {
    this.maxDashCharges++;
    this.dashCharges = this.maxDashCharges;
  }
  /**
   * DESIGN_IDEAS §5 — Stag Antler weapon dash-strike trigger reads
   * this each frame; the rising edge fires the bonus arc. Public
   * because `WeaponSystem` (a sibling system, not a subclass) needs
   * cross-system access. Exposing the flag rather than synthesising
   * a "edge" event keeps the helper (`dashStrikeTrigger.ts`) the
   * single owner of edge-detection state.
   */
  getIsDashing(): boolean { return this.isDashing; }
  /**
   * DESIGN_IDEAS §5 — Dash facing in radians (atan2 over the unit
   * `lastDashDir`). Returns null only before the first dash of a
   * run; after that, the last-dash direction is sticky and reads as
   * "the haggis's last committed lunge". Stag Antler bonus arcs use
   * this to point the goring sweep where the player actually went,
   * which is more intuitive than `playerFacing` (which trails movement
   * input and would point sideways during a perpendicular dash).
   */
  getDashFacingAngle(): number | null {
    if (!this.lastDashDir) return null;
    return Math.atan2(this.lastDashDir.y, this.lastDashDir.x);
  }
  /**
   * W2 Moor Road: refill current dash charges to max and clear the
   * cooldown. Used by run_for_the_hills route onResume.
   */
  refreshDashCharges(): void {
    this.dashCharges = this.maxDashCharges;
    this.dashCooldown = 0;
  }
  getXpMultiplier(): number {
    // U1 M4 — Pilgrim rune (xp_mult_run) folds onto the existing
    // permanent + variant XP stack so existing callers (XPSystem,
    // EnemyKillHandler, MoorMomentScheduler) compose for free.
    const bag = this.runeBagAccessor();
    if (!bag) return this.bonusXpMultiplier;
    return this.bonusXpMultiplier * composeXpMul(bag);
  }

  addXpMultiplier(fraction: number): void {
    this.bonusXpMultiplier += fraction;
  }

  getLuckDrawBonus(): number {
    // U1 M4 — Cairn rune adds +15 to draw luck (sporran-equivalent).
    const bag = this.runeBagAccessor();
    const runeBonus = bag ? composeLuckBonus(bag) : 0;
    return this.bonusLuckDraw + runeBonus;
  }

  addLuckDrawBonus(amount: number): void {
    this.bonusLuckDraw += amount;
  }

  addLifesteal(amount: number): void {
    // Cap at 3 HP/kill — at ~10 kills/sec late-game, 3 lifesteal = 30 HP/sec
    // which combined with regen cap (5) keeps max sustain around 35 HP/sec
    this.bonusLifesteal = Math.min(3, this.bonusLifesteal + amount);
  }

  getLifesteal(): number { return this.bonusLifesteal; }
  getCritDamageMultiplier(): number { return this.bonusCritDamageMultiplier; }

  addCritDamageMultiplier(amount: number): void {
    this.bonusCritDamageMultiplier += amount;
  }

  setThorns(damage: number): void { this.thornsDamage = damage; }

  /**
   * Set whether the player is currently standing on a slick hazard zone
   * (Buckfast bottle spill). HazardZones ticks this each frame — true
   * while overlapping any slick zone, false otherwise. Idempotent;
   * setting the same value does nothing.
   */
  setInSlick(active: boolean): void {
    this.inSlick = active;
  }

  /** Test hook — read the slick-slow state without touching private fields. */
  isInSlick(): boolean { return this.inSlick; }

  /** Set whether the player is currently drifting through a haar-wraith
   *  fog patch. Same shape as `setInSlick` — single bool, no stack
   *  bookkeeping. HazardZones ticks it every frame. */
  setInFog(active: boolean): void {
    this.inFog = active;
  }

  /** Test hook — read the fog state without touching private fields. */
  isInFog(): boolean { return this.inFog; }

  /**
   * Apply the biome's mechanical modifier. Called once per biome entry from
   * GameScene.tickBiome — inexpensive enough to re-apply each frame if
   * callers prefer, since it's just field assignment.
   */
  setBiomeModifier(
    kind:
      | 'bogSlow'
      | 'lochKnockback'
      | 'pineConcealment'
      | 'heatherBloom'
      | 'coastalTide'
      | 'haarConcealment'
      | 'frostBite'
      | 'cairngormWind'
      | 'glenCoeEcho'
      | 'clydeRivets'
      | 'blackBogInk'
      | 'benNevisWind'
      | 'glasgowClose'
      | 'fingalEcho'
      | 'callanishAlignment'
      | 'trossachsCanopy'
      | 'edinburghSmoke'
      | 'cairngormWood'
      | 'orkneyWind'
      | 'corryVreckan'
      | 'shetlandVoe'
      | 'fairyPoolGlow'
      | 'hebrideanTide',
  ): void {
    // Default (neutral) state.
    this.biomeSpeedMul = 1;
    this.biomeKnockbackBonus = 1;
    this.biomeXpMul = 1;
    this.biomeDriftMul = 1;
    this.biomeWindX = 0;
    this.biomeWindY = 0;
    switch (kind) {
      case 'bogSlow':
        this.biomeSpeedMul = 0.85;
        break;
      case 'lochKnockback':
        this.biomeKnockbackBonus = 1.5;
        break;
      case 'pineConcealment':
        // Concealment is enforced by enemy AI reading getCurrentBiomeId — no
        // player-side state needed. Left explicit so the switch is exhaustive.
        break;
      case 'heatherBloom':
        this.biomeXpMul = 1.1;
        break;
      case 'coastalTide':
        // Sea-spray push: knockback +20%. Differentiates from loch's +50%
        // and gives the coast a distinct "tide pushes enemies back" feel
        // without competing with heatherBloom's XP buff.
        this.biomeKnockbackBonus = 1.2;
        break;
      case 'haarConcealment':
        // Mirrors pineConcealment: enforcement is at the visibility
        // layer (HaarFogController auto-driven by ambientHaarDensity)
        // and enemy AI reading current biome. Player-side stat-neutral
        // by design — the haar is the gameplay tension, not a stat
        // change.
        break;
      case 'frostBite':
        // Charter §4.4 — Cairngorms in winter punish the unprepared.
        // -25% movement is the heaviest biome-wide speed tax in the
        // game (bogSlow is -15%); pairs with the rime_patch hazard
        // chip damage to make the frost biome feel like a tax-heavy
        // run-state. The HP-conditional cold tick from the original
        // charter dropped (HazardsSystem doesn't support conditional
        // gates); the speed tax carries the frost tension instead.
        this.biomeSpeedMul = 0.75;
        break;
      case 'cairngormWind':
        // Exposed plateau — wind resistance slows the haggis (-10%)
        // but the thin air carries blows further (knockback +15%).
        // Lighter than frostBite (-25%) — the plateau is cold but
        // you can move; it's the gusts that get you (wind_shear hazard).
        this.biomeSpeedMul = 0.90;
        this.biomeKnockbackBonus = 1.15;
        break;
      case 'glenCoeEcho':
        // The glen amplifies everything — knockback resonates in the
        // valley (+20%). A small violence in Glen Coe lands harder.
        // Speed is neutral: the glen doesn't slow you, it watches.
        this.biomeKnockbackBonus = 1.20;
        break;
      case 'clydeRivets':
        // Industrial floor — heavy ironwork and slag underfoot, -8% speed.
        // Craft-pride payout: +15% XP (the only biome that stacks both).
        // Lighter speed tax than frostBite (-25%) or bogSlow (-15%) but
        // meaningful; the XP bonus rewards fighting through the slowdown.
        this.biomeSpeedMul = 0.92;
        this.biomeXpMul = 1.15;
        break;
      case 'blackBogInk':
        // Ink-dark compressed mire — the drift doubles (×2) as the darkness
        // disorients. -15% speed (same tax as bogSlow).
        this.biomeSpeedMul = 0.85;
        this.biomeDriftMul = 2.0;
        break;
      case 'benNevisWind':
        // Exposed summit — thin air slows the haggis slightly (-8%). The
        // real mechanic is the constant Atlantic westerly: a push force
        // added to velocity every frame (east + slight south, in screen
        // coordinates). Moving with the wind is free; fighting it costs.
        this.biomeSpeedMul = 0.92;
        this.biomeWindX = 50;
        this.biomeWindY = 25;
        break;
      case 'glasgowClose':
        // Cramped tenement closes — tight, fast, urban. -12% speed (you
        // cannae sprint doon a shared stair). +18% XP (urban kill density
        // pays; every ned on the close-mouth counts). Distinct from
        // clydeRivets (-8%/+15%) — the close is tighter and more alive.
        this.biomeSpeedMul = 0.88;
        this.biomeXpMul = 1.18;
        break;
      case 'fingalEcho':
        // Basalt sea cave — uneven hexagonal floor (-8% speed). The acoustic
        // resonance amplifies every impact (+12% knockback). Staffa's columns
        // carry sound; a blow that would glance on the moor rings here.
        this.biomeSpeedMul = 0.92;
        this.biomeKnockbackBonus = 1.12;
        break;
      case 'callanishAlignment':
        // The standing stones steady the drift — their celestial alignment
        // straightens the haggis's path (-30% drift). Ancient power rewards
        // engagement: +10% XP.
        this.biomeDriftMul = 0.70;
        this.biomeXpMul = 1.10;
        break;
      case 'trossachsCanopy':
        // Rob Roy country — the haggis knows the deer trails (+8% speed).
        // Dense woodland kills pay more (+10% XP).
        this.biomeSpeedMul = 1.08;
        this.biomeXpMul = 1.10;
        break;
      case 'edinburghSmoke':
        // Closes and wynds — cramped and scholar-dense. -10% speed (you
        // cannae sprint through a pend); +12% XP (Edinburgh's intellectual
        // energy — even the ghosts are well-read).
        this.biomeSpeedMul = 0.90;
        this.biomeXpMul = 1.12;
        break;
      case 'cairngormWood':
        // Ancient Caledonian pine below the plateau. The deer trails give
        // +6% speed. The canopy straightens sight-lines and corridors —
        // navigation is easier (-10% drift).
        this.biomeSpeedMul = 1.06;
        this.biomeDriftMul = 0.90;
        break;
      case 'orkneyWind':
        // Constant Atlantic westerly — same push-force mechanic as
        // benNevisWind but stronger (65 vs 50 x). +12% XP: ancient power
        // flows through the Ring of Brodgar, and the haggis absorbs some.
        this.biomeWindX = 65;
        this.biomeWindY = 10;
        this.biomeXpMul = 1.12;
        break;
      case 'corryVreckan':
        // The whirlpool surge — wading the swell costs (-5% speed). Every
        // impact is amplified by the surging current (+10% knockback). Less
        // speed tax than bogSlow (-15%); the whirlpool is fast, not thick.
        this.biomeSpeedMul = 0.95;
        this.biomeKnockbackBonus = 1.10;
        break;
      case 'shetlandVoe':
        // Norse voe shore — quick and direct (+10% speed; the haggis moves
        // like a Viking longship, purposeful). Norse linearity steadies the
        // path (-10% drift). No XP modifier — the voe gives you clarity, not bounty.
        this.biomeSpeedMul = 1.10;
        this.biomeDriftMul = 0.90;
        break;
      case 'fairyPoolGlow':
        // Fey-charged mineral pools — every kill resonates deeper in the
        // ley-line (+25% XP, the highest in the catalog). Wading the crystal
        // shallows costs a little (-5% speed). The pools are worth the price.
        this.biomeXpMul = 1.25;
        this.biomeSpeedMul = 0.95;
        break;
      case 'hebrideanTide':
        // Atlantic machair shore — the tideline is full of finds (+10% XP).
        // Wave surge on the exposed strand throws everything further (+10%
        // knockback). No speed tax — the hard-packed sand is good footing.
        this.biomeXpMul = 1.10;
        this.biomeKnockbackBonus = 1.10;
        break;
    }
    // biomeDriftMul is baked in recalcStats (not read at use-time), so we
    // must rebake the drift matrix on every biome change — entering AND
    // leaving a drift-modifying biome both need to update the pre-baked
    // sin/cos values.
    this.recalcStats();
  }

  /** Read by XPSystem to bump gem value when collected in heather bloom. */
  getBiomeXpMultiplier(): number { return this.biomeXpMul; }
  /** Read by damage handlers to amplify knockback at the loch edge. */
  getBiomeKnockbackBonus(): number { return this.biomeKnockbackBonus; }
  /** Read by tests to assert wind-push values (Ben Nevis biome). */
  getBiomeWindX(): number { return this.biomeWindX; }
  getBiomeWindY(): number { return this.biomeWindY; }
  getBiomeSpeedMul(): number { return this.biomeSpeedMul; }
  getThornsDamage(): number { return this.thornsDamage; }
  getProjectileSpeedMul(): number { return this.bonusProjectileSpeedMul; }
  getKnockbackMul(): number { return this.bonusKnockbackMul; }
  addProjectileSpeedMul(amount: number): void { this.bonusProjectileSpeedMul += amount; }
  addKnockbackMul(amount: number): void { this.bonusKnockbackMul += amount; }
  getBossHealFrac(): number { return this.bonusBossHealFrac; }
  addBossHealFrac(amount: number): void { this.bonusBossHealFrac += amount; }
  getDashCooldownMs(): number { return Math.max(0, Math.floor(this.dashCooldown)); }
  getShieldCooldownMs(): number { return Math.max(0, Math.floor(this.shieldCooldown)); }

  enableShield(): void { this.shieldActive = true; this.shieldCooldown = 0; }
  hasShield(): boolean { return this.shieldActive && this.shieldCooldown <= 0; }

  // ── Upgrade bonuses (accumulated, never wiped) ──

  addSpeed(amount: number): void {
    this.bonusSpeed += amount;
    this.recalcStats();
  }

  addMaxHp(amount: number): void {
    this.bonusMaxHp += amount;
    this.recalcStats();
    this.hp = Math.min(this.hp + amount, this.maxHp);
  }

  /**
   * Clootie Rag Wager — DESIGN_IDEAS §1. Subtracts a permanent slice
   * of max-HP for the rest of the run AND clamps current HP to the new
   * max, mirroring the folkloric act of giving something of yourself in
   * exchange for a boon. Distinct from `addMaxHp(-N)` because the floor
   * at 1 HP keeps the tree from killing a low-HP supplicant: clootie
   * wells in folklore ask for a permanent diminishment, not a death.
   *
   * Caller (`clootieTree.commit()`) follows this with the boon
   * application via `applyClootieBoon`. No-op for non-positive amounts
   * so a noisy caller can't accidentally heal here.
   */
  applyClootieWagerCost(amount: number): void {
    if (amount <= 0) return;
    this.bonusMaxHp -= amount;
    this.recalcStats();
    this.hp = Math.max(1, Math.min(this.hp - amount, this.maxHp));
  }

  addPickupRadius(amount: number): void {
    this.bonusPickupRadius += amount;
    this.recalcStats();
  }

  /** Short-lived pickup ring from moor moments — refreshes if called again while active. */
  grantMoorMomentMagnet(flatPx: number, durationMs: number): void {
    this.moorMomentPickupFlat = Math.max(this.moorMomentPickupFlat, flatPx);
    this.moorMomentPickupRemainingMs = Math.max(this.moorMomentPickupRemainingMs, durationMs);
    this.recalcStats();
  }

  /**
   * Ceilidh Chain pulse — stacks additively on top of any moor-moment
   * magnet already active, so the "every 8th kill" beat feels like a
   * widening ring *on top of* the ambient rhythm rather than being
   * masked by a larger moor-moment value.
   */
  grantCeilidhChainMagnet(flatPx: number, durationMs: number): void {
    this.ceilidhPickupFlat = Math.max(this.ceilidhPickupFlat, flatPx);
    this.ceilidhPickupRemainingMs = Math.max(this.ceilidhPickupRemainingMs, durationMs);
    this.recalcStats();
  }

  reduceDrift(fraction: number): void {
    this.bonusDriftReduction = 1 - (1 - this.bonusDriftReduction) * (1 - fraction);
    this.recalcStats();
  }

  /**
   * Amplify the Drift magnitude by `fraction` (e.g. 1.0 = doubled, 0.5 = 1.5×).
   * Composable with reduceDrift — both fold into `bonusDriftReduction`.
   * The effective drift multiplier is `(1 - bonusDriftReduction)`;
   * amplifyDrift multiplies it by `(1 + fraction)`.
   * Used by the Drouthy variant: drunk legs, doubled drift.
   */
  amplifyDrift(fraction: number): void {
    this.bonusDriftReduction = 1 - (1 - this.bonusDriftReduction) * (1 + fraction);
    this.recalcStats();
  }

  /**
   * Pre-load Whisky Breath stacks at run start. Used by variants that
   * begin the run with a charged flask (Drouthy: starts at threshold,
   * first burst available from the opening bell).
   */
  setWhiskyBreathStacks(n: number): void {
    this.whiskyBreathState = { stacks: Math.min(Math.max(0, Math.floor(n)), STACKS_MAX) };
  }

  /**
   * Mirror the Drift direction — clockwise (+1) toggles to anticlockwise (-1)
   * and back. Set at run-start by the Anticlockwise Haggis variant; magnitude
   * is unchanged, only the rotation-matrix sign flips.
   */
  flipDriftSign(): void {
    this.driftSign = this.driftSign === 1 ? -1 : 1;
    this.recalcStats();
  }

  getDriftSign(): 1 | -1 {
    return this.driftSign;
  }

  addDamageMultiplier(fraction: number): void {
    this.bonusDamageMultiplier += fraction;
  }

  addAoeMultiplier(fraction: number): void {
    this.bonusAoeMultiplier += fraction;
  }

  addAttackSpeedMultiplier(fraction: number): void {
    this.bonusAttackSpeedMultiplier += fraction;
  }

  addCritChance(fraction: number): void {
    this.bonusCritChance += fraction;
  }

  addArmor(amount: number): void {
    this.bonusArmor += amount;
  }

  addHpRegen(amount: number): void {
    // Cap at 5.0 HP/sec — stacking Highland Spring + Natural Recovery + other
    // regen sources previously trivialized late-game survivability
    this.hpRegen = Math.min(5.0, this.hpRegen + amount);
  }

  addCooldownReduction(fraction: number): void {
    this.bonusCooldownReduction = 1 - (1 - this.bonusCooldownReduction) * (1 - fraction);
  }

  /**
   * The Moor Remembers — apply a small inherited buff (default +1 %)
   * from a walked-over Cairn-of-Echoes. Routes the cairn's
   * `inheritedStat` to the matching existing Player bonus channel,
   * matching the additive-multiplier shape of the sister
   * `addDamageMultiplier` / `addCritChance` / `addCooldownReduction`
   * setters. Spec: `docs/superpowers/specs/2026-05-22-the-moor-remembers-design.md`.
   *
   * - `damage` → folds into `bonusDamageMultiplier` (no recalc needed —
   *   the read path multiplies live each frame in `getDamageMultiplier`).
   * - `speed` → adds `pct * runBaseSpeed` to `bonusSpeed`, then recalc.
   * - `pickupRadius` → adds `pct * runBasePickup` to `bonusPickupRadius`.
   * - `critChance` → adds `pct` as an additive crit-chance bonus.
   * - `cooldown` → folds into `bonusCooldownReduction` via the same
   *    multiplicative-stacking formula as `addCooldownReduction`.
   * - `driftResist` → folds into `bonusDriftReduction` via the same
   *    multiplicative-stacking formula as `reduceDrift`.
   *
   * `recalcStats()` only runs for channels that influence pre-baked
   * fields (speed / drift / pickup) — multiplier channels are read
   * live by the systems that consume them.
   */
  applyInheritedCairnBuff(
    stat: 'damage' | 'speed' | 'pickupRadius' | 'critChance' | 'cooldown' | 'driftResist',
    pct: number,
  ): void {
    if (!Number.isFinite(pct) || pct <= 0) return;
    switch (stat) {
      case 'damage':
        this.bonusDamageMultiplier += pct;
        break;
      case 'speed':
        this.bonusSpeed += this.runBaseSpeed * pct;
        this.recalcStats();
        break;
      case 'pickupRadius':
        this.bonusPickupRadius += this.runBasePickup * pct;
        this.recalcStats();
        break;
      case 'critChance':
        this.bonusCritChance += pct;
        break;
      case 'cooldown':
        this.bonusCooldownReduction = 1 - (1 - this.bonusCooldownReduction) * (1 - pct);
        break;
      case 'driftResist':
        this.bonusDriftReduction = 1 - (1 - this.bonusDriftReduction) * (1 - pct);
        this.recalcStats();
        break;
    }
  }

  /** Tick HP regeneration — call each frame with delta in ms */
  tickRegen(delta: number): void {
    if (this.hpRegen <= 0 || this.hp >= this.getMaxHp()) return;
    this.regenAccumulator += this.hpRegen * (delta / 1000);
    if (this.regenAccumulator >= 1) {
      const healed = Math.floor(this.regenAccumulator);
      this.regenAccumulator -= healed;
      this.heal(healed);
    }
  }

  /**
   * Shinty Parry intercept (DESIGN_IDEAS §1). Called by Enemy.fireNet's
   * overlap callback when an enemy projectile contacts the player.
   *
   * - Returns true: the parry window was active. The projectile is
   *   considered negated; the caller MUST skip `applyNetSlow` and may
   *   skip any other on-hit side effects. SFX/banter/tutorial caption
   *   fire here so the contact site stays a single boolean check.
   * - Returns false: no active window. Caller proceeds with normal
   *   on-hit behaviour (`applyNetSlow`).
   *
   * The consume call also rolls the helper into cooldown — one window,
   * one parry, even if a barrage arrives in the same tick.
   */
  tryParryProjectile(): boolean {
    const r = consumeParry(this.shintyParryState);
    if (!r.consumed) return false;
    this.shintyParryState = r.state;
    audio.playShintyParry?.();
    const sceneCtx = this.scene as Phaser.Scene & Partial<ISceneContext>;
    if (this.parryFirstSuccessPending) {
      this.parryFirstSuccessPending = false;
      sceneCtx.caption?.('parry_first_success', 'Caman flick — that\'s a parry.', '#9fcad9', 2400);
    }
    sceneCtx.requestBanter?.('shinty_parry');
    return true;
  }

  /** HUD readout — true while the parry window is open. */
  isShintyParryActive(): boolean { return isParryActive(this.shintyParryState); }
  /** HUD readout — true when ready to parry (idle, not on cooldown). */
  isShintyParryReady(): boolean { return isParryReady(this.shintyParryState); }
  /** HUD readout — fraction [0..1] of cooldown elapsed; 1 = ready. */
  shintyParryCooldownFraction(): number { return parryCooldownFraction(this.shintyParryState); }

  /**
   * Race the Beithir (DESIGN_IDEAS §1) — apply a fresh sting from a
   * Beithir fang projectile. From idle, opens the 8 s race window
   * with full timer + onset SFX + banter + run-base-HP lock. From
   * stung, refreshes the timer to full silently (a barrage of fangs
   * from one or many Beithirs is one race, not a stack — see
   * `raceTheBeithir.ts` header).
   *
   * Caller (Enemy.fireBeithirFang) MUST run `tryParryProjectile` first
   * and skip the sting if parried; this method assumes the sting is
   * committed.
   */
  applyBeithirStingFromFang(isEliteBeithir: boolean = false): void {
    const duration = RACE_DURATION_MS + (isEliteBeithir ? RACE_DURATION_ELITE_BONUS_MS : 0);
    const r = applyBeithirSting(this.beithirState, isInvincibilityEnabled(), duration);
    this.beithirState = r.state;
    if (!r.appliedEdge) return; // refresh — silent, timer reset
    this.beithirMaxHpAtSting = this.runBaseMaxHp;
    audio.playBeithirSting?.();
    const sceneCtx = this.scene as Phaser.Scene & Partial<ISceneContext>;
    sceneCtx.requestBanter?.('beithir_sting', 'stung');
  }

  /**
   * Cure path — folkloric "running water under a bridge". Called from
   * HazardZones when the player overlaps a heal patch. No-op when not
   * stung (the heal still ticks regardless via the heal-patch loop).
   */
  cureBeithirStingFromHeal(): void {
    const r = cureBeithirSting(this.beithirState);
    this.beithirState = r.state;
    if (!r.curedEdge) return;
    this.beithirMaxHpAtSting = 0;
    audio.playBeithirCure?.();
    const sceneCtx = this.scene as Phaser.Scene & Partial<ISceneContext>;
    // Lifetime counter routes the first cure ever to the *_first sub-pool
    // (wonder / discovery beat) and subsequent cures to the existing pool
    // (muscle memory). Pre-bump 0 = first ever; bumper persists to v20 save.
    const beforeCount = bumpBeithirCured();
    const tag = beforeCount === 0 ? 'cured_heal_first' : 'cured_heal';
    sceneCtx.requestBanter?.('beithir_sting', tag);
  }

  /**
   * Cure path — folkloric "slay the beast that bit you". Called from
   * Enemy.die when the dying enemy's key === 'beithir'. Any beithir's
   * death cleanses the venom — tracking the specific stinger by-
   * instance is brittle (Enemy pool reuse), and folklore-wise breaking
   * any beithir's spell would feel correct. No-op when not stung.
   */
  cureBeithirStingFromKill(): void {
    const r = cureBeithirSting(this.beithirState);
    this.beithirState = r.state;
    if (!r.curedEdge) return;
    this.beithirMaxHpAtSting = 0;
    audio.playBeithirCure?.();
    const sceneCtx = this.scene as Phaser.Scene & Partial<ISceneContext>;
    // See cureBeithirStingFromHeal — same first-vs-subsequent routing.
    // The two cure paths share the lifetime counter so a heal-cure
    // followed by a kill-cure both register as subsequent (the wonder
    // beat is "the cure works at all", not "this specific cure path").
    const beforeCount = bumpBeithirCured();
    const tag = beforeCount === 0 ? 'cured_kill_first' : 'cured_kill';
    sceneCtx.requestBanter?.('beithir_sting', tag);
  }

  /**
   * Race the Beithir expire — the venom commits. Called from the per-
   * frame tick when the timer crosses zero. Bites a `computeStingExpire
   * Damage(maxHpAtSting)` slice off HP, plays the consequence SFX,
   * fires the consequence banter sub-pool. Lifestyle-low-HP variants
   * still feel a real bite via the helper's floor.
   */
  private fireBeithirExpired(): void {
    const damage = computeStingExpireDamage(this.beithirMaxHpAtSting);
    this.beithirMaxHpAtSting = 0;
    this.takeDamage(damage);
    audio.playBeithirExpire?.();
    const sceneCtx = this.scene as Phaser.Scene & Partial<ISceneContext>;
    sceneCtx.requestBanter?.('beithir_sting', 'expired');
  }

  /** HUD readout — true while a Beithir race is running. */
  isBeithirStung(): boolean { return isBeithirStungHelper(this.beithirState); }
  /** HUD readout — fraction [0..1] of timer remaining; 0 when idle. */
  beithirRemainingFraction(): number { return stingRemainingFraction(this.beithirState); }

  /** Apply net slow — only takes effect on first stack, subsequent nets just increment counter */
  applyNetSlow(durationMs: number = 2000): void {
    if (this.netSlowTimersMs.length >= 5) return;
    this.netSlowTimersMs.push(durationMs);
    this.netSlowStacks++;
    if (this.netSlowStacks === 1) {
      this.addSpeed(-this.NET_SLOW_AMOUNT);
    }
  }

  /** Remove one net slow stack — speed only restored when all stacks are cleared */
  removeNetSlow(): void {
    if (this.netSlowStacks <= 0) return; // Guard: no stacks to remove (prevents +80 speed exploit)
    this.netSlowStacks--;
    if (this.netSlowStacks === 0) {
      this.addSpeed(this.NET_SLOW_AMOUNT);
    }
  }

  /** Dev / balance: override movement direction (normalized world vector). */
  setAutoBattleSteering(dir: { x: number; y: number } | null): void {
    this.autoBattleSteering = dir;
  }

  /** Dev-only: force the animation FSM into a specific state each frame.
   *  Pass null to clear the override and resume normal signal-driven behaviour. */
  public overrideAnimationState(state: AnimationState | null): void {
    this.animStateOverride = state;
  }

  /** Keep the haggis inside soft world bounds during high-speed dash bursts. */
  private clampInsideWorld(): void {
    const margin = this.BASE_HITBOX_RADIUS;
    const clampedX = Phaser.Math.Clamp(this.x, margin, GAME.WORLD_WIDTH - margin);
    const clampedY = Phaser.Math.Clamp(this.y, margin, GAME.WORLD_HEIGHT - margin);
    if (clampedX !== this.x || clampedY !== this.y) {
      this.setPosition(clampedX, clampedY);
      if (this.isDashing) this.setVelocity(0, 0);
    }
  }

  public setMantleTier(tier: MantleTier, opts: { instant?: boolean } = {}): void {
    if (!this.mantleOverlay) return;
    if (tier === this.mantleTier) return;
    this.mantleTier = tier;
    applyMantleTier({
      overlay: this.mantleOverlay,
      tweens: this.scene.tweens,
      variantKey: this.variantKey,
      nextTier: tier,
      instant: opts.instant === true,
    });
  }

  public getMantleTier(): MantleTier {
    return this.mantleTier;
  }

  /**
   * Heather-mantle pulse — DESIGN_IDEAS §1. At tier 2 the mantle pulses
   * every {@link MANTLE_PULSE_INTERVAL_MS} and staggers nearby enemies
   * via the supplied `applyStaggerAt` callback. The visual punch is a
   * brief scale + alpha tween on the mantle overlay; gameplay impact
   * is pure outward knockback (no damage, no kill credit).
   *
   * Caller is responsible for passing scaled gameplay delta — pulse
   * timing slows in lockstep with hit-freeze / boss-slowmo so the
   * cinematic beats don't desync the ring's cadence.
   *
   * @returns true when a pulse fired this tick (caller may use the
   *   signal for telemetry / audio cues; callback was already invoked).
   */
  public tickMantlePulse(
    deltaMs: number,
    applyStaggerAt: (centerX: number, centerY: number, radiusPx: number) => void,
  ): boolean {
    const result = tickMantlePulseTimer({
      deltaMs,
      accumulatedMs: this.mantlePulseAccumMs,
      currentTier: this.mantleTier,
    });
    this.mantlePulseAccumMs = result.nextAccumulatedMs;
    if (!result.didPulse) return false;

    // Visual punch on the mantle overlay — keyframe-only, rides the
    // existing W71 Phase 2 sprite. The tween targets `mantleLastScale`
    // so it composes cleanly with `setScale` updates from `update()`.
    if (this.mantleOverlay) {
      const baseScale = this.mantleLastScale;
      this.scene.tweens.add({
        targets: this.mantleOverlay,
        scale: { from: baseScale * 1.18, to: baseScale },
        alpha: { from: 0.55, to: 1 },
        duration: MANTLE_PULSE_TWEEN_MS,
        ease: 'Cubic.easeOut',
      });
    }

    applyStaggerAt(this.x, this.y, MANTLE_PULSE_RADIUS_PX);
    return true;
  }

  destroy(fromScene?: boolean): void {
    for (const h of this.dashTrailHandles) h.cancel();
    this.dashTrailHandles = [];
    this.subs.dispose();

    // InputManager owns touch pointer listeners (must be explicitly torn down)
    this.inputManager.destroy();

    this.shadow?.destroy();
    this.shadow = null;

    this.mantleOverlay?.destroy();
    this.mantleOverlay = null;

    super.destroy(fromScene);
  }
}
