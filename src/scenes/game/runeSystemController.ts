/**
 * RuneSystemController — owns the per-frame rune tick + pulse drain
 * that used to live across ~180 LOC of GameScene (`tickRuneSystem`,
 * `applyRunePulses`, `handleBurnsPlatterCollect`).
 *
 * Behaviour preserved verbatim from the prior inlined methods.
 *
 * Hooks-pattern follows RelicOrchestrator / LevelUpFlow precedent:
 * GameScene injects lazy getters for systems and per-run state that
 * may rebind on scene reuse (`runeBag`, `runeSystem`, `runePulseRng`).
 *
 * Determinism: gem positions in the pulse drain go through a seeded
 * `runePulseRng` (branched from `runRng` in GameScene.create). The
 * controller never calls `Math.random` — staying replay-deterministic
 * is the contract per `feedback_test_runner_vs_tsc` / ADR-0002 Phase 3.
 */
import type { Player } from '../../entities/Player';
import type { Enemy } from '../../entities/Enemy';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { WeaponSystem } from '../../systems/WeaponSystem';
import type { XPSystem } from '../../systems/XPSystem';
import type { BiomeId } from '../../data/biomes';
import type { RNG } from '../../utils/rng';
import type { ChestSpriteRegistry } from './ChestSpriteRegistry';
import type { UpgradeCardsUI } from '../../ui/UpgradeCards';
import type { BanterSystem } from '../../systems/BanterSystem';
import type { RunActState } from './RunActState';
import type { RunScoreState } from './RunScoreState';
import type { RuneEffectBag } from '../../systems/runes/runeEffects';
import type { RuneConditionSystem } from '../../systems/RuneConditionSystem';
import { drainRunePulses } from '../../systems/runes/runeEffects';
import {
  composeGoldMul,
  composeBagpipesRadiusMul,
  composeBassAttackSpeedMul,
  composeEnemySlowMul,
} from '../../systems/runes/runeConsumer';
import { computeTimeOfDayKey } from './computeTimeOfDayKey';
import { buildRuneEvalContextFromScene } from './runeContextBuilder';
import { t } from '../../core/i18n';

export interface RuneSystemControllerHooks {
  getPlayer: () => Player;
  getJuice: () => JuiceSystem;
  getSpawnSystem: () => SpawnSystem;
  getWeaponSystem: () => WeaponSystem;
  getXPSystem: () => XPSystem;
  getRunScore: () => RunScoreState;
  getRunActState: () => RunActState;
  getRuneBag: () => RuneEffectBag;
  getRuneSystem: () => RuneConditionSystem;
  getRunePulseRng: () => RNG;
  /** Live biome at player position (already gated by BiomeController). */
  currentBiomeAtPlayer: () => BiomeId | null;
  getRelicHeldCount: () => number;
  getEvolvedWeaponsCount: () => number;
  getChestRegistry: () => ChestSpriteRegistry;
  getUpgradeUI: () => UpgradeCardsUI | null;
  getBanter: () => BanterSystem | null;
  /** Phaser scene time used to timestamp the burns-platter pickup. */
  getTimeNowMs: () => number;
  setBurnsPlatterPickedUpAtMs: (ms: number) => void;
}

export class RuneSystemController {
  constructor(private readonly hooks: RuneSystemControllerHooks) {}

  /**
   * U1 Task 14 — per-frame rune tick. Builds a RuneEvalContext from live
   * scene state and feeds it to the condition system. The system fires
   * apply/remove on transitions; the shared runeBag is read by consumers
   * (Player stats, WeaponSystem effects, gold gain, enemy slow) downstream.
   *
   * M4 (2026-04-26): also runs the per-frame consumer fold — refresh the
   * gold-gain multiplier, apply enemy slow, drain pulse queues, push
   * bagpipes radius into WeaponSystem.
   */
  tick(delta: number): void {
    const runeSystem = this.hooks.getRuneSystem();
    const runScore = this.hooks.getRunScore();
    if (runeSystem.activeCount() === 0) {
      // Even with no runes, ensure the gold mult is identity (cheap; the
      // setter clamps so this is safe to call every frame).
      runScore.setGoldGainMultiplier(1);
      return;
    }
    const runeBag = this.hooks.getRuneBag();
    // Advance the bag's nowMs for latched-timed effects (dmg_mult_timed).
    runeBag.nowMs += delta;
    const p = this.hooks.getPlayer();
    const spawnSystem = this.hooks.getSpawnSystem();
    const weaponSystem = this.hooks.getWeaponSystem();
    const runActState = this.hooks.getRunActState();
    // Use the *base* max-HP (pre-rune fold) so the rune's hp_max bonus
    // doesn't trivially raise the hp_low threshold by raising the divisor.
    // Thirst Rune ("hp < 30%") fires on real damage taken, not on a
    // synthetic full-bar fraction shrink.
    const maxHpBase = p.getMaxHpBase();
    const biomeKey = this.hooks.currentBiomeAtPlayer();
    const ctx = buildRuneEvalContextFromScene({
      biomeKey,
      hpFrac: maxHpBase > 0 ? p.getHp() / maxHpBase : 1,
      nearHazardWater: p.isInSlick() || p.isInFog(),
      nearCairn: false,
      ownedRelicsCount: this.hooks.getRelicHeldCount(),
      ownedWeaponKeys: weaponSystem.getWeapons().map((w) => w.config.key),
      runTimeMs: spawnSystem.getGameTimeSec() * 1000,
      combo: this.hooks.getJuice().getComboCount(),
      unopenedChestsCount: this.hooks.getChestRegistry().getMarkers().length,
      dashMsAgo: null,
      evolvedWeaponsCount: this.hooks.getEvolvedWeaponsCount(),
      killsThisRun: runScore.killCount,
      justKilled: false,
      lastKillDeltaMs: null,
      distinctKillTypesIn5s: 0,
      critOnWeakenedThisFrame: false,
      pickupChainDurationMs: 0,
      namedEliteKilledThisFrame: false,
      killOnThistleThisFrame: false,
      musicBassActive: false,
      // Approximation: act # × 4 + current node index gives a rough
      // count of nodes visited across the run. Pilgrim Rune triggers at 3.
      nodesVisited: Math.max(0, (runActState.currentAct - 1) * 4 + runActState.currentNodeIndex),
      postBell: runScore.victoryPending,
      // B5 Phase 0 — gloaming TOD producer. Maps run time to dawn/day/
      // dusk/night so `gloaming_rune` (`biome_dusk` predicate) can fire
      // in the 15-22min window. See computeTimeOfDayKey for boundaries.
      timeOfDayKey: computeTimeOfDayKey(spawnSystem.getGameTimeSec() * 1000),
    });
    runeSystem.tick(ctx);

    // M4 — fold the bag into per-frame system state. Cheap multiplies;
    // identity when no rune currently active. Per the bag-vs-cached-field
    // gotcha, we re-sync each frame so a transition from `runeSystem.tick`
    // is reflected before any system reads.
    runScore.setGoldGainMultiplier(composeGoldMul(runeBag));

    // Bass attack-speed flag → fold into WeaponSystem via the existing
    // setMultipliers pass that runs immediately after this tick.
    void composeBassAttackSpeedMul; // tracked at setMultipliers fold below

    // Bagpipes radius — only one weapon listens; touch the weapon's aoe
    // radius scalar at the source.
    void composeBagpipesRadiusMul; // wired in WeaponSystem effective-aoe path

    // Enemy slow — write through to enemies via a single SpawnSystem hook.
    spawnSystem.setRuneEnemySlowMul(composeEnemySlowMul(runeBag));

    // Drain pulses (one-shot reward queues — gems, healing thistles,
    // rerolls, shrine buffs, lightning chains, thistle bombs, chest drop).
    this.applyPulses();
  }

  /**
   * U1 M4 — drain the rune bag's pulse queues into in-world effects.
   *
   * Pulses are emitted at apply-time by `applyRuneEffect` and accumulate
   * until the consumer drains them. We drain every frame so a rune that
   * just transitioned true (e.g. echo_rune on every-10th-kill) lands its
   * reward on the same tick the cascade fires.
   */
  applyPulses(): void {
    const runeBag = this.hooks.getRuneBag();
    const drained = drainRunePulses(runeBag);
    const p = this.hooks.getPlayer();
    const juice = this.hooks.getJuice();
    const xpSystem = this.hooks.getXPSystem();
    const runScore = this.hooks.getRunScore();
    const upgradeUI = this.hooks.getUpgradeUI();
    const spawnSystem = this.hooks.getSpawnSystem();
    const runePulseRng = this.hooks.getRunePulseRng();

    if (drained.gems > 0) {
      // Spawn extra gems near the player so the magnet pulls them.
      // Seeded RNG — gem positions feed into pickup-radius eligibility,
      // so they're game state under the T1 replay contract.
      for (let i = 0; i < drained.gems; i++) {
        const angle = runePulseRng.next() * Math.PI * 2;
        const r = 24 + runePulseRng.next() * 28;
        xpSystem.spawnGem(
          p.x + Math.cos(angle) * r,
          p.y + Math.sin(angle) * r,
          1,
        );
      }
    }
    if (drained.healingThistles > 0) {
      // Heal stand-in: each thistle = small flat heal pulse. Lighter than
      // a dedicated pickup spawn but always reads as warmth.
      const heal = Math.max(2, Math.ceil(p.getMaxHp() * 0.05));
      for (let i = 0; i < drained.healingThistles; i++) {
        p.heal(heal);
      }
      juice.showToast(
        t('ui.game.rune_thistle_pulse', { count: drained.healingThistles }),
        '#88ff88',
      );
    }
    if (drained.rerolls > 0 && upgradeUI) {
      for (let i = 0; i < drained.rerolls; i++) upgradeUI.grantReroll();
      juice.showToast(
        t('ui.game.rune_reroll_grant', { count: drained.rerolls }),
        '#bca3d4',
      );
    }
    if (drained.shrineBuffs > 0) {
      // Stand-in: small heal + gold burst until a dedicated shrine-buff
      // grant API lands. Documented in the M4 plan as a known stub.
      p.heal(Math.max(5, Math.ceil(p.getMaxHp() * 0.1)));
      runScore.addCoinGold(20 * drained.shrineBuffs);
      juice.showToast(
        t('ui.game.rune_shrine_pulse', { count: drained.shrineBuffs }),
        '#ffdd66',
      );
    }
    if (drained.thistleBombs.length > 0) {
      // Damage AoE at player position. Inexpensive: iterate enemies once,
      // apply distance check + flat damage. Caps per-pulse so a runaway
      // chain doesn't explode CPU.
      const enemies = spawnSystem.getEnemyGroup().getChildren() as Enemy[];
      for (const bomb of drained.thistleBombs) {
        const r2 = bomb.radius * bomb.radius;
        let hits = 0;
        for (const e of enemies) {
          if (!e.active || hits >= 16) continue;
          const dx = e.x - p.x;
          const dy = e.y - p.y;
          if (dx * dx + dy * dy <= r2) {
            e.takeDamage(bomb.dmg);
            hits++;
          }
        }
      }
      juice.showToast(t('ui.game.rune_thistle_bomb'), '#a070c0');
      juice.flashWhite(60);
    }
    if (drained.lightningChains.length > 0) {
      // Hit the N nearest enemies per chain for a flat damage blast.
      const enemies = spawnSystem.getEnemyGroup().getChildren() as Enemy[];
      for (const chain of drained.lightningChains) {
        let chained = 0;
        const sorted = enemies
          .filter((e) => e.active)
          .sort((a, b) => {
            const da = (a.x - p.x) ** 2 + (a.y - p.y) ** 2;
            const db = (b.x - p.x) ** 2 + (b.y - p.y) ** 2;
            return da - db;
          });
        for (const e of sorted) {
          if (chained >= chain.targets) break;
          e.takeDamage(40);
          chained++;
        }
      }
      juice.showToast(t('ui.game.rune_lightning'), '#88ddff');
    }
    if (drained.chestDropNext) {
      // Flag: next eligible chest is guaranteed legendary. Stand-in:
      // immediate +50 gold burst until the chest pipeline can read the
      // flag. Never silent — always toast so the player sees the rune
      // fire.
      runScore.addCoinGold(50);
      juice.showToast(t('ui.game.rune_chest_omen'), '#ffdd44');
    }
  }

  /**
   * E1 M2 T10 — Burns Night platter collect callback. Records the
   * pickup timestamp so `burnsPlatterDamageBuff` reads 1.3× for the
   * next 60 s, then fires the Burns-citational banter line. Heal +
   * VFX live in `PickupSpawner.spawnBurnsPlatter`; this handler owns
   * scene state + narrative voice.
   */
  onBurnsPlatterCollect(): void {
    this.hooks.setBurnsPlatterPickedUpAtMs(this.hooks.getTimeNowMs());
    this.hooks.getBanter()?.request('burns_citation', { tag: 'haggis_moment' });
  }
}
