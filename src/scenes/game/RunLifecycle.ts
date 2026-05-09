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
import * as Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../../config';
import type { Player } from '../../entities/Player';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { XPSystem } from '../../systems/XPSystem';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { TimeManager } from '../../systems/TimeManager';
import type { SaveManager } from '../../core/SaveManager';
import type { DeathCauseTracker } from '../../systems/DeathCauseTracker';
import type { BanterSystem } from '../../systems/BanterSystem';
import { judgeGrudge, type GrudgeLedgerState } from '../../entities/grudgeLedger';
import type { RunResult, RunSummary, RunHistoryContext } from '../../utils/save';
import type { GameOverPayload } from '../gameOverPayload';
import {
  recordPostBellBest, recordLastDeath, recordIronmoorBest, bumpFirstTimeEvent,
  flushBeastieKills, wipeIronmoorHistoryInPlace,
} from '../../utils/save';
import { audio } from '../../systems/AudioSystem';
import { musicEngine } from '../../systems/music/ProceduralMusicEngine';
import { tryCameraShake } from '../../utils/cameraShake';
import { classifyDeath } from '../../core/deathCauseClassifier';
import { t } from '../../core/i18n';
import {
  fireDailyFirstClearBanter,
  fireFirstNewVariantUnlockBanter,
} from './firstTimeBanters';

export interface RunLifecycleHooks {
  getPlayer(): Player;
  getSpawnSystem(): SpawnSystem;
  getXPSystem(): XPSystem;
  getJuice(): JuiceSystem;
  getTimeManager(): TimeManager;
  getSaveManager(): SaveManager;
  getDeathCauseTracker(): DeathCauseTracker;
  /**
   * B1 Phase 2 — Gran-voice banter fires on both run-end outcomes.
   * Null during very early scene boot (before BanterSystem constructs)
   * or headless tests; handlers must tolerate absence.
   */
  getBanter(): BanterSystem | null;
  /**
   * Taxman Grudge Ledger — silent finish buffer the weapon listener
   * appends to during the run. `handleVictory` reads + judges it to
   * fire a verdict-keyed line on the `taxman_grudge` banter pool.
   * Defeat path leaves it untouched: cause-aware `death_reflection`
   * keeps the headline when the player goes down, since the Taxman
   * never spoke (player didn't reach him).
   */
  getGrudgeLedger(): GrudgeLedgerState;
  getSettingsManager(): ReturnType<typeof import('../../core/SettingsManager').getSettingsManager>;
  getCamera(): Phaser.Cameras.Scene2D.Camera;
  getUiViewport(): { x: number; y: number; width: number; height: number };

  // Mutable state accessors
  getVictoryPending(): boolean;
  setVictoryPending(v: boolean): void;
  /**
   * T201 — invalidate any victory-delay ticker scheduled BEFORE this
   * call returns. Called at the top of `handleDeath` so a same-frame
   * race (player dies + taxman dies on the same frame; both schedule
   * tickers at distinct gens) can't transition the scene to a victory
   * ceremony after the death FX have already started. The boss-kill
   * branch in `EnemyKillHandler` captures the gen returned by
   * `nextVictoryDelayGen` and the ticker compares it against the
   * latest gen — bumping cancels.
   */
  invalidatePendingVictoryTicker(): void;
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

  /**
   * Daily Challenge mode: true when the run was launched as a daily
   * attempt. Used to gate the `daily_first_clear` first-time banter on
   * victory.
   */
  isDailyRun(): boolean;
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
    // Sparkle rain starts 500ms after spectacle — uses scheduleRealTime
    // because RUN_END sets timeScale 0 (delayedCall would never fire).
    // scheduleRealTime auto-cancels on scene reset (TimeManager.reset).
    timeManager.scheduleRealTime(500, () => juice.victorySparkleRain());
    juice.showToast(t('ui.gameOver.victory_title'), COLORS_CSS.WHISKY_GOLD);
    this.hooks.caption('victory', t('ui.captions.victory_chorus'), '#ffe08a');
    juice.showToast(t('ui.gameOver.keep_going_offer'), COLORS_CSS.TOAST_GOLD);
    // Taxman Grudge Ledger (DESIGN_IDEAS §1) — judge how the player
    // finished elites and bosses through the run, fire a verdict-keyed
    // line on the Taxman's pool. Priority 85 wins same-tick arbitration
    // over gran (28) below: the Taxman gets the closing word because
    // the run only reaches `handleVictory` by putting him in the ground.
    // Boss_warn (100) and the ironmoor first-time line (110) remain
    // higher; if either is also requested this tick, they take the
    // moment as before. The Burns address coda at +1500 ms is on
    // `forceLine` so it bypasses arbitration regardless.
    const grudgeVerdict = judgeGrudge(this.hooks.getGrudgeLedger());
    this.hooks.getBanter()?.request('taxman_grudge', { tag: grudgeVerdict });

    // B1 Phase 2 — Gran's proud-modest line after victory. Priority 28
    // yields to louder pools; fires cleanly here because RUN_END pauses
    // combat chatter and the keep-going-offer toast is already above it.
    this.hooks.getBanter()?.request('gran_commentary', { tag: 'run_end_victory' });

    // Burns Address coda (DESIGN_IDEAS §11). The run-long thread of
    // "Address to a Haggis" stanza fragments (haggis_moment a–h, fired
    // through rune-pulse triggers across the run) closes on the opener
    // — the welcome-toast every Burns Supper begins with. Spoken at
    // victory ceremony as the haggis IS the chieftain o' the puddin'-
    // race the address welcomes. forceLine bypasses cooldown so the
    // gran_commentary line above doesn't bury it; scheduleRealTime
    // because RUN_END set timeScale 0 (delayedCall would never fire).
    timeManager.scheduleRealTime(1500, () => {
      this.hooks.getBanter()?.forceLine(
        'ui.banter.burns_citation.haggis_moment.a',
        'hearth',
        'burns_citation',
      );
    });
    this.postBellOfferActive = true;
    this.installPostBellKeyHandler();

    const previousBests = this.hooks.getSaveManager().getPersonalBests();
    const summary = this.hooks.buildRunSummary(true);
    const context = this.hooks.buildRunHistoryContext();
    // C1 M2 Task 11 — persist the Almanac kill buffer before the run
    // summary is snapshotted to save. Subsequent save writes
    // (recordRun, recordIronmoorBest) preserve the discoveryLog field.
    flushBeastieKills();
    const runResult = this.hooks.recordRun(summary, context);
    this.hooks.recordToHistory(summary, runResult);

    // W66 Ironmoor separate leaderboard: fastest Ironmoor-mode victory time.
    // Keeps single-life pride distinct from regular best-time. Best-effort
    // save — the run result is already persisted; we only supplement it.
    if (this.hooks.isIronmoorRun()) {
      recordIronmoorBest(Math.floor(summary.timeSurvivedSec));
      // B1 Phase 3 Task 18 — reserved first-Ironmoor-victory line.
      // Fires once per save, ever. Priority 110 beats gran's
      // `run_end_victory` line requested above (28), so a milestone
      // Ironmoor clear gets its bespoke couplet instead of Gran's
      // generic warmth. Subsequent Ironmoor victories continue to
      // land the Gran line.
      if (bumpFirstTimeEvent('ironmoor_first_victory')) {
        this.hooks.getBanter()?.request('first_time', { tag: 'ironmoor_first_victory' });
      }
    }

    // B1 Phase 4 task 6 follow-up — wire the three deferred first_time
    // sub-pools authored alongside the variant + route + daily content.
    // Bumps every newly-unlocked variant id (so the per-save flag retires
    // even when multiple variants unlock in one run); the helper requests
    // banter for the first one only because the system renders one
    // pending request per tick. Daily-clear is single-shot. If both fire
    // in the same tick the banter system's same-context cooldown drops
    // the second; we accept that trade because (a) hitting the daily +
    // unlocking a variant on the same run is rare, and (b) the variant
    // line is the more event-defining of the two so it wins on register.
    fireFirstNewVariantUnlockBanter(
      runResult.newlyUnlockedVariants,
      bumpFirstTimeEvent,
      this.hooks.getBanter(),
    );
    fireDailyFirstClearBanter(
      this.hooks.isDailyRun(),
      bumpFirstTimeEvent,
      this.hooks.getBanter(),
    );

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
      musicEngine.fadeOut(600);
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

    // T201 — pre-empt same-frame "boss kill + player death" race. If a
    // taxman-kill on this frame scheduled a victory ticker, bumping the
    // delay-gen invalidates it (the ticker compares its captured gen
    // against the latest and no-ops on mismatch). `victoryPending` is
    // also forced false so any other consumer reading the flag during
    // the death cinematic sees the post-resolution truth.
    this.hooks.invalidatePendingVictoryTicker();
    this.hooks.setVictoryPending(false);

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
      // B1 Phase 2 Task 12 — Cause-tagged death reflection (pool priority
      // 75). Classify here so the tag reaches the banter pool at the same
      // tick as the toast surface — the tracker snapshot is frozen from
      // the moment `onPlayerHitZero` entered, so moving `classifyDeath`
      // up from the post-fade position doesn't change its inputs.
      // Replaces the Phase 1 `gran_commentary/run_end_defeat` trigger:
      // death_reflection is cause-aware + 30 lines and wins same-tick
      // arbitration over gran (28). Gran's defeat sub-pool stays
      // authored for future wiring (post-bell death, post-mortem pane).
      const trackerSnap = this.hooks.getDeathCauseTracker().snapshot();
      const deathCause = classifyDeath({
        events: trackerSnap.events,
        lastHealthyAtSec: trackerSnap.lastHealthyAtSec,
        deathGameTimeSec: this.hooks.getSpawnSystem().getGameTimeSec(),
      });
      this.hooks.getBanter()?.request('death_reflection', { tag: deathCause.tag });

      // Burns defeat coda — closes a death the way the address coda closes
      // a victory: with a Burns couplet ("Ae fond kiss…"; "wan moon setting").
      // Authored in burns_citation.defeat_lament; previously deferred because
      // death_reflection (priority 75) wins same-tick arbitration over
      // burns_citation (43). `forceLine` bypasses arbitration. Scheduled
      // +600 ms past the reflection toast so the cause-aware line lands
      // first and the Burns couplet follows as quiet final-word, comfortably
      // inside the 1100 ms fade window. scheduleRealTime because RUN_END
      // set timeScale 0 — delayedCall would never fire.
      timeManager.scheduleRealTime(600, () => {
        this.hooks.getBanter()?.forcePoolLine(
          [
            'ui.banter.burns_citation.defeat_lament.a',
            'ui.banter.burns_citation.defeat_lament.b',
          ],
          'hearth',
          'burns_citation',
          'defeat_lament',
        );
      });

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
      // C1 M2 Task 11 — persist buffered Almanac kills before run write.
      flushBeastieKills();
      const runResult = this.hooks.recordRun(summary, context);
      this.hooks.recordToHistory(summary, runResult);

      // B1 Phase 4 task 6 follow-up — defeat paths can still cross
      // stat-gated unlock thresholds (e.g. `total_gold_earned`,
      // `cursed_victories` if the run wasn't a victory but tipped a
      // separate counter). Mirror the victory-path call so the
      // first-time line gets its chance even on a death.
      fireFirstNewVariantUnlockBanter(
        runResult.newlyUnlockedVariants,
        bumpFirstTimeEvent,
        this.hooks.getBanter(),
      );

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

      this.hooks.setDeathResultTicker(1200, () => {
        this.hooks.transitionToGameOver(
          this.hooks.buildGameOverPayload('death', summary, runResult, previousBests, deathCause),
        );
      });
    }, 300);
  }
}
