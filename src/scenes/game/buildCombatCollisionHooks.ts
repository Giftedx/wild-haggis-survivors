/**
 * buildCombatCollisionHooks — assembles the opts bag passed to
 * {@link installCombatCollisions} from `GameScene.create()`.
 *
 * Why extract: the inline bag was ~112 LOC — by far the largest single
 * argument literal in `create()` (the W82 boss-kill-highlight closure,
 * the Kelpie-foal unlock, the cairn-stone heather magnet, the
 * non-fatal-hit mercy-luck hook). Pulling it into a sibling builder is
 * the single biggest line-count win toward the GameScene facade target
 * and changes no behaviour: the bag is constructed at the same point in
 * `create()`, reads the same live fields, and runs in the same order.
 *
 * Why type-couple to GameScene (precedent: `buildRuneSystemControllerHooks`,
 * `buildPauseMenuHooks`): the bag reads many scene fields + private
 * methods (relicOrchestrator, relicEffectDriver, moorMomentsState,
 * buildMoorMomentsContext, launchActIntermission, initNodeMapForAct)
 * that are NOT part of any sub-system's public surface. A type-only
 * `import type { GameScene }` keeps the wiring honest at compile time
 * without an import cycle at runtime. The `private` fields/methods the
 * builder reads are dropped to package visibility — they were already
 * accessed via the inline closures, so encapsulation was nominal.
 */
import type { GameScene } from '../GameScene';
import type { InstallCombatCollisionsOpts } from './installCombatCollisions';
import { t } from '../../core/i18n';
import {
  bumpBossKillCount,
  bumpCursedVictoryByBoss,
  unlockCompanion,
} from '../../utils/save';
import { tryMoorMercyLuck as moorMomentsTryMercyLuck } from './moorMoments';

/**
 * Build the {@link InstallCombatCollisionsOpts} bag for the given scene.
 *
 * Fresh object — no caching. Built once per `create()` alongside the
 * `installCombatCollisions(...)` call.
 */
export function buildCombatCollisionHooks(scene: GameScene): InstallCombatCollisionsOpts {
  return {
    scene,
    player: scene.player,
    spawnSystem: scene.spawnSystem,
    weaponSystem: scene.weaponSystem,
    xpSystem: scene.xpSystem,
    timeManager: scene.timeManager,
    deathCauseTracker: scene.deathCauseTracker,
    iFrameController: scene.iFrameController,
    floatTextPool: scene.floatTextPool,
    runScore: scene.runScore,
    runRng: scene.runRng,
    runStatsTracker: scene.runStatsTracker,
    runeBag: scene.runeBag,
    updateTickers: scene.updateTickers,
    grudgeLedger: scene.grudgeLedger,
    getJuice: () => scene.juice,
    getHud: () => scene.hud,
    getBanter: () => scene.banter,
    getPickupSpawner: () => scene.pickupSpawner,
    getLevelUpFlow: () => scene.levelUpFlow,
    getRunModifiers: () => scene.runModifiers,
    getActiveVariantKey: () => scene.activeVariant?.key,
    getActiveCurseKey: () => scene.activeCurseKey,
    getSFXManager: () => scene.getSFXManager(),
    getSettingsManager: () => scene.settingsManager,
    triggerVictory: () => scene.runLifecycle.handleVictory(),
    onActComplete: (actN) => scene.launchActIntermission(actN),
    onStretchComplete: (stretch) => scene.initNodeMapForAct(3, stretch),
    onBottleBreak: (x, y) => scene.hazardZones.spawnBottleSlick(x, y),
    onTotemFall: (x, y) => {
      // Four slicks at the cardinals, offset so the totem kill site is
      // walkable — player shouldn't be trapped by the burst they caused.
      const offset = 32;
      scene.hazardZones.spawnBottleSlick(x - offset, y);
      scene.hazardZones.spawnBottleSlick(x + offset, y);
      scene.hazardZones.spawnBottleSlick(x, y - offset);
      scene.hazardZones.spawnBottleSlick(x, y + offset);
    },
    onHaarDispel: (x, y) => scene.hazardZones.spawnHaarFog(x, y),
    onTouristPhotographed: (x, y) => scene.pickupSpawner.spawnPolaroid(x, y),
    onHunterFieldNote: (x, y) => scene.pickupSpawner.spawnFieldNote(x, y),
    onEliteKilled: (x, y) => scene.relicOrchestrator.rollAndSpawn('elite', x, y),
    onNamedEliteKilled: () => scene.runeSystemController.noteNamedEliteKilled(),
    onBossKilled: (bossKey, x, y) => {
      scene.relicOrchestrator.rollAndSpawn('boss', x, y, bossKey);
      // Wee Tales — record the boss key in kill order so the run-end
      // tale-picker can match a "three_bosses victory" or per-boss
      // line. Push-only here; resetTransientRunState clears the
      // array on the next run.
      scene.bossKilledKeys.push(bossKey);
      // Wild Living World Phase 4 — Kelpie Foal unlock on first
      // Each Uisge kill. The foal follows the haggis out of the
      // loch after its kin is defeated.
      if (bossKey === 'each_uisge') {
        const foalUnlocked = unlockCompanion('kelpie_foal');
        if (foalUnlocked) {
          scene.juice?.showToast(t('ui.cairn.kelpie_foal_unlock_toast'), '#40d8e0');
          scene.caption('kelpie_foal_unlock', t('ui.cairn.kelpie_foal_unlock_caption'), '#40d8e0', 3500);
        }
      }
      // W82 Phase 3 — snapshot the rolling buffer at the kill
      // moment. Non-destructive: the recorder keeps rolling so a
      // subsequent boss kill produces its own clean snapshot
      // (replaces this one). Skipped silently when the recorder
      // is unavailable, audio-only, or hasn't yet accumulated a
      // chunk.
      const rec = scene.clipRecorder;
      if (rec && rec.isAvailable()) {
        const blob = rec.snapshot();
        if (blob !== null) {
          scene.bossKillHighlight = {
            bossKey,
            blob,
            extension: rec.selectedExtension(),
            capturedAtSec: scene.spawnSystem?.getGameTimeSec() ?? 0,
          };
        }
      }
    },
    bumpBossKillCount,
    bumpCursedVictoryByBoss,
    modifyLifesteal: (base, nowMs) => scene.relicEffectDriver?.modifyLifesteal(base, nowMs) ?? base,
    modifyXpGain: (base) => scene.relicEffectDriver?.modifyXpGain(base) ?? base,
    tryCairnStoneMagnet: (x, y) => {
      // R1 M4.5 P1 — heather-biome kills grant a short pickup-magnet
      // pulse, reusing the ceilidh-chain buff path (flat radius +
      // duration). Cooldown lives inside the driver.
      const driver = scene.relicEffectDriver;
      if (!driver) return;
      const biome = scene.getBiomeManager()?.biomeAt(x, y);
      if (biome !== 'heather') return;
      if (!driver.tryCairnStoneHeatherKill(scene.time.now)) return;
      scene.player.grantCeilidhChainMagnet(40, 2000);
    },
    caption: (id, msg, tint, dur) => scene.caption(id, msg, tint, dur),
    onAfterNonFatalHit: (hpBefore) => {
      // R1 M4 — stamp clootie_rag lifesteal-double window + reset
      // grans_teapot damage-free timer on every hit the haggis
      // survives. Fatal hits skip: no run remains to collect on.
      scene.relicEffectDriver?.noteDamageTaken(scene.time.now);
      moorMomentsTryMercyLuck(scene.moorMomentsState, scene.buildMoorMomentsContext(), hpBefore);
    },
    armIFrames: (ms) => scene.armIFrames(ms),
    onPlayerKilled: () => scene.runLifecycle.onPlayerHitZero(),
    modifyEnemyContactDamage: (base, enemyKey) => {
      // R1 M4 — midgie_repellent zeroes midge-swarm damage.
      if (enemyKey === 'midge' && scene.relicEffectDriver?.isMidgieSwarmImmune()) {
        return 0;
      }
      return base;
    },
  };
}
