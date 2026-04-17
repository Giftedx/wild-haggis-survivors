import Phaser from 'phaser';
import type { ISceneContext } from '../core/ISceneContext';
import { globalEventBus } from '../core/GlobalEventBus';
import { SaveManager } from '../core/SaveManager';
import { t } from '../core/i18n';
import { getCameraViewport } from '../ui/cameraViewport';
import type { EliteAffixId } from '../data/eliteAffixes';

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
  private driftArrow: Phaser.GameObjects.Graphics | null = null;
  private driftTimerHandle: import('../utils/UpdateTickers').TickerHandle | null = null;
  private driftScheduled: boolean = false;

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

  constructor(scene: Phaser.Scene & ISceneContext, metaSave: SaveManager) {
    this.scene = scene;
    this.metaSave = metaSave;
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
    if (this.driftArrow) {
      this.scene.tweens.killTweensOf(this.driftArrow);
      this.driftArrow.destroy();
      this.driftArrow = null;
    }
    if (this.dismissDriftArrowRef) {
      this.scene.tweens.killTweensOf(this.dismissDriftArrowRef);
      this.dismissDriftArrowRef.destroy();
      this.dismissDriftArrowRef = null;
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
        stroke: '#000000',
        strokeThickness: 3,
        backgroundColor: '#1a1020cc',
        padding: { x: 12, y: 8 },
        wordWrap: { width: wrapW },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(86)
      .setAlpha(0);

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
        stroke: '#000000',
        strokeThickness: 3,
        backgroundColor: '#2a1a08cc',
        padding: { x: 12, y: 8 },
        wordWrap: { width: wrapW },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(86)
      .setAlpha(0);

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
      textColor: '#b8e8a8',
      bgColor: '#0a2010cc',
      topOffset: 174,
    });
  }

  /** First Standing Stones trinity — 5:00 boon pick. */
  notifyStandingStonesIfFirst(): void {
    if (this.metaSave.load().hasSeenStandingStonesTip) return;
    this.metaSave.update((cur) => ({ ...cur, hasSeenStandingStonesTip: true }));
    this.showOneShotTip(t('tutorial.standing_stones_first'), {
      textColor: '#d0c0ff',
      bgColor: '#10082acc',
      topOffset: 174,
    });
  }

  /** First Ancestral Echo — spectral haggis at last-death spot. */
  notifyAncestralEchoIfFirst(): void {
    if (this.metaSave.load().hasSeenAncestralEchoTip) return;
    this.metaSave.update((cur) => ({ ...cur, hasSeenAncestralEchoTip: true }));
    this.showOneShotTip(t('tutorial.ancestral_echo_first'), {
      textColor: '#b0d4ff',
      bgColor: '#081828cc',
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
        stroke: '#000000',
        strokeThickness: 3,
        backgroundColor: opts.bgColor,
        padding: { x: 12, y: 8 },
        wordWrap: { width: wrapW },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(86)
      .setAlpha(0);
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

  // ── Drift tutorial (non-pausing) ───────────────────────────────────

  private scheduleDriftHintIfNeeded(): void {
    if (this.driftScheduled) return;
    if (this.metaSave.load().hasSeenDriftTutorial) return;
    this.driftScheduled = true;
    // Show 3 seconds after FTUE completes (or run start if FTUE already done).
    // Use the RAW ticker (wall-clock) so the hint isn't frozen when the FTUE
    // overlay sets `timeScale: 0`. `scene.time.delayedCall` respects
    // timeScale — a 3s hint behind a 20s pause would fire 20s late.
    this.driftTimerHandle = this.scene.getUpdateTickers().addOnce('raw', 3000, () => {
      this.driftTimerHandle = null;
      this.showDriftHint();
    });
  }

  private showDriftHint(): void {
    if (this.metaSave.load().hasSeenDriftTutorial) return;
    this.metaSave.update((cur) => ({ ...cur, hasSeenDriftTutorial: true }));

    const { x, y, width } = this.getUiViewport();
    const bannerY = y + 80;
    const wrapW = Math.max(160, Math.min(420, width - 48));

    // Semi-transparent banner — no pause, no input blocking
    this.driftBanner = this.scene.add.text(x + width / 2, bannerY, t('tutorial.drift'), {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffe8a0',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: '#1a1020cc',
      padding: { x: 12, y: 8 },
      wordWrap: { width: wrapW },
      align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(85).setAlpha(0);

    // Fade in
    this.scene.tweens.add({
      targets: this.driftBanner,
      alpha: 1,
      duration: 400,
      ease: 'Power2',
    });

    // Curved clockwise arrow near player
    this.driftArrow = this.scene.add.graphics().setDepth(55).setAlpha(0);
    this.drawCurvedArrow(this.driftArrow);

    this.scene.tweens.add({
      targets: this.driftArrow,
      alpha: 0.7,
      duration: 400,
      ease: 'Power2',
    });

    // Auto-dismiss after 6 wall-clock seconds — tracked so dispose() can
    // cancel if the scene tears down mid-hint (otherwise the callback fires
    // on already-destroyed driftBanner / driftArrow fields). Raw ticker so
    // the auto-dismiss doesn't stall if the player hits a level-up overlay
    // during those 6 seconds.
    this.driftTimerHandle = this.scene.getUpdateTickers().addOnce('raw', 6000, () => {
      this.driftTimerHandle = null;
      this.dismissDriftHint();
    });
  }

  private drawCurvedArrow(gfx: Phaser.GameObjects.Graphics): void {
    const player = this.scene.getPlayer();
    const cx = player.x;
    const cy = player.y;
    const radius = 40;

    // Draw a clockwise arc (~270 degrees)
    gfx.lineStyle(2.5, 0xffe8a0, 0.8);
    gfx.beginPath();
    const startAngle = -Math.PI * 0.6;
    const endAngle = Math.PI * 0.9;
    const steps = 32;
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / steps);
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (i === 0) gfx.moveTo(px, py);
      else gfx.lineTo(px, py);
    }
    gfx.strokePath();

    // Arrowhead at the end of the arc
    const endX = cx + Math.cos(endAngle) * radius;
    const endY = cy + Math.sin(endAngle) * radius;
    const arrowAngle = endAngle + Math.PI / 2; // tangent direction (clockwise)
    const headLen = 10;
    gfx.fillStyle(0xffe8a0, 0.8);
    gfx.fillTriangle(
      endX + Math.cos(arrowAngle) * headLen,
      endY + Math.sin(arrowAngle) * headLen,
      endX + Math.cos(arrowAngle + 2.4) * headLen * 0.6,
      endY + Math.sin(arrowAngle + 2.4) * headLen * 0.6,
      endX + Math.cos(arrowAngle - 2.4) * headLen * 0.6,
      endY + Math.sin(arrowAngle - 2.4) * headLen * 0.6,
    );
  }

  private dismissDriftBannerRef: Phaser.GameObjects.Text | null = null;
  private dismissDriftArrowRef: Phaser.GameObjects.Graphics | null = null;

  private dismissDriftHint(): void {
    if (this.driftBanner) {
      const banner = this.driftBanner;
      this.driftBanner = null;
      this.dismissDriftBannerRef = banner;
      this.scene.tweens.add({
        targets: banner,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          if (this.dismissDriftBannerRef === banner) this.dismissDriftBannerRef = null;
          banner.destroy();
        },
      });
    }
    if (this.driftArrow) {
      const arrow = this.driftArrow;
      this.driftArrow = null;
      this.dismissDriftArrowRef = arrow;
      this.scene.tweens.add({
        targets: arrow,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          if (this.dismissDriftArrowRef === arrow) this.dismissDriftArrowRef = null;
          arrow.destroy();
        },
      });
    }
  }

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
