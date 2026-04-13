/**
 * Lightweight ring buffer of damage events feeding the post-death classifier.
 *
 * Captured at each `Player.takeDamage` call site in GameScene. Sampling at
 * damage-events (not a fixed timer) keeps the event count stable across
 * pause/slowmo/hit-freeze — the classifier sees consistent history regardless
 * of game-speed state.
 *
 * Scope: ≤ 15 events is enough to reason about "the last few seconds" in
 * typical Vampire-Survivors-style combat density. Older events are FIFO-
 * dropped; the buffer never allocates.
 */

/** Source classification for a single damage event. */
export interface DamageEvent {
  /** Game-time seconds when the damage landed (NOT wall-clock). */
  gameTimeSec: number;
  /** Source key — enemy key ('highland_cow', 'taxman') OR a synthetic hazard key. */
  sourceKey: string;
  /** Mitigated damage dealt to the player. */
  amount: number;
  /** True if the source was a boss enemy. */
  sourceIsBoss: boolean;
  /** True if the source was an elite-marked enemy. */
  sourceIsElite: boolean;
  /** True if the source is a map hazard (lava etc.) rather than an enemy. */
  sourceIsHazard: boolean;
  /** Player HP after the hit resolved. */
  hpAfter: number;
  /** Player max HP at the time (for ratio math in the classifier). */
  maxHpAfter: number;
}

export const MAX_DAMAGE_EVENTS = 15;
/** Synthetic source key for lava / environmental hazard damage. */
export const HAZARD_SOURCE_KEY = '__hazard__';

export class DeathCauseTracker {
  private buffer: DamageEvent[] = [];
  /** Game-time seconds when the player was last at >= 30% HP. */
  private lastHealthyAtSec: number = 0;

  /** Reset — called at run start / resume. */
  reset(initialGameTimeSec: number): void {
    this.buffer = [];
    this.lastHealthyAtSec = initialGameTimeSec;
  }

  /** Record a damage event. Drops the oldest when the buffer overflows. */
  recordDamage(event: DamageEvent): void {
    this.buffer.push(event);
    if (this.buffer.length > MAX_DAMAGE_EVENTS) this.buffer.shift();
    // After the hit resolves, update healthy-time pointer if player is still >=30%.
    if (event.maxHpAfter > 0 && event.hpAfter / event.maxHpAfter >= 0.3) {
      this.lastHealthyAtSec = event.gameTimeSec;
    }
  }

  /** Called each frame with current HP — advances the healthy pointer during heals/idle. */
  tickHealthyPointer(gameTimeSec: number, hp: number, maxHp: number): void {
    if (maxHp > 0 && hp / maxHp >= 0.3) {
      this.lastHealthyAtSec = gameTimeSec;
    }
  }

  /** Snapshot of state for the classifier. */
  snapshot(): { events: readonly DamageEvent[]; lastHealthyAtSec: number } {
    return {
      events: this.buffer,
      lastHealthyAtSec: this.lastHealthyAtSec,
    };
  }
}
