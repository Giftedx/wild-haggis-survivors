/**
 * buildRunEndComposerHooks — assembles the opts bag passed to
 * {@link installRunEndComposers} (RunExitComposer + RunHistoryRecorder +
 * RunPersistenceCoordinator ctors) from `GameScene.create()`.
 *
 * Why extract: the inline bag was ~49 LOC of getter wiring (run-identity
 * radiator, Wee Tales boss roster, replay-aware persistence gates).
 * Pulling it into a sibling builder shrinks the scene class without
 * changing behaviour.
 *
 * Why type-couple to GameScene (precedent: `buildCombatCollisionHooks`):
 * the bag reads scene fields (runActState, relicSystem, replayRecorder,
 * hazardZones, biomeController, committedSporranIds, activeSharedRun)
 * outside any sub-system's public surface. A type-only
 * `import type { GameScene }` keeps the wiring honest without a runtime
 * import cycle.
 */
import type { GameScene } from '../GameScene';
import type { InstallRunEndComposersOpts } from './installRunEndComposers';
import { resolveRouteLabels, resolveRelicLabels, resolveRuneLabels } from './runIdentityLabels';
import { recordRun, loadSave } from '../../utils/save';

/**
 * Build the {@link InstallRunEndComposersOpts} bag for the given scene.
 *
 * Fresh object — no caching. Built once per `create()` alongside the
 * `installRunEndComposers(...)` call.
 */
export function buildRunEndComposerHooks(scene: GameScene): InstallRunEndComposersOpts {
  return {
    getWeaponSystem: () => scene.weaponSystem,
    getSpawnSystem: () => scene.spawnSystem,
    getJuice: () => scene.juice,
    getXPSystem: () => scene.xpSystem,
    getRunStatsTracker: () => scene.runStatsTracker,
    getSaveManager: () => scene.metaSaveManager,
    getActiveVariant: () => scene.activeVariant,
    getActiveCurseKey: () => scene.activeCurseKey,
    getRunRng: () => scene.runRng,
    getRunModifiers: () => scene.runModifiers,
    getRunScore: () => scene.runScore,
    getRunName: () => scene.runName,
    isDailyRun: () => scene.runIsDaily,
    isIronmoorRun: () => scene.activeIronmoorRun,
    getSecondsPastBell: () => scene.runLifecycle?.getSecondsPastBell() ?? 0,
    getOwnedPassivesLength: () => scene.ownedPassives.length,
    getEvolvedWeaponsLength: () => scene.evolvedWeapons.length,
    stopGameScene: () => scene.scene.stop('Game'),
    startGameOverScene: (payload) => scene.scene.start('GameOver', payload),
    // H1 T9 — post-run lands in CroftScene (hub) rather than MainMenu.
    // Hook name retained until a broader rename sweep (scope: future polish).
    startMainMenuScene: () => scene.scene.start('Croft'),
    unregisterRunAutoSave: () => scene.runPersistence?.unregisterMidRunHooks(),
    // T402 — Game Over run-identity radiator (parity with pause panel).
    getCurrentAct: () => scene.runActState.currentAct,
    getRouteLabels: () => resolveRouteLabels(scene.runActState.pickerHistory),
    getRelicLabels: () => resolveRelicLabels(scene.relicSystem ?? null),
    getRuneLabels: () => resolveRuneLabels(scene.ownedRuneIds),
    // Wee Tales — surface the per-run boss-kill roster to the run
    // exit composer; `getBiomesVisited` (further below) already
    // feeds both history + exit composers via the install hook.
    getBossKilledKeys: () => scene.bossKilledKeys,
    getBossKillCount: () => scene.runScore.bossKillCount,
    getRoutePicks: () => scene.runActState.pickerHistory,
    getHeldRelicKeys: () => scene.relicSystem?.heldKeys() ?? [],
    getReplayBlob: () => scene.replayRecorder?.finalize() ?? null,
    getEnteredHealingCircle: () => scene.hazardZones?.didEnterHealingCircle() ?? false,
    getBiomesVisited: () => scene.biomeController?.getBiomesVisited() ?? [],
    getEvolvedWeaponCount: () => scene.weaponSystem?.getEvolvedWeaponCount() ?? 0,
    areSeasonalEventsDisabled: () => scene.settingsManager.load().disableSeasonalEvents,
    getSporranPicks: () => scene.committedSporranIds,
    getActiveSharedRunSetup: () => scene.activeSharedRun,
    // T401 P3 — replay-aware persistence; reads `scene.replayInput` at
    // call time so the gate stays correct across create()'s lifecycle.
    isReplayPlayback: () => scene.replayInput !== null,
    recordRun,
    loadSave,
  };
}
