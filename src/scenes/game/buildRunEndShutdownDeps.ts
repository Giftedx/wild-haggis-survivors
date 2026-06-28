/**
 * buildRunEndShutdownDeps — assembles the deps bag passed to
 * {@link installRunEndShutdown} from `GameScene.registerShutdownCleanup()`.
 *
 * Why extract: the inline bag was ~64 LOC of value snapshots + setters —
 * the last large argument literal left in GameScene after the create()
 * facade decomposition. Pulling it into a sibling builder shrinks the
 * scene class without changing behaviour: the builder is invoked at the
 * same point `registerShutdownCleanup` ran the inline literal (early in
 * `create()`, right after the TimeManager), so the by-value snapshots
 * (`juice`, `hud`, `weaponSystem`, …) capture the exact same values they
 * did before — most still `undefined` at that point, as the original
 * inline bag also captured. The setters mutate the live scene either way.
 *
 * Why type-couple to GameScene (precedent: `buildCombatCollisionHooks`):
 * the bag reads + writes many scene fields outside any sub-system's
 * public surface. A type-only `import type { GameScene }` keeps the
 * wiring honest without a runtime import cycle.
 */
import type { GameScene } from '../GameScene';
import type { RunEndShutdownDeps } from './runEndShutdown';
import { disposeRecordingAudioStream } from '@/systems/audioContext';
import { uninstallAutoBattleTimeScale } from '../../dev/AutoBattler';
import { sfxManager } from '../../systems/audio/SFXManager';
import { audio } from '../../systems/AudioSystem';

/**
 * Build the {@link RunEndShutdownDeps} bag for the given scene.
 *
 * Fresh object — no caching. Built once per `registerShutdownCleanup()`
 * alongside the `installRunEndShutdown(...)` call.
 */
export function buildRunEndShutdownDeps(scene: GameScene): RunEndShutdownDeps {
  return {
    scene,
    clipRecorder: scene.clipRecorder,
    setClipRecorder: (next) => { scene.clipRecorder = next; },
    disposeRecordingAudioStream,
    uninstallAutoBattleTimeScale,
    gameplaySessionGuard: scene.gameplaySessionGuard,
    playerEnemyCollider: scene.playerEnemyCollider,
    setPlayerEnemyCollider: (next) => { scene.playerEnemyCollider = next; },
    clearSfx: () => sfxManager.clear(),
    resetAudioTransient: () => audio.resetTransient(),
    eventBusDispose: scene.eventBusDispose,
    setEventBusDispose: (next) => { scene.eventBusDispose = next; },
    nicnevinWildHunt: scene.nicnevinWildHunt,
    setNicnevinWildHunt: (next) => { scene.nicnevinWildHunt = next; },
    runPersistence: scene.runPersistence,
    debugTimeTravelApi: scene.debugTimeTravelApi,
    subs: scene.subs,
    debugOverlay: scene.debugOverlay,
    setDebugOverlay: (next) => { scene.debugOverlay = next; },
    runLifecycle: scene.runLifecycle,
    biomeController: scene.biomeController,
    setBiomeController: (next) => { scene.biomeController = next; },
    setHaarFog: (next) => { scene.haarFog = next; },
    floraScatter: scene.floraScatter,
    setFloraScatter: (next) => { scene.floraScatter = next; },
    wildlifeSystem: scene.wildlifeSystem,
    setWildlifeSystem: (next) => { scene.wildlifeSystem = next; },
    mistLayer: scene.mistLayer,
    setMistLayer: (next) => { scene.mistLayer = next; },
    captionOverlay: scene.captionOverlay,
    setCaptionOverlay: (next) => { scene.captionOverlay = next; },
    captionManager: scene.captionManager,
    setCaptionManager: (next) => { scene.captionManager = next; },
    weaponSystem: scene.weaponSystem,
    xpSystem: scene.xpSystem,
    updateTickers: scene.updateTickers,
    timeManager: scene.timeManager,
    spawnSystem: scene.spawnSystem,
    tutorialSystem: scene.tutorialSystem,
    statusFxPool: scene.statusFxPool,
    floatTextPool: scene.floatTextPool,
    juice: scene.juice,
    hud: scene.hud,
    minimap: scene.minimap,
    nodeMapUI: scene.nodeMapUI,
    setNodeMapUI: (next) => { scene.nodeMapUI = next; },
    nodePromptUI: scene.nodePromptUI,
    setNodePromptUI: (next) => { scene.nodePromptUI = next; },
    setInteractivePromptIndex: (next) => { scene.interactivePromptIndex = next; },
    nodeMapSystem: scene.nodeMapSystem,
    nodeWaveTracker: scene.nodeWaveTracker,
    edgeIndicators: scene.edgeIndicators,
    upgradeUI: scene.upgradeUI,
    gameTickers: scene.gameTickers,
    pauseMenu: scene.pauseMenu,
    setPauseMenu: (next) => { scene.pauseMenu = next; },
    chestRegistry: scene.chestRegistry,
    victoryFade: scene.victoryFade,
    setVictoryFade: (next) => { scene.victoryFade = next; },
    deathFade: scene.deathFade,
    setDeathFade: (next) => { scene.deathFade = next; },
    filmGrain: scene.filmGrain,
    setFilmGrain: (next) => { scene.filmGrain = next; },
  };
}
