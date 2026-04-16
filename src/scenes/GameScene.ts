import Phaser from 'phaser';
import { GAME } from '../config';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { SpawnSystem } from '../systems/SpawnSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { XPSystem } from '../systems/XPSystem';
import { UpgradeCardsUI } from '../ui/UpgradeCards';
import { HUD } from '../ui/HUD';
import { EdgeIndicators } from '../ui/EdgeIndicators';
import { Minimap } from '../ui/Minimap';
import { JuiceSystem } from '../systems/JuiceSystem';
import { createPhaserTimeAdapter, TimeManager } from '../systems/TimeManager';
import { recordRun, loadSave } from '../utils/save';
import { audio } from '../systems/AudioSystem';
import { musicEngine, GameMusicState } from '../systems/music/ProceduralMusicEngine';
import { getVariantByKey, VariantDef } from '../data/variants';
import { ISceneContext } from '../core/ISceneContext';
import { UpdateTickers, TickerHandle } from '../utils/UpdateTickers';
import { SubscriptionBag } from '../utils/SubscriptionBag';
import { createRNG, randomSeed, encodeSeed, type RNG } from '../utils/rng';
import { DebugOverlay } from '../ui/DebugOverlay';
import { SaveManager } from '../core/SaveManager';
import { StatComposer } from '../core/StatComposer';
import { applyAudioFromUserSettings } from '../core/applyAudioFromSettings';
import { getSettingsManager } from '../core/SettingsManager';
import { BanterSystem } from '../systems/BanterSystem';
import type { BanterContext } from '../data/banter';
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
import { consumePendingCurse, getCurseByKey, type CurseKey } from '../data/curses';
import { formatHudCurseChipLine } from '../ui/formatHudCurseChip';
import { StatusFxPool } from '../systems/StatusFxPool';
import { TutorialSystem } from '../systems/TutorialSystem';
import type { EliteAffixId } from '../data/eliteAffixes';
import { BIOMES, type BiomeId } from '../data/biomes';
import type { BiomeManager } from '../systems/BiomeManager';
import { BiomeController } from './game/BiomeController';
import { FilmGrainOverlay } from './game/FilmGrainOverlay';
import { IFrameController } from './game/IFrameController';
import { RunEndTickers } from './game/RunEndTickers';
import { showCountdown } from './game/CountdownOverlay';
import { MoorMomentScheduler } from './game/MoorMomentScheduler';
import { PauseMenu } from './game/PauseMenu';
import { PickupSpawner } from './game/PickupSpawner';
import { EnemyKillHandler } from './game/EnemyKillHandler';
import { RunActState } from './game/RunActState';
import { StandingStones, STONE_SPAWN_SEC, type StoneBoon } from './game/standingStones';
import { ActIntermissionScene } from './ActIntermissionScene';
import type { PickerSlot, RouteDef, RoutePick, RouteResumeContext } from '../data/routes';
import { FloatTextPool } from './game/FloatTextPool';
import { PlayerHitResolver } from './game/PlayerHitResolver';
import { RunPersistenceBridge } from './game/RunPersistenceBridge';
import { RunHistoryRecorder } from './game/RunHistoryRecorder';
import { DebugTimeTravelApi } from './game/DebugTimeTravelApi';
import { BossHpTracker } from './game/BossHpTracker';
import { ChestSpriteRegistry } from './game/ChestSpriteRegistry';
import { RunExitComposer } from './game/RunExitComposer';
import { RunScoreState } from './game/RunScoreState';
import { wireSceneEventBus } from './game/wireSceneEventBus';
import { installRunIntroFx } from './game/installRunIntroFx';
import { installTreasureChestTimer } from './game/installTreasureChestTimer';
import { wireSceneKeybindings } from './game/wireSceneKeybindings';
import { tickAutoBattleSteering } from './game/tickAutoBattleSteering';
import { updateMusicStateScratch } from './game/updateMusicStateScratch';
import { updateHudWeaponRows } from './game/updateHudWeaponRows';
import { pickTrailColor } from '../data/weaponTrailColors';
import { LevelUpFlow } from './game/LevelUpFlow';
import { RunLifecycle } from './game/RunLifecycle';
import { createHighlandTerrain } from './game/highlandTerrain';
import { HazardZones } from './game/HazardZones';
import { GameTickers } from './game/GameTickers';
import { applyPermanentUpgrades, applyVariantModifiers } from './game/runStartModifiers';
import { CaptionManager } from '../systems/a11y/CaptionManager';
import { CaptionOverlay } from '../systems/a11y/CaptionOverlay';
import {
  installAutoBattleTimeScale,
  isAutoBattleEnabled,
  uninstallAutoBattleTimeScale,
} from '../dev/AutoBattler';
import { tickStressTest } from '../dev/StressTest';
import { BALANCE } from '../core/BalanceConfig';

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
  private edgeIndicators!: EdgeIndicators;
  private minimap!: Minimap;
  private readonly chestRegistry = new ChestSpriteRegistry();
  private readonly iFrameController = new IFrameController(() => this.player);

  private ownedPassives: string[] = [];
  private evolvedWeapons: string[] = [];
  /** All per-run counters (kills, boss/coin gold, elite chain, victory state). */
  private readonly runScore = new RunScoreState();
  /** W2 Moor Road: act number + picker history across the run. */
  private readonly runActState = new RunActState();
  /** One-time +luck draw weight when HP first crosses into the mercy band. */
  private moorMercyLuckGranted = false;
  /** Standing Stones trinity — nulls out between runs, spawned at 5:00 mark. */
  private standingStones: StandingStones | null = null;
  /** Batched toast for max-level XP → gold conversion (avoids spam). */
  private xpOverflowGoldBatch: number = 0;
  /** Chests deferred while paused — queued so multiple timer callbacks don't overwrite each other. */
  private pendingChests: Array<{ golden: boolean }> = [];
  private gameTickers!: GameTickers;
  private runId: object = {};
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
  /** Pending seed passed via init() data. Consumed in create(). */
  private pendingRunSeed: number | null = null;
  /** Set when the run is a Daily Challenge attempt — drives save tracking + end-of-run UI. */
  private runIsDaily: boolean = false;
  /** Optional variant override from init data (seeded / daily runs). Cleared in create(). */
  private pendingForceVariantKey: string | null = null;

  /** Pickup lifetimes — scheduled on scene-owned UpdateTickers. */
  private pickupDespawnHandles: TickerHandle[] = [];
  private readonly runEndTickers = new RunEndTickers();
  /** End-of-run screen-space fade overlays — tracked as fields so shutdown
   *  can destroy them; anonymous locals would orphan on scene restart since
   *  Phaser's scene.stop() doesn't clear the display list. */
  private victoryFade: Phaser.GameObjects.Rectangle | null = null;
  private deathFade: Phaser.GameObjects.Rectangle | null = null;
  private hintHideHandle: TickerHandle | null = null;
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
    biomeTimbre: 0.45,
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
  private devKeydownHandler?: (e: KeyboardEvent) => void;
  private lastEmittedRunSecond = -1;
  private eventBusDispose: (() => void) | null = null;
  private biomeController: BiomeController | null = null;
  private pauseMenu: PauseMenu | null = null;
  private pickupSpawner!: PickupSpawner;
  private levelUpFlow!: LevelUpFlow;
  private runLifecycle!: RunLifecycle;
  private enemyKillHandler!: EnemyKillHandler;
  private playerHitResolver!: PlayerHitResolver;
  private runPersistence!: RunPersistenceBridge;
  private runHistoryRecorder!: RunHistoryRecorder;
  private hazardZones!: HazardZones;
  private captionManager: CaptionManager | null = null;
  private captionOverlay: CaptionOverlay | null = null;
  private filmGrain: FilmGrainOverlay | null = null;
  private banter: BanterSystem | null = null;
  private readonly gameplaySessionGuard = createGameplaySessionGuard(() => {
    getAnalyticsManager().endGameplaySession();
  });

  private moorMoments!: MoorMomentScheduler;

  constructor() {
    super({ key: 'Game' });
  }

  getUiViewport(): { x: number; y: number; width: number; height: number; zoom: number } {
    const { x, y, width, height, zoom } = getCameraViewport(this);
    return { x, y, width, height, zoom };
  }

  /** Max-level XP (gems + scripted grants) becomes run gold — batched toasts. */
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
    this.iFrameController.reset();
    this.pauseMenu?.close();
    this.pauseMenu = null;
    this.runScore.reset();
    this.runActState.reset();
    this.runId = {};
    this.chestDurationBonusMs = 0;
    const runSeed = this.pendingRunSeed ?? randomSeed();
    this.runRng = createRNG(runSeed);
    this.pendingRunSeed = null;
    this.pendingChests = [];
    this.pickupDespawnHandles = [];
    this.updateTickers.clear();
    this.runEndTickers.reset();
    this.victoryFade?.destroy();
    this.victoryFade = null;
    this.deathFade?.destroy();
    this.deathFade = null;
    this.hintHideHandle = null;
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
    this.standingStones?.destroy();
    this.standingStones = null;
    this.musicStateScratch.bossActive = false;
    this.musicStateScratch.biomeTimbre = 0.45;
    this.xpOverflowGoldBatch = 0;
  }

  init(data?: GameSceneInitData): void {
    // Accept the optional seed + daily flag from `scene.start('Game', data)`.
    // Phaser re-runs init on every scene.start, so this is the right hook
    // for per-run entry parameters. create() promotes these into the run-
    // scoped RNG and daily-tracking fields.
    this.pendingRunSeed = typeof data?.seed === 'number' ? data.seed : null;
    this.runIsDaily = Boolean(data?.isDaily);
    this.pendingForceVariantKey = typeof data?.forceVariantKey === 'string' ? data.forceVariantKey : null;
  }

  create(): void {
    const save = loadSave();

    const metaLoaded = this.metaSaveManager.load();
    const resumeRun = readPendingResumeRun(metaLoaded.activeRun);

    // Wipe transient per-run state — Phaser reuses the scene instance on
    // scene.start, so field initializers only fire at construction and
    // anything mutated during gameplay would leak into the next run.
    this.resetTransientRunState();

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

    // Biome partition — voronoi regions seeded from the run RNG.
    // Owns manager, renderer, entry-toast state, and player-modifier push.
    this.biomeController?.destroy();
    this.biomeController = new BiomeController(
      this,
      this.runRng.branch(),
      GAME.WORLD_WIDTH,
      GAME.WORLD_HEIGHT,
    );
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
    const metaSave = this.metaSaveManager.load();
    const baseStats = StatComposer.getPlayerStats(metaSave);

    // Consume pending curse exactly once. Curses don't apply to resumed
    // runs (they were already baked into the in-progress run) or daily
    // attempts (fixed rules — seed equivalence).
    this.runModifiers = defaultModifiers();
    this.activeCurseKey = null;
    if (!resumeRun && !this.runIsDaily) {
      const key = consumePendingCurse();
      const curse = getCurseByKey(key);
      if (curse) {
        curse.apply(this.runModifiers);
        this.activeCurseKey = curse.key;
      }
    } else {
      // Clear any stale pending key so it doesn't bleed into the next run.
      consumePendingCurse();
    }

    // Compose with per-run modifiers layered on meta bonuses. Player reads
    // these at construction — no post-hoc stat rewrites needed.
    const composedStats = {
      ...baseStats,
      speed: baseStats.speed * this.runModifiers.moveSpeedMult,
      maxHp: Math.max(1, Math.round(baseStats.maxHp * this.runModifiers.startHpRatio)),
    };
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
      composedStats
    );

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
      isIFrames: () => this.iFrameController.isActive(),
      isVictoryPending: () => this.runScore.victoryPending,
      getDamageTakenMult: () => this.runModifiers.damageTakenMult,
      onPlayerKilled: () => this.runLifecycle.onPlayerHitZero(),
      onAfterPlayerDamaged: (hpBefore) => {
        if (this.player.getHp() > 0) this.tryMoorMercyLuck(hpBefore);
      },
    });
    this.hazardZones.spawn();

    // Systems
    this.statusFxPool = new StatusFxPool(this);
    this.spawnSystem = new SpawnSystem(this);
    this.spawnSystem.setSpawnIntervalMult(this.runModifiers.spawnIntervalMult);
    this.weaponSystem = new WeaponSystem(this, this.spawnSystem.getEnemyGroup());
    this.xpSystem = new XPSystem(this);
    Enemy.refreshSettings();
    this.bossHpTracker?.reset();
    this.ownedPassives = [];
    this.evolvedWeapons = [];
    this.xpOverflowGoldBatch = 0;
    this.revivalAvailable = false;

    // Pre-allocate floating text pool for armor/gold feedback.
    this.floatTextPool.init(this);

    // Variant modifiers establish the run archetype before permanent upgrades stack on top.
    applyVariantModifiers(this.player, selectedVariant);

    // Apply permanent upgrades from save data. The two flag outputs
    // don't live on Player so come back as a result object.
    const permResult = applyPermanentUpgrades({
      player: this.player,
      weaponSystem: this.weaponSystem,
      ownedPassives: this.ownedPassives,
      runRng: this.runRng,
    });
    this.revivalAvailable = permResult.revivalAvailable;
    // W66 Ironmoor: opt-in single-life mode suppresses the Second-Wind
    // grant regardless of permanent-upgrade purchases. Cheaper than
    // refunding the upgrade — player keeps their haggis, just waives
    // the safety net for this run.
    if (this.settingsManager.load().ironmoorMode) {
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
      getRevivalAvailable: () => this.revivalAvailable,
      getOwnedPassives: () => this.ownedPassives,
      getEvolvedWeapons: () => this.evolvedWeapons,
      setRevivalAvailable: (v) => { this.revivalAvailable = v; },
      setOwnedPassives: (p) => { this.ownedPassives = p; },
      setEvolvedWeapons: (e) => { this.evolvedWeapons = e; },
      isSceneActive: () => this.scene.isActive(),
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
      isIronmoorRun: () => this.settingsManager.load().ironmoorMode,
      getRunScore: () => this.runScore,
      getOwnedPassivesLength: () => this.ownedPassives.length,
      getEvolvedWeaponsLength: () => this.evolvedWeapons.length,
      stopGameScene: () => this.scene.stop('Game'),
      startGameOverScene: (payload) => this.scene.start('GameOver', payload),
      startMainMenuScene: () => this.scene.start('MainMenu'),
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
      isIronmoor: () => this.settingsManager.load().ironmoorMode,
    });

    if (resumeRun) {
      this.runPersistence.applyResume(resumeRun);
    }

    // Upgrade card UI
    this.upgradeUI = new UpgradeCardsUI(this, (card) => this.levelUpFlow.apply(card), this.updateTickers);
    this.upgradeUI.setRerollCallback(() => this.levelUpFlow.reroll());

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

    // When player levels up, pause and show upgrade choices
    this.xpSystem.events.on('levelup', (newLevel: number) => {
      this.levelUpFlow.handleLevelUp(newLevel);
      // Tag with the active variant so iron_belly/moor_runner flavor
      // their celebration; other variants fall through to the generic
      // pool silently (missing sub-pool == no special handling).
      this.banter?.request('level_up', { tag: this.activeVariant?.key });
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
      onAfterNonFatalHit: (hpBefore) => this.tryMoorMercyLuck(hpBefore),
      armIFrames: (ms) => this.armIFrames(ms),
      onPlayerKilled: () => this.runLifecycle.onPlayerHitZero(),
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
    this.gameTickers = new GameTickers({
      getPlayer: () => this.player,
      getScene: () => this,
      getUiViewport: () => this.getUiViewport(),
      getBanter: () => this.banter,
      getCurrentBiomeId: () => this.getCurrentBiomeId(),
      getActiveVariantKey: () => this.activeVariant.key,
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
    });
    this.pickupSpawner = new PickupSpawner(this, {
      getPlayer: () => this.player,
      getJuice: () => this.juice,
      getXPSystem: () => this.xpSystem,
      getUpdateTickers: () => this.updateTickers,
      getSFXManager: () => this.getSFXManager(),
      getChestDurationBonusMs: () => this.chestDurationBonusMs,
      onCoinCollected: (amount) => { this.runScore.addCoinGold(amount); },
      trackChest: (s, g) => this.chestRegistry.track(s, g),
      untrackChest: (s) => this.chestRegistry.untrack(s),
      pushDespawnHandle: (h) => { this.pickupDespawnHandles.push(h); },
      offerTreasureEvolutionIfEligible: () => this.levelUpFlow.offerChestEvolution(),
      acquireFloatText: (x, y, str, color, fs, d) => this.floatTextPool.acquire(x, y, str, color, fs, d),
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
      addKill: (n = 1) => { this.runScore.killCount += n; },
      getUiViewport: () => this.getUiViewport(),
      armIFrames: (ms) => this.armIFrames(ms),
      drainPendingChests: () => this.drainPendingChests(),
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
      requestBanter: (ctx, tag) => this.requestBanter(ctx, tag),
    });
    this.runLifecycle = new RunLifecycle(this, {
      getPlayer: () => this.player,
      getSpawnSystem: () => this.spawnSystem,
      getXPSystem: () => this.xpSystem,
      getJuice: () => this.juice,
      getTimeManager: () => this.timeManager,
      getSaveManager: () => this.metaSaveManager,
      getDeathCauseTracker: () => this.deathCauseTracker,
      getSettingsManager: () => this.settingsManager,
      getCamera: () => this.cameras.main,
      getUiViewport: () => this.getUiViewport(),
      getVictoryPending: () => this.runScore.victoryPending,
      setVictoryPending: (v) => { this.runScore.victoryPending = v; },
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
      recordToHistory: (s, r) => this.runHistoryRecorder.record(s, r),
      recordRun: (s, ctx) => recordRun(s, ctx),
      transitionToGameOver: (payload) => this.runExit.transitionToGameOver(payload),
      onActComplete: (actN) => this.launchActIntermission(actN),
    });
    this.juice.setResumeBestCombo(resumeRun?.bestCombo);
    this.juice.setResumeComboState(resumeRun?.comboCount, resumeRun?.comboTimerMs);
    this.showRunIdentityToast(Boolean(resumeRun));
    this.eventBusDispose?.();
    this.eventBusDispose = wireSceneEventBus({ getJuice: () => this.juice });
    this.edgeIndicators = new EdgeIndicators(this);
    this.minimap = new Minimap(this);
    this.hud.setOnPause(() => this.toggleUiPause());

    this.debugOverlay = new DebugOverlay(this, {
      spawnSystem: this.spawnSystem,
      weaponSystem: this.weaponSystem,
      timeManager: this.timeManager,
    });

    this.tutorialSystem = new TutorialSystem(this, this.metaSaveManager);
    this.tutorialSystem.startRunIfNeeded({ resumeRun: Boolean(resumeRun) });

    this.debugTimeTravelApi.install();
    this.runPersistence.registerMidRunHooks();

    getAnalyticsManager().beginGameplaySession({ variantKey: this.activeVariant.key });
    this.gameplaySessionGuard.markStarted();

    const prefs = this.settingsManager.load();
    applyAudioFromUserSettings(prefs);
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
    });

    // Run-intro ceremony — fade in from black + controls hint auto-hide.
    this.hintHideHandle = installRunIntroFx(this, this.updateTickers, () => this.getUiViewport());

    this.filmGrain?.destroy();
    this.filmGrain = new FilmGrainOverlay(this, this.settingsManager, () => this.getUiViewport());
    this.filmGrain.install();
    this.filmGrain.bindViewportResize();

    // Start countdown — game is paused until it finishes
    this.timeManager.request('COUNTDOWN', { pausePhysics: true, timeScale: 0 });
    showCountdown(this, this.timeManager, this.updateTickers, () => this.getUiViewport());

    // Resume is now "committed": replace old suspended snapshot with a fresh one.
    finalizeResumeStartup(resumeRun, () => this.runPersistence.persist());
  }

  private registerShutdownCleanup(): void {
    // Clean up on scene shutdown (prevents stale timers/listeners on restart)
    this.events.once('shutdown', () => {
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

  update(_time: number, delta: number): void {
    // Cap delta to prevent time warps from tab-backgrounding (browser throttles
    // requestAnimationFrame to ~1fps when backgrounded, producing huge deltas on return)
    delta = Math.min(delta, 100);

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
    if (this.biomeController) this.biomeController.tick(this.player, this.juice);
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

    const runSec = Math.floor(this.spawnSystem.getGameTimeSec());
    if (runSec !== this.lastEmittedRunSecond) {
      this.lastEmittedRunSecond = runSec;
      globalEventBus.emit('GLOBAL_RUN_TIME_SEC', {
        gameTimeSec: this.spawnSystem.getGameTimeSec(),
        wholeSecond: runSec,
      });
      this.moorMoments.tick(runSec);
      if (runSec === STONE_SPAWN_SEC && !this.standingStones) {
        this.spawnStandingStones();
      }
    }

    this.standingStones?.tick();

    // Pass player facing and upgrade multipliers to weapon system.
    // Always update from player.rotation (persists when stationary) so
    // directional weapons like arc_sweep don't use a stale angle.
    this.weaponSystem.setPlayerFacing(this.player.rotation - Math.PI / 2);
    this.weaponSystem.setMultipliers(
      this.player.getDamageMultiplier() * this.juice.getComboDamageMultiplier(),
      this.player.getAoeMultiplier(),
      this.player.getAttackSpeedMultiplier(),
      this.player.getCritChance(),
      this.player.getCooldownReduction(),
      this.player.getCritDamageMultiplier()
    );
    this.weaponSystem.update(scaledDelta, this.player.x, this.player.y);
    this.xpSystem.update(this.player.x, this.player.y, this.player.getPickupRadius(), this.player.getHpFraction());
    // Juice is cosmetic (shake, combo toasts, damage numbers) — stays on raw
    // delta so VFX don't stall during slow-mo and the combo meter still decays
    // at wall-clock rate.
    this.juice.update(delta, this.player.getHpFraction());

    // Boss HP bar + edge indicators
    this.bossHpTracker.tick();
    this.edgeIndicators.update(this.player.x, this.player.y, this.spawnSystem.getEnemyGroup());
    this.minimap.update(
      this.player.x,
      this.player.y,
      this.spawnSystem.getEnemyGroup(),
      this.chestRegistry.getMarkers(),
      this.player.rotation
    );
    const biomeId = this.getCurrentBiomeId();
    updateMusicStateScratch(
      this.musicStateScratch,
      this.player,
      this.spawnSystem,
      this.juice,
      this.runScore.killCount,
      biomeId ? BIOMES[biomeId].moodTimbre : 0.45,
    );
    musicEngine.update(delta, this.musicStateScratch);

    // Dash cooldown indicator (small arc under player)
    this.gameTickers.updateDashIndicator();

    // World boundary warning — red tint when near edges
    this.gameTickers.updateBoundaryWarning();

    this.hud.updateDPS(delta);
    this.hud.updateShield(this.player.hasShield());
    this.hud.setAct(this.runActState.currentAct);
    this.hud.setIronmoor(this.settingsManager.load().ironmoorMode);
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
    // Don't open the pause menu while a modal owns pause (level-up, countdown, end screen).
    if (this.timeManager.has('LEVEL_UP') || this.timeManager.has('COUNTDOWN') || this.timeManager.has('RUN_END')) return;
    // Tutorial overlays own input/time while FTUE prompts are visible.
    if (this.timeManager.has('TUTORIAL_MOVE') || this.timeManager.has('TUTORIAL_GEM')) return;

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
          onResumeRequested: () => this.toggleUiPause(),
          onQuitRequested: () => this.runExit.abandonToMainMenu(),
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
    const maxHp = this.player.getMaxHp();
    if (maxHp <= 0) return;
    const hpAfter = this.player.getHp();
    if (hpAfter <= 0) return;
    const th = BALANCE.player.moorMercyHpFrac;
    if (hpBefore / maxHp > th && hpAfter / maxHp <= th) {
      this.moorMercyLuckGranted = true;
      this.player.addLuckDrawBonus(BALANCE.player.moorMercyLuckBonus);
      this.juice.showToast(t('ui.game.moor_mercy_luck'), '#c8a8e8');
      this.caption('moor_mercy', t('ui.game.moor_mercy_luck_caption'), '#c8a8e8', 4200);
    }
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
      },
    });
    this.standingStones.spawn();
    this.juice.showToast(t('ui.standingStones.announce_toast'), '#ffe080');
    this.caption('standing_stones_announce', t('ui.standingStones.announce_caption'), '#ffe080', 3000);
  }

  private showRunIdentityToast(isResume: boolean): void {
    const v = this.activeVariant;
    const maxFlavor = 52;
    const raw = v.flavorText.trim();
    const flavor =
      raw.length > maxFlavor ? `${raw.slice(0, maxFlavor - 1).trimEnd()}…` : raw;
    const body = isResume
      ? t('ui.run.resume_identity', { name: v.name, flavor })
      : t('ui.run.start_identity', { name: v.name, flavor });
    this.juice.showToast(body, '#c8dcff');
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
  private launchActIntermission(actN: 1 | 2): void {
    const slot: PickerSlot = actN === 1 ? 'A' : 'B';
    const atGameTimeSec = Math.floor(this.spawnSystem.getGameTimeSec());
    const settings = this.settingsManager.load();

    this.banter?.request('act_complete');

    // Common resolver — runs whether picker was shown or auto-defaulted.
    const onResolve = (pick: RoutePick, route: RouteDef) => {
      this.runActState.recordPick(pick);
      this.runModifiers.routePicks.push(pick);
      this.banter?.request('route_picked', { tag: pick.routeKey });
      // Apply modifierDeltas. Numeric fields currently replace (the only
      // route-affected modifier today is spawnIntervalMult, a multiplier
      // that the route definition sets as the absolute value for its
      // duration — the onResume schedules the restoration).
      for (const [k, v] of Object.entries(route.modifierDeltas)) {
        if (typeof v === 'number') {
          (this.runModifiers as unknown as Record<string, unknown>)[k] = v;
        }
      }
      this.runActState.advanceToAct(
        (actN + 1) as 1 | 2 | 3,
        this.spawnSystem.getGameTimeSec(),
      );
      route.onResume?.(this.buildRouteResumeContext());
      this.timeManager.release('ACT_INTERMISSION');
    };

    if (settings.skipActIntermissions) {
      const { pick, route } = ActIntermissionScene.resolveDefault(slot, atGameTimeSec);
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
      '#ffdd88',
      3000,
    );
    this.scene.launch(ActIntermissionScene.KEY, {
      slot,
      atGameTimeSec,
      onResolve,
    });
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

  getBiomeManager(): BiomeManager | null {
    return this.biomeController?.getManager() ?? null;
  }

  getPlayer(): Player { return this.player; }
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

  // Chest sprite track/untrack/markers extracted to ChestSpriteRegistry.
}
