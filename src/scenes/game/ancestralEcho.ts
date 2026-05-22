/**
 * Ancestral Echo — spectral haggis that walks the last-run death spot
 * for 30s at the start of the next run. Touching the echo grants a
 * small pity reward: gold + XP + partial heal.
 *
 * From DESIGN_IDEAS.md §1. The echo is a cross-run narrative hook:
 * "the moor remembers where ye fell". Scope-contained — reuses existing
 * variant texture (tinted pale blue) so no new sprite art is needed,
 * and leverages existing Player / XPSystem / SceneScope APIs for the
 * reward.
 *
 * Pure helpers (TTL freshness, touch-distance predicate) live on
 * `utils/save.ts` and here for unit-test use without Phaser.
 */
import type Phaser from 'phaser';
import type { Player } from '../../entities/Player';
import { TWEEN_INFINITE_BREATHE } from '../../utils/tweenPresets';

/** Radius in pixels the player has to walk within to claim the echo. */
export const ECHO_TOUCH_RADIUS_PX = 42;
/** How long the echo lingers before fading (ms). */
export const ECHO_LIFETIME_MS = 30_000;
/** Gold awarded on touch. */
export const ECHO_GOLD_REWARD = 30;
/** Flat HP heal on touch. */
export const ECHO_HEAL_REWARD = 10;

/**
 * True when the player is within the echo's touch radius. Pure —
 * passes the position pair + radius; tests don't need Phaser.
 */
export function isEchoInRange(
  playerX: number,
  playerY: number,
  echoX: number,
  echoY: number,
  radius: number = ECHO_TOUCH_RADIUS_PX,
): boolean {
  const dx = playerX - echoX;
  const dy = playerY - echoY;
  return dx * dx + dy * dy <= radius * radius;
}

export interface AncestralEchoHooks {
  readonly scene: Phaser.Scene;
  readonly player: Player;
  readonly textureKey: string;
  readonly echoX: number;
  readonly echoY: number;
  /** Fires on touch — GameScene applies gold / heal / toast / caption. */
  onTouch(): void;
  /**
   * Optional — fires when the 30 s lifetime expires WITHOUT a touch.
   * The Moor Remembers (spec 2026-05-22) uses this hook to settle the
   * untouched ghost into a permanent Cairn-of-Echoes. Existing callers
   * that don't pass `onSettle` keep the old fade-and-disappear behaviour.
   */
  onSettle?(): void;
}

/**
 * Phaser-bound orchestrator. Creates a pale tinted haggis sprite that
 * bobs gently at the death spot; fades out after `ECHO_LIFETIME_MS`
 * or on player touch.
 */
export class AncestralEcho {
  private sprite: Phaser.GameObjects.Sprite | null = null;
  private bobTween: Phaser.Tweens.Tween | null = null;
  private lifetimeRemainingMs = ECHO_LIFETIME_MS;
  private touched = false;

  constructor(private readonly hooks: AncestralEchoHooks) {}

  spawn(): void {
    if (this.sprite) return;
    this.sprite = this.hooks.scene.add
      .sprite(this.hooks.echoX, this.hooks.echoY, this.hooks.textureKey)
      .setDepth(7)
      .setAlpha(0.35)
      .setTint(0xb0d4ff)
      .setScale(0.95);

    // Gentle bob — keeps the sprite reading as "hovering" / spectral.
    this.bobTween = this.hooks.scene.tweens.add({
      targets: this.sprite,
      y: this.hooks.echoY - 4,
      duration: 1400,
      ...TWEEN_INFINITE_BREATHE,
    });
  }

  /**
   * Called per gameplay frame. Returns true on the frame the echo
   * resolves (touch or lifetime expiry) so the owner can null it out.
   */
  tick(deltaMs: number): boolean {
    if (!this.sprite || this.touched) return false;
    if (isEchoInRange(this.hooks.player.x, this.hooks.player.y, this.hooks.echoX, this.hooks.echoY)) {
      this.onTouched();
      return true;
    }
    this.lifetimeRemainingMs -= deltaMs;
    if (this.lifetimeRemainingMs <= 0) {
      this.hooks.onSettle?.();
      this.fadeOut();
      return true;
    }
    return false;
  }

  private onTouched(): void {
    if (this.touched) return;
    this.touched = true;
    this.hooks.onTouch();
    if (!this.sprite) return;
    // Expand-and-fade on claim — slightly different feel from timeout fade.
    this.hooks.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scale: 1.6,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => this.destroy(),
    });
  }

  private fadeOut(): void {
    if (!this.sprite) return;
    this.hooks.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 800,
      onComplete: () => this.destroy(),
    });
  }

  destroy(): void {
    if (this.bobTween) {
      this.bobTween.stop();
      this.bobTween = null;
    }
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }

  hasResolved(): boolean {
    return this.touched || this.lifetimeRemainingMs <= 0;
  }
}
