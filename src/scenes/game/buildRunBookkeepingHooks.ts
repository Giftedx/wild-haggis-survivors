/**
 * buildRunBookkeepingHooks — assembles the opts bag passed to
 * {@link installRunBookkeeping} (MoorMomentScheduler + RunPersistenceBridge
 * + BossHpTracker + DebugTimeTravelApi ctors) from `GameScene.create()`.
 *
 * Why extract: the inline bag was ~46 LOC of getter/setter wiring plus the
 * debug-audit relic-discard closure. Pulling it into a sibling builder
 * shrinks the scene class without changing behaviour.
 *
 * Why type-couple to GameScene (precedent: `buildCombatCollisionHooks`):
 * the bag reads + writes scene fields (relicOrchestrator, relicSystem,
 * suppressNextNodeMapRoll, cairnStacking) outside any sub-system's public
 * surface. A type-only `import type { GameScene }` keeps the wiring honest
 * without a runtime import cycle.
 */
import type { GameScene } from '../GameScene';
import type { InstallRunBookkeepingOpts } from './installRunBookkeeping';
import { RELICS } from '../../data/relics';

/**
 * Build the {@link InstallRunBookkeepingOpts} bag for the given scene.
 *
 * Fresh object — no caching. Built once per `create()` alongside the
 * `installRunBookkeeping(...)` call.
 */
export function buildRunBookkeepingHooks(scene: GameScene): InstallRunBookkeepingOpts {
  return {
    getRunRng: () => scene.runRng,
    getPlayer: () => scene.player,
    getXPSystem: () => scene.xpSystem,
    getJuice: () => scene.juice,
    getSpawnSystem: () => scene.spawnSystem,
    getRunModifiers: () => scene.runModifiers,
    isSceneActive: () => scene.scene.isActive(),
    getVictoryPending: () => scene.runScore.victoryPending,
    getCurrentBiomeId: () => scene.getCurrentBiomeId(),
    getTutorialSystem: () => scene.tutorialSystem,
    getBanter: () => scene.banter,
    getSFXManager: () => scene.getSFXManager(),
    addCoinGold: (amount) => { scene.runScore.addCoinGold(amount); },
    caption: (id, msg, tint, dur) => scene.caption(id, msg, tint, dur),
    getWeaponSystem: () => scene.weaponSystem,
    getTimeManager: () => scene.timeManager,
    getRunStatsTracker: () => scene.runStatsTracker,
    getLevelUpFlow: () => scene.levelUpFlow,
    getSaveManager: () => scene.metaSaveManager,
    getActiveVariant: () => scene.activeVariant,
    getRunScore: () => scene.runScore,
    getRunActState: () => scene.runActState,
    getActiveCurseKey: () => scene.activeCurseKey,
    isIronmoorRun: () => scene.activeIronmoorRun,
    getTempBuffBag: () => scene.tempBuffBag,
    getRevivalAvailable: () => scene.revivalAvailable,
    getOwnedPassives: () => scene.ownedPassives,
    getEvolvedWeapons: () => scene.evolvedWeapons,
    getHeldRelicKeysForPersistence: () => scene.relicSystem?.heldKeys() ?? [],
    getOwnedRuneIdsForPersistence: () => scene.ownedRuneIds,
    setRevivalAvailable: (v) => { scene.revivalAvailable = v; },
    setOwnedPassives: (p) => { scene.ownedPassives = p; },
    setEvolvedWeapons: (e) => { scene.evolvedWeapons = e; },
    restoreHeldRelics: (keys) => scene.relicOrchestrator.restoreHeld(keys),
    restoreOwnedRunes: (ids) => { for (const id of ids) scene.grantRune(id); },
    suppressNextNodeMapRoll: () => { scene.suppressNextNodeMapRoll = true; },
    updateBossBar: (data) => scene.hud.updateBossBar(data),
    spawnRelicAt: (key, x, y) => scene.relicOrchestrator.debugSpawnAt(key, x, y),
    getHeldRelicKeysForDebug: () => scene.relicSystem?.heldKeys() ?? [],
    getCairnStacking: () => scene.cairnStacking,
    getRelicCatalogue: () => RELICS,
    openRelicDiscardPromptForAudit: () => {
      if (scene.relicOrchestrator.isDiscardModalOpen()) return false;
      scene.relicOrchestrator.restoreHeld(['sporran_of_holding', 'oatcake_stash', 'grans_thimble']);
      scene.relicOrchestrator.openDiscardModal(RELICS.whisky_dram, 'bargain');
      return true;
    },
  };
}
