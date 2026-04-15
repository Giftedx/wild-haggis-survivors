import type { Player } from '../../entities/Player';

/**
 * Owns the player's short-window invincibility (post-hit / level-up) and the
 * linked damage-flash tint clear. Both timers run on **scaled** delta so they
 * freeze during UI pause / level-up and resume when gameplay does. Kept as a
 * controller (not a utility) because the generation counter guards against
 * stale clear-callbacks overwriting a freshly-armed window.
 */
export class IFrameController {
  private active = false;
  private generation = 0;
  private timerGen = 0;
  private remainingMs = 0;
  private hitTintClearRemainingMs = 0;

  constructor(private readonly getPlayer: () => Player | undefined) {}

  isActive(): boolean {
    return this.active;
  }

  arm(durationMs: number): void {
    this.generation++;
    this.timerGen = this.generation;
    this.remainingMs = durationMs;
    this.active = true;
  }

  armHitTint(durationMs: number): void {
    this.hitTintClearRemainingMs = durationMs;
  }

  tick(scaledDelta: number): void {
    this.tickHitTintClear(scaledDelta);
    this.tickIFrameWindow(scaledDelta);
  }

  reset(): void {
    this.active = false;
    this.generation = 0;
    this.timerGen = 0;
    this.remainingMs = 0;
    this.hitTintClearRemainingMs = 0;
  }

  private tickHitTintClear(scaledDelta: number): void {
    if (this.hitTintClearRemainingMs <= 0) return;
    this.hitTintClearRemainingMs -= scaledDelta;
    if (this.hitTintClearRemainingMs <= 0) {
      this.hitTintClearRemainingMs = 0;
      const player = this.getPlayer();
      if (player?.active) player.clearTint();
    }
  }

  private tickIFrameWindow(scaledDelta: number): void {
    if (this.remainingMs <= 0) return;
    this.remainingMs -= scaledDelta;
    if (this.remainingMs <= 0 && this.timerGen === this.generation) {
      this.remainingMs = 0;
      this.active = false;
      const player = this.getPlayer();
      if (player?.active) player.setAlpha(1);
    }
  }
}
