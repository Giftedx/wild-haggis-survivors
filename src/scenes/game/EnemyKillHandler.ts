/**
 * EnemyKillHandler — consumes `weaponSystem.enemyKilled` events and runs
 * the full kill cascade: XP gem spawn with combo bonus, kill-count
 * bookkeeping, elite-chain gold bonus, juice + SFX, banter hooks,
 * lifesteal, kill-milestone celebrations, death-ripple knockback, health
 * orb and gold coin drops, boss celebration + Trophy Hunter heal, and
 * Taxman victory trigger with generation guard.
 *
 * Extracted from `GameScene.create()` (previously ~150 lines inline).
 * Counters stay scene-owned — the handler drives them through the hooks
 * surface, matching the `RunLifecycle` / `LevelUpFlow` / `PickupSpawner`
 * pattern.
 */
import type { Enemy } from '../../entities/Enemy';
import type { Player } from '../../entities/Player';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { XPSystem } from '../../systems/XPSystem';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { BanterSystem } from '../../systems/BanterSystem';
import type { PickupSpawner } from './PickupSpawner';
import type { UpdateTickers } from '../../utils/UpdateTickers';
import type { SFXManager } from '../../systems/audio/SFXManager';
import type { RNG } from '../../utils/rng';
import type { EliteAffixId } from '../../data/eliteAffixes';
import type { RunScoreState } from './RunScoreState';
import { audio } from '../../systems/AudioSystem';
import { t } from '../../core/i18n';
import { BALANCE } from '../../core/BalanceConfig';
import { dispatchActComplete } from './dispatchActComplete';
import { formatSpeedrunTime } from '../../utils/formatSpeedrunTime';
import { resolveEnemyDeathColor } from '../../systems/enemyDeathColors';
import { getSettingsManager } from '../../core/SettingsManager';
import {
  healthOrbDropRate,
  healthOrbAmount,
  goldCoinDropRate,
  goldCoinAmountRange,
} from './killDrops';

export interface EnemyKillHandlerHooks {
  // Systems
  getPlayer(): Player;
  getJuice(): JuiceSystem;
  getXPSystem(): XPSystem;
  getSpawnSystem(): SpawnSystem;
  getBanter(): BanterSystem | null;
  getPickupSpawner(): PickupSpawner;
  getUpdateTickers(): UpdateTickers;
  getSFXManager(): SFXManager;
  getRunRng(): RNG;
  getActiveVariantKey(): string | undefined;

  /** Shared per-run score object — reads + mutations routed through this. */
  getRunScore(): RunScoreState;

  /** Run-end trigger (taxman victory). */
  triggerVictory(): void;

  /** W2 Moor Road: called after boss-kill counters are bumped when the killed boss gates an act. */
  onActComplete(actN: 1 | 2): void;

  /**
   * Called when a `buckfast_ned` dies — bottle breaks at the kill site,
   * leaving a slick hazard. Routed through HazardZones in GameScene.
   */
  onBottleBreak?(x: number, y: number): void;

  /**
   * Called when a `traffic_cone_totem` dies — totem collapses, spitting
   * four slick patches in the cardinal directions from the kill site.
   * GameScene wires this to four `HazardZones.spawnBottleSlick` calls.
   */
  onTotemFall?(x: number, y: number): void;

  /**
   * Called when a `haar_wraith` dies — the wraith's mist lingers as a
   * local fog patch. GameScene wires this to
   * `HazardZones.spawnHaarFog`.
   */
  onHaarDispel?(x: number, y: number): void;
}

/** Kill-count thresholds that trigger milestone toasts + gold reward. */
const KILL_MILESTONES = [100, 250, 500, 1000, 2500, 5000];
/** Death-ripple knockback radius squared (50px). */
const RIPPLE_RADIUS_SQ = 50 * 50;
/** Max nearby enemies pushed by one kill's death ripple. */
const RIPPLE_MAX_TARGETS = 6;
/** Ripple knockback duration (ms) — persists past the next chase velocity reset. */
const RIPPLE_KNOCKBACK_MS = 120;
/** Base ripple force scalar (divided by mass and distance before applying). */
const RIPPLE_FORCE = 120;

export class EnemyKillHandler {
  constructor(private readonly hooks: EnemyKillHandlerHooks) {}

  /**
   * Run the full kill cascade. Safe to call for boss, elite, or regular
   * kills; all branches are gated on the `wasBoss`/`wasElite` flags.
   */
  handle(
    x: number,
    y: number,
    xpValue: number,
    enemyKey: string,
    wasBoss: boolean,
    wasElite = false,
    eliteAffixId?: EliteAffixId | null,
  ): void {
    const h = this.hooks;
    const juice = h.getJuice();
    const player = h.getPlayer();
    const spawn = h.getSpawnSystem();
    const banter = h.getBanter();
    const score = h.getRunScore();

    // Kill-streak XP bonus: +1% per combo count (capped at +50%).
    const comboXpBonus = Math.min(0.5, juice.getComboCount() * 0.01);
    h.getXPSystem().spawnGem(
      x,
      y,
      Math.ceil(xpValue * player.getXpMultiplier() * (1 + comboXpBonus)),
    );
    score.incrementKillCount();

    // Elite back-to-back chain — gold bonus only, resets after triple.
    if (wasElite && !wasBoss) {
      const now = spawn.getGameTimeSec();
      const win = BALANCE.enemy.eliteChainWindowSec;
      const lastSec = score.eliteChainLastGameSec;
      const chaining = lastSec !== null && now - lastSec <= win;
      const nextCount = chaining ? score.eliteChainCount + 1 : 1;
      score.eliteChainCount = nextCount;
      score.eliteChainLastGameSec = now;
      if (nextCount === 2) {
        const g = BALANCE.enemy.eliteChainGoldSecond;
        score.addCoinGold(g);
        juice.showToast(t('ui.game.elite_chain_double', { gold: g }), '#e8c060');
      } else if (nextCount >= 3) {
        const g = BALANCE.enemy.eliteChainGoldTriple;
        score.addCoinGold(g);
        juice.showToast(t('ui.game.elite_chain_triple', { gold: g }), '#ffdd44');
        juice.flashWhite(100);
        score.eliteChainCount = 0;
        score.eliteChainLastGameSec = null;
      }
    }

    spawn.noteKillPressure();
    juice.showKillBurst(x, y, resolveEnemyDeathColor(enemyKey));
    juice.hitFreeze();

    // Volatile plays a dedicated boom in Enemy.die — skip the generic sting.
    if (eliteAffixId !== 'volatile') {
      h.getSFXManager().tryPlay('kill', () => audio.playKillImmediate());
    }

    // Banter hooks — ambient lines that sit between louder milestone toasts.
    if (!score.firstKillSeen) {
      score.markFirstKillSeen();
      banter?.request('first_blood', { tag: h.getActiveVariantKey() });
    }
    if (wasBoss) {
      banter?.request('boss_down', { tag: enemyKey });
    } else {
      const combo = juice.getComboCount();
      if (combo === 20 || combo === 75 || combo === 150) {
        banter?.request('kill_streak', { tag: h.getActiveVariantKey() });
      }
    }

    // Lifesteal heal on kill.
    const lifesteal = player.getLifesteal();
    if (lifesteal > 0) player.heal(lifesteal);

    // Kill milestones — per-threshold Glesga one-liner + gold reward.
    const killCount = score.killCount;
    if (KILL_MILESTONES.includes(killCount)) {
      const goldReward = Math.floor(killCount / 50);
      score.addCoinGold(goldReward);
      const milestoneKey = `ui.game.kill_${killCount}`;
      const milestoneText = t(milestoneKey, { gold: goldReward });
      // Fallback to generic if a specific key is missing.
      const toast =
        milestoneText !== milestoneKey
          ? milestoneText
          : t('ui.game.kill_milestone', { count: killCount, gold: goldReward });
      juice.showToast(toast, '#ffdd00');
      juice.flashWhite(150);
      audio.playLevelUp();
    }

    // Death ripple — push up to RIPPLE_MAX_TARGETS nearby enemies.
    // applyKnockback is required (not body.velocity +=) so the push
    // persists past the next chase-velocity reset.
    const enemies = spawn.getEnemyGroup().children.entries as Enemy[];
    let pushed = 0;
    for (let i = 0; i < enemies.length && pushed < RIPPLE_MAX_TARGETS; i++) {
      const e = enemies[i];
      if (!e.active) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq < RIPPLE_RADIUS_SQ && distSq > 0) {
        const dist = Math.sqrt(distSq);
        const body = e.body as Phaser.Physics.Arcade.Body;
        const mass = Math.max(0.05, body.mass);
        const force = RIPPLE_FORCE / mass / dist;
        e.applyKnockback(dx * force, dy * force, RIPPLE_KNOCKBACK_MS);
        pushed++;
      }
    }

    // Health orb drop — 5% base, bosses always.
    const rng = h.getRunRng();
    if (rng.bool(healthOrbDropRate(wasBoss))) {
      h.getPickupSpawner().spawnHealthOrb(x, y, healthOrbAmount(wasBoss));
    }

    // Gold coin drop — 2% base, 10% elite, bosses always.
    if (rng.bool(goldCoinDropRate(wasBoss, wasElite))) {
      const [lo, hi] = goldCoinAmountRange(wasBoss);
      h.getPickupSpawner().spawnGoldCoin(x, y, rng.int(lo, hi));
    }

    // Buckfast bottle break — leaves a slick patch at the kill site.
    if (enemyKey === 'buckfast_ned') {
      h.onBottleBreak?.(x, y);
    }

    // Traffic-cone totem collapse — four slicks at the cardinals.
    if (enemyKey === 'traffic_cone_totem') {
      h.onTotemFall?.(x, y);
    }

    // Haar-wraith dispel — leaves a drifting fog patch.
    if (enemyKey === 'haar_wraith') {
      h.onHaarDispel?.(x, y);
    }

    if (wasBoss) {
      score.incrementBossKillCount();
      const { actToComplete } = dispatchActComplete(enemyKey);
      if (actToComplete !== null) {
        h.onActComplete(actToComplete);
      }
      const bossKillKey = `ui.game.boss_killed_${enemyKey}`;
      const bossKillText = t(bossKillKey);
      const bossToast =
        bossKillText !== bossKillKey ? bossKillText : t('ui.game.boss_killed_generic');
      juice.showToast(bossToast, '#ffdd44');

      // H1 speedrun split — when the toggle is on, show a brief toast with
      // centisecond precision so speedrunners can read splits in-run without
      // a separate widget. Cheap lookup; no new run-state plumbing.
      if (getSettingsManager().load().speedrunTimerVisible === true) {
        const splitSec = spawn.getGameTimeSec();
        juice.showToast(
          t('ui.hud.speedrun_split', { time: formatSpeedrunTime(splitSec) }),
          '#d4a017',
        );
      }

      // Trophy Hunter — % max HP heal on boss kill.
      const healFrac = player.getBossHealFrac();
      if (healFrac > 0) {
        const healAmount = Math.ceil(player.getMaxHp() * healFrac);
        player.heal(healAmount);
        juice.showToast(t('ui.game.boss_kill_heal', { hp: healAmount }), '#44ff44');
      }

      // Boss gold scales with difficulty (xpValue is 25/50/75/100/200 per boss).
      score.addBossGold(Math.ceil(xpValue * 2));
      if (enemyKey === 'taxman') {
        juice.bossDeathSpectacle(x, y);
      } else {
        juice.midRunBossDeathSpectacle(x, y);
      }
      juice.slowMotion();

      // Victory — Taxman is the final boss. Delay 1.5s then trigger,
      // guarded by a generation counter so a restart during the delay
      // doesn't resurrect the call.
      if (enemyKey === 'taxman') {
        score.victoryPending = true;
        const gen = score.nextVictoryDelayGen();
        h.getUpdateTickers().addOnce('raw', 1500, () => {
          if (gen !== score.victoryDelayGen) return;
          h.triggerVictory();
        });
      }
    }
  }
}
