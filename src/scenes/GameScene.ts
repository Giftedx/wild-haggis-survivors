import * as Phaser from 'phaser';
import { Player } from '../entities/Player';
import { createGrudgeLedger, type GrudgeLedgerState } from '../entities/grudgeLedger';
import type { SpawnSystem } from '../systems/SpawnSystem';
import type { WeaponSystem } from '../systems/WeaponSystem';
import type { XPSystem } from '../systems/XPSystem';
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
import type { ClipRecorder } from '@/utils/clipRecorder';
import { loadSave } from '../utils/save';
import { GameMusicState } from '../systems/music/ProceduralMusicEngine';
import { VariantDef, formatRunVariantLabel } from '../data/variants';
import { ISceneContext } from '../core/ISceneContext';
import { UpdateTickers, TickerHandle } from '../utils/UpdateTickers';
import { SubscriptionBag } from '../utils/SubscriptionBag';
import { encodeSeed, type RNG } from '../utils/rng';
import type { ReplayRecorder } from '../replay/ReplayRecorder';
import type { ReplayInput } from '../replay/ReplayInput';
import type { ReplayBlobAny } from '../replay/replayBlob';
import { parseGameSceneInitData } from './gameSceneInitData';
import type { SharedRunSetup } from '../utils/sharedRunUrl';
import { DebugOverlay } from '../ui/DebugOverlay';
import { SaveManager } from '../core/SaveManager';
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
import { installWorldAndAtmosphere } from './game/installWorldAndAtmosphere';
import { installPlayerAndRunStart } from './game/installPlayerAndRunStart';
import { installCombatAndUpgrades } from './game/installCombatAndUpgrades';
import { installUiLandmarksAndFlow } from './game/installUiLandmarksAndFlow';
import { FilmGrainOverlay } from './game/FilmGrainOverlay';
import { IFrameController } from './game/IFrameController';
import { RunEndTickers } from './game/RunEndTickers';
import type { MoorMomentScheduler } from './game/MoorMomentScheduler';
import { CairnStackingScheduler } from './game/CairnStackingScheduler';
import { CairnOfEchoesScheduler } from './game/CairnOfEchoesScheduler';
import { CailleachGauntletScheduler } from './game/CailleachGauntletScheduler';
import { EngineerTurretSystem } from './game/EngineerTurretSystem';
import { TuftedFamiliarSystem } from './game/TuftedFamiliarSystem';
import type { WhisperResult } from './game/cairnOfEchoesWhisper';
import {
  createCairnSpriteForScene,
  destroyCairnSpriteOnScene,
  handleCairnWalkOverOnScene,
  type CairnSceneWireDeps,
} from './game/cairnOfEchoesSceneWire';
import {
  type FallenCairn,
} from '../utils/save/fallenCairns';
import {
  type MoorMomentsState,
  createMoorMomentsState,
  type MoorMomentsContext,
  spawnStandingStones as moorMomentsSpawnStandingStones,
  spawnReliquary as moorMomentsSpawnReliquary,
  spawnClootieTree as moorMomentsSpawnClootieTree,
  spawnBlackClootieTree as moorMomentsSpawnBlackClootieTree,
} from './game/moorMoments';
import { PauseMenu } from './game/PauseMenu';
import { buildPauseMenuHooks } from './game/buildPauseMenuHooks';
import { canOpenPauseMenu } from './game/pauseGate';
import type { PickupSpawner } from './game/PickupSpawner';
import { RunActState } from './game/RunActState';
import { StandingStones } from './game/standingStones';
import { Reliquary } from './game/reliquary';
import { ClootieTree } from './game/clootieTree';
import type { LemmingsEasterEgg } from './game/lemmingsEasterEgg';
import { AncestralEcho } from './game/ancestralEcho';
import { launchActIntermission as launchActIntermissionImpl } from './game/actIntermissionLauncher';
import type { RoutePick, RouteResumeContext } from '../data/routes';
import { FloatTextPool } from './game/FloatTextPool';
import type { RunPersistenceBridge } from './game/RunPersistenceBridge';
import type { RunHistoryRecorder } from './game/RunHistoryRecorder';
import type { RunPersistenceCoordinator } from './game/RunPersistenceCoordinator';
import { generateHaggisName } from '@/data/haggisNames';
import type { DebugTimeTravelApi } from './game/DebugTimeTravelApi';
import type { BossHpTracker } from './game/BossHpTracker';
import { ChestSpriteRegistry } from './game/ChestSpriteRegistry';
import type { RunExitComposer } from './game/RunExitComposer';
import { RunScoreState } from './game/RunScoreState';
import { recordReplayFrame } from './game/replayBridgeInstall';
import { captureReplayStateHash, shouldCaptureReplayStateHash } from './game/replayStateHash';
import { installRunEndShutdown } from './game/runEndShutdown';
import { buildRunEndShutdownDeps } from './game/buildRunEndShutdownDeps';
import { resetTransientRunState as resetTransientRunStateImpl } from './game/resetTransientRunState';
import type { LevelUpFlow } from './game/LevelUpFlow';
import type { RunLifecycle } from './game/RunLifecycle';
import { RelicOrchestrator } from './game/RelicOrchestrator';
import { type RelicKey } from '../data/relics';
import type { HazardZones } from './game/HazardZones';
import type { GameTickers } from './game/GameTickers';
import { CaptionManager } from '../systems/a11y/CaptionManager';
import { CaptionOverlay } from '../systems/a11y/CaptionOverlay';
import {
  installAutoBattleTimeScale,
  isAutoBattleEnabled,
} from '../dev/AutoBattler';
import { type SecondTickHookContext } from './game/runtimeTickHooks';
import type { HaarFogController } from '../systems/shaders/HaarFogController';
import { LivingWorldDirector } from './game/LivingWorldDirector';
import { CompanionSystem } from './game/CompanionSystem';

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
  /**
   * W82 Phase 3 — most recent boss-kill highlight snapshot. Captured
   * non-destructively from `clipRecorder.snapshot()` inside the
   * `onBossKilled` callback at run time; consumed live by the Game
   * Over save-highlight link. Reset in `resetTransientRunState` so
   * a recycled scene instance never serves the previous run's clip.
   * Held only in memory — does not survive a page refresh. See
   * `src/scenes/game/bossKillHighlight.ts` for the contract.
   */
  bossKillHighlight: import('./game/bossKillHighlight').BossKillHighlight | null = null;
  /**
   * Wee Tales (2026-05-11) — ordered list of boss enemy keys killed
   * this run. Populated alongside `bossKillHighlight` in the
   * `onBossKilled` callback. Read by GameOverScene to drive the
   * wee-tale picker's tag-set (so a "three_bosses victory" line
   * matches a run that actually killed gordon + tour_bus + taxman).
   * Reset in `resetTransientRunState`.
   */
  bossKilledKeys: string[] = [];
  /**
   * Wild Living World Initiative (2026-05-11) — cross-track
   * coordinator for companions, Selkie form, rhythm weapon,
   * atmosphere shader, music bridge, Croft surface. Owns no
   * gameplay randomness and no Phaser objects; subsystems register
   * with it as they come up. Reset in `resetTransientRunState`.
   */
  readonly livingWorldDirector = new LivingWorldDirector();
  /**
   * Wild Living World — Whistle-Call Companions system. Spawns +
   * follows the single sheepdog companion this run. Cosmetic-only on
   * its first ship; future slices widen via `companionTypes.ts`.
   * Nullable between runs because it lives in scene-managed memory
   * (sprite + tweens) and is rebuilt each `create()` pass.
   */
  companionSystem: CompanionSystem | null = null;
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
  readonly moorMomentsState: MoorMomentsState = createMoorMomentsState();
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
  /** Black Clootie — rare second wager (25 % of runs, [13:00, 18:00]).
   *  Deeper boons, higher HP cost, dark visual. Null when disabled or
   *  not yet spawned. */
  blackClootieTree: ClootieTree | null = null;
  /** Lemmings Easter Egg (DESIGN_IDEAS §13) — once-per-variant cliff-edge
   *  parade. Idle 90 s in coastal biome triggers the homage to DMA Design
   *  / Dundee 1991. Cosmetic-only; no balance impact. Null between runs;
   *  re-built each create() pass. */
  lemmingsEasterEgg: LemmingsEasterEgg | null = null;
  /** Run-specific second at which the clootie tree spawns (DESIGN_IDEAS §1). */
  private clootieSpawnSec: number = 0;
  /** Run-specific second at which the black clootie can spawn; 0 = disabled
   *  this run (75 % of runs). */
  private blackClootieSpawnSec: number = 0;
  /** Taxman Grudge Ledger — silent per-run finish buffer (DESIGN_IDEAS §1).
   *  Weapon listener appends one entry per elite/boss kill;
   *  `RunLifecycle.handleVictory` reads + judges the verdict at run end.
   *  Reset on scene reuse via `resetTransientRunState`. */
  grudgeLedger: GrudgeLedgerState = createGrudgeLedger();
  /** Ancestral Echo — spectral haggis at last-death spot. Nulls on resolve. */
  ancestralEcho: AncestralEcho | null = null;
  /** Batched toast for max-level XP → gold conversion (avoids spam). */
  xpOverflowGoldBatch: number = 0;
  /** Chests deferred while paused — queued so multiple timer callbacks don't overwrite each other. */
  pendingChests: Array<{ golden: boolean }> = [];
  gameTickers!: GameTickers;
  revivalAvailable: boolean = false;
  activeVariant!: VariantDef;
  /** Extra ms added to chest/coin despawn windows by the Treasure Magnet permanent upgrade. */
  chestDurationBonusMs: number = 0;

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
  replayStateHashMismatches: string[] = [];
  pendingReplay: ReplayBlobAny | null = null;
  /** v2 route queue — `launchActIntermission` shifts one off per act boundary during playback. */
  pendingReplayRoutes: RoutePick[] = [];
  /** Pending seed passed via init() data. Consumed in create(). */
  private pendingRunSeed: number | null = null;
  /** Set when the run is a Daily Challenge attempt — drives save tracking + end-of-run UI. */
  runIsDaily: boolean = false;
  /** Optional variant override from init data (seeded / daily runs). Cleared in create(). */
  pendingForceVariantKey: string | null = null;
  /**
   * T303 — curse selection passed via `scene.start('Game', { curseKey })`.
   * Replaces the prior `pendingCurseKey` module singleton so a stale pick
   * cannot leak from one run into the next via process-wide state. Set by
   * init() (or the v2 replay blob), consumed once in create().
   */
  pendingCurseKey: string | null = null;
  /**
   * S1 Phase 1 — Sporran Deck picks passed via
   * `scene.start('Game', { pickedSporranIds })`. Consumed once in
   * `create()` after the curse pass and before the seasonal pass —
   * `applySporranRunStart` mutates `runModifiers` then post-spawn
   * heals fire alongside the seasonal toast pipeline. `null` for any
   * run that did not go through `SporranScene`.
   */
  pendingSporranIds: readonly string[] | null = null;
  /**
   * W82 Shared-run URL — set when BootScene launched this run from a
   * `?run=...&v=...` deep link. GameScene consumes it once during
   * `create()` to show the "Shared run loaded · <variant> · <curse>"
   * welcome toast, then nulls it (so a hot-replay through the same
   * scene instance doesn't re-fire the banner).
   */
  pendingSharedRunMeta: SharedRunSetup | null = null;
  /** W27 — full setup retained through the run for challenge-attempt recording at run-end. */
  activeSharedRun: SharedRunSetup | null = null;
  /**
   * S1 Phase 2 — snapshot of the picks that actually landed at run
   * start (filtered to known cards via `applySporranPicks`). Read by
   * `installReplayRecording` to fold the picks into the v3 blob and by
   * `RunHistoryRecorder.buildContext` to surface them in the chronicle
   * row. Empty when the player took the Curse / clean path or for a
   * resumed run (which already absorbed picks at the original start).
   */
  committedSporranIds: readonly string[] = [];
  /**
   * T101 — set by `RunPersistenceBridge.applyResume` when it reconstructs
   * the rolled `currentActNodeMap` from the snapshot. The next
   * `initNodeMapForAct` call clears the flag and reuses the restored map
   * instead of re-rolling — so the player's visited[] survives resume.
   * Subsequent calls (act 3 stretch transitions) re-roll normally.
   */
  suppressNextNodeMapRoll = false;

  /** Pickup lifetimes — scheduled on scene-owned UpdateTickers. */
  pickupDespawnHandles: TickerHandle[] = [];
  readonly runEndTickers = new RunEndTickers();
  /** End-of-run screen-space fade overlays — tracked as fields so shutdown
   *  can destroy them; anonymous locals would orphan on scene restart since
   *  Phaser's scene.stop() doesn't clear the display list. */
  victoryFade: Phaser.GameObjects.Rectangle | null = null;
  deathFade: Phaser.GameObjects.Rectangle | null = null;
  subs = new SubscriptionBag();
  debugOverlay: DebugOverlay | null = null;
  announcedEvolutionReady = new Set<string>();
  playerEnemyCollider: Phaser.Physics.Arcade.Collider | null = null;
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
  statusFxPool!: StatusFxPool;
  /** Pooled floating text for high-frequency combat/pickup feedback (armor, gold). */
  readonly floatTextPool = new FloatTextPool();
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
  burnsPlatterSpawned: boolean = false;
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
  runName = '';
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
  pauseMenu: PauseMenu | null = null;
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
  runHistoryRecorder!: RunHistoryRecorder;
  /**
   * T401 P3 — replay-aware wrapper around `RunHistoryRecorder.record`
   * and the legacy `recordRun` save call. Built once `runHistoryRecorder`
   * exists; `RunLifecycle` reads through it so the playback no-op is
   * unit-testable instead of an anonymous closure.
   */
  runPersistenceCoordinator!: RunPersistenceCoordinator;
  hazardZones!: HazardZones;
  captionManager: CaptionManager | null = null;
  captionOverlay: CaptionOverlay | null = null;
  filmGrain: FilmGrainOverlay | null = null;
  banter: BanterSystem | null = null;
  readonly gameplaySessionGuard = createGameplaySessionGuard(() => {
    getAnalyticsManager().endGameplaySession();
  });

  moorMoments!: MoorMomentScheduler;
  cairnStacking!: CairnStackingScheduler;
  /**
   * The Moor Remembers (spec 2026-05-22) — orchestrates persistent
   * past-self cairns loaded from `whs_meta_save.fallenCairns`. Created
   * in `create()` after the cairnStacking ctor, ticked from
   * `tickFrameWorld` after the pause-gate. Sister to `cairnStacking`.
   */
  cairnOfEchoesScheduler!: CairnOfEchoesScheduler;
  /**
   * V2 — Cailleach Gauntlet scheduler. Ticked in `tickFrameWorld`
   * after the cairn scheduler. Fires hook callbacks on phase
   * transitions: armed (7th cairn touched), candles_lit (14:00),
   * cailleach_spawned (15:00), cailleach_down (win), cailleach_dominant
   * (lose). Reset per-run in `resetTransientRunState`.
   * Spec: docs/archive/superpowers/specs/2026-05-22-moor-remembers-v2-design.md.
   */
  cailleachGauntletScheduler!: CailleachGauntletScheduler;
  /** V2 — opaque teardown returned by `installCailleachGauntlet`. */
  gauntletTeardown: (() => void) | null = null;
  /**
   * DESIGN_IDEAS §3 — Corryvreckan encounter install. Ticked per-frame
   * via `tickFrameWorld`; null between runs. Reset on each `create()`.
   */
  corryVreckanInstall: import('./game/installCorryVreckan').CorryVreckanInstall | null = null;
  /** Engineer variant turret — null when variant is not engineer. */
  engineerTurretSystem: EngineerTurretSystem | null = null;
  /** Turret sprite — held here so resetTransientRunState can destroy it. */
  engineerTurretSprite: Phaser.GameObjects.Image | null = null;
  /** Tufted variant familiar — null when variant is not tufted. */
  tuftedFamiliarSystem: TuftedFamiliarSystem | null = null;
  /** Pup sprite — held here so resetTransientRunState can destroy it. */
  tuftedPupSprite: Phaser.GameObjects.Image | null = null;
  /**
   * Live sprite refs keyed by FallenCairn identity so the scheduler's
   * `onSpriteCreate` / `onSpriteDestroy` callbacks can find and tween
   * the right sprite. Cleared in `resetTransientRunState` (the
   * scheduler.destroy path runs each create()).
   */
  cairnSprites = new Map<FallenCairn, Phaser.GameObjects.Sprite>();
  /**
   * True until the first cairn is touched this run — routes the first
   * past-self walk-over banter to `past_self_first` (a slightly more
   * acknowledging line), subsequent touches to `past_self`. Reset to
   * true on each `create()` pass.
   */
  firstCairnTouchedThisRun = true;
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
      cairnOfEchoesScheduler: this.cairnOfEchoesScheduler ?? null,
      relicSlotUI: this.relicSlotUI,
      grudgeLedger: this.grudgeLedger,
      livingWorldDirector: this.livingWorldDirector,
      companionSystem: this.companionSystem,
      setCompanionSystem: (v) => { this.companionSystem = v; },
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
      setBlackClootieSpawnSec: (v) => { this.blackClootieSpawnSec = v; },
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
      blackClootieTree: this.blackClootieTree,
      setBlackClootieTree: (v) => { this.blackClootieTree = v; },
      setLemmingsEasterEgg: (v) => { this.lemmingsEasterEgg = v; },
      setAncestralEcho: (v) => { this.ancestralEcho = v; },
      setRelicSlotUI: (v) => { this.relicSlotUI = v; },
      setXpOverflowGoldBatch: (v) => { this.xpOverflowGoldBatch = v; },
      setBossKillHighlight: (v) => { this.bossKillHighlight = v; },
      setBossKilledKeys: (v) => { this.bossKilledKeys = v; },
    });

    // S1 Phase 2 — clear last run's snapshot. The field is overwritten
    // a few lines into create() once `buildSporranRunStartPlan` returns,
    // but explicit reset keeps the "blank every transient field" contract
    // honest if a future create() pivot reads it earlier.
    this.committedSporranIds = [];
    this.replayStateHashMismatches = [];

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
    this.pendingSharedRunMeta = resolved.pendingSharedRunMeta;
    this.activeSharedRun = resolved.pendingSharedRunMeta;
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

    // create() phase 1 — static world + atmosphere (terrain, haar, biome,
    // dressing, rune-pulse RNG branch, lifecycle reset, captions, banter).
    // RNG branch order preserved inside the helper (replay determinism).
    installWorldAndAtmosphere(this);

    // create() phase 2 — variant resolution, T1 replay bridge, curse +
    // sporran + seasonal run-start plans, Player construction, and the
    // post-spawn blessing pipeline. Returns the locals later phases need.
    // RNG consumption order preserved inside the helper (replay determinism).
    const { selectedVariant, spawnPx, spawnPy } = installPlayerAndRunStart(this, {
      save,
      resumeRun,
    });

    // create() phase 3 — camera, hazard zones, core combat trio, per-run
    // state resets, variant starter kit, Selkie bind, and permanent
    // upgrades + Ironmoor lock. RNG consumption order preserved in helper.
    installCombatAndUpgrades(this, { selectedVariant, resumeRun });

    // create() phase 4 (final) — UI, landmarks, run flow, startup chain.
    // Run-bookkeeping + composers, resume hydration, upgrade UI, combat
    // collisions, HUD/Juice/Banter, ceremony, runtime ambient, companion
    // + cairn + Cailleach Gauntlet + Corryvreckan + variant-companion +
    // Lemmings installs, LevelUpFlow + RunLifecycle, identity/intro toasts,
    // and the post-flow startup-HUD chain. Order preserved in the helper.
    installUiLandmarksAndFlow(this, { resumeRun, selectedVariant, spawnPx, spawnPy });
  }

  private registerShutdownCleanup(): void {
    // Clean up on scene shutdown (prevents stale timers/listeners on restart).
    // Body extracted to `installRunEndShutdown` (T401 slice 6) — every
    // silenced-catch is preserved one-for-one in the helper so partial-init
    // failures cannot short-circuit the shutdown sequence.
    installRunEndShutdown(buildRunEndShutdownDeps(this));
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
      const replayFrameIndex = this.replayRecorder?.getFrameCount() ?? this.replayInput?.getFrameIndex() ?? -1;
      const stateHash = shouldCaptureReplayStateHash(replayFrameIndex)
        ? captureReplayStateHash(this, replayFrameIndex)
        : undefined;
      const expectedStateHash = this.replayInput?.getCurrentStateHash();
      if (expectedStateHash && stateHash !== expectedStateHash) {
        this.replayStateHashMismatches.push(
          `frame ${replayFrameIndex}: expected ${expectedStateHash}, got ${stateHash ?? 'missing'}`,
        );
      }
      recordReplayFrame({
        recorder: this.replayRecorder,
        snapshot: this.player ? this.player.peekReplayInputFrame() : null,
        dtMs: delta,
        stateHash,
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
      getBlackClootieTree: () => this.blackClootieTree,
      getBlackClootieSpawnSec: () => this.blackClootieSpawnSec,
      getStonesWarned: () => this.stonesWarned,
      markStonesWarned: () => { this.stonesWarned = true; },
      spawnStandingStones: () => { if (!this.standingStones) this.standingStones = moorMomentsSpawnStandingStones(this.buildMoorMomentsContext()); },
      spawnReliquary: () => { if (!this.reliquary) this.reliquary = moorMomentsSpawnReliquary(this.buildMoorMomentsContext()); },
      spawnClootieTree: () => { if (!this.clootieTree) this.clootieTree = moorMomentsSpawnClootieTree(this.buildMoorMomentsContext()); },
      spawnBlackClootieTree: () => { if (!this.blackClootieTree) this.blackClootieTree = moorMomentsSpawnBlackClootieTree(this.buildMoorMomentsContext()); },
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
    };
  }

  buildMoorMomentsContext(): MoorMomentsContext {
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
      // The Moor Remembers — 30 s echo expiry settles into a permanent
      // cairn for the rest of this run. The death-spot's cairn record
      // is already persisted (RunLifecycle wrote it on the prior death).
      onEchoSettle: (x, y) => this.settleEchoIntoCairn(x, y),
    };
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
  initNodeMapForAct(act: 1 | 2 | 3, stretch: Act3Stretch = 1): void {
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

  launchActIntermission(actN: 1 | 2): void {
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
  discoveryRunId(): string {
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
  grantRune(runeId: string): void {
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

  /**
   * Shinty Parry v2 — ISceneContext hook. Player.tryParryProjectile
   * calls this on a reflect-consume; WeaponSystem materialises the
   * returned ball and owns its damage path.
   */
  fireParryReflect(fromX: number, fromY: number, velocityX: number, velocityY: number, damage: number): void {
    this.weaponSystem?.fireParryReflect(fromX, fromY, velocityX, velocityY, damage);
  }

  // ── The Moor Remembers (spec 2026-05-22) ──────────────────────────
  // CairnOfEchoes sprite + walk-over wiring. The scheduler is hook-
  // driven so it stays Phaser-free + unit-testable; the methods below
  // own the live sprite refs + side effects.

  /** Bundle the scene-bound refs the cairn wire needs. Built per call so
   *  late-init systems (banter) are picked up after they're attached. */
  private cairnWireDeps(): CairnSceneWireDeps {
    return {
      scene: this,
      player: this.player ?? null,
      banter: this.banter ?? null,
      metaSaveManager: this.metaSaveManager,
      floatTextPool: this.floatTextPool,
      settingsManager: this.settingsManager,
      caption: (id, message, color, durationMs) =>
        this.caption(id, message, color, durationMs),
    };
  }

  spawnCairnSprite(cairn: FallenCairn): void {
    if (this.cairnSprites.has(cairn)) return;
    const sprite = createCairnSpriteForScene(this.cairnWireDeps(), cairn);
    if (sprite) this.cairnSprites.set(cairn, sprite);
  }

  destroyCairnSprite(cairn: FallenCairn): void {
    const sprite = this.cairnSprites.get(cairn);
    if (sprite) {
      destroyCairnSpriteOnScene(this.cairnWireDeps(), sprite);
      this.cairnSprites.delete(cairn);
    }
  }

  handleCairnWalkOver(cairn: FallenCairn, whisper: WhisperResult): void {
    handleCairnWalkOverOnScene(this.cairnWireDeps(), cairn, whisper, {
      firstThisRun: this.firstCairnTouchedThisRun,
      setFirstThisRun: (v) => {
        this.firstCairnTouchedThisRun = v;
      },
    });
  }

  /** Handoff for the 30 s AncestralEcho ghost when it expires untouched. */
  private settleEchoIntoCairn(spotX: number, spotY: number): void {
    // The death record was already persisted at death time; here we
    // only light up the in-scene sprite for the rest of THIS run.
    const cairn = this.metaSaveManager
      .getFallenCairns()
      .find((c) => Math.abs(c.x - spotX) < 1 && Math.abs(c.y - spotY) < 1);
    if (cairn) this.cairnOfEchoesScheduler.addCairn(cairn);
  }

  // V2 Cailleach Gauntlet glue lives in `installCailleachGauntlet`.

  getCurrentBiomeId(): BiomeId | null {
    if (!this.biomeController || !this.player) return null;
    return this.biomeController.currentBiomeAt(this.player.x, this.player.y);
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
  getGrudgeLedger(): GrudgeLedgerState {
    return this.grudgeLedger;
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

  public getRunName(): string {
    return this.runName;
  }

  public setRunName(name: string): void {
    this.runName = name;
  }

  public getClipRecorder(): ClipRecorder | null {
    return this.clipRecorder;
  }

  public getBossKillHighlight(): import('./game/bossKillHighlight').BossKillHighlight | null {
    return this.bossKillHighlight;
  }

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
}
