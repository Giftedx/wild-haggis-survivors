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
import { dispatchStretchComplete } from './dispatchStretchComplete';
import type { Act3Stretch } from '../../data/nodeBanks';
import { COLORS_CSS } from '../../config';
import { formatSpeedrunTime } from '../../utils/formatSpeedrunTime';
import { resolveEnemyDeathColor } from '../../systems/enemyDeathColors';
import { getSettingsManager } from '../../core/SettingsManager';
import {
  healthOrbDropRate,
  healthOrbAmount,
  goldCoinDropRate,
  goldCoinAmountRange,
} from './killDrops';
import { bumpBeastieKilled, bumpFirstTimeEvent } from '../../utils/save';

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
   * M1 F6 — called after the_laird / hunter_general dies to swap the
   * Act 3 node-path bank. Laird → stretch 2 (post-Laird), Hunter-General
   * → stretch 3 (post-Hunter-General). Scene wires this to
   * `initNodeMapForAct(3, stretch)` which re-rolls the path and resets
   * the cursor. Not fired for gordon / tour_bus (those go through
   * `onActComplete`) or taxman (victory path).
   */
  onStretchComplete?(stretch: Act3Stretch): void;

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

  /**
   * Called when a `tourist` enemy dies — the camera drops to the moor
   * as a Polaroid pickup (DESIGN_IDEAS §11 wild-haggis-myth tribute).
   * GameScene wires this to `PickupSpawner.spawnPolaroid`. Optional so
   * non-production tests don't need the full pickup wiring; rate is
   * a fixed roll inside the handler so balance lives in one place.
   */
  onTouristPhotographed?(x: number, y: number): void;

  /**
   * Called after every elite non-boss kill. R1 M2 T13: GameScene wires
   * this to a RelicSystem drop-roll + RelicPickup spawn at (x, y).
   * Fires regardless of whether a Relic actually drops — the roll
   * itself lives in the hook so the drop rate can vary by variant /
   * moor route / difficulty without re-plumbing this handler.
   */
  onEliteKilled?(x: number, y: number): void;

  /**
   * R1 M4 — clootie_rag doubles lifesteal for 5s after taking damage.
   * Identity default when the driver isn't wired.
   */
  modifyLifesteal?(base: number): number;

  /**
   * R1 M4 — stone_of_destiny_shard +50% XP from all sources. Applied
   * after player XP multiplier + combo bonus so the relic composes
   * on top of every existing XP stack.
   */
  modifyXpGain?(base: number): number;

  /**
   * Called after every boss kill. R1 M2 T14: GameScene wires this to a
   * guaranteed Relic drop for Tier-2+ bosses (whitelist lives in
   * data/relicDrops.ts). `bossKey` lets the hook short-circuit for
   * gordon (Tier-1) and taxman (victory path).
   */
  onBossKilled?(bossKey: string, x: number, y: number): void;

  /**
   * R1 M4.5 P1 — called on every kill so the scene can gate a
   * cairn_stone heather-kill magnet pulse (biome lookup + driver
   * cooldown + player.grantCeilidhChainMagnet). Handler stays
   * biome-agnostic; scene owns the side-effect.
   */
  tryCairnStoneMagnet?(x: number, y: number): void;
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
    const baseXp = xpValue * player.getXpMultiplier() * (1 + comboXpBonus);
    const boostedXp = h.modifyXpGain?.(baseXp) ?? baseXp;
    h.getXPSystem().spawnGem(x, y, Math.ceil(boostedXp));
    score.incrementKillCount();

    // C1 M2 Task 11 — Almanac Beasties book kill tally. Best-effort
    // localStorage write per kill; DiscoveryLog.recordBeastieKilled
    // no-ops on keys that were never `bumpBeastieSeen`'d, so a
    // stray kill on a pre-discovery-log save stays silent.
    bumpBeastieKilled(enemyKey);

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
        audio.playEliteChain(2);
      } else if (nextCount >= 3) {
        const g = BALANCE.enemy.eliteChainGoldTriple;
        score.addCoinGold(g);
        juice.showToast(t('ui.game.elite_chain_triple', { gold: g }), '#ffdd44');
        audio.playEliteChain(3);
        juice.flashWhite(100);
        score.eliteChainCount = 0;
        score.eliteChainLastGameSec = null;
      }

      // R1 M2 T13 — Relic drop roll. Placed inside the elite branch so
      // a single-hook call from this handler reaches the RelicSystem in
      // one place; GameScene wires the concrete drop + pickup spawn.
      h.onEliteKilled?.(x, y);
    }

    spawn.noteKillPressure();

    // R1 M4.5 P1 — cairn_stone heather-kill magnet hook.
    h.tryCairnStoneMagnet?.(x, y);

    // Pass the medium-tier opt only on elite kills so the regular-kill
    // call shape (3 args) stays identical to its pre-Round-2 contract —
    // existing test spies assert on the 3-arg invocation.
    if (wasElite && !wasBoss) {
      juice.showKillBurst(x, y, resolveEnemyDeathColor(enemyKey), { tier: 'medium' });
    } else {
      juice.showKillBurst(x, y, resolveEnemyDeathColor(enemyKey));
    }
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
      // Burns echo — "Wee, sleekit, cow'rin, tim'rous beastie" / "best-laid
      // schemes o' mice an' men gang aft a-gley". Fires the mouse_moment
      // sub-pool inside burns_citation when a small-flee enemy dies. Beats
      // kill_streak (43 > 40) on the rare same-tick collision; the
      // round-robin ring keeps the two authored couplets fresh.
      if (enemyKey === 'sheep' || enemyKey === 'midge') {
        banter?.request('burns_citation', { tag: 'mouse_moment' });
      }
    }

    // Lifesteal heal on kill. clootie_rag (R1 M4) doubles this for
    // 5s after the haggis takes damage; identity otherwise.
    const rawLifesteal = player.getLifesteal();
    const lifesteal = h.modifyLifesteal?.(rawLifesteal) ?? rawLifesteal;
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
    const enemies = spawn.getEnemyGroup().getChildren() as Enemy[];
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

    // Tourist Polaroid drop (DESIGN_IDEAS §11). Rare-ish (1-in-6) so
    // the moor isn't paved with cameras after a swarm clear, but
    // common enough that a typical run sees a few. The roll uses the
    // seeded run RNG so a recorded replay reproduces the same drop
    // sequence, keeping ADR-0002 Phase 3 determinism intact.
    if (enemyKey === 'tourist' && rng.bool(1 / 6)) {
      h.onTouristPhotographed?.(x, y);
    }

    if (wasBoss) {
      score.incrementBossKillCount();

      // R1 M2 T14 — guaranteed Relic drop for Tier-2+ bosses. Scene
      // hook reads the boss whitelist (tour_bus / the_laird /
      // hunter_general / taxman) and spawns the pickup.
      h.onBossKilled?.(enemyKey, x, y);

      // B1 Phase 3 Task 18 — first-time reserved line on the very first
      // kill of this boss key across all saves. Priority 110 means it
      // wins same-tick arbitration against boss_down (70), so the warm
      // milestone line fires instead of the generic boss-felled toast.
      // `bumpFirstTimeEvent` returns true exactly once per event id, so
      // subsequent kills fall back to the normal `boss_down` request
      // below without needing an explicit guard here.
      const firstKillEvent = `boss_${enemyKey}_kill`;
      if (bumpFirstTimeEvent(firstKillEvent)) {
        banter?.request('first_time', { tag: firstKillEvent });
      }

      const { actToComplete } = dispatchActComplete(enemyKey);
      if (actToComplete !== null) {
        h.onActComplete(actToComplete);
      } else {
        // M1 F6 — mid-act-3 boss kill: swap the Act 3 stretch bank.
        // Mutually exclusive with act-complete (gordon / tour_bus never
        // advance a stretch, and laird / hunter_general never advance
        // an act), so the else-branch keeps both dispatches from firing.
        const { stretchToLoad } = dispatchStretchComplete(enemyKey);
        if (stretchToLoad !== null) {
          h.onStretchComplete?.(stretchToLoad);
        }
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
          COLORS_CSS.WHISKY_GOLD,
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
