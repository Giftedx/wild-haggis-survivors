import * as Phaser from 'phaser';
import { COLORS_CSS } from '../config';
import type { ISceneContext } from '../core/ISceneContext';
import { globalEventBus } from '../core/GlobalEventBus';
import { SaveManager } from '../core/SaveManager';
import { t } from '../core/i18n';
import { getCameraViewport } from '../ui/cameraViewport';
import type { EliteAffixId } from '../data/eliteAffixes';
import {
  TUTORIAL_TIP_CEILIDH_CHAIN,
  TUTORIAL_TIP_STANDING_STONES,
  TUTORIAL_TIP_ANCESTRAL_ECHO,
} from './tutorialTipPalettes';
import {
  DRIFT_PRACTICE_RADIUS_PX,
  driftPracticeMarkerFor,
  resolveDriftPracticeStep,
  shouldStartDriftPractice,
  type DriftPracticeOutcome,
} from './driftPractice';

const TOKEN_MOVE = 'TUTORIAL_MOVE';
const TOKEN_GEM = 'TUTORIAL_GEM';

type Phase = 'done' | 'move' | 'await_gem' | 'await_level';

/**
 * One-shot FTUE: movement tip -> first gem tip -> complete on first level-up (level 2).
 * Also handles the drift-mechanic hint (non-pausing, shown once on first run).
 */
export class TutorialSystem {
  private inputBlocker: Phaser.GameObjects.Rectangle | null = null;
  private phase: Phase = 'done';
  private readonly scene: Phaser.Scene & ISceneContext;
  private readonly metaSave: SaveManager;
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private bodyText: Phaser.GameObjects.Text | null = null;
  private highlight: Phaser.GameObjects.Arc | null = null;
  private gemHandler?: (gx: number, gy: number, value: number) => void;
  private keyDownHandler?: (e: KeyboardEvent) => void;
  private finishHandler?: () => void;

  // Drift tutorial state
  private driftBanner: Phaser.GameObjects.Text | null = null;
  private driftTimerHandle: import('../utils/UpdateTickers').TickerHandle | null = null;
  private driftScheduled: boolean = false;
  /** Drift micro-practice (post-FTUE) — marker the player navigates to. */
  private driftPracticeMarker: Phaser.GameObjects.Graphics | null = null;
  private driftPracticeMarkerPos: { x: number; y: number } | null = null;
  private driftPracticeStartMs: number = 0;
  private driftPracticeSkipRequested: boolean = false;
  private driftPracticeKeyHandler?: (e: KeyboardEvent) => void;
  private driftPracticePointerHandler?: () => void;
  private driftPracticeTickHandler?: () => void;

  /** First affixed elite — non-blocking banner (same family as drift hint). */
  private eliteAffixBanner: Phaser.GameObjects.Text | null = null;
  private eliteAffixDismissRef: Phaser.GameObjects.Text | null = null;
  private eliteAffixTimerHandle: import('../utils/UpdateTickers').TickerHandle | null = null;

  /** First moor moment — explains hearth beats (non-blocking banner). */
  private moorMomentBanner: Phaser.GameObjects.Text | null = null;
  private moorMomentDismissRef: Phaser.GameObjects.Text | null = null;
  private moorMomentTimerHandle: import('../utils/UpdateTickers').TickerHandle | null = null;

  /** Generic one-shot tip banners (ceilidh chain, standing stones, echoes). */
  private oneShotBanners: Phaser.GameObjects.Text[] = [];
  private oneShotTimerHandles: import('../utils/UpdateTickers').TickerHandle[] = [];

  /** True while a full-screen modal (pause / level-up / intermission) is up.
   *  Set via `setAmbientBannersVisible` — ambient banners (drift, elite,
   *  moor-moment, one-shots) hide while a modal is active so they don't
   *  bleed through the dim underlay (P1.1 / P1.2 / P1.12 fix). */
  private ambientBannersHidden: boolean = false;

  constructor(scene: Phaser.Scene & ISceneContext, metaSave: SaveManager) {
    this.scene = scene;
    this.metaSave = metaSave;
  }

  /** Toggle visibility of all ambient banners (drift, elite-affix, moor-moment,
   *  one-shot tips) for the duration of a full-screen modal. Called from
   *  JuiceSystem on modal edge. Idempotent — safe to call repeatedly. */
  setAmbientBannersVisible(visible: boolean): void {
    if (this.ambientBannersHidden === !visible) return;
    this.ambientBannersHidden = !visible;
    this.driftBanner?.setVisible(visible);
    this.driftPracticeMarker?.setVisible(visible);
    this.eliteAffixBanner?.setVisible(visible);
    this.moorMomentBanner?.setVisible(visible);
    for (const b of this.oneShotBanners) b.setVisible(visible);
  }

  private getUiViewport(): { x: number; y: number; width: number; height: number } {
    const { x, y, width, height } = getCameraViewport(this.scene);
    return { x, y, width, height };
  }

  dispose(): void {
    this.detachGemListener();
    this.detachKeyHandler();
    if (this.finishHandler) {
      this.scene.input.off('pointerdown', this.finishHandler);
      this.finishHandler = undefined;
    }
    this.clearVisuals();
    this.releaseTokens();
    this.phase = 'done';
    if (this.driftTimerHandle) {
      this.driftTimerHandle.cancel();
      this.driftTimerHandle = null;
    }
    if (this.driftBanner) {
      this.scene.tweens.killTweensOf(this.driftBanner);
      this.driftBanner.destroy();
      this.driftBanner = null;
    }
    if (this.dismissDriftBannerRef) {
      this.scene.tweens.killTweensOf(this.dismissDriftBannerRef);
      this.dismissDriftBannerRef.destroy();
      this.dismissDriftBannerRef = null;
    }
    if (this.driftPracticeMarker) {
      this.scene.tweens.killTweensOf(this.driftPracticeMarker);
      this.driftPracticeMarker.destroy();
      this.driftPracticeMarker = null;
    }
    this.driftPracticeMarkerPos = null;
    if (this.driftPracticeTickHandler) {
      this.scene.events.off('update', this.driftPracticeTickHandler);
      this.driftPracticeTickHandler = undefined;
    }
    if (this.driftPracticeKeyHandler && typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.driftPracticeKeyHandler);
      this.driftPracticeKeyHandler = undefined;
    }
    if (this.driftPracticePointerHandler) {
      this.scene.input.off('pointerdown', this.driftPracticePointerHandler);
      this.driftPracticePointerHandler = undefined;
    }
    if (this.eliteAffixTimerHandle) {
      this.eliteAffixTimerHandle.cancel();
      this.eliteAffixTimerHandle = null;
    }
    if (this.eliteAffixBanner) {
      this.scene.tweens.killTweensOf(this.eliteAffixBanner);
      this.eliteAffixBanner.destroy();
      this.eliteAffixBanner = null;
    }
    if (this.eliteAffixDismissRef) {
      this.scene.tweens.killTweensOf(this.eliteAffixDismissRef);
      this.eliteAffixDismissRef.destroy();
      this.eliteAffixDismissRef = null;
    }
    if (this.moorMomentTimerHandle) {
      this.moorMomentTimerHandle.cancel();
      this.moorMomentTimerHandle = null;
    }
    if (this.moorMomentBanner) {
      this.scene.tweens.killTweensOf(this.moorMomentBanner);
      this.moorMomentBanner.destroy();
      this.moorMomentBanner = null;
    }
    if (this.moorMomentDismissRef) {
      this.scene.tweens.killTweensOf(this.moorMomentDismissRef);
      this.moorMomentDismissRef.destroy();
      this.moorMomentDismissRef = null;
    }
    for (const h of this.oneShotTimerHandles) h.cancel();
    this.oneShotTimerHandles = [];
    for (const b of this.oneShotBanners) {
      this.scene.tweens.killTweensOf(b);
      b.destroy();
    }
    this.oneShotBanners = [];
  }

  startRunIfNeeded(opts?: { resumeRun?: boolean }): void {
    if (opts?.resumeRun) {
      this.phase = 'done';
      return;
    }
    if (this.metaSave.load().hasCompletedTutorial) {
      this.phase = 'done';
      // FTUE done — schedule drift hint if not yet seen
      this.scheduleDriftHintIfNeeded();
      return;
    }
    this.phase = 'move';
    this.openPausedOverlay(t('tutorial.move'), TOKEN_MOVE, () => {
      this.phase = 'await_gem';
      this.bindGemOnce();
    });
  }

  /** Call when the player reaches a new character level (first time is `newLevel === 2`). */
  notifyFirstLevelReached(newLevel: number): void {
    if (newLevel < 2) return;
    if (this.metaSave.load().hasCompletedTutorial) return;
    this.detachGemListener();
    this.detachKeyHandler();
    this.clearVisuals();
    this.releaseTokens();
    this.metaSave.update((cur) => ({ ...cur, hasCompletedTutorial: true }));
    globalEventBus.emit('TUTORIAL_COMPLETED', {});
    this.phase = 'done';
    // FTUE just completed — schedule drift hint
    this.scheduleDriftHintIfNeeded();
  }

  /**
   * Call when an elite receives its affix — shows a one-time banner with the
   * trait name (lifetime flag in meta save).
   */
  notifyEliteAffixIfFirst(affixId: EliteAffixId): void {
    if (this.metaSave.load().hasSeenEliteAffixTip) return;
    if (this.eliteAffixBanner) return;
    this.metaSave.update((cur) => ({ ...cur, hasSeenEliteAffixTip: true }));

    const traitName = t(`ui.elite_affix.${affixId}.name`);
    const msg = t('tutorial.elite_affix_first', { name: traitName });

    const { x, y, width } = this.getUiViewport();
    const bannerY = y + 110;
    const wrapW = Math.max(160, Math.min(420, width - 48));

    this.eliteAffixBanner = this.scene.add
      .text(x + width / 2, bannerY, msg, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#e8d4ff',
        fontStyle: 'bold',
        stroke: COLORS_CSS.BLACK,
        strokeThickness: 3,
        backgroundColor: '#1a1020cc',
        padding: { x: 12, y: 8 },
        wordWrap: { width: wrapW },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(92)
      .setAlpha(0)
      .setVisible(!this.ambientBannersHidden);

    this.scene.tweens.add({
      targets: this.eliteAffixBanner,
      alpha: 1,
      duration: 400,
      ease: 'Power2',
    });

    this.eliteAffixTimerHandle = this.scene.getUpdateTickers().addOnce('raw', 7000, () => {
      this.eliteAffixTimerHandle = null;
      this.dismissEliteAffixBanner();
    });
  }

  private dismissEliteAffixBanner(): void {
    if (!this.eliteAffixBanner) return;
    const banner = this.eliteAffixBanner;
    this.eliteAffixBanner = null;
    this.eliteAffixDismissRef = banner;
    this.scene.tweens.add({
      targets: banner,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        if (this.eliteAffixDismissRef === banner) this.eliteAffixDismissRef = null;
        banner.destroy();
      },
    });
  }

  /** First scheduled moor moment — one-shot explainer (amber banner, matches hearth tone). */
  notifyMoorMomentIfFirst(): void {
    if (this.metaSave.load().hasSeenMoorMomentTip) return;
    if (this.moorMomentBanner) return;
    this.metaSave.update((cur) => ({ ...cur, hasSeenMoorMomentTip: true }));

    const msg = t('tutorial.moor_moment_first');
    const { x, y, width } = this.getUiViewport();
    const bannerY = y + 142;
    const wrapW = Math.max(160, Math.min(420, width - 48));

    this.moorMomentBanner = this.scene.add
      .text(x + width / 2, bannerY, msg, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f0d4a8',
        fontStyle: 'bold',
        stroke: COLORS_CSS.BLACK,
        strokeThickness: 3,
        backgroundColor: '#2a1a08cc',
        padding: { x: 12, y: 8 },
        wordWrap: { width: wrapW },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(92)
      .setAlpha(0)
      .setVisible(!this.ambientBannersHidden);

    this.scene.tweens.add({
      targets: this.moorMomentBanner,
      alpha: 1,
      duration: 400,
      ease: 'Power2',
    });

    this.moorMomentTimerHandle = this.scene.getUpdateTickers().addOnce('raw', 7200, () => {
      this.moorMomentTimerHandle = null;
      this.dismissMoorMomentBanner();
    });
  }

  private dismissMoorMomentBanner(): void {
    if (!this.moorMomentBanner) return;
    const banner = this.moorMomentBanner;
    this.moorMomentBanner = null;
    this.moorMomentDismissRef = banner;
    this.scene.tweens.add({
      targets: banner,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        if (this.moorMomentDismissRef === banner) this.moorMomentDismissRef = null;
        banner.destroy();
      },
    });
  }

  // ── Generic one-shot banners for late-game mechanics ──────────────

  /**
   * First Ceilidh Chain pulse — players see the magnet snap and a tag
   * without context; this banner names the combo mechanic.
   */
  notifyCeilidhChainIfFirst(): void {
    if (this.metaSave.load().hasSeenCeilidhChainTip) return;
    this.metaSave.update((cur) => ({ ...cur, hasSeenCeilidhChainTip: true }));
    this.showOneShotTip(t('tutorial.ceilidh_chain_first'), {
      ...TUTORIAL_TIP_CEILIDH_CHAIN,
      topOffset: 174,
    });
  }

  /** First Standing Stones trinity — 5:00 boon pick. */
  notifyStandingStonesIfFirst(): void {
    if (this.metaSave.load().hasSeenStandingStonesTip) return;
    this.metaSave.update((cur) => ({ ...cur, hasSeenStandingStonesTip: true }));
    this.showOneShotTip(t('tutorial.standing_stones_first'), {
      ...TUTORIAL_TIP_STANDING_STONES,
      topOffset: 174,
    });
  }

  /** First Ancestral Echo — spectral haggis at last-death spot. */
  notifyAncestralEchoIfFirst(): void {
    if (this.metaSave.load().hasSeenAncestralEchoTip) return;
    this.metaSave.update((cur) => ({ ...cur, hasSeenAncestralEchoTip: true }));
    this.showOneShotTip(t('tutorial.ancestral_echo_first'), {
      ...TUTORIAL_TIP_ANCESTRAL_ECHO,
      topOffset: 174,
    });
  }

  private showOneShotTip(
    msg: string,
    opts: { textColor: string; bgColor: string; topOffset: number },
  ): void {
    const { x, y, width } = this.getUiViewport();
    const wrapW = Math.max(160, Math.min(420, width - 48));
    const banner = this.scene.add
      .text(x + width / 2, y + opts.topOffset, msg, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: opts.textColor,
        fontStyle: 'bold',
        stroke: COLORS_CSS.BLACK,
        strokeThickness: 3,
        backgroundColor: opts.bgColor,
        padding: { x: 12, y: 8 },
        wordWrap: { width: wrapW },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(92)
      .setAlpha(0)
      .setVisible(!this.ambientBannersHidden);
    this.oneShotBanners.push(banner);
    this.scene.tweens.add({ targets: banner, alpha: 1, duration: 400, ease: 'Power2' });

    const handle = this.scene.getUpdateTickers().addOnce('raw', 7000, () => {
      this.oneShotTimerHandles = this.oneShotTimerHandles.filter((h) => h !== handle);
      const idx = this.oneShotBanners.indexOf(banner);
      if (idx < 0) return;
      this.oneShotBanners.splice(idx, 1);
      this.scene.tweens.add({
        targets: banner,
        alpha: 0,
        duration: 400,
        onComplete: () => banner.destroy(),
      });
    });
    this.oneShotTimerHandles.push(handle);
  }

  // ── Drift micro-practice (non-pausing) ─────────────────────────────
  // T213/T214 — replaces the prior 6s passive drift hint with an active
  // practice: a marker spawns near the player; the player walks into it
  // (the haggis drift means a straight-line input curves clockwise so
  // the marker is offset to invite a curve). Resolves via the helpers in
  // `driftPractice.ts` — `complete` (player reached marker), `timeout`
  // (12s cap), or `skip` (Enter / Space / canvas tap).

  private scheduleDriftHintIfNeeded(): void {
    if (this.driftScheduled) return;
    const save = this.metaSave.load();
    if (!shouldStartDriftPractice({
      hasSeenDriftTutorial: save.hasSeenDriftTutorial,
    })) return;
    this.driftScheduled = true;
    // 3s after FTUE completes (or run start if FTUE already done) on the
    // RAW ticker so a level-up overlay's `timeScale: 0` doesn't stall it.
    this.driftTimerHandle = this.scene.getUpdateTickers().addOnce('raw', 3000, () => {
      this.driftTimerHandle = null;
      this.showDriftPractice();
    });
  }

  private showDriftPractice(): void {
    if (this.metaSave.load().hasSeenDriftTutorial) return;

    const player = this.scene.getPlayer();
    // driftSign default of 1 (clockwise) — the variant's `driftSignFlip`
    // would mirror the marker, but variant access is not on ISceneContext.
    // Anticlockwise variants get the marker on the same side as drift,
    // which still produces a teaching curve, just opposite-handed.
    const marker = driftPracticeMarkerFor(player.x, player.y, 1);
    this.driftPracticeMarkerPos = marker;

    const { x, y, width } = this.getUiViewport();
    const bannerY = y + 80;
    const wrapW = Math.max(160, Math.min(420, width - 48));

    // Banner — viewport-anchored, named so the e2e smoke can find it.
    this.driftBanner = this.scene.add.text(
      x + width / 2,
      bannerY,
      t('tutorial.drift_practice'),
      {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffe8a0',
        fontStyle: 'bold',
        stroke: COLORS_CSS.BLACK,
        strokeThickness: 3,
        backgroundColor: '#1a1020cc',
        padding: { x: 12, y: 8 },
        wordWrap: { width: wrapW },
        align: 'center',
      },
    )
      .setName('drift-practice-banner')
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(85)
      .setAlpha(0)
      .setVisible(!this.ambientBannersHidden);
    this.scene.tweens.add({
      targets: this.driftBanner, alpha: 1, duration: 400, ease: 'Power2',
    });

    // Marker — world-space ring with a soft fill so it reads as a target,
    // not just a line. Named so e2e + reflow smokes can find it.
    const gfx = this.scene.add.graphics()
      .setName('drift-practice-marker')
      .setDepth(55)
      .setAlpha(0);
    gfx.fillStyle(0xffd44a, 0.18);
    gfx.fillCircle(marker.x, marker.y, DRIFT_PRACTICE_RADIUS_PX);
    gfx.lineStyle(3, 0xffd44a, 0.95);
    gfx.strokeCircle(marker.x, marker.y, DRIFT_PRACTICE_RADIUS_PX);
    this.driftPracticeMarker = gfx;
    this.scene.tweens.add({
      targets: this.driftPracticeMarker, alpha: 1, duration: 400, ease: 'Power2',
    });

    this.driftPracticeStartMs = (typeof performance !== 'undefined'
      ? performance.now() : Date.now());
    this.driftPracticeSkipRequested = false;

    // Skip handlers — Enter / Space (keyboard) OR pointerdown anywhere
    // on the canvas (touch primary). Both set the same flag the tick
    // handler reads via `resolveDriftPracticeStep`.
    this.driftPracticeKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        this.driftPracticeSkipRequested = true;
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.driftPracticeKeyHandler);
    }
    this.driftPracticePointerHandler = () => {
      this.driftPracticeSkipRequested = true;
    };
    this.scene.input.on('pointerdown', this.driftPracticePointerHandler);

    // Tick handler — runs each scene update; reads distance + elapsed,
    // resolves outcome via the pure helper, dismisses on non-continue.
    this.driftPracticeTickHandler = () => {
      if (!this.driftPracticeMarker || !this.driftPracticeMarkerPos) return;
      const now = (typeof performance !== 'undefined'
        ? performance.now() : Date.now());
      const elapsedMs = now - this.driftPracticeStartMs;
      const playerNow = this.scene.getPlayer();
      const dx = playerNow.x - this.driftPracticeMarkerPos.x;
      const dy = playerNow.y - this.driftPracticeMarkerPos.y;
      const distanceToMarkerPx = Math.hypot(dx, dy);
      const outcome = resolveDriftPracticeStep({
        elapsedMs,
        distanceToMarkerPx,
        skipRequested: this.driftPracticeSkipRequested,
      });
      if (outcome !== 'continue') {
        this.dismissDriftPractice(outcome);
      }
    };
    this.scene.events.on('update', this.driftPracticeTickHandler);
  }

  private dismissDriftPractice(_outcome: DriftPracticeOutcome): void {
    // Persist seen so a subsequent run / scene reuse skips the practice.
    this.metaSave.update((cur) => ({ ...cur, hasSeenDriftTutorial: true }));

    if (this.driftPracticeTickHandler) {
      this.scene.events.off('update', this.driftPracticeTickHandler);
      this.driftPracticeTickHandler = undefined;
    }
    if (this.driftPracticeKeyHandler && typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.driftPracticeKeyHandler);
      this.driftPracticeKeyHandler = undefined;
    }
    if (this.driftPracticePointerHandler) {
      this.scene.input.off('pointerdown', this.driftPracticePointerHandler);
      this.driftPracticePointerHandler = undefined;
    }
    this.driftPracticeMarkerPos = null;

    if (this.driftBanner) {
      const banner = this.driftBanner;
      this.driftBanner = null;
      this.dismissDriftBannerRef = banner;
      this.scene.tweens.add({
        targets: banner, alpha: 0, duration: 400,
        onComplete: () => {
          if (this.dismissDriftBannerRef === banner) this.dismissDriftBannerRef = null;
          banner.destroy();
        },
      });
    }
    if (this.driftPracticeMarker) {
      const m = this.driftPracticeMarker;
      this.driftPracticeMarker = null;
      this.scene.tweens.add({
        targets: m, alpha: 0, duration: 400,
        onComplete: () => m.destroy(),
      });
    }
  }

  // Banner-fade-tween reference kept around so dispose() can kill an
  // in-flight tween if the scene tears down mid-fade (otherwise the
  // onComplete fires on a destroyed object).
  private dismissDriftBannerRef: Phaser.GameObjects.Text | null = null;

  // ── FTUE internals (unchanged) ────────────────────────────────────

  private releaseTokens(): void {
    const tm = this.scene.getTimeManager();
    tm.release(TOKEN_MOVE);
    tm.release(TOKEN_GEM);
  }

  private clearModal(): void {
    this.inputBlocker?.destroy();
    this.inputBlocker = null;
    this.overlay?.destroy();
    this.overlay = null;
    this.bodyText?.destroy();
    this.bodyText = null;
  }

  private clearVisuals(): void {
    this.highlight?.destroy();
    this.highlight = null;
    this.clearModal();
  }

  private detachKeyHandler(): void {
    if (this.keyDownHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.keyDownHandler);
    }
    this.keyDownHandler = undefined;
  }

  private detachGemListener(): void {
    if (!this.gemHandler) return;
    this.scene.getXPSystem().events.off('gemSpawned', this.gemHandler);
    this.gemHandler = undefined;
  }

  private bindGemOnce(): void {
    const xp = this.scene.getXPSystem();
    this.gemHandler = (gx: number, gy: number, _v: number) => {
      if (this.phase !== 'await_gem') return;
      this.gemHandler = undefined;
      this.pulseAt(gx, gy);
      this.openPausedOverlay(t('tutorial.gem'), TOKEN_GEM, () => {
        this.phase = 'await_level';
      });
    };
    xp.events.once('gemSpawned', this.gemHandler);
  }

  private pulseAt(wx: number, wy: number): void {
    const r = this.scene.add.circle(wx, wy, 28, 0xffee88, 0.35).setDepth(55);
    this.highlight = r;
    this.scene.tweens.add({
      targets: r,
      scale: 1.8,
      alpha: 0.15,
      duration: 700,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        if (this.highlight === r) this.highlight = null;
        r.destroy();
      },
    });
  }

  private openPausedOverlay(message: string, token: string, afterDismiss: () => void): void {
    this.releaseTokens();
    this.clearModal();
    // Detach any prior overlay's pointer-down `once` listener. clearModal()
    // destroys the visual objects but leaves the scene input listener
    // pending until it fires — opening a second overlay while the first is
    // still armed would cause both `finish` closures to run on the next
    // click, each calling its own afterDismiss and leaving dangling state.
    if (this.finishHandler) {
      this.scene.input.off('pointerdown', this.finishHandler);
      this.finishHandler = undefined;
    }
    this.scene.getTimeManager().request(token, { pausePhysics: true, timeScale: 0 });

    const { x, y, width, height } = this.getUiViewport();
    const pad = 28;
    this.inputBlocker = this.scene.add
      .rectangle(x + width / 2, y + height / 2, width, height, 0x000000, 0)
      .setScrollFactor(0)
      .setDepth(599)
      .setInteractive();
    this.overlay = this.scene.add
      .rectangle(x + width / 2, y + height / 2, width - pad * 2, 120, 0x0a1020, 0.94)
      .setStrokeStyle(2, 0x5a7ab8, 1)
      .setScrollFactor(0)
      .setDepth(600);
    this.bodyText = this.scene.add
      .text(x + width / 2, y + height / 2, message, {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#e8eef8',
        align: 'center',
        wordWrap: { width: width - pad * 4 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(601);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      this.detachKeyHandler();
      this.scene.getTimeManager().release(token);
      this.clearModal();
      afterDismiss();
    };

    this.keyDownHandler = (e: KeyboardEvent) => {
      if (!['Enter', ' ', 'Spacebar', 'Escape'].includes(e.key)) return;
      finish();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.keyDownHandler);
    }
    this.finishHandler = finish;
    this.scene.input.once('pointerdown', this.finishHandler);
  }
}
