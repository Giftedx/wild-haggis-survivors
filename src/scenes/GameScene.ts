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
import { recordRun, loadSave, RunResult, RunSummary, RunHistoryContext } from '../utils/save';
import { audio } from '../systems/AudioSystem';
import { musicEngine, GameMusicState } from '../systems/music/ProceduralMusicEngine';
import { BOSSES } from '../data/enemies';
import { formatRunVariantLabel, getVariantByKey, VariantDef } from '../data/variants';
import { ISceneContext } from '../core/ISceneContext';
import { UpdateTickers, TickerHandle } from '../utils/UpdateTickers';
import { SubscriptionBag } from '../utils/SubscriptionBag';
import { createRNG, randomSeed, encodeSeed, currentDailyDateKey, type RNG } from '../utils/rng';
import { DebugOverlay } from '../ui/DebugOverlay';
import { SaveManager, type IRunState } from '../core/SaveManager';
import { StatComposer } from '../core/StatComposer';
import { applyAudioFromUserSettings } from '../core/applyAudioFromSettings';
import { getSettingsManager } from '../core/SettingsManager';
import { BanterSystem } from '../systems/BanterSystem';
import type { BanterContext } from '../data/banter';
import { getAnalyticsManager } from '../core/AnalyticsManager';
import { globalEventBus } from '../core/GlobalEventBus';
import { t } from '../core/i18n';
import { sfxManager, type SFXManager } from '../systems/audio/SFXManager';
import { tryCameraShake } from '../utils/cameraShake';
import { getCameraViewport } from '../ui/cameraViewport';
import {
  createGameplaySessionGuard,
  finalizeResumeStartup,
  readPendingResumeRun,
} from '../core/GameSessionLifecycle';
import type { GameOverPayload } from './gameOverPayload';
import { RunStatsTracker } from '../systems/RunStatsTracker';
import { DeathCauseTracker } from '../systems/DeathCauseTracker';
import { defaultModifiers, type RunModifiers } from '../core/RunModifiers';
import { consumePendingCurse, getCurseByKey, type CurseKey } from '../data/curses';
import { StatusFxPool } from '../systems/StatusFxPool';
import { TutorialSystem } from '../systems/TutorialSystem';
import type { BiomeId } from '../data/biomes';
import type { BiomeManager } from '../systems/BiomeManager';
import { BiomeController } from './game/BiomeController';
import { PauseMenu } from './game/PauseMenu';
import { PickupSpawner } from './game/PickupSpawner';
import { LevelUpFlow } from './game/LevelUpFlow';
import { RunLifecycle } from './game/RunLifecycle';
import { createHighlandTerrain } from './game/highlandTerrain';
import { HazardZones } from './game/HazardZones';
import { applyPermanentUpgrades, applyVariantModifiers } from './game/runStartModifiers';
import { CaptionManager } from '../systems/a11y/CaptionManager';
import { CaptionOverlay } from '../systems/a11y/CaptionOverlay';
import {
  computeAutoBattleSteering,
  installAutoBattleTimeScale,
  isAutoBattleEnabled,
  reportAutoBattleRunEnd,
  uninstallAutoBattleTimeScale,
} from '../dev/AutoBattler';

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
  private activeChestSprites: Array<{ sprite: Phaser.GameObjects.Sprite; golden: boolean }> = [];
  private iFrames: boolean = false;

  private ownedPassives: string[] = [];
  private evolvedWeapons: string[] = [];
  private killCount: number = 0;
  private bossKillCount: number = 0;
  private bossGoldEarned: number = 0;
  private coinGoldEarned: number = 0;
  /** Chests deferred while paused — queued so multiple timer callbacks don't overwrite each other. */
  private pendingChests: Array<{ golden: boolean }> = [];
  private victoryPending: boolean = false;
  private dashIndicator: Phaser.GameObjects.Graphics | null = null;
  private boundaryWarning: Phaser.GameObjects.Rectangle | null = null;
  private runId: object = {};
  private revivalAvailable: boolean = false;
  private iFrameGeneration: number = 0;
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
  /** Hit invincibility window — ticked with scaled delta. */
  private iFrameRemainingMs = 0;
  private iFrameTimerGen = 0;
  /** Damage flash tint clear — ticked with scaled delta. */
  private hitTintClearRemainingMs = 0;
  /** Victory polling while level-up modal blocks (raw delta — runs during timeScale 0). */
  private victoryDeferMs = 0;
  private victoryDelayGen = 0;
  /** Death → run result overlay delay (raw delta — runs during RUN_END pause). */
  private deathResultRemainingMs: number | null = null;
  private deathResultCallback: (() => void) | null = null;
  /** Victory → run result overlay delay (raw delta — RUN_END sets timeScale=0
   *  so `time.delayedCall` would never fire; use the same raw ticker pattern
   *  as death so the ceremony lands on the game-over screen). */
  private victoryResultRemainingMs: number | null = null;
  private victoryResultCallback: (() => void) | null = null;
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
  private cachedBoss: Enemy | null = null;
  private cachedBossConfig: (typeof BOSSES)[number] | null = null;

  /** Reused each frame — avoids allocating a new object for `musicEngine.update`. */
  private readonly musicStateScratch: GameMusicState = {
    hp: 0, maxHp: 0, gameTimeSec: 0, enemyCount: 0, comboCount: 0, killCount: 0, bossActive: false,
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
  private floatTextPool: Phaser.GameObjects.Text[] = [];
  private readonly runStatsTracker = new RunStatsTracker();
  private readonly deathCauseTracker = new DeathCauseTracker();
  /** Per-run modifier bag (from curse pick). Defaults to identity — an un-cursed run behaves identically to the pre-curse codebase. */
  private runModifiers: RunModifiers = defaultModifiers();
  /** Curse key chosen for this run, if any — persisted into run history. */
  private activeCurseKey: CurseKey | null = null;
  private pageHideBound?: () => void;
  private devKeydownHandler?: (e: KeyboardEvent) => void;
  private lastEmittedRunSecond = -1;
  private achievementUnsub: (() => void) | null = null;
  private bossEnrageUnsub: (() => void) | null = null;
  private biomeController: BiomeController | null = null;
  private pauseMenu: PauseMenu | null = null;
  private pickupSpawner!: PickupSpawner;
  private levelUpFlow!: LevelUpFlow;
  private runLifecycle!: RunLifecycle;
  private hazardZones!: HazardZones;
  private captionManager: CaptionManager | null = null;
  private captionOverlay: CaptionOverlay | null = null;
  /** Gates the low-HP caption — fires once per dip below the threshold. */
  private lowHpCaptionArmed = true;
  private banter: BanterSystem | null = null;
  private firstKillSeen = false;
  private lastBiomeForBanter: BiomeId | null = null;
  /** Last time banter fired (ms, scene.time.now). Drives the idle prompt. */
  private lastBanterFireMs = 0;
  private readonly gameplaySessionGuard = createGameplaySessionGuard(() => {
    getAnalyticsManager().endGameplaySession();
  });

  constructor() {
    super({ key: 'Game' });
  }

  getUiViewport(): { x: number; y: number; width: number; height: number; zoom: number } {
    const { x, y, width, height, zoom } = getCameraViewport(this);
    return { x, y, width, height, zoom };
  }

  /**
   * Blank every transient per-run field so a recycled scene instance starts
   * clean. Must include anything mutated during gameplay — see the field
   * declarations above for the inventory. Called once from create() before
   * any systems are constructed.
   */
  private resetTransientRunState(): void {
    this.iFrames = false;
    this.pauseMenu?.close();
    this.pauseMenu = null;
    this.victoryPending = false;
    this.runId = {};
    this.iFrameGeneration = 0;
    this.chestDurationBonusMs = 0;
    const runSeed = this.pendingRunSeed ?? randomSeed();
    this.runRng = createRNG(runSeed);
    this.pendingRunSeed = null;
    this.pendingChests = [];
    this.pickupDespawnHandles = [];
    this.updateTickers.clear();
    this.iFrameRemainingMs = 0;
    this.iFrameTimerGen = 0;
    this.hitTintClearRemainingMs = 0;
    this.victoryDeferMs = 0;
    this.victoryDelayGen = 0;
    this.deathResultRemainingMs = null;
    this.deathResultCallback = null;
    this.victoryResultRemainingMs = null;
    this.victoryResultCallback = null;
    this.victoryFade?.destroy();
    this.victoryFade = null;
    this.deathFade?.destroy();
    this.deathFade = null;
    this.hintHideHandle = null;
    this.hazardZones?.reset();
    this.lastEmittedRunSecond = -1;
    this.activeChestSprites = [];
    this.announcedEvolutionReady.clear();
    this.runStatsTracker.reset();
    this.deathCauseTracker.reset(0);
    this.dashIndicator?.destroy();
    this.dashIndicator = null;
    this.boundaryWarning?.destroy();
    this.boundaryWarning = null;
    this.subs = new SubscriptionBag();
  }

  /** Acquire a pooled floating text, or return null if pool is exhausted. */
  private acquireFloatText(
    x: number, y: number, str: string,
    color: string, fontSize: string = '16px', depth: number = 85
  ): Phaser.GameObjects.Text | null {
    const txt = this.floatTextPool.find(t => !t.visible);
    if (!txt) return null;
    txt.setText(str);
    txt.setPosition(x, y);
    txt.setVisible(true).setAlpha(1).setScale(1);
    txt.setColor(color);
    txt.setFontSize(fontSize);
    txt.setDepth(depth);
    return txt;
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
    this.lowHpCaptionArmed = true;
    this.firstKillSeen = false;
    this.lastBiomeForBanter = null;
    this.lastBanterFireMs = 0;

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
      isIFrames: () => this.iFrames,
      isVictoryPending: () => this.victoryPending,
      getDamageTakenMult: () => this.runModifiers.damageTakenMult,
      onPlayerKilled: () => this.runLifecycle.onPlayerHitZero(),
    });
    this.hazardZones.spawn();

    // Systems
    this.statusFxPool = new StatusFxPool(this);
    this.spawnSystem = new SpawnSystem(this);
    this.spawnSystem.setSpawnIntervalMult(this.runModifiers.spawnIntervalMult);
    this.weaponSystem = new WeaponSystem(this, this.spawnSystem.getEnemyGroup());
    this.xpSystem = new XPSystem(this);
    Enemy.refreshSettings();
    this.cachedBoss = null;
    this.cachedBossConfig = null;
    this.ownedPassives = [];
    this.evolvedWeapons = [];
    this.killCount = 0;
    this.bossKillCount = 0;
    this.bossGoldEarned = 0;
    this.coinGoldEarned = 0;
    this.revivalAvailable = false;

    // Pre-allocate floating text pool for armor/gold feedback
    for (const t of this.floatTextPool) t.destroy();
    this.floatTextPool = [];
    for (let i = 0; i < 12; i++) {
      const ft = this.add.text(0, 0, '', {
        fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
        fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
      }).setDepth(85).setVisible(false);
      this.floatTextPool.push(ft);
    }

    // Variant modifiers establish the run archetype before permanent upgrades stack on top.
    applyVariantModifiers(this.player, selectedVariant);

    // Apply permanent upgrades from save data. The two flag outputs
    // don't live on Player so come back as a result object.
    const permResult = applyPermanentUpgrades({
      player: this.player,
      weaponSystem: this.weaponSystem,
      levelUpFlow: this.levelUpFlow,
      ownedPassives: this.ownedPassives,
      runRng: this.runRng,
    });
    this.revivalAvailable = permResult.revivalAvailable;
    this.chestDurationBonusMs = permResult.chestDurationBonusMs;

    if (resumeRun) {
      this.applyResumeHydration(resumeRun);
    }

    // Upgrade card UI
    this.upgradeUI = new UpgradeCardsUI(this, (card) => this.levelUpFlow.apply(card), this.updateTickers);
    this.upgradeUI.setRerollCallback(() => this.levelUpFlow.reroll());

    // When an enemy is killed
    this.weaponSystem.events.on('enemyKilled', (x: number, y: number, xpValue: number, enemyKey: string, wasBoss: boolean, wasElite: boolean = false) => {
      // Kill streak XP bonus: +1% XP per combo count (capped at +50%)
      const comboXpBonus = Math.min(0.5, this.juice.getComboCount() * 0.01);
      this.xpSystem.spawnGem(x, y, Math.ceil(xpValue * this.player.getXpMultiplier() * (1 + comboXpBonus)));
      this.killCount++;
      this.juice.showKillBurst(x, y);
      this.juice.hitFreeze();
      this.getSFXManager().tryPlay('kill', () => audio.playKillImmediate());

      // Banter hooks — first kill of the run, mid-tier kill streaks that
      // sit *between* the loud milestone easter eggs (11 / 50 / 100 /
      // 200) so banter feels like ambient soul, not stepped-on celebration.
      if (!this.firstKillSeen) {
        this.firstKillSeen = true;
        this.banter?.request('first_blood');
      }
      if (wasBoss) {
        // enemyKey for a boss is the boss's own key (see BOSSES defs) —
        // drives the per-boss celebration pool (taxman/gordon/etc).
        this.banter?.request('boss_down', { tag: enemyKey });
      } else {
        const combo = this.juice.getComboCount();
        if (combo === 20 || combo === 75 || combo === 150) {
          this.banter?.request('kill_streak');
        }
      }

      // Lifesteal — heal on kill
      if (this.player.getLifesteal() > 0) {
        this.player.heal(this.player.getLifesteal());
      }

      // Kill milestones — celebrate and reward gold with unique Glesga patter per threshold
      if ([100, 250, 500, 1000, 2500, 5000].includes(this.killCount)) {
        const goldReward = Math.floor(this.killCount / 50);
        this.coinGoldEarned += goldReward;
        // Each milestone has its own culturally-loaded one-liner
        const milestoneKey = `ui.game.kill_${this.killCount}`;
        const milestoneText = t(milestoneKey, { gold: goldReward });
        // Fallback to generic if a specific key is missing
        const toast = milestoneText !== milestoneKey
          ? milestoneText
          : t('ui.game.kill_milestone', { count: this.killCount, gold: goldReward });
        this.juice.showToast(toast, '#ffdd00');
        this.juice.flashWhite(150);
        audio.playLevelUp();
      }

      // Death ripple — push nearby enemies away from the kill (max 6).
      // Uses applyKnockback so the push actually persists past the next
      // behavior-chase velocity reset. Squared-compare gates the loop;
      // the same dx/dy doubles as the knockback direction.
      const enemies = this.spawnSystem.getEnemyGroup().children.entries as Enemy[];
      const RIPPLE_RADIUS_SQ = 50 * 50;
      let pushed = 0;
      for (let i = 0; i < enemies.length && pushed < 6; i++) {
        const e = enemies[i];
        if (!e.active) continue;
        const dx = e.x - x;
        const dy = e.y - y;
        const distSq = dx * dx + dy * dy;
        if (distSq < RIPPLE_RADIUS_SQ && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const body = e.body as Phaser.Physics.Arcade.Body;
          const force = 120 / body.mass / dist;
          e.applyKnockback(dx * force, dy * force, 120);
          pushed++;
        }
      }

      // 5% chance to drop a health orb on kill (bosses always drop).
      // Gameplay RNG — seeded so daily/shared runs drop at the same moments.
      if (wasBoss || this.runRng.bool(0.05)) {
        this.pickupSpawner.spawnHealthOrb(x, y, wasBoss ? 25 : 5);
      }

      // 2% chance to drop gold coins (elites 10%, bosses always).
      const goldChance = wasBoss ? 1 : (wasElite ? 0.10 : 0.02);
      if (this.runRng.bool(goldChance)) {
        this.pickupSpawner.spawnGoldCoin(x, y, wasBoss ? this.runRng.int(5, 15) : this.runRng.int(1, 3));
      }

      if (wasBoss) {
        this.bossKillCount++;
        // Per-boss kill celebration — unique Glesga patter for each boss
        const bossKillKey = `ui.game.boss_killed_${enemyKey}`;
        const bossKillText = t(bossKillKey);
        const bossToast = bossKillText !== bossKillKey ? bossKillText : t('ui.game.boss_killed_generic');
        this.juice.showToast(bossToast, '#ffdd44');
        // Boss kill heal (Trophy Hunter card)
        if (this.player.getBossHealFrac() > 0) {
          const healAmount = Math.ceil(this.player.getMaxHp() * this.player.getBossHealFrac());
          this.player.heal(healAmount);
          this.juice.showToast(t('ui.game.boss_kill_heal', { hp: healAmount }), '#44ff44');
        }
        // Scale boss gold with difficulty — xpValue is 25/50/75/100/200 for each boss
        this.bossGoldEarned += Math.ceil(xpValue * 2);
        this.juice.bossDeathSpectacle(x, y);
        this.juice.slowMotion();

        // Check for victory — Taxman killed
        if (enemyKey === 'taxman') {
          this.victoryPending = true;
          const gen = ++this.victoryDelayGen;
          this.updateTickers.addOnce('raw', 1500, () => {
            if (gen !== this.victoryDelayGen) return;
            this.runLifecycle.handleVictory();
          });
        }
      }
    });

    // Floating damage numbers + hit sound + DPS tracking + impact ring burst
    this.weaponSystem.events.on('damageDealt', (x: number, y: number, amount: number, isCrit: boolean, weaponKey?: string) => {
      this.juice.showDamageNumber(x, y, amount, isCrit);
      this.juice.spawnImpactRing(x, y);
      this.hud.logDamage(amount);
      this.runStatsTracker.addWeaponDamage(weaponKey ?? 'unknown', amount);
      this.getSFXManager().tryPlay('hit', () => audio.playHitImmediate());
    });

    // Projectile trails — weapon-specific colors; evolved weapons get gold overlay
    const weaponTrailColors: Record<string, number[]> = {
      thistle_shot: [0x9966cc, 0xaa77dd, 0x8855bb],  // purple — heather
      caber_toss:   [0xcc7733, 0xdd8844, 0xbb6622],  // ember — burning wood
      haggis_hurler:[0x8b6914, 0x9a7822, 0x7a5a0a],  // brown — haggis
      scotch_mist:  [0x6699aa, 0x77aacc, 0x5588aa],  // cyan — misty water
      nessie_tentacle:[0x226644, 0x338855, 0x1a5533], // murky green — loch
      claymore:     [0x8899aa, 0x99aabb, 0x778899],   // steel — metal
      bagpipe_blast:[0x4488ff, 0x5599ff, 0x3377ee],   // blue — sonic
    };
    const evolvedColors = [0xffcc44, 0xffdd66, 0xd4a017]; // gold — mastery
    const defaultColors = [0x9966cc, 0xaa77dd, 0x8855bb];
    this.weaponSystem.events.on('projectileTrail', (x: number, y: number, evolved: boolean, wKey: string) => {
      const colors = evolved ? evolvedColors : (weaponTrailColors[wKey] ?? defaultColors);
      this.juice.spawnTrail(x, y, colors[Math.floor(Math.random() * colors.length)]);
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
    this.playerEnemyCollider = this.physics.add.overlap(
      this.player,
      this.spawnSystem.getEnemyGroup(),
      this.onPlayerHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
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
    this.pickupSpawner = new PickupSpawner(this, {
      getPlayer: () => this.player,
      getJuice: () => this.juice,
      getXPSystem: () => this.xpSystem,
      getUpdateTickers: () => this.updateTickers,
      getSFXManager: () => this.getSFXManager(),
      getChestDurationBonusMs: () => this.chestDurationBonusMs,
      onCoinCollected: (amount) => { this.coinGoldEarned += amount; },
      trackChest: (s, g) => this.trackChestSprite(s, g),
      untrackChest: (s) => this.untrackChestSprite(s),
      pushDespawnHandle: (h) => { this.pickupDespawnHandles.push(h); },
      offerTreasureEvolutionIfEligible: () => this.levelUpFlow.offerChestEvolution(),
      acquireFloatText: (x, y, str, color, fs, d) => this.acquireFloatText(x, y, str, color, fs, d),
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
      addKill: (n = 1) => { this.killCount += n; },
      getUiViewport: () => this.getUiViewport(),
      armIFrames: (ms) => this.armIFrames(ms),
      drainPendingChests: () => this.drainPendingChests(),
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
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
      getVictoryPending: () => this.victoryPending,
      setVictoryPending: (v) => { this.victoryPending = v; },
      getRevivalAvailable: () => this.revivalAvailable,
      setRevivalAvailable: (v) => { this.revivalAvailable = v; },
      getVictoryFade: () => this.victoryFade,
      setVictoryFade: (r) => { this.victoryFade = r; },
      getDeathFade: () => this.deathFade,
      setDeathFade: (r) => { this.deathFade = r; },
      setVictoryResultTicker: (ms, cb) => {
        this.victoryResultRemainingMs = ms;
        this.victoryResultCallback = cb;
      },
      setDeathResultTicker: (ms, cb) => {
        this.deathResultRemainingMs = ms;
        this.deathResultCallback = cb;
      },
      setVictoryDeferMs: (ms) => { this.victoryDeferMs = ms; },
      armIFrames: (ms) => this.armIFrames(ms),
      caption: (id, msg, tint, dur) => this.caption(id, msg, tint, dur),
      buildRunSummary: (victory) => this.buildRunSummary(victory),
      buildRunHistoryContext: () => this.buildRunHistoryContext(),
      buildGameOverPayload: (mode, s, r, pb, dc) => this.buildGameOverPayload(mode, s, r, pb, dc),
      recordToHistory: (s, r) => this.recordToHistory(s, r),
      recordRun: (s, ctx) => recordRun(s, ctx),
      transitionToGameOver: (payload) => this.transitionToGameOver(payload),
    });
    this.juice.setResumeBestCombo(resumeRun?.bestCombo);
    this.juice.setResumeComboState(resumeRun?.comboCount, resumeRun?.comboTimerMs);
    this.showRunIdentityToast(Boolean(resumeRun));
    this.achievementUnsub?.();
    this.achievementUnsub = globalEventBus.on('ACHIEVEMENT_UNLOCKED', (p) => {
      this.juice.showToast(t('ui.game.achievement_unlock', { title: p.title }), '#ffdd88');
      audio.playAchievement();
    });
    this.bossEnrageUnsub?.();
    this.bossEnrageUnsub = globalEventBus.on('bossEnraged', () => {
      this.juice.showToast(t('ui.game.boss_enraged'), '#ff4444');
    });
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

    this.registerDebugTimeTravelApi();
    this.registerMidRunPersistenceHooks();

    getAnalyticsManager().beginGameplaySession({ variantKey: this.activeVariant.key });
    this.gameplaySessionGuard.markStarted();

    const prefs = this.settingsManager.load();
    applyAudioFromUserSettings(prefs);
    if (prefs.musicVolume > 0.001) {
      musicEngine.start();
    }

    // Treasure chest timer — spawns every 45 seconds (scaled; freezes on pause)
    this.pendingChests = [];
    this.updateTickers.addInterval('scaled', 45000, () => {
      // 20% chance of golden chest (gold reward instead of heal) — seeded
      // so the same run always gets the same chest type at each spawn.
      const golden = this.runRng.bool(0.2);
      if (this.timeManager.isGameplayPaused()) {
        this.pendingChests.push({ golden });
      } else if (golden) {
        this.pickupSpawner.spawnGoldenChest();
      } else {
        this.pickupSpawner.spawnTreasure();
      }
    });

    if (this.input.keyboard) {
      // Phaser's KeyboardPlugin extends Events.EventEmitter, which satisfies
      // SubscriptionBag's MinimalEmitter contract. The earlier `as any` cast
      // bypassed TypeScript entirely; widen to the concrete base class instead.
      const kb: Phaser.Events.EventEmitter = this.input.keyboard;
      this.subs.listen(kb, 'keydown-ESC', () => this.toggleUiPause());
      this.subs.listen(kb, 'keydown-F3', () => this.debugOverlay?.toggle());
    }

    // Fade in from black
    const { x: uiX, y: uiY, width: uiWidth, height: uiHeight } = this.getUiViewport();
    const fadeIn = this.add.rectangle(
      uiX + uiWidth / 2, uiY + uiHeight / 2,
      uiWidth, uiHeight, 0x000000, 1
    ).setScrollFactor(0).setDepth(999);
    this.tweens.add({ targets: fadeIn, alpha: 0, duration: 500, onComplete: () => fadeIn.destroy() });

    // Controls hint — show for first 30 seconds then fade out
    const { x: hintX, y: hintY, width: hintW, height: hintH } = this.getUiViewport();
    const hint = this.add.text(hintX + hintW / 2, hintY + hintH - 36, t('ui.game.controls_hint'), {
      fontFamily: 'monospace', fontSize: '13px', color: '#888888',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(60).setAlpha(0);
    this.tweens.add({ targets: hint, alpha: 0.8, duration: 500, delay: 4000 });
    this.hintHideHandle = this.updateTickers.addOnce('raw', 30000, () => {
      this.tweens.add({ targets: hint, alpha: 0, duration: 1000, onComplete: () => hint.destroy() });
    });

    // Start countdown — game is paused until it finishes
    this.timeManager.request('COUNTDOWN', { pausePhysics: true, timeScale: 0 });
    this.showCountdown();

    // Resume is now "committed": replace old suspended snapshot with a fresh one.
    finalizeResumeStartup(resumeRun, () => this.persistActiveRunToMeta());
  }

  private showCountdown(): void {
    const { x, y, width, height } = this.getUiViewport();
    const steps = ['3', '2', '1', t('ui.game.countdown_go')];
    let i = 0;

    const showNext = () => {
      if (i >= steps.length) {
        this.timeManager.release('COUNTDOWN');
        return;
      }

      const label = steps[i];
      const isFinal = i === steps.length - 1;
      const text = this.add.text(x + width / 2, y + height / 2, label, {
        fontFamily: 'monospace',
        fontSize: isFinal ? '40px' : '64px',
        color: isFinal ? '#d4a017' : '#ffffff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 6,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1000).setScale(0.5).setAlpha(0);

      this.tweens.add({
        targets: text,
        scale: isFinal ? 1.2 : 1,
        alpha: 1,
        duration: 200,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: text,
            alpha: 0,
            scale: 1.5,
            duration: isFinal ? 400 : 250,
            delay: isFinal ? 300 : 200,
            onComplete: () => {
              text.destroy();
              i++;
              showNext();
            },
          });
        },
      });

      audio.playClick();
    };

    // Small delay before countdown starts (raw time)
    this.updateTickers.addOnce('raw', 300, showNext);
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
      this.achievementUnsub?.();
      this.achievementUnsub = null;
      this.bossEnrageUnsub?.();
      this.bossEnrageUnsub = null;
      this.unregisterMidRunPersistenceHooks();
      this.unregisterDebugTimeTravelApi();
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
      for (const ft of this.floatTextPool) { try { ft.destroy(); } catch { /* ignore */ } }
      this.floatTextPool = [];
      // Close lifecycle gaps — these systems were silently orphaned before
      try { this.juice?.destroy(); } catch { /* ignore */ }
      try { this.hud?.destroy(); } catch { /* ignore */ }
      try { this.minimap?.destroy(); } catch { /* ignore */ }
      try { this.edgeIndicators?.destroy(); } catch { /* ignore */ }
      try { this.upgradeUI?.hide?.(); } catch { /* ignore */ }
      try { this.victoryFade?.destroy(); } catch { /* ignore */ }
      this.victoryFade = null;
      try { this.deathFade?.destroy(); } catch { /* ignore */ }
      this.deathFade = null;
    });
  }

  update(_time: number, delta: number): void {
    // Cap delta to prevent time warps from tab-backgrounding (browser throttles
    // requestAnimationFrame to ~1fps when backgrounded, producing huge deltas on return)
    delta = Math.min(delta, 100);

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

    this.tickHitTintClear(scaledDelta);
    this.tickIFrameWindow(scaledDelta);
    this.tickVictoryDefer(delta);
    this.tickDeathResultOverlay(delta);
    this.tickVictoryResultOverlay(delta);

    if (isAutoBattleEnabled()) {
      this.player.setAutoBattleSteering(
        computeAutoBattleSteering({
          playerX: this.player.x,
          playerY: this.player.y,
          gems: this.xpSystem.getGemPositionsForAutoBattle(),
          worldWidth: GAME.WORLD_WIDTH,
          worldHeight: GAME.WORLD_HEIGHT,
          timeSec: this.spawnSystem.getGameTimeSec(),
        })
      );
    } else {
      this.player.setAutoBattleSteering(null);
    }

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
    this.tickBiome();
    this.tickLowHpCaption();
    this.tickBanter();
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
    }

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
    this.xpSystem.update(this.player.x, this.player.y, this.player.getPickupRadius(), this.player.getHp() / this.player.getMaxHp());
    // Juice is cosmetic (shake, combo toasts, damage numbers) — stays on raw
    // delta so VFX don't stall during slow-mo and the combo meter still decays
    // at wall-clock rate.
    this.juice.update(delta, this.player.getHp() / this.player.getMaxHp());

    // Boss HP bar + edge indicators
    this.updateBossHPBar();
    this.edgeIndicators.update(this.player.x, this.player.y, this.spawnSystem.getEnemyGroup());
    this.minimap.update(
      this.player.x,
      this.player.y,
      this.spawnSystem.getEnemyGroup(),
      this.getActiveChestMarkers(),
      this.player.rotation
    );
    const ms = this.musicStateScratch;
    ms.hp = this.player.getHp();
    ms.maxHp = this.player.getMaxHp();
    ms.gameTimeSec = this.spawnSystem.getGameTimeSec();
    ms.enemyCount = this.spawnSystem.getActiveCount();
    ms.comboCount = this.juice.getComboCount();
    ms.killCount = this.killCount;
    ms.bossActive = this.spawnSystem.isBossActive();
    musicEngine.update(delta, ms);

    // Dash cooldown indicator (small arc under player)
    this.updateDashIndicator();

    // World boundary warning — red tint when near edges
    this.updateBoundaryWarning();

    this.hud.updateDPS(delta);
    this.hud.updateShield(this.player.hasShield());
    const weapons = this.weaponSystem.getWeapons();
    const wn = weapons.length;
    for (let i = 0; i < wn; i++) {
      const w = weapons[i];
      const row = this.hudWeaponScratch[i];
      row.key = w.config.key;
      row.level = w.level;
      row.evolved = w.evolved;
      row.evolutionKey = w.evolutionKey;
      row.cooldownFrac = Phaser.Math.Clamp(1 - (w.cooldownRemaining / w.cooldownMs), 0, 1);
    }
    this.hud.update(
      this.player.getHp(), this.player.getMaxHp(),
      this.xpSystem.getLevel(),
      this.xpSystem.getXPFraction(),
      this.spawnSystem.getGameTimeSec(),
      this.killCount,
      this.spawnSystem.getActiveCount(),
      this.player.getDashCharges(),
      this.player.getMaxDashCharges(),
      this.player.getDashCooldownFraction(),
      this.hudWeaponScratch,
      this.ownedPassives,
      wn
    );
  }

  armIFrames(durationMs: number): void {
    this.iFrameGeneration++;
    this.iFrameTimerGen = this.iFrameGeneration;
    this.iFrameRemainingMs = durationMs;
    this.iFrames = true;
  }

  private tickHitTintClear(scaledDelta: number): void {
    if (this.hitTintClearRemainingMs <= 0) return;
    this.hitTintClearRemainingMs -= scaledDelta;
    if (this.hitTintClearRemainingMs <= 0) {
      this.hitTintClearRemainingMs = 0;
      if (this.player?.active) this.player.clearTint();
    }
  }

  private tickIFrameWindow(scaledDelta: number): void {
    if (this.iFrameRemainingMs <= 0) return;
    this.iFrameRemainingMs -= scaledDelta;
    if (this.iFrameRemainingMs <= 0 && this.iFrameTimerGen === this.iFrameGeneration) {
      this.iFrameRemainingMs = 0;
      this.iFrames = false;
      if (this.player?.active) this.player.setAlpha(1);
    }
  }

  private tickVictoryDefer(rawDelta: number): void {
    if (this.victoryDeferMs <= 0) return;
    this.victoryDeferMs -= rawDelta;
    if (this.victoryDeferMs <= 0) {
      this.victoryDeferMs = 0;
      this.runLifecycle.handleVictory();
    }
  }

  private tickDeathResultOverlay(rawDelta: number): void {
    if (this.deathResultRemainingMs === null || this.deathResultCallback === null) return;
    this.deathResultRemainingMs -= rawDelta;
    if (this.deathResultRemainingMs <= 0) {
      const cb = this.deathResultCallback;
      this.deathResultRemainingMs = null;
      this.deathResultCallback = null;
      cb();
    }
  }

  private tickVictoryResultOverlay(rawDelta: number): void {
    if (this.victoryResultRemainingMs === null || this.victoryResultCallback === null) return;
    this.victoryResultRemainingMs -= rawDelta;
    if (this.victoryResultRemainingMs <= 0) {
      const cb = this.victoryResultCallback;
      this.victoryResultRemainingMs = null;
      this.victoryResultCallback = null;
      cb();
    }
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
          getKillCount: () => this.killCount,
          getLevel: () => this.xpSystem.getLevel(),
          getEquippedWeaponCount: () => this.weaponSystem.getWeapons().length,
          getOwnedPassives: () => this.ownedPassives,
          onResumeRequested: () => this.toggleUiPause(),
          onQuitRequested: () => this.abandonRunToMainMenu(),
        });
      }
      this.pauseMenu.open();
    }
  }

  private onPlayerHitEnemy(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    if (this.iFrames || this.timeManager.isGameplayPaused() || this.victoryPending || this.player.isDashInvincible()) return;

    const enemy = enemyObj as Enemy;
    if (!enemy.active) return;

    // Curse-scaled damage before armor mitigation. Thin Hide inflates
    // incoming blows by 25%; an identity mult is a no-op.
    const rawDmg = enemy.getDamage();
    const incomingDmg = Math.max(1, Math.round(rawDmg * this.runModifiers.damageTakenMult));
    const armor = this.player.getArmor();
    const dead = this.player.takeDamage(incomingDmg);
    this.deathCauseTracker.recordDamage({
      gameTimeSec: this.spawnSystem.getGameTimeSec(),
      sourceKey: enemy.getEnemyKey(),
      amount: Math.max(1, incomingDmg - armor),
      sourceIsBoss: enemy.isBoss(),
      sourceIsElite: enemy.isElite(),
      sourceIsHazard: false,
      hpAfter: this.player.getHp(),
      maxHpAfter: this.player.getMaxHp(),
    });

    // Show armor absorption text if armor reduced damage
    if (armor > 0 && incomingDmg > 1) {
      const absorbed = Math.min(armor, incomingDmg - 1);
      const shieldText = this.acquireFloatText(
        this.player.x, this.player.y - 30,
        t('ui.game.armor_blocked', { amount: absorbed }),
        '#88aaff', '14px', 85,
      );
      if (shieldText) {
        this.tweens.add({ targets: shieldText, y: shieldText.y - 15, alpha: 0, duration: 500, onComplete: () => { shieldText.setVisible(false); } });
      }
    }

    // Thorns damage: hurt the enemy that touched us
    if (this.player.getThornsDamage() > 0 && enemy.active) {
      enemy.takeDamageWithKillEvents(this.player.getThornsDamage());
    }

    this.player.setAlpha(0.5);
    this.player.setTintFill(0xffffff); // White impact flash (matches enemy pattern)
    this.hitTintClearRemainingMs = 60;

    // Squash-stretch recoil — the haggis visibly flinches on hit
    const baseScale = this.player.scaleX;
    this.tweens.add({
      targets: this.player, scaleX: baseScale * 0.85, scaleY: baseScale * 1.15,
      duration: 50, yoyo: true, ease: 'Sine.easeOut',
    });
    // Scale shake intensity with damage proportion
    const dmgFrac = incomingDmg / this.player.getMaxHp();
    const shakeIntensity = Math.min(0.02, 0.003 + dmgFrac * 0.03);
    tryCameraShake(this.cameras.main, 100 + dmgFrac * 200, shakeIntensity, this.settingsManager);
    audio.playPlayerHit();
    this.juice.flashRed();

    this.armIFrames(500);

    if (dead) this.runLifecycle.onPlayerHitZero();
  }

  /**
   * Unified death/revival handler. Called from any damage source that can
   * reduce HP to zero (contact damage, lava zones, future DoT effects, etc.).
   * Safe to no-op if victory is already pending.
   */
  /**
   * Soul weave — run start: hand off variant identity + intent in the first moments of play.
   */
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

  /** Seconds past the Bell (Taxman kill). Read by SpawnSystem for escalation. */
  getSecondsPastBell(): number { return this.runLifecycle.getSecondsPastBell(); }

  isPostBell(): boolean { return this.runLifecycle.isPostBell(); }

  /**
   * Stops GameScene (Phase 13 shutdown cascade) then hands UI to GameOverScene.
   */
  private transitionToGameOver(payload: GameOverPayload): void {
    try {
      reportAutoBattleRunEnd({
        outcome: payload.mode === 'victory' ? 'victory' : 'death',
        gameTimeSec: payload.summary.timeSurvivedSec,
        weaponDamage: payload.weaponDamage,
      });
    } catch {
      /* ignore */
    }
    try {
      globalEventBus.emit('GLOBAL_RUN_ENDED', {
        outcome: payload.mode,
        gameTimeSec: payload.summary.timeSurvivedSec,
        enemiesKilled: payload.summary.enemiesKilled,
      });
    } catch {
      /* ignore */
    }
    try {
      this.metaSaveManager.clearActiveRun();
    } catch {
      /* ignore */
    }
    this.scene.stop('Game');
    this.scene.start('GameOver', payload);
  }

  private abandonRunToMainMenu(): void {
    try {
      this.metaSaveManager.clearActiveRun();
    } catch {
      /* ignore */
    }
    musicEngine.stop();
    this.scene.start('MainMenu');
  }

  private collectRunStateForMeta(): IRunState {
    return {
      gameTimeSec: this.spawnSystem.getGameTimeSec(),
      playerX: this.player.x,
      playerY: this.player.y,
      playerHealth: this.player.getHp(),
      playerMaxHp: this.player.getMaxHp(),
      currentXp: this.xpSystem.getCurrentXP(),
      currentLevel: this.xpSystem.getLevel(),
      acquiredWeapons: this.weaponSystem.getWeapons().map((w) => ({
        key: w.config.key,
        level: w.level,
        evolved: w.evolved,
        evolutionKey: w.evolutionKey ?? '',
      })),
      selectedVariantKey: this.activeVariant.key,
      killCount: this.killCount,
      ownedPassives: [...this.ownedPassives],
      evolvedWeaponKeys: [...this.evolvedWeapons],
      bossKillCount: this.bossKillCount,
      bossGoldEarned: this.bossGoldEarned,
      coinGoldEarned: this.coinGoldEarned,
      revivalAvailable: this.revivalAvailable,
      bestCombo: this.juice.getBestCombo(),
      comboCount: this.juice.getComboCount(),
      comboTimerMs: this.juice.getComboTimerRemainingMs(),
      dashCharges: this.player.getDashCharges(),
      dashCooldownMs: this.player.getDashCooldownMs(),
      weaponDamage: this.runStatsTracker.snapshot(),
      spawnedBossKeys: this.spawnSystem.getSpawnedBossKeys(),
      shieldCooldownMs: this.player.getShieldCooldownMs(),
    };
  }

  private persistActiveRunToMeta(): void {
    if (!this.timeManager) return;
    if (this.timeManager.has('RUN_END')) return;
    try {
      this.metaSaveManager.saveActiveRun(this.collectRunStateForMeta());
    } catch {
      /* ignore */
    }
  }

  private applyResumeHydration(run: IRunState): void {
    this.xpSystem.hydrateRunState(run.currentLevel, run.currentXp);
    for (let lv = 2; lv <= run.currentLevel; lv++) {
      this.player.onLevelUp(lv);
    }
    this.ownedPassives = [...run.ownedPassives];
    this.evolvedWeapons = [...run.evolvedWeaponKeys];
    for (const p of this.ownedPassives) {
      this.levelUpFlow.applyPassiveEffect(p);
    }
    this.player.setResumeHealth(run.playerHealth);
    this.player.setResumeShieldCooldown(run.shieldCooldownMs);
    this.player.setResumeDashState(run.dashCharges, run.dashCooldownMs);
    this.weaponSystem.replaceWeaponsFromRun(run.acquiredWeapons);
    this.evolvedWeapons = this.weaponSystem
      .getWeapons()
      .filter((w) => w.evolved)
      .map((w) => w.config.key);
    this.spawnSystem.applyResumeTime(run.gameTimeSec, run.spawnedBossKeys);
    this.killCount = run.killCount;
    this.bossKillCount = Math.max(0, run.bossKillCount ?? 0);
    this.bossGoldEarned = Math.max(0, run.bossGoldEarned ?? 0);
    this.coinGoldEarned = Math.max(0, run.coinGoldEarned ?? 0);
    if (run.revivalAvailable !== undefined) {
      this.revivalAvailable = run.revivalAvailable;
    }
    this.runStatsTracker.restore(run.weaponDamage);
  }

  private registerDebugTimeTravelApi(): void {
    const g = globalThis as unknown as {
      DEBUG?: {
        skipToMinute: (m: number) => void;
        skipToGameSecond: (s: number) => void;
      };
    };
    g.DEBUG = {
      skipToMinute: (m: number) => {
        this.spawnSystem.timeTravelToSeconds(Math.max(0, Number(m) || 0) * 60);
      },
      skipToGameSecond: (s: number) => {
        this.spawnSystem.timeTravelToSeconds(Math.max(0, Number(s) || 0));
      },
    };

    if (typeof window === 'undefined') return;
    this.devKeydownHandler = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.code !== 'BracketRight') return;
      if (!this.scene.isActive()) return;
      e.preventDefault();
      this.spawnSystem.timeTravelToSeconds(this.spawnSystem.getGameTimeSec() + 60);
    };
    window.addEventListener('keydown', this.devKeydownHandler);
  }

  private unregisterDebugTimeTravelApi(): void {
    const g = globalThis as unknown as { DEBUG?: unknown };
    if (g.DEBUG) {
      delete g.DEBUG;
    }
    if (this.devKeydownHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.devKeydownHandler);
      this.devKeydownHandler = undefined;
    }
  }

  private registerMidRunPersistenceHooks(): void {
    if (typeof window === 'undefined') return;
    this.pageHideBound = () => {
      try {
        if (!this.scene.isActive()) return;
        this.persistActiveRunToMeta();
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('pagehide', this.pageHideBound);
    window.addEventListener('beforeunload', this.pageHideBound);
  }

  private unregisterMidRunPersistenceHooks(): void {
    if (typeof window === 'undefined' || !this.pageHideBound) return;
    window.removeEventListener('pagehide', this.pageHideBound);
    window.removeEventListener('beforeunload', this.pageHideBound);
    this.pageHideBound = undefined;
  }

  private buildRunHistoryContext(): RunHistoryContext {
    return {
      level: this.xpSystem.getLevel(),
      bossKills: this.bossKillCount,
      variantKey: this.activeVariant.key,
      weaponKeys: this.weaponSystem.getWeapons().map((w) => w.config.key),
      ...(this.activeCurseKey ? { curseKey: this.activeCurseKey } : {}),
    };
  }

  private recordToHistory(summary: RunSummary, runResult: RunResult): void {
    this.metaSaveManager.recordRunToHistory({
      timestamp: Date.now(),
      timeSurvivedSec: summary.timeSurvivedSec,
      enemiesKilled: summary.enemiesKilled,
      level: this.xpSystem.getLevel(),
      bossKills: this.bossKillCount,
      goldEarned: runResult.goldEarned,
      bestCombo: summary.bestCombo ?? 0,
      variantKey: this.activeVariant.key,
      isVictory: summary.victory ?? false,
      weaponKeys: this.weaponSystem.getWeapons().map((w) => w.config.key),
      runSeed: this.runRng.seed,
      isDaily: this.runIsDaily,
    });
    if (this.runIsDaily) {
      this.recordDailyChallengeResult(summary);
    }
  }

  /**
   * Update the per-day Daily Challenge record. Called only for daily runs.
   * Bumps attempts, updates best-time/kill records, and marks completion on
   * the first victory today. If the record is for a past date (e.g. player
   * left the run open overnight), we start a fresh record for today.
   */
  private recordDailyChallengeResult(summary: RunSummary): void {
    const todayKey = currentDailyDateKey();
    this.metaSaveManager.update((cur) => {
      const prior = cur.dailyChallenge && cur.dailyChallenge.dateKey === todayKey
        ? cur.dailyChallenge
        : { dateKey: todayKey, bestTimeSec: 0, bestEnemiesKilled: 0, attempts: 0, completedVictory: false };
      return {
        ...cur,
        dailyChallenge: {
          dateKey: todayKey,
          bestTimeSec: Math.max(prior.bestTimeSec, summary.timeSurvivedSec),
          bestEnemiesKilled: Math.max(prior.bestEnemiesKilled, summary.enemiesKilled),
          attempts: prior.attempts + 1,
          completedVictory: prior.completedVictory || Boolean(summary.victory),
        },
      };
    });
  }

  private buildGameOverPayload(
    mode: 'victory' | 'death',
    summary: RunSummary,
    runResult: RunResult,
    previousBests?: import('../core/SaveManager').PersonalBests,
    deathCause?: import('../core/deathCauseClassifier').DeathCause,
  ): GameOverPayload {
    return {
      mode,
      isVictory: mode === 'victory',
      summary,
      runResult,
      xpLevel: this.xpSystem.getLevel(),
      bossKillCount: this.bossKillCount,
      ownedPassiveCount: this.ownedPassives.length,
      weaponCount: this.weaponSystem.getWeapons().length,
      evolvedCount: this.evolvedWeapons.length,
      buildSummary: this.getRunBuildSummary(),
      variantLabel: formatRunVariantLabel(this.activeVariant),
      variantKey: this.activeVariant.key,
      weaponDamage: this.runStatsTracker.snapshot(),
      previousBests,
      seedCode: encodeSeed(this.runRng.seed),
      isDaily: this.runIsDaily,
      curseKey: this.activeCurseKey ?? undefined,
      deathCause,
    };
  }

  private buildRunSummary(victory: boolean): RunSummary {
    return {
      timeSurvivedSec: this.spawnSystem.getGameTimeSec(),
      enemiesKilled: this.killCount,
      bossGold: this.bossGoldEarned,
      coinGold: this.coinGoldEarned,
      bestCombo: this.juice.getBestCombo(),
      victory,
      goldMult: this.runModifiers.goldMult,
    };
  }

  private getRunBuildSummary(): string {
    const parts = this.weaponSystem
      .getWeapons()
      .map((weapon) => {
        const name = t(weapon.config.nameKey);
        const lv = t('ui.hud.level_fmt', { level: weapon.level });
        return `${name} ${lv}${weapon.evolved ? '★' : ''}`;
      });
    const lines: string[] = [];
    for (let i = 0; i < parts.length; i += 3) {
      lines.push(parts.slice(i, i + 3).join('  |  '));
    }
    return lines.join('\n');
  }

  // ── Boss HP Bar ──

  private updateBossHPBar(): void {
    // Re-scan only when the cached boss is dead or inactive
    if (!this.cachedBoss || !this.cachedBoss.active || !this.cachedBoss.isBoss()) {
      this.cachedBoss = null;
      this.cachedBossConfig = null;
      const enemies = this.spawnSystem.getEnemyGroup().children.entries as Enemy[];
      for (const enemy of enemies) {
        if (enemy.active && enemy.isBoss()) {
          if (!this.cachedBoss || enemy.getHpFraction() < this.cachedBoss.getHpFraction()) {
            this.cachedBoss = enemy;
          }
        }
      }
      if (this.cachedBoss) {
        this.cachedBossConfig = BOSSES.find(b => b.key === this.cachedBoss!.getEnemyKey()) ?? null;
      }
    }

    if (this.cachedBoss) {
      this.hud.updateBossBar({
        name: this.cachedBossConfig ? t(this.cachedBossConfig.nameKey) : this.cachedBoss.getEnemyKey(),
        hpFraction: this.cachedBoss.getHpFraction(),
      });
    } else {
      this.hud.updateBossBar(null);
    }
  }

  /** Drain all chests queued while the game was paused. */
  drainPendingChests(): void {
    while (this.pendingChests.length > 0) {
      const chest = this.pendingChests.shift()!;
      if (chest.golden) this.pickupSpawner.spawnGoldenChest();
      else this.pickupSpawner.spawnTreasure();
    }
  }

  // ── Boundary Warning ──

  private updateBoundaryWarning(): void {
    const { x, y, width, height } = this.getUiViewport();
    if (
      !this.boundaryWarning
      || this.boundaryWarning.width !== width
      || this.boundaryWarning.height !== height
      || this.boundaryWarning.x !== x + width / 2
      || this.boundaryWarning.y !== y + height / 2
    ) {
      this.boundaryWarning?.destroy();
      this.boundaryWarning = this.add.rectangle(x + width / 2, y + height / 2, width, height, 0xff0000, 0)
        .setScrollFactor(0).setDepth(44);
    }
    const margin = 200;
    const distToEdge = Math.min(
      this.player.x, this.player.y,
      GAME.WORLD_WIDTH - this.player.x,
      GAME.WORLD_HEIGHT - this.player.y
    );
    if (distToEdge < margin) {
      this.boundaryWarning.setAlpha(0.15 * (1 - distToEdge / margin));
    } else {
      this.boundaryWarning.setAlpha(0);
    }
  }

  // ── Dash Indicator ──

  private updateDashIndicator(): void {
    if (!this.dashIndicator) {
      this.dashIndicator = this.add.graphics().setDepth(10);
    }
    this.dashIndicator.clear();

    const frac = this.player.getDashCooldownFraction();
    if (frac <= 0) return; // Dash ready — no indicator

    // Draw a small arc under the player showing cooldown
    this.dashIndicator.lineStyle(2, 0xd4a017, 0.6);
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (1 - frac) * Math.PI * 2;
    this.dashIndicator.beginPath();
    this.dashIndicator.arc(this.player.x, this.player.y + 20, 8, startAngle, endAngle, false);
    this.dashIndicator.strokePath();
  }


  private tickBiome(): void {
    if (!this.biomeController) return;
    this.biomeController.tick(this.player, this.juice);
  }

  /**
   * Fire a single caption when the player first drops below 20% HP, then
   * re-arm once they recover above 40%. Avoids spamming the caption
   * strip while the player takes rapid-fire damage at low HP.
   */
  /**
   * Drive the ambient banter channel: biome changes + idle prompts + flush.
   *
   *  - biome_change fires the first time the player crosses into a new
   *    Voronoi region. Engine's rate-limit prevents chatter during rapid
   *    boundary-walking.
   *  - idle fires if nothing's spoken for ~90s; the priority-10 pool means
   *    any real event this frame (level, hp, boss) naturally outranks it.
   *  - flush() commits at most one line per frame.
   */
  private tickBanter(): void {
    if (!this.banter || !this.player) return;

    const biomeId = this.getCurrentBiomeId();
    if (biomeId && biomeId !== this.lastBiomeForBanter) {
      if (this.lastBiomeForBanter !== null) {
        this.banter.request('biome_change');
      }
      this.lastBiomeForBanter = biomeId;
    }

    // Idle prompt: throttled at the scene layer (not engine) so we don't
    // request it every frame. 90s between attempts means in active combat
    // it almost never wins the priority race — it's a lulls-only voice.
    const nowMs = this.time.now;
    if (nowMs - this.lastBanterFireMs > 90_000) {
      this.banter.request('idle');
      this.lastBanterFireMs = nowMs;
    }

    this.banter.flush();
  }

  private tickLowHpCaption(): void {
    if (!this.player) return;
    const frac = this.player.getHp() / Math.max(1, this.player.getMaxHp());
    if (this.lowHpCaptionArmed && frac > 0 && frac < 0.2) {
      this.caption('low_hp', t('ui.captions.low_hp'), '#ee5566');
      this.banter?.request('low_hp');
      this.lowHpCaptionArmed = false;
    } else if (!this.lowHpCaptionArmed && frac > 0.4) {
      // Player climbed back out of the danger band — hearth warmth.
      this.banter?.request('recover');
      this.lowHpCaptionArmed = true;
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

  private trackChestSprite(sprite: Phaser.GameObjects.Sprite, golden: boolean): void {
    this.activeChestSprites.push({ sprite, golden });
  }

  private untrackChestSprite(sprite: Phaser.GameObjects.Sprite): void {
    this.activeChestSprites = this.activeChestSprites.filter((entry) => entry.sprite !== sprite);
  }

  private getActiveChestMarkers(): Array<{ x: number; y: number; golden?: boolean }> {
    this.activeChestSprites = this.activeChestSprites.filter((entry) => entry.sprite.active);
    return this.activeChestSprites.map((entry) => ({
      x: entry.sprite.x,
      y: entry.sprite.y,
      golden: entry.golden,
    }));
  }
}
