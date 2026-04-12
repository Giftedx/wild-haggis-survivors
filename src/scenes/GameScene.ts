import Phaser from 'phaser';
import { GAME, COLORS } from '../config';
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
import { buildCardPool, drawCards, PASSIVE_KEYS, UpgradeCard } from '../data/upgrades';
import { XP, PLAYER } from '../config';
import { recordRun, loadSave, RunResult, RunSummary } from '../utils/save';
import { audio } from '../systems/AudioSystem';
import { musicEngine, GameMusicState } from '../systems/music/ProceduralMusicEngine';
import { BOSSES } from '../data/enemies';
import { formatRunVariantLabel, getVariantByKey, VariantDef } from '../data/variants';
import { ISceneContext } from '../core/ISceneContext';
import { UpdateTickers, TickerHandle } from '../utils/UpdateTickers';
import { SubscriptionBag } from '../utils/SubscriptionBag';
import { DebugOverlay } from '../ui/DebugOverlay';
import { SaveManager, type IRunState } from '../core/SaveManager';
import { StatComposer } from '../core/StatComposer';
import { applyAudioFromUserSettings } from '../core/applyAudioFromSettings';
import { getSettingsManager } from '../core/SettingsManager';
import { getAnalyticsManager } from '../core/AnalyticsManager';
import { globalEventBus } from '../core/GlobalEventBus';
import { t } from '../core/i18n';
import { evolutionRecipeToUpgradeCard, findEligibleChestEvolution } from '../core/evolutionChest';
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
import { StatusFxPool } from '../systems/StatusFxPool';
import { TutorialSystem } from '../systems/TutorialSystem';
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
  private pauseElements: Phaser.GameObjects.GameObject[] = [];
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

  private lavaZones: { x: number; y: number; r: number; tickAccMs: number }[] = [];
  private healZones: { x: number; y: number; r: number; tickAccMs: number }[] = [];
  private readonly metaSaveManager = new SaveManager();
  private readonly settingsManager = getSettingsManager();
  private statusFxPool!: StatusFxPool;
  /** Pooled floating text for high-frequency combat/pickup feedback (armor, gold). */
  private floatTextPool: Phaser.GameObjects.Text[] = [];
  private readonly runStatsTracker = new RunStatsTracker();
  private pageHideBound?: () => void;
  private devKeydownHandler?: (e: KeyboardEvent) => void;
  private lastEmittedRunSecond = -1;
  private achievementUnsub: (() => void) | null = null;
  private bossEnrageUnsub: (() => void) | null = null;
  private readonly gameplaySessionGuard = createGameplaySessionGuard(() => {
    getAnalyticsManager().endGameplaySession();
  });

  constructor() {
    super({ key: 'Game' });
  }

  private getUiViewport(): { x: number; y: number; width: number; height: number; zoom: number } {
    const { x, y, width, height, zoom } = getCameraViewport(this);
    return { x, y, width, height, zoom };
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

  create(): void {
    const save = loadSave();

    const metaLoaded = this.metaSaveManager.load();
    const resumeRun = readPendingResumeRun(metaLoaded.activeRun);

    // Reset all state — Phaser reuses the scene instance on restart,
    // so field initializers only run once at construction
    this.iFrames = false;
    this.pauseElements = [];
    this.victoryPending = false;
    this.runId = {};
    this.iFrameGeneration = 0;
    this.chestDurationBonusMs = 0;
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
    this.hintHideHandle = null;
    this.lavaZones = [];
    this.healZones = [];
    this.lastEmittedRunSecond = -1;
    this.activeChestSprites = [];
    this.announcedEvolutionReady.clear();
    this.runStatsTracker.reset();

    // Destroy lazy-init visual overlays from prior run (they're stored in fields
    // that only init once at construction)
    this.dashIndicator?.destroy();
    this.dashIndicator = null;
    this.boundaryWarning?.destroy();
    this.boundaryWarning = null;
    this.subs = new SubscriptionBag();

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
    this.createHighlandTerrain();

    // Create the player (resume position) or world center
    const selectedVariant = resumeRun
      ? getVariantByKey(resumeRun.selectedVariantKey)
      : getVariantByKey(save.selectedVariant);
    this.activeVariant = selectedVariant;
    const metaSave = this.metaSaveManager.load();
    const composedStats = StatComposer.getPlayerStats(metaSave);
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

    // Spawn map hazard and healing zones
    this.spawnMapZones();

    // Systems
    this.statusFxPool = new StatusFxPool(this);
    this.spawnSystem = new SpawnSystem(this);
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
    this.applyVariantModifiers(selectedVariant);

    // Apply permanent upgrades from save data
    this.applyPermanentUpgrades();

    if (resumeRun) {
      this.applyResumeHydration(resumeRun);
    }

    // Upgrade card UI
    this.upgradeUI = new UpgradeCardsUI(this, (card) => this.applyUpgrade(card), this.updateTickers);
    this.upgradeUI.setRerollCallback(() => this.rerollUpgradeCards());

    // When an enemy is killed
    this.weaponSystem.events.on('enemyKilled', (x: number, y: number, xpValue: number, enemyKey: string, wasBoss: boolean, wasElite: boolean = false) => {
      // Kill streak XP bonus: +1% XP per combo count (capped at +50%)
      const comboXpBonus = Math.min(0.5, this.juice.getComboCount() * 0.01);
      this.xpSystem.spawnGem(x, y, Math.ceil(xpValue * this.player.getXpMultiplier() * (1 + comboXpBonus)));
      this.killCount++;
      this.juice.showKillBurst(x, y);
      this.juice.hitFreeze();
      this.getSFXManager().tryPlay('kill', () => audio.playKillImmediate());

      // Lifesteal — heal on kill
      if (this.player.getLifesteal() > 0) {
        this.player.heal(this.player.getLifesteal());
      }

      // Kill milestones — celebrate and reward gold
      if ([100, 250, 500, 1000, 2500, 5000].includes(this.killCount)) {
        const goldReward = Math.floor(this.killCount / 50);
        this.coinGoldEarned += goldReward;
        this.juice.showToast(t('ui.game.kill_milestone', { count: this.killCount, gold: goldReward }), '#ffdd00');
        this.juice.flashWhite(150);
        audio.playLevelUp();
      }

      // Death ripple — push nearby enemies away from the kill (max 6).
      // Uses applyKnockback so the push actually persists past the next
      // behavior-chase velocity reset.
      const enemies = this.spawnSystem.getEnemyGroup().children.entries as Enemy[];
      let pushed = 0;
      for (let i = 0; i < enemies.length && pushed < 6; i++) {
        const e = enemies[i];
        if (!e.active) continue;
        const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
        if (d < 50 && d > 0) {
          const angle = Phaser.Math.Angle.Between(x, y, e.x, e.y);
          const body = e.body as Phaser.Physics.Arcade.Body;
          const force = 120 / body.mass;
          e.applyKnockback(Math.cos(angle) * force, Math.sin(angle) * force, 120);
          pushed++;
        }
      }

      // 5% chance to drop a health orb on kill (bosses always drop)
      if (wasBoss || Math.random() < 0.05) {
        this.spawnHealthOrb(x, y, wasBoss ? 25 : 5);
      }

      // 2% chance to drop gold coins (elites 10%, bosses always)
      const goldChance = wasBoss ? 1 : (wasElite ? 0.10 : 0.02);
      if (Math.random() < goldChance) {
        this.spawnGoldCoin(x, y, wasBoss ? Phaser.Math.Between(5, 15) : Phaser.Math.Between(1, 3));
      }

      if (wasBoss) {
        this.bossKillCount++;
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
            this.handleVictory();
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
      this.onLevelUp(newLevel);
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
      // 20% chance of golden chest (gold reward instead of heal)
      const golden = Math.random() < 0.2;
      if (this.timeManager.isGameplayPaused()) {
        this.pendingChests.push({ golden });
      } else if (golden) {
        this.spawnGoldenChest();
      } else {
        this.spawnTreasure();
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

    this.tickMapZones(scaledDelta);
    this.player.update(delta);
    this.player.tickRegen(delta);
    this.spawnSystem.update(delta, this.player.x, this.player.y);

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
    this.weaponSystem.update(delta, this.player.x, this.player.y);
    this.xpSystem.update(this.player.x, this.player.y, this.player.getPickupRadius(), this.player.getHp() / this.player.getMaxHp());
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

  private onLevelUp(newLevel: number): void {
    this.tutorialSystem.notifyFirstLevelReached(newLevel);
    // Vacuum all XP gems + audio fanfare
    this.xpSystem.vacuumAllGems();
    audio.playLevelUp();
    this.juice.flashWhite();
    this.juice.hideCombo();

    // Brief level-up banner
    const { x, y, width } = this.getUiViewport();
    const banner = this.add.text(x + width / 2, y + 140, t('ui.game.level_banner', { level: newLevel }), {
      fontFamily: 'monospace', fontSize: '36px', color: '#d4a017',
      fontStyle: 'bold', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(199).setAlpha(0).setScale(0.5);
    this.tweens.add({
      targets: banner, alpha: 1, scale: 1.1, duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: banner, alpha: 0, scale: 1.3, duration: 400, delay: 200, onComplete: () => banner.destroy() });
      },
    });

    this.timeManager.request('LEVEL_UP', { pausePhysics: true, timeScale: 0 });
    this.player.onLevelUp(newLevel);

    // Leveling up heals 10% max HP — a small reward that helps sustain longer runs
    this.player.heal(Math.ceil(this.player.getMaxHp() * 0.10));

    // Milestone damage pulse at levels 10, 20, 30 — screen-clearing celebration
    if ([10, 20, 30].includes(newLevel)) {
      const dmg = newLevel * 3; // 30/60/90 damage
      const radius = 300 + newLevel * 10;
      const enemies = this.spawnSystem.getEnemyGroup().children.entries as Enemy[];
      for (const e of enemies) {
        if (!e.active || e.isBoss()) continue;
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
        if (d <= radius) e.takeDamageWithKillEvents(dmg);
      }
      this.juice.flashWhite(400);
      this.juice.showToast(t('ui.game.level_power_surge', { level: newLevel }), '#ff8800');
      const ring = this.statusFxPool.acquireArc(this.player.x, this.player.y, 20, 0xffaa44, 0.5);
      this.tweens.add({ targets: ring, radius, alpha: 0, duration: 600, onComplete: () => { ring.setVisible(false); } });
    }

    // Build the card pool based on current state
    const ownedWeapons = this.weaponSystem.getWeapons().map(w => w.config.key);
    const weaponLevels: Record<string, number> = {};
    for (const w of this.weaponSystem.getWeapons()) {
      weaponLevels[w.config.key] = w.level;
    }

    let pool = buildCardPool(ownedWeapons, this.ownedPassives, weaponLevels, this.evolvedWeapons);

    // Filter out heal card when at full HP — don't waste a card slot
    if (this.player.getHp() >= this.player.getMaxHp()) {
      pool = pool.filter(c => !(c.effect.type === 'stat_boost' && (c.effect.stat === 'heal' || c.effect.stat === 'healPercent')));
    }

    // Luck bonus from Sporran passive + Lucky Heather permanent upgrade
    const save = loadSave();
    let luckBonus = 0;
    if (this.ownedPassives.includes('sporran')) luckBonus += 15;
    luckBonus += (save.upgrades['lucky_heather'] ?? 0) * 10;

    const extraChoice = (save.upgrades['extra_choice'] ?? 0) > 0;
    const cardCount = extraChoice ? XP.CARDS_PER_LEVEL + 1 : XP.CARDS_PER_LEVEL;
    const cards = drawCards(pool, cardCount, luckBonus);

    const evoRecipe = findEligibleChestEvolution(
      ownedWeapons,
      this.ownedPassives,
      weaponLevels,
      this.evolvedWeapons
    );
    if (evoRecipe && !this.announcedEvolutionReady.has(evoRecipe.baseWeapon)) {
      this.announcedEvolutionReady.add(evoRecipe.baseWeapon);
      const evoCard = evolutionRecipeToUpgradeCard(evoRecipe);
      this.juice.showToast(t('ui.game.evolution_primed', { name: t(evoCard.name) }), '#ffcc44');
    }

    // Safety valve: if the pool somehow resolves to zero cards (all weapons
    // maxed + all passives owned + all evolved + heal filter hit), don't
    // freeze the game on an empty card screen. Auto-resume and show a toast.
    if (cards.length === 0) {
      this.juice.showToast(t('ui.game.level_up_fallback'), '#ffdd00');
      this.timeManager.release('LEVEL_UP');
      this.xpSystem.processNextLevelUp();
      return;
    }

    this.upgradeUI.grantReroll();
    this.upgradeUI.show(cards, newLevel);
  }

  /** Reroll the upgrade cards — draws fresh cards from the same pool */
  private rerollUpgradeCards(): void {
    const level = this.xpSystem.getLevel();
    const ownedWeapons = this.weaponSystem.getWeapons().map(w => w.config.key);
    const weaponLevels: Record<string, number> = {};
    for (const w of this.weaponSystem.getWeapons()) {
      weaponLevels[w.config.key] = w.level;
    }

    let pool = buildCardPool(ownedWeapons, this.ownedPassives, weaponLevels, this.evolvedWeapons);
    if (this.player.getHp() >= this.player.getMaxHp()) {
      pool = pool.filter(c => !(c.effect.type === 'stat_boost' && (c.effect.stat === 'heal' || c.effect.stat === 'healPercent')));
    }

    const save = loadSave();
    let luckBonus = 0;
    if (this.ownedPassives.includes('sporran')) luckBonus += 15;
    luckBonus += (save.upgrades['lucky_heather'] ?? 0) * 10;

    const extraChoice = (save.upgrades['extra_choice'] ?? 0) > 0;
    const cardCount = extraChoice ? XP.CARDS_PER_LEVEL + 1 : XP.CARDS_PER_LEVEL;
    const cards = drawCards(pool, cardCount, luckBonus);

    this.upgradeUI.show(cards, level);
    audio.playClick();
  }

  private applyUpgrade(card: UpgradeCard): void {
    const effect = card.effect;
    const cardTitle = t(card.name);

    switch (effect.type) {
      case 'add_weapon':
        this.weaponSystem.addWeapon(effect.weaponKey);
        this.juice.showToast(t('ui.game.upgrade_new_weapon', { name: cardTitle }), '#44dd44');
        this.juice.flashWhite(200);
        // Celebration ring
        {
          const ring = this.statusFxPool.acquireArc(this.player.x, this.player.y, 10, 0x44dd44, 0.5);
          this.tweens.add({ targets: ring, radius: 80, alpha: 0, duration: 400, onComplete: () => { ring.setVisible(false); } });
        }
        break;

      case 'level_weapon':
        this.weaponSystem.levelUpWeapon(effect.weaponKey);
        this.juice.showToast(t('ui.game.upgrade_weapon_level', { name: cardTitle }), '#4488dd');
        break;

      case 'add_passive':
        this.ownedPassives.push(effect.passiveKey);
        this.applyPassiveEffect(effect.passiveKey);
        this.juice.showToast(t('ui.game.upgrade_add_passive', { name: cardTitle }), '#ddaa00');
        break;

      case 'stat_boost':
        this.applyStatBoost(effect.stat, effect.amount);
        this.juice.showToast(t('ui.game.upgrade_stat_boost', { name: cardTitle }), '#88ccff');
        break;

      case 'evolve_weapon':
        this.weaponSystem.evolveWeapon(effect.weaponKey, effect.evolutionKey);
        if (!this.evolvedWeapons.includes(effect.weaponKey)) {
          this.evolvedWeapons.push(effect.weaponKey);
        }
        this.announcedEvolutionReady.delete(effect.weaponKey);
        this.juice.showToast(t('ui.game.upgrade_evolve_weapon', { name: cardTitle }), '#ffaa00');
        this.juice.flashWhite(300);
        audio.playLevelUp();
        globalEventBus.emit('GLOBAL_WEAPON_EVOLVED', {
          weaponKey: effect.weaponKey,
          evolvedKey: effect.evolutionKey,
        });
        break;
    }

    // Check for queued level-ups before resuming
    if (this.xpSystem.hasPendingLevelUps()) {
      this.xpSystem.processNextLevelUp();
    } else {
      this.xpSystem.processNextLevelUp(); // Clears levelUpInProgress flag
      this.timeManager.release('LEVEL_UP');

      // Brief invincibility after level-up (1s grace period)
      this.player.setAlpha(0.7);
      this.armIFrames(1000);

      // Celebrate reaching max level
      if (this.xpSystem.getLevel() >= XP.MAX_LEVEL) {
        this.juice.showToast(t('ui.game.max_level_toast'), '#ffdd00');
      }

      // Spawn deferred treasure chests queued during pause
      this.drainPendingChests();
    }
  }

  private applyPassiveEffect(key: string): void {
    switch (key) {
      case 'tam_o_shanter':
        this.player.addSpeed(PLAYER.SPEED * 0.10);
        break;
      case 'kilt':
        this.player.addMaxHp(Math.ceil(PLAYER.MAX_HP * 0.15));
        break;
      case 'loch_water':
        // Rebalanced 25% → 40% pickup + small speed bonus so the passive
        // isn't strictly QoL with no combat value.
        this.player.addPickupRadius(PLAYER.PICKUP_RADIUS * 0.40);
        this.player.addSpeed(PLAYER.SPEED * 0.05);
        break;
      case 'sporran':
        // Luck card-rarity boost is handled by card pool weighting. Added
        // a +10% XP bonus so sporran has real power alongside its rare-card
        // nudging (was strictly a buff-your-draws stat, which is hard to
        // feel directly).
        this.player.addXpMultiplier(0.10);
        break;
      case 'whisky_flask':
        this.player.addAoeMultiplier(0.20);
        break;
      case 'irn_bru':
        // Rebalanced 20% → 15% attack speed. Was the dominant pick because
        // attack speed is a global DPS multiplier affecting every weapon.
        this.player.addAttackSpeedMultiplier(0.15);
        break;
      case 'thistle_crown':
        this.player.addCritChance(0.05);
        this.player.setThorns(3);
        break;
      case 'highland_shield':
        this.player.enableShield();
        break;
      case 'tartan_sash':
        this.player.addDamageMultiplier(0.08);
        break;
    }
  }

  private applyStatBoost(stat: string, amount: number): void {
    switch (stat) {
      case 'maxHp':
        this.player.addMaxHp(amount);
        break;
      case 'speed':
        this.player.addSpeed(PLAYER.SPEED * amount);
        break;
      case 'pickup':
        this.player.addPickupRadius(amount);
        break;
      case 'drift':
        this.player.reduceDrift(amount);
        break;
      case 'heal':
        this.player.heal(amount);
        break;
      case 'healPercent':
        this.player.heal(Math.ceil(this.player.getMaxHp() * amount));
        break;
      case 'damage':
        this.player.addDamageMultiplier(amount);
        break;
      case 'crit':
        this.player.addCritChance(amount);
        break;
      case 'regen':
        this.player.addHpRegen(amount);
        break;
      case 'armor':
        this.player.addArmor(amount);
        break;
      case 'cooldown':
        this.player.addCooldownReduction(amount);
        break;
      case 'xpMultiplier':
        this.player.addXpMultiplier(amount);
        break;
      case 'lifesteal':
        this.player.addLifesteal(amount);
        break;
      case 'projectileSpeed':
        this.player.addProjectileSpeedMul(amount);
        break;
      case 'knockback':
        this.player.addKnockbackMul(amount);
        break;
      case 'bossHeal':
        this.player.addBossHealFrac(amount);
        break;
      case 'banish': {
        // Instantly kill the N weakest enemies within 300px.
        // Use forceKill() to bypass wool armor on sheep and any DR mechanics.
        const BANISH_RANGE = 300;
        const px = this.player.x, py = this.player.y;
        const enemies = (this.spawnSystem.getEnemyGroup().children.entries as Enemy[])
          .filter(e => e.active && !e.isBoss() && e.getBehavior() !== 'hazard'
            && Phaser.Math.Distance.Between(px, py, e.x, e.y) <= BANISH_RANGE)
          .sort((a, b) => a.getHp() - b.getHp())
          .slice(0, amount);
        for (const e of enemies) {
          const enemyKey = e.getEnemyKey();
          const xpValue = e.getXpValue();
          const wasElite = e.isElite();
          this.juice.showKillBurst(e.x, e.y, 0xffffff);
          this.xpSystem.spawnGem(e.x, e.y, xpValue);
          this.killCount++;
          e.forceKill();
          globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
            enemyKey,
            xpValue,
            wasBoss: false,
            wasElite,
          });
        }
        this.juice.flashWhite(200);
        break;
      }
    }
  }

  /** Apply permanent upgrades purchased in the shop to this run */
  private applyPermanentUpgrades(): void {
    const save = loadSave();
    const ups = save.upgrades;

    const thickHide = ups['thick_hide'] ?? 0;
    if (thickHide > 0) this.player.addMaxHp(Math.ceil(this.player.getRunBaseMaxHp() * 0.05 * thickHide));

    const strongLegs = ups['strong_legs'] ?? 0;
    if (strongLegs > 0) this.player.addSpeed(this.player.getRunBaseSpeed() * 0.03 * strongLegs);

    const sharpThistles = ups['sharp_thistles'] ?? 0;
    if (sharpThistles > 0) this.player.addDamageMultiplier(0.05 * sharpThistles);

    const magneticPersonality = ups['magnetic_personality'] ?? 0;
    if (magneticPersonality > 0) this.player.addPickupRadius(this.player.getRunBasePickupRadius() * 0.10 * magneticPersonality);

    const driftControl = ups['drift_control'] ?? 0;
    for (let i = 0; i < driftControl; i++) this.player.reduceDrift(0.15);

    const battleHardened = ups['battle_hardened'] ?? 0;
    if (battleHardened > 0) this.player.addArmor(2 * battleHardened);

    const weaponTraining = ups['weapon_training'] ?? 0;
    for (let i = 0; i < weaponTraining; i++) this.weaponSystem.levelUpWeapon('thistle_shot');

    const critPower = ups['crit_power'] ?? 0;
    if (critPower > 0) {
      // v2: bumps crit chance (small flat) AND crit damage (big multiplicative),
      // so the stat matters even on a fresh run where crit rate is just 10%.
      this.player.addCritChance(0.03 * critPower);
      this.player.addCritDamageMultiplier(0.25 * critPower);
    }

    const xpBoost = ups['xp_boost'] ?? 0;
    if (xpBoost > 0) this.player.addXpMultiplier(0.08 * xpBoost);

    const naturalRecovery = ups['natural_recovery'] ?? 0;
    if (naturalRecovery > 0) this.player.addHpRegen(0.3 * naturalRecovery);

    const revival = ups['revival'] ?? 0;
    if (revival > 0) this.revivalAvailable = true;

    const luckyStart = ups['lucky_start'] ?? 0;
    if (luckyStart > 0) {
      const available = PASSIVE_KEYS.filter((k) => !this.ownedPassives.includes(k));
      if (available.length > 0) {
        const randomPassive = available[Math.floor(Math.random() * available.length)];
        this.ownedPassives.push(randomPassive);
        this.applyPassiveEffect(randomPassive);
      }
    }

    const doubleDash = ups['double_dash'] ?? 0;
    if (doubleDash > 0) this.player.addDashCharge();

    const treasureMagnet = ups['treasure_magnet'] ?? 0;
    if (treasureMagnet > 0) this.chestDurationBonusMs = 5000 * treasureMagnet;

    // extra_choice and lucky_heather affect the card system, not stats
  }

  /** Variant modifiers are applied before permanent upgrades so both layers stack cleanly. */
  private applyVariantModifiers(variant: VariantDef): void {
    const { modifiers } = variant;

    if (modifiers.moveSpeedPct) this.player.addSpeed(this.player.getRunBaseSpeed() * modifiers.moveSpeedPct);
    if (modifiers.maxHpFlat) this.player.addMaxHp(modifiers.maxHpFlat);
    if (modifiers.armorFlat) this.player.addArmor(modifiers.armorFlat);
    if (modifiers.pickupRadiusFlat) this.player.addPickupRadius(modifiers.pickupRadiusFlat);
    if (modifiers.xpMultiplierPct) this.player.addXpMultiplier(modifiers.xpMultiplierPct);
    if (modifiers.damagePct) this.player.addDamageMultiplier(modifiers.damagePct);
    if (modifiers.driftReductionPct) this.player.reduceDrift(modifiers.driftReductionPct);
    if (modifiers.cooldownReductionPct) this.player.addCooldownReduction(modifiers.cooldownReductionPct);
  }

  private armIFrames(durationMs: number): void {
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
      this.handleVictory();
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

  private toggleUiPause(): void {
    // Don't open the pause menu while a modal owns pause (level-up, countdown, end screen).
    if (this.timeManager.has('LEVEL_UP') || this.timeManager.has('COUNTDOWN') || this.timeManager.has('RUN_END')) return;
    // Tutorial overlays own input/time while FTUE prompts are visible.
    if (this.timeManager.has('TUTORIAL_MOVE') || this.timeManager.has('TUTORIAL_GEM')) return;

    if (this.timeManager.has('UI_PAUSE')) {
      // Resume
      this.timeManager.release('UI_PAUSE');
      for (const el of this.pauseElements) {
        if ('removeAllListeners' in el) {
          (el as Phaser.GameObjects.GameObject).removeAllListeners();
        }
        el.destroy();
      }
      this.pauseElements = [];
      // Spawn deferred treasure chests queued during pause
      this.drainPendingChests();
    } else {
      // Pause
      this.timeManager.request('UI_PAUSE', { pausePhysics: true, timeScale: 0 });

      const { x, y, width, height } = this.getUiViewport();
      const d = 250;

      this.pauseElements.push(
        this.add.rectangle(x + width / 2, y + height / 2, width, height, 0x000000, 0.8)
          .setScrollFactor(0).setDepth(d).setInteractive()
      );
      this.pauseElements.push(
        this.add.text(x + width / 2, y + height * 0.22, t('ui.pause.title'), {
          fontFamily: 'monospace', fontSize: '46px', color: '#ffffff',
          fontStyle: 'bold', stroke: '#000', strokeThickness: 5,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1)
      );

      // Run stats during pause
      const timeSec = this.spawnSystem.getGameTimeSec();
      const pMins = Math.floor(timeSec / 60);
      const pSecs = Math.floor(timeSec % 60);
      this.pauseElements.push(
        this.add.text(x + width / 2, y + height * 0.37, [
          t('ui.pause.time_line', { m: pMins, s: pSecs.toString().padStart(2, '0') }),
          t('ui.pause.stats_mid', { kills: this.killCount, level: this.xpSystem.getLevel() }),
          t('ui.pause.stats_loadout', {
            w: this.weaponSystem.getWeapons().length,
            c: this.ownedPassives.length,
          }),
        ].join('\n'), {
          fontFamily: 'monospace', fontSize: '14px', color: '#bbbbbb',
          align: 'center', lineSpacing: 6,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1)
      );

      // Resume button
      const resumeBtn = this.add.rectangle(x + width / 2, y + height * 0.5, 220, 50, 0x005eb8)
        .setScrollFactor(0).setDepth(d + 1).setInteractive({ useHandCursor: true });
      resumeBtn.on('pointerover', () => resumeBtn.setFillStyle(0x0077dd));
      resumeBtn.on('pointerout', () => resumeBtn.setFillStyle(0x005eb8));
      resumeBtn.on('pointerdown', () => this.toggleUiPause());
      this.pauseElements.push(resumeBtn);
      this.pauseElements.push(
        this.add.text(x + width / 2, y + height * 0.5, t('ui.pause.resume'), {
          fontFamily: 'monospace', fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
      );

      // Sound toggles — side by side
      const prefs = this.settingsManager.load();
      let sfxOn = prefs.sfxVolume > 0.001;
      const sfxLabel = (on: boolean) =>
        t('ui.loadout.sfx_toggle', { state: t(on ? 'ui.common.on' : 'ui.common.off') });
      const sfxText = this.add.text(x + width / 2 - 70, y + height * 0.59, sfxLabel(sfxOn), {
        fontFamily: 'monospace', fontSize: '16px', fontStyle: 'bold',
        color: sfxOn ? '#88cc88' : '#886666',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
        .setInteractive({ useHandCursor: true });
      sfxText.on('pointerdown', () => {
        sfxOn = !sfxOn;
        sfxText.setText(sfxLabel(sfxOn));
        sfxText.setColor(sfxOn ? '#88cc88' : '#886666');
        this.settingsManager.update((st) => ({ ...st, sfxVolume: sfxOn ? 1 : 0 }));
        applyAudioFromUserSettings(this.settingsManager.load());
      });
      this.pauseElements.push(sfxText);

      let musicOn = prefs.musicVolume > 0.001;
      const musicLabel = (on: boolean) =>
        t('ui.loadout.music_toggle', { state: t(on ? 'ui.common.on' : 'ui.common.off') });
      const musicText = this.add.text(x + width / 2 + 80, y + height * 0.59, musicLabel(musicOn), {
        fontFamily: 'monospace', fontSize: '16px', fontStyle: 'bold',
        color: musicOn ? '#88cc88' : '#886666',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
        .setInteractive({ useHandCursor: true });
      musicText.on('pointerdown', () => {
        musicOn = !musicOn;
        musicText.setText(musicLabel(musicOn));
        musicText.setColor(musicOn ? '#88cc88' : '#886666');
        this.settingsManager.update((st) => ({ ...st, musicVolume: musicOn ? 1 : 0 }));
        applyAudioFromUserSettings(this.settingsManager.load());
        if (musicOn && !musicEngine.isPlaying()) musicEngine.start();
      });
      this.pauseElements.push(musicText);

      // Passive items with descriptions — positioned so it always sits above
      // the Quit button (0.72). Uses a 2-column layout for >4 passives to
      // avoid vertical overflow on short screens.
      if (this.ownedPassives.length > 0) {
        const passivePauseLine = (k: string) => {
          const path = `ui.passive.pause_short.${k}`;
          const s = t(path);
          return s === path ? k : s;
        };
        const names = this.ownedPassives.map(passivePauseLine);
        let passiveList: string;
        if (names.length <= 4) {
          passiveList = names.join('\n');
        } else {
          // 2-column layout: pair each row
          const rows: string[] = [];
          for (let i = 0; i < names.length; i += 2) {
            rows.push(names[i] + (names[i + 1] ? '   •   ' + names[i + 1] : ''));
          }
          passiveList = rows.join('\n');
        }
        // Anchor above the Quit button (0.72) with some padding
        this.pauseElements.push(
          this.add.text(x + width / 2, y + height * 0.67, `${t('ui.pause.passives_heading')}\n${passiveList}`, {
            fontFamily: 'monospace', fontSize: '12px', color: '#ddaa00',
            align: 'center', lineSpacing: 3,
          }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(d + 1)
        );
      }

      // Quit button
      const quitBtn = this.add.rectangle(x + width / 2, y + height * 0.77, 220, 50, 0x444444)
        .setScrollFactor(0).setDepth(d + 1).setInteractive({ useHandCursor: true });
      quitBtn.on('pointerover', () => quitBtn.setFillStyle(0x555555));
      quitBtn.on('pointerout', () => quitBtn.setFillStyle(0x444444));
      quitBtn.on('pointerdown', () => this.abandonRunToMainMenu());
      this.pauseElements.push(quitBtn);
      this.pauseElements.push(
        this.add.text(x + width / 2, y + height * 0.77, t('ui.pause.quit'), {
          fontFamily: 'monospace', fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
      );
    }
  }

  private onPlayerHitEnemy(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    if (this.iFrames || this.timeManager.isGameplayPaused() || this.victoryPending || this.player.isDashInvincible()) return;

    const enemy = enemyObj as Enemy;
    if (!enemy.active) return;

    const incomingDmg = enemy.getDamage();
    const armor = this.player.getArmor();
    const dead = this.player.takeDamage(incomingDmg);

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

    if (dead) this.handlePlayerDeathOrRevive();
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

  private handlePlayerDeathOrRevive(): void {
    if (this.victoryPending) return;

    // Revival: respawn with 50% HP once per run
    if (this.revivalAvailable) {
      this.revivalAvailable = false;
      this.player.heal(Math.ceil(this.player.getMaxHp() * 0.5));
      this.juice.showToast(t('ui.game.second_wind'), '#44ddff');
      this.juice.flashWhite(300);
      tryCameraShake(this.cameras.main, 300, 0.015, this.settingsManager);
      this.player.setAlpha(0.5);
      this.armIFrames(2000);
    } else {
      this.handlePlayerDeath();
    }
  }

  private handleVictory(): void {
    // Defer if level-up screen is showing — poll on raw frame delta (works at timeScale 0)
    if (this.xpSystem.hasPendingLevelUps() || this.timeManager.has('LEVEL_UP')) {
      this.victoryDeferMs = 200;
      return;
    }
    this.victoryDeferMs = 0;

    this.timeManager.request('RUN_END', { pausePhysics: true, timeScale: 0 });
    musicEngine.playResolution();

    const summary = this.buildRunSummary(true);
    const runResult = recordRun(summary);
    this.transitionToGameOver(this.buildGameOverPayload('victory', summary, runResult));
  }

  private handlePlayerDeath(): void {
    this.timeManager.request('RUN_END', { pausePhysics: true, timeScale: 0 });
    audio.playDeath();
    musicEngine.fadeOut(2000);
    this.juice.flashRed(400);
    tryCameraShake(this.cameras.main, 500, 0.02, this.settingsManager);

    // Death particle burst — the haggis explodes
    const px = this.player.x;
    const py = this.player.y;
    this.player.setActive(false);
    this.player.setVisible(false);

    const colors = [0x8b6914, 0x6b4e0a, 0xd4a017, 0xcc3333];
    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(
        px, py,
        Phaser.Math.Between(3, 7),
        Phaser.Utils.Array.GetRandom(colors) as number,
        0.9
      );
      const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 100 + Math.random() * 200;
      this.tweens.add({
        targets: particle,
        x: px + Math.cos(angle) * speed,
        y: py + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 600 + Math.random() * 400,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }

    const summary = this.buildRunSummary(false);
    const runResult = recordRun(summary);

    this.deathResultRemainingMs = 1200;
    this.deathResultCallback = () => {
      this.transitionToGameOver(this.buildGameOverPayload('death', summary, runResult));
    };
  }

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
      this.applyPassiveEffect(p);
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

  private buildGameOverPayload(
    mode: 'victory' | 'death',
    summary: RunSummary,
    runResult: RunResult
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

  // ── Treasure Chests ──

  /** If a weapon is maxed with its synergy passive, next chest opens a forced evolution pick. */
  private offerTreasureEvolutionIfEligible(): void {
    const ownedWeapons = this.weaponSystem.getWeapons().map((w) => w.config.key);
    const weaponLevels: Record<string, number> = {};
    for (const w of this.weaponSystem.getWeapons()) {
      weaponLevels[w.config.key] = w.level;
    }
    const recipe = findEligibleChestEvolution(
      ownedWeapons,
      this.ownedPassives,
      weaponLevels,
      this.evolvedWeapons
    );
    if (!recipe) return;
    this.timeManager.request('LEVEL_UP', { pausePhysics: true, timeScale: 0 });
    const card = evolutionRecipeToUpgradeCard(recipe);
    this.upgradeUI.show([card], this.xpSystem.getLevel(), {
      bannerTitle: t('ui.upgradeCards.chest_evolution_title'),
      bannerSubtitle: t('ui.upgradeCards.chest_evolution_sub'),
      hideReroll: true,
    });
  }

  /** Drain all chests queued while the game was paused. */
  private drainPendingChests(): void {
    while (this.pendingChests.length > 0) {
      const chest = this.pendingChests.shift()!;
      if (chest.golden) this.spawnGoldenChest();
      else this.spawnTreasure();
    }
  }

  private spawnTreasure(): void {
    // Spawn near the player but not on top of them
    const angle = Math.random() * Math.PI * 2;
    const dist = 150 + Math.random() * 200;
    const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 50, GAME.WORLD_WIDTH - 50);
    const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 50, GAME.WORLD_HEIGHT - 50);

    this.juice.showToast(t('ui.game.treasure_nearby'), '#ffcc44');

    // Create a glowing chest with sprite
    const chest = this.add.sprite(x, y, 'chest').setDepth(5).setScale(1.5);
    this.trackChestSprite(chest, false);
    const glow = this.add.circle(x, y, 18, COLORS.WHISKY_GOLD, 0.2).setDepth(4);

    // Pulsing glow animation
    this.tweens.add({
      targets: glow,
      scale: { from: 1, to: 1.5 },
      alpha: { from: 0.3, to: 0 },
      duration: 800,
      repeat: -1,
    });

    // Floating bob animation
    this.tweens.add({
      targets: chest,
      y: y - 4,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Enable physics for overlap detection
    this.physics.add.existing(chest, true);
    let collected = false;
    let despawnHandle: TickerHandle | null = null;

    // Collect on overlap with player
    const overlapColl = this.physics.add.overlap(this.player, chest, () => {
      if (collected) return;
      collected = true;
      despawnHandle?.cancel();

      this.player.heal(Math.ceil(this.player.getMaxHp() * 0.25));
      for (let i = 0; i < 8; i++) {
        this.xpSystem.spawnGem(
          x + Phaser.Math.Between(-20, 20),
          y + Phaser.Math.Between(-20, 20),
          3
        );
      }

      this.juice.flashWhite(100);
      this.juice.showToast(t('ui.game.treasure_collected'), '#ffcc44');
      audio.playLevelUp();

      this.tweens.killTweensOf(glow);
      this.untrackChestSprite(chest);
      chest.destroy();
      glow.destroy();
      this.physics.world.removeCollider(overlapColl);
      this.offerTreasureEvolutionIfEligible();
    });

    despawnHandle = this.updateTickers.addOnce('scaled', 15000 + this.chestDurationBonusMs, () => {
      if (collected) return;
      collected = true;
      this.tweens.killTweensOf(glow);
      this.tweens.add({
        targets: [chest, glow],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          this.untrackChestSprite(chest);
          chest.destroy();
          glow.destroy();
          this.physics.world.removeCollider(overlapColl);
        },
      });
    });
    this.pickupDespawnHandles.push(despawnHandle);
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

  // ── Golden Chest ──

  private spawnGoldenChest(): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = 150 + Math.random() * 200;
    const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 50, GAME.WORLD_WIDTH - 50);
    const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 50, GAME.WORLD_HEIGHT - 50);

    this.juice.showToast(t('ui.game.golden_nearby'), '#ffaa00');

    const chest = this.add.sprite(x, y, 'chest').setDepth(5).setScale(1.5).setTint(0xffdd44);
    this.trackChestSprite(chest, true);
    const glow = this.add.circle(x, y, 22, 0xffdd44, 0.3).setDepth(4);

    this.tweens.add({ targets: glow, scale: { from: 1, to: 1.6 }, alpha: { from: 0.3, to: 0 }, duration: 700, repeat: -1 });
    this.tweens.add({ targets: chest, y: y - 4, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.physics.add.existing(chest, true);
    let collected = false;
    let despawnHandle: TickerHandle | null = null;

    const overlapColl = this.physics.add.overlap(this.player, chest, () => {
      if (collected) return;
      collected = true;
      despawnHandle?.cancel();
      const goldReward = Phaser.Math.Between(5, 15);
      this.coinGoldEarned += goldReward;
      this.juice.showToast(t('ui.game.golden_collected', { gold: goldReward }), '#ffaa00');
      this.juice.flashWhite(150);
      audio.playLevelUp();
      this.tweens.killTweensOf(glow); this.tweens.killTweensOf(chest);
      this.untrackChestSprite(chest);
      chest.destroy(); glow.destroy();
      this.physics.world.removeCollider(overlapColl);
      this.offerTreasureEvolutionIfEligible();
    });

    despawnHandle = this.updateTickers.addOnce('scaled', 12000 + this.chestDurationBonusMs, () => {
      if (collected) return;
      collected = true;
      this.tweens.killTweensOf(glow);
      this.tweens.killTweensOf(chest);
      this.tweens.add({
        targets: [chest, glow], alpha: 0, duration: 400, onComplete: () => {
          this.untrackChestSprite(chest);
          chest.destroy();
          glow.destroy();
          this.physics.world.removeCollider(overlapColl);
        },
      });
    });
    this.pickupDespawnHandles.push(despawnHandle);
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

  // ── Gold Coins ──

  private spawnGoldCoin(x: number, y: number, goldAmount: number): void {
    const coin = this.add.circle(x, y, 5, COLORS.WHISKY_GOLD, 1).setDepth(5);

    // Spinning effect
    this.tweens.add({
      targets: coin,
      scaleX: { from: 1, to: 0.3 },
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    this.physics.add.existing(coin, true);
    let collected = false;
    let despawnHandle: TickerHandle | null = null;

    const overlapColl = this.physics.add.overlap(this.player, coin, () => {
      if (collected) return;
      collected = true;
      despawnHandle?.cancel();
      this.coinGoldEarned += goldAmount;

      // Show gold pickup text
      const txt = this.acquireFloatText(
        coin.x, coin.y - 12,
        t('ui.game.gold_pickup_float', { gold: goldAmount }),
        '#d4a017', '16px', 80,
      );
      if (txt) {
        this.tweens.add({ targets: txt, y: txt.y - 20, alpha: 0, duration: 600, onComplete: () => { txt.setVisible(false); } });
      }

      this.getSFXManager().tryPlay('xp_pickup', () => audio.playXPCollectImmediate());
      coin.destroy();
      this.physics.world.removeCollider(overlapColl);
    });

    despawnHandle = this.updateTickers.addOnce('scaled', 12000, () => {
      if (collected) return;
      collected = true;
      this.tweens.add({
        targets: coin, alpha: 0, duration: 400, onComplete: () => {
          coin.destroy();
          this.physics.world.removeCollider(overlapColl);
        },
      });
    });
    this.pickupDespawnHandles.push(despawnHandle);
  }

  // ── Health Orbs ──

  private spawnHealthOrb(x: number, y: number, healAmount: number): void {
    const orb = this.add.circle(x, y, 6, 0x44dd44, 0.9).setDepth(5);
    const glow = this.add.circle(x, y, 10, 0x44dd44, 0.3).setDepth(4);

    // Pulsing glow
    this.tweens.add({
      targets: glow,
      scale: { from: 1, to: 1.4 },
      alpha: { from: 0.3, to: 0 },
      duration: 600,
      repeat: -1,
    });

    this.physics.add.existing(orb, true);
    let collected = false;
    let despawnHandle: TickerHandle | null = null;

    const overlapColl = this.physics.add.overlap(this.player, orb, () => {
      if (collected) return;
      collected = true;
      despawnHandle?.cancel();
      this.player.heal(healAmount);
      this.juice.showDamageNumber(this.player.x, this.player.y - 20, healAmount, false);
      this.tweens.killTweensOf(glow);
      orb.destroy();
      glow.destroy();
      this.physics.world.removeCollider(overlapColl);
    });

    despawnHandle = this.updateTickers.addOnce('scaled', 10000, () => {
      if (collected) return;
      collected = true;
      this.tweens.killTweensOf(glow);
      this.tweens.add({
        targets: [orb, glow], alpha: 0, duration: 400,
        onComplete: () => {
          orb.destroy(); glow.destroy();
          this.physics.world.removeCollider(overlapColl);
        },
      });
    });
    this.pickupDespawnHandles.push(despawnHandle);
  }

  private tickMapZones(scaledDelta: number): void {
    if (scaledDelta <= 0) return;

    // Lava damage tick every 500ms
    for (const z of this.lavaZones) {
      z.tickAccMs += scaledDelta;
      while (z.tickAccMs >= 500) {
        z.tickAccMs -= 500;
        if (!this.player.active || this.victoryPending) continue;
        if (this.iFrames || this.player.isDashInvincible()) continue;
        const d = Phaser.Math.Distance.Between(z.x, z.y, this.player.x, this.player.y);
        if (d < z.r) {
          const dead = this.player.takeDamage(3);
          this.juice.flashRed(80);
          if (dead) this.handlePlayerDeathOrRevive();
        }
      }
    }

    // Healing tick every 1000ms
    for (const z of this.healZones) {
      z.tickAccMs += scaledDelta;
      while (z.tickAccMs >= 1000) {
        z.tickAccMs -= 1000;
        if (!this.player.active) continue;
        const d = Phaser.Math.Distance.Between(z.x, z.y, this.player.x, this.player.y);
        if (d < z.r) this.player.heal(2);
      }
    }
  }

  // ── Terrain ──

  private createHighlandTerrain(): void {
    // Parallax sky layer — scrolls at 10% of camera speed
    const skyGfx = this.add.graphics().setScrollFactor(0.1).setDepth(-10);
    const skyW = GAME.WORLD_WIDTH * 1.2;
    const skyH = GAME.WORLD_HEIGHT * 1.2;
    // Sky gradient (top = dark blue, bottom = lighter)
    skyGfx.fillGradientStyle(0x1a2a4a, 0x1a2a4a, 0x3a5a7a, 0x3a5a7a, 1);
    skyGfx.fillRect(-200, -200, skyW, skyH);

    // Parallax mountain silhouettes — scrolls at 30% of camera speed
    const mtGfx = this.add.graphics().setScrollFactor(0.3).setDepth(-5);
    const rngMt = new Phaser.Math.RandomDataGenerator(['mountains']);
    // Draw mountain ridge as a series of triangles
    mtGfx.fillStyle(0x2a3a4a, 0.5);
    for (let i = 0; i < 20; i++) {
      const mx = i * (skyW / 20) - 100;
      const mh = rngMt.between(80, 200);
      const mw = rngMt.between(150, 350);
      const baseY = GAME.WORLD_HEIGHT * 0.5;
      mtGfx.fillTriangle(mx, baseY, mx + mw / 2, baseY - mh, mx + mw, baseY);
    }
    // Closer, darker range
    mtGfx.fillStyle(0x1a2a3a, 0.4);
    for (let i = 0; i < 15; i++) {
      const mx = i * (skyW / 15) - 50;
      const mh = rngMt.between(50, 140);
      const mw = rngMt.between(200, 400);
      const baseY = GAME.WORLD_HEIGHT * 0.6;
      mtGfx.fillTriangle(mx, baseY, mx + mw / 2, baseY - mh, mx + mw, baseY);
    }

    // Depth stack:
    //  -10 sky, -5 mountains, -4 terrain graphics, -3 deco sprites,
    //  -2 entity shadows, 0+ entities & projectiles, HUD at 50+
    const gfx = this.add.graphics().setDepth(-4);
    const W = GAME.WORLD_WIDTH;
    const H = GAME.WORLD_HEIGHT;

    // Base grass with slight color variation
    gfx.fillStyle(COLORS.GRASS, 1);
    gfx.fillRect(0, 0, W, H);

    const rng = new Phaser.Math.RandomDataGenerator(['highlands']);

    // Darker grass patches for depth
    for (let i = 0; i < 40; i++) {
      const x = rng.between(0, W);
      const y = rng.between(0, H);
      gfx.fillStyle(0x1d4a17, rng.realInRange(0.1, 0.25));
      gfx.fillCircle(x, y, rng.between(40, 120));
    }

    // Heather patches (purple)
    for (let i = 0; i < 200; i++) {
      const x = rng.between(0, W);
      const y = rng.between(0, H);
      gfx.fillStyle(COLORS.HEATHER, rng.realInRange(0.15, 0.35));
      gfx.fillCircle(x, y, rng.between(8, 25));
    }

    // Stone patches
    for (let i = 0; i < 80; i++) {
      const x = rng.between(0, W);
      const y = rng.between(0, H);
      gfx.fillStyle(COLORS.STONE, rng.realInRange(0.2, 0.4));
      gfx.fillCircle(x, y, rng.between(4, 12));
    }

    // Standing stones — tall narrow rectangles scattered across the map
    for (let i = 0; i < 15; i++) {
      const x = rng.between(100, W - 100);
      const y = rng.between(100, H - 100);
      const w = rng.between(6, 12);
      const h = rng.between(20, 40);

      // Stone body
      gfx.fillStyle(0x666666, 0.6);
      gfx.fillRect(x - w / 2, y - h, w, h);
      // Shadow
      gfx.fillStyle(0x000000, 0.1);
      gfx.fillEllipse(x, y + 2, w + 6, 6);
    }

    // Dirt paths — faint winding lines
    for (let p = 0; p < 3; p++) {
      let px = rng.between(0, W);
      let py = rng.between(0, H);
      gfx.lineStyle(rng.between(8, 14), 0x5a4a30, 0.15);
      gfx.beginPath();
      gfx.moveTo(px, py);
      for (let s = 0; s < 20; s++) {
        px += rng.between(-80, 80);
        py += rng.between(50, 150);
        gfx.lineTo(px, py);
      }
      gfx.strokePath();
    }

    // World edge border
    gfx.lineStyle(4, 0x442200, 0.6);
    gfx.strokeRect(0, 0, W, H);

    // === Decorative terrain sprites scattered across the world ===
    // These are proper image sprites (drop shadows below entities already sit
    // at depth -1, so terrain sprites go at depth -2 to stay behind everything).
    const rngDeco = new Phaser.Math.RandomDataGenerator(['decorations']);
    // Thistle patches — 120 scattered
    for (let i = 0; i < 120; i++) {
      const x = rngDeco.between(60, W - 60);
      const y = rngDeco.between(60, H - 60);
      this.add.image(x, y, 'deco_thistle')
        .setDepth(-3)
        .setScale(rngDeco.realInRange(0.7, 1.2))
        .setAlpha(rngDeco.realInRange(0.7, 1.0));
    }
    // Rocks — 60 scattered
    for (let i = 0; i < 60; i++) {
      const x = rngDeco.between(60, W - 60);
      const y = rngDeco.between(60, H - 60);
      const rockKeys = ['deco_rock', 'deco_rock_2', 'deco_rock_3'];
      this.add.image(x, y, rockKeys[rngDeco.between(0, 2)])
        .setDepth(-3)
        .setScale(rngDeco.realInRange(0.6, 1.4))
        .setFlipX(rngDeco.frac() > 0.5)
        .setAlpha(rngDeco.realInRange(0.75, 1.0));
    }
    // Heather bushes — 80 scattered
    for (let i = 0; i < 80; i++) {
      const x = rngDeco.between(60, W - 60);
      const y = rngDeco.between(60, H - 60);
      this.add.image(x, y, 'deco_heather')
        .setDepth(-3)
        .setScale(rngDeco.realInRange(0.8, 1.3))
        .setAlpha(rngDeco.realInRange(0.75, 1.0));
    }

    // === Water/loch patches with animated shimmer ===
    for (let i = 0; i < 6; i++) {
      const wx = rng.between(200, W - 200);
      const wy = rng.between(200, H - 200);
      const wr = rng.between(30, 60);

      // Dark water base
      this.add.ellipse(wx, wy, wr * 2, wr * 1.2, 0x1a3a5a, 0.5).setDepth(-1);
      // Lighter shimmer overlay that pulses
      const shimmer = this.add.ellipse(wx - 5, wy - 3, wr * 1.4, wr * 0.8, 0x3a6a9a, 0.15).setDepth(-1);
      this.tweens.add({
        targets: shimmer,
        alpha: { from: 0.1, to: 0.25 },
        x: wx + 5,
        duration: 3000 + rng.between(0, 2000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      // Tiny highlight dot that drifts
      const glint = this.add.circle(wx + rng.between(-10, 10), wy - wr * 0.3, 2, 0x88bbdd, 0.3).setDepth(-1);
      this.tweens.add({
        targets: glint,
        x: glint.x + rng.between(-15, 15),
        alpha: { from: 0.15, to: 0.4 },
        duration: 2000 + rng.between(0, 1500),
        yoyo: true,
        repeat: -1,
      });
    }

    // === Ambient mist particles drifting across the playfield ===
    for (let i = 0; i < 20; i++) {
      const mx = rng.between(0, W);
      const my = rng.between(0, H);
      const mist = this.add.ellipse(mx, my,
        rng.between(40, 100), rng.between(20, 40),
        0xccddee, rng.realInRange(0.03, 0.08)
      ).setDepth(-3);

      // Slow drift
      this.tweens.add({
        targets: mist,
        x: mist.x + rng.between(-200, 200),
        y: mist.y + rng.between(-80, 80),
        alpha: { from: mist.alpha, to: mist.alpha * 0.3 },
        duration: rng.between(8000, 15000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /** Spawn map hazard and healing zones */
  private spawnMapZones(): void {
    const W = GAME.WORLD_WIDTH;
    const H = GAME.WORLD_HEIGHT;
    const rng = new Phaser.Math.RandomDataGenerator(['zones']);

    // 4 lava patches — deal damage to player standing in them
    for (let i = 0; i < 4; i++) {
      const lx = rng.between(200, W - 200);
      const ly = rng.between(200, H - 200);
      const lr = rng.between(35, 55);

      this.add.ellipse(lx, ly, lr * 2, lr * 1.5, 0xcc3300, 0.4).setDepth(-1);
      const lavaGlow = this.add.ellipse(lx, ly, lr * 1.6, lr * 1.2, 0xff6600, 0.2).setDepth(-1);
      this.tweens.add({
        targets: lavaGlow,
        alpha: { from: 0.15, to: 0.35 },
        scale: { from: 1, to: 1.1 },
        duration: 1500 + rng.between(0, 800),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });

      this.lavaZones.push({ x: lx, y: ly, r: lr, tickAccMs: 0 });
    }

    // 3 healing circles — slowly heal the player while standing in them
    for (let i = 0; i < 3; i++) {
      const hx = rng.between(200, W - 200);
      const hy = rng.between(200, H - 200);
      const hr = rng.between(30, 45);

      this.add.ellipse(hx, hy, hr * 2, hr * 1.5, 0x22aa44, 0.2).setDepth(-1);
      const healGlow = this.add.ellipse(hx, hy, hr * 1.4, hr * 1.0, 0x44dd66, 0.1).setDepth(-1);
      this.tweens.add({
        targets: healGlow,
        alpha: { from: 0.08, to: 0.2 },
        duration: 2000 + rng.between(0, 1000),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });

      this.healZones.push({ x: hx, y: hy, r: hr, tickAccMs: 0 });
    }
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
