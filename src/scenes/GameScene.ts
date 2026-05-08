import * as Phaser from 'phaser';
import { GAME } from '../config';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { SpawnSystem } from '../systems/SpawnSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { XPSystem } from '../systems/XPSystem';
import {
  NodeMapSystem,
  buildNodeMapState,
  generateNodePath,
  placeNodes,
} from '../systems/NodeMapSystem';
import { NodeMarkerSystem } from '../systems/NodeMarkerSystem';
import { UpgradeCardsUI } from '../ui/UpgradeCards';
import { HUD } from '../ui/HUD';
import { EdgeIndicators } from '../ui/EdgeIndicators';
import { Minimap } from '../ui/Minimap';
import { NodeMapUI } from '../ui/NodeMapUI';
import { NodePromptUI } from '../ui/NodePromptUI';
import { RelicSlotUI } from '../ui/RelicSlotUI';
import { getActBank, getAct3Bank, type Act3Stretch } from '../data/nodeBanks';
import { NodeWaveTracker } from '../systems/nodeEvents/NodeWaveTracker';
import { JuiceSystem } from '../systems/JuiceSystem';
import { AmbientWeatherSystem } from '../systems/AmbientWeatherSystem';
import { HazardsSystem } from '../systems/HazardsSystem';
import { createPhaserTimeAdapter, TimeManager } from '../systems/TimeManager';
import { disposeRecordingAudioStream } from '@/systems/audioContext';
import type { ClipRecorder } from '@/utils/clipRecorder';
import { installClipRecorder } from './game/installClipRecorder';
import {
  recordRun, loadSave,
  bumpBanterHeard,
  bumpBossKillCount, bumpCursedVictoryByBoss,
} from '../utils/save';
import { audio } from '../systems/AudioSystem';
import { musicEngine, GameMusicState } from '../systems/music/ProceduralMusicEngine';
import { getVariantByKey, VariantDef, formatRunVariantLabel } from '../data/variants';
import { ISceneContext } from '../core/ISceneContext';
import { UpdateTickers, TickerHandle } from '../utils/UpdateTickers';
import { SubscriptionBag } from '../utils/SubscriptionBag';
import { createRNG, randomSeed, encodeSeed, type RNG } from '../utils/rng';
import { buildCaptureFilename } from '../utils/captureFilename';
import { formatLocalYmd } from '../utils/formatDate';
import { saveScreenshot } from '../utils/screenshot';
import { TOAST_COLORS } from '../ui/toastPalette';
import type { ReplayRecorder } from '../replay/ReplayRecorder';
import type { ReplayInput } from '../replay/ReplayInput';
import type { ReplayBlobAny } from '../replay/replayBlob';
import { resolveReplayMode } from '../replay/replayConfig';
import { parseGameSceneInitData } from './gameSceneInitData';
import { DebugOverlay } from '../ui/DebugOverlay';
import { SaveManager } from '../core/SaveManager';
import { StatComposer } from '../core/StatComposer';
import { applyAudioFromUserSettings } from '../core/applyAudioFromSettings';
import { getSettingsManager } from '../core/SettingsManager';
import { BanterSystem } from '../systems/BanterSystem';
import type { BanterContext } from '../data/banter';
import { getAnalyticsManager } from '../core/AnalyticsManager';
import { t } from '../core/i18n';
import { sfxManager, type SFXManager } from '../systems/audio/SFXManager';
import { getCameraViewport } from '../ui/cameraViewport';
import {
  createGameplaySessionGuard,
  finalizeResumeStartup,
  readPendingResumeRun,
} from '../core/GameSessionLifecycle';
import { RunStatsTracker } from '../systems/RunStatsTracker';
import { DeathCauseTracker } from '../systems/DeathCauseTracker';
import { defaultModifiers, type RunModifiers } from '../core/RunModifiers';
import { type CurseKey } from '../data/curses';
import { formatHudCurseChipLine } from '../ui/formatHudCurseChip';
import { StatusFxPool } from '../systems/StatusFxPool';
import { TempBuffBag } from '../systems/TempBuffBag';
import { RuneConditionSystem } from '../systems/RuneConditionSystem';
import { createRuneEffectBag } from '../systems/runes/runeEffects';
import { applyWeaponMultiplierFold } from './game/weaponMultiplierFold';
import { wireWeaponSystemListeners } from './game/wireWeaponSystemListeners';
import { wireXpSystemListeners } from './game/wireXpSystemListeners';
import { RUNES } from '../data/runes';
import { RuneSystemController } from './game/runeSystemController';
import { TutorialSystem } from '../systems/TutorialSystem';
import { BIOMES, type BiomeId } from '../data/biomes';
import type { BiomeManager } from '../systems/BiomeManager';
import { BiomeController } from './game/BiomeController';
import { shouldReseedAtSec } from '../systems/biomeReseedSchedule';
import type { FloraScatter } from '../systems/FloraScatter';
import type { WildlifeSystem } from '../systems/WildlifeSystem';
import type { MistLayer } from '../systems/MistLayer';
import { installWorldDressing } from './game/installWorldDressing';
import { FilmGrainOverlay } from './game/FilmGrainOverlay';
import { IFrameController } from './game/IFrameController';
import { RunEndTickers } from './game/RunEndTickers';
import { showCountdown } from './game/CountdownOverlay';
import { MoorMomentScheduler } from './game/MoorMomentScheduler';
import {
  type MoorMomentsState,
  createMoorMomentsState,
  type MoorMomentsContext,
  tryMoorMercyLuck as moorMomentsTryMercyLuck,
  trySpawnAncestralEcho as moorMomentsTrySpawnAncestralEcho,
  spawnStandingStones as moorMomentsSpawnStandingStones,
  spawnReliquary as moorMomentsSpawnReliquary,
  showRunIdentityToast as moorMomentsShowRunIdentityToast,
} from './game/moorMoments';
import {
  finalizeNodeVisit as finalizeNodeVisitHelper,
  peekReplayChoiceFor as peekReplayChoiceForHelper,
} from './game/nodeVisitFinalizer';
import { PauseMenu } from './game/PauseMenu';
import { canOpenPauseMenu } from './game/pauseGate';
import { PickupSpawner } from './game/PickupSpawner';
import { EnemyKillHandler } from './game/EnemyKillHandler';
import { RunActState } from './game/RunActState';
import { StandingStones } from './game/standingStones';
import { Reliquary, chooseReliquarySpawnSec } from './game/reliquary';
import { AncestralEcho } from './game/ancestralEcho';
import { launchActIntermission as launchActIntermissionImpl } from './game/actIntermissionLauncher';
import type { RoutePick, RouteResumeContext } from '../data/routes';
import { getRoute } from '../data/routes';
import { FloatTextPool } from './game/FloatTextPool';
import { PlayerHitResolver } from './game/PlayerHitResolver';
import { RunPersistenceBridge } from './game/RunPersistenceBridge';
import { RunHistoryRecorder } from './game/RunHistoryRecorder';
import { RunPersistenceCoordinator } from './game/RunPersistenceCoordinator';
import { resolveResumeNodeMapTarget } from './game/resumeNodeMapTarget';
import { generateHaggisName } from '@/data/haggisNames';
import { showRunIntroToasts } from './game/runIntroToasts';
import { DebugTimeTravelApi } from './game/DebugTimeTravelApi';
import { BossHpTracker } from './game/BossHpTracker';
import { ChestSpriteRegistry } from './game/ChestSpriteRegistry';
import { RunExitComposer } from './game/RunExitComposer';
import { RunScoreState } from './game/RunScoreState';
import { wireSceneEventBus } from './game/wireSceneEventBus';
import { installRunIntroFx } from './game/installRunIntroFx';
import { installRunStartCeremony } from './game/runStartCeremony';
import {
  installReplayPlayback,
  installReplayRecording,
  resetReplayBridge,
  recordReplayFrame,
  tickReplayPlayback,
} from './game/replayBridgeInstall';
import { applyCurseAndComposeStats } from './game/applyCurseAndComposeStats';
import { installRunEndShutdown } from './game/runEndShutdown';
import { installNodeMap, tearDownNodeMap } from './game/nodeMapLifecycle';
import {
  applySeasonalRunStartPostSpawn,
  buildSeasonalRunStartPlan,
} from './game/seasonalRunStart';
import { dispatchNodeTrigger } from './game/nodeTriggerHandlers';
import { installTreasureChestTimer } from './game/installTreasureChestTimer';
import { wireSceneKeybindings } from './game/wireSceneKeybindings';
import { tickAutoBattleSteering } from './game/tickAutoBattleSteering';
import { updateMusicStateScratch } from './game/updateMusicStateScratch';
import { updateRunHudFrame } from './game/updateRunHudFrame';
import { LevelUpFlow } from './game/LevelUpFlow';
import { RunLifecycle } from './game/RunLifecycle';
import { RelicOrchestrator } from './game/RelicOrchestrator';
import { RELICS, type RelicKey } from '../data/relics';
import { createHighlandTerrain } from './game/highlandTerrain';
import { HazardZones } from './game/HazardZones';
import { GameTickers } from './game/GameTickers';
import {
  applyPermanentUpgrades,
  applyVariantModifiers,
  applyVariantStartPassives,
} from './game/runStartModifiers';
import { CaptionManager } from '../systems/a11y/CaptionManager';
import { CaptionOverlay } from '../systems/a11y/CaptionOverlay';
import {
  installAutoBattleTimeScale,
  isAutoBattleEnabled,
  uninstallAutoBattleTimeScale,
} from '../dev/AutoBattler';
import { tickStressTest } from '../dev/StressTest';
import { registerDebugHotkeys } from './dev/debugHotkeys';
import { computeMantleTier } from '../animation/mantleTier';
import {
  tickMantlePulse,
  tickRelicEffectFrame,
  tickSecondCounter,
  type SecondTickHookContext,
} from './game/runtimeTickHooks';
import { isBreathReady, STACKS_MAX as WHISKY_STACKS_MAX } from '../entities/whiskyBreath';
import { HaarFogController } from '../systems/shaders/HaarFogController';
import { biomeHaarTarget } from '../systems/shaders/biomeHaar';
import { DEFAULT_HAAR_TRANSITION } from '../systems/shaders/haarTransition';

/**
 * GameScene — the core gameplay loop.
 */
/** Payload for `scene.start('Game', data)` — enables seeded / daily runs. */
export interface GameSceneInitData {
  seed?: number | null;
  isDaily?: boolean;
  /**
   * Force a specific variant without touching the user's saved loadout
   * choice. Used for daily challenges (everyone plays the same variant)
   * and shared seed codes (fair comparison requires identical starting
   * conditions).
   */
  forceVariantKey?: string;
  /**
   * T1 replay playback — when present, GameScene enters playback mode:
   * the blob's seed + variant override `seed` / `forceVariantKey`, Player
   * is built with a `ReplayInput` driver, recording is disabled, and the
   * run writes nothing to history. Exiting the replay returns to the
   * Chronicle (not MainMenu). v1 limitations documented in ADR-0002.
   */
  replay?: import('../replay/replayBlob').ReplayBlobAny;
}

export class GameScene extends Phaser.Scene implements ISceneContext {
  private player!: Player;
  private spawnSystem!: SpawnSystem;
  private weaponSystem!: WeaponSystem;
  private xpSystem!: XPSystem;
  private tutorialSystem!: TutorialSystem;
  private upgradeUI!: UpgradeCardsUI;
  private hud!: HUD;
  private juice!: JuiceSystem;
  /** Ambient seasonal weather overlay (drizzle / rain / sun-shafts / aurora).
   *  Pure cosmetic — `null` between runs and when no seasonal event is live. */
  private weather: AmbientWeatherSystem | null = null;
  /** Biome-conditioned environmental hazards (peat pits / slate / burn / scree).
   *  Damages player on overlap; `null` between runs. */
  private hazards: HazardsSystem | null = null;
  private timeManager!: TimeManager;
  private updateTickers = new UpdateTickers();
  private clipRecorder: ClipRecorder | null = null;
  private edgeIndicators!: EdgeIndicators;
  private minimap!: Minimap;
  /** M1 Moor Road — per-run node-path system + HUD widget. */
  private readonly nodeMapSystem = new NodeMapSystem();
  private readonly nodeMarkerSystem = new NodeMarkerSystem();
  /**
   * M1 F1 + F2 — defers finalize for encounter / elite nodes until the
   * spawned enemies die. Ticked once per frame from the main update loop
   * after `nodeMapSystem.tick`.
   */
  private readonly nodeWaveTracker = new NodeWaveTracker();
  private nodeMapUI: NodeMapUI | null = null;
  private nodePromptUI: NodePromptUI | null = null;
  /** Index of the interactive node whose prompt is currently open. -1 when none. */
  private interactivePromptIndex = -1;
  /** R1 M3 T22 — 3-slot HUD widget for held Relics. */
  private relicSlotUI: RelicSlotUI | null = null;
  private readonly chestRegistry = new ChestSpriteRegistry();
  private readonly iFrameController = new IFrameController(() => this.player);

  private ownedPassives: string[] = [];
  private evolvedWeapons: string[] = [];
  /** U1 Rune tier — per-run owned rune ids. Filter for buildCardPool's
   *  ownedRuneIds ctx so duplicate offers are filtered. Cleared on scene
   *  restart. */
  private ownedRuneIds: string[] = [];
  /** U1 — shared effect accumulator read by Player/WeaponSystem readers.
   *  The RuneConditionSystem mutates it via apply/remove on transitions. */
  private runeBag = createRuneEffectBag();
  /** U1 — transition-driven rune orchestrator. Ticked from update() with
   *  a freshly-built RuneEvalContext each frame. */
  private runeSystem = new RuneConditionSystem(this.runeBag);
  /** Controller for per-frame rune tick + pulse drain (Phase 5 Bucket 2). */
  private runeSystemController!: RuneSystemController;
  /** All per-run counters (kills, boss/coin gold, elite chain, victory state). */
  private readonly runScore = new RunScoreState();
  /** M1 F4 — timed shrine buffs. Cleared (not reverted) on scene restart. */
  private readonly tempBuffBag = new TempBuffBag();
  /** W2 Moor Road: act number + picker history across the run. */
  private readonly runActState = new RunActState();
  /** Mutable mercy-luck flag, owned by the moor-moments helper module. */
  private readonly moorMomentsState: MoorMomentsState = createMoorMomentsState();
  /** Standing Stones trinity — nulls out between runs, spawned at 5:00 mark. */
  private standingStones: StandingStones | null = null;
  /** True once the 4:45 "stones stir" pre-warning has fired this run. */
  private stonesWarned: boolean = false;
  /** Reliquary — single rare pickup, placed off-path between 6:00 and 12:00. */
  private reliquary: Reliquary | null = null;
  /** Run-specific second at which the reliquary spawns. Rolled from runRng
   *  at run start so the same seed always produces the same placement. */
  private reliquarySpawnSec: number = 0;
  /** Ancestral Echo — spectral haggis at last-death spot. Nulls on resolve. */
  private ancestralEcho: AncestralEcho | null = null;
  /** Batched toast for max-level XP → gold conversion (avoids spam). */
  private xpOverflowGoldBatch: number = 0;
  /** Chests deferred while paused — queued so multiple timer callbacks don't overwrite each other. */
  private pendingChests: Array<{ golden: boolean }> = [];
  private gameTickers!: GameTickers;
  private revivalAvailable: boolean = false;
  private activeVariant!: VariantDef;
  /** Extra ms added to chest/coin despawn windows by the Treasure Magnet permanent upgrade. */
  private chestDurationBonusMs: number = 0;

  /**
   * Run-scoped seeded PRNG for gameplay decisions (card draws, elite rolls,
   * loot rarity, weighted spawns, crit). Set in `create()` from the seed
   * passed via `init(data)` — daily challenge / shared seed codes / replay.
   */
  private runRng!: RNG;
  /**
   * Sub-RNG branched off `runRng` for rune-pulse spawn positions (extra
   * gems from `applyRunePulses`). Branched after biome/flora/wildlife/
   * mist so existing fixtures' sub-seeds are preserved. Replaces a prior
   * `Math.random()` that broke T1 replay determinism — gem positions
   * affect pickup-radius eligibility, which alters XP totals.
   */
  private runePulseRng!: RNG;
  /** T1 replay state — install/teardown owned by `game/replayBridgeInstall.ts`. */
  private replayRecorder: ReplayRecorder | null = null;
  private replayInput: ReplayInput | null = null;
  private pendingReplay: ReplayBlobAny | null = null;
  /** v2 route queue — `launchActIntermission` shifts one off per act boundary during playback. */
  private pendingReplayRoutes: RoutePick[] = [];
  /** Pending seed passed via init() data. Consumed in create(). */
  private pendingRunSeed: number | null = null;
  /** Set when the run is a Daily Challenge attempt — drives save tracking + end-of-run UI. */
  private runIsDaily: boolean = false;
  /** Optional variant override from init data (seeded / daily runs). Cleared in create(). */
  private pendingForceVariantKey: string | null = null;
  /**
   * T303 — curse selection passed via `scene.start('Game', { curseKey })`.
   * Replaces the prior `pendingCurseKey` module singleton so a stale pick
   * cannot leak from one run into the next via process-wide state. Set by
   * init() (or the v2 replay blob), consumed once in create().
   */
  private pendingCurseKey: string | null = null;
  /**
   * T101 — set by `RunPersistenceBridge.applyResume` when it reconstructs
   * the rolled `currentActNodeMap` from the snapshot. The next
   * `initNodeMapForAct` call clears the flag and reuses the restored map
   * instead of re-rolling — so the player's visited[] survives resume.
   * Subsequent calls (act 3 stretch transitions) re-roll normally.
   */
  private suppressNextNodeMapRoll = false;

  /** Pickup lifetimes — scheduled on scene-owned UpdateTickers. */
  private pickupDespawnHandles: TickerHandle[] = [];
  private readonly runEndTickers = new RunEndTickers();
  /** End-of-run screen-space fade overlays — tracked as fields so shutdown
   *  can destroy them; anonymous locals would orphan on scene restart since
   *  Phaser's scene.stop() doesn't clear the display list. */
  private victoryFade: Phaser.GameObjects.Rectangle | null = null;
  private deathFade: Phaser.GameObjects.Rectangle | null = null;
  private subs = new SubscriptionBag();
  private debugOverlay: DebugOverlay | null = null;
  private announcedEvolutionReady = new Set<string>();
  private playerEnemyCollider: Phaser.Physics.Arcade.Collider | null = null;
  private bossHpTracker!: BossHpTracker;
  private debugTimeTravelApi!: DebugTimeTravelApi;
  private runExit!: RunExitComposer;

  /** Reused each frame — avoids allocating a new object for `musicEngine.update`. */
  private readonly musicStateScratch: GameMusicState = {
    hp: 0, maxHp: 0, gameTimeSec: 0, enemyCount: 0, comboCount: 0, killCount: 0, bossActive: false,
    biomeTimbre: 0.45, buildDensity: 0,
  };
  /** Reused HUD weapon rows — mutated in place; length capped at max equippable weapons. */
  private readonly hudWeaponScratch: Array<{
    key: string;
    level: number;
    evolved: boolean;
    evolutionKey: string;
    cooldownFrac: number;
  }> = Array.from({ length: 12 }, () => ({
    key: '', level: 0, evolved: false, evolutionKey: '', cooldownFrac: 0,
  }));

  private readonly metaSaveManager = new SaveManager();
  private readonly settingsManager = getSettingsManager();
  private statusFxPool!: StatusFxPool;
  /** Pooled floating text for high-frequency combat/pickup feedback (armor, gold). */
  private readonly floatTextPool = new FloatTextPool();
  private readonly runStatsTracker = new RunStatsTracker();
  private readonly deathCauseTracker = new DeathCauseTracker();
  /** Per-run modifier bag (from curse pick). Defaults to identity — an un-cursed run behaves identically to the pre-curse codebase. */
  private runModifiers: RunModifiers = defaultModifiers();
  /** Curse key chosen for this run, if any — persisted into run history. */
  private activeCurseKey: CurseKey | null = null;
  /**
   * E1 M2 T10 — Burns Night haggis-platter state. `spawned` flips once
   * the platter is dropped this run (so the scheduler never double-
   * fires after a TimeManager reset); `pickedUpAtMs` captures
   * `this.time.now` at collision so the damage-buff helper can decay
   * the 1.3× multiplier after 60 s. Both reset on every `create()`
   * run — see the reset block near the top.
   */
  private burnsPlatterSpawned: boolean = false;
  private burnsPlatterPickedUpAtMs: number | null = null;
  /**
   * W66 Ironmoor — locked in at run start (from Settings on a fresh run,
   * from the snapshot on resume). Every ironmoor-sensitive decision
   * (revival suppression, HUD badge, wipe-on-death, leaderboard write)
   * reads this field rather than `settingsManager.load().ironmoorMode`
   * so a mid-run settings toggle can't retroactively grant Second Wind
   * to a permadeath run or silently drop a row from the leaderboard.
   */
  private activeIronmoorRun = false;
  private runName = '';
  private lastEmittedRunSecond = -1;
  private eventBusDispose: (() => void) | null = null;
  private biomeController: BiomeController | null = null;
  /**
   * Phase B Endless — secondsPastBell at which we last reseeded
   * the biome layout. -1 = never. Reset on scene reuse via the
   * BiomeController construction path which already resets this.
   */
  private postBellLastReseedSec: number = -1;
  /** F1 M5 — persistent haar fog controller on the main camera. Null when
   *  the Canvas renderer is in use (filter pipeline unavailable there). */
  private haarFog: HaarFogController | null = null;
  private pauseMenu: PauseMenu | null = null;
  private pickupSpawner!: PickupSpawner;
  /**
   * R1 — Relic pickup flow + slot/effect ownership (RelicSystem +
   * RelicEffectDriver + RelicPickupSpawner + Fianna lifecycle). Wraps
   * the prior inline GameScene methods (rollAndSpawnRelic, modal,
   * activateWhiskyDram, activateFingalsHorn). Fresh instance per run.
   */
  private relicOrchestrator!: RelicOrchestrator;
  /** Tunnel accessor for compositor call sites that read the slot model. */
  private get relicSystem() { return this.relicOrchestrator.getSystem(); }
  /** Tunnel accessor for compositor call sites that read the effect driver. */
  private get relicEffectDriver() { return this.relicOrchestrator.getDriver(); }
  /** Tunnel accessor for compositor call sites that need the live pickup spawner. */
  private get relicPickupSpawner() { return this.relicOrchestrator.getSpawner(); }
  private levelUpFlow!: LevelUpFlow;
  private runLifecycle!: RunLifecycle;
  private enemyKillHandler!: EnemyKillHandler;
  private playerHitResolver!: PlayerHitResolver;
  private runPersistence!: RunPersistenceBridge;
  private runHistoryRecorder!: RunHistoryRecorder;
  /**
   * T401 P3 — replay-aware wrapper around `RunHistoryRecorder.record`
   * and the legacy `recordRun` save call. Built once `runHistoryRecorder`
   * exists; `RunLifecycle` reads through it so the playback no-op is
   * unit-testable instead of an anonymous closure.
   */
  private runPersistenceCoordinator!: RunPersistenceCoordinator;
  private hazardZones!: HazardZones;
  private captionManager: CaptionManager | null = null;
  private captionOverlay: CaptionOverlay | null = null;
  private filmGrain: FilmGrainOverlay | null = null;
  private banter: BanterSystem | null = null;
  private readonly gameplaySessionGuard = createGameplaySessionGuard(() => {
    getAnalyticsManager().endGameplaySession();
  });

  private moorMoments!: MoorMomentScheduler;
  private floraScatter: FloraScatter | null = null;
  private wildlifeSystem: WildlifeSystem | null = null;
  private mistLayer: MistLayer | null = null;

  constructor() {
    super({ key: 'Game' });
  }

  getUiViewport(): { x: number; y: number; width: number; height: number; zoom: number } {
    const { x, y, width, height, zoom } = getCameraViewport(this);
    return { x, y, width, height, zoom };
  }

  /** Max-level XP (gems + scripted grants) becomes run gold — batched toasts. */
  /**
   * R1 M3 T20e — ceilidh_dancers_ribbon lowers the chain-pulse period
   * from 8 → 5. Read by JuiceSystem each kill; defaults to 8 when the
   * driver isn't constructed yet (e.g. pre-reset transient frames).
   */
  getCeilidhChainPeriod(): number {
    return this.relicEffectDriver?.ceilidhChainThreshold(8) ?? 8;
  }

  /** R1 M4 — stone_of_destiny_shard boss HP multiplier. 1 if not held. */
  getBossHpMultiplier(): number {
    return this.relicEffectDriver?.modifyBossMaxHp(1) ?? 1;
  }

  /** R1 M4 — highland_torque elite spawn chance multiplier. 1 if not held. */
  getEliteSpawnMultiplier(): number {
    return this.relicEffectDriver?.modifyEliteSpawnChance(1) ?? 1;
  }

  /**
   * Whisky Breath puddle drop hook (DESIGN_IDEAS §1, slice 2). Routes
   * the player's burst-origin + stack-scaled DoT through to
   * `HazardZones.spawnWhiskyPuddle`. Skips silently when hazardZones
   * isn't wired (mid-init / abandon paths).
   */
  spawnWhiskyPuddle(x: number, y: number, dmgPerTick: number): void {
    this.hazardZones?.spawnWhiskyPuddle(x, y, dmgPerTick);
  }

  grantXpOverflowGold(amount: number): void {
    if (amount <= 0) return;
    this.runScore.addCoinGold(amount);
    this.xpOverflowGoldBatch += amount;
    if (this.xpOverflowGoldBatch >= 14) {
      const batch = this.xpOverflowGoldBatch;
      this.xpOverflowGoldBatch = 0;
      this.juice.showToast(t('ui.game.xp_overflow_gold', { gold: batch }), '#e8c060');
    }
  }

  /**
   * Blank every transient per-run field so a recycled scene instance starts
   * clean. Must include anything mutated during gameplay — see the field
   * declarations above for the inventory. Called once from create() before
   * any systems are constructed.
   */
  private resetTransientRunState(): void {
    // T1 replay — drop the previous run's playback driver. Slice in `replayBridgeInstall.ts`.
    ({
      replayInput: this.replayInput,
      pendingReplayRoutes: this.pendingReplayRoutes,
    } = resetReplayBridge({ replayInput: this.replayInput }));
    this.iFrameController.reset();
    this.pauseMenu?.close();
    this.pauseMenu = null;
    this.runScore.reset();
    this.tempBuffBag.clear();
    this.runActState.reset();
    this.suppressNextNodeMapRoll = false;
    // T401 slice 7 — node-map teardown (Option A: bare, no try/catch).
    // Thrown destroys surface during dev as a partial-init signal.
    tearDownNodeMap({
      nodeMapSystem: this.nodeMapSystem,
      nodeWaveTracker: this.nodeWaveTracker,
      nodeMapUI: this.nodeMapUI,
      nodePromptUI: this.nodePromptUI,
      setNodeMapUI: (ui) => { this.nodeMapUI = ui; },
      setNodePromptUI: (ui) => { this.nodePromptUI = ui; },
    });
    this.nodeMarkerSystem.destroy();
    this.interactivePromptIndex = -1;
    this.chestDurationBonusMs = 0;
    const runSeed = this.pendingRunSeed ?? randomSeed();
    this.runRng = createRNG(runSeed);
    this.pendingRunSeed = null;
    // Reliquary spawn moment rolled once per run so the same seed always
    // places the relic at the same second (daily runs + replay reproduce).
    this.reliquarySpawnSec = chooseReliquarySpawnSec(this.runRng);
    this.pendingChests = [];
    this.pickupDespawnHandles = [];
    this.updateTickers.clear();
    this.runEndTickers.reset();
    this.victoryFade?.destroy();
    this.victoryFade = null;
    this.deathFade?.destroy();
    this.deathFade = null;
    this.hazardZones?.reset();
    this.lastEmittedRunSecond = -1;
    this.chestRegistry.reset();
    this.announcedEvolutionReady.clear();
    this.runStatsTracker.reset();
    this.deathCauseTracker.reset(0);
    this.gameTickers?.reset();
    this.subs = new SubscriptionBag();
    this.musicStateScratch.hp = 0;
    this.musicStateScratch.maxHp = 0;
    this.musicStateScratch.gameTimeSec = 0;
    this.musicStateScratch.enemyCount = 0;
    this.musicStateScratch.comboCount = 0;
    this.musicStateScratch.killCount = 0;
    this.moorMomentsState.mercyLuckGranted = false;
    this.runName = '';
    // E1 M2 T10 — wipe Burns platter state so a recycled scene instance
    // never claims it already spawned/collected across runs.
    this.burnsPlatterSpawned = false;
    this.burnsPlatterPickedUpAtMs = null;
    this.standingStones?.destroy();
    this.standingStones = null;
    this.stonesWarned = false;
    this.reliquary?.destroy();
    this.reliquary = null;
    this.ancestralEcho?.destroy();
    this.ancestralEcho = null;
    // R1 — clear held Relics + dropped pickups + Fianna spirits before a
    // fresh run. A scene instance can be reused across runs; without this
    // the previous run's sporran (and any 10s-lifetime Fianna spirits)
    // bleed into the next.
    if (!this.relicOrchestrator) {
      this.relicOrchestrator = new RelicOrchestrator(this, {
        getPlayer: () => this.player,
        getJuice: () => this.juice,
        getSpawnSystem: () => this.spawnSystem,
        getTimeManager: () => this.timeManager,
        getUpdateTickers: () => this.updateTickers,
        getRunRng: () => this.runRng,
        getGameTimeSec: () => this.spawnSystem?.getGameTimeSec() ?? 0,
        requestBanter: (ctx, tag) => this.requestBanter(ctx, tag),
      });
    } else {
      this.relicOrchestrator.resetForNewRun();
    }
    this.relicSlotUI?.destroy();
    this.relicSlotUI = null;
    this.musicStateScratch.bossActive = false;
    this.musicStateScratch.biomeTimbre = 0.45;
    this.xpOverflowGoldBatch = 0;
  }

  init(data?: GameSceneInitData): void {
    // Parsing lives in a pure helper so the payload contract is testable
    // without booting Phaser (see gameSceneInitData.test.ts). Precedence
    // rules: valid `replay` blob overrides any seed / variant the caller
    // also supplied, and forces `isDaily` off.
    const resolved = parseGameSceneInitData(data);
    this.pendingRunSeed = resolved.pendingRunSeed;
    this.runIsDaily = resolved.runIsDaily;
    this.pendingForceVariantKey = resolved.pendingForceVariantKey;
    this.pendingReplay = resolved.pendingReplay;
    this.pendingCurseKey = resolved.pendingCurseKey;
  }

  create(): void {
    const save = loadSave();

    const metaLoaded = this.metaSaveManager.load();
    const resumeRun = readPendingResumeRun(metaLoaded.activeRun);

    // Wipe transient per-run state — Phaser reuses the scene instance on
    // scene.start, so field initializers only fire at construction and
    // anything mutated during gameplay would leak into the next run.
    this.resetTransientRunState();

    // Phase 5 Bucket 2 — rune-system controller. Lazy getters read live
    // scene state so the ref stays correct across resetTransientRunState
    // (which rebinds runeBag / runeSystem) and across late-construction
    // systems (banter / upgradeUI / relicOrchestrator built further down).
    this.runeSystemController = new RuneSystemController({
      getPlayer: () => this.player,
      getJuice: () => this.juice,
      getSpawnSystem: () => this.spawnSystem,
      getWeaponSystem: () => this.weaponSystem,
      getXPSystem: () => this.xpSystem,
      getRunScore: () => this.runScore,
      getRunActState: () => this.runActState,
      getRuneBag: () => this.runeBag,
      getRuneSystem: () => this.runeSystem,
      getRunePulseRng: () => this.runePulseRng,
      currentBiomeAtPlayer: () =>
        this.biomeController
          ? this.biomeController.currentBiomeAt(this.player.x, this.player.y)
          : null,
      getRelicHeldCount: () => this.relicSystem?.heldCount() ?? 0,
      getEvolvedWeaponsCount: () => this.evolvedWeapons.length,
      getChestRegistry: () => this.chestRegistry,
      getUpgradeUI: () => this.upgradeUI ?? null,
      getBanter: () => this.banter,
      getTimeNowMs: () => this.time.now,
      setBurnsPlatterPickedUpAtMs: (ms) => { this.burnsPlatterPickedUpAtMs = ms; },
    });

    // Cosmetic run name — uses Math.random(), not runRng (keeps gameplay
    // determinism intact per rng.ts policy). Generated here so the name
    // is available for the 3s whisper toast and the run-end history entry.
    this.runName = generateHaggisName(() => Math.random());

    // Single authority over timeScale + physics pause state
    this.timeManager = new TimeManager(createPhaserTimeAdapter(this));
    this.timeManager.reset();
    this.registerShutdownCleanup();

    if (isAutoBattleEnabled()) {
      installAutoBattleTimeScale(this);
    }

    // Set world bounds
    this.physics.world.setBounds(0, 0, GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT);

    // Draw the Highland ground
    createHighlandTerrain(this);

    // F1 M5 — attach a persistent HaarFogController to the main camera so
    // biome-driven ambient fog can live across the whole run. WebGL-only;
    // Canvas silently runs without haar.
    this.installHaarFog();

    // Biome partition — voronoi regions seeded from the run RNG.
    // Owns manager, renderer, entry-toast state, and player-modifier push.
    this.biomeController?.destroy();
    this.postBellLastReseedSec = -1;
    this.biomeController = new BiomeController(
      this,
      this.runRng.branch(),
      GAME.WORLD_WIDTH,
      GAME.WORLD_HEIGHT,
      { onBiomeEnter: (biome) => this.handleBiomeEnteredForHaar(biome) },
    );
    // World dressing — decorations + atmospheric mist.
    const dressing = installWorldDressing({
      scene: this,
      biomeManager: this.getBiomeManager(),
      runRng: this.runRng,
      worldWidth: GAME.WORLD_WIDTH,
      worldHeight: GAME.WORLD_HEIGHT,
      reduceParticles: this.settingsManager.load().reduceParticles,
      prior: {
        floraScatter: this.floraScatter,
        wildlifeSystem: this.wildlifeSystem,
        mistLayer: this.mistLayer,
      },
    });
    this.floraScatter = dressing.floraScatter;
    this.wildlifeSystem = dressing.wildlifeSystem;
    this.mistLayer = dressing.mistLayer;

    // Rune-pulse RNG — branched after world-dressing branches so the
    // mist/flora/wildlife sub-seeds keep their pre-2026-04-29 values.
    this.runePulseRng = this.runRng.branch();

    // Post-Bell + key handler live on RunLifecycle — reset on every scene
    // create since Phaser reuses scene instances across runs.
    this.runLifecycle?.reset();

    // Captions — render regardless of whether the setting is enabled so
    // runtime toggling works; CaptionOverlay checks the flag per frame.
    this.captionOverlay?.destroy();
    this.captionManager = new CaptionManager();
    this.captionOverlay = new CaptionOverlay(this, this.captionManager);

    // Banter — initialised lazily so juice/caption are wired up first. The
    // wiring happens after JuiceSystem is constructed (search for "this.juice = new").
    this.banter?.reset();

    // Create the player (resume position) or world center.
    // Seeded / daily runs can override the saved variant so all players
    // face the same starting conditions — required for fair leaderboards
    // and shareable seeds. Override is ignored when resuming a run.
    const selectedVariant = resumeRun
      ? getVariantByKey(resumeRun.selectedVariantKey)
      : getVariantByKey(this.pendingForceVariantKey ?? save.selectedVariant);
    this.pendingForceVariantKey = null;
    this.activeVariant = selectedVariant;

    // T1 replay — mutually exclusive modes (playback wins over record).
    // Slice in `replayBridgeInstall.ts`; recorder build deferred below
    // so the v2 meta captures the live curse + composed stats.
    this.replayRecorder = null;
    const { replayMode, replayInput, playbackV2, consumePending } =
      installReplayPlayback({
        pendingReplay: this.pendingReplay,
        resolvedMode: resolveReplayMode(),
      });
    this.replayInput = replayInput;
    if (consumePending) this.pendingReplay = null;

    const metaSave = this.metaSaveManager.load();
    const baseStats = StatComposer.getPlayerStats(metaSave);

    // T303 + T1 v2 — curse application + composedStats derivation.
    // Slice in `applyCurseAndComposeStats.ts`. Resolution rules
    // (precedence, resume/daily gates, replay-determinism override)
    // live in the helper; this call site only owns the field
    // assignments + the consume-once null-out for `pendingCurseKey`.
    const curseResult = applyCurseAndComposeStats({
      pendingCurseKey: this.pendingCurseKey,
      resumeRun: !!resumeRun,
      runIsDaily: this.runIsDaily,
      playbackV2,
      baseStats,
    });
    if (curseResult.consumePending) this.pendingCurseKey = null;
    this.runModifiers = curseResult.runModifiers;
    this.activeCurseKey = curseResult.activeCurseKey;
    const composedStats = curseResult.composedStats;

    // Seasonal run-start hooks. Modifier-bag deltas apply now, before
    // systems snapshot the bag; post-spawn heal/player bonuses/toast
    // apply after Player construction below.
    const seasonalRunStart = buildSeasonalRunStartPlan({
      resumeRun: !!resumeRun,
      disableSeasonalEvents: this.settingsManager.load().disableSeasonalEvents,
      now: new Date(),
      runRng: this.runRng,
      runModifiers: this.runModifiers,
    });

    // T1 Phase 3 — recorder construction + route-queue seeding. Slice in
    // `replayBridgeInstall.ts`; built here so the v2 blob captures the
    // live curse + composed stats. `pushRoute` is fed from the Moor
    // Road resolver further down (search: `runActState.recordPick`).
    ({
      replayRecorder: this.replayRecorder,
      pendingReplayRoutes: this.pendingReplayRoutes,
    } = installReplayRecording({
      replayMode,
      playbackV2,
      seed: this.runRng.seed,
      variantKey: selectedVariant.key,
      build: import.meta.env.PROD ? 'whs-prod' : 'whs-dev',
      curseKey: this.activeCurseKey,
      composedStats,
    }));
    const spawnPx = resumeRun
      ? Phaser.Math.Clamp(resumeRun.playerX, 40, GAME.WORLD_WIDTH - 40)
      : GAME.WORLD_WIDTH / 2;
    const spawnPy = resumeRun
      ? Phaser.Math.Clamp(resumeRun.playerY, 40, GAME.WORLD_HEIGHT - 40)
      : GAME.WORLD_HEIGHT / 2;
    this.player = new Player(
      this,
      spawnPx,
      spawnPy,
      selectedVariant.textureKey,
      this.timeManager,
      composedStats,
      this.replayInput ?? undefined,
    );
    // U1 M4 — give Player live access to the run's rune effect bag so
    // getMaxHp / getDamageMultiplier / getXpMultiplier / getCritChance
    // / getLuckDrawBonus / getMoveSpeed fold the bag at read time. The
    // accessor returns the *current* bag so a per-run reset (`runeBag =
    // createRuneEffectBag()` above) is picked up without re-wiring.
    this.player.setRuneBagAccessor(() => this.runeBag);
    registerDebugHotkeys(this, {
      getPlayer: () => this.player,
      getScene: () => this,
    });

    // Seasonal post-spawn application. Toast is delayed so it lands
    // after the run-start ceremony settles into the HUD.
    applySeasonalRunStartPostSpawn(seasonalRunStart, {
      heal: (amount) => this.player.heal(amount),
      addXpMultiplier: (amount) => this.player.addXpMultiplier(amount),
      addCritChance: (amount) => this.player.addCritChance(amount),
      showToastAfter: (delayMs, key, color) => {
        this.time.delayedCall(delayMs, () => {
          if (!this.scene.isActive('Game')) return;
          this.juice.showToast(t(key), color);
        });
      },
    });

    // Camera before GrowthSystem so baseZoom matches the zoom used in-game (GrowthSystem reads cameras.main.zoom in its ctor).
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.3);
    this.cameras.main.setBounds(0, 0, GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT);

    // Spawn map hazard and healing zones (lava + healing circles).
    // HazardZones needs runLifecycle.onPlayerHitZero for lava deaths, but
    // runLifecycle isn't built yet at this point. The closure over
    // `this.runLifecycle` resolves lazily — first lava tick happens much
    // later, by which time it's wired.
    //
    // On scene reuse (death + retry), the prior run's hazard display
    // objects (lava base/glow ellipses, heal cross overlays, ember
    // sprites, slick + fog visuals) are NOT auto-cleared by Phaser —
    // they hang on the scene display list because they were added via
    // `scene.add.*`. Reset the prior instance first so its tracked
    // visuals + tweens are torn down before the next spawn.
    if (this.hazardZones) this.hazardZones.reset();
    this.hazardZones = new HazardZones(this, {
      getPlayer: () => this.player,
      getJuice: () => this.juice,
      getDeathCauseTracker: () => this.deathCauseTracker,
      getSpawnSystem: () => this.spawnSystem,
      getRunRng: () => this.runRng,
      isIFrames: () => this.iFrameController.isActive(),
      isVictoryPending: () => this.runScore.victoryPending,
      getDamageTakenMult: () => this.runModifiers.damageTakenMult,
      onPlayerKilled: () => this.runLifecycle.onPlayerHitZero(),
      onAfterPlayerDamaged: (hpBefore) => {
        this.relicEffectDriver?.noteDamageTaken(this.time.now);
        if (this.player.getHp() > 0) this.tryMoorMercyLuck(hpBefore);
      },
      modifyFireDamageTaken: (d) => this.relicEffectDriver.modifyFireDamageTaken(d),
    });
    this.hazardZones.spawn();

    // Systems
    this.statusFxPool = new StatusFxPool(this);
    this.spawnSystem = new SpawnSystem(this);
    this.spawnSystem.setSpawnIntervalMult(this.runModifiers.spawnIntervalMult);
    this.weaponSystem = new WeaponSystem(this, this.spawnSystem.getEnemyGroup());
    this.weaponSystem.setCurseCooldownMul(this.runModifiers.weaponCooldownMult);
    // R1 M3 T20d + M4 + M4.5 P3/P4 — per-hit damage stack. Bronze
    // clasp first-hit window runs before highland_torque elite mult
    // so +15% + +100% compose predictably; fishermens_net applies
    // after (velocity-aware), then bodhran_skin's on-beat window on
    // top. Beat phase is sampled from the shared music engine at
    // hit-time so a 60Hz frame lines up with the audio-ctx clock.
    this.weaponSystem.setHitDamageModifier((dmg, now, isElite, velocityDot) => {
      const afterClasp = this.relicEffectDriver.modifyWeaponDamage(dmg, now);
      const afterElite = this.relicEffectDriver.modifyEliteDamage(afterClasp, isElite);
      const afterFisher = this.relicEffectDriver.modifyFishermensNetDamage(afterElite, velocityDot);
      const beatMs = musicEngine.getMsSinceLastQuarterNote();
      const periodMs = musicEngine.getQuarterNotePeriodMs();
      return this.relicEffectDriver.modifyBodhranBeatDamage(afterFisher, beatMs, periodMs);
    });
    this.xpSystem = new XPSystem(this);
    Enemy.refreshSettings();
    this.bossHpTracker?.reset();
    this.ownedPassives = [];
    this.evolvedWeapons = [];
    this.ownedRuneIds = [];
    // U1 — fresh rune bag + system per run (scene instance is reused).
    this.runeBag = createRuneEffectBag();
    this.runeSystem = new RuneConditionSystem(this.runeBag);
    this.xpOverflowGoldBatch = 0;
    this.revivalAvailable = false;

    // Pre-allocate floating text pool for armor/gold feedback.
    this.floatTextPool.init(this);

    // Variant modifiers establish the run archetype before permanent upgrades stack on top.
    applyVariantModifiers(this.player, selectedVariant);
    // V2 followup — variant starter passives land before permanent
    // upgrades so lucky_start reads the pre-populated ownedPassives.
    applyVariantStartPassives(this.player, this.ownedPassives, selectedVariant);

    // Apply permanent upgrades from save data. The two flag outputs
    // don't live on Player so come back as a result object.
    const permResult = applyPermanentUpgrades({
      player: this.player,
      weaponSystem: this.weaponSystem,
      ownedPassives: this.ownedPassives,
      runRng: this.runRng,
    });
    this.revivalAvailable = permResult.revivalAvailable;
    // W66 Ironmoor: lock the ironmoor flag in at run start. On a fresh
    // run we read the live setting; on resume we prefer the snapshot
    // value so a player who toggled Ironmoor OFF between quit + resume
    // doesn't retroactively get Second Wind back on a permadeath run.
    this.activeIronmoorRun = resumeRun?.ironmoor
      ?? this.settingsManager.load().ironmoorMode;
    if (this.activeIronmoorRun) {
      // Opt-in single-life mode suppresses the Second-Wind grant
      // regardless of permanent-upgrade purchases.
      this.revivalAvailable = false;
    }
    this.chestDurationBonusMs = permResult.chestDurationBonusMs;

    // Moor-moment scheduler must exist before applyResumeHydration — hydration
    // calls pushAfterResume on it. Getters below are lazy; player/juice/xp/etc
    // are still under construction here but only accessed during tick()/fire().
    this.moorMoments = new MoorMomentScheduler({
      getRunRng: () => this.runRng,
      getPlayer: () => this.player,
      getVictoryPending: () => this.runScore.victoryPending,
      getCurrentBiomeId: () => this.getCurrentBiomeId(),
      getTutorialSystem: () => this.tutorialSystem,
      getRunModifiers: () => this.runModifiers,
      getXPSystem: () => this.xpSystem,
      getJuice: () => this.juice,
      getBanter: () => this.banter,
      getSFXManager: () => this.getSFXManager(),
      addCoinGold: (amount) => { this.runScore.addCoinGold(amount); },
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
    });
    this.moorMoments.reset();

    // Run persistence bridge — snapshot / save / hydrate / pagehide hooks.
    // Constructed before resume hydration; lazy getters let it reach
    // levelUpFlow (built later in create()) at hydrate time.
    this.runPersistence = new RunPersistenceBridge({
      getPlayer: () => this.player,
      getXPSystem: () => this.xpSystem,
      getWeaponSystem: () => this.weaponSystem,
      getSpawnSystem: () => this.spawnSystem,
      getJuice: () => this.juice,
      getTimeManager: () => this.timeManager,
      getRunStatsTracker: () => this.runStatsTracker,
      getMoorMoments: () => this.moorMoments,
      getLevelUpFlow: () => this.levelUpFlow,
      getSaveManager: () => this.metaSaveManager,
      getActiveVariant: () => this.activeVariant,
      getRunScore: () => this.runScore,
      getRunActState: () => this.runActState,
      getRunModifiers: () => this.runModifiers,
      isIronmoorRun: () => this.activeIronmoorRun,
      getTempBuffBag: () => this.tempBuffBag,
      getRevivalAvailable: () => this.revivalAvailable,
      getOwnedPassives: () => this.ownedPassives,
      getEvolvedWeapons: () => this.evolvedWeapons,
      getHeldRelicKeys: () => this.relicSystem?.heldKeys() ?? [],
      setRevivalAvailable: (v) => { this.revivalAvailable = v; },
      setOwnedPassives: (p) => { this.ownedPassives = p; },
      setEvolvedWeapons: (e) => { this.evolvedWeapons = e; },
      restoreHeldRelics: (keys) => this.relicOrchestrator.restoreHeld(keys),
      isSceneActive: () => this.scene.isActive(),
      suppressNextNodeMapRoll: () => { this.suppressNextNodeMapRoll = true; },
    });

    // Boss HP bar tracker — caches current spotlight boss and pushes
    // fraction to HUD each frame. Lazy getters so HUD (built later in
    // create()) resolves at tick time.
    this.bossHpTracker = new BossHpTracker({
      getSpawnSystem: () => this.spawnSystem,
      updateBossBar: (data) => this.hud.updateBossBar(data),
    });

    // Dev time-travel controls — globalThis.DEBUG + Shift+] keybind.
    this.debugTimeTravelApi = new DebugTimeTravelApi({
      getSpawnSystem: () => this.spawnSystem,
      isSceneActive: () => this.scene.isActive(),
      spawnRelicAt: (key, x, y) => this.relicOrchestrator.debugSpawnAt(key, x, y),
      getHeldRelicKeys: () => this.relicSystem?.heldKeys() ?? [],
      getRelicCatalogue: () => RELICS,
      openRelicDiscardPromptForAudit: () => {
        if (this.relicOrchestrator.isDiscardModalOpen()) return false;
        this.relicOrchestrator.restoreHeld(['sporran_of_holding', 'oatcake_stash', 'grans_thimble']);
        this.relicOrchestrator.openDiscardModal(RELICS.whisky_dram, 'bargain');
        return true;
      },
    });

    // Run-end composer — builds RunSummary / GameOverPayload and
    // orchestrates the Game → GameOver / Game → MainMenu transitions.
    this.runExit = new RunExitComposer({
      getWeaponSystem: () => this.weaponSystem,
      getSpawnSystem: () => this.spawnSystem,
      getJuice: () => this.juice,
      getXPSystem: () => this.xpSystem,
      getRunStatsTracker: () => this.runStatsTracker,
      getSaveManager: () => this.metaSaveManager,
      getActiveVariant: () => this.activeVariant,
      getActiveCurseKey: () => this.activeCurseKey,
      getRunRng: () => this.runRng,
      getRunModifiers: () => this.runModifiers,
      isDailyRun: () => this.runIsDaily,
      isIronmoorRun: () => this.activeIronmoorRun,
      getSecondsPastBell: () => this.runLifecycle?.getSecondsPastBell() ?? 0,
      getRunName: () => this.runName,
      getRunScore: () => this.runScore,
      getOwnedPassivesLength: () => this.ownedPassives.length,
      getEvolvedWeaponsLength: () => this.evolvedWeapons.length,
      stopGameScene: () => this.scene.stop('Game'),
      startGameOverScene: (payload) => this.scene.start('GameOver', payload),
      // H1 T9 — post-run lands in CroftScene (hub) rather than MainMenu.
      // Hook name retained until a broader rename sweep (scope: future polish).
      startMainMenuScene: () => this.scene.start('Croft'),
      unregisterRunAutoSave: () => this.runPersistence?.unregisterMidRunHooks(),
      // T402 — Game Over run-identity radiator (parity with pause panel).
      // Same data sources as the pause hooks above: RunActState for act
      // counter + picker history, RelicSystem for sporran slot labels,
      // ownedRuneIds → RUNES table for rune labels.
      getCurrentAct: () => this.runActState.currentAct,
      getRouteLabels: () =>
        this.runActState.pickerHistory
          .map((p) => {
            try { return t(getRoute(p.routeKey).labelKey); } catch { return null; }
          })
          .filter((s): s is string => typeof s === 'string'),
      getRelicLabels: () =>
        (this.relicSystem?.getSlots() ?? [])
          .map((s) => s.def?.nameKey)
          .filter((k): k is string => typeof k === 'string')
          .map((k) => t(k)),
      getRuneLabels: () =>
        this.ownedRuneIds
          .map((id) => RUNES[id]?.nameKey)
          .filter((k): k is string => typeof k === 'string')
          .map((k) => t(k)),
    });

    // Run history recorder — writes to meta save on run end, updates
    // the per-day daily challenge record when applicable.
    this.runHistoryRecorder = new RunHistoryRecorder({
      getSaveManager: () => this.metaSaveManager,
      getXPSystem: () => this.xpSystem,
      getWeaponSystem: () => this.weaponSystem,
      getActiveVariant: () => this.activeVariant,
      getActiveCurseKey: () => this.activeCurseKey,
      getBossKillCount: () => this.runScore.bossKillCount,
      getRunRng: () => this.runRng,
      isDailyRun: () => this.runIsDaily,
      getRoutePicks: () => this.runActState.pickerHistory,
      isIronmoor: () => this.activeIronmoorRun,
      getReplayBlob: () => this.replayRecorder?.finalize() ?? null,
      getRunName: () => this.runName,
      getHeldRelicKeys: () => this.relicSystem?.heldKeys() ?? [],
      getEnteredHealingCircle: () => this.hazardZones?.didEnterHealingCircle() ?? false,
      getBiomesVisited: () => this.biomeController?.getBiomesVisited() ?? [],
      getEvolvedWeaponCount: () => this.weaponSystem?.getEvolvedWeaponCount() ?? 0,
      areSeasonalEventsDisabled: () => this.settingsManager.load().disableSeasonalEvents,
    });

    // T401 P3 — replay-aware wrapper for the run-end persistence pair.
    // `isReplayPlayback` reads `this.replayInput` at call time, NOT at
    // construction, so the gate stays correct even though the
    // coordinator is built before all of create() has run.
    this.runPersistenceCoordinator = new RunPersistenceCoordinator({
      isReplayPlayback: () => this.replayInput !== null,
      getHistoryRecorder: () => this.runHistoryRecorder,
      recordRun,
      loadSave,
    });

    if (resumeRun) {
      this.runPersistence.applyResume(resumeRun);
    }

    // T131 save-failure listener now installed via wireSceneEventBus
    // alongside the rest of the run-scoped global-bus subscriptions
    // (this.eventBusDispose lifecycle); see call below.

    // Upgrade card UI
    this.upgradeUI = new UpgradeCardsUI(this, (card) => this.levelUpFlow.apply(card), this.updateTickers);
    this.upgradeUI.setRerollCallback(() => this.levelUpFlow.reroll());
    this.upgradeUI.setVariantKey(this.activeVariant.key);

    // Enemy kill cascade: XP gem, elite chain, juice, drops, boss celebration,
    // victory trigger. Hooks use lazy getters so pickupSpawner / runLifecycle
    // (constructed below) resolve at handle-time, not now.
    this.enemyKillHandler = new EnemyKillHandler({
      getPlayer: () => this.player,
      getJuice: () => this.juice,
      getXPSystem: () => this.xpSystem,
      getSpawnSystem: () => this.spawnSystem,
      getBanter: () => this.banter,
      getPickupSpawner: () => this.pickupSpawner,
      getUpdateTickers: () => this.updateTickers,
      getSFXManager: () => this.getSFXManager(),
      getRunRng: () => this.runRng,
      getActiveVariantKey: () => this.activeVariant?.key,
      getRunScore: () => this.runScore,
      triggerVictory: () => this.runLifecycle.handleVictory(),
      onActComplete: (actN) => this.launchActIntermission(actN),
      onStretchComplete: (stretch) => this.initNodeMapForAct(3, stretch),
      onBottleBreak: (x, y) => this.hazardZones.spawnBottleSlick(x, y),
      onTotemFall: (x, y) => {
        // Four slicks at the cardinals, offset so the totem kill site is
        // walkable — player shouldn't be trapped by the burst they caused.
        const offset = 32;
        this.hazardZones.spawnBottleSlick(x - offset, y);
        this.hazardZones.spawnBottleSlick(x + offset, y);
        this.hazardZones.spawnBottleSlick(x, y - offset);
        this.hazardZones.spawnBottleSlick(x, y + offset);
      },
      onHaarDispel: (x, y) => this.hazardZones.spawnHaarFog(x, y),
      onTouristPhotographed: (x, y) => this.pickupSpawner.spawnPolaroid(x, y),
      onEliteKilled: (x, y) => this.relicOrchestrator.rollAndSpawn('elite', x, y),
      onBossKilled: (bossKey, x, y) => {
        // H1 M2 T15 — persist per-boss kill counts for the Croft
        // mantelpiece trophy tiers. Cursed-run kills also promote the
        // cursed tier regardless of whether the run ends in victory.
        bumpBossKillCount(bossKey);
        if (this.activeCurseKey) bumpCursedVictoryByBoss(bossKey);
        this.relicOrchestrator.rollAndSpawn('boss', x, y, bossKey);
      },
      modifyLifesteal: (base) => this.relicEffectDriver?.modifyLifesteal(base, this.time.now) ?? base,
      modifyXpGain: (base) => this.relicEffectDriver?.modifyXpGain(base) ?? base,
      tryCairnStoneMagnet: (x, y) => {
        // R1 M4.5 P1 — heather-biome kills grant a short pickup-magnet
        // pulse, reusing the ceilidh-chain buff path (flat radius +
        // duration). Cooldown lives inside the driver.
        const driver = this.relicEffectDriver;
        if (!driver) return;
        const biome = this.getBiomeManager()?.biomeAt(x, y);
        if (biome !== 'heather') return;
        if (!driver.tryCairnStoneHeatherKill(this.time.now)) return;
        this.player.grantCeilidhChainMagnet(40, 2000);
      },
    });
    wireWeaponSystemListeners({
      weaponSystem: this.weaponSystem,
      enemyKillHandler: this.enemyKillHandler,
      player: this.player,
      // Lazy: `this.juice` / `this.hud` are constructed ~65 lines below
      // (`new HUD` + `new JuiceSystem`). Direct refs would capture
      // undefined at wire time and throw on the first damageDealt event.
      getJuice: () => this.juice,
      getHud: () => this.hud,
      runStatsTracker: this.runStatsTracker,
      runeBag: this.runeBag,
      getSFXManager: () => this.getSFXManager(),
    });

    wireXpSystemListeners({
      xpSystem: this.xpSystem,
      // Lazy: `this.levelUpFlow` is constructed ~150 lines below.
      // Direct ref would capture undefined and throw on first levelup.
      getLevelUpFlow: () => this.levelUpFlow,
      player: this.player,
      getBanter: () => this.banter,
      getActiveVariantKey: () => this.activeVariant?.key,
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
    });

    // Player ↔ Enemy collision
    // Player ↔ Enemy overlap → PlayerHitResolver.handle (full cascade).
    // Hooks use lazy getters so this resolver safely references systems
    // (juice, runLifecycle) that may still be constructing below.
    this.playerHitResolver = new PlayerHitResolver({
      getPlayer: () => this.player,
      getJuice: () => this.juice,
      getSpawnSystem: () => this.spawnSystem,
      getTimeManager: () => this.timeManager,
      getDeathCauseTracker: () => this.deathCauseTracker,
      getIFrameController: () => this.iFrameController,
      getFloatTextPool: () => this.floatTextPool,
      getRunModifiers: () => this.runModifiers,
      getCamera: () => this.cameras.main,
      getTweens: () => this.tweens,
      getSettingsManager: () => this.settingsManager,
      isVictoryPending: () => this.runScore.victoryPending,
      onAfterNonFatalHit: (hpBefore) => {
        // R1 M4 — stamp clootie_rag lifesteal-double window + reset
        // grans_teapot damage-free timer on every hit the haggis
        // survives. Fatal hits skip: no run remains to collect on.
        this.relicEffectDriver?.noteDamageTaken(this.time.now);
        this.tryMoorMercyLuck(hpBefore);
      },
      armIFrames: (ms) => this.armIFrames(ms),
      onPlayerKilled: () => this.runLifecycle.onPlayerHitZero(),
      modifyEnemyContactDamage: (base, enemyKey) => {
        // R1 M4 — midgie_repellent zeroes midge-swarm damage.
        if (enemyKey === 'midge' && this.relicEffectDriver?.isMidgieSwarmImmune()) {
          return 0;
        }
        return base;
      },
    });
    this.playerEnemyCollider = this.physics.add.overlap(
      this.player,
      this.spawnSystem.getEnemyGroup(),
      (_playerObj, enemyObj) => this.playerHitResolver.handle(
        enemyObj as Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
      ),
      undefined,
      this,
    );

    // HUD + Juice
    this.hud = new HUD(this);
    this.juice = new JuiceSystem(this, this.timeManager, this.updateTickers, this.settingsManager);
    // Banter sits downstream of juice (toast surface) + captions. It reads
    // banterFrequency live on every request so the Comfort panel toggle
    // takes effect without a scene restart. Reset history now so the
    // prior run's no-repeat buffer doesn't leak into this one.
    if (!this.banter) {
      this.banter = new BanterSystem({
        sink: {
          toast: (m, c) => this.juice.showToast(m, c),
          caption: (id, m, tint) => this.caption(id, m, tint),
        },
        translate: t,
        now: () => this.time.now,
        getFrequency: () => getSettingsManager().load().banterFrequency,
        // C1 M4 Task 19 — route every fired line into the Almanac's
        // Banter book via the shared save bump helper.
        onLineFired: (evt) => bumpBanterHeard(evt.key, this.discoveryRunId(), Date.now()),
      });
    }
    this.banter.reset();
    // Curse pact — one hearth line after the HUD settles (soul weave: run start).
    if (this.activeCurseKey) {
      const curseTag = this.activeCurseKey;
      this.time.delayedCall(1200, () => {
        this.banter?.request('curse_start', { tag: curseTag });
      });
    }
    // B1 Phase 2 + E1 M2 T9/T10 — Gran's opening wink, Burns Night
    // stinger swap, and Burns Night haggis-platter spawn schedule.
    // Extracted to runStartCeremony.ts (T401) so the gating + scheduling
    // contract is testable without booting Phaser.
    installRunStartCeremony({
      isReplayPlayback: !!this.replayInput,
      isResume: !!resumeRun,
      activeCurseKey: this.activeCurseKey,
      disableSeasonalEvents: this.settingsManager.load().disableSeasonalEvents,
      now: new Date(),
      scheduleSceneDelay: (ms, cb) => { this.time.delayedCall(ms, cb); },
      getBurnsPlatterSpawned: () => this.burnsPlatterSpawned,
      setBurnsPlatterSpawned: () => { this.burnsPlatterSpawned = true; },
      getPickupSpawner: () => this.pickupSpawner ?? null,
      banter: this.banter,
      audio,
    });
    // Ambient weather — purely cosmetic seasonal overlay. Idle when no
    // event is active or `disableSeasonalEvents` / `reduceParticles` is on.
    this.weather?.stop();
    this.weather = new AmbientWeatherSystem(this);
    this.weather.start();
    this.events.once('shutdown', () => { this.weather?.stop(); this.weather = null; });
    // Environmental hazards — biome-conditioned, damages player on overlap.
    // Honours `disableHazards` setting (defaults enabled when absent).
    this.hazards?.stop();
    this.hazards = new HazardsSystem(
      this,
      () => this.player ?? null,
      () => this.getCurrentBiomeId(),
      () => this.runRng,
      () => this.iFrameController.isActive(),
    );
    this.hazards.start();
    this.events.once('shutdown', () => { this.hazards?.stop(); this.hazards = null; });
    this.gameTickers = new GameTickers({
      getPlayer: () => this.player,
      getScene: () => this,
      getUiViewport: () => this.getUiViewport(),
      getBanter: () => this.banter,
      getCurrentBiomeId: () => this.getCurrentBiomeId(),
      getActiveVariantKey: () => this.activeVariant.key,
      hasEnemyNearby: (radiusPx) => this.hasEnemyNearby(radiusPx),
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
    });
    // R1 — Phaser-bound Relic pickup spawner. Constructed fresh each
    // run because the spawner holds a live reference set that must
    // not survive a scene restart (stale sprites would leak). The
    // orchestrator owns the spawner + onCollect routing internally.
    this.relicOrchestrator.attachSpawner();
    this.pickupSpawner = new PickupSpawner(this, {
      getPlayer: () => this.player,
      getJuice: () => this.juice,
      getXPSystem: () => this.xpSystem,
      getUpdateTickers: () => this.updateTickers,
      getSFXManager: () => this.getSFXManager(),
      getChestDurationBonusMs: () => this.chestDurationBonusMs,
      onCoinCollected: (amount) => {
        // R1 M3 T20b — sporran_of_holding grants +2 per gold pickup.
        this.runScore.addCoinGold(this.relicEffectDriver.modifyGoldPickup(amount));
      },
      trackChest: (s, g) => this.chestRegistry.track(s, g),
      untrackChest: (s) => this.chestRegistry.untrack(s),
      pushDespawnHandle: (h) => { this.pickupDespawnHandles.push(h); },
      offerTreasureEvolutionIfEligible: () => this.levelUpFlow.offerChestEvolution(),
      acquireFloatText: (x, y, str, color, fs, d) => this.floatTextPool.acquire(x, y, str, color, fs, d),
      modifyHealOrbAmount: (a) => this.relicEffectDriver.modifyHealOnOrb(a),
      onBurnsPlatterCollect: () => this.runeSystemController.onBurnsPlatterCollect(),
    });
    this.levelUpFlow = new LevelUpFlow(this, {
      getPlayer: () => this.player,
      getWeaponSystem: () => this.weaponSystem,
      getXPSystem: () => this.xpSystem,
      getSpawnSystem: () => this.spawnSystem,
      getJuice: () => this.juice,
      getStatusFxPool: () => this.statusFxPool,
      getTutorialSystem: () => this.tutorialSystem,
      getTimeManager: () => this.timeManager,
      getUpgradeUI: () => this.upgradeUI,
      getRunRng: () => this.runRng,
      getOwnedPassives: () => this.ownedPassives,
      pushOwnedPassive: (key) => { this.ownedPassives.push(key); },
      getEvolvedWeapons: () => this.evolvedWeapons,
      pushEvolvedWeapon: (key) => { this.evolvedWeapons.push(key); },
      getAnnouncedEvolutionReady: () => this.announcedEvolutionReady,
      addKill: (n = 1) => {
        // W71 Phase 2 — loop through incrementKillCount so onKillsChanged
        // fires for each tallied kill. Direct `killCount += n` would bypass
        // the notifier and leave the mantle-tier wiring stale after
        // level-up cards like "destroy N nearest enemies."
        for (let i = 0; i < n; i++) this.runScore.incrementKillCount();
      },
      getUiViewport: () => this.getUiViewport(),
      armIFrames: (ms) => this.armIFrames(ms),
      drainPendingChests: () => this.drainPendingChests(),
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
      requestBanter: (ctx, tag) => this.requestBanter(ctx, tag),
      getDiscoveryRunId: () => this.discoveryRunId(),
      tryChestLegendaryRelicOverride: () => this.relicOrchestrator.tryChestOverride(),
      getRelicLuckPoints: () => this.relicEffectDriver?.luckDrawPoints() ?? 0,
      isBossKilledThisRun: () => this.runScore.bossKillCount > 0,
      getOwnedRuneIds: () => this.ownedRuneIds,
      grantRune: (runeId) => this.grantRune(runeId),
      // Phase B Endless — Overcharge mythic-tier card hooks.
      isPostBell: () => this.runLifecycle?.isPostBell() ?? false,
      getOverchargedWeaponKeys: () => this.weaponSystem.getOverchargedKeys(),
    });
    this.runLifecycle = new RunLifecycle(this, {
      getPlayer: () => this.player,
      getSpawnSystem: () => this.spawnSystem,
      getXPSystem: () => this.xpSystem,
      getJuice: () => this.juice,
      getTimeManager: () => this.timeManager,
      getSaveManager: () => this.metaSaveManager,
      getDeathCauseTracker: () => this.deathCauseTracker,
      getBanter: () => this.banter,
      getSettingsManager: () => this.settingsManager,
      getCamera: () => this.cameras.main,
      getUiViewport: () => this.getUiViewport(),
      getVictoryPending: () => this.runScore.victoryPending,
      setVictoryPending: (v) => { this.runScore.victoryPending = v; },
      invalidatePendingVictoryTicker: () => { this.runScore.nextVictoryDelayGen(); },
      getRevivalAvailable: () => this.revivalAvailable,
      setRevivalAvailable: (v) => { this.revivalAvailable = v; },
      getVictoryFade: () => this.victoryFade,
      setVictoryFade: (r) => { this.victoryFade = r; },
      getDeathFade: () => this.deathFade,
      setDeathFade: (r) => { this.deathFade = r; },
      setVictoryResultTicker: (ms, cb) => this.runEndTickers.armVictoryResultOverlay(ms, cb),
      setDeathResultTicker: (ms, cb) => this.runEndTickers.armDeathResultOverlay(ms, cb),
      setVictoryDeferMs: (ms) => this.runEndTickers.armVictoryDefer(ms, () => this.runLifecycle.handleVictory()),
      armIFrames: (ms) => this.armIFrames(ms),
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
      buildRunSummary: (victory) => this.runExit.buildSummary(victory),
      buildRunHistoryContext: () => this.runHistoryRecorder.buildContext(),
      buildGameOverPayload: (mode, s, r, pb, dc) => this.runExit.buildGameOverPayload(mode, s, r, pb, dc),
      // T307 + T1 replay — replay-aware wrappers live on
      // `runPersistenceCoordinator`. During playback both calls no-op
      // (recordToHistory) or return a no-pollution RunResult (recordRun)
      // so a replay run can't double-count Chronicle attempts or write
      // duplicate gold/variant unlocks.
      recordToHistory: (s, r) => this.runPersistenceCoordinator.recordToHistory(s, r),
      recordRun: (s, ctx) => this.runPersistenceCoordinator.recordRun(s, ctx),
      transitionToGameOver: (payload) => this.runExit.transitionToGameOver(payload),
      onActComplete: (actN) => this.launchActIntermission(actN),
      isIronmoorRun: () => this.activeIronmoorRun,
    });
    this.juice.setResumeBestCombo(resumeRun?.bestCombo);
    this.juice.setResumeComboState(resumeRun?.comboCount, resumeRun?.comboTimerMs);
    this.showRunIdentityToast(Boolean(resumeRun));
    showRunIntroToasts({
      scene: this,
      replayInput: this.replayInput,
      juice: this.juice,
      hud: this.hud,
      loadMetaSave: () => this.metaSaveManager.load(),
      getJuice: () => this.getJuice() ?? null,
    });

    this.eventBusDispose?.();
    this.eventBusDispose = wireSceneEventBus({
      getJuice: () => this.juice,
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
    });
    this.edgeIndicators = new EdgeIndicators(this);
    this.minimap = new Minimap(this);
    // Phase B Biomes — paint biome regions on the minimap.
    this.minimap.setBiomeManager(this.getBiomeManager());
    // T401 slice 7 — node-map lifecycle install (UIs + trigger listener).
    // Order is load-bearing: UIs constructed + setters fire BEFORE the
    // trigger listener registers, because the listener body reads
    // `this.interactivePromptIndex` and dispatches to handlers that may
    // open `this.nodePromptUI` — both fields must be set first.
    installNodeMap({
      scene: this,
      nodeMapSystem: this.nodeMapSystem,
      nodeWaveTracker: this.nodeWaveTracker,
      setNodeMapUI: (ui) => { this.nodeMapUI = ui; },
      setNodePromptUI: (ui) => { this.nodePromptUI = ui; },
      onNodeTrigger: (index, state) => {
        if (state.visited[index]) return false;
        // Block re-trigger while an interactive prompt is already resolving.
        if (this.interactivePromptIndex >= 0) return false;
        dispatchNodeTrigger(
          {
            player: this.player,
            runRng: this.runRng,
            runScore: this.runScore,
            runModifiers: this.runModifiers,
            tempBuffBag: this.tempBuffBag,
            ownedPassives: this.ownedPassives,
            nodeWaveTracker: this.nodeWaveTracker,
            spawnSystem: this.spawnSystem,
            relicSystem: this.relicSystem,
            relicPickupSpawner: this.relicPickupSpawner,
            weaponSystem: this.weaponSystem,
            xpSystem: this.xpSystem,
            upgradeUI: this.upgradeUI,
            levelUpFlow: this.levelUpFlow,
            juice: this.juice,
            timeManager: this.timeManager,
            nodePromptUI: this.nodePromptUI,
            peekReplayChoiceFor: (k) => peekReplayChoiceForHelper(this.replayInput, k),
            setInteractivePromptIndex: (n) => { this.interactivePromptIndex = n; },
            finalizeNodeVisit: (i, k, c) => finalizeNodeVisitHelper(
              {
                nodeMap: this.nodeMapSystem,
                runActState: this.runActState,
                replayRecorder: this.replayRecorder,
                replayInput: this.replayInput,
                clock: this.spawnSystem,
              },
              i,
              k,
              c,
            ),
          },
          state.nodes[index],
          index,
          state,
        );
        return true;
      },
    });
    const resumeNodeTarget = resolveResumeNodeMapTarget(
      this.runActState.currentAct,
      this.spawnSystem.getSpawnedBossKeys(),
    );
    this.initNodeMapForAct(resumeNodeTarget.act, resumeNodeTarget.stretch);
    this.relicSlotUI?.destroy();
    this.relicSlotUI = new RelicSlotUI(this, {
      getHeldSlots: () => this.relicSystem.getSlots().map((s) => s.def),
    });
    this.hud.setOnPause(() => this.toggleUiPause());

    this.debugOverlay = new DebugOverlay(this, {
      spawnSystem: this.spawnSystem,
      weaponSystem: this.weaponSystem,
      timeManager: this.timeManager,
      xpSystem: this.xpSystem,
      statusFxPool: this.statusFxPool,
      musicEngine,
    });

    this.tutorialSystem = new TutorialSystem(this, this.metaSaveManager);
    // FTUE start is deferred to the countdown's onComplete (see showCountdown
    // call below) — fixes P1.10: depth-1000 countdown text was rendering on
    // top of the depth-600 FTUE banner, hiding the tutorial copy on first run.

    this.debugTimeTravelApi.install();
    this.runPersistence.registerMidRunHooks();

    getAnalyticsManager().beginGameplaySession({
      variantKey: this.activeVariant.key,
      ironmoor: this.activeIronmoorRun,
      curseKey: this.activeCurseKey,
      isDaily: this.runIsDaily,
    });
    this.gameplaySessionGuard.markStarted();

    const prefs = this.settingsManager.load();
    applyAudioFromUserSettings(prefs);
    audio.fadeOutAmbientWind(800);
    if (prefs.musicVolume > 0.001) {
      musicEngine.start();
    }

    // Treasure chest timer — 45s interval; 20% golden; queued while paused.
    this.pendingChests = [];
    installTreasureChestTimer(this.updateTickers, {
      getRunRng: () => this.runRng,
      getTimeManager: () => this.timeManager,
      getPickupSpawner: () => this.pickupSpawner,
      enqueuePendingChest: (chest) => { this.pendingChests.push(chest); },
    });

    wireSceneKeybindings(this.input.keyboard, this.subs, {
      togglePause: () => this.toggleUiPause(),
      getDebugOverlay: () => this.debugOverlay,
      saveClipF9: () => this.handleF9SaveClip(),
      saveScreenshotF10: () => this.handleF10Screenshot(),
    });

    // Run-intro ceremony — fade in from black + controls hint auto-hide.
    installRunIntroFx(this, this.updateTickers, () => this.getUiViewport());

    // Ancestral Echo — if last run died recently, spawn a spectral
    // haggis at the death spot. Skipped on resume so the echo only
    // marks the NEXT fresh run after a death.
    if (!resumeRun) {
      this.trySpawnAncestralEcho();
    }

    this.filmGrain?.destroy();
    this.filmGrain = new FilmGrainOverlay(this, this.settingsManager, () => this.getUiViewport());
    this.filmGrain.install();
    this.filmGrain.bindViewportResize();

    this.clipRecorder = installClipRecorder({
      enabled: getSettingsManager().load().captureEnabled,
      canvas: this.game.canvas ?? null,
    });

    // Start countdown — game is paused until it finishes. FTUE banner waits
    // for countdown to clear so the depth-1000 countdown text doesn't sit on
    // top of the depth-600 FTUE overlay (P1.10).
    this.timeManager.request('COUNTDOWN', { pausePhysics: true, timeScale: 0 });
    const startFtue = () => this.tutorialSystem.startRunIfNeeded({ resumeRun: Boolean(resumeRun) });
    showCountdown(this, this.timeManager, this.updateTickers, () => this.getUiViewport(), startFtue);

    // Wire kill count → mantle tier. Pre-seeds from current killCount so
    // replays and save-mid-run starts at the correct tier without a tween.
    this.wireMantleTier();

    // Resume is now "committed": replace old suspended snapshot with a fresh one.
    finalizeResumeStartup(resumeRun, () => this.runPersistence.persist());
  }

  private registerShutdownCleanup(): void {
    // Clean up on scene shutdown (prevents stale timers/listeners on restart).
    // Body extracted to `installRunEndShutdown` (T401 slice 6) — every
    // silenced-catch is preserved one-for-one in the helper so partial-init
    // failures cannot short-circuit the shutdown sequence.
    installRunEndShutdown({
      scene: this,
      clipRecorder: this.clipRecorder,
      setClipRecorder: (next) => { this.clipRecorder = next; },
      disposeRecordingAudioStream,
      uninstallAutoBattleTimeScale,
      gameplaySessionGuard: this.gameplaySessionGuard,
      playerEnemyCollider: this.playerEnemyCollider,
      setPlayerEnemyCollider: (next) => { this.playerEnemyCollider = next; },
      clearSfx: () => sfxManager.clear(),
      resetAudioTransient: () => audio.resetTransient(),
      eventBusDispose: this.eventBusDispose,
      setEventBusDispose: (next) => { this.eventBusDispose = next; },
      runPersistence: this.runPersistence,
      debugTimeTravelApi: this.debugTimeTravelApi,
      subs: this.subs,
      debugOverlay: this.debugOverlay,
      setDebugOverlay: (next) => { this.debugOverlay = next; },
      runLifecycle: this.runLifecycle,
      biomeController: this.biomeController,
      setBiomeController: (next) => { this.biomeController = next; },
      setHaarFog: (next) => { this.haarFog = next; },
      floraScatter: this.floraScatter,
      setFloraScatter: (next) => { this.floraScatter = next; },
      wildlifeSystem: this.wildlifeSystem,
      setWildlifeSystem: (next) => { this.wildlifeSystem = next; },
      mistLayer: this.mistLayer,
      setMistLayer: (next) => { this.mistLayer = next; },
      captionOverlay: this.captionOverlay,
      setCaptionOverlay: (next) => { this.captionOverlay = next; },
      captionManager: this.captionManager,
      setCaptionManager: (next) => { this.captionManager = next; },
      weaponSystem: this.weaponSystem,
      xpSystem: this.xpSystem,
      updateTickers: this.updateTickers,
      timeManager: this.timeManager,
      spawnSystem: this.spawnSystem,
      tutorialSystem: this.tutorialSystem,
      statusFxPool: this.statusFxPool,
      floatTextPool: this.floatTextPool,
      juice: this.juice,
      hud: this.hud,
      minimap: this.minimap,
      nodeMapUI: this.nodeMapUI,
      setNodeMapUI: (next) => { this.nodeMapUI = next; },
      nodePromptUI: this.nodePromptUI,
      setNodePromptUI: (next) => { this.nodePromptUI = next; },
      setInteractivePromptIndex: (next) => { this.interactivePromptIndex = next; },
      nodeMapSystem: this.nodeMapSystem,
      nodeWaveTracker: this.nodeWaveTracker,
      edgeIndicators: this.edgeIndicators,
      upgradeUI: this.upgradeUI,
      gameTickers: this.gameTickers,
      pauseMenu: this.pauseMenu,
      setPauseMenu: (next) => { this.pauseMenu = next; },
      chestRegistry: this.chestRegistry,
      victoryFade: this.victoryFade,
      setVictoryFade: (next) => { this.victoryFade = next; },
      deathFade: this.deathFade,
      setDeathFade: (next) => { this.deathFade = next; },
      filmGrain: this.filmGrain,
      setFilmGrain: (next) => { this.filmGrain = next; },
    });
    this.events.once('shutdown', () => this.nodeMarkerSystem.destroy());
  }

  private wireMantleTier(): void {
    const motionScale = this.settingsManager.load().motionScale;
    const instantForComfort = motionScale === 0;
    // Pre-seed from current kill count so replays / save-mid-run starts
    // at the correct tier without a reveal tween.
    this.player.setMantleTier(
      computeMantleTier(this.runScore.killCount),
      { instant: true },
    );
    this.runScore.onKillsChanged = (kills: number) => {
      const nextTier = computeMantleTier(kills);
      if (nextTier === this.player.getMantleTier()) return;
      this.player.setMantleTier(nextTier, { instant: instantForComfort });
    };
  }

  update(_time: number, delta: number): void {
    // Cap delta to prevent time warps from tab-backgrounding (browser throttles
    // requestAnimationFrame to ~1fps when backgrounded, producing huge deltas on return)
    delta = Math.min(delta, 100);

    try {
      this.updateInner(delta);
    } finally {
      // T1 replay — capture one frame per tick regardless of pause state.
      // Pump in `replayBridgeInstall.ts`.
      recordReplayFrame({
        recorder: this.replayRecorder,
        snapshot: this.player ? this.player.peekReplayInputFrame() : null,
        dtMs: delta,
      });
    }
  }

  private updateInner(delta: number): void {
    // T1 replay playback — advance the recorded cursor each tick before
    // Player reads input. Pump in `replayBridgeInstall.ts`.
    if (tickReplayPlayback({ replayInput: this.replayInput }).exhausted) {
      this.scene.start('Chronicle');
      return;
    }

    // Gamepad Start / Options — same pause stack as ESC / P (see `toggleUiPause` guards).
    if (this.player.consumePauseMenuEdge()) {
      this.toggleUiPause();
    }

    this.timeManager.update(delta);

    // Raw tickers always advance (UI/run-end domain)
    this.updateTickers.tickRaw(delta);
    this.debugOverlay?.update(delta);
    // Captions tick on raw delta so they keep fading during pause / run-end.
    this.captionOverlay?.update(delta);

    // Scaled tickers freeze whenever gameplay is paused (including HIT_FREEZE which pauses physics
    // without mutating timeScale).
    const scaledDelta = this.timeManager.isGameplayPaused()
      ? 0
      : delta * this.timeManager.getEffectiveTimeScale();
    this.updateTickers.tickScaled(scaledDelta);

    this.iFrameController.tick(scaledDelta);
    this.runEndTickers.tick(delta);

    // M1 F4 — shrine-granted timed buffs. Ticks on scaledDelta so pause
    // / HIT_FREEZE / slow-mo freeze the countdown the same way they
    // freeze XP collection and spawn timing; a paused buff at 12s
    // remaining stays at 12s until play resumes.
    this.tempBuffBag.tick(scaledDelta);

    // U1 Task 14 — rune condition tick. Evaluate each active rune against
    // a fresh context built from live scene state; transitions fire
    // apply/remove on the shared runeBag which Player / WeaponSystem read.
    this.runeSystemController.tick(delta);

    // M1 F1+F2 — poll pending encounter/elite waves every frame (raw
    // bookkeeping; must tick regardless of the pause early-return below
    // so a wave that resolved during a COUNTDOWN / pause window still
    // finalizes the node).
    this.nodeWaveTracker.tick();

    tickAutoBattleSteering(this.player, this.xpSystem, this.spawnSystem);

    // Dev-only: top-up entity pools + sample FPS when stress test is active.
    tickStressTest(this);

    if (this.timeManager.isGameplayPaused()) return;

    // Advance the "last time player was healthy" pointer — feeds the
    // low_hp_neglect classifier. Only tracks game-time, not wall-clock, so
    // a long pause doesn't incorrectly age the player's health state.
    this.deathCauseTracker.tickHealthyPointer(
      this.spawnSystem.getGameTimeSec(),
      this.player.getHp(),
      this.player.getMaxHp(),
    );

    this.hazardZones.tick(scaledDelta);
    if (this.haarFog) this.haarFog.advanceTime(delta * 0.001);
    if (this.biomeController) {
      this.biomeController.tick(this.player, this.juice);
      // Phase B Endless — fresh voronoi every 3 min past the bell so
      // the world keeps shifting under a player who refuses to leave.
      const sec = this.runLifecycle?.getSecondsPastBell() ?? 0;
      if (sec > 0) {
        if (this.postBellLastReseedSec < 0) this.postBellLastReseedSec = 0;
        if (shouldReseedAtSec(sec, this.postBellLastReseedSec)) {
          this.postBellLastReseedSec = sec;
          this.biomeController.reseed(this, this.getRunRng(), GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT);
          this.minimap?.setBiomeManager(this.getBiomeManager());
          this.juice.showToast(t('ui.gameOver.post_bell_reseed'), '#aa66dd');
        }
      }
    }
    this.floraScatter?.update(scaledDelta, this.cameras.main);
    this.wildlifeSystem?.update(scaledDelta, this.player.x, this.player.y);
    this.mistLayer?.update(scaledDelta, GAME.WORLD_WIDTH);
    this.gameTickers.tickLowHpCaption();
    this.gameTickers.tickBanter();
    // Player input/movement stays on raw delta so controls stay snappy during
    // boss-kill slow-motion (the cinematic effect shouldn't rob the player of
    // responsiveness). Game-time systems below use scaledDelta so regen, AI,
    // spawns, cooldowns, and projectile TTLs all slow in lockstep with the
    // visible time-scale.
    this.player.update(delta);
    this.player.tickRegen(scaledDelta);
    tickMantlePulse(this.player, this.spawnSystem, scaledDelta);
    this.spawnSystem.update(scaledDelta, this.player.x, this.player.y);

    // M1 — tick node proximity + refresh HUD widget. Tick fires listener
    // while player is within trigger radius of an un-visited node; the
    // registered listener marks visited + logs outcome + advances cursor.
    this.nodeMapSystem.tick({ x: this.player.x, y: this.player.y });
    this.nodeMapUI?.update(
      this.runActState.currentActNodeMap,
      this.runActState.currentNodeIndex,
    );
    this.nodeMarkerSystem.update(this.runActState.currentNodeIndex, scaledDelta);

    this.lastEmittedRunSecond = tickSecondCounter(
      this.buildSecondTickHookContext(),
      this.lastEmittedRunSecond,
    );

    this.standingStones?.tick();
    this.reliquary?.tick();
    tickRelicEffectFrame({
      scaledDelta,
      player: this.player,
      relicEffectDriver: this.relicEffectDriver ?? null,
      relicSlotUI: this.relicSlotUI,
    });

    if (this.ancestralEcho) {
      const resolved = this.ancestralEcho.tick(scaledDelta);
      if (resolved) this.ancestralEcho = null;
    }

    // Pass player facing — own concern, kept out of the multiplier fold.
    // Always read from `player.rotation` (persists when stationary) so
    // directional weapons like arc_sweep don't use a stale angle.
    this.weaponSystem.setPlayerFacing(this.player.rotation - Math.PI / 2);
    applyWeaponMultiplierFold({
      player: this.player,
      juice: this.juice,
      weaponSystem: this.weaponSystem,
      runeBag: this.runeBag,
      relicEffectDriver: this.relicEffectDriver,
      timeNowMs: this.time.now,
      burnsPlatterPickedUpAtMs: this.burnsPlatterPickedUpAtMs,
    });
    this.weaponSystem.update(scaledDelta, this.player.x, this.player.y);

    // R1 M4.5 P5 — tick live Fianna summons + sweep expired. Use
    // scaledDelta so slow-mo shortens the spirits' effective lifetime
    // in lockstep with every other timed effect.
    this.relicOrchestrator.tickFiannaSpirits(scaledDelta);

    this.xpSystem.update(this.player.x, this.player.y, this.player.getPickupRadius(), this.player.getHpFraction());
    // Juice is cosmetic (shake, combo toasts, damage numbers) — stays on raw
    // delta so VFX don't stall during slow-mo and the combo meter still decays
    // at wall-clock rate.
    this.juice.update(delta, this.player.getHpFraction());
    // Ambient weather likewise stays on raw delta — sky is sky.
    this.weather?.update(delta);
    // Hazards run on raw delta too — environment is environment.
    this.hazards?.update(delta);

    // Boss HP bar + edge indicators
    this.bossHpTracker.tick();
    this.edgeIndicators.update(this.player.x, this.player.y, this.spawnSystem.getEnemyGroup());
    // R1 M4.5 P2 — pictish_compass surfaces live relic pickup pins on
    // the minimap. Gated on isHolding so non-holders see no change.
    const relicPins =
      this.relicEffectDriver?.isHolding('pictish_compass') && this.relicPickupSpawner
        ? this.relicPickupSpawner.getActivePickupPositions()
        : [];
    this.minimap.update(
      this.player.x,
      this.player.y,
      this.spawnSystem.getEnemyGroup(),
      this.chestRegistry.getMarkers(),
      this.player.rotation,
      this.reliquary?.getMinimapMarker() ?? null,
      relicPins,
    );
    const biomeId = this.getCurrentBiomeId();
    updateMusicStateScratch(
      this.musicStateScratch,
      this.player,
      this.spawnSystem,
      this.juice,
      this.runScore.killCount,
      biomeId ? BIOMES[biomeId].moodTimbre : 0.45,
      (this.weaponSystem.getWeapons().length + this.ownedPassives.length) / 17,
    );
    musicEngine.update(delta, this.musicStateScratch);

    // Dash cooldown indicator (small arc under player)
    this.gameTickers.updateDashIndicator();

    // World boundary warning — red tint when near edges
    this.gameTickers.updateBoundaryWarning();

    updateRunHudFrame({
      delta,
      hud: this.hud,
      player: this.player,
      xpSystem: this.xpSystem,
      spawnSystem: this.spawnSystem,
      weaponRows: this.hudWeaponScratch,
      weapons: this.weaponSystem.getWeapons(),
      ownedPassives: this.ownedPassives,
      killCount: this.runScore.killCount,
      currentAct: this.runActState.currentAct,
      ironmoor: this.activeIronmoorRun,
      daily: this.runIsDaily,
      seedCode: this.getRunSeedCode(),
      goldBalance: this.runScore.getGoldBalance(),
      activeCurseKey: this.activeCurseKey,
      beforeUpdate: () => {
        // Drift Mastery pip widget — surface the banked Grip count +
        // flash the strip on burst-fire. Hidden until first bank so
        // the widget doesn't clutter the HUD before the mechanic's
        // been earned.
        const driftState = this.player.getDriftMasteryState();
        this.hud.setGripPips(driftState.pips, driftState.burstRemainingMs > 0);
        // Whisky Breath stack readout — bar fills with stacks; ready
        // state (>= BREATH_STACKS_REQUIRED) pulses the bar to signal
        // "press W".
        const whiskyState = this.player.getWhiskyBreathState();
        this.hud.setWhiskyStacks(
          whiskyState.stacks,
          WHISKY_STACKS_MAX,
          isBreathReady(whiskyState),
        );
      },
    });
  }

  armIFrames(durationMs: number): void {
    this.iFrameController.arm(durationMs);
  }

  private toggleUiPause(): void {
    // Gated on any other modal that owns time — see pauseGate for the set.
    if (!canOpenPauseMenu((tok) => this.timeManager.has(tok))) return;

    if (this.timeManager.has('UI_PAUSE')) {
      this.timeManager.release('UI_PAUSE');
      this.pauseMenu?.close();
      // Spawn deferred treasure chests queued during pause
      this.drainPendingChests();
    } else {
      this.timeManager.request('UI_PAUSE', { pausePhysics: true, timeScale: 0 });
      if (!this.pauseMenu) {
        this.pauseMenu = new PauseMenu(this, {
          getUiViewport: () => this.getUiViewport(),
          getGameTimeSec: () => this.spawnSystem.getGameTimeSec(),
          getKillCount: () => this.runScore.killCount,
          getLevel: () => this.xpSystem.getLevel(),
          getEquippedWeaponCount: () => this.weaponSystem.getWeapons().length,
          getOwnedPassives: () => this.ownedPassives,
          getActiveCurseLine: () => formatHudCurseChipLine(this.activeCurseKey),
          getRunGoldEarned: () => this.runScore.coinGoldEarned,
          getKillStreakStats: () => ({
            current: this.juice.getComboCount(),
            best: this.juice.getBestCombo(),
          }),
          getLastHudDps: () => this.hud.getLastDisplayedDps(),
          getRunDamageDealt: () => this.runStatsTracker.getTotalDamage(),
          // T402 — run identity radiator: act, route picks, held relics.
          // Each line in pauseStats only renders when the data is non-
          // default, so the panel stays clean on a fresh act-1 run.
          getCurrentAct: () => this.runActState.currentAct,
          getRouteLabels: () =>
            this.runActState.pickerHistory
              .map((p) => {
                try { return t(getRoute(p.routeKey).labelKey); } catch { return null; }
              })
              .filter((s): s is string => typeof s === 'string'),
          getRelicLabels: () =>
            (this.relicSystem?.getSlots() ?? [])
              .map((s) => s.def?.nameKey)
              .filter((k): k is string => typeof k === 'string')
              .map((k) => t(k)),
          // T402 follow-up — variant label always emitted; pauseStats
          // helper drops the line if the string is empty (default-variant
          // runs render no variant line). Resolves the variant nameKey
          // through `t()` here so the helper stays Phaser-free.
          getVariantLabel: () => {
            try { return t(this.activeVariant.nameKey); } catch { return ''; }
          },
          // T402 follow-up — owned rune ids → display labels. Looks up
          // each id in RUNES; missing keys (forwards-compat for retired
          // ids) drop silently rather than leaking 'runes.missing.name'.
          getRuneLabels: () =>
            this.ownedRuneIds
              .map((id) => RUNES[id]?.nameKey)
              .filter((k): k is string => typeof k === 'string')
              .map((k) => t(k)),
          onResumeRequested: () => this.toggleUiPause(),
          onQuitRequested: () => this.runExit.abandonToMainMenu(),
          isWhiskyDramAvailable: () => this.relicEffectDriver?.isWhiskyDramAvailable() ?? false,
          onWhiskyDramRequested: () => this.relicOrchestrator.activateWhiskyDram(),
          isFingalsHornAvailable: () => this.relicEffectDriver?.isFingalsHornAvailable() ?? false,
          onFingalsHornRequested: () => this.relicOrchestrator.activateFingalsHorn(),
        });
      }
      this.pauseMenu.open();
    }
  }

  // Phase 5 Bucket 3 — moor moments (mercy luck, ancestral echo, standing
  // stones, reliquary, run-identity toast) extracted to
  // `scenes/game/moorMoments.ts`. Methods below are thin delegators so
  // existing call sites keep their `this.tryMoorMercyLuck(...)` /
  // `this.spawnStandingStones(...)` shape.

  private buildSecondTickHookContext(): SecondTickHookContext {
    return {
      spawnSystem: this.spawnSystem,
      juice: this.juice,
      moorMoments: this.moorMoments,
      getStandingStones: () => this.standingStones,
      getReliquary: () => this.reliquary,
      getReliquarySpawnSec: () => this.reliquarySpawnSec,
      getStonesWarned: () => this.stonesWarned,
      markStonesWarned: () => { this.stonesWarned = true; },
      spawnStandingStones: () => this.spawnStandingStones(),
      spawnReliquary: () => this.spawnReliquary(),
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
    };
  }

  private buildMoorMomentsContext(): MoorMomentsContext {
    return {
      scene: this,
      player: this.player,
      juice: this.juice,
      banter: this.banter,
      tutorialSystem: this.tutorialSystem ?? null,
      runRng: this.runRng,
      runScore: this.runScore,
      activeVariant: this.activeVariant,
      discoveryRunId: () => this.discoveryRunId(),
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
    };
  }

  private tryMoorMercyLuck(hpBefore: number): void {
    moorMomentsTryMercyLuck(this.moorMomentsState, this.buildMoorMomentsContext(), hpBefore);
  }

  private trySpawnAncestralEcho(): void {
    const echo = moorMomentsTrySpawnAncestralEcho(
      this.buildMoorMomentsContext(),
      this.ancestralEcho !== null,
    );
    if (echo) this.ancestralEcho = echo;
  }

  private spawnStandingStones(): void {
    if (this.standingStones) return;
    this.standingStones = moorMomentsSpawnStandingStones(this.buildMoorMomentsContext());
  }

  private spawnReliquary(): void {
    if (this.reliquary) return;
    this.reliquary = moorMomentsSpawnReliquary(this.buildMoorMomentsContext());
  }

  private showRunIdentityToast(isResume: boolean): void {
    moorMomentsShowRunIdentityToast(this.buildMoorMomentsContext(), isResume);
  }

  /**
   * W2 Moor Road: called when a boss kill completes an act (gordon → 1,
   * tour_bus → 2). Launches ActIntermissionScene unless Skip Intermissions
   * is enabled in settings — in that case the default route for the slot
   * is applied immediately.
   *
   * Note: scene launch is deferred a tick via scene.time.delayedCall(0, ...)
   * so the kill-handling pipeline can finish cleanly (camera shake, XP gem
   * spawn, banter) before the modal opens.
   */
  /**
   * Roll and install a node-path for the requested act. Generation is
   * seeded off `runRng.branch()` so the same run seed deterministically
   * reproduces the path for replay; positions are placed relative to the
   * player's current position so Act 2/3 paths unfold wherever the
   * player happens to be on the moor when a picker resolves.
   *
   * M1 F6 — when `act === 3`, `stretch` selects which of the three Act 3
   * banks loads (stretch 1 = pre-Laird, 2 = post-Laird, 3 = post-Hunter-
   * General). Default is stretch 1 so entry into Act 3 loads the same
   * bank it always did; mid-act-3 boss kills call this with stretch = 2
   * or 3 to swap the bank and reset the cursor. `RunActState.currentAct`
   * stays 3 across stretch switches — stretch is a sub-state only the
   * bank + cursor care about.
   */
  private initNodeMapForAct(act: 1 | 2 | 3, stretch: Act3Stretch = 1): void {
    // T101 — when the resume hydrate just rebuilt the rolled map from
    // the IRunState snapshot, reuse it instead of re-rolling. The flag
    // is one-shot so later act-3 stretch transitions still roll fresh
    // banks normally.
    if (this.suppressNextNodeMapRoll) {
      this.suppressNextNodeMapRoll = false;
      const restored = this.runActState.currentActNodeMap;
      if (restored && restored.act === act && restored.nodes.length > 0) {
        this.nodeMapSystem.setMap(restored);
        this.nodeMarkerSystem.setMap(this, restored);
        return;
      }
    }
    const bank = act === 3 ? getAct3Bank(stretch) : getActBank(act);
    const rng = this.runRng.branch();
    const nodes = generateNodePath(bank, act, rng);
    const origin = { x: this.player.x, y: this.player.y };
    const positions = placeNodes(nodes.length, origin, rng.branch(), {
      separation: 1000,
      worldBounds: {
        minX: 40,
        minY: 40,
        maxX: GAME.WORLD_WIDTH - 40,
        maxY: GAME.WORLD_HEIGHT - 40,
      },
    });
    const state = buildNodeMapState(act, nodes, positions);
    this.runActState.currentActNodeMap = state;
    this.runActState.currentNodeIndex = 0;
    this.nodeMapSystem.setMap(state);
    this.nodeMarkerSystem.setMap(this, state);
  }

  private launchActIntermission(actN: 1 | 2): void {
    launchActIntermissionImpl(
      {
        scene: this,
        spawnSystem: this.spawnSystem,
        weaponSystem: this.weaponSystem,
        timeManager: this.timeManager,
        juice: this.juice,
        banter: this.banter,
        settingsManager: this.settingsManager,
        runActState: this.runActState,
        runModifiers: this.runModifiers,
        replayRecorder: this.replayRecorder,
        pendingReplayRoutes: this.pendingReplayRoutes,
        caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
        discoveryRunId: () => this.discoveryRunId(),
        buildRouteResumeContext: () => this.buildRouteResumeContext(),
        initNodeMapForAct: (act) => this.initNodeMapForAct(act),
      },
      actN,
    );
  }

  /**
   * Stable per-run discovery id used by C1 Highland Almanac persistence
   * helpers. Mirrors `SpawnSystem.discoveryRunId` so a single run shows
   * the same `run:${seed}` stamp across beasties / weys / finds entries.
   * Falls back to a sentinel if the rng wasn't ready (cold scene init
   * paths shouldn't hit this; the sentinel keeps the bump non-throwing).
   */
  private discoveryRunId(): string {
    try {
      return `run:${this.runRng.seed >>> 0}`;
    } catch {
      return 'run:unknown';
    }
  }

  /**
   * U1 Task 14 — register a rune with the condition system. Called by
   * LevelUpFlow.apply() on a 'grant_rune' card pick. Also records the
   * run-owned rune id so future card draws filter it from the offer pool.
   * Unknown rune ids are silently skipped — defensive against future
   * save/replay drift.
   */
  private grantRune(runeId: string): void {
    const def = RUNES[runeId];
    if (!def) return;
    if (this.ownedRuneIds.includes(runeId)) return;
    this.ownedRuneIds.push(runeId);
    this.runeSystem.addRune(def);
  }

  // tickRuneSystem / applyRunePulses / handleBurnsPlatterCollect —
  // moved to scenes/game/runeSystemController.ts (Phase 5 Bucket 2).

  /** R1 — e2e accessor; also used by the HUD slot widget in M3. */
  getHeldRelicKeys(): readonly RelicKey[] {
    return this.relicOrchestrator?.getHeldKeys() ?? [];
  }

  private buildRouteResumeContext(): RouteResumeContext {
    return {
      player: this.player,
      hazardZones: this.hazardZones,
      pickupSpawner: this.pickupSpawner,
      spawnSystem: this.spawnSystem,
      timeManager: this.timeManager,
      xpSystem: this.xpSystem,
      runRng: this.runRng,
      modifiers: this.runModifiers,
      grantReroll: () => this.upgradeUI?.grantReroll(),
    };
  }

  /** Seconds past the Bell (Taxman kill). Read by SpawnSystem for escalation. */
  getSecondsPastBell(): number { return this.runLifecycle.getSecondsPastBell(); }

  isPostBell(): boolean { return this.runLifecycle.isPostBell(); }

  // transitionToGameOver / abandonRunToMainMenu extracted to RunExitComposer.

  // collectRunStateForMeta / persistActiveRunToMeta / applyResumeHydration
  // extracted to src/scenes/game/RunPersistenceBridge.ts

  // register/unregisterDebugTimeTravelApi extracted to DebugTimeTravelApi.

  // registerMidRunPersistenceHooks / unregisterMidRunPersistenceHooks
  // extracted to RunPersistenceBridge.
  // buildRunHistoryContext / recordToHistory / recordDailyChallengeResult
  // extracted to RunHistoryRecorder.

  // buildGameOverPayload / buildRunSummary / getRunBuildSummary extracted
  // to RunExitComposer.

  // Boss HP bar logic extracted to BossHpTracker.

  /** Drain all chests queued while the game was paused. */
  drainPendingChests(): void {
    while (this.pendingChests.length > 0) {
      const chest = this.pendingChests.shift()!;
      if (chest.golden) this.pickupSpawner.spawnGoldenChest();
      else this.pickupSpawner.spawnTreasure();
    }
  }

  /**
   * Enqueue an a11y caption. Cheap no-op when captions are disabled: the
   * overlay still holds the manager's state but won't render. Centralising
   * here keeps callers from having to know about the manager at all.
   */
  caption(id: string, message: string, tint?: string, durationMs?: number): void {
    if (!this.captionManager) return;
    const d = durationMs ?? CaptionManager.suggestedDurationMs(message);
    this.captionManager.enqueue(id, message, d, tint);
  }

  /**
   * Request a banter line for `context`. Multiple requests in one frame
   * are collapsed by priority — the engine emits at most one per flush.
   * Public surface mirrors `caption()` so subsystems (SpawnSystem, etc.)
   * can reach through via `scene as unknown as { requestBanter?: ... }`.
   */
  requestBanter(context: BanterContext, tag?: string): void {
    this.banter?.request(context, tag ? { tag } : undefined);
  }

  getCurrentBiomeId(): BiomeId | null {
    if (!this.biomeController || !this.player) return null;
    return this.biomeController.currentBiomeAt(this.player.x, this.player.y);
  }

  /**
   * True iff any active enemy sits within `radiusPx` of the player.
   * Used by `GameTickers` to gate haggis_ambient banter to quiet
   * stretches (Task 10). Squared-distance compare keeps this cheap at
   * the per-frame cadence the ticker runs at.
   */
  private hasEnemyNearby(radiusPx: number): boolean {
    if (!this.player || !this.spawnSystem) return false;
    const r2 = radiusPx * radiusPx;
    const px = this.player.x;
    const py = this.player.y;
    const enemies = this.spawnSystem.getEnemyGroup().getChildren() as Enemy[];
    for (const e of enemies) {
      if (!e.active) continue;
      const dx = e.x - px;
      const dy = e.y - py;
      if (dx * dx + dy * dy <= r2) return true;
    }
    return false;
  }

  getBiomeManager(): BiomeManager | null {
    return this.biomeController?.getManager() ?? null;
  }

  /**
   * F1 M5 — mount a persistent HaarFogController on the main camera so
   * BiomeController can tween ambient density through it. Idempotent:
   * earlier-run controllers get torn down with the previous camera's
   * filter list on scene restart; this method always builds a fresh one.
   */
  private installHaarFog(): void {
    this.haarFog = null;
    if (this.sys.game.renderer.type !== Phaser.WEBGL) return;
    const cam = this.cameras.main;
    const filters = cam.filters;
    if (!filters) return;
    try {
      const haar = new HaarFogController(cam, { density: 0 });
      filters.internal.add(haar);
      this.haarFog = haar;
    } catch {
      this.haarFog = null;
    }
  }

  /**
   * F1 M5 — BiomeController calls this when the player crosses a biome
   * boundary. First-entry into a haar-prone biome ramps up with the
   * spec transition; subsequent re-entries tween smoothly to the new
   * ambient density. Dry biomes (pine/heather) tween back down to 0.
   */
  private handleBiomeEnteredForHaar(biome: BiomeId): void {
    if (!this.haarFog) return;
    const { motionScale, reduceParticles, reduceFlashing } = getSettingsManager().load();
    const target = biomeHaarTarget({ motionScale, reduceParticles, reduceFlashing }, biome);
    this.tweens.killTweensOf(this.haarFog.state);
    this.tweens.add({
      targets: this.haarFog.state,
      density: target,
      duration: DEFAULT_HAAR_TRANSITION.rampInMs,
      ease: 'Sine.easeInOut',
    });
  }

  getPlayer(): Player { return this.player; }
  /** M1 — test hooks for Moor Road node-map. */
  getRunActState(): RunActState { return this.runActState; }
  getNodeMapSystem(): NodeMapSystem { return this.nodeMapSystem; }
  getTimeManager(): TimeManager { return this.timeManager; }
  getUpdateTickers(): UpdateTickers { return this.updateTickers; }
  getSpawnSystem(): SpawnSystem { return this.spawnSystem; }
  getWeaponSystem(): WeaponSystem { return this.weaponSystem; }
  getXPSystem(): XPSystem { return this.xpSystem; }
  getTutorialSystem(): TutorialSystem {
    return this.tutorialSystem;
  }
  getRunStatsTracker(): RunStatsTracker {
    return this.runStatsTracker;
  }
  getSFXManager(): SFXManager {
    return sfxManager;
  }
  getStatusFxPool(): StatusFxPool {
    return this.statusFxPool;
  }
  getRunRng(): RNG {
    return this.runRng;
  }

  /** The numeric seed for this run. Consumed by run-summary + game-over UI. */
  getRunSeed(): number {
    return this.runRng.seed;
  }

  /** The user-facing shareable code for this run's seed. */
  getRunSeedCode(): string {
    return encodeSeed(this.runRng.seed);
  }

  /** True when this run was launched as a Daily Challenge attempt. */
  isDailyRun(): boolean {
    return this.runIsDaily;
  }

  /** JuiceSystem accessor — used by PauseMenu and other scene-adjacent modules. */
  getJuice(): JuiceSystem {
    return this.juice;
  }

  /** Display name generated for this run — stable for its lifetime, cosmetic only. */
  public getRunName(): string {
    return this.runName;
  }

  public getClipRecorder(): ClipRecorder | null {
    return this.clipRecorder;
  }

  /**
   * Run context snapshot for the capture pipeline (Pause / F10 screenshot).
   * At pause time the player is alive; GameOverScene supplies its own payload
   * with the final mode for the death/victory capture path.
   */
  getRunContextForCapture(): {
    mode: 'victory' | 'death';
    variantLabel: string;
    timeSurvivedSec: number;
    seedCode?: string;
  } {
    return {
      mode: 'victory',
      variantLabel: formatRunVariantLabel(this.activeVariant),
      timeSurvivedSec: Math.floor(this.spawnSystem.getGameTimeSec()),
      seedCode: this.getRunSeedCode(),
    };
  }

  /** F10 screenshot handler — check captureEnabled, snap canvas, show toast. */
  private lastClipSaveAt = 0;

  private handleF10Screenshot(): void {
    if (!getSettingsManager().load().captureEnabled) return;
    const canvas = this.game.canvas;
    if (!canvas) return;
    const ctx = this.getRunContextForCapture();
    const filename = buildCaptureFilename('screenshot', {
      mode: ctx.mode,
      variantLabel: ctx.variantLabel,
      timeSurvivedSec: ctx.timeSurvivedSec,
      seedCode: ctx.seedCode,
      dateYmd: formatLocalYmd(new Date()),
    });
    void saveScreenshot(canvas, filename).then((ok) => {
      this.getJuice()?.showToast(
        ok ? t('ui.toast.screenshot_saved') : t('ui.toast.screenshot_failed'),
        ok ? TOAST_COLORS.positive : TOAST_COLORS.warning,
      );
    });
  }

  private handleF9SaveClip(): void {
    if (!getSettingsManager().load().captureEnabled) return;
    const recorder = this.clipRecorder;
    if (!recorder?.isAvailable()) return;

    const now = performance.now();
    if (now - this.lastClipSaveAt < 500) return;
    this.lastClipSaveAt = now;

    const ctx = this.getRunContextForCapture();
    const filename = buildCaptureFilename('clip', {
      mode: ctx.mode,
      variantLabel: ctx.variantLabel,
      timeSurvivedSec: ctx.timeSurvivedSec,
      seedCode: ctx.seedCode,
      dateYmd: formatLocalYmd(new Date()),
    });

    void recorder.saveLast((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }).then((blob) => {
      const key = blob === null ? 'ui.toast.clip_empty' : 'ui.toast.clip_saved';
      const color = blob ? TOAST_COLORS.positive : TOAST_COLORS.warning;
      this.getJuice()?.showToast(t(key), color);
    }).catch(() => {
      this.getJuice()?.showToast(t('ui.toast.clip_failed'), TOAST_COLORS.warning);
    });
  }

  // Chest sprite track/untrack/markers extracted to ChestSpriteRegistry.
}
