/**
 * FiannaSpirit — player-owned spectral summon (R1 M4.5 P5).
 *
 * Spawned by fingals_horn's active activation. Each spirit:
 *   - chases the nearest active non-boss enemy,
 *   - deals melee damage on overlap (with a per-enemy cooldown so a
 *     lingering overlap doesn't vaporise targets in one frame),
 *   - expires after a fixed lifetime with a fade-out.
 *
 * Intentionally lean: no HP, no status effects, no spatial culling.
 * Life cycle is "spawn → tick until lifetime → fade → destroy". 3
 * spirits per horn activation, 10s lifetime (constants mirror
 * `relicEffects.ts` so the player-facing number is one source).
 *
 * Phaser coupling: extends Arcade.Sprite purely for the physics body
 * (velocity-based motion). Overlap registration is the caller's job —
 * the spawner in GameScene wires an overlap once per spirit.
 */
import * as Phaser from 'phaser';
import type { Enemy } from './Enemy';
import { pickNearestEnemy } from './fiannaSpiritMath';

export const FIANNA_SPIRIT_SPEED = 260;
export const FIANNA_SPIRIT_DAMAGE = 8;
export const FIANNA_SPIRIT_HIT_COOLDOWN_MS = 350;
export const FIANNA_SPIRIT_HIT_RADIUS = 18;

export class FiannaSpirit extends Phaser.Physics.Arcade.Sprite {
  private elapsedMs = 0;
  private lifetimeMs: number;
  private hitCooldowns: WeakMap<Enemy, number> = new WeakMap();
  private expired = false;

  constructor(scene: Phaser.Scene, x: number, y: number, lifetimeMs: number) {
    super(scene, x, y, 'fx_fianna_spirit');
    this.lifetimeMs = lifetimeMs;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(FIANNA_SPIRIT_HIT_RADIUS / 2, this.width / 2 - FIANNA_SPIRIT_HIT_RADIUS / 2, this.height / 2 - FIANNA_SPIRIT_HIT_RADIUS / 2);
    body.setAllowGravity(false);
    this.setDepth(6);
    this.setAlpha(0);
    scene.tweens.add({ targets: this, alpha: 0.9, duration: 220 });
  }

  /**
   * Advance this spirit one tick. Caller supplies the live enemy
   * group so we don't duplicate spatial queries. `deltaMs` is the
   * scaled scene delta (slow-mo shortens the spirit's effective
   * lifetime, matching every other timed effect).
   */
  tick(deltaMs: number, enemies: readonly Enemy[]): void {
    if (this.expired || !this.active) return;
    this.elapsedMs += deltaMs;
    if (this.elapsedMs >= this.lifetimeMs) {
      this.expire();
      return;
    }

    const target = pickNearestEnemy(this.x, this.y, enemies);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!target) {
      body.setVelocity(0, 0);
      return;
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq) || 1;
    body.setVelocity((dx / dist) * FIANNA_SPIRIT_SPEED, (dy / dist) * FIANNA_SPIRIT_SPEED);
    this.setFlipX(dx < 0);

    // Distance hit — cheaper + more reliable than Arcade overlap for a
    // fast-moving summon.
    if (distSq <= FIANNA_SPIRIT_HIT_RADIUS * FIANNA_SPIRIT_HIT_RADIUS) {
      const now = this.scene.time.now;
      const last = this.hitCooldowns.get(target) ?? -Infinity;
      if (now - last >= FIANNA_SPIRIT_HIT_COOLDOWN_MS) {
        this.hitCooldowns.set(target, now);
        target.takeDamageWithKillEvents(FIANNA_SPIRIT_DAMAGE);
      }
    }
  }

  expire(): void {
    if (this.expired) return;
    this.expired = true;
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (body) body.setVelocity(0, 0);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 280,
      onComplete: () => {
        if (this.active) this.destroy();
      },
    });
  }

  isExpired(): boolean {
    return this.expired;
  }
}

