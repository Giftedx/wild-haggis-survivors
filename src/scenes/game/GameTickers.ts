import * as Phaser from 'phaser';
import { COLORS, COLORS_CSS, GAME } from '../../config';
import type { Player } from '../../entities/Player';
import type { BanterSystem } from '../../systems/BanterSystem';
import type { BiomeId } from '../../data/biomes';
import { t } from '../../core/i18n';

export interface GameTickerHooks {
  getPlayer(): Player;
  getScene(): Phaser.Scene;
  getUiViewport(): { x: number; y: number; width: number; height: number };
  getBanter(): BanterSystem | null;
  getCurrentBiomeId(): BiomeId | null;
  /** Selected haggis variant — tags low_hp / recover banter like other variant hooks. */
  getActiveVariantKey(): string;
  /**
   * True iff at least one active enemy is within `radiusPx` of the player.
   * Used by haggis_ambient (Task 10) to gate inner-monologue firing to
   * quiet stretches. Implementation lives on GameScene where the
   * SpawnSystem enemy group is in scope.
   */
  hasEnemyNearby(radiusPx: number): boolean;
  caption(id: string, message: string, tint?: string, durationMs?: number): void;
}

/** Radius (px) around player considered "in combat" for haggis_ambient gate. */
export const HAGGIS_AMBIENT_COMBAT_RADIUS_PX = 200;
/** Continuous no-enemy-near seconds required before haggis_ambient can fire. */
export const HAGGIS_AMBIENT_IDLE_WINDOW_MS = 10_000;
/** HP fraction floor — below this the haggis has bigger things to think about. */
export const HAGGIS_AMBIENT_HP_FLOOR = 0.75;
/** Interval base: 45s ±15s → 30..60s. Randomised each time we reschedule. */
export const HAGGIS_AMBIENT_INTERVAL_BASE_MS = 30_000;
export const HAGGIS_AMBIENT_INTERVAL_JITTER_MS = 30_000;

export class GameTickers {
  private dashIndicator: Phaser.GameObjects.Graphics | null = null;
  private boundaryWarning: Phaser.GameObjects.Rectangle | null = null;
  private lowHpCaptionArmed = true;
  private lastBiomeForBanter: BiomeId | null = null;
  private lastBanterFireMs = 0;
  /**
   * Haggis-ambient state (B1 Phase 2 Task 10). `nextHaggisAmbientMs` is
   * set to `-1` as a sentinel so the first eligible tick primes it off
   * the current scene clock rather than firing immediately at run start.
   * `lastEnemyNearMs` tracks when an enemy was last seen inside the
   * combat radius — firing requires a 10s continuous quiet window.
   */
  private nextHaggisAmbientMs = -1;
  private lastEnemyNearMs = 0;

  constructor(private readonly hooks: GameTickerHooks) {}

  reset(): void {
    this.dashIndicator?.destroy();
    this.dashIndicator = null;
    this.boundaryWarning?.destroy();
    this.boundaryWarning = null;
    this.lowHpCaptionArmed = true;
    this.lastBiomeForBanter = null;
    this.lastBanterFireMs = 0;
    this.nextHaggisAmbientMs = -1;
    this.lastEnemyNearMs = 0;
  }

  destroy(): void {
    this.dashIndicator?.destroy();
    this.dashIndicator = null;
    this.boundaryWarning?.destroy();
    this.boundaryWarning = null;
  }

  updateDashIndicator(): void {
    const scene = this.hooks.getScene();
    const player = this.hooks.getPlayer();
    if (!this.dashIndicator) {
      this.dashIndicator = scene.add.graphics().setDepth(10);
    }
    this.dashIndicator.clear();

    const frac = player.getDashCooldownFraction();
    if (frac <= 0) return;

    this.dashIndicator.lineStyle(2, COLORS.WHISKY_GOLD, 0.6);
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (1 - frac) * Math.PI * 2;
    this.dashIndicator.beginPath();
    this.dashIndicator.arc(player.x, player.y + 20, 8, startAngle, endAngle, false);
    this.dashIndicator.strokePath();
  }

  updateBoundaryWarning(): void {
    const scene = this.hooks.getScene();
    const player = this.hooks.getPlayer();
    const { x, y, width, height } = this.hooks.getUiViewport();
    if (
      !this.boundaryWarning
      || this.boundaryWarning.width !== width
      || this.boundaryWarning.height !== height
      || this.boundaryWarning.x !== x + width / 2
      || this.boundaryWarning.y !== y + height / 2
    ) {
      this.boundaryWarning?.destroy();
      this.boundaryWarning = scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0xff0000, 0)
        .setScrollFactor(0).setDepth(44);
    }
    const margin = 200;
    const distToEdge = Math.min(
      player.x, player.y,
      GAME.WORLD_WIDTH - player.x,
      GAME.WORLD_HEIGHT - player.y
    );
    if (distToEdge < margin) {
      this.boundaryWarning.setAlpha(0.15 * (1 - distToEdge / margin));
    } else {
      this.boundaryWarning.setAlpha(0);
    }
  }

  tickBanter(): void {
    const banter = this.hooks.getBanter();
    if (!banter) return;

    const biomeId = this.hooks.getCurrentBiomeId();
    if (biomeId && biomeId !== this.lastBiomeForBanter) {
      if (this.lastBiomeForBanter !== null) {
        banter.request('biome_change', { tag: biomeId });
      }
      this.lastBiomeForBanter = biomeId;
    }

    const nowMs = this.hooks.getScene().time.now;
    if (nowMs - this.lastBanterFireMs > 90_000) {
      banter.request('idle', { tag: this.hooks.getActiveVariantKey() });
      this.lastBanterFireMs = nowMs;
    }

    this.maybeFireHaggisAmbient(nowMs, banter);

    banter.flush();
  }

  /**
   * B1 Phase 2 Task 10 — haggis_ambient inner monologue.
   *
   * Bumps `lastEnemyNearMs` every tick an enemy is within the combat
   * radius so the "10s continuous quiet" gate is a simple `nowMs -
   * lastEnemyNearMs >= WINDOW` check. `nextHaggisAmbientMs` primes on
   * first eligible tick (sentinel -1) and reschedules with fresh
   * jitter after each fire so the cadence doesn't settle into a
   * perceptible rhythm.
   *
   * Banter priority still governs the final surface: haggis_ambient
   * (25) yields to biome_change (30) and the rest of the ladder, so
   * this just queues a candidate for `flush()` to arbitrate.
   */
  private maybeFireHaggisAmbient(nowMs: number, banter: BanterSystem): void {
    if (this.hooks.hasEnemyNearby(HAGGIS_AMBIENT_COMBAT_RADIUS_PX)) {
      this.lastEnemyNearMs = nowMs;
    }
    if (this.nextHaggisAmbientMs === -1) {
      // Prime on first tick; treat reset instant as a quiet start so
      // the 10s window counts from run-start rather than from -Infinity.
      this.nextHaggisAmbientMs = nowMs + this.rollHaggisAmbientGap();
      this.lastEnemyNearMs = nowMs;
      return;
    }
    if (nowMs < this.nextHaggisAmbientMs) return;

    const player = this.hooks.getPlayer();
    const frac = player.getHp() / Math.max(1, player.getMaxHp());
    if (frac < HAGGIS_AMBIENT_HP_FLOOR) return;
    if (nowMs - this.lastEnemyNearMs < HAGGIS_AMBIENT_IDLE_WINDOW_MS) return;

    banter.request('haggis_ambient');
    this.nextHaggisAmbientMs = nowMs + this.rollHaggisAmbientGap();
  }

  private rollHaggisAmbientGap(): number {
    return HAGGIS_AMBIENT_INTERVAL_BASE_MS
      + Math.floor(Math.random() * HAGGIS_AMBIENT_INTERVAL_JITTER_MS);
  }

  tickLowHpCaption(): void {
    const player = this.hooks.getPlayer();
    const frac = player.getHp() / Math.max(1, player.getMaxHp());
    if (this.lowHpCaptionArmed && frac > 0 && frac < 0.2) {
      this.hooks.caption('low_hp', t('captions.low_hp'), COLORS_CSS.DANGER_RED);
      this.hooks.getBanter()?.request('low_hp', { tag: this.hooks.getActiveVariantKey() });
      this.lowHpCaptionArmed = false;
    } else if (!this.lowHpCaptionArmed && frac > 0.4) {
      this.hooks.getBanter()?.request('recover', { tag: this.hooks.getActiveVariantKey() });
      this.lowHpCaptionArmed = true;
    }
  }
}
