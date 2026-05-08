/**
 * installRunStartupHud — bundles the contiguous tail of GameScene.create()
 * that wires HUD scaffolding, debug surfaces, audio init, the run-start
 * ceremony, and the countdown/finalize handshake. ~140 LOC of one-shot
 * installs that all fire AFTER core gameplay systems exist (combat,
 * runtime ambient, run-flow), and BEFORE the gameplay loop unblocks.
 *
 * Why type-couple to GameScene (precedent: `PauseMenu.ts`,
 * `buildRuneSystemControllerHooks.ts`): the block reads ~30 distinct
 * scene fields. Routing each through a hooks bag would re-create the
 * same wiring noise the extraction is meant to remove. Direct field
 * access via a type-only `import type { GameScene }` keeps the wiring
 * honest at compile time without an import cycle at runtime.
 *
 * Behavioral methods that mutate scene state (`initNodeMapForAct`,
 * `trySpawnAncestralEcho`, `toggleUiPause`) are passed as callbacks so
 * the helper does not need to know their internal signatures or pull
 * private members beyond the field-read surface.
 *
 * Order is preserved one-for-one with the prior inline body. Side-effect
 * sensitivity:
 *   - `eventBusDispose` is invoked first so a recycled scene instance
 *     drops the prior run's subscriptions before re-registering.
 *   - `installNodeMapDispatch` writes `nodeMapUI` / `nodePromptUI` via
 *     setter callbacks that flow through to the scene's fields.
 *   - The countdown TimeManager token is acquired BEFORE FTUE so the
 *     gameplay loop stays paused until showCountdown's onComplete fires.
 *   - `finalizeResumeStartup` runs LAST so the suspended snapshot is
 *     replaced only after every prior install would have failed audibly.
 */
import type { GameScene } from '../GameScene';
import type { IRunState } from '../../core/SaveManager';
import type { Act3Stretch } from '../../data/nodeBanks';
import { wireSceneEventBus } from './wireSceneEventBus';
import { EdgeIndicators } from '../../ui/EdgeIndicators';
import { Minimap } from '../../ui/Minimap';
import { installNodeMapDispatch } from './installNodeMapDispatch';
import { resolveResumeNodeMapTarget } from './resumeNodeMapTarget';
import { RelicSlotUI } from '../../ui/RelicSlotUI';
import { DebugOverlay } from '../../ui/DebugOverlay';
import { TutorialSystem } from '../../systems/TutorialSystem';
import { getAnalyticsManager } from '../../core/AnalyticsManager';
import { audio } from '../../systems/AudioSystem';
import { musicEngine } from '../../systems/music/ProceduralMusicEngine';
import { applyAudioFromUserSettings } from '../../core/applyAudioFromSettings';
import { getSettingsManager } from '../../core/SettingsManager';
import { installTreasureChestTimer } from './installTreasureChestTimer';
import { createCaptureHandlers } from './captureHandlers';
import { wireSceneKeybindings } from './wireSceneKeybindings';
import { installRunIntroFx } from './installRunIntroFx';
import { FilmGrainOverlay } from './FilmGrainOverlay';
import { installClipRecorder } from './installClipRecorder';
import { showCountdown } from './CountdownOverlay';
import { wireMantleTier } from './wireMantleTier';
import { finalizeResumeStartup } from '../../core/GameSessionLifecycle';

export interface InstallRunStartupHudOpts {
  /** The hydrated active-run snapshot, or null on a fresh run. Drives
   *  resume gating for ancestral echo + countdown FTUE re-arm + persist. */
  resumeRun: IRunState | null;
  /** Behavioural delegators that touch scene-private surfaces. */
  initNodeMapForAct(act: 1 | 2 | 3, stretch?: Act3Stretch): void;
  trySpawnAncestralEcho(): void;
  toggleUiPause(): void;
}

/**
 * Run the post-flow startup chain on `scene`. Idempotent across scene
 * reuse — every install is structured to clear/destroy a prior instance
 * before re-creating, matching the original inline ordering.
 */
export function installRunStartupHud(
  scene: GameScene,
  opts: InstallRunStartupHudOpts,
): void {
  const { resumeRun } = opts;

  scene.eventBusDispose?.();
  scene.eventBusDispose = wireSceneEventBus({
    getJuice: () => scene.juice,
    caption: (id, msg, tint, dur) => scene.caption(id, msg, tint, dur),
  });
  scene.edgeIndicators = new EdgeIndicators(scene);
  scene.minimap = new Minimap(scene);
  // Phase B Biomes — paint biome regions on the minimap.
  scene.minimap.setBiomeManager(scene.getBiomeManager());
  // T401 slice 7 — node-map lifecycle install (UIs + trigger listener).
  // Phase 5 Bucket 6 partial — onNodeTrigger callback hoisted to the
  // helper so the dispatch context bag lives in one place.
  installNodeMapDispatch({
    scene,
    nodeMapSystem: scene.nodeMapSystem,
    nodeWaveTracker: scene.nodeWaveTracker,
    setNodeMapUI: (ui) => { scene.nodeMapUI = ui; },
    setNodePromptUI: (ui) => { scene.nodePromptUI = ui; },
    getPlayer: () => scene.player,
    getRunRng: () => scene.runRng,
    getRunScore: () => scene.runScore,
    getRunModifiers: () => scene.runModifiers,
    getTempBuffBag: () => scene.tempBuffBag,
    getOwnedPassives: () => scene.ownedPassives,
    getSpawnSystem: () => scene.spawnSystem,
    getRelicSystem: () => scene.relicSystem,
    getRelicPickupSpawner: () => scene.relicPickupSpawner,
    getWeaponSystem: () => scene.weaponSystem,
    getXPSystem: () => scene.xpSystem,
    getUpgradeUI: () => scene.upgradeUI,
    getLevelUpFlow: () => scene.levelUpFlow,
    getJuice: () => scene.juice,
    getTimeManager: () => scene.timeManager,
    getNodePromptUI: () => scene.nodePromptUI,
    getReplayInput: () => scene.replayInput,
    getReplayRecorder: () => scene.replayRecorder,
    getRunActState: () => scene.runActState,
    getInteractivePromptIndex: () => scene.interactivePromptIndex,
    setInteractivePromptIndex: (n) => { scene.interactivePromptIndex = n; },
  });
  const resumeNodeTarget = resolveResumeNodeMapTarget(
    scene.runActState.currentAct,
    scene.spawnSystem.getSpawnedBossKeys(),
  );
  opts.initNodeMapForAct(resumeNodeTarget.act, resumeNodeTarget.stretch);
  scene.relicSlotUI?.destroy();
  scene.relicSlotUI = new RelicSlotUI(scene, {
    getHeldSlots: () => scene.relicSystem.getSlots().map((s) => s.def),
  });
  scene.hud.setOnPause(() => opts.toggleUiPause());

  scene.debugOverlay = new DebugOverlay(scene, {
    spawnSystem: scene.spawnSystem,
    weaponSystem: scene.weaponSystem,
    timeManager: scene.timeManager,
    xpSystem: scene.xpSystem,
    statusFxPool: scene.getStatusFxPool(),
    musicEngine,
  });

  scene.tutorialSystem = new TutorialSystem(scene, scene.metaSaveManager);
  // FTUE start is deferred to the countdown's onComplete (see showCountdown
  // call below) — fixes P1.10: depth-1000 countdown text was rendering on
  // top of the depth-600 FTUE banner, hiding the tutorial copy on first run.

  scene.debugTimeTravelApi.install();
  scene.runPersistence.registerMidRunHooks();

  getAnalyticsManager().beginGameplaySession({
    variantKey: scene.activeVariant.key,
    ironmoor: scene.activeIronmoorRun,
    curseKey: scene.activeCurseKey,
    isDaily: scene.runIsDaily,
  });
  scene.gameplaySessionGuard.markStarted();

  const prefs = scene.settingsManager.load();
  applyAudioFromUserSettings(prefs);
  audio.fadeOutAmbientWind(800);
  if (prefs.musicVolume > 0.001) {
    musicEngine.start();
  }

  // Treasure chest timer — 45s interval; 20% golden; queued while paused.
  scene.pendingChests = [];
  installTreasureChestTimer(scene.updateTickers, {
    getRunRng: () => scene.runRng,
    getTimeManager: () => scene.timeManager,
    getPickupSpawner: () => scene.pickupSpawner,
    enqueuePendingChest: (chest) => { scene.pendingChests.push(chest); },
  });

  const captureHandlers = createCaptureHandlers({
    getCanvas: () => scene.game.canvas,
    getClipRecorder: () => scene.clipRecorder,
    getJuice: () => scene.getJuice(),
    getRunContextForCapture: () => scene.getRunContextForCapture(),
  });
  wireSceneKeybindings(scene.input.keyboard, scene.subs, {
    togglePause: () => opts.toggleUiPause(),
    getDebugOverlay: () => scene.debugOverlay,
    saveClipF9: captureHandlers.handleF9SaveClip,
    saveScreenshotF10: captureHandlers.handleF10Screenshot,
  });

  // Run-intro ceremony — fade in from black + controls hint auto-hide.
  installRunIntroFx(scene, scene.updateTickers, () => scene.getUiViewport());

  // Ancestral Echo — if last run died recently, spawn a spectral
  // haggis at the death spot. Skipped on resume so the echo only
  // marks the NEXT fresh run after a death.
  if (!resumeRun) {
    opts.trySpawnAncestralEcho();
  }

  scene.filmGrain?.destroy();
  scene.filmGrain = new FilmGrainOverlay(scene, scene.settingsManager, () => scene.getUiViewport());
  scene.filmGrain.install();
  scene.filmGrain.bindViewportResize();

  scene.clipRecorder = installClipRecorder({
    enabled: getSettingsManager().load().captureEnabled,
    canvas: scene.game.canvas ?? null,
  });

  // Start countdown — game is paused until it finishes. FTUE banner waits
  // for countdown to clear so the depth-1000 countdown text doesn't sit on
  // top of the depth-600 FTUE overlay (P1.10).
  scene.timeManager.request('COUNTDOWN', { pausePhysics: true, timeScale: 0 });
  const startFtue = () => scene.tutorialSystem.startRunIfNeeded({ resumeRun: Boolean(resumeRun) });
  showCountdown(scene, scene.timeManager, scene.updateTickers, () => scene.getUiViewport(), startFtue);

  // Wire kill count → mantle tier. Pre-seeds from current killCount so
  // replays and save-mid-run starts at the correct tier without a tween.
  wireMantleTier({
    player: scene.player,
    runScore: scene.runScore,
    settingsManager: scene.settingsManager,
  });

  // Resume is now "committed": replace old suspended snapshot with a fresh one.
  finalizeResumeStartup(resumeRun, () => scene.runPersistence.persist());
}
