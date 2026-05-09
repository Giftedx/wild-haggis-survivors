/**
 * runFrameTick — single-call orchestration for `GameScene.updateInner`.
 *
 * Why extract: after the prior `tickFrameHeader` / `tickFrameWorld` /
 * `tickPresentationFrame` / `updateRunHudFrame` extracts, `updateInner`
 * was ~120 LOC of glue: four big dep-bag literals dispatched to four
 * helpers, with a discriminated `headerResult` controlling early returns.
 * The bags repeated the same scene-field references over and over — pure
 * wiring with zero ordering choices left.
 *
 * This helper consolidates the four bag-builds into one. Caller's
 * `updateInner` becomes a single `runFrameTick(this, delta)` call.
 *
 * Why type-couple to GameScene (precedent: `buildPauseMenuHooks`,
 * `buildRuneSystemControllerHooks`): the orchestrator reads dozens of
 * scene fields. Routing each through a generic dep interface would
 * re-create the same wiring here. Direct field access via a type-only
 * `import type { GameScene }` keeps the wiring honest at compile time
 * without an import cycle at runtime.
 *
 * Determinism contract: dispatch order is preserved one-for-one from
 * the pre-extraction body — header → world → presentation → HUD. The
 * `headerResult` discriminator continues to gate the early returns:
 * `replay-exhausted` starts the Chronicle, `paused` returns silently.
 *
 * The `recordReplayFrame` call in `update()` is NOT moved here — it sits
 * outside `updateInner` in a try/finally so it runs regardless of
 * pause/exhaustion.
 */
import { GAME } from '../../config';
import { tickFrameHeader } from './tickFrameHeader';
import { tickFrameWorld } from './tickFrameWorld';
import { tickPresentationFrame } from './runtimeTickHooks';
import { updateRunHudFrame } from './updateRunHudFrame';
import { tickStressTest } from '../../dev/StressTest';
import { isBreathReady, STACKS_MAX as WHISKY_STACKS_MAX } from '../../entities/whiskyBreath';
import { t } from '../../core/i18n';
import type { GameScene } from '../GameScene';

/**
 * Run one frame's worth of GameScene updates, dispatching to the four
 * extracted hook helpers.
 *
 * @param scene  the live GameScene instance
 * @param delta  raw wall-clock delta from `update(time, delta)`, already
 *               capped to 100ms by the caller
 */
export function runFrameTick(scene: GameScene, delta: number): void {
  const headerResult = tickFrameHeader({
    getReplayInput: () => scene.replayInput,
    getPlayer: () => scene.player,
    timeManager: scene.timeManager,
    updateTickers: scene.updateTickers,
    getDebugOverlay: () => scene.debugOverlay,
    getCaptionOverlay: () => scene.captionOverlay,
    iFrameController: scene.iFrameController,
    runEndTickers: scene.runEndTickers,
    tempBuffBag: scene.tempBuffBag,
    getRuneSystemController: () => scene.runeSystemController,
    nodeWaveTracker: scene.nodeWaveTracker,
    getXPSystem: () => scene.xpSystem,
    getSpawnSystem: () => scene.spawnSystem,
    togglePause: () => scene.toggleUiPause(),
    runStressTest: () => tickStressTest(scene),
  }, delta);
  if (headerResult.kind === 'replay-exhausted') {
    scene.scene.start('Chronicle');
    return;
  }
  if (headerResult.kind === 'paused') return;
  const { scaledDelta } = headerResult;

  tickFrameWorld({
    deathCauseTracker: scene.deathCauseTracker,
    hazardZones: scene.hazardZones,
    getHaarFog: () => scene.haarFog,
    getBiomeController: () => scene.biomeController,
    getRunLifecycle: () => scene.runLifecycle ?? null,
    getFloraScatter: () => scene.floraScatter,
    getWildlifeSystem: () => scene.wildlifeSystem,
    getMistLayer: () => scene.mistLayer,
    gameTickers: scene.gameTickers,
    getWeather: () => scene.weather,
    getHazards: () => scene.hazards,
    player: scene.player,
    juice: scene.juice,
    spawnSystem: scene.spawnSystem,
    nodeMapSystem: scene.nodeMapSystem,
    nodeMarkerSystem: scene.nodeMarkerSystem,
    getNodeMapUI: () => scene.nodeMapUI,
    runActState: scene.runActState,
    getStandingStones: () => scene.standingStones,
    getReliquary: () => scene.reliquary,
    getClootieTree: () => scene.clootieTree,
    getLemmingsEasterEgg: () => scene.lemmingsEasterEgg,
    getAncestralEcho: () => scene.ancestralEcho,
    setAncestralEcho: (v) => { scene.ancestralEcho = v; },
    getRelicSlotUI: () => scene.relicSlotUI,
    getRelicEffectDriver: () => scene.relicEffectDriver,
    relicOrchestrator: scene.relicOrchestrator,
    weaponSystem: scene.weaponSystem,
    xpSystem: scene.xpSystem,
    getNicnevinWildHunt: () => scene.nicnevinWildHunt,
    getRuneBag: () => scene.runeBag,
    getBurnsPlatterPickedUpAtMs: () => scene.burnsPlatterPickedUpAtMs,
    getMinimap: () => scene.minimap,
    getRunRng: () => scene.runRng,
    getBiomeManager: () => scene.getBiomeManager(),
    getTimeNowMs: () => scene.time.now,
    getMainCamera: () => scene.cameras.main,
    getSecondTickContext: () => scene.buildSecondTickHookContext(),
    getPostBellLastReseedSec: () => scene.postBellLastReseedSec,
    setPostBellLastReseedSec: (v) => { scene.postBellLastReseedSec = v; },
    getLastEmittedRunSecond: () => scene.lastEmittedRunSecond,
    setLastEmittedRunSecond: (v) => { scene.lastEmittedRunSecond = v; },
    reseedBiome: () =>
      scene.biomeController?.reseed(scene, scene.getRunRng(), GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT),
  }, delta, scaledDelta);

  tickPresentationFrame({
    delta,
    player: scene.player,
    spawnSystem: scene.spawnSystem,
    juice: scene.juice,
    bossHpTracker: scene.bossHpTracker,
    edgeIndicators: scene.edgeIndicators,
    minimap: scene.minimap,
    chestRegistry: scene.chestRegistry,
    gameTickers: scene.gameTickers,
    musicStateScratch: scene.musicStateScratch,
    biomeId: scene.getCurrentBiomeId(),
    killCount: scene.runScore.killCount,
    weaponAndPassiveCount: scene.weaponSystem.getWeapons().length + scene.ownedPassives.length,
    relicEffectDriver: scene.relicEffectDriver,
    relicPickupSpawner: scene.relicPickupSpawner,
    reliquaryMinimapMarker: scene.reliquary?.getMinimapMarker() ?? null,
  });

  updateRunHudFrame({
    delta,
    hud: scene.hud,
    player: scene.player,
    xpSystem: scene.xpSystem,
    spawnSystem: scene.spawnSystem,
    weaponRows: scene.hudWeaponScratch,
    weapons: scene.weaponSystem.getWeapons(),
    ownedPassives: scene.ownedPassives,
    killCount: scene.runScore.killCount,
    currentAct: scene.runActState.currentAct,
    ironmoor: scene.activeIronmoorRun,
    daily: scene.runIsDaily,
    seedCode: scene.getRunSeedCode(),
    goldBalance: scene.runScore.getGoldBalance(),
    activeCurseKey: scene.activeCurseKey,
    beforeUpdate: () => {
      // Drift Mastery pip widget — surface the banked Grip count +
      // flash the strip on burst-fire. Hidden until first bank so
      // the widget doesn't clutter the HUD before the mechanic's
      // been earned.
      const driftState = scene.player.getDriftMasteryState();
      scene.hud.setGripPips(driftState.pips, driftState.burstRemainingMs > 0);
      // Whisky Breath stack readout — bar fills with stacks; ready
      // state (>= BREATH_STACKS_REQUIRED) pulses the bar to signal
      // "press W".
      const whiskyState = scene.player.getWhiskyBreathState();
      scene.hud.setWhiskyStacks(
        whiskyState.stacks,
        WHISKY_STACKS_MAX,
        isBreathReady(whiskyState),
      );
      // Stance Toggle chip — shows the active posture (loose / braced
      // / reeling) once the player has cycled at least once. Localised
      // label; the HUD's prev-stance cache skips per-frame setText
      // when the posture isn't changing.
      const stance = scene.player.getStance();
      scene.hud.setStance(stance, t(`ui.hud.stance.${stance}`));
      // Shinty Parry chip — three discrete visual states (ready /
      // active / cooldown) wrapping `parryCooldownFraction`. Label
      // is localised; cooldown sweep is driven inside the HUD setter
      // by the same fraction read every frame.
      const parryActive = scene.player.isShintyParryActive();
      const parryReady = scene.player.isShintyParryReady();
      const parryFrac = scene.player.shintyParryCooldownFraction();
      const parryLabel = parryActive
        ? t('ui.hud.parry.active')
        : parryReady
          ? t('ui.hud.parry.ready')
          : t('ui.hud.parry.cooldown');
      scene.hud.setShintyParry(parryActive, parryReady, parryFrac, parryLabel);
      // Race the Beithir HUD bar — hidden when not stung; appears only
      // while a sting is running. The bar drains visually; cure/expire
      // collapse to hidden via the same boolean.
      const beithirStung = scene.player.isBeithirStung();
      const beithirFrac = scene.player.beithirRemainingFraction();
      const beithirLabel = beithirStung ? t('ui.hud.beithir.race') : '';
      scene.hud.setBeithirRace(beithirStung, beithirFrac, beithirLabel);
    },
  });
}
