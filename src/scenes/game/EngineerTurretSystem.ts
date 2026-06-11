/**
 * EngineerTurretSystem — The Engineer variant's cairn-turret mechanic.
 *
 * At run start the haggis places a single cairn-turret at a fixed world
 * position. The turret fires the player's main weapon at 50% damage on a
 * 1200 ms cadence (the base thistle_shot interval). The player moves; the
 * cairn does not.
 *
 * Pure orchestration — no Phaser. The constructor takes hooks for the
 * two side-effects (fire shot, spawn sprite) so the system is testable
 * without a Scene. `tick(delta)` is the per-frame entry point called
 * from `tickFrameWorld` after the weapon system update.
 *
 * Replay determinism: the turret fires on a fixed cadence (no RNG). The
 * shot itself uses `WeaponSystem.fireTurretShot` which calls the projectile
 * pool via the normal crit-RNG path — same seeded stream as player shots.
 */

/** Turret fires at 50% of player weapon damage. */
export const TURRET_DAMAGE_MUL = 0.5;
/** Fixed fire interval — base thistle_shot cooldown. */
export const TURRET_COOLDOWN_MS = 1200;

export interface EngineerTurretHooks {
  /** True when the run-end ceremony is in progress. */
  getIsVictoryPending(): boolean;
  /** Fire the main weapon from position (fromX, fromY) at damageMul fraction. */
  fireTurretShot(fromX: number, fromY: number, damageMul: number): void;
  /** Spawn the turret sprite at (x, y) in world coordinates. */
  spawnTurretSprite(x: number, y: number): void;
}

export class EngineerTurretSystem {
  private placed = false;
  private turretX = 0;
  private turretY = 0;
  private cooldownRemaining = TURRET_COOLDOWN_MS;

  constructor(private readonly hooks: EngineerTurretHooks) {}

  /** Reset to run-start state. Called before placing a new turret. */
  reset(): void {
    this.placed = false;
    this.turretX = 0;
    this.turretY = 0;
    this.cooldownRemaining = TURRET_COOLDOWN_MS;
  }

  /**
   * Place the turret at (x, y). Spawns the sprite and arms the system.
   * Called once per run from GameScene after the player is placed.
   */
  place(x: number, y: number): void {
    this.turretX = x;
    this.turretY = y;
    this.cooldownRemaining = TURRET_COOLDOWN_MS;
    this.placed = true;
    this.hooks.spawnTurretSprite(x, y);
  }

  /**
   * Per-frame tick. Decrements the cooldown and fires when ready.
   * No-ops until `place()` is called, or after victory.
   */
  tick(delta: number): void {
    if (!this.placed) return;
    if (this.hooks.getIsVictoryPending()) return;

    this.cooldownRemaining -= delta;
    if (this.cooldownRemaining <= 0) {
      this.cooldownRemaining = Math.max(this.cooldownRemaining, -TURRET_COOLDOWN_MS) + TURRET_COOLDOWN_MS;
      this.hooks.fireTurretShot(this.turretX, this.turretY, TURRET_DAMAGE_MUL);
    }
  }

  // ── Test surface ──────────────────────────────────────────────────────

  isPlaced(): boolean { return this.placed; }
  getTurretX(): number { return this.turretX; }
  getTurretY(): number { return this.turretY; }
  getCooldownRemaining(): number { return this.cooldownRemaining; }
}
