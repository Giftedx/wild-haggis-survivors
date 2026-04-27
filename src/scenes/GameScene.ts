import * as Phaser from 'phaser';
import { GAME, COLORS_CSS } from '../config';
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
import { UpgradeCardsUI } from '../ui/UpgradeCards';
import { HUD } from '../ui/HUD';
import { EdgeIndicators } from '../ui/EdgeIndicators';
import { Minimap } from '../ui/Minimap';
import { NodeMapUI } from '../ui/NodeMapUI';
import { NodePromptUI } from '../ui/NodePromptUI';
import { RelicSlotUI } from '../ui/RelicSlotUI';
import { getActBank, getAct3Bank, type Act3Stretch } from '../data/nodeBanks';
import type { NodeDef } from '../data/nodeTypes';
import type { NodeMapState } from '../systems/NodeMapSystem';
import { resolveEncounterEvent } from '../systems/nodeEvents/encounterEvent';
import { resolveEliteEvent } from '../systems/nodeEvents/eliteEvent';
import { resolveRestEvent } from '../systems/nodeEvents/restEvent';
import { resolveHiddenEvent } from '../systems/nodeEvents/hiddenEvent';
import { resolveShrineEvent } from '../systems/nodeEvents/shrineEvent';
import { resolveWeeTraderEvent } from '../systems/nodeEvents/weeTraderEvent';
import { rollRandomUnheldPassive } from '../data/upgrades';
import { resolveBargainEvent } from '../systems/nodeEvents/bargainEvent';
import { NodeWaveTracker, type NodeWaveMember } from '../systems/nodeEvents/NodeWaveTracker';
import { shrineLabelFromKey, bargainLabelFromOfferKey } from './game/nodeEventLabels';
import { JuiceSystem } from '../systems/JuiceSystem';
import { createPhaserTimeAdapter, TimeManager } from '../systems/TimeManager';
import { createRecordingAudioStream, disposeRecordingAudioStream } from '@/systems/audioContext';
import { ClipRecorder } from '@/utils/clipRecorder';
import {
  recordRun, loadSave, isLastDeathFresh,
  bumpStandingStonePick, bumpAncestralEchoesTouched, bumpReliquaryCurioPick,
  bumpRoutePicked, bumpItemAcquired, bumpBanterHeard, bumpFirstTimeEvent,
  bumpBossKillCount, bumpCursedVictoryByBoss, addFirstRouteVisit,
  consumeLastDeath,
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
import { burnsPlatterDamageBuff } from '../systems/seasonal/burnsNightEffects';
import { getAnalyticsManager } from '../core/AnalyticsManager';
import { globalEventBus } from '../core/GlobalEventBus';
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
import { applyShrineBuff, isRegisteredShrineBuffKey } from '../systems/shrineBuffRegistry';
import { RuneConditionSystem } from '../systems/RuneConditionSystem';
import { createRuneEffectBag, drainRunePulses } from '../systems/runes/runeEffects';
import {
  composeBagpipesRadiusMul,
  composeBassAttackSpeedMul,
  composeEnemySlowMul,
  composeGoldMul,
  noteCascadeKill,
} from '../systems/runes/runeConsumer';
import { RUNES } from '../data/runes';
import { buildRuneEvalContextFromScene } from './game/runeContextBuilder';
import { TutorialSystem } from '../systems/TutorialSystem';
import type { EliteAffixId } from '../data/eliteAffixes';
import { BIOMES, type BiomeId } from '../data/biomes';
import type { BiomeManager } from '../systems/BiomeManager';
import { BiomeController } from './game/BiomeController';
import { shouldReseedAtSec } from '../systems/biomeReseedSchedule';
import { FloraScatter } from '../systems/FloraScatter';
import { WildlifeSystem } from '../systems/WildlifeSystem';
import { MistLayer } from '../systems/MistLayer';
import { FilmGrainOverlay } from './game/FilmGrainOverlay';
import { IFrameController } from './game/IFrameController';
import { RunEndTickers } from './game/RunEndTickers';
import { showCountdown } from './game/CountdownOverlay';
import { MoorMomentScheduler } from './game/MoorMomentScheduler';
import { crossesMoorMercyHpFrac } from './game/moorMercyTrigger';
import { formatRunIdentityToast } from './game/runIdentityToast';
import {
  finalizeNodeVisit as finalizeNodeVisitHelper,
  peekReplayChoiceFor as peekReplayChoiceForHelper,
} from './game/nodeVisitFinalizer';
import { PauseMenu } from './game/PauseMenu';
import { canOpenPauseMenu } from './game/pauseGate';
import { PickupSpawner } from './game/PickupSpawner';
import { EnemyKillHandler } from './game/EnemyKillHandler';
import { RunActState } from './game/RunActState';
import { StandingStones, STONE_SPAWN_SEC, STONE_WARN_SEC, type StoneBoon } from './game/standingStones';
import { Reliquary, chooseReliquarySpawnSec, type ReliquaryCurio } from './game/reliquary';
import {
  AncestralEcho,
  ECHO_GOLD_REWARD,
  ECHO_HEAL_REWARD,
} from './game/ancestralEcho';
import { ActIntermissionScene } from './ActIntermissionScene';
import { applyRouteModifierDeltas } from './actIntermissionResolve';
import type { PickerSlot, RouteDef, RoutePick, RouteResumeContext } from '../data/routes';
import { getRoute } from '../data/routes';
import { FloatTextPool } from './game/FloatTextPool';
import { PlayerHitResolver } from './game/PlayerHitResolver';
import { RunPersistenceBridge } from './game/RunPersistenceBridge';
import { restoreHeldRelics } from './game/SavedStateHydrator';
import { RunHistoryRecorder } from './game/RunHistoryRecorder';
import { RunPersistenceCoordinator } from './game/RunPersistenceCoordinator';
import { resolveResumeNodeMapTarget } from './game/resumeNodeMapTarget';
import { generateHaggisName } from '@/data/haggisNames';
import { pickAncestor } from '@/data/ancestorWhispers';
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
import { installTreasureChestTimer } from './game/installTreasureChestTimer';
import { wireSceneKeybindings } from './game/wireSceneKeybindings';
import { tickAutoBattleSteering } from './game/tickAutoBattleSteering';
import { updateMusicStateScratch } from './game/updateMusicStateScratch';
import { updateHudWeaponRows } from './game/updateHudWeaponRows';
import { pickTrailColor } from '../data/weaponTrailColors';
import { LevelUpFlow } from './game/LevelUpFlow';
import { RunLifecycle } from './game/RunLifecycle';
import { RelicSystem } from '../systems/RelicSystem';
import { RelicEffectDriver } from '../systems/relics/RelicEffectDriver';
import { RelicPickupSpawner } from '../entities/RelicPickup';
import { FiannaSpirit } from '../entities/FiannaSpirit';
import { openRelicPickupPrompt } from '../ui/RelicPickupPrompt';
import { RELICS, type RelicDef, type RelicKey } from '../data/relics';
import type { RelicPickupSource } from '../entities/RelicPickup';
import { decideRelicCollect } from '../ui/relicCollect';
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
import { BALANCE } from '../core/BalanceConfig';
import { registerDebugHotkeys } from './dev/debugHotkeys';
import { computeMantleTier } from '../animation/mantleTier';
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

/**
 * Adapt an Enemy to the NodeWaveTracker's member contract. Alive-for-wave
 * keys off both `active` (die() path clears it) and the tag identity so
 * pool re-acquire reads as "not this wave". Position getters return the
 * enemy's live coords each tick — the tracker uses them to capture the
 * last-known centroid one frame before all members die (elite relic
 * drops at the kill site rather than the node pip).
 */
function buildEnemyWaveMember(enemy: Enemy): NodeWaveMember {
  return {
    get x() { return enemy.x; },
    get y() { return enemy.y; },
    isAliveForWave(tag: string) {
      return enemy.active && enemy.nodeWaveTag === tag;
    },
  };
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
  private timeManager!: TimeManager;
  private updateTickers = new UpdateTickers();
  private clipRecorder: ClipRecorder | null = null;
  private edgeIndicators!: EdgeIndicators;
  private minimap!: Minimap;
  /** M1 Moor Road — per-run node-path system + HUD widget. */
  private readonly nodeMapSystem = new NodeMapSystem();
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
  /** All per-run counters (kills, boss/coin gold, elite chain, victory state). */
  private readonly runScore = new RunScoreState();
  /** M1 F4 — timed shrine buffs. Cleared (not reverted) on scene restart. */
  private readonly tempBuffBag = new TempBuffBag();
  /** W2 Moor Road: act number + picker history across the run. */
  private readonly runActState = new RunActState();
  /** One-time +luck draw weight when HP first crosses into the mercy band. */
  private moorMercyLuckGranted = false;
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
  /** R1 — Relic slots + drop-roll orchestration. Fresh instance per run. */
  private relicSystem!: RelicSystem;
  /** R1 — stateful effect dispatcher. Fresh instance per run. */
  private relicEffectDriver!: RelicEffectDriver;
  /** R1 — Phaser-bound spawner for dropped Relic pickups. */
  private relicPickupSpawner: RelicPickupSpawner | null = null;
  /** R1 M4.5 P5 — live Fianna summon entities (fingals_horn). Empty
   *  until the horn is sounded; cleared on scene restart. */
  private activeFiannaSpirits: FiannaSpirit[] = [];
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
    this.nodeMapSystem.reset();
    this.nodeWaveTracker.reset();
    this.nodeMapUI?.destroy();
    this.nodeMapUI = null;
    this.nodePromptUI?.destroy();
    this.nodePromptUI = null;
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
    this.moorMercyLuckGranted = false;
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
    // R1 — clear held Relics + dropped pickups before a fresh run. A
    // scene instance can be reused across runs; without this the
    // previous run's sporran bleeds into the next.
    this.relicPickupSpawner?.destroyAll();
    this.relicPickupSpawner = null;
    // R1 M4.5 P5 — dispose lingering Fianna from prior run before a
    // fresh start (10s lifetime straddles restart otherwise).
    for (const spirit of this.activeFiannaSpirits) {
      try { spirit.destroy(); } catch { /* ignore */ }
    }
    this.activeFiannaSpirits = [];
    this.relicSystem = new RelicSystem();
    this.relicEffectDriver = new RelicEffectDriver(this.relicSystem);
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
    const bm = this.getBiomeManager();
    if (bm) {
      this.floraScatter?.destroy();
      this.floraScatter = new FloraScatter();
      this.floraScatter.create(this, bm, GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT, this.runRng.branch());

      this.wildlifeSystem?.destroy();
      this.wildlifeSystem = new WildlifeSystem();
      this.wildlifeSystem.create(this, bm, GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT, this.runRng.branch());

      this.mistLayer?.destroy();
      this.mistLayer = new MistLayer();
      this.mistLayer.create(
        this, GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT,
        this.runRng.branch(),
        this.settingsManager.load().reduceParticles,
      );
    }

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

    // Camera before GrowthSystem so baseZoom matches the zoom used in-game (GrowthSystem reads cameras.main.zoom in its ctor).
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.3);
    this.cameras.main.setBounds(0, 0, GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT);

    // Spawn map hazard and healing zones (lava + healing circles).
    // HazardZones needs runLifecycle.onPlayerHitZero for lava deaths, but
    // runLifecycle isn't built yet at this point. The closure over
    // `this.runLifecycle` resolves lazily — first lava tick happens much
    // later, by which time it's wired.
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
      restoreHeldRelics: (keys) => this.restoreHeldRelics(keys),
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
      spawnRelicAt: (key, x, y) => this.debugSpawnRelicAt(key, x, y),
      getHeldRelicKeys: () => this.relicSystem?.heldKeys() ?? [],
      getRelicCatalogue: () => RELICS,
      openRelicDiscardPromptForAudit: () => {
        if (this.relicDiscardModalOpen) return false;
        this.restoreHeldRelics(['sporran_of_holding', 'oatcake_stash', 'grans_thimble']);
        this.openRelicDiscardModal(RELICS.whisky_dram, 'bargain');
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
      onEliteKilled: (x, y) => this.rollAndSpawnRelic('elite', x, y),
      onBossKilled: (bossKey, x, y) => {
        // H1 M2 T15 — persist per-boss kill counts for the Croft
        // mantelpiece trophy tiers. Cursed-run kills also promote the
        // cursed tier regardless of whether the run ends in victory.
        bumpBossKillCount(bossKey);
        if (this.activeCurseKey) bumpCursedVictoryByBoss(bossKey);
        this.rollAndSpawnRelic('boss', x, y, bossKey);
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
    this.weaponSystem.events.on(
      'enemyKilled',
      (
        x: number,
        y: number,
        xpValue: number,
        enemyKey: string,
        wasBoss: boolean,
        wasElite: boolean = false,
        eliteAffixId?: EliteAffixId | null,
      ) => this.enemyKillHandler.handle(x, y, xpValue, enemyKey, wasBoss, wasElite, eliteAffixId),
    );
    // U1 M4 — Cascade Rune kill bookkeeper. Independent listener so the
    // primary kill cascade owner stays unchanged. No-op when no cascade
    // rune is equipped (the consumer guard short-circuits on null cfg).
    this.weaponSystem.events.on('enemyKilled', () => {
      noteCascadeKill(this.runeBag);
    });

    // Floating damage numbers + hit sound + DPS tracking + impact ring burst
    this.weaponSystem.events.on('damageDealt', (x: number, y: number, amount: number, isCrit: boolean, weaponKey?: string) => {
      this.juice.showDamageNumber(x, y, amount, isCrit);
      this.juice.spawnImpactRing(x, y);
      this.hud.logDamage(amount);
      this.runStatsTracker.addWeaponDamage(weaponKey ?? 'unknown', amount);
      this.getSFXManager().tryPlay('hit', () => audio.playHitImmediate());
    });

    // Projectile trails — palette lookup lives in src/data/weaponTrailColors.
    // Math.random here is cosmetic (not gameplay RNG) so unseeded is fine.
    this.weaponSystem.events.on('projectileTrail', (x: number, y: number, evolved: boolean, wKey: string) => {
      this.juice.spawnTrail(x, y, pickTrailColor(wKey, evolved, Math.random()));
    });

    // Body-pulse animation beat — any weapon fire flags the attacking
    // one-shot on the player. AnimationController gates so a 167 ms
    // beat completes before the next fire can retrigger it.
    this.weaponSystem.events.on('weaponFired', () => {
      this.player.notifyWeaponFired();
    });

    // When player levels up, pause and show upgrade choices
    this.xpSystem.events.on('levelup', (newLevel: number) => {
      this.levelUpFlow.handleLevelUp(newLevel);
      // Celebrating one-shot — haggis hops in place. Plays once, loops
      // four frames while the upgrade overlay is up, then the FSM
      // returns to idle/walking when the overlay dismisses.
      this.player.notifyCelebrate();
      // Tag with the active variant so iron_belly/moor_runner flavor
      // their celebration; other variants fall through to the generic
      // pool silently (missing sub-pool == no special handling).
      this.banter?.request('level_up', { tag: this.activeVariant?.key });
      // A1 M4 — accessibility caption.
      this.caption('level_up', t('ui.captions.level_up'), '#ffdd66', 3500);
    });

    // Post-cap echo cards — XP past MAX_LEVEL accumulates into an echo
    // buffer. When it crosses the threshold, XPSystem emits `echoReady`
    // and the player picks a small stat boost from the ECHO_CARDS pool.
    // Same UI as a level-up but without the ceremony (no heal, no aura,
    // no milestone pulse). Gives the back half of the 15-min run real
    // agency instead of the old AFK XP-to-gold tail.
    this.xpSystem.events.on('echoReady', () => {
      this.levelUpFlow.handleEcho();
      // A1 M4 — accessibility caption.
      this.caption('echo_ready', t('ui.captions.echo_ready'), '#c8a8e8', 3500);
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
    // not survive a scene restart (stale sprites would leak).
    this.relicPickupSpawner = new RelicPickupSpawner({
      scene: this,
      player: this.player,
      tickers: this.updateTickers,
      onCollect: (relic, x, y, source) => this.handleRelicCollect(relic, x, y, source),
    });
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
      onBurnsPlatterCollect: () => this.handleBurnsPlatterCollect(),
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
      tryChestLegendaryRelicOverride: () => this.tryRelicChestOverride(),
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
    // T1 replay — fire the watching-toast once JuiceSystem exists, and
    // flip the persistent HUD chip on. The chip stays visible for the
    // whole playback because the toast is transient.
    if (this.replayInput) {
      this.juice.showToast(t('ui.replay.watching_toast'), '#88ccff');
      this.hud.setReplayMode(true);
    }
    // Ancestor whisper — 3s into the run, surface a quote from a past run's
    // haggis. Only fires when history has at least one prior entry (no whisper
    // on a player's very first run). Not fired during replay playback.
    if (!this.replayInput) {
      this.time.delayedCall(3000, () => {
        if (!this.scene.isActive()) return;
        const save = this.metaSaveManager.load();
        const history = save.runHistory ?? [];
        if (history.length === 0) return;
        const pick = pickAncestor({
          runHistory: history.map((h) => ({ name: h.name ?? '', seed: String(h.runSeed ?? '') })),
          rngSample: Math.random(),
        });
        if (!pick || !pick.name) return;
        const line = t(pick.whisperKey);
        const kinKeys = ['Great-great-gran', 'Great-gran', 'Gran', 'Auntie', 'Uncle', 'Cousin', 'Elder', 'Forebear'] as const;
        const kinKey = kinKeys[Math.floor(Math.random() * kinKeys.length)]!;
        const kin = t(`ancestor.kin.${kinKey}`);
        const msg = t('ancestor.toast', { kin, name: pick.name, line });
        this.getJuice()?.showToast(msg, TOAST_COLORS.info);
      });
    }

    this.eventBusDispose?.();
    this.eventBusDispose = wireSceneEventBus({
      getJuice: () => this.juice,
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
    });
    this.edgeIndicators = new EdgeIndicators(this);
    this.minimap = new Minimap(this);
    // Phase B Biomes — paint biome regions on the minimap.
    this.minimap.setBiomeManager(this.getBiomeManager());
    this.nodeMapUI = new NodeMapUI(this);
    this.nodePromptUI = new NodePromptUI(this);
    // Listener is registered once per scene-create and lives until reset.
    // Dispatches to per-type handlers which in turn call finalizeNodeVisit.
    // Interactive types (shrine / wee_trader / bargain) route through
    // NodePromptUI so pointer, keyboard, and gamepad paths resolve the
    // same outcome contract.
    this.nodeMapSystem.setTriggerListener((index, state) => {
      if (state.visited[index]) return;
      // Block re-trigger while an interactive prompt is already resolving.
      if (this.interactivePromptIndex >= 0) return;
      this.handleNodeTriggered(state.nodes[index], index, state);
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

    // Start clip recorder if capture is enabled
    if (getSettingsManager().load().captureEnabled) {
      const canvas = this.game.canvas;
      if (canvas) {
        this.clipRecorder = new ClipRecorder(canvas, { fps: 30, durationSec: 15 });
        if (this.clipRecorder.isAvailable()) {
          const audioStream = createRecordingAudioStream();
          this.clipRecorder.start(audioStream ?? undefined);
        } else {
          this.clipRecorder = null;
        }
      }
    }

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
    // Clean up on scene shutdown (prevents stale timers/listeners on restart)
    this.events.once('shutdown', () => {
      this.clipRecorder?.stop();
      this.clipRecorder = null;
      disposeRecordingAudioStream();
      try {
        uninstallAutoBattleTimeScale(this);
      } catch {
        /* ignore */
      }
      try {
        this.gameplaySessionGuard.endIfStarted();
      } catch {
        /* ignore */
      }
      if (this.playerEnemyCollider) {
        try { this.physics.world.removeCollider(this.playerEnemyCollider); } catch { /* ignore */ }
        this.playerEnemyCollider = null;
      }
      sfxManager.clear();
      audio.resetTransient();
      this.eventBusDispose?.();
      this.eventBusDispose = null;
      this.runPersistence?.unregisterMidRunHooks();
      this.debugTimeTravelApi?.uninstall();
      try { this.subs.dispose(); } catch { /* ignore */ }
      try { this.debugOverlay?.destroy(); } catch { /* ignore */ }
      this.debugOverlay = null;
      // Post-bell listener — outlives the scene if we don't remove it.
      this.runLifecycle?.uninstallPostBellKeyHandler();
      try { this.biomeController?.destroy(); } catch { /* ignore */ }
      this.biomeController = null;
      // F1 M5 — drop the haar reference; the camera's filter list is torn
      // down with the scene, so the controller object is released with it.
      this.haarFog = null;
      try { this.floraScatter?.destroy(); } catch { /* ignore */ }
      this.floraScatter = null;
      try { this.wildlifeSystem?.destroy(); } catch { /* ignore */ }
      this.wildlifeSystem = null;
      try { this.mistLayer?.destroy(); } catch { /* ignore */ }
      this.mistLayer = null;
      try { this.captionOverlay?.destroy(); } catch { /* ignore */ }
      this.captionOverlay = null;
      this.captionManager?.clear();
      this.captionManager = null;
      // Remove event listeners before destroying systems to prevent stacking on restart
      try { this.weaponSystem?.events?.removeAllListeners(); } catch { /* ignore */ }
      try { this.xpSystem?.events?.removeAllListeners(); } catch { /* ignore */ }
      // Flush run-scoped state on teardown to prevent "second run" bleed
      try { this.updateTickers.clear(); } catch { /* ignore */ }
      try { this.timeManager?.destroy(); } catch { /* ignore */ }
      try { this.weaponSystem?.destroy(); } catch { /* ignore */ }
      try { this.spawnSystem?.destroy(); } catch { /* ignore */ }
      try { this.tutorialSystem?.dispose(); } catch { /* ignore */ }
      try { this.xpSystem?.destroy(); } catch { /* ignore */ }
      try { this.statusFxPool?.destroy(); } catch { /* ignore */ }
      this.floatTextPool.destroyAll();
      // Close lifecycle gaps — these systems were silently orphaned before
      try { this.juice?.destroy(); } catch { /* ignore */ }
      try { this.hud?.destroy(); } catch { /* ignore */ }
      try { this.minimap?.destroy(); } catch { /* ignore */ }
      try { this.nodeMapUI?.destroy(); } catch { /* ignore */ }
      this.nodeMapUI = null;
      try { this.nodePromptUI?.destroy(); } catch { /* ignore */ }
      this.nodePromptUI = null;
      this.interactivePromptIndex = -1;
      this.nodeMapSystem.reset();
    this.nodeWaveTracker.reset();
      try { this.edgeIndicators?.destroy(); } catch { /* ignore */ }
      try { this.upgradeUI?.hide?.(); } catch { /* ignore */ }
      try { this.gameTickers?.destroy(); } catch { /* ignore */ }
      try { this.pauseMenu?.close(); } catch { /* ignore */ }
      this.pauseMenu = null;
      this.chestRegistry.forEachSprite((sprite) => {
        try { this.tweens.killTweensOf(sprite); } catch { /* ignore */ }
        try { sprite.destroy(); } catch { /* ignore */ }
      });
      this.chestRegistry.reset();
      try { this.victoryFade?.destroy(); } catch { /* ignore */ }
      this.victoryFade = null;
      try { this.deathFade?.destroy(); } catch { /* ignore */ }
      this.deathFade = null;
      try {
        this.filmGrain?.destroy();
      } catch {
        /* ignore */
      }
      this.filmGrain = null;
    });
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
    this.tickRuneSystem(delta);

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
    this.spawnSystem.update(scaledDelta, this.player.x, this.player.y);

    // M1 — tick node proximity + refresh HUD widget. Tick fires listener
    // while player is within trigger radius of an un-visited node; the
    // registered listener marks visited + logs outcome + advances cursor.
    this.nodeMapSystem.tick({ x: this.player.x, y: this.player.y });
    this.nodeMapUI?.update(
      this.runActState.currentActNodeMap,
      this.runActState.currentNodeIndex,
    );

    const runSec = Math.floor(this.spawnSystem.getGameTimeSec());
    if (runSec !== this.lastEmittedRunSecond) {
      this.lastEmittedRunSecond = runSec;
      globalEventBus.emit('GLOBAL_RUN_TIME_SEC', {
        gameTimeSec: this.spawnSystem.getGameTimeSec(),
        wholeSecond: runSec,
      });
      this.moorMoments.tick(runSec);
      // Use `>=` so a lag spike or paused-then-resumed second-counter that
      // skips the exact tick still triggers — once-only guard prevents repeats.
      if (runSec >= STONE_WARN_SEC && !this.stonesWarned && !this.standingStones) {
        this.stonesWarned = true;
        this.juice.showToast(t('ui.standingStones.warn_toast'), '#ffe080');
        this.caption('standing_stones_warn', t('ui.standingStones.warn_caption'), '#ffe080', 3000);
      }
      if (runSec >= STONE_SPAWN_SEC && !this.standingStones) {
        this.spawnStandingStones();
      }
      if (this.reliquarySpawnSec > 0 && runSec >= this.reliquarySpawnSec && !this.reliquary) {
        this.spawnReliquary();
      }
    }

    this.standingStones?.tick();
    this.reliquary?.tick();
    // R1 — per-frame relic effect tick. Scaled delta so timer-based
    // rare effects (Gran's Teapot damage-free seconds) pause correctly
    // with the game rather than running off wall-clock.
    this.relicEffectDriver?.updatePerFrame(scaledDelta);
    // grans_teapot — heal 5% max HP/s after 5s unharmed. Integer heals
    // only; fractional carry lives inside the driver state.
    const teapotHeal = this.relicEffectDriver?.tickGransTeapotFrame(
      scaledDelta,
      this.player.getMaxHp(),
    ) ?? 0;
    if (teapotHeal > 0) this.player.heal(teapotHeal);
    this.relicSlotUI?.update();

    if (this.ancestralEcho) {
      const resolved = this.ancestralEcho.tick(scaledDelta);
      if (resolved) this.ancestralEcho = null;
    }

    // Pass player facing and upgrade multipliers to weapon system.
    // Always update from player.rotation (persists when stationary) so
    // directional weapons like arc_sweep don't use a stale angle.
    this.weaponSystem.setPlayerFacing(this.player.rotation - Math.PI / 2);
    // U1 M4 — fold rune bass-attack-speed flag (Song Rune) on top of the
    // player's attack-speed stack so the weapon cooldown formula sees a
    // single composed value. Identity (1.0) when the rune is inactive.
    const bassAtkSpeedMul = composeBassAttackSpeedMul(this.runeBag);
    this.weaponSystem.setMultipliers(
      this.player.getDamageMultiplier()
        * this.juice.getComboDamageMultiplier()
        * burnsPlatterDamageBuff(this.time.now, this.burnsPlatterPickedUpAtMs),
      this.player.getAoeMultiplier(),
      this.player.getAttackSpeedMultiplier() * bassAtkSpeedMul,
      this.player.getCritChance(),
      this.player.getCooldownReduction(),
      // R1 M3 T20a — grans_thimble +8% crit multiplier composes on top
      // of existing stacks so it scales with other crit bonuses rather
      // than replacing them.
      this.relicEffectDriver.modifyCritMultiplier(this.player.getCritDamageMultiplier()),
    );
    // U1 M4 — Piper Rune folds bagpipes radius once per frame.
    this.weaponSystem.setBagpipesRadiusMul(composeBagpipesRadiusMul(this.runeBag));
    this.weaponSystem.update(scaledDelta, this.player.x, this.player.y);

    // R1 M4.5 P5 — tick live Fianna summons + sweep expired. Use
    // scaledDelta so slow-mo shortens the spirits' effective lifetime
    // in lockstep with every other timed effect.
    if (this.activeFiannaSpirits.length > 0) {
      const enemies = this.spawnSystem.getEnemyGroup().getChildren() as Enemy[];
      const kept: FiannaSpirit[] = [];
      for (const spirit of this.activeFiannaSpirits) {
        spirit.tick(scaledDelta, enemies);
        if (spirit.active && !spirit.isExpired()) kept.push(spirit);
      }
      this.activeFiannaSpirits = kept;
    }

    this.xpSystem.update(this.player.x, this.player.y, this.player.getPickupRadius(), this.player.getHpFraction());
    // Juice is cosmetic (shake, combo toasts, damage numbers) — stays on raw
    // delta so VFX don't stall during slow-mo and the combo meter still decays
    // at wall-clock rate.
    this.juice.update(delta, this.player.getHpFraction());

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

    this.hud.updateDPS(delta);
    this.hud.updateShield(this.player.hasShield());
    this.hud.setAct(this.runActState.currentAct);
    this.hud.setIronmoor(this.activeIronmoorRun);
    this.hud.setDaily(this.runIsDaily, this.getRunSeedCode());
    this.hud.setGold(this.runScore.getGoldBalance());
    const wn = updateHudWeaponRows(this.hudWeaponScratch, this.weaponSystem.getWeapons());
    this.hud.update(
      this.player.getHp(), this.player.getMaxHp(),
      this.xpSystem.getLevel(),
      this.xpSystem.getXPFraction(),
      this.spawnSystem.getGameTimeSec(),
      this.runScore.killCount,
      this.spawnSystem.getActiveCount(),
      this.player.getDashCharges(),
      this.player.getMaxDashCharges(),
      this.player.getDashCooldownFraction(),
      this.hudWeaponScratch,
      this.ownedPassives,
      wn,
      this.activeCurseKey,
    );
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
          onWhiskyDramRequested: () => this.activateWhiskyDram(),
          isFingalsHornAvailable: () => this.relicEffectDriver?.isFingalsHornAvailable() ?? false,
          onFingalsHornRequested: () => this.activateFingalsHorn(),
        });
      }
      this.pauseMenu.open();
    }
  }

  /**
   * First time each run the player crosses from above → at/below the mercy HP
   * fraction, grant one-time luck weight to level-up draws (see `BALANCE.player`).
   */
  private tryMoorMercyLuck(hpBefore: number): void {
    if (this.moorMercyLuckGranted) return;
    const hpAfter = this.player.getHp();
    const maxHp = this.player.getMaxHp();
    const th = BALANCE.player.moorMercyHpFrac;
    if (!crossesMoorMercyHpFrac(hpBefore, hpAfter, maxHp, th)) return;
    this.moorMercyLuckGranted = true;
    this.player.addLuckDrawBonus(BALANCE.player.moorMercyLuckBonus);
    this.juice.showToast(t('ui.game.moor_mercy_luck'), '#c8a8e8');
    this.caption('moor_mercy', t('ui.game.moor_mercy_luck_caption'), '#c8a8e8', 4200);
  }

  // onPlayerHitEnemy extracted to src/scenes/game/PlayerHitResolver.ts

  /**
   * Unified death/revival handler. Called from any damage source that can
   * reduce HP to zero (contact damage, lava zones, future DoT effects, etc.).
   * Safe to no-op if victory is already pending.
   */
  /**
   * Soul weave — run start: hand off variant identity + intent in the first moments of play.
   */
  /**
   * Ancestral Echo — if the player died recently (within TTL), spawn
   * a spectral haggis at the death spot that fades after 30s or on
   * touch. Touching grants a small pity reward. Best-effort: a save
   * read that throws is swallowed, no echo shows.
   */
  private trySpawnAncestralEcho(): void {
    if (this.ancestralEcho) return;
    try {
      const save = loadSave();
      if (!save.lastDeath || !isLastDeathFresh(save.lastDeath)) return;
      const deathX = save.lastDeath.x;
      const deathY = save.lastDeath.y;
      this.ancestralEcho = new AncestralEcho({
        scene: this,
        player: this.player,
        textureKey: this.activeVariant.textureKey,
        echoX: deathX,
        echoY: deathY,
        onTouch: () => {
          // Reward: gold + small heal. XP overflow batching handles
          // max-level gracefully via existing coins path; we just add
          // gold directly and heal the player.
          this.runScore.addBossGold(ECHO_GOLD_REWARD);
          this.player.heal(ECHO_HEAL_REWARD);
          this.juice.showToast(t('ui.ancestralEcho.touch_toast'), '#b0d4ff');
          this.caption('ancestral_echo_touch', t('ui.ancestralEcho.touch_caption'), '#b0d4ff', 3000);
          audio.playEchoTouch();
          bumpAncestralEchoesTouched();
          // B1 Phase 4 Task 22 — "John Anderson My Jo" sub-pool. Echo touch
          // is naturally once-per-run (consumeLastDeath + ancestralEcho
          // guard), so no extra throttle needed. Priority 43 wins the tick
          // after the echo reward toast lands.
          this.banter?.request('burns_citation', { tag: 'lineage_moment' });
        },
      });
      this.ancestralEcho.spawn();
      this.juice.showToast(t('ui.ancestralEcho.announce_toast'), '#b0d4ff');
      this.caption('ancestral_echo_announce', t('ui.ancestralEcho.announce_caption'), '#b0d4ff', 3500);
      this.tutorialSystem?.notifyAncestralEchoIfFirst();
      // Consume the echo so it doesn't re-spawn every run. Fresh death
      // on this run will write a new one via RunLifecycle.
      consumeLastDeath();
    } catch {
      /* best-effort */
    }
  }

  /**
   * Standing Stones — spawn the 5:00 trinity. First approach within
   * STONE_PICK_RADIUS_PX wins its boon, the other two crumble.
   */
  private spawnStandingStones(): void {
    if (this.standingStones) return;
    this.standingStones = new StandingStones({
      scene: this,
      player: this.player,
      rng: this.runRng,
      onPick: (boon: StoneBoon) => {
        const title = t(boon.titleKey);
        this.juice.showToast(t('ui.standingStones.grant_toast', { title }), '#ffe080');
        this.caption('standing_stones_pick', t(boon.descKey), '#ffe080', 3500);
        audio.playStoneGrant();
        bumpStandingStonePick(boon.id);
      },
    });
    this.standingStones.spawn();
    this.juice.showToast(t('ui.standingStones.announce_toast'), '#ffe080');
    this.caption('standing_stones_announce', t('ui.standingStones.announce_caption'), '#ffe080', 3000);
    this.tutorialSystem?.notifyStandingStonesIfFirst();
  }

  /**
   * Reliquary — single off-path relic. Grants a run-scoped curio when
   * the player walks into it. No pre-warning, no crumble — finding it
   * is itself the reward, so the announcement stays tight.
   */
  private spawnReliquary(): void {
    if (this.reliquary) return;
    this.reliquary = new Reliquary({
      scene: this,
      player: this.player,
      rng: this.runRng,
      worldWidth: GAME.WORLD_WIDTH,
      worldHeight: GAME.WORLD_HEIGHT,
      onPick: (curio: ReliquaryCurio) => {
        const title = t(curio.titleKey);
        const desc = t(curio.descKey);
        this.juice.showToast(t('ui.reliquary.grant_toast', { title }), '#ffb060');
        this.caption('reliquary_pick', t('ui.reliquary.grant_caption', { desc }), '#ffb060', 3500);
        audio.playStoneGrant();
        bumpReliquaryCurioPick(curio.id);
        // C1 M3 Task 16 — also persist into the DiscoveryLog so the
        // Almanac's Finds book lights up the relic entry. Lifetime
        // counter (`bumpReliquaryCurioPick`) and discovery counter
        // are kept distinct: the lifetime counter powers the
        // `ach_relic_seeker` deed, the discovery log feeds Finds.
        bumpItemAcquired(curio.id, this.discoveryRunId(), Date.now());
        this.banter?.request('reliquary_pick');
      },
    });
    this.reliquary.spawn();
  }

  private showRunIdentityToast(isResume: boolean): void {
    const v = this.activeVariant;
    this.juice.showToast(
      formatRunIdentityToast(isResume, t(v.nameKey), t(v.flavorKey)),
      '#c8dcff',
    );
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
  }

  /**
   * Dispatch a triggered node to the right event handler. Passive
   * events (encounter / elite / rest / hidden) apply inline; interactive
   * events (shrine / wee_trader / bargain) route through NodePromptUI.
   */
  private handleNodeTriggered(node: NodeDef, index: number, state: NodeMapState): void {
    switch (node.type) {
      case 'encounter':
        this.applyEncounterNode(node, index, state);
        break;
      case 'elite':
        this.applyEliteNode(node, index, state);
        break;
      case 'rest':
        this.applyRestNode(node, index);
        break;
      case 'hidden':
        this.applyHiddenNode(node, index, state);
        break;
      case 'shrine':
        this.openShrineNode(node, index);
        break;
      case 'wee_trader':
        this.openTraderNode(node, index, state);
        break;
      case 'bargain':
        this.openBargainNode(node, index);
        break;
    }
  }

  /**
   * Finish a node visit: mark in the system, log the outcome, advance
   * the HUD cursor past any run of now-visited nodes. Shared by every
   * event handler — callers pass `chosenRewardKey` when the event had
   * a branching outcome (reward kind picked / trade accepted).
   */
  /**
   * T401 — delegated to the pure helper at
   * `src/scenes/game/nodeVisitFinalizer.ts`. The behavior contract is
   * unchanged: mark the node visited, record outcome on RunActState,
   * push to replay recorder, consume any matching playback outcome,
   * walk the cursor past contiguously visited slots.
   */
  private finalizeNodeVisit(index: number, nodeKey: string, chosenRewardKey?: string): void {
    finalizeNodeVisitHelper(
      {
        nodeMap: this.nodeMapSystem,
        runActState: this.runActState,
        replayRecorder: this.replayRecorder,
        replayInput: this.replayInput,
        clock: this.spawnSystem,
      },
      index,
      nodeKey,
      chosenRewardKey,
    );
  }

  /**
   * M1 F5 — delegated to `peekReplayChoiceFor` in
   * `src/scenes/game/nodeVisitFinalizer.ts`. Returns the recorded
   * `chosenRewardKey` when in playback mode AND the next outcome
   * matches `nodeKey`; null + warn-on-mismatch otherwise.
   */
  private peekReplayChoiceFor(nodeKey: string): string | null {
    return peekReplayChoiceForHelper(this.replayInput, nodeKey);
  }

  /**
   * Encounter node (M1 F1) — spawn the declared enemy mix with a wave
   * tag, then defer finalize until every spawned enemy dies. Each
   * `forceSpawn` call returns the acquired Enemy; it's wrapped as a
   * NodeWaveMember whose `isAliveForWave(tag)` gate keys off the
   * scene-visible `Enemy.active` + `Enemy.nodeWaveTag`. Pool re-acquire
   * nulls the tag in `Enemy.spawn()`, so a stale reference reads as
   * "not alive for this wave" even if the pool recycles the object.
   *
   * Empty `enemyMix` (should not happen in authored data, but resolver
   * contract allows it) falls through the tracker's zero-member path and
   * finalizes synchronously.
   */
  private applyEncounterNode(node: NodeDef, index: number, state: NodeMapState): void {
    const spec = resolveEncounterEvent(node);
    const spawnPos = state.worldPositions[index];
    this.nodeWaveTracker.register(
      index,
      node.key,
      'encounter',
      (tag) => {
        const members: NodeWaveMember[] = [];
        for (const entry of spec.enemyMix) {
          for (let i = 0; i < entry.count; i++) {
            const enemy = this.spawnSystem.forceSpawn(entry.key, { waveTag: tag });
            if (enemy) members.push(buildEnemyWaveMember(enemy));
          }
        }
        return members;
      },
      () => {
        this.finalizeNodeVisit(index, node.key);
      },
      { x: spawnPos.x, y: spawnPos.y },
    );
  }

  /**
   * Elite node (M1 F2) — force-spawn the declared elite with a wave
   * tag; defer finalize AND the guaranteed relic drop until the elite
   * dies. Relic drops at the kill position (centroid from the tracker's
   * last tick while alive) so the reward reads as earned rather than
   * as a free pickup at the node pip. Drop roll is rolled on death so
   * `runRng` consumption stays deterministic (same seed → same relic).
   *
   * If the pool is saturated and `forceSpawn` returns null, the wave has
   * zero members and finalizes synchronously via the zero-member path
   * (the relic drop still fires at the node position).
   */
  private applyEliteNode(node: NodeDef, index: number, state: NodeMapState): void {
    const spec = resolveEliteEvent(node);
    const spawnPos = state.worldPositions[index];
    this.nodeWaveTracker.register(
      index,
      node.key,
      'elite',
      (tag) => {
        const enemy = this.spawnSystem.forceSpawn(spec.enemyKey, { elite: true, waveTag: tag });
        return enemy ? [buildEnemyWaveMember(enemy)] : [];
      },
      (killPos) => {
        if (spec.guaranteedRelic && this.relicPickupSpawner) {
          const relic = this.relicSystem.rollDrop('elite', this.runRng, { luckMultiplier: 2 });
          if (relic) {
            this.relicPickupSpawner.spawn(relic, killPos.x, killPos.y, 'elite');
          }
        }
        this.finalizeNodeVisit(index, node.key);
      },
      { x: spawnPos.x, y: spawnPos.y },
    );
  }

  /**
   * Rest node — heal + grant a reroll token. Toast carries the flavour
   * line (full i18n copy lands in M5).
   */
  private applyRestNode(node: NodeDef, index: number): void {
    const spec = resolveRestEvent(node);
    const heal = Math.max(1, Math.ceil(this.player.getMaxHp() * spec.healRatio));
    this.player.heal(heal);
    for (let i = 0; i < spec.rerollTokens; i++) {
      this.upgradeUI?.grantReroll();
    }
    this.juice.showToast(t('nodes.ui.toast.rest'), TOAST_COLORS.reward);
    this.finalizeNodeVisit(index, node.key);
  }

  /**
   * Hidden node — roll reward. 'relic' spawns a relic pickup at the
   * node position; 'lore_fragment' surfaces a toast. Relic falls back
   * to a lore toast if every relic is already held.
   */
  private applyHiddenNode(node: NodeDef, index: number, state: NodeMapState): void {
    const spec = resolveHiddenEvent(node, this.runRng);
    if (spec.kind === 'relic' && this.relicPickupSpawner) {
      const relic = this.relicSystem.rollDrop('hidden_node', this.runRng);
      if (relic) {
        const pos = state.worldPositions[index];
        this.relicPickupSpawner.spawn(relic, pos.x, pos.y, 'hidden_node');
        this.finalizeNodeVisit(index, node.key, 'relic');
        return;
      }
    }
    this.juice.showToast(t('nodes.ui.toast.hidden_empty'), TOAST_COLORS.reward);
    this.finalizeNodeVisit(index, node.key, 'lore_fragment');
  }

  /** Open/close pause bracket for interactive node prompts. */
  private enterInteractivePrompt(index: number): void {
    this.interactivePromptIndex = index;
    this.timeManager.request('NODE_PROMPT', { pausePhysics: true, timeScale: 0 });
  }

  private exitInteractivePrompt(index: number, nodeKey: string, chosenRewardKey: string | null): void {
    this.timeManager.release('NODE_PROMPT');
    this.interactivePromptIndex = -1;
    this.finalizeNodeVisit(index, nodeKey, chosenRewardKey ?? undefined);
  }

  /**
   * Shrine node — prompt with 3 buff candidates. Combat-buff keys
   * (damage / speed / armor / crit / pickup) route through `TempBuffBag`
   * with the resolver's `durationMs`; gold / xp / luck stay immediate.
   */
  private openShrineNode(node: NodeDef, index: number): void {
    const spec = resolveShrineEvent(node, this.runRng);
    if (spec.candidates.length === 0) {
      this.finalizeNodeVisit(index, node.key, 'empty_pool');
      return;
    }
    // M1 F5 — playback auto-applies the recorded boon pick instead of
    // re-opening the modal. `applyShrineBoon` consumes runRng for
    // `buff_luck`, so skipping it in replay would desync future rolls —
    // we run the same apply path here.
    const replayChoice = this.peekReplayChoiceFor(node.key);
    if (replayChoice !== null) {
      if (replayChoice !== 'refused') this.applyShrineBoon(replayChoice, spec.durationMs);
      this.finalizeNodeVisit(index, node.key, replayChoice);
      return;
    }
    this.enterInteractivePrompt(index);
    this.nodePromptUI?.show({
      title: t('nodes.ui.shrine_title'),
      body: t('nodes.ui.shrine_body'),
      options: spec.candidates.map((c) => ({
        key: c.key,
        label: shrineLabelFromKey(c.key),
      })),
      allowSkip: true,
      onResolve: (chosenKey) => {
        if (chosenKey) this.applyShrineBoon(chosenKey, spec.durationMs);
        this.exitInteractivePrompt(index, node.key, chosenKey ?? 'refused');
      },
    });
  }

  /**
   * Apply a shrine boon. M1 F4 — combat buffs (damage / speed / armor /
   * crit / pickup) route through `TempBuffBag` via the shrine-buff
   * registry (single applyShrineBuff entry point so the deltas stay in
   * one place AND the bag's snapshot stays JSON-serialisable for resume
   * — T101 follow-up). Gold / xp / luck stay immediate, and unsupported
   * keys (regen / reflect / dodge — missing revertible stat hooks) fall
   * back to the pre-F4 20% heal stand-in so the pick always delivers
   * something.
   */
  private applyShrineBoon(key: string, durationMs: number): void {
    if (isRegisteredShrineBuffKey(key)) {
      applyShrineBuff(this.tempBuffBag, key, durationMs, { player: this.player });
      this.showShrineTimedToast(key, durationMs);
      return;
    }
    switch (key) {
      case 'buff_regen':
      case 'buff_reflect':
      case 'buff_dodge': {
        // Missing revertible hooks (addHpRegen is capped, setThorns is
        // non-additive, no dodge stat). Ship the 20% heal stand-in until
        // the stat API grows — documented as a known F4 gap.
        const heal = Math.max(1, Math.ceil(this.player.getMaxHp() * 0.2));
        this.player.heal(heal);
        this.juice.showToast(t('nodes.ui.toast.shrine_boon', { label: shrineLabelFromKey(key) }), TOAST_COLORS.reward);
        break;
      }
      case 'buff_gold': {
        this.runScore.addCoinGold(50);
        this.juice.showToast(t('nodes.ui.toast.shrine_gold'), TOAST_COLORS.reward);
        break;
      }
      case 'buff_xp': {
        this.xpSystem?.spawnGem(this.player.x, this.player.y, 25);
        this.juice.showToast(t('nodes.ui.toast.shrine_xp'), TOAST_COLORS.reward);
        break;
      }
      case 'buff_luck': {
        // v1: drop a rare relic right there, treated as "lucky pick".
        if (this.relicPickupSpawner) {
          const relic = this.relicSystem.rollDrop('hidden_node', this.runRng);
          if (relic) {
            this.relicPickupSpawner.spawn(relic, this.player.x, this.player.y, 'hidden_node');
            this.juice.showToast(t('nodes.ui.toast.shrine_luck_relic'), TOAST_COLORS.reward);
            break;
          }
        }
        this.runScore.addCoinGold(30);
        this.juice.showToast(t('nodes.ui.toast.shrine_luck_gold'), TOAST_COLORS.reward);
        break;
      }
      default:
        this.juice.showToast(t('nodes.ui.toast.shrine_boon', { label: shrineLabelFromKey(key) }), TOAST_COLORS.reward);
    }
  }

  /**
   * Wee Trader node — prompt with the resolver's stock. Each pick costs
   * the rolled `priceGold`, deducted from `RunScoreState.coinGoldSpent`
   * via `spendCoinGold`. Unaffordable options are disabled at the modal.
   * F8-pending: the 'passive' slot still grants a stub +40g refund when
   * accepted because no mid-run passive grant exists yet.
   */
  private openTraderNode(node: NodeDef, index: number, state: NodeMapState): void {
    const spec = resolveWeeTraderEvent(node, this.runRng);
    const items = spec.items;
    if (items.length === 0) {
      this.finalizeNodeVisit(index, node.key, 'no_stock');
      return;
    }
    // M1 F5 — playback auto-applies the recorded trader pick. applyTraderRelic
    // consumes runRng for the relic roll, so we run the same apply path here
    // to keep the rolled-relic deterministic with the live run.
    const replayChoice = this.peekReplayChoiceFor(node.key);
    if (replayChoice !== null) {
      const replayItem = items.find((it) => it.kind === replayChoice);
      if (replayItem) this.runScore.spendCoinGold(replayItem.priceGold);
      if (replayChoice === 'relic') {
        this.applyTraderRelic(state.worldPositions[index]);
      } else if (replayChoice === 'passive') {
        this.grantTraderPassive();
      } else if (replayChoice === 'reroll') {
        this.upgradeUI?.grantReroll();
        this.juice.showToast(t('nodes.ui.toast.trader_reroll'), TOAST_COLORS.reward);
      }
      this.finalizeNodeVisit(index, node.key, replayChoice);
      return;
    }
    this.enterInteractivePrompt(index);
    const balance = this.runScore.getGoldBalance();
    this.nodePromptUI?.show({
      title: t('nodes.ui.trader_title'),
      body: t('nodes.ui.trader_body', { gold: String(balance) }),
      options: items.map((item) => {
        const canAfford = balance >= item.priceGold;
        return {
          key: item.kind,
          label: t(`nodes.ui.trader_item.${item.kind}`),
          subLabel: canAfford
            ? t('nodes.ui.trader_price', { price: String(item.priceGold) })
            : t('nodes.ui.trader_price_short', { price: String(item.priceGold) }),
          disabled: !canAfford,
        };
      }),
      allowSkip: true,
      onResolve: (chosenKey) => {
        const item = chosenKey ? items.find((it) => it.kind === chosenKey) : null;
        if (item && this.runScore.spendCoinGold(item.priceGold)) {
          if (chosenKey === 'relic') {
            this.applyTraderRelic(state.worldPositions[index]);
          } else if (chosenKey === 'passive') {
            this.grantTraderPassive();
          } else if (chosenKey === 'reroll') {
            this.upgradeUI?.grantReroll();
            this.juice.showToast(t('nodes.ui.toast.trader_reroll'), TOAST_COLORS.reward);
          }
        }
        this.exitInteractivePrompt(index, node.key, chosenKey ?? 'refused');
      },
    });
  }

  private applyTraderRelic(pos: { x: number; y: number }): void {
    if (!this.relicPickupSpawner) return;
    const relic = this.relicSystem.rollDrop('hidden_node', this.runRng);
    if (!relic) {
      this.runScore.addCoinGold(40);
      this.juice.showToast(t('nodes.ui.toast.trader_empty_pack'), TOAST_COLORS.reward);
      return;
    }
    this.relicPickupSpawner.spawn(relic, pos.x, pos.y, 'hidden_node');
    this.juice.showToast(t('nodes.ui.toast.trader_relic'), TOAST_COLORS.reward);
  }

  /**
   * M1 F4 — compose the shrine timed-buff toast with a rounded-seconds
   * duration tag so the player sees how long the buff will live.
   */
  private showShrineTimedToast(key: string, durationMs: number): void {
    const seconds = Math.max(1, Math.round(durationMs / 1000));
    this.juice.showToast(
      t('nodes.ui.toast.shrine_buff_timed', {
        label: shrineLabelFromKey(key),
        seconds: String(seconds),
      }),
      TOAST_COLORS.reward,
    );
  }

  /**
   * M1 F8 — trader "passive" branch. Rolls an unheld passive from the
   * catalogue and grants it through `LevelUpFlow.grantPassive` (same
   * effect path as the level-up modal). Falls back to the pre-F8
   * +40g stub when the player's roster is already full, keeping the
   * slot honest even at endgame. Uses `runRng` for replay determinism.
   */
  private grantTraderPassive(): void {
    const card = rollRandomUnheldPassive(this.runRng, this.ownedPassives);
    if (!card) {
      this.runScore.addCoinGold(40);
      this.juice.showToast(t('nodes.ui.toast.trader_no_passives'), TOAST_COLORS.reward);
      return;
    }
    const key = (card.effect as { passiveKey: string }).passiveKey;
    this.levelUpFlow.grantPassive(key);
    this.juice.showToast(
      t('nodes.ui.toast.trader_passive_granted', { name: t(card.name) }),
      TOAST_COLORS.reward,
    );
  }

  /**
   * Bargain node — accept takes hpCost damage + grants the offered
   * boon, refuse marks visited with no effect. Skip on scrim-click
   * counts as refuse.
   */
  private openBargainNode(node: NodeDef, index: number): void {
    const spec = resolveBargainEvent(node, this.runRng, this.player.getMaxHp());
    // M1 F5 — playback auto-applies the recorded bargain pick. Accept
    // consumes HP + applies the offer (which may roll a relic via runRng,
    // so we run the same apply path to stay deterministic). Refuse just
    // surfaces the toast. `canAfford` is ignored in replay — if the live
    // run was able to accept, HP at this game-time was enough.
    const replayChoice = this.peekReplayChoiceFor(node.key);
    if (replayChoice !== null) {
      if (replayChoice === 'accept') {
        this.player.takeDamage(spec.hpCost);
        this.applyBargainOffer(spec.offerKind, spec.offerKey);
      } else {
        this.juice.showToast(t('nodes.ui.toast.bargain_refused'), '#cccccc');
      }
      this.finalizeNodeVisit(index, node.key, replayChoice);
      return;
    }
    this.enterInteractivePrompt(index);
    const canAfford = this.player.getHp() > spec.hpCost;
    this.nodePromptUI?.show({
      title: t('nodes.ui.bargain_title'),
      body: t('nodes.ui.bargain_body', {
        hp: String(spec.hpCost),
        offer: bargainLabelFromOfferKey(spec.offerKey),
      }),
      options: [
        {
          key: 'accept',
          label: t('nodes.ui.accept'),
          subLabel: t('nodes.ui.accept_cost', { hp: String(spec.hpCost) }),
          disabled: !canAfford,
        },
      ],
      allowSkip: true,
      onResolve: (chosenKey) => {
        if (chosenKey === 'accept') {
          this.player.takeDamage(spec.hpCost);
          this.applyBargainOffer(spec.offerKind, spec.offerKey);
        } else {
          this.juice.showToast(t('nodes.ui.toast.bargain_refused'), '#cccccc');
        }
        this.exitInteractivePrompt(index, node.key, chosenKey ?? 'refused');
      },
    });
  }

  private applyBargainOffer(offerKind: 'relic' | 'buff_run' | 'weapon_upgrade_token', offerKey: string): void {
    if (offerKind === 'relic' && this.relicPickupSpawner) {
      const relic = this.relicSystem.rollDrop('bargain', this.runRng);
      if (relic) {
        this.relicPickupSpawner.spawn(relic, this.player.x, this.player.y, 'bargain');
        this.juice.showToast(t('nodes.ui.toast.bargain_relic'), TOAST_COLORS.reward);
        return;
      }
    }
    if (offerKind === 'buff_run') {
      // v1: run-long bag multiplier bumps. One of goldMult / damageTakenMult /
      // weaponCooldownMult depending on the key.
      if (offerKey.includes('gold')) {
        this.runModifiers.goldMult *= 1.1;
        this.juice.showToast(t('nodes.ui.toast.bargain_gold'), TOAST_COLORS.reward);
      } else if (offerKey.includes('cooldown')) {
        this.runModifiers.weaponCooldownMult *= 0.9;
        this.weaponSystem.setCurseCooldownMul(this.runModifiers.weaponCooldownMult);
        this.juice.showToast(t('nodes.ui.toast.bargain_cooldown'), TOAST_COLORS.reward);
      } else {
        this.runModifiers.damageTakenMult *= 0.9;
        this.juice.showToast(t('nodes.ui.toast.bargain_armor'), TOAST_COLORS.reward);
      }
      return;
    }
    // weapon_upgrade_token — v1 placeholder: +1 reroll + 30g.
    this.upgradeUI?.grantReroll();
    this.runScore.addCoinGold(30);
    this.juice.showToast(t('nodes.ui.toast.bargain_token'), TOAST_COLORS.reward);
  }

  private launchActIntermission(actN: 1 | 2): void {
    const slot: PickerSlot = actN === 1 ? 'A' : 'B';
    const atGameTimeSec = Math.floor(this.spawnSystem.getGameTimeSec());
    const settings = this.settingsManager.load();

    this.banter?.request('act_complete');

    // Common resolver — runs whether picker was shown or auto-defaulted.
    const onResolve = (pick: RoutePick, route: RouteDef) => {
      this.runActState.recordPick(pick);
      this.replayRecorder?.pushRoute(pick);
      this.runModifiers.routePicks.push(pick);
      // C1 M3 Task 14 — persist into the DiscoveryLog so the Almanac's
      // Weys book lights up the entry. Best-effort write; the act
      // transition still proceeds even if the save fails.
      bumpRoutePicked(pick.routeKey, this.discoveryRunId(), Date.now());
      // H1 M2 T16 — light up the Croft photo-wall polaroid on first pick.
      addFirstRouteVisit(pick.routeKey);
      this.banter?.request('route_picked', { tag: pick.routeKey });
      applyRouteModifierDeltas(this.runModifiers, route);
      // Mid-run bag writes don't propagate through the cached private
      // fields that their consumers hold. No current route uses these
      // besides `spawnIntervalMult`, but the generic bag applicator
      // would silently no-op a future route writing to either field
      // — preempt the footgun by resyncing every run-distribution
      // multiplier that has a cached reader:
      //   - `SpawnSystem.spawnIntervalMult` → cached at run start
      //   - `WeaponSystem.curseCooldownMul` → cached at run start
      // `moveSpeedMult` / `startHpRatio` fold into the Player's
      // composed base stats at construction; routes MUST NOT touch
      // them (Player.runBase* are `readonly`, no setter exists).
      this.spawnSystem.setSpawnIntervalMult(this.runModifiers.spawnIntervalMult);
      this.weaponSystem.setCurseCooldownMul(this.runModifiers.weaponCooldownMult);
      this.runActState.advanceToAct(
        (actN + 1) as 1 | 2 | 3,
        this.spawnSystem.getGameTimeSec(),
      );
      // M1 — fresh node path for the new act. Runs after advanceToAct so
      // `runActState.currentAct` reads the new value everywhere downstream.
      this.initNodeMapForAct((actN + 1) as 1 | 2 | 3);
      route.onResume?.(this.buildRouteResumeContext());
      this.timeManager.release('ACT_INTERMISSION');
      // Telemetry fan-out — AnalyticsManager logs `route_picked` (opt-in
      // only). Shape mirrors `RoutePick` so route-monotony and skip-rate
      // kill-criteria can be computed directly from portal stats.
      globalEventBus.emit('GLOBAL_ROUTE_PICKED', {
        slot: pick.slot,
        routeKey: pick.routeKey,
        atGameTimeSec: pick.atGameTimeSec,
        defaultedBySetting: pick.defaultedBySetting,
      });
    };

    // T1 Phase 3 — playback: the recorded pick wins. No card UI, no
    // pause — shift the next route off the queue and apply inline.
    // Slot mismatch would indicate a corrupt blob; bail to the live
    // path in that case so the run keeps moving.
    if (this.pendingReplayRoutes.length > 0) {
      const next = this.pendingReplayRoutes[0];
      if (next.slot === slot) {
        this.pendingReplayRoutes.shift();
        const route = getRoute(next.routeKey);
        this.time.delayedCall(0, () => onResolve(next, route));
        return;
      }
      // Slot mismatch: log + fall through to live handling. Don't pop
      // the queue — later picks may still line up.
      console.warn('[replay] route slot mismatch', { expected: slot, got: next.slot });
    }

    if (settings.skipActIntermissions) {
      const { pick, route } = ActIntermissionScene.resolveDefault(slot, atGameTimeSec);
      // T301 — surface the auto-picked route so a player who toggled
      // Skip Intermissions still sees which fork the moor took. Without
      // this toast the route silently changes the run's modifiers and
      // the player has no way to learn what just happened.
      this.juice.showToast(
        t('ui.game.skip_route_picked', { route: t(route.labelKey) }),
        '#ffe080',
      );
      // No pause, no scene launch — apply inline on a delayedCall(0) so
      // current frame (camera shake, XP gem spawn, banter) finishes.
      this.time.delayedCall(0, () => onResolve(pick, route));
      return;
    }

    this.timeManager.request('ACT_INTERMISSION', { pausePhysics: true, timeScale: 0 });
    this.banter?.request('act_intermission_enter');
    // A11y caption — surfaces the fork moment for audio-off / deaf play.
    this.caption(
      'act_intermission_open',
      t('ui.captions.act_intermission_open'),
      COLORS_CSS.TOAST_GOLD,
      3000,
    );
    this.scene.launch(ActIntermissionScene.KEY, {
      slot,
      atGameTimeSec,
      onResolve,
    });
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
   * R1 — roll a Relic drop for the given source and spawn the pickup
   * at (x, y) if the roll fires. Wired from EnemyKillHandler's
   * onEliteKilled / onBossKilled hooks. Routes through RelicSystem so
   * held-key exclusion + rarity weighting share one pure path.
   */
  private rollAndSpawnRelic(
    source: 'elite' | 'boss',
    x: number,
    y: number,
    bossKey?: string,
  ): void {
    if (!this.relicPickupSpawner) return;
    const relic = this.relicSystem.rollDrop(source, this.runRng, {
      bossKey,
      // Luck hookup lands with the lucky_heather_sprig effect wiring
      // in M3. For M2 the base 15% elite rate + guaranteed boss drop
      // is the shippable behaviour.
      luckMultiplier: 1,
    });
    if (!relic) return;
    this.relicPickupSpawner.spawn(relic, x, y, source);
  }

  /**
   * R1 — 25% chance the legendary chest evolution roll overrides to a
   * Relic drop. Called by LevelUpFlow.offerChestEvolution before the
   * evolution card UI is shown. Returning true suppresses the card.
   */
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

  /**
   * U1 Task 14 — per-frame rune tick. Builds a RuneEvalContext from live
   * scene state and feeds it to the condition system. The system fires
   * apply/remove on transitions; the shared runeBag is read by consumers
   * (Player stats, WeaponSystem effects, gold gain, enemy slow) downstream.
   *
   * M4 (2026-04-26): also runs the per-frame consumer fold — refresh the
   * gold-gain multiplier, apply enemy slow, drain pulse queues, push
   * bagpipes radius into WeaponSystem.
   */
  private tickRuneSystem(delta: number): void {
    if (this.runeSystem.activeCount() === 0) {
      // Even with no runes, ensure the gold mult is identity (cheap; the
      // setter clamps so this is safe to call every frame).
      this.runScore.setGoldGainMultiplier(1);
      return;
    }
    // Advance the bag's nowMs for latched-timed effects (dmg_mult_timed).
    this.runeBag.nowMs += delta;
    const p = this.player;
    // Use the *base* max-HP (pre-rune fold) so the rune's hp_max bonus
    // doesn't trivially raise the hp_low threshold by raising the divisor.
    // Thirst Rune ("hp < 30%") fires on real damage taken, not on a
    // synthetic full-bar fraction shrink.
    const maxHpBase = p.getMaxHpBase();
    const biomeKey = this.biomeController
      ? this.biomeController.currentBiomeAt(p.x, p.y)
      : null;
    const ctx = buildRuneEvalContextFromScene({
      biomeKey,
      hpFrac: maxHpBase > 0 ? p.getHp() / maxHpBase : 1,
      nearHazardWater: p.isInSlick() || p.isInFog(),
      nearCairn: false,
      ownedRelicsCount: this.relicSystem?.heldCount() ?? 0,
      ownedWeaponKeys: this.weaponSystem.getWeapons().map((w) => w.config.key),
      runTimeMs: this.spawnSystem.getGameTimeSec() * 1000,
      combo: this.juice.getComboCount(),
      unopenedChestsCount: this.chestRegistry.getMarkers().length,
      dashMsAgo: null,
      evolvedWeaponsCount: this.evolvedWeapons.length,
      killsThisRun: this.runScore.killCount,
      justKilled: false,
      lastKillDeltaMs: null,
      distinctKillTypesIn5s: 0,
      critOnWeakenedThisFrame: false,
      pickupChainDurationMs: 0,
      namedEliteKilledThisFrame: false,
      killOnThistleThisFrame: false,
      musicBassActive: false,
      // Approximation: act # × 4 + current node index gives a rough
      // count of nodes visited across the run. Pilgrim Rune triggers at 3.
      nodesVisited: Math.max(0, (this.runActState.currentAct - 1) * 4 + this.runActState.currentNodeIndex),
      postBell: this.runScore.victoryPending,
      timeOfDayKey: null,
    });
    this.runeSystem.tick(ctx);

    // M4 — fold the bag into per-frame system state. Cheap multiplies;
    // identity when no rune currently active. Per the bag-vs-cached-field
    // gotcha, we re-sync each frame so a transition from `runeSystem.tick`
    // is reflected before any system reads.
    this.runScore.setGoldGainMultiplier(composeGoldMul(this.runeBag));

    // Bass attack-speed flag → fold into WeaponSystem via the existing
    // setMultipliers pass that runs immediately after this tick.
    void composeBassAttackSpeedMul; // tracked at setMultipliers fold below

    // Bagpipes radius — only one weapon listens; touch the weapon's aoe
    // radius scalar at the source.
    void composeBagpipesRadiusMul; // wired in WeaponSystem effective-aoe path

    // Enemy slow — write through to enemies via a single SpawnSystem hook.
    this.spawnSystem.setRuneEnemySlowMul(composeEnemySlowMul(this.runeBag));

    // Drain pulses (one-shot reward queues — gems, healing thistles,
    // rerolls, shrine buffs, lightning chains, thistle bombs, chest drop).
    this.applyRunePulses();
  }

  /**
   * U1 M4 — drain the rune bag's pulse queues into in-world effects.
   *
   * Pulses are emitted at apply-time by `applyRuneEffect` and accumulate
   * until the consumer drains them. We drain every frame so a rune that
   * just transitioned true (e.g. echo_rune on every-10th-kill) lands its
   * reward on the same tick the cascade fires.
   */
  private applyRunePulses(): void {
    const drained = drainRunePulses(this.runeBag);
    if (drained.gems > 0) {
      // Spawn extra gems near the player so the magnet pulls them.
      for (let i = 0; i < drained.gems; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 24 + Math.random() * 28;
        this.xpSystem.spawnGem(
          this.player.x + Math.cos(angle) * r,
          this.player.y + Math.sin(angle) * r,
          1,
        );
      }
    }
    if (drained.healingThistles > 0) {
      // Heal stand-in: each thistle = small flat heal pulse. Lighter than
      // a dedicated pickup spawn but always reads as warmth.
      const heal = Math.max(2, Math.ceil(this.player.getMaxHp() * 0.05));
      for (let i = 0; i < drained.healingThistles; i++) {
        this.player.heal(heal);
      }
      this.juice.showToast(
        t('ui.game.rune_thistle_pulse', { count: drained.healingThistles }),
        '#88ff88',
      );
    }
    if (drained.rerolls > 0 && this.upgradeUI) {
      for (let i = 0; i < drained.rerolls; i++) this.upgradeUI.grantReroll();
      this.juice.showToast(
        t('ui.game.rune_reroll_grant', { count: drained.rerolls }),
        '#bca3d4',
      );
    }
    if (drained.shrineBuffs > 0) {
      // Stand-in: small heal + gold burst until a dedicated shrine-buff
      // grant API lands. Documented in the M4 plan as a known stub.
      this.player.heal(Math.max(5, Math.ceil(this.player.getMaxHp() * 0.1)));
      this.runScore.addCoinGold(20 * drained.shrineBuffs);
      this.juice.showToast(
        t('ui.game.rune_shrine_pulse', { count: drained.shrineBuffs }),
        '#ffdd66',
      );
    }
    if (drained.thistleBombs.length > 0) {
      // Damage AoE at player position. Inexpensive: iterate enemies once,
      // apply distance check + flat damage. Caps per-pulse so a runaway
      // chain doesn't explode CPU.
      const enemies = this.spawnSystem.getEnemyGroup().getChildren() as Enemy[];
      for (const bomb of drained.thistleBombs) {
        const r2 = bomb.radius * bomb.radius;
        let hits = 0;
        for (const e of enemies) {
          if (!e.active || hits >= 16) continue;
          const dx = e.x - this.player.x;
          const dy = e.y - this.player.y;
          if (dx * dx + dy * dy <= r2) {
            e.takeDamage(bomb.dmg);
            hits++;
          }
        }
      }
      this.juice.showToast(t('ui.game.rune_thistle_bomb'), '#a070c0');
      this.juice.flashWhite(60);
    }
    if (drained.lightningChains.length > 0) {
      // Hit the N nearest enemies per chain for a flat damage blast.
      const enemies = this.spawnSystem.getEnemyGroup().getChildren() as Enemy[];
      for (const chain of drained.lightningChains) {
        let chained = 0;
        const sorted = enemies
          .filter((e) => e.active)
          .sort((a, b) => {
            const da = (a.x - this.player.x) ** 2 + (a.y - this.player.y) ** 2;
            const db = (b.x - this.player.x) ** 2 + (b.y - this.player.y) ** 2;
            return da - db;
          });
        for (const e of sorted) {
          if (chained >= chain.targets) break;
          e.takeDamage(40);
          chained++;
        }
      }
      this.juice.showToast(t('ui.game.rune_lightning'), '#88ddff');
    }
    if (drained.chestDropNext) {
      // Flag: next eligible chest is guaranteed legendary. Stand-in:
      // immediate +50 gold burst until the chest pipeline can read the
      // flag. Never silent — always toast so the player sees the rune
      // fire.
      this.runScore.addCoinGold(50);
      this.juice.showToast(t('ui.game.rune_chest_omen'), '#ffdd44');
    }
  }

  private tryRelicChestOverride(): boolean {
    if (!this.relicPickupSpawner) return false;
    const relic = this.relicSystem.rollDrop('chest', this.runRng, {});
    if (!relic) return false;
    this.relicPickupSpawner.spawn(relic, this.player.x, this.player.y, 'chest');
    this.juice.showToast(t('ui.game.relic_drop_near'), TOAST_COLORS.reward);
    return true;
  }

  /**
   * E1 M2 T10 — Burns Night platter collect callback. Records the
   * pickup timestamp so `burnsPlatterDamageBuff` reads 1.3× for the
   * next 60 s, then fires the Burns-citational banter line. Heal +
   * VFX live in `PickupSpawner.spawnBurnsPlatter`; this handler owns
   * scene state + narrative voice.
   */
  private handleBurnsPlatterCollect(): void {
    this.burnsPlatterPickedUpAtMs = this.time.now;
    this.banter?.request('burns_citation', { tag: 'haggis_moment' });
  }

  /**
   * R1 — route a walked-over Relic pickup: add to an empty slot, open
   * the 4th-relic discard modal, or silently skip a duplicate. Called
   * by the `RelicPickupSpawner.onCollect` callback.
   */
  private handleRelicCollect(
    relic: RelicDef,
    _x: number,
    _y: number,
    source: RelicPickupSource,
  ): void {
    const isDuplicate = this.relicSystem.isHolding(relic.key);
    const action = decideRelicCollect({
      heldCount: this.relicSystem.heldCount(),
      isDuplicate,
      slotCap: 3,
    });
    switch (action) {
      case 'skip_duplicate':
        return;
      case 'add':
        this.relicSystem.add(relic);
        this.onRelicAdded();
        this.emitRelicPickedTelemetry(relic, source, null);
        this.juice.showToast(t('ui.game.relic_collected'), TOAST_COLORS.reward);
        this.juice.flashWhite(80);
        audio.playLevelUp();
        return;
      case 'discard_ui':
        this.openRelicDiscardModal(relic, source);
        return;
    }
  }

  /**
   * R1 M4 T28 — fire-and-forget Relic-pickup telemetry. Global event
   * bus bridge; AnalyticsManager gates on the `telemetryOptIn` user
   * setting (matches the route_picked / weapon_evolved precedent).
   */
  private emitRelicPickedTelemetry(
    relic: RelicDef,
    source: RelicPickupSource,
    replacedKey: RelicKey | null,
  ): void {
    globalEventBus.emit('GLOBAL_RELIC_PICKED', {
      relicKey: relic.key,
      rarity: relic.rarity,
      source,
      replacedKey: replacedKey ?? null,
      atGameTimeSec: this.spawnSystem?.getGameTimeSec() ?? 0,
    });
  }

  /**
   * R1 M4 T26 — first-Relic reserved banter. Priority 110 (first_time
   * pool) beats the standard relic_pickup tier so Gran's reserved line
   * fires once per save regardless of which relic dropped first.
   */
  private onRelicAdded(): void {
    if (bumpFirstTimeEvent('relic_first_pickup')) {
      this.requestBanter('first_time', 'relic_first_pickup');
    }
  }

  private relicDiscardModalOpen = false;

  private openRelicDiscardModal(incoming: RelicDef, source: RelicPickupSource): void {
    if (this.relicDiscardModalOpen) return;
    this.relicDiscardModalOpen = true;
    this.timeManager.request('RELIC_DISCARD', { pausePhysics: true, timeScale: 0 });
    const held = this.relicSystem.getSlots().map((s) => s.def);
    openRelicPickupPrompt({
      scene: this,
      held,
      incoming,
      uiScale: 1,
      onReplaceHeld: (slotIndex) => {
        const replaced = this.relicSystem.getSlots()[slotIndex].def?.key ?? null;
        this.relicSystem.replaceAt(slotIndex, incoming);
        // Replacing at full sporran still counts as the first acquired
        // relic (if it is) — fire the reserved line.
        this.onRelicAdded();
        this.emitRelicPickedTelemetry(incoming, source, replaced);
        this.juice.showToast(t('ui.game.relic_collected'), TOAST_COLORS.reward);
        this.juice.flashWhite(80);
        audio.playLevelUp();
        this.closeRelicDiscardModal();
      },
      onReject: () => {
        this.closeRelicDiscardModal();
      },
    });
  }

  private closeRelicDiscardModal(): void {
    if (!this.relicDiscardModalOpen) return;
    this.relicDiscardModalOpen = false;
    this.timeManager.release('RELIC_DISCARD');
  }

  /**
   * R1 e2e test seam — force a Relic pickup at a world position without
   * routing through the probabilistic drop roll. Used by
   * `e2e/relic-pickup.spec.ts`. Returns true on success, false if the
   * key doesn't exist or the spawner isn't ready.
   */
  private debugSpawnRelicAt(key: string, x: number, y: number): boolean {
    if (!this.relicPickupSpawner) return false;
    const def = (RELICS as Record<string, RelicDef>)[key];
    if (!def) return false;
    this.relicPickupSpawner.spawn(def, x, y);
    return true;
  }

  /** R1 — e2e accessor; also used by the HUD slot widget in M3. */
  getHeldRelicKeys(): readonly RelicKey[] {
    return this.relicSystem?.heldKeys() ?? [];
  }

  private restoreHeldRelics(keys: readonly string[]): void {
    // Pure helper — see src/scenes/game/SavedStateHydrator.ts. Keeps
    // the private method in place so existing call sites
    // (RunPersistenceBridge hook, DebugTimeTravelApi audit hook) don't
    // shift, but the body is one line of delegation.
    restoreHeldRelics(this.relicSystem, this.relicEffectDriver, keys);
  }

  /**
   * R1 M3 T21 — trigger the Whisky Dram active relic. Routes the
   * pause-menu button through the driver's one-shot; toast + SFX fire
   * on the first successful activation only.
   */
  private activateWhiskyDram(): void {
    if (!this.relicEffectDriver) return;
    const currentHp = this.player.getHp();
    const maxHp = this.player.getMaxHp();
    const result = this.relicEffectDriver.activateWhiskyDram(currentHp, maxHp);
    if (!result.fired) return;
    const healed = Math.max(0, Math.ceil(result.hp - currentHp));
    if (healed > 0) this.player.heal(healed);
    this.juice.showToast(t('ui.pause.whisky_dram_drunk'), TOAST_COLORS.reward);
    this.juice.flashWhite(120);
    audio.playLevelUp();
  }

  /**
   * R1 M4.5 P5 — blow Fingal's Horn. One-shot active relic: summons
   * `result.summonCount` Fianna at the haggis's position; each lives
   * `result.durationMs` ms and hunts nearest non-boss enemies. Driver
   * gates re-use so the button disappears after firing.
   */
  private activateFingalsHorn(): void {
    if (!this.relicEffectDriver) return;
    const result = this.relicEffectDriver.activateFingalsHorn();
    if (!result.fired) return;
    const px = this.player.x;
    const py = this.player.y;
    // Fan out the spawn ring so the three spirits don't stack into
    // one visible glyph at t=0.
    for (let i = 0; i < result.summonCount; i++) {
      const angle = (i / result.summonCount) * Math.PI * 2;
      const sx = px + Math.cos(angle) * 18;
      const sy = py + Math.sin(angle) * 18;
      const spirit = new FiannaSpirit(this, sx, sy, result.durationMs);
      this.activeFiannaSpirits.push(spirit);
    }
    this.juice.showToast(t('ui.pause.fingals_horn_sounded'), TOAST_COLORS.reward);
    this.juice.flashWhite(140);
    audio.playLevelUp();
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
