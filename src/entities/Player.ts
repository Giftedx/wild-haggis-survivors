import Phaser from 'phaser';
import { PLAYER, GAME } from '../config';
import { InputManager } from '../utils/input';
import { rotateVector } from '../utils/math';

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

  // Final computed stats
  private moveSpeed: number = PLAYER.SPEED;
  private driftDegrees: number = PLAYER.DRIFT_DEGREES;

  // Squash-stretch animation
  private wobblePhase: number = 0;

  // Net slow debuff tracking — only apply once regardless of how many nets hit
  private netSlowStacks: number = 0;
  private readonly NET_SLOW_AMOUNT = 80;
  private currentLevel: number = 1;
  private hp: number = PLAYER.MAX_HP;
  private maxHp: number = PLAYER.MAX_HP;
  private pickupRadius: number = PLAYER.PICKUP_RADIUS;

  private readonly BASE_HITBOX_RADIUS = 20;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'haggis');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Soft boundary — no hard wall, player slows near edges
    this.setCollideWorldBounds(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(this.BASE_HITBOX_RADIUS, 4, 4);

    this.inputManager = new InputManager(scene);
  }

  update(): void {
    const dir = this.inputManager.getDirection();

    if (dir.x === 0 && dir.y === 0) {
      this.setVelocity(0, 0);
      // Settle back to uniform scale when idle
      this.wobblePhase = 0;
      return;
    }

    // Apply a fixed clockwise rotation bias to the input vector.
    const drifted = rotateVector(dir.x, dir.y, this.driftDegrees);

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
    this.baseMoveSpeed = PLAYER.SPEED * levelSpeedMul;
    this.moveSpeed = Math.max(20, this.baseMoveSpeed + this.bonusSpeed);

    // Drift: base * level reduction * upgrade reduction
    const levelDriftMul = Math.max(0.3, 1 - PLAYER.DRIFT_REDUCTION_PER_LEVEL * (level - 1));
    this.baseDriftDegrees = PLAYER.DRIFT_DEGREES * levelDriftMul;
    this.driftDegrees = this.baseDriftDegrees * (1 - this.bonusDriftReduction);

    // Max HP: base + upgrade bonus (level doesn't reduce HP)
    this.maxHp = PLAYER.MAX_HP + this.bonusMaxHp;

    // Pickup radius: base + upgrade bonus
    this.pickupRadius = PLAYER.PICKUP_RADIUS + this.bonusPickupRadius;
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      return true;
    }
    return false;
  }

  heal(amount: number): void {
    this.hp = Math.min(this.hp + amount, this.maxHp);
  }

  // ── Getters ──

  getHp(): number { return this.hp; }
  getMaxHp(): number { return this.maxHp; }
  getLevel(): number { return this.currentLevel; }
  getPickupRadius(): number { return this.pickupRadius; }
  getMoveSpeed(): number { return this.moveSpeed; }
  getDriftDegrees(): number { return this.driftDegrees; }
  getDamageMultiplier(): number { return this.bonusDamageMultiplier; }
  getAoeMultiplier(): number { return this.bonusAoeMultiplier; }
  getAttackSpeedMultiplier(): number { return this.bonusAttackSpeedMultiplier; }

  // ── Upgrade bonuses (accumulated, never wiped) ──

  addSpeed(amount: number): void {
    this.bonusSpeed += amount;
    this.recalcStats();
  }

  addMaxHp(amount: number): void {
    this.bonusMaxHp += amount;
    this.recalcStats();
    this.hp += amount;
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

  /** Apply net slow — only takes effect on first stack, subsequent nets just increment counter */
  applyNetSlow(): void {
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
}
