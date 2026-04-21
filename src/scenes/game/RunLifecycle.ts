/**
 * RunLifecycle — owns the victory/death/revive state machine that used
 * to live in ~240 lines of GameScene: handlePlayerDeathOrRevive (one-shot
 * revival gate), handleVictory (ceremony + post-bell offer), the
 * post-bell ENTER key binding (install/uninstall + finalize), and
 * handlePlayerDeath (particle burst, endless-best save, fade, classified
 * death cause).
 *
 * Hooks surface is wide. Everything that genuinely affects the state
 * machine is exposed; one-shot data helpers (buildRunSummary,
 * buildGameOverPayload, transitionToGameOver) stay on GameScene because
 * they touch many scene fields and live near the scene's own lifecycle.
 */
import Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../../config';
import type { Player } from '../../entities/Player';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { XPSystem } from '../../systems/XPSystem';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { TimeManager } from '../../systems/TimeManager';
import type { SaveManager } from '../../core/SaveManager';
import type { DeathCauseTracker } from '../../systems/DeathCauseTracker';
import type { RunResult, RunSummary, RunHistoryContext } from '../../utils/save';
import type { GameOverPayload } from '../gameOverPayload';
import {
  recordPostBellBest, recordLastDeath, recordIronmoorBest,
  wipeIronmoorHistoryInPlace,
} from '../../utils/save';
import { audio } from '../../systems/AudioSystem';
import { musicEngine } from '../../systems/music/ProceduralMusicEngine';
import { tryCameraShake } from '../../utils/cameraShake';
import { classifyDeath } from '../../core/deathCauseClassifier';
import { t } from '../../core/i18n';

export interface RunLifecycleHooks {
  getPlayer(): Player;
  getSpawnSystem(): SpawnSystem;
  getXPSystem(): XPSystem;
  getJuice(): JuiceSystem;
  getTimeManager(): TimeManager;
  getSaveManager(): SaveManager;
  getDeathCauseTracker(): DeathCauseTracker;
  getSettingsManager(): ReturnType<typeof import('../../core/SettingsManager').getSettingsManager>;
  getCamera(): Phaser.Cameras.Scene2D.Camera;
  getUiViewport(): { x: number; y: number; width: number; height: number };

  // Mutable state accessors
  getVictoryPending(): boolean;
  setVictoryPending(v: boolean): void;
  getRevivalAvailable(): boolean;
  setRevivalAvailable(v: boolean): void;
  getVictoryFade(): Phaser.GameObjects.Rectangle | null;
  setVictoryFade(r: Phaser.GameObjects.Rectangle | null): void;
  getDeathFade(): Phaser.GameObjects.Rectangle | null;
  setDeathFade(r: Phaser.GameObjects.Rectangle | null): void;
  setVictoryResultTicker(ms: number | null, cb: (() => void) | null): void;
  setDeathResultTicker(ms: number | null, cb: (() => void) | null): void;
  setVictoryDeferMs(ms: number): void;

  // Scene callbacks
  armIFrames(durationMs: number): void;
  caption(id: string, message: string, tint?: string, durationMs?: number): void;
  buildRunSummary(victory: boolean): RunSummary;
  buildRunHistoryContext(): RunHistoryContext;
  buildGameOverPayload(
    mode: 'victory' | 'death',
    summary: RunSummary,
    runResult: RunResult,
    previousBests: ReturnType<SaveManager['getPersonalBests']>,
    deathCause?: ReturnType<typeof classifyDeath>,
  ): GameOverPayload;
  recordToHistory(summary: RunSummary, runResult: RunResult): void;
  recordRun(summary: RunSummary, context: RunHistoryContext): RunResult;
  transitionToGameOver(payload: GameOverPayload): void;

  /**
   * W2 Moor Road: fired after a boss kill that completes an act (act 1
   * after gordon, act 2 after tour_bus). Implementation lives on
   * GameScene — launches ActIntermissionScene unless skipped via
   * settings. Act 3 completion flows through the existing victory path
   * and does NOT route through this hook.
   */
  onActComplete(actN: 1 | 2): void;

  /**
   * W66 Ironmoor: true when the run was started (or resumed) in
   * single-life mode. Locked in at run start so a mid-run Settings
   * toggle can't retroactively enable Second Wind on a permadeath run
   * or silently drop it from the leaderboard.
   */
  isIronmoorRun(): boolean;
}

export class RunLifecycle {
  private postBell = false;
  private bellTimeSec = 0;
  private postBellOfferActive = false;
  private postBellKeyHandler?: (e: KeyboardEvent) => void;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly hooks: RunLifecycleHooks,
  ) {}

  /** Reset transient post-bell state on scene reuse. */
  reset(): void {
    this.postBell = false;
    this.bellTimeSec = 0;
    this.postBellOfferActive = false;
    this.uninstallPostBellKeyHandler();
  }

  isPostBell(): boolean { return this.postBell; }

  getSecondsPastBell(): number {
    if (!this.postBell) return 0;
    return Math.max(0, this.hooks.getSpawnSystem().getGameTimeSec() - this.bellTimeSec);
  }

  onPlayerHitZero(): void {
    if (this.hooks.getVictoryPending()) return;

    if (this.hooks.getRevivalAvailable()) {
      this.hooks.setRevivalAvailable(false);
      const player = this.hooks.getPlayer();
      player.heal(Math.ceil(player.getMaxHp() * 0.5));
      const juice = this.hooks.getJuice();
      juice.showToast(t('ui.game.second_wind'), '#44ddff');
      juice.flashWhite(300);
      tryCameraShake(this.hooks.getCamera(), 300, 0.015, this.hooks.getSettingsManager());
      player.setAlpha(0.5);
      this.hooks.armIFrames(2000);
    } else {
      this.handleDeath();
    }
  }

  handleVictory(): void {
    const xpSystem = this.hooks.getXPSystem();
    const timeManager = this.hooks.getTimeManager();
    if (xpSystem.hasPendingLevelUps() || timeManager.has('LEVEL_UP')) {
      this.hooks.setVictoryDeferMs(200);
      return;
    }
    this.hooks.setVictoryDeferMs(0);

    timeManager.request('RUN_END', { pausePhysics: true, timeScale: 0 });
    musicEngine.playResolution();

    const player = this.hooks.getPlayer();
    const juice = this.hooks.getJuice();
    juice.flashWhite(300);
    tryCameraShake(this.hooks.getCamera(), 800, 0.015, this.hooks.getSettingsManager());
    juice.bossDeathSpectacle(player.x, player.y);
    // Sparkle rain starts 500ms after spectacle — uses raw setTimeout
    // because RUN_END sets timeScale 0 (delayedCall would never fire).
    setTimeout(() => juice.victorySparkleRain(), 500);
    juice.showToast(t('ui.gameOver.victory_title'), COLORS_CSS.WHISKY_GOLD);
    this.hooks.caption('victory', t('ui.captions.victory_chorus'), '#ffe08a');
    juice.showToast(t('ui.gameOver.keep_going_offer'), '#ffdd88');
    this.postBellOfferActive = true;
    this.installPostBellKeyHandler();

    const previousBests = this.hooks.getSaveManager().getPersonalBests();
    const summary = this.hooks.buildRunSummary(true);
    const context = this.hooks.buildRunHistoryContext();
    const runResult = this.hooks.recordRun(summary, context);
    this.hooks.recordToHistory(summary, runResult);

    // W66 Ironmoor separate leaderboard: fastest Ironmoor-mode victory time.
    // Keeps single-life pride distinct from regular best-time. Best-effort
    // save — the run result is already persisted; we only supplement it.
    if (this.hooks.isIronmoorRun()) {
      recordIronmoorBest(Math.floor(summary.timeSurvivedSec));
    }

    const { x: uiX, y: uiY, width: uiW, height: uiH } = this.hooks.getUiViewport();
    this.hooks.getVictoryFade()?.destroy();
    const fade = this.scene.add.rectangle(
      uiX + uiW / 2, uiY + uiH / 2,
      uiW + 200, uiH + 200,
      COLORS.WHISKY_GOLD, 0,
    ).setScrollFactor(0).setDepth(500).setInteractive();
    this.hooks.setVictoryFade(fade);
    this.scene.tweens.add({
      targets: fade, alpha: 0.5,
      duration: 1100,
      ease: 'Sine.easeIn',
    });

    this.hooks.setVictoryResultTicker(1200, () => {
      if (this.postBell) {
        this.finalizePostBellEntry();
        return;
      }
      this.postBellOfferActive = false;
      this.uninstallPostBellKeyHandler();
      this.hooks.transitionToGameOver(
        this.hooks.buildGameOverPayload('victory', summary, runResult, previousBests),
      );
    });
  }

  private installPostBellKeyHandler(): void {
    if (this.postBellKeyHandler) return;
    this.postBellKeyHandler = (e: KeyboardEvent) => {
      if (!this.postBellOfferActive) return;
      if (e.key === 'Enter' || e.code === 'Enter') {
        e.preventDefault();
        this.postBell = true;
        this.bellTimeSec = this.hooks.getSpawnSystem().getGameTimeSec();
        this.postBellOfferActive = false;
        this.uninstallPostBellKeyHandler();
      }
    };
    window.addEventListener('keydown', this.postBellKeyHandler);
  }

  uninstallPostBellKeyHandler(): void {
    if (!this.postBellKeyHandler) return;
    window.removeEventListener('keydown', this.postBellKeyHandler);
    this.postBellKeyHandler = undefined;
  }

  private finalizePostBellEntry(): void {
    this.uninstallPostBellKeyHandler();
    this.hooks.getTimeManager().release('RUN_END');
    const fade = this.hooks.getVictoryFade();
    if (fade) {
      this.scene.tweens.add({
        targets: fade,
        alpha: 0,
        duration: 600,
        onComplete: () => {
          this.hooks.getVictoryFade()?.destroy();
          this.hooks.setVictoryFade(null);
        },
      });
    }
    this.hooks.setVictoryPending(false);
    this.hooks.setVictoryResultTicker(null, null);
    this.hooks.getJuice().showToast(t('ui.gameOver.post_bell_start'), '#ffaa44');
    musicEngine.playResolution();
  }

  private handleDeath(): void {
    const timeManager = this.hooks.getTimeManager();
    const player = this.hooks.getPlayer();
    const juice = this.hooks.getJuice();

    // Immediate audio — plays during slow-mo
    audio.playDeath();
    musicEngine.fadeOut(2000);

    // Brief cinematic slow-mo (300ms real time) before full freeze.
    // Uses TimeManager so existing slow-mo token logic (lowest-wins) is
    // respected. setTimeout gives wall-clock timing independent of timeScale.
    timeManager.request('DEATH_SLOWMO', { timeScale: 0.15 });

    const scene = this.scene;
    setTimeout(() => {
      // Guard: scene may have restarted during the 300ms window.
      if (!scene.sys.isActive()) return;

      // Hand control to TimeManager for the full freeze.
      timeManager.release('DEATH_SLOWMO');
      timeManager.request('RUN_END', { pausePhysics: true, timeScale: 0 });

      juice.flashRed(400);
      tryCameraShake(this.hooks.getCamera(), 500, 0.02, this.hooks.getSettingsManager());
      this.hooks.caption('death', t('ui.captions.death_fall'), '#cc8866');

      const px = player.x;
      const py = player.y;
      player.setActive(false);
      player.setVisible(false);

      const colors = [0x8b6914, 0x6b4e0a, COLORS.WHISKY_GOLD, COLORS.HP_RED];
      for (let i = 0; i < 20; i++) {
        const particle = scene.add.circle(
          px, py,
          Phaser.Math.Between(3, 7),
          Phaser.Utils.Array.GetRandom(colors) as number,
          0.9,
        );
        const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.5;
        const speed = 100 + Math.random() * 200;
        scene.tweens.add({
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

      const previousBests = this.hooks.getSaveManager().getPersonalBests();
      const summary = this.hooks.buildRunSummary(false);
      const context = this.hooks.buildRunHistoryContext();
      const runResult = this.hooks.recordRun(summary, context);
      this.hooks.recordToHistory(summary, runResult);

      if (this.postBell) {
        recordPostBellBest(Math.floor(this.getSecondsPastBell()));
        juice.showToast(t('ui.gameOver.post_bell_sendoff'), '#ffaa44');
      }

      // Ancestral Echo — persist death position so next run can spawn a
      // spectral haggis at the spot. Skipped for ironmoor runs (that mode
      // already has its own ceremony + chronicle-wipe on death).
      if (!this.hooks.isIronmoorRun()) {
        recordLastDeath(px, py);
      }

      // W66 Ironmoor chronicle wipe. Permadeath: when the player dies with
      // `ironmoorMode` on, every Ironmoor row in runHistory is cleared — the
      // new attempt starts from a blank chronicle. `bestIronmoorSeconds` is
      // the separate leaderboard and survives (it's the only artefact the
      // permadeath spares). Silent wipe with a toast so the player knows
      // what happened; showToast is a no-op if nothing changed.
      if (this.hooks.isIronmoorRun()) {
        if (wipeIronmoorHistoryInPlace()) {
          juice.showToast(t('ui.gameOver.ironmoor_wipe_toast'), '#b84a2a');
        }
      }

      const { x: duiX, y: duiY, width: duiW, height: duiH } = this.hooks.getUiViewport();
      this.hooks.getDeathFade()?.destroy();
      const deathFade = scene.add.rectangle(
        duiX + duiW / 2, duiY + duiH / 2,
        duiW + 200, duiH + 200,
        0x000000, 0,
      ).setScrollFactor(0).setDepth(500).setInteractive();
      this.hooks.setDeathFade(deathFade);
      scene.tweens.add({
        targets: deathFade, alpha: 0.85,
        duration: 1100,
        ease: 'Sine.easeIn',
      });

      const trackerSnap = this.hooks.getDeathCauseTracker().snapshot();
      const deathCause = classifyDeath({
        events: trackerSnap.events,
        lastHealthyAtSec: trackerSnap.lastHealthyAtSec,
        deathGameTimeSec: this.hooks.getSpawnSystem().getGameTimeSec(),
      });

      this.hooks.setDeathResultTicker(1200, () => {
        this.hooks.transitionToGameOver(
          this.hooks.buildGameOverPayload('death', summary, runResult, previousBests, deathCause),
        );
      });
    }, 300);
  }
}
