import * as Phaser from 'phaser';
import { GAME } from '../config';
import { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { createGrudgeLedger, type GrudgeLedgerState } from '../entities/grudgeLedger';
import type { SpawnSystem } from '../systems/SpawnSystem';
import type { WeaponSystem } from '../systems/WeaponSystem';
import type { XPSystem } from '../systems/XPSystem';
import { installCoreCombatSystems } from './game/installCoreCombatSystems';
import { NodeMapSystem } from '../systems/NodeMapSystem';
import { NodeMarkerSystem } from '../systems/NodeMarkerSystem';
import { UpgradeCardsUI } from '../ui/UpgradeCards';
import { HUD } from '../ui/HUD';
import { EdgeIndicators } from '../ui/EdgeIndicators';
import { Minimap } from '../ui/Minimap';
import { NodeMapUI } from '../ui/NodeMapUI';
import { NodePromptUI } from '../ui/NodePromptUI';
import { RelicSlotUI } from '../ui/RelicSlotUI';
import type { Act3Stretch } from '../data/nodeBanks';
import { NodeWaveTracker } from '../systems/nodeEvents/NodeWaveTracker';
import { JuiceSystem } from '../systems/JuiceSystem';
import type { AmbientWeatherSystem } from '../systems/AmbientWeatherSystem';
import type { HazardsSystem } from '../systems/HazardsSystem';
import { createPhaserTimeAdapter, TimeManager } from '../systems/TimeManager';
import { disposeRecordingAudioStream } from '@/systems/audioContext';
import type { ClipRecorder } from '@/utils/clipRecorder';
import {
  recordRun, loadSave,
  bumpBanterHeard,
  bumpBossKillCount, bumpCursedVictoryByBoss,
} from '../utils/save';
import { audio } from '../systems/AudioSystem';
import { GameMusicState } from '../systems/music/ProceduralMusicEngine';
import { getVariantByKey, VariantDef, formatRunVariantLabel } from '../data/variants';
import { ISceneContext } from '../core/ISceneContext';
import { UpdateTickers, TickerHandle } from '../utils/UpdateTickers';
import { SubscriptionBag } from '../utils/SubscriptionBag';
import { encodeSeed, type RNG } from '../utils/rng';
import type { ReplayRecorder } from '../replay/ReplayRecorder';
import type { ReplayInput } from '../replay/ReplayInput';
import type { ReplayBlobAny } from '../replay/replayBlob';
import { resolveReplayMode } from '../replay/replayConfig';
import { parseGameSceneInitData } from './gameSceneInitData';
import { DebugOverlay } from '../ui/DebugOverlay';
import { SaveManager } from '../core/SaveManager';
import { StatComposer } from '../core/StatComposer';
import { getSettingsManager } from '../core/SettingsManager';
import { BanterSystem } from '../systems/BanterSystem';
import type { BanterContext } from '../data/banter';
import { getAnalyticsManager } from '../core/AnalyticsManager';
import { t } from '../core/i18n';
import { sfxManager, type SFXManager } from '../systems/audio/SFXManager';
import { getCameraViewport } from '../ui/cameraViewport';
import {
  createGameplaySessionGuard,
  readPendingResumeRun,
} from '../core/GameSessionLifecycle';
import { RunStatsTracker } from '../systems/RunStatsTracker';
import { DeathCauseTracker } from '../systems/DeathCauseTracker';
import { defaultModifiers, type RunModifiers } from '../core/RunModifiers';
import { type CurseKey } from '../data/curses';
import type { StatusFxPool } from '../systems/StatusFxPool';
import { TempBuffBag } from '../systems/TempBuffBag';
import { RuneConditionSystem } from '../systems/RuneConditionSystem';
import { createRuneEffectBag } from '../systems/runes/runeEffects';
import { runFrameTick } from './game/runFrameTick';
import { installCombatCollisions } from './game/installCombatCollisions';
import { RUNES } from '../data/runes';
import { RuneSystemController } from './game/runeSystemController';
import { buildRuneSystemControllerHooks } from './game/buildRuneSystemControllerHooks';
import { initNodeMapForAct as initNodeMapForActImpl } from './game/initNodeMapForAct';
import { TutorialSystem } from '../systems/TutorialSystem';
import type { BiomeId } from '../data/biomes';
import type { BiomeManager } from '../systems/BiomeManager';
import { BiomeController } from './game/BiomeController';
import type { FloraScatter } from '../systems/FloraScatter';
import type { WildlifeSystem } from '../systems/WildlifeSystem';
import type { MistLayer } from '../systems/MistLayer';
import { installWorldDressing } from './game/installWorldDressing';
import { FilmGrainOverlay } from './game/FilmGrainOverlay';
import { IFrameController } from './game/IFrameController';
import { RunEndTickers } from './game/RunEndTickers';
import type { MoorMomentScheduler } from './game/MoorMomentScheduler';
import { CairnStackingScheduler } from './game/CairnStackingScheduler';
import { installRunBookkeeping } from './game/installRunBookkeeping';
import {
  type MoorMomentsState,
  createMoorMomentsState,
  type MoorMomentsContext,
  tryMoorMercyLuck as moorMomentsTryMercyLuck,
  trySpawnAncestralEcho as moorMomentsTrySpawnAncestralEcho,
  spawnStandingStones as moorMomentsSpawnStandingStones,
  spawnReliquary as moorMomentsSpawnReliquary,
  spawnClootieTree as moorMomentsSpawnClootieTree,
  showRunIdentityToast as moorMomentsShowRunIdentityToast,
} from './game/moorMoments';
import { PauseMenu } from './game/PauseMenu';
import { buildPauseMenuHooks } from './game/buildPauseMenuHooks';
import { canOpenPauseMenu } from './game/pauseGate';
import type { PickupSpawner } from './game/PickupSpawner';
import { RunActState } from './game/RunActState';
import { StandingStones } from './game/standingStones';
import { Reliquary } from './game/reliquary';
import { ClootieTree } from './game/clootieTree';
import { LemmingsEasterEgg } from './game/lemmingsEasterEgg';
import { bumpLemmingsSeenForVariant } from '../utils/save';
import { AncestralEcho } from './game/ancestralEcho';
import { launchActIntermission as launchActIntermissionImpl } from './game/actIntermissionLauncher';
import type { RoutePick, RouteResumeContext } from '../data/routes';
import { resolveRouteLabels, resolveRelicLabels, resolveRuneLabels } from './game/runIdentityLabels';
import { FloatTextPool } from './game/FloatTextPool';
import type { RunPersistenceBridge } from './game/RunPersistenceBridge';
import type { RunHistoryRecorder } from './game/RunHistoryRecorder';
import type { RunPersistenceCoordinator } from './game/RunPersistenceCoordinator';
import { installRunEndComposers } from './game/installRunEndComposers';
import { generateHaggisName } from '@/data/haggisNames';
import { showRunIntroToasts } from './game/runIntroToasts';
import type { DebugTimeTravelApi } from './game/DebugTimeTravelApi';
import type { BossHpTracker } from './game/BossHpTracker';
import { ChestSpriteRegistry } from './game/ChestSpriteRegistry';
import type { RunExitComposer } from './game/RunExitComposer';
import { RunScoreState } from './game/RunScoreState';
import { installRunStartCeremony } from './game/runStartCeremony';
import {
  installReplayPlayback,
  installReplayRecording,
  recordReplayFrame,
} from './game/replayBridgeInstall';
import { applyCurseAndComposeStats } from './game/applyCurseAndComposeStats';
import { installRunEndShutdown } from './game/runEndShutdown';
import { resetTransientRunState as resetTransientRunStateImpl } from './game/resetTransientRunState';
import {
  applySeasonalRunStartPostSpawn,
  buildSeasonalRunStartPlan,
} from './game/seasonalRunStart';
import {
  applySporranRunStartPostSpawn,
  buildSporranRunStartPlan,
} from './game/sporranRunStart';
import type { LevelUpFlow } from './game/LevelUpFlow';
import type { RunLifecycle } from './game/RunLifecycle';
import { installRunFlow } from './game/installRunFlow';
import { RelicOrchestrator } from './game/RelicOrchestrator';
import { RELICS, type RelicKey } from '../data/relics';
import { createHighlandTerrain } from './game/highlandTerrain';
import type { HazardZones } from './game/HazardZones';
import { installHazardZones } from './game/installHazardZones';
import type { GameTickers } from './game/GameTickers';
import { installRuntimeAmbient } from './game/installRuntimeAmbient';
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
import { registerDebugHotkeys } from './dev/debugHotkeys';
import { type SecondTickHookContext } from './game/runtimeTickHooks';
import type { HaarFogController } from '../systems/shaders/HaarFogController';
import { installHaarFog, handleBiomeEnteredForHaar } from './game/haarFogInstall';
import { installRunStartupHud } from './game/installRunStartupHud';

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
  player!: Player;
  spawnSystem!: SpawnSystem;
  weaponSystem!: WeaponSystem;
  xpSystem!: XPSystem;
  tutorialSystem!: TutorialSystem;
  upgradeUI!: UpgradeCardsUI;
  hud!: HUD;
  juice!: JuiceSystem;
  /** Ambient seasonal weather overlay (drizzle / rain / sun-shafts / aurora).
   *  Pure cosmetic — `null` between runs and when no seasonal event is live. */
  weather: AmbientWeatherSystem | null = null;
  /** Biome-conditioned environmental hazards (peat pits / slate / burn / scree).
   *  Damages player on overlap; `null` between runs. */
  hazards: HazardsSystem | null = null;
  timeManager!: TimeManager;
  updateTickers = new UpdateTickers();
  clipRecorder: ClipRecorder | null = null;
  edgeIndicators!: EdgeIndicators;
  minimap!: Minimap;
  /** M1 Moor Road — per-run node-path system + HUD widget. */
  readonly nodeMapSystem = new NodeMapSystem();
  readonly nodeMarkerSystem = new NodeMarkerSystem();
  /**
   * M1 F1 + F2 — defers finalize for encounter / elite nodes until the
   * spawned enemies die. Ticked once per frame from the main update loop
   * after `nodeMapSystem.tick`.
   */
  readonly nodeWaveTracker = new NodeWaveTracker();
  nodeMapUI: NodeMapUI | null = null;
  nodePromptUI: NodePromptUI | null = null;
  /** Index of the interactive node whose prompt is currently open. -1 when none. */
  interactivePromptIndex = -1;
  /** R1 M3 T22 — 3-slot HUD widget for held Relics. */
  relicSlotUI: RelicSlotUI | null = null;
  readonly chestRegistry = new ChestSpriteRegistry();
  readonly iFrameController = new IFrameController(() => this.player);

  ownedPassives: string[] = [];
  evolvedWeapons: string[] = [];
  /** U1 Rune tier — per-run owned rune ids. Filter for buildCardPool's
   *  ownedRuneIds ctx so duplicate offers are filtered. Cleared on scene
   *  restart. */
  ownedRuneIds: string[] = [];
  /** U1 — shared effect accumulator read by Player/WeaponSystem readers.
   *  The RuneConditionSystem mutates it via apply/remove on transitions. */
  runeBag = createRuneEffectBag();
  /** U1 — transition-driven rune orchestrator. Ticked from update() with
   *  a freshly-built RuneEvalContext each frame. */
  runeSystem = new RuneConditionSystem(this.runeBag);
  /** Controller for per-frame rune tick + pulse drain (Phase 5 Bucket 2). */
  runeSystemController!: RuneSystemController;
  /** All per-run counters (kills, boss/coin gold, elite chain, victory state). */
  readonly runScore = new RunScoreState();
  /** M1 F4 — timed shrine buffs. Cleared (not reverted) on scene restart. */
  readonly tempBuffBag = new TempBuffBag();
  /** W2 Moor Road: act number + picker history across the run. */
  readonly runActState = new RunActState();
  /** Mutable mercy-luck flag, owned by the moor-moments helper module. */
  private readonly moorMomentsState: MoorMomentsState = createMoorMomentsState();
  /** Standing Stones trinity — nulls out between runs, spawned at 5:00 mark. */
  standingStones: StandingStones | null = null;
  /** True once the 4:45 "stones stir" pre-warning has fired this run. */
  private stonesWarned: boolean = false;
  /** Reliquary — single rare pickup, placed off-path between 6:00 and 12:00. */
  reliquary: Reliquary | null = null;
  /** Run-specific second at which the reliquary spawns. Rolled from runRng
   *  at run start so the same seed always produces the same placement. */
  private reliquarySpawnSec: number = 0;
  /** Clootie Tree — single sacred-supplication landmark per run. Walking
   *  through commits the wager: a slice of max-HP for a rolled boon. */
  clootieTree: ClootieTree | null = null;
  /** Lemmings Easter Egg (DESIGN_IDEAS §13) — once-per-variant cliff-edge
   *  parade. Idle 90 s in coastal biome triggers the homage to DMA Design
   *  / Dundee 1991. Cosmetic-only; no balance impact. Null between runs;
   *  re-built each create() pass. */
  lemmingsEasterEgg: LemmingsEasterEgg | null = null;
  /** Run-specific second at which the clootie tree spawns (DESIGN_IDEAS §1). */
  private clootieSpawnSec: number = 0;
  /** Taxman Grudge Ledger — silent per-run finish buffer (DESIGN_IDEAS §1).
   *  Weapon listener appends one entry per elite/boss kill;
   *  `RunLifecycle.handleVictory` reads + judges the verdict at run end.
   *  Reset on scene reuse via `resetTransientRunState`. */
  grudgeLedger: GrudgeLedgerState = createGrudgeLedger();
  /** Ancestral Echo — spectral haggis at last-death spot. Nulls on resolve. */
  ancestralEcho: AncestralEcho | null = null;
  /** Batched toast for max-level XP → gold conversion (avoids spam). */
  private xpOverflowGoldBatch: number = 0;
  /** Chests deferred while paused — queued so multiple timer callbacks don't overwrite each other. */
  pendingChests: Array<{ golden: boolean }> = [];
  gameTickers!: GameTickers;
  private revivalAvailable: boolean = false;
  activeVariant!: VariantDef;
  /** Extra ms added to chest/coin despawn windows by the Treasure Magnet permanent upgrade. */
  private chestDurationBonusMs: number = 0;

  /**
   * Run-scoped seeded PRNG for gameplay decisions (card draws, elite rolls,
   * loot rarity, weighted spawns, crit). Set in `create()` from the seed
   * passed via `init(data)` — daily challenge / shared seed codes / replay.
   */
  runRng!: RNG;
  /**
   * Sub-RNG branched off `runRng` for rune-pulse spawn positions (extra
   * gems from `applyRunePulses`). Branched after biome/flora/wildlife/
   * mist so existing fixtures' sub-seeds are preserved. Replaces a prior
   * `Math.random()` that broke T1 replay determinism — gem positions
   * affect pickup-radius eligibility, which alters XP totals.
   */
  runePulseRng!: RNG;
  /** T1 replay state — install/teardown owned by `game/replayBridgeInstall.ts`. */
  replayRecorder: ReplayRecorder | null = null;
  replayInput: ReplayInput | null = null;
  private pendingReplay: ReplayBlobAny | null = null;
  /** v2 route queue — `launchActIntermission` shifts one off per act boundary during playback. */
  private pendingReplayRoutes: RoutePick[] = [];
  /** Pending seed passed via init() data. Consumed in create(). */
  private pendingRunSeed: number | null = null;
  /** Set when the run is a Daily Challenge attempt — drives save tracking + end-of-run UI. */
  runIsDaily: boolean = false;
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
   * S1 Phase 1 — Sporran Deck picks passed via
   * `scene.start('Game', { pickedSporranIds })`. Consumed once in
   * `create()` after the curse pass and before the seasonal pass —
   * `applySporranRunStart` mutates `runModifiers` then post-spawn
   * heals fire alongside the seasonal toast pipeline. `null` for any
   * run that did not go through `SporranScene`.
   */
  private pendingSporranIds: readonly string[] | null = null;
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
  readonly runEndTickers = new RunEndTickers();
  /** End-of-run screen-space fade overlays — tracked as fields so shutdown
   *  can destroy them; anonymous locals would orphan on scene restart since
   *  Phaser's scene.stop() doesn't clear the display list. */
  private victoryFade: Phaser.GameObjects.Rectangle | null = null;
  private deathFade: Phaser.GameObjects.Rectangle | null = null;
  subs = new SubscriptionBag();
  debugOverlay: DebugOverlay | null = null;
  private announcedEvolutionReady = new Set<string>();
  private playerEnemyCollider: Phaser.Physics.Arcade.Collider | null = null;
  bossHpTracker!: BossHpTracker;
  debugTimeTravelApi!: DebugTimeTravelApi;
  runExit!: RunExitComposer;

  /** Reused each frame — avoids allocating a new object for `musicEngine.update`. */
  readonly musicStateScratch: GameMusicState = {
    hp: 0, maxHp: 0, gameTimeSec: 0, enemyCount: 0, comboCount: 0, killCount: 0, bossActive: false,
    biomeTimbre: 0.45, buildDensity: 0,
  };
  /** Reused HUD weapon rows — mutated in place; length capped at max equippable weapons. */
  readonly hudWeaponScratch: Array<{
    key: string;
    level: number;
    evolved: boolean;
    evolutionKey: string;
    cooldownFrac: number;
  }> = Array.from({ length: 12 }, () => ({
    key: '', level: 0, evolved: false, evolutionKey: '', cooldownFrac: 0,
  }));

  readonly metaSaveManager = new SaveManager();
  readonly settingsManager = getSettingsManager();
  private statusFxPool!: StatusFxPool;
  /** Pooled floating text for high-frequency combat/pickup feedback (armor, gold). */
  private readonly floatTextPool = new FloatTextPool();
  readonly runStatsTracker = new RunStatsTracker();
  readonly deathCauseTracker = new DeathCauseTracker();
  /** Per-run modifier bag (from curse pick). Defaults to identity — an un-cursed run behaves identically to the pre-curse codebase. */
  runModifiers: RunModifiers = defaultModifiers();
  /** Curse key chosen for this run, if any — persisted into run history. */
  activeCurseKey: CurseKey | null = null;
  /**
   * E1 M2 T10 — Burns Night haggis-platter state. `spawned` flips once
   * the platter is dropped this run (so the scheduler never double-
   * fires after a TimeManager reset); `pickedUpAtMs` captures
   * `this.time.now` at collision so the damage-buff helper can decay
   * the 1.3× multiplier after 60 s. Both reset on every `create()`
   * run — see the reset block near the top.
   */
  private burnsPlatterSpawned: boolean = false;
  burnsPlatterPickedUpAtMs: number | null = null;
  /**
   * W66 Ironmoor — locked in at run start (from Settings on a fresh run,
   * from the snapshot on resume). Every ironmoor-sensitive decision
   * (revival suppression, HUD badge, wipe-on-death, leaderboard write)
   * reads this field rather than `settingsManager.load().ironmoorMode`
   * so a mid-run settings toggle can't retroactively grant Second Wind
   * to a permadeath run or silently drop a row from the leaderboard.
   */
  activeIronmoorRun = false;
  private runName = '';
  lastEmittedRunSecond = -1;
  eventBusDispose: (() => void) | null = null;
  /** N1 Tier-2 mythos boss #2 — Wild Hunt gem-pull controller. Lives
   *  for the run; owns its own bossEnraged subscription. Null between
   *  runs / before installRunStartupHud has set it. */
  nicnevinWildHunt: import('./game/NicnevinWildHuntController').NicnevinWildHuntController | null = null;
  biomeController: BiomeController | null = null;
  /**
   * Phase B Endless — secondsPastBell at which we last reseeded
   * the biome layout. -1 = never. Reset on scene reuse via the
   * BiomeController construction path which already resets this.
   */
  postBellLastReseedSec: number = -1;
  /** F1 M5 — persistent haar fog controller on the main camera. Null when
   *  the Canvas renderer is in use (filter pipeline unavailable there). */
  haarFog: HaarFogController | null = null;
  private pauseMenu: PauseMenu | null = null;
  pickupSpawner!: PickupSpawner;
  /**
   * R1 — Relic pickup flow + slot/effect ownership (RelicSystem +
   * RelicEffectDriver + RelicPickupSpawner + Fianna lifecycle). Wraps
   * the prior inline GameScene methods (rollAndSpawnRelic, modal,
   * activateWhiskyDram, activateFingalsHorn). Fresh instance per run.
   */
  relicOrchestrator!: RelicOrchestrator;
  /** Tunnel accessor for compositor call sites that read the slot model. */
  get relicSystem() { return this.relicOrchestrator.getSystem(); }
  /** Tunnel accessor for compositor call sites that read the effect driver. */
  get relicEffectDriver() { return this.relicOrchestrator.getDriver(); }
  /** Tunnel accessor for compositor call sites that need the live pickup spawner. */
  get relicPickupSpawner() { return this.relicOrchestrator.getSpawner(); }
  levelUpFlow!: LevelUpFlow;
  runLifecycle!: RunLifecycle;
  runPersistence!: RunPersistenceBridge;
  private runHistoryRecorder!: RunHistoryRecorder;
  /**
   * T401 P3 — replay-aware wrapper around `RunHistoryRecorder.record`
   * and the legacy `recordRun` save call. Built once `runHistoryRecorder`
   * exists; `RunLifecycle` reads through it so the playback no-op is
   * unit-testable instead of an anonymous closure.
   */
  private runPersistenceCoordinator!: RunPersistenceCoordinator;
  hazardZones!: HazardZones;
  private captionManager: CaptionManager | null = null;
  captionOverlay: CaptionOverlay | null = null;
  filmGrain: FilmGrainOverlay | null = null;
  banter: BanterSystem | null = null;
  readonly gameplaySessionGuard = createGameplaySessionGuard(() => {
    getAnalyticsManager().endGameplaySession();
  });

  private moorMoments!: MoorMomentScheduler;
  private cairnStacking!: CairnStackingScheduler;
  floraScatter: FloraScatter | null = null;
  wildlifeSystem: WildlifeSystem | null = null;
  mistLayer: MistLayer | null = null;

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
    resetTransientRunStateImpl({
      replayInput: this.replayInput,
      iFrameController: this.iFrameController,
      pauseMenu: this.pauseMenu,
      runScore: this.runScore,
      tempBuffBag: this.tempBuffBag,
      runActState: this.runActState,
      nodeMapSystem: this.nodeMapSystem,
      nodeWaveTracker: this.nodeWaveTracker,
      nodeMapUI: this.nodeMapUI,
      nodePromptUI: this.nodePromptUI,
      nodeMarkerSystem: this.nodeMarkerSystem,
      pendingRunSeed: this.pendingRunSeed,
      updateTickers: this.updateTickers,
      runEndTickers: this.runEndTickers,
      victoryFade: this.victoryFade,
      deathFade: this.deathFade,
      hazardZones: this.hazardZones ?? null,
      chestRegistry: this.chestRegistry,
      announcedEvolutionReady: this.announcedEvolutionReady,
      runStatsTracker: this.runStatsTracker,
      deathCauseTracker: this.deathCauseTracker,
      gameTickers: this.gameTickers ?? null,
      musicStateScratch: this.musicStateScratch,
      moorMomentsState: this.moorMomentsState,
      standingStones: this.standingStones,
      reliquary: this.reliquary,
      clootieTree: this.clootieTree,
      lemmingsEasterEgg: this.lemmingsEasterEgg,
      ancestralEcho: this.ancestralEcho,
      relicSlotUI: this.relicSlotUI,
      grudgeLedger: this.grudgeLedger,
      setReplayInput: (v) => { this.replayInput = v; },
      setPendingReplayRoutes: (v) => { this.pendingReplayRoutes = v; },
      setPauseMenu: (v) => { this.pauseMenu = v; },
      setNodeMapUI: (v) => { this.nodeMapUI = v; },
      setNodePromptUI: (v) => { this.nodePromptUI = v; },
      setSuppressNextNodeMapRoll: (v) => { this.suppressNextNodeMapRoll = v; },
      setInteractivePromptIndex: (v) => { this.interactivePromptIndex = v; },
      setChestDurationBonusMs: (v) => { this.chestDurationBonusMs = v; },
      setRunRng: (v) => { this.runRng = v; },
      setPendingRunSeed: (v) => { this.pendingRunSeed = v; },
      setReliquarySpawnSec: (v) => { this.reliquarySpawnSec = v; },
      setClootieSpawnSec: (v) => { this.clootieSpawnSec = v; },
      setPendingChests: (v) => { this.pendingChests = v; },
      setPickupDespawnHandles: (v) => { this.pickupDespawnHandles = v; },
      setVictoryFade: (v) => { this.victoryFade = v; },
      setDeathFade: (v) => { this.deathFade = v; },
      setLastEmittedRunSecond: (v) => { this.lastEmittedRunSecond = v; },
      setSubs: (v) => { this.subs = v; },
      setRunName: (v) => { this.runName = v; },
      setBurnsPlatterSpawned: (v) => { this.burnsPlatterSpawned = v; },
      setBurnsPlatterPickedUpAtMs: (v) => { this.burnsPlatterPickedUpAtMs = v; },
      setStandingStones: (v) => { this.standingStones = v; },
      setStonesWarned: (v) => { this.stonesWarned = v; },
      setReliquary: (v) => { this.reliquary = v; },
      setClootieTree: (v) => { this.clootieTree = v; },
      setLemmingsEasterEgg: (v) => { this.lemmingsEasterEgg = v; },
      setAncestralEcho: (v) => { this.ancestralEcho = v; },
      setRelicSlotUI: (v) => { this.relicSlotUI = v; },
      setXpOverflowGoldBatch: (v) => { this.xpOverflowGoldBatch = v; },
    });

    // R1 — clear held Relics + dropped pickups + Fianna spirits before a
    // fresh run. A scene instance can be reused across runs; without this
    // the previous run's sporran (and any 10s-lifetime Fianna spirits)
    // bleed into the next. Construction needs `this` (Phaser scene) + 7
    // hooks, so it stays at the call site rather than ballooning the
    // helper's dep bag.
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
    this.pendingSporranIds = resolved.pendingSporranIds;
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
    this.runeSystemController = new RuneSystemController(buildRuneSystemControllerHooks(this));

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
    this.haarFog = installHaarFog(this);

    // Biome partition — voronoi regions seeded from the run RNG.
    // Owns manager, renderer, entry-toast state, and player-modifier push.
    this.biomeController?.destroy();
    this.postBellLastReseedSec = -1;
    this.biomeController = new BiomeController(
      this,
      this.runRng.branch(),
      GAME.WORLD_WIDTH,
      GAME.WORLD_HEIGHT,
      { onBiomeEnter: (biome) => handleBiomeEnteredForHaar(this, this.haarFog, biome) },
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

    // S1 Phase 1 — Sporran Deck picks. Mutates the modifier bag in
    // place BEFORE seasonal so first-footing / blessing layering still
    // multiplies on top of any sporran curse penalties + boons. The
    // post-spawn heal lands alongside the seasonal heal pipeline below.
    // Resumed runs short-circuit: the picks were already absorbed at
    // the original run-start.
    const sporranRunStart = buildSporranRunStartPlan({
      resumeRun: !!resumeRun,
      pickedSporranIds: this.pendingSporranIds,
      runModifiers: this.runModifiers,
    });
    this.pendingSporranIds = null;

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

    // S1 Phase 1 — Sporran Deck post-spawn. Heal-only today; toast is
    // surfaced from the picker scene itself rather than via a delayed
    // GameScene toast (the player just confirmed the picks, the moor
    // already knows what's in the pocket).
    applySporranRunStartPostSpawn(sporranRunStart, {
      heal: (amount) => this.player.heal(amount),
    });

    // Seasonal post-spawn application. Toast is delayed so it lands
    // after the run-start ceremony settles into the HUD.
    applySeasonalRunStartPostSpawn(seasonalRunStart, {
      heal: (amount) => this.player.heal(amount),
      addXpMultiplier: (amount) => this.player.addXpMultiplier(amount),
      addCritChance: (amount) => this.player.addCritChance(amount),
      addLifesteal: (amount) => this.player.addLifesteal(amount),
      addAoeMultiplier: (amount) => this.player.addAoeMultiplier(amount),
      addPickupRadius: (amount) => this.player.addPickupRadius(amount),
      addCritDamageMultiplier: (amount) => this.player.addCritDamageMultiplier(amount),
      addDamageMultiplier: (amount) => this.player.addDamageMultiplier(amount),
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

    // Phase 5 Bucket 6 partial — HazardZones reset/construct/spawn bundled.
    this.hazardZones = installHazardZones({
      scene: this,
      prior: this.hazardZones,
      getPlayer: () => this.player,
      getJuice: () => this.juice,
      getDeathCauseTracker: () => this.deathCauseTracker,
      getSpawnSystem: () => this.spawnSystem,
      getRunRng: () => this.runRng,
      getIFrameController: () => this.iFrameController,
      getRunScore: () => this.runScore,
      getRunModifiers: () => this.runModifiers,
      getRunLifecycle: () => this.runLifecycle,
      getRelicEffectDriver: () => this.relicEffectDriver ?? null,
      getCurrentTimeMs: () => this.time.now,
      tryMoorMercyLuck: (hp) => this.tryMoorMercyLuck(hp),
    });

    // Phase 5 Bucket 6 partial — core combat systems bundled.
    ({
      statusFxPool: this.statusFxPool,
      spawnSystem: this.spawnSystem,
      weaponSystem: this.weaponSystem,
      xpSystem: this.xpSystem,
    } = installCoreCombatSystems({
      scene: this,
      runModifiers: this.runModifiers,
      bossHpTracker: this.bossHpTracker,
      getRelicEffectDriver: () => this.relicEffectDriver ?? null,
    }));
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

    // Phase 5 Bucket 6 finish — four run-bookkeeping ctors bundled into
    // a single helper. MoorMomentScheduler must exist before resume
    // hydration (its pushAfterResume is called); RunPersistenceBridge
    // owns snapshot/hydrate; BossHpTracker pushes HUD fraction; the
    // dev API wires globalThis.DEBUG + Shift+] (install() fires later
    // once `relicSystem` is built).
    ({
      moorMoments: this.moorMoments,
      runPersistence: this.runPersistence,
      bossHpTracker: this.bossHpTracker,
      debugTimeTravelApi: this.debugTimeTravelApi,
    } = installRunBookkeeping({
      getRunRng: () => this.runRng,
      getPlayer: () => this.player,
      getXPSystem: () => this.xpSystem,
      getJuice: () => this.juice,
      getSpawnSystem: () => this.spawnSystem,
      getRunModifiers: () => this.runModifiers,
      isSceneActive: () => this.scene.isActive(),
      getVictoryPending: () => this.runScore.victoryPending,
      getCurrentBiomeId: () => this.getCurrentBiomeId(),
      getTutorialSystem: () => this.tutorialSystem,
      getBanter: () => this.banter,
      getSFXManager: () => this.getSFXManager(),
      addCoinGold: (amount) => { this.runScore.addCoinGold(amount); },
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
      getWeaponSystem: () => this.weaponSystem,
      getTimeManager: () => this.timeManager,
      getRunStatsTracker: () => this.runStatsTracker,
      getLevelUpFlow: () => this.levelUpFlow,
      getSaveManager: () => this.metaSaveManager,
      getActiveVariant: () => this.activeVariant,
      getRunScore: () => this.runScore,
      getRunActState: () => this.runActState,
      isIronmoorRun: () => this.activeIronmoorRun,
      getTempBuffBag: () => this.tempBuffBag,
      getRevivalAvailable: () => this.revivalAvailable,
      getOwnedPassives: () => this.ownedPassives,
      getEvolvedWeapons: () => this.evolvedWeapons,
      getHeldRelicKeysForPersistence: () => this.relicSystem?.heldKeys() ?? [],
      setRevivalAvailable: (v) => { this.revivalAvailable = v; },
      setOwnedPassives: (p) => { this.ownedPassives = p; },
      setEvolvedWeapons: (e) => { this.evolvedWeapons = e; },
      restoreHeldRelics: (keys) => this.relicOrchestrator.restoreHeld(keys),
      suppressNextNodeMapRoll: () => { this.suppressNextNodeMapRoll = true; },
      updateBossBar: (data) => this.hud.updateBossBar(data),
      spawnRelicAt: (key, x, y) => this.relicOrchestrator.debugSpawnAt(key, x, y),
      getHeldRelicKeysForDebug: () => this.relicSystem?.heldKeys() ?? [],
      getRelicCatalogue: () => RELICS,
      openRelicDiscardPromptForAudit: () => {
        if (this.relicOrchestrator.isDiscardModalOpen()) return false;
        this.relicOrchestrator.restoreHeld(['sporran_of_holding', 'oatcake_stash', 'grans_thimble']);
        this.relicOrchestrator.openDiscardModal(RELICS.whisky_dram, 'bargain');
        return true;
      },
    }));

    // Phase 5 Bucket 6 partial — RunExitComposer + RunHistoryRecorder +
    // RunPersistenceCoordinator construction. De-duplicated hook bag
    // (~9 fields used to repeat across the three composers' ctors).
    ({
      runExit: this.runExit,
      runHistoryRecorder: this.runHistoryRecorder,
      runPersistenceCoordinator: this.runPersistenceCoordinator,
    } = installRunEndComposers({
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
      getRunScore: () => this.runScore,
      getRunName: () => this.runName,
      isDailyRun: () => this.runIsDaily,
      isIronmoorRun: () => this.activeIronmoorRun,
      getSecondsPastBell: () => this.runLifecycle?.getSecondsPastBell() ?? 0,
      getOwnedPassivesLength: () => this.ownedPassives.length,
      getEvolvedWeaponsLength: () => this.evolvedWeapons.length,
      stopGameScene: () => this.scene.stop('Game'),
      startGameOverScene: (payload) => this.scene.start('GameOver', payload),
      // H1 T9 — post-run lands in CroftScene (hub) rather than MainMenu.
      // Hook name retained until a broader rename sweep (scope: future polish).
      startMainMenuScene: () => this.scene.start('Croft'),
      unregisterRunAutoSave: () => this.runPersistence?.unregisterMidRunHooks(),
      // T402 — Game Over run-identity radiator (parity with pause panel).
      getCurrentAct: () => this.runActState.currentAct,
      getRouteLabels: () => resolveRouteLabels(this.runActState.pickerHistory),
      getRelicLabels: () => resolveRelicLabels(this.relicSystem ?? null),
      getRuneLabels: () => resolveRuneLabels(this.ownedRuneIds),
      getBossKillCount: () => this.runScore.bossKillCount,
      getRoutePicks: () => this.runActState.pickerHistory,
      getHeldRelicKeys: () => this.relicSystem?.heldKeys() ?? [],
      getReplayBlob: () => this.replayRecorder?.finalize() ?? null,
      getEnteredHealingCircle: () => this.hazardZones?.didEnterHealingCircle() ?? false,
      getBiomesVisited: () => this.biomeController?.getBiomesVisited() ?? [],
      getEvolvedWeaponCount: () => this.weaponSystem?.getEvolvedWeaponCount() ?? 0,
      areSeasonalEventsDisabled: () => this.settingsManager.load().disableSeasonalEvents,
      // T401 P3 — replay-aware persistence; reads `this.replayInput` at
      // call time so the gate stays correct across create()'s lifecycle.
      isReplayPlayback: () => this.replayInput !== null,
      recordRun,
      loadSave,
    }));

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

    // Phase 5 Bucket 7 finish — combat cascade install. Builds
    // EnemyKillHandler + WeaponSystem listeners + XPSystem listeners +
    // PlayerHitResolver and registers the player↔enemy overlap. Lazy
    // getters preserve the wire-before-construct contract for juice /
    // hud / banter / pickupSpawner / levelUpFlow (all constructed
    // below).
    ({ playerEnemyCollider: this.playerEnemyCollider } = installCombatCollisions({
      scene: this,
      player: this.player,
      spawnSystem: this.spawnSystem,
      weaponSystem: this.weaponSystem,
      xpSystem: this.xpSystem,
      timeManager: this.timeManager,
      deathCauseTracker: this.deathCauseTracker,
      iFrameController: this.iFrameController,
      floatTextPool: this.floatTextPool,
      runScore: this.runScore,
      runRng: this.runRng,
      runStatsTracker: this.runStatsTracker,
      runeBag: this.runeBag,
      updateTickers: this.updateTickers,
      grudgeLedger: this.grudgeLedger,
      getJuice: () => this.juice,
      getHud: () => this.hud,
      getBanter: () => this.banter,
      getPickupSpawner: () => this.pickupSpawner,
      getLevelUpFlow: () => this.levelUpFlow,
      getRunModifiers: () => this.runModifiers,
      getActiveVariantKey: () => this.activeVariant?.key,
      getActiveCurseKey: () => this.activeCurseKey,
      getSFXManager: () => this.getSFXManager(),
      getSettingsManager: () => this.settingsManager,
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
      onHunterFieldNote: (x, y) => this.pickupSpawner.spawnFieldNote(x, y),
      onEliteKilled: (x, y) => this.relicOrchestrator.rollAndSpawn('elite', x, y),
      onBossKilled: (bossKey, x, y) => this.relicOrchestrator.rollAndSpawn('boss', x, y, bossKey),
      bumpBossKillCount,
      bumpCursedVictoryByBoss,
      modifyLifesteal: (base, nowMs) => this.relicEffectDriver?.modifyLifesteal(base, nowMs) ?? base,
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
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
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
    }));

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
        // Burns echo — "Nae man can tether time or tide" Tam-o'-Shanter
        // couplet on the cursed-run slow window. Scheduled past the
        // 8 s banter cooldown + a small grace so it lands on a quiet
        // tick after curse_start has flushed.
        this.time.delayedCall(9_000, () => {
          this.banter?.request('burns_citation', { tag: 'nae_haste' });
        });
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
    // Phase 5 Bucket 10 partial — runtime ambient + pickup install.
    // Stop prior-run instances first (scene reuse on retry).
    this.weather?.stop();
    this.hazards?.stop();
    ({
      weather: this.weather,
      hazards: this.hazards,
      gameTickers: this.gameTickers,
      pickupSpawner: this.pickupSpawner,
    } = installRuntimeAmbient({
      scene: this,
      getPlayer: () => this.player,
      getJuice: () => this.juice,
      getCurrentBiomeId: () => this.getCurrentBiomeId(),
      getRunRng: () => this.runRng,
      isIFramesActive: () => this.iFrameController.isActive(),
      getUiViewport: () => this.getUiViewport(),
      getBanter: () => this.banter,
      getActiveVariantKey: () => this.activeVariant.key,
      hasEnemyNearby: (r) => this.hasEnemyNearby(r),
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
      getXPSystem: () => this.xpSystem,
      getUpdateTickers: () => this.updateTickers,
      getSFXManager: () => this.getSFXManager(),
      getChestDurationBonusMs: () => this.chestDurationBonusMs,
      getChestRegistry: () => this.chestRegistry,
      getFloatTextPool: () => this.floatTextPool,
      getRelicEffectDriver: () => this.relicEffectDriver,
      getLevelUpFlow: () => this.levelUpFlow,
      getRuneSystemController: () => this.runeSystemController,
      getRunScore: () => this.runScore,
      pushPickupDespawnHandle: (h) => { this.pickupDespawnHandles.push(h); },
      attachRelicSpawner: () => this.relicOrchestrator.attachSpawner(),
      onWeatherShutdown: () => { this.weather = null; },
      onHazardsShutdown: () => { this.hazards = null; },
    }));

    // Cairn Stacking scheduler (DESIGN_IDEAS §1) — three highland-stone
    // pickups across the run, third collect fires the Cairn's Blessing
    // (full heal + 8 s magnet pulse). In-line ctor here (not in
    // installRunBookkeeping) because the spawn hook needs `pickupSpawner`,
    // which is built one block above.
    this.cairnStacking = new CairnStackingScheduler({
      getRunRng: () => this.runRng,
      getPlayer: () => this.player,
      getVictoryPending: () => this.runScore.victoryPending,
      getJuice: () => this.juice,
      getBanter: () => this.banter,
      spawnCairnStone: (onCollect, onExpired) => {
        this.pickupSpawner.spawnCairnStone(onCollect, onExpired);
      },
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
    });
    this.cairnStacking.reset();

    // Lemmings Easter Egg (DESIGN_IDEAS §13) — cliff-edge parade homage
    // to DMA Design / Dundee 1991. Always-on per-run orchestrator; idle
    // 90 s in coastal biome triggers the once-per-variant parade. Pure
    // cosmetic. In-line ctor here (after banter init upstream and the
    // pickupSpawner block) so all deps are resolved.
    this.lemmingsEasterEgg = new LemmingsEasterEgg({
      scene: this,
      getPlayerXY: () => ({ x: this.player.x, y: this.player.y }),
      getActiveVariantKey: () => this.activeVariant.key,
      getCurrentBiomeId: () => this.getCurrentBiomeId(),
      // "Still" threshold — 8 px/s lets drag-decay below player intent
      // count as still without forcing absolute zero. Player input
      // resumes ticking the trigger to 0 the moment movement intent
      // drives velocity above the threshold.
      isPlayerStill: () => {
        const body = this.player.body as Phaser.Physics.Arcade.Body | null;
        const vx = body?.velocity.x ?? 0;
        const vy = body?.velocity.y ?? 0;
        return Math.hypot(vx, vy) < 8;
      },
      hasVariantSeen: (key) => {
        try {
          return loadSave().lemmingsSeenForVariant.includes(key);
        } catch {
          return false;
        }
      },
      persistVariantSeen: (key) => bumpLemmingsSeenForVariant(key),
      requestBanter: () => this.requestBanter('lemmings_remember'),
      playSfx: () => audio.playLemmingsOhNo(),
    });

    // Phase 5 Bucket 6 partial — LevelUpFlow + RunLifecycle ctors bundled.
    ({ levelUpFlow: this.levelUpFlow, runLifecycle: this.runLifecycle } = installRunFlow({
      scene: this,
      getPlayer: () => this.player,
      getXPSystem: () => this.xpSystem,
      getSpawnSystem: () => this.spawnSystem,
      getJuice: () => this.juice,
      getTimeManager: () => this.timeManager,
      getUiViewport: () => this.getUiViewport(),
      armIFrames: (ms) => this.armIFrames(ms),
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
      getWeaponSystem: () => this.weaponSystem,
      getStatusFxPool: () => this.statusFxPool,
      getTutorialSystem: () => this.tutorialSystem,
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
      drainPendingChests: () => this.drainPendingChests(),
      requestBanter: (ctx, tag) => this.requestBanter(ctx, tag),
      getDiscoveryRunId: () => this.discoveryRunId(),
      tryChestLegendaryRelicOverride: () => this.relicOrchestrator.tryChestOverride(),
      getRelicLuckPoints: () => this.relicEffectDriver?.luckDrawPoints() ?? 0,
      isBossKilledThisRun: () => this.runScore.bossKillCount > 0,
      getOwnedRuneIds: () => this.ownedRuneIds,
      grantRune: (runeId) => this.grantRune(runeId),
      isPostBell: () => this.runLifecycle?.isPostBell() ?? false,
      getOverchargedWeaponKeys: () => this.weaponSystem.getOverchargedKeys(),
      getSaveManager: () => this.metaSaveManager,
      getDeathCauseTracker: () => this.deathCauseTracker,
      getBanter: () => this.banter,
      getGrudgeLedger: () => this.grudgeLedger,
      getSettingsManager: () => this.settingsManager,
      getCamera: () => this.cameras.main,
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
      isDailyRun: () => this.runIsDaily,
    }));
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

    // Phase 5 Bucket 11 — post-flow startup chain (HUD scaffolding,
    // debug surfaces, audio init, ceremony, countdown handshake).
    // Extracted to `installRunStartupHud` — see that helper for the
    // ordering contract.
    installRunStartupHud(this, {
      resumeRun,
      initNodeMapForAct: (act, stretch) => this.initNodeMapForAct(act, stretch),
      trySpawnAncestralEcho: () => this.trySpawnAncestralEcho(),
      toggleUiPause: () => this.toggleUiPause(),
    });
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
      nicnevinWildHunt: this.nicnevinWildHunt,
      setNicnevinWildHunt: (next) => { this.nicnevinWildHunt = next; },
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
    runFrameTick(this, delta);
  }

  armIFrames(durationMs: number): void {
    this.iFrameController.arm(durationMs);
  }

  toggleUiPause(): void {
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
        this.pauseMenu = new PauseMenu(this, buildPauseMenuHooks(this));
      }
      this.pauseMenu.open();
    }
  }

  // Phase 5 Bucket 3 — moor moments (mercy luck, ancestral echo, standing
  // stones, reliquary, run-identity toast) extracted to
  // `scenes/game/moorMoments.ts`. Methods below are thin delegators so
  // existing call sites keep their `this.tryMoorMercyLuck(...)` /
  // `this.spawnStandingStones(...)` shape.

  buildSecondTickHookContext(): SecondTickHookContext {
    return {
      spawnSystem: this.spawnSystem,
      juice: this.juice,
      moorMoments: this.moorMoments,
      cairnStacking: this.cairnStacking,
      getStandingStones: () => this.standingStones,
      getReliquary: () => this.reliquary,
      getReliquarySpawnSec: () => this.reliquarySpawnSec,
      getClootieTree: () => this.clootieTree,
      getClootieSpawnSec: () => this.clootieSpawnSec,
      getStonesWarned: () => this.stonesWarned,
      markStonesWarned: () => { this.stonesWarned = true; },
      spawnStandingStones: () => this.spawnStandingStones(),
      spawnReliquary: () => this.spawnReliquary(),
      spawnClootieTree: () => this.spawnClootieTree(),
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

  private spawnClootieTree(): void {
    if (this.clootieTree) return;
    this.clootieTree = moorMomentsSpawnClootieTree(this.buildMoorMomentsContext());
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
    initNodeMapForActImpl(
      {
        scene: this,
        getSuppressNextNodeMapRoll: () => this.suppressNextNodeMapRoll,
        setSuppressNextNodeMapRoll: (v) => { this.suppressNextNodeMapRoll = v; },
        runActState: this.runActState,
        nodeMapSystem: this.nodeMapSystem,
        nodeMarkerSystem: this.nodeMarkerSystem,
        runRng: this.runRng,
        player: this.player,
      },
      act,
      stretch,
    );
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

  // Chest sprite track/untrack/markers extracted to ChestSpriteRegistry.
}
