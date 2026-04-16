/**
 * PlayerHitResolver — runs the player↔enemy overlap cascade: iFrame/
 * victory/dash gate, curse-scaled damage, armor absorption text, death
 * cause tracking, Thorns retaliation, impact tint + squash-stretch
 * recoil, camera shake, flashRed, death trigger.
 *
 * Extracted from `GameScene.onPlayerHitEnemy` (~70 lines). The scene
 * still owns the Phaser overlap registration; this class is called
 * from the overlap callback.
 */
import Phaser from 'phaser';
import type { Player } from '../../entities/Player';
import type { Enemy } from '../../entities/Enemy';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { TimeManager } from '../../systems/TimeManager';
import type { DeathCauseTracker } from '../../systems/DeathCauseTracker';
import type { RunModifiers } from '../../core/RunModifiers';
import type { IFrameController } from './IFrameController';
import type { FloatTextPool } from './FloatTextPool';
import { audio } from '../../systems/AudioSystem';
import { t } from '../../core/i18n';
import { tryCameraShake } from '../../utils/cameraShake';

export interface PlayerHitResolverHooks {
  getPlayer(): Player;
  getJuice(): JuiceSystem;
  getSpawnSystem(): SpawnSystem;
  getTimeManager(): TimeManager;
  getDeathCauseTracker(): DeathCauseTracker;
  getIFrameController(): IFrameController;
  getFloatTextPool(): FloatTextPool;
  getRunModifiers(): RunModifiers;
  getCamera(): Phaser.Cameras.Scene2D.Camera;
  getTweens(): Phaser.Tweens.TweenManager;
  getSettingsManager(): ReturnType<typeof import('../../core/SettingsManager').getSettingsManager>;
  isVictoryPending(): boolean;

  onAfterNonFatalHit(hpBefore: number): void;
  armIFrames(durationMs: number): void;
  onPlayerKilled(): void;
}

/** Post-hit invulnerability window (ms). Matches prior inline constant. */
const IFRAME_MS_AFTER_HIT = 500;
/** White impact flash duration (ms). */
const HIT_TINT_MS = 60;
/** Squash-stretch recoil — duration + x/y scale mults. */
const RECOIL_MS = 50;
const RECOIL_SCALE_X = 0.85;
const RECOIL_SCALE_Y = 1.15;
/** Camera shake intensity curve — min + per-damage-fraction slope, capped. */
const SHAKE_MIN_INTENSITY = 0.003;
const SHAKE_INTENSITY_PER_FRAC = 0.03;
const SHAKE_MAX_INTENSITY = 0.02;
const SHAKE_BASE_MS = 100;
const SHAKE_MS_PER_FRAC = 200;
/** Armor-blocked toast offset + style. */
const ARMOR_TEXT_Y_OFFSET = -30;
const ARMOR_TEXT_RISE_PX = 15;
const ARMOR_TEXT_FADE_MS = 500;

export class PlayerHitResolver {
  constructor(private readonly hooks: PlayerHitResolverHooks) {}

  /**
   * Handle a player↔enemy overlap. Safe to call every overlap tick —
   * gated on iFrames/pause/victory/dash-invincibility before applying
   * damage. No-ops when the gate rejects.
   */
  handle(
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    const h = this.hooks;
    const player = h.getPlayer();

    if (
      h.getIFrameController().isActive() ||
      h.getTimeManager().isGameplayPaused() ||
      h.isVictoryPending() ||
      player.isDashInvincible()
    ) {
      return;
    }

    const enemy = enemyObj as Enemy;
    if (!enemy.active) return;

    // Curse-scaled damage before armor mitigation. Thin Hide inflates
    // incoming blows by 25%; identity mult is a no-op.
    const rawDmg = enemy.getDamage();
    const incomingDmg = Math.max(
      1,
      Math.round(rawDmg * h.getRunModifiers().damageTakenMult),
    );
    const armor = player.getArmor();
    const hpBefore = player.getHp();
    const dead = player.takeDamage(incomingDmg);
    if (!dead) h.onAfterNonFatalHit(hpBefore);

    h.getDeathCauseTracker().recordDamage({
      gameTimeSec: h.getSpawnSystem().getGameTimeSec(),
      sourceKey: enemy.getEnemyKey(),
      amount: Math.max(1, incomingDmg - armor),
      sourceIsBoss: enemy.isBoss(),
      sourceIsElite: enemy.isElite(),
      sourceIsHazard: false,
      hpAfter: player.getHp(),
      maxHpAfter: player.getMaxHp(),
    });

    // Armor absorption text — only shown when armor actually absorbed something.
    if (armor > 0 && incomingDmg > 1) {
      const absorbed = Math.min(armor, incomingDmg - 1);
      const shieldText = h.getFloatTextPool().acquire(
        player.x,
        player.y + ARMOR_TEXT_Y_OFFSET,
        t('ui.game.armor_blocked', { amount: absorbed }),
        '#88aaff',
        '14px',
        85,
      );
      if (shieldText) {
        h.getTweens().add({
          targets: shieldText,
          y: shieldText.y - ARMOR_TEXT_RISE_PX,
          alpha: 0,
          duration: ARMOR_TEXT_FADE_MS,
          onComplete: () => {
            shieldText.setVisible(false);
          },
        });
      }
    }

    // Thorns — retaliate against the enemy that touched us.
    const thorns = player.getThornsDamage();
    if (thorns > 0 && enemy.active) {
      enemy.takeDamageWithKillEvents(thorns);
    }

    // Impact feedback — alpha dim + white fill + squash-stretch recoil.
    player.setAlpha(0.5);
    player.setTintFill(0xffffff);
    h.getIFrameController().armHitTint(HIT_TINT_MS);

    const baseScale = player.scaleX;
    h.getTweens().add({
      targets: player,
      scaleX: baseScale * RECOIL_SCALE_X,
      scaleY: baseScale * RECOIL_SCALE_Y,
      duration: RECOIL_MS,
      yoyo: true,
      ease: 'Sine.easeOut',
    });

    // Camera shake scales with damage-as-fraction-of-maxHp.
    const dmgFrac = incomingDmg / Math.max(1, player.getMaxHp());
    const shakeIntensity = Math.min(
      SHAKE_MAX_INTENSITY,
      SHAKE_MIN_INTENSITY + dmgFrac * SHAKE_INTENSITY_PER_FRAC,
    );
    tryCameraShake(
      h.getCamera(),
      SHAKE_BASE_MS + dmgFrac * SHAKE_MS_PER_FRAC,
      shakeIntensity,
      h.getSettingsManager(),
    );
    audio.playPlayerHit();
    h.getJuice().flashRed();

    h.armIFrames(IFRAME_MS_AFTER_HIT);

    if (dead) h.onPlayerKilled();
  }
}
