/**
 * installUiLandmarksAndFlow — `GameScene.create()` phase 4 (final).
 *
 * The run's UI + landmark + flow tail: run-bookkeeping + run-end
 * composers, resume hydration, the upgrade-card UI, combat collisions,
 * HUD + Juice + Banter, the run-start ceremony, runtime ambient
 * (weather/hazards/tickers/pickups), companion + cairn + Cailleach
 * Gauntlet + Corryvreckan + variant-companion + Lemmings installs, the
 * LevelUpFlow + RunLifecycle, the run-identity / shared-run toasts, the
 * intro toasts, and the post-flow startup-HUD chain — in the exact order
 * the inline block used.
 *
 * Why extract: this was the last ~215-LOC stretch of `create()`. Pulling
 * it into an ordered phase installer leaves `create()` a legible list of
 * phase calls and completes the god-object decomposition. Behaviour is
 * identical: same call order, same field writes, same delayed-call
 * scheduling.
 *
 * Why type-couple to GameScene (precedent: `buildCombatCollisionHooks`):
 * the phase reads + writes many scene fields outside any sub-system's
 * public surface. A type-only `import type { GameScene }` keeps the
 * wiring honest without a runtime import cycle.
 */
import type { GameScene } from '../GameScene';
import type { VariantDef } from '../../data/variants';
import type { IRunState } from '../../core/SaveManager';
import type { FallenCairn } from '../../utils/save/fallenCairns';
import { t } from '../../core/i18n';
import { audio } from '../../systems/AudioSystem';
import { getSettingsManager } from '../../core/SettingsManager';
import { bumpBanterHeard } from '../../utils/save';
import { HUD } from '../../ui/HUD';
import { JuiceSystem } from '../../systems/JuiceSystem';
import { BanterSystem } from '../../systems/BanterSystem';
import { UpgradeCardsUI } from '../../ui/UpgradeCards';
import { installRunBookkeeping } from './installRunBookkeeping';
import { buildRunBookkeepingHooks } from './buildRunBookkeepingHooks';
import { installRunEndComposers } from './installRunEndComposers';
import { buildRunEndComposerHooks } from './buildRunEndComposerHooks';
import { installCombatCollisions } from './installCombatCollisions';
import { buildCombatCollisionHooks } from './buildCombatCollisionHooks';
import { installRunStartCeremony } from './runStartCeremony';
import { installRuntimeAmbient } from './installRuntimeAmbient';
import { buildRuntimeAmbientHooks } from './buildRuntimeAmbientHooks';
import { installCompanionSystem } from './installCompanionSystem';
import { installCairnSystems } from './installCairnSystems';
import { buildCairnSystemHooks } from './buildCairnSystemHooks';
import { installCailleachGauntlet } from './installCailleachGauntlet';
import { installCorryVreckan } from './installCorryVreckan';
import { installVariantCompanions } from './installVariantCompanions';
import { installLemmingsEasterEgg } from './installLemmingsEasterEgg';
import { installRunFlow } from './installRunFlow';
import { buildRunFlowHooks } from './buildRunFlowHooks';
import {
  showRunIdentityToast as moorMomentsShowRunIdentityToast,
  trySpawnAncestralEcho as moorMomentsTrySpawnAncestralEcho,
} from './moorMoments';
import {
  formatSharedRunIdentityToast,
  SHARED_RUN_TOAST_COLOR,
} from './sharedRunIdentityToast';
import { showRunIntroToasts } from './runIntroToasts';
import { installRunStartupHud } from './installRunStartupHud';

/** The `create()` locals phase 4 consumes from earlier phases. */
export interface UiLandmarksAndFlowLocals {
  readonly resumeRun: IRunState | null;
  readonly selectedVariant: VariantDef;
  readonly spawnPx: number;
  readonly spawnPy: number;
}

/** Run `create()` phase 4: UI, landmarks, run flow, startup chain. */
export function installUiLandmarksAndFlow(
  scene: GameScene,
  { resumeRun, selectedVariant, spawnPx, spawnPy }: UiLandmarksAndFlowLocals,
): void {
  // Phase 5 Bucket 6 finish — four run-bookkeeping ctors bundled into
  // a single helper. MoorMomentScheduler must exist before resume
  // hydration (its pushAfterResume is called); RunPersistenceBridge
  // owns snapshot/hydrate; BossHpTracker pushes HUD fraction; the
  // dev API wires globalThis.DEBUG + Shift+] (install() fires later
  // once `relicSystem` is built).
  ({
    moorMoments: scene.moorMoments,
    runPersistence: scene.runPersistence,
    bossHpTracker: scene.bossHpTracker,
    debugTimeTravelApi: scene.debugTimeTravelApi,
  } = installRunBookkeeping(buildRunBookkeepingHooks(scene)));

  // Phase 5 Bucket 6 partial — RunExitComposer + RunHistoryRecorder +
  // RunPersistenceCoordinator construction. De-duplicated hook bag
  // (~9 fields used to repeat across the three composers' ctors).
  ({
    runExit: scene.runExit,
    runHistoryRecorder: scene.runHistoryRecorder,
    runPersistenceCoordinator: scene.runPersistenceCoordinator,
  } = installRunEndComposers(buildRunEndComposerHooks(scene)));

  if (resumeRun) {
    scene.runPersistence.applyResume(resumeRun);
  }

  scene.upgradeUI = new UpgradeCardsUI(scene, (card) => scene.levelUpFlow.apply(card), scene.updateTickers);
  scene.upgradeUI.setRerollCallback(() => scene.levelUpFlow.reroll());
  scene.upgradeUI.setVariantKey(scene.activeVariant.key);

  ({ playerEnemyCollider: scene.playerEnemyCollider } = installCombatCollisions(
    buildCombatCollisionHooks(scene),
  ));

  // HUD + Juice
  scene.hud = new HUD(scene);
  scene.juice = new JuiceSystem(scene, scene.timeManager, scene.updateTickers, scene.settingsManager);
  // Banter sits downstream of juice (toast surface) + captions. It reads
  // banterFrequency live on every request so the Comfort panel toggle
  // takes effect without a scene restart. Reset history now so the
  // prior run's no-repeat buffer doesn't leak into this one.
  if (!scene.banter) {
    scene.banter = new BanterSystem({
      sink: {
        toast: (m, c) => scene.juice.showToast(m, c),
        caption: (id, m, tint) => scene.caption(id, m, tint),
      },
      translate: t,
      now: () => scene.time.now,
      getFrequency: () => getSettingsManager().load().banterFrequency,
      // C1 M4 Task 19 — route every fired line into the Almanac's
      // Banter book via the shared save bump helper.
      onLineFired: (evt) => bumpBanterHeard(evt.key, scene.discoveryRunId(), Date.now()),
    });
  }
  scene.banter.reset();
  // Curse pact — one hearth line after the HUD settles (soul weave: run start).
  if (scene.activeCurseKey) {
    const curseTag = scene.activeCurseKey;
    scene.time.delayedCall(1200, () => {
      scene.banter?.request('curse_start', { tag: curseTag });
      // Burns echo — "Nae man can tether time or tide" Tam-o'-Shanter
      // couplet on the cursed-run slow window. Scheduled past the
      // 8 s banter cooldown + a small grace so it lands on a quiet
      // tick after curse_start has flushed.
      scene.time.delayedCall(9_000, () => {
        scene.banter?.request('burns_citation', { tag: 'nae_haste' });
      });
    });
  }
  installRunStartCeremony({
    isReplayPlayback: !!scene.replayInput,
    isResume: !!resumeRun,
    activeCurseKey: scene.activeCurseKey,
    disableSeasonalEvents: scene.settingsManager.load().disableSeasonalEvents,
    now: new Date(),
    scheduleSceneDelay: (ms, cb) => { scene.time.delayedCall(ms, cb); },
    getBurnsPlatterSpawned: () => scene.burnsPlatterSpawned,
    setBurnsPlatterSpawned: () => { scene.burnsPlatterSpawned = true; },
    getPickupSpawner: () => scene.pickupSpawner ?? null,
    banter: scene.banter,
    audio,
  });
  scene.weather?.stop();
  scene.hazards?.stop();
  ({
    weather: scene.weather,
    hazards: scene.hazards,
    gameTickers: scene.gameTickers,
    pickupSpawner: scene.pickupSpawner,
  } = installRuntimeAmbient(buildRuntimeAmbientHooks(scene)));

  scene.companionSystem?.destroy();
  scene.companionSystem = installCompanionSystem({
    scene,
    getPlayer: () => scene.player,
    director: scene.livingWorldDirector,
    isReplayInput: !!scene.replayInput,
    scheduleDelay: (ms, cb) => { scene.time.delayedCall(ms, cb); },
    getCurrentSystem: () => scene.companionSystem,
  });

  const replayCairns =
    scene.pendingReplay
      ? ((scene.pendingReplay as { cairns?: FallenCairn[] }).cairns ?? [])
      : null;
  scene.firstCairnTouchedThisRun = true;
  scene.cairnSprites.clear();
  ({ cairnStacking: scene.cairnStacking,
    cairnOfEchoesScheduler: scene.cairnOfEchoesScheduler,
  } = installCairnSystems(buildCairnSystemHooks(scene, { resumeRun, replayCairns })));

  // V2 — Cailleach Gauntlet scheduler. Sister to cairn scheduler;
  // reads touched-this-run count from it, fires win/lose hooks at
  // resolution. Extracted to installCailleachGauntlet to keep
  // GameScene under the 2200-LOC ceiling. Teardown closes over the
  // candle sprites + boss ref the install owns.
  if (scene.gauntletTeardown) scene.gauntletTeardown();
  const gauntletInstall = installCailleachGauntlet({
    scene,
    getPlayer: () => scene.player ?? null,
    getSpawnSystem: () => scene.spawnSystem,
    getBanter: () => scene.banter ?? null,
    getCairnScheduler: () => scene.cairnOfEchoesScheduler,
    metaSaveManager: scene.metaSaveManager,
    caption: (id, message, color, durationMs) =>
      scene.caption(id, message, color, durationMs),
    showToast: (message, color) => scene.juice?.showToast(message, color),
  });
  scene.cailleachGauntletScheduler = gauntletInstall.scheduler;
  scene.gauntletTeardown = gauntletInstall.teardown;

  // DESIGN_IDEAS §3 — Corryvreckan encounter. Teardown (destroy visuals)
  // is called on each reset so graphics from a prior run don't leak.
  scene.corryVreckanInstall?.teardown();
  scene.corryVreckanInstall = installCorryVreckan({
    scene,
    getPlayer: () => scene.player ?? null,
    getSpawnSystem: () => scene.spawnSystem,
    getJuice: () => scene.juice,
    getBanter: () => scene.banter ?? null,
    getCurrentBiomeId: () => scene.getCurrentBiomeId(),
    getGameTimeSec: () => scene.spawnSystem?.getGameTimeSec() ?? 0,
    getRunRng: () => scene.runRng,
    onSurvived: () => scene.pickupSpawner.spawnGoldenChest(),
    onFailed: () => {
      const player = scene.player;
      if (!player?.active) return;
      const dmg = Math.floor(player.getMaxHp() * 0.35);
      player.takeDamage(dmg);
    },
  });

  scene.engineerTurretSprite?.destroy();
  scene.tuftedPupSprite?.destroy();
  ({
    engineerTurretSystem: scene.engineerTurretSystem,
    engineerTurretSprite: scene.engineerTurretSprite,
    tuftedFamiliarSystem: scene.tuftedFamiliarSystem,
    tuftedPupSprite: scene.tuftedPupSprite,
  } = installVariantCompanions({
    scene,
    hasEngineerTurret: !!selectedVariant.modifiers.engineerTurret,
    hasTuftedFamiliar: !!selectedVariant.modifiers.tuftedFamiliar,
    spawnPx,
    spawnPy,
    getIsVictoryPending: () => scene.runScore.victoryPending,
    getPlayerPosition: () => ({ x: scene.player.x, y: scene.player.y }),
    fireTurretShot: (fromX, fromY, damageMul) =>
      scene.weaponSystem.fireTurretShot(fromX, fromY, damageMul),
  }));

  scene.lemmingsEasterEgg = installLemmingsEasterEgg({
    scene,
    getPlayer: () => scene.player,
    getActiveVariantKey: () => scene.activeVariant.key,
    getCurrentBiomeId: () => scene.getCurrentBiomeId(),
    requestBanter: () => scene.requestBanter('lemmings_remember'),
    caption: (id, message, tint) => scene.caption(id, message, tint),
  });

  // Phase 5 Bucket 6 partial — LevelUpFlow + RunLifecycle ctors bundled.
  ({ levelUpFlow: scene.levelUpFlow, runLifecycle: scene.runLifecycle } =
    installRunFlow(buildRunFlowHooks(scene)));
  scene.juice.setResumeBestCombo(resumeRun?.bestCombo);
  scene.juice.setResumeComboState(resumeRun?.comboCount, resumeRun?.comboTimerMs);
  moorMomentsShowRunIdentityToast(scene.buildMoorMomentsContext(), Boolean(resumeRun));
  // W82 Shared-run banner — fired right after the identity toast so
  // the queue order is "Classic · The original" → "Shared run ·
  // Classic · Heavy Legs". `pendingSharedRunMeta` is consumed once
  // (nulled) so a hot replay through the same scene instance does
  // not re-fire the welcome.
  if (scene.pendingSharedRunMeta && !resumeRun) {
    scene.juice.showToast(
      formatSharedRunIdentityToast(scene.pendingSharedRunMeta),
      SHARED_RUN_TOAST_COLOR,
    );
  }
  scene.pendingSharedRunMeta = null;
  showRunIntroToasts({
    scene,
    replayInput: scene.replayInput,
    juice: scene.juice,
    hud: scene.hud,
    loadMetaSave: () => scene.metaSaveManager.load(),
    getJuice: () => scene.getJuice() ?? null,
  });

  // Phase 5 Bucket 11 — post-flow startup chain (HUD scaffolding,
  // debug surfaces, audio init, ceremony, countdown handshake).
  // Extracted to `installRunStartupHud` — see that helper for the
  // ordering contract.
  installRunStartupHud(scene, {
    resumeRun,
    initNodeMapForAct: (act, stretch) => scene.initNodeMapForAct(act, stretch),
    trySpawnAncestralEcho: () => { const echo = moorMomentsTrySpawnAncestralEcho(scene.buildMoorMomentsContext(), scene.ancestralEcho !== null); if (echo) scene.ancestralEcho = echo; },
    toggleUiPause: () => scene.toggleUiPause(),
  });
}
