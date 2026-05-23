/**
 * TuftedFamiliarSystem — The Tufted variant's companion-pup mechanic.
 *
 * At run start a wee pup is placed near the player spawn. The pup follows
 * the player at a leash distance, closing the gap when the player moves
 * ahead. When an enemy enters the pup's attack range the pup fires the
 * player's main weapon at 30% damage on a 1800 ms cadence.
 *
 * Pure orchestration — no Phaser. Constructor takes hooks for all
 * side-effects so the system is testable without a Scene. `tick(delta)` is
 * the per-frame entry point called from `tickFrameWorld`.
 *
 * Replay determinism: fire cadence is fixed. The shot itself uses
 * `WeaponSystem.fireTurretShot` (same method as Engineer, from pup position)
 * which routes through the normal seeded crit-RNG path.
 *
 * Sister pattern: mirrors `EngineerTurretSystem` — stateless hooks, tick
 * loop, overshoot carry-over on cooldown, victory guard.
 */

/** Pup fires at 30% of player weapon damage. */
export const PUP_DAMAGE_MUL = 0.3;
/** Fixed fire interval — slightly slower than Engineer's turret. */
export const PUP_COOLDOWN_MS = 1800;
/** Pup attack range (px). */
export const PUP_ATTACK_RANGE = 250;
/** Preferred follow distance (px) — pup trails within this radius. */
export const PUP_FOLLOW_DISTANCE = 80;
/** Max pup movement speed (px/s). */
export const PUP_MAX_SPEED = 200;

export interface TuftedFamiliarHooks {
  /** True when the run-end ceremony is in progress. */
  getIsVictoryPending(): boolean;
  /** Current world position of the player haggis. */
  getPlayerPosition(): { x: number; y: number };
  /** Fire the main weapon from position (fromX, fromY) at damageMul fraction. */
  firePupShot(fromX: number, fromY: number, damageMul: number): void;
  /** Move the pup sprite to world coordinates (x, y). */
  movePupSprite(x: number, y: number): void;
  /** Spawn the pup sprite at (x, y) in world coordinates. */
  spawnPupSprite(x: number, y: number): void;
}

export class TuftedFamiliarSystem {
  private placed = false;
  private x = 0;
  private y = 0;
  private cooldownRemaining = PUP_COOLDOWN_MS;

  constructor(private readonly hooks: TuftedFamiliarHooks) {}

  /** Reset to run-start state. */
  reset(): void {
    this.placed = false;
    this.x = 0;
    this.y = 0;
    this.cooldownRemaining = PUP_COOLDOWN_MS;
  }

  /**
   * Spawn the pup near (x, y). Called once per run from GameScene after the
   * player is placed.
   */
  place(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.cooldownRemaining = PUP_COOLDOWN_MS;
    this.placed = true;
    this.hooks.spawnPupSprite(x, y);
  }

  /**
   * Per-frame tick. Moves the pup toward the player (leash follow), then
   * fires when the cooldown expires.
   */
  tick(delta: number): void {
    if (!this.placed) return;

    // ── Leash follow ─────────────────────────────────────────────────────
    const { x: px, y: py } = this.hooks.getPlayerPosition();
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > PUP_FOLLOW_DISTANCE) {
      const maxStep = PUP_MAX_SPEED * (delta / 1000);
      const overrun = dist - PUP_FOLLOW_DISTANCE;
      const step = Math.min(maxStep, overrun);
      const nx = dx / dist;
      const ny = dy / dist;
      this.x += nx * step;
      this.y += ny * step;
    }

    this.hooks.movePupSprite(this.x, this.y);

    // ── Attack cooldown ───────────────────────────────────────────────────
    if (this.hooks.getIsVictoryPending()) return;

    this.cooldownRemaining -= delta;
    if (this.cooldownRemaining <= 0) {
      this.cooldownRemaining = Math.max(this.cooldownRemaining, -PUP_COOLDOWN_MS) + PUP_COOLDOWN_MS;
      this.hooks.firePupShot(this.x, this.y, PUP_DAMAGE_MUL);
    }
  }

  // ── Test surface ──────────────────────────────────────────────────────

  isPlaced(): boolean { return this.placed; }
  getPupX(): number { return this.x; }
  getPupY(): number { return this.y; }
  getCooldownRemaining(): number { return this.cooldownRemaining; }
}
