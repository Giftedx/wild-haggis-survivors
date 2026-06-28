/**
 * buildRunFlowHooks — assembles the opts bag passed to
 * {@link installRunFlow} (LevelUpFlow + RunLifecycle ctors) from
 * `GameScene.create()`.
 *
 * Why extract: the inline bag was ~76 LOC — the second-largest argument
 * literal in `create()`. Pulling it into a sibling builder shrinks the
 * scene class toward the facade target without changing behaviour: the
 * bag is built at the same point in `create()` and every getter reads
 * the same live field.
 *
 * Why type-couple to GameScene (precedent: `buildCombatCollisionHooks`):
 * the bag reads many scene fields + private methods (runExit,
 * runHistoryRecorder, runPersistenceCoordinator, relicOrchestrator,
 * grantRune, discoveryRunId, launchActIntermission) outside any
 * sub-system's public surface. A type-only `import type { GameScene }`
 * keeps the wiring honest without a runtime import cycle.
 */
import type { GameScene } from '../GameScene';
import type { InstallRunFlowOpts } from './installRunFlow';
import type { InheritedStatKey } from '../../utils/save/fallenCairns';

/**
 * Build the {@link InstallRunFlowOpts} bag for the given scene.
 *
 * Fresh object — no caching. Built once per `create()` alongside the
 * `installRunFlow(...)` call.
 */
export function buildRunFlowHooks(scene: GameScene): InstallRunFlowOpts {
  return {
    scene,
    getPlayer: () => scene.player,
    getXPSystem: () => scene.xpSystem,
    getSpawnSystem: () => scene.spawnSystem,
    getJuice: () => scene.juice,
    getTimeManager: () => scene.timeManager,
    getUiViewport: () => scene.getUiViewport(),
    armIFrames: (ms) => scene.armIFrames(ms),
    caption: (id, msg, tint, dur) => scene.caption(id, msg, tint, dur),
    getWeaponSystem: () => scene.weaponSystem,
    getStatusFxPool: () => scene.statusFxPool,
    getTutorialSystem: () => scene.tutorialSystem,
    getUpgradeUI: () => scene.upgradeUI,
    getRunRng: () => scene.runRng,
    getOwnedPassives: () => scene.ownedPassives,
    pushOwnedPassive: (key) => { scene.ownedPassives.push(key); },
    getEvolvedWeapons: () => scene.evolvedWeapons,
    pushEvolvedWeapon: (key) => { scene.evolvedWeapons.push(key); },
    getAnnouncedEvolutionReady: () => scene.announcedEvolutionReady,
    addKill: (n = 1) => {
      // W71 Phase 2 — loop through incrementKillCount so onKillsChanged
      // fires for each tallied kill. Direct `killCount += n` would bypass
      // the notifier and leave the mantle-tier wiring stale after
      // level-up cards like "destroy N nearest enemies."
      for (let i = 0; i < n; i++) scene.runScore.incrementKillCount();
    },
    drainPendingChests: () => scene.drainPendingChests(),
    requestBanter: (ctx, tag) => scene.requestBanter(ctx, tag),
    getDiscoveryRunId: () => scene.discoveryRunId(),
    tryChestLegendaryRelicOverride: () => scene.relicOrchestrator.tryChestOverride(),
    getRelicLuckPoints: () => scene.relicEffectDriver?.luckDrawPoints() ?? 0,
    isBossKilledThisRun: () => scene.runScore.bossKillCount > 0,
    getOwnedRuneIds: () => scene.ownedRuneIds,
    grantRune: (runeId) => scene.grantRune(runeId),
    isPostBell: () => scene.runLifecycle?.isPostBell() ?? false,
    getOverchargedWeaponKeys: () => scene.weaponSystem.getOverchargedKeys(),
    getSaveManager: () => scene.metaSaveManager,
    getDeathCauseTracker: () => scene.deathCauseTracker,
    getBanter: () => scene.banter,
    getGrudgeLedger: () => scene.grudgeLedger,
    getSettingsManager: () => scene.settingsManager,
    getCamera: () => scene.cameras.main,
    getVictoryPending: () => scene.runScore.victoryPending,
    setVictoryPending: (v) => { scene.runScore.victoryPending = v; },
    invalidatePendingVictoryTicker: () => { scene.runScore.nextVictoryDelayGen(); },
    getRevivalAvailable: () => scene.revivalAvailable,
    setRevivalAvailable: (v) => { scene.revivalAvailable = v; },
    getVictoryFade: () => scene.victoryFade,
    setVictoryFade: (r) => { scene.victoryFade = r; },
    getDeathFade: () => scene.deathFade,
    setDeathFade: (r) => { scene.deathFade = r; },
    setVictoryResultTicker: (ms, cb) => scene.runEndTickers.armVictoryResultOverlay(ms, cb),
    setDeathResultTicker: (ms, cb) => scene.runEndTickers.armDeathResultOverlay(ms, cb),
    setVictoryDeferMs: (ms) => scene.runEndTickers.armVictoryDefer(ms, () => scene.runLifecycle.handleVictory()),
    buildRunSummary: (victory) => scene.runExit.buildSummary(victory),
    buildRunHistoryContext: () => scene.runHistoryRecorder.buildContext(),
    buildGameOverPayload: (mode, s, r, pb, dc) => scene.runExit.buildGameOverPayload(mode, s, r, pb, dc),
    // T307 + T1 replay — replay-aware wrappers live on
    // `runPersistenceCoordinator`. During playback both calls no-op
    // (recordToHistory) or return a no-pollution RunResult (recordRun)
    // so a replay run can't double-count Chronicle attempts or write
    // duplicate gold/variant unlocks.
    recordToHistory: (s, r) => scene.runPersistenceCoordinator.recordToHistory(s, r),
    recordRun: (s, ctx) => scene.runPersistenceCoordinator.recordRun(s, ctx),
    transitionToGameOver: (payload) => scene.runExit.transitionToGameOver(payload),
    onActComplete: (actN) => scene.launchActIntermission(actN),
    isIronmoorRun: () => scene.activeIronmoorRun,
    isDailyRun: () => scene.runIsDaily,
    // The Moor Remembers (spec 2026-05-22) — `getActiveVariantKey`
    // stamps the FallenCairn so future runs route to the variant-
    // specific past-self whisper; `pickInheritedStat` is the v1
    // safe-default heuristic (a richer signal can land in v2 without
    // re-touching the hook seam).
    getActiveVariantKey: () => scene.activeVariant?.key ?? 'classic',
    pickInheritedStat: (): InheritedStatKey => 'damage',
  };
}
