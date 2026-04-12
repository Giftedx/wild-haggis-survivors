import Phaser from 'phaser';
import { PLAYER, GAME } from '../config';
import { InputManager } from '../utils/input';
import { rotateVectorInto } from '../utils/math';
import { TimeManager } from '../systems/TimeManager';
import type { TickerHandle, UpdateTickers } from '../utils/UpdateTickers';
import { SubscriptionBag } from '../utils/SubscriptionBag';
import { BALANCE } from '../core/BalanceConfig';
import type { ComposedPlayerStats } from '../core/StatComposer';

/**
 * Player — the wild haggis.
 *
 * Movement uses "The Drift": a constant clockwise rotational offset
 * applied to the input vector, simulating the creature's uneven legs.
 * The player must constantly correct to move in a straight line,
 * while clockwise circling feels natural.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private inputManager: InputManager;
  private time: TimeManager;
  private subs = new SubscriptionBag();
  /** Reused in update() — avoids allocating a fresh vector for drift each frame. */
  private readonly driftScratch = { x: 0, y: 0 };
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
  private bonusMaxHp: number = 0;
  private bonusPickupRadius: number = 0;
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
  private shieldActive: boolean = false;           // One-time death prevention
  private shieldCooldown: number = 0;              // Shield recharge timer
  private readonly SHIELD_COOLDOWN_MS = BALANCE.player.shieldCooldownMs;

  // Final computed stats
  private moveSpeed: number = PLAYER.SPEED;
  private driftDegrees: number = PLAYER.DRIFT_DEGREES;

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

  // Squash-stretch animation
  private wobblePhase: number = 0;

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

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string = 'haggis_classic',
    timeManager: TimeManager,
    composed?: Pick<ComposedPlayerStats, 'speed' | 'maxHp' | 'driftDegrees' | 'pickupRadius' | 'damagePctBonus' | 'hpRegen' | 'critBonus' | 'cooldownReduction' | 'xpGainBonus' | 'armorBonus' | 'dashCooldownReduction'>
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

    this.inputManager = new InputManager(scene);
    this.time = timeManager;
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

    this.isDashing = true;
    this.dashInvincible = true;
    this.dashRemainingMs = this.DASH_DURATION_MS;
    this.postDashInvincibilityRemainingMs = 0;
    this.dashCharges--;
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
    const tickers = (this.scene as unknown as { getUpdateTickers?: () => UpdateTickers }).getUpdateTickers?.();
    for (let i = 0; i < trailCount; i++) {
      const delay = i * (this.DASH_DURATION_MS / trailCount);
      const handle = tickers?.addOnce('scaled', delay, () => {
        if (!this.active) return;
        const afterImage = this.scene.add.circle(this.x, this.y, 12, 0xd4a017, 0.4).setDepth(3);
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

    // Tick dash lifecycle (bound to timeScale)
    if (this.isDashing) {
      this.dashRemainingMs -= scaledDelta;
      if (this.dashRemainingMs <= 0) {
        this.isDashing = false;
        // Brief post-dash invincibility extra grace
        this.postDashInvincibilityRemainingMs = BALANCE.player.postDashGraceMs;
      }
    }
    if (!this.isDashing && this.dashInvincible && this.postDashInvincibilityRemainingMs > 0) {
      this.postDashInvincibilityRemainingMs -= scaledDelta;
      if (this.postDashInvincibilityRemainingMs <= 0) {
        this.dashInvincible = false;
        if (this.active) this.setAlpha(1);
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

    // Skip normal movement during dash — velocity is set by tryDash
    if (this.isDashing) {
      this.clampInsideWorld();
      return;
    }

    if (!this.autoBattleSteering && this.inputManager.consumeDashPressed()) {
      this.tryDash();
      if (this.isDashing) return;
    }

    const dir = this.autoBattleSteering
      ? { x: this.autoBattleSteering.x, y: this.autoBattleSteering.y }
      : this.inputManager.getDirection();

    if (dir.x !== 0 || dir.y !== 0) {
      this.lastMoveDir.x = dir.x;
      this.lastMoveDir.y = dir.y;
    }

    if (dir.x === 0 && dir.y === 0) {
      this.setVelocity(0, 0);
      // Settle back to uniform scale when idle
      this.wobblePhase = 0;
      return;
    }

    // Apply a fixed clockwise rotation bias to the input vector.
    const drifted = rotateVectorInto(this.driftScratch, dir.x, dir.y, this.driftDegrees);

    // Soft boundary — slow down near world edges
    const edgeMargin = 150;
    let edgeMul = 1;
    if (this.x < edgeMargin) edgeMul = Math.min(edgeMul, this.x / edgeMargin);
    if (this.y < edgeMargin) edgeMul = Math.min(edgeMul, this.y / edgeMargin);
    if (this.x > GAME.WORLD_WIDTH - edgeMargin) edgeMul = Math.min(edgeMul, (GAME.WORLD_WIDTH - this.x) / edgeMargin);
    if (this.y > GAME.WORLD_HEIGHT - edgeMargin) edgeMul = Math.min(edgeMul, (GAME.WORLD_HEIGHT - this.y) / edgeMargin);
    edgeMul = Math.max(0.15, edgeMul); // Never fully stop — 15% minimum

    // Push back toward center when very near edge (gentle force, not a hard wall)
    let pushX = 0, pushY = 0;
    const pushStrength = 50;
    if (this.x < 20) pushX = pushStrength;
    if (this.x > GAME.WORLD_WIDTH - 20) pushX = -pushStrength;
    if (this.y < 20) pushY = pushStrength;
    if (this.y > GAME.WORLD_HEIGHT - 20) pushY = -pushStrength;

    this.setVelocity(
      drifted.x * this.moveSpeed * edgeMul + pushX,
      drifted.y * this.moveSpeed * edgeMul + pushY
    );

    // Rotate sprite to face movement direction
    const angle = Math.atan2(drifted.y, drifted.x);
    this.setRotation(angle + Math.PI / 2);

    // Squash-stretch wobble while moving — gives the haggis a lively bounce
    this.wobblePhase += 0.15;
    const wobble = Math.sin(this.wobblePhase) * 0.06;
    const growthScale = Math.min(
      1 + PLAYER.GROWTH_PER_LEVEL * (this.currentLevel - 1),
      PLAYER.MAX_SCALE
    );
    this.setScale(growthScale * (1 + wobble), growthScale * (1 - wobble));
  }

  /** Recalculate all stats from base + level scaling + upgrade bonuses */
  onLevelUp(newLevel: number): void {
    this.currentLevel = newLevel;
    this.recalcStats();

    // Visual growth + hitbox scaling
    const growthScale = Math.min(
      1 + PLAYER.GROWTH_PER_LEVEL * (newLevel - 1),
      PLAYER.MAX_SCALE
    );
    this.setScale(growthScale);

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
    const levelSpeedMul = Math.max(0.7, 1 - PLAYER.SPEED_REDUCTION_PER_LEVEL * (level - 1));
    this.baseMoveSpeed = this.runBaseSpeed * levelSpeedMul;
    this.moveSpeed = Math.max(20, this.baseMoveSpeed + this.bonusSpeed);

    // Drift: base * level reduction * upgrade reduction
    const levelDriftMul = Math.max(0.3, 1 - PLAYER.DRIFT_REDUCTION_PER_LEVEL * (level - 1));
    this.baseDriftDegrees = this.runBaseDrift * levelDriftMul;
    this.driftDegrees = this.baseDriftDegrees * (1 - this.bonusDriftReduction);

    // Max HP: base + upgrade bonus (level doesn't reduce HP)
    this.maxHp = this.runBaseMaxHp + this.bonusMaxHp;

    // Pickup radius: base + upgrade bonus + 3% per level (satisfying vacuum growth)
    this.pickupRadius = (this.runBasePickup + this.bonusPickupRadius) * (1 + 0.03 * (level - 1));
  }

  takeDamage(amount: number): boolean {
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
    this.hp = Math.min(this.hp + amount, this.maxHp);
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
  getMaxHp(): number { return this.maxHp; }
  getRunBaseSpeed(): number { return this.runBaseSpeed; }
  getRunBaseMaxHp(): number { return this.runBaseMaxHp; }
  getRunBasePickupRadius(): number { return this.runBasePickup; }
  getRunBaseDriftDegrees(): number { return this.runBaseDrift; }
  getLevel(): number { return this.currentLevel; }
  getPickupRadius(): number { return this.pickupRadius; }
  getMoveSpeed(): number { return this.moveSpeed; }
  getDriftDegrees(): number { return this.driftDegrees; }
  getDamageMultiplier(): number { return this.bonusDamageMultiplier; }
  getAoeMultiplier(): number { return this.bonusAoeMultiplier; }
  getAttackSpeedMultiplier(): number { return this.bonusAttackSpeedMultiplier; }
  getCritChance(): number { return 0.10 + this.bonusCritChance; }
  getArmor(): number { return this.bonusArmor; }
  getHpRegen(): number { return this.hpRegen; }
  getCooldownReduction(): number { return this.bonusCooldownReduction; }
  isDashInvincible(): boolean { return this.dashInvincible; }
  /** 0 when any charge is ready, otherwise fraction of the current charge's regen timer. */
  getDashCooldownFraction(): number {
    if (this.dashCharges >= this.maxDashCharges) return 0;
    return Math.max(0, this.dashCooldown / this.DASH_COOLDOWN_MS);
  }
  getDashCharges(): number { return this.dashCharges; }
  getMaxDashCharges(): number { return this.maxDashCharges; }
  /** Double Dash perk: grant an extra max charge (also tops up current charges). */
  addDashCharge(): void {
    this.maxDashCharges++;
    this.dashCharges = this.maxDashCharges;
  }
  getXpMultiplier(): number { return this.bonusXpMultiplier; }

  addXpMultiplier(fraction: number): void {
    this.bonusXpMultiplier += fraction;
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

  addPickupRadius(amount: number): void {
    this.bonusPickupRadius += amount;
    this.recalcStats();
  }

  reduceDrift(fraction: number): void {
    this.bonusDriftReduction = 1 - (1 - this.bonusDriftReduction) * (1 - fraction);
    this.recalcStats();
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

  /** Tick HP regeneration — call each frame with delta in ms */
  tickRegen(delta: number): void {
    if (this.hpRegen <= 0 || this.hp >= this.maxHp) return;
    this.regenAccumulator += this.hpRegen * (delta / 1000);
    if (this.regenAccumulator >= 1) {
      const healed = Math.floor(this.regenAccumulator);
      this.regenAccumulator -= healed;
      this.heal(healed);
    }
  }

  /** Apply net slow — only takes effect on first stack, subsequent nets just increment counter */
  applyNetSlow(durationMs: number = 2000): void {
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

  destroy(fromScene?: boolean): void {
    for (const h of this.dashTrailHandles) h.cancel();
    this.dashTrailHandles = [];
    this.subs.dispose();

    // InputManager owns touch pointer listeners (must be explicitly torn down)
    this.inputManager.destroy();

    this.shadow?.destroy();
    this.shadow = null;

    super.destroy(fromScene);
  }
}
