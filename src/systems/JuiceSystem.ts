import Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../config';
import type { SettingsManager } from '../core/SettingsManager';
import { getSettingsManager } from '../core/SettingsManager';
import { TimeManager } from './TimeManager';
import { t } from '../core/i18n';
import { getCameraViewport } from '../ui/cameraViewport';
import { scaledFlashAlpha, scaledSlowMoDurationMs, scaledParticleCount } from '../core/a11yMotion';
import { scaledFontSize, scaledStrokeThickness } from '../utils/a11yText';
import type { ISceneContext } from '../core/ISceneContext';
import { BALANCE } from '../core/BalanceConfig';
import { fillCirclePool } from './fillCirclePool';
import { damageNumberStyle } from './damageNumberStyle';
import { toastStackY, toastWrapWidth } from './toastLayout';
import { resolveComboDisplay } from './comboDisplay';
import {
  resolveScreenShakeParams,
  BOSS_SHAKE_BASE_AMP,
  BOSS_SHAKE_DURATION_MS,
  BOSS_DEATH_SHAKE_BASE_AMP,
  BOSS_DEATH_SHAKE_DURATION_MS,
} from './screenShakeParams';
import {
  CEILIDH_MAGNET_DURATION_MS,
  CEILIDH_MAGNET_FLAT_PX,
  isCeilidhPulseMoment,
} from './ceilidhChain';
import { audio } from './AudioSystem';
import { bumpCeilidhPulsesLifetime } from '../utils/save';
import { comboDamageMultiplier } from './comboDamage';
import { globalEventBus } from '../core/GlobalEventBus';
import {
  JUICE_BOSS_DEATH_GOLDS,
  JUICE_BOSS_DEATH_RING_PRIMARY,
  JUICE_BOSS_DEATH_RING_SECONDARY,
  JUICE_EVOLUTION_GOLDS,
  JUICE_EVOLUTION_RING_GOLDS,
  JUICE_EVOLUTION_BEAM_COLOR,
  JUICE_EVOLUTION_BANNER_LINE_COLOR,
  JUICE_EVOLUTION_BANNER_BG_COLOR,
} from './juiceGoldPalette';

/**
 * JuiceSystem — visual feedback effects.
 * - Floating damage numbers
 * - Kill burst effects
 * - Kill combo counter
 * - Screen shake
 * - Slow-motion
 */
export class JuiceSystem {
  private scene: Phaser.Scene & ISceneContext;
  private time: TimeManager;
  private tickers: import('../utils/UpdateTickers').UpdateTickers;
  private readonly settings: SettingsManager;
  private dmgTextPool: Phaser.GameObjects.Text[] = [];
  /** Pool of reusable impact rings — used on every enemy hit. Unpooled
   *  creation per hit was a real perf concern at 60fps × pierce weapons. */
  private impactRingPool: Phaser.GameObjects.Arc[] = [];

  /** Pooled trail dots — replaces per-call scene.add.circle in spawnTrail.
   *  60 slots covers ~200/sec spawn rate × 200ms lifetime = 40 in flight. */
  private trailPool: Phaser.GameObjects.Arc[] = [];
  private trailPoolIdx: number = 0;

  /** Pooled kill burst dots — 6 per kill × ~8 in flight = 48 max. */
  private burstDotPool: Phaser.GameObjects.Arc[] = [];
  private burstDotIdx: number = 0;

  /** Pooled kill burst expanding rings — 1 per kill × ~8 in flight. */
  private burstRingPool: Phaser.GameObjects.Arc[] = [];
  private burstRingIdx: number = 0;

  /** Pooled boss death spectacle particles — 30 per boss kill. */
  private bossParticlePool: Phaser.GameObjects.Arc[] = [];
  private bossParticleIdx: number = 0;

  /** Pooled boss death rings — 2 per boss kill (+ 1 delayed). */
  private bossRingPool: Phaser.GameObjects.Arc[] = [];
  private bossRingIdx: number = 0;

  // Kill combo tracking
  private comboCount: number = 0;
  private comboTimer: number = 0;
  private readonly COMBO_TIMEOUT_MS = 1500;
  private comboText: Phaser.GameObjects.Text;

  // Toast stacking
  private activeToasts: number = 0;

  // Danger vignette (low HP warning)
  private vignette: Phaser.GameObjects.Graphics;
  private vignetteAlpha: number = 0;
  private vignetteDirection: number = 1;

  // Screen flash overlay
  private flashRect: Phaser.GameObjects.Rectangle;
  private layoutWidth = 0;
  private layoutHeight = 0;

  // Hit-freeze throttling (engine mutations handled by TimeManager)
  private freezeCooldownMs: number = 0;

  private slowMotionRemainingMs: number = 0;
  /** Tracks pause transitions so we can restore combo text without per-frame `setVisible(true)`. */
  private uiPauseWasActive = false;

  constructor(
    scene: Phaser.Scene & ISceneContext,
    time: TimeManager,
    tickers: import('../utils/UpdateTickers').UpdateTickers,
    settings?: SettingsManager
  ) {
    this.scene = scene;
    this.time = time;
    this.tickers = tickers;
    this.settings = settings ?? getSettingsManager();

    const { width, height } = this.getUiViewport();
    this.layoutWidth = width;
    this.layoutHeight = height;

    // Danger vignette — red border glow, hidden by default
    this.vignette = scene.add.graphics().setScrollFactor(0).setDepth(45).setAlpha(0);
    this.drawVignette();

    // Screen flash overlay — used for level-up/damage flashes
    this.flashRect = scene.add.rectangle(
      width / 2, height / 2,
      width, height,
      0xffffff, 0
    ).setScrollFactor(0).setDepth(95);

    // Pre-allocate damage text pool
    for (let i = 0; i < 50; i++) {
      const t = scene.add.text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: COLORS_CSS.WHITE,
        fontStyle: 'bold',
        stroke: COLORS_CSS.BLACK,
        strokeThickness: 3,
      }).setDepth(80).setVisible(false);
      this.dmgTextPool.push(t);
    }

    // Combo text — fixed to screen, shows during streaks
    this.comboText = scene.add.text(width / 2, Math.max(height * 0.15, 140), '', {
      fontFamily: 'monospace',
      fontSize: '30px',
      color: '#ff8800',
      fontStyle: 'bold',
      stroke: COLORS_CSS.BLACK,
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(90).setVisible(false);

    // Pre-allocate VFX pools — same shape across 6 pools, only the
    // (radius, colour, alpha, depth) differ per pool's visual role.
    // Impact rings: whisky gold, every AoE hit should feel Scottish.
    fillCirclePool(scene, this.impactRingPool, BALANCE.juice.impactRingPoolSize, 4, COLORS.WHISKY_GOLD, 0.8, 12);
    // Trail dots: thistle purple from the highland palette.
    fillCirclePool(scene, this.trailPool, BALANCE.juice.trailDotPoolSize, 2, COLORS.HEATHER, 0.5, 5);
    // Kill burst dots: warm gold, kills should shimmer (not generic red).
    fillCirclePool(scene, this.burstDotPool, BALANCE.juice.burstDotPoolSize, 3, COLORS.WHISKY_GOLD, 0.8, 15);
    // Kill burst rings: warm golden, not cold white.
    fillCirclePool(scene, this.burstRingPool, BALANCE.juice.burstRingPoolSize, 5, 0xffcc44, 0.6, 15);
    // Boss death spectacle: gold particles + larger gold rings.
    fillCirclePool(scene, this.bossParticlePool, BALANCE.juice.bossParticlePoolSize, 5, COLORS.WHISKY_GOLD, 0.9, 20);
    fillCirclePool(scene, this.bossRingPool, BALANCE.juice.bossRingPoolSize, 10, COLORS.WHISKY_GOLD, 0.5, 20);
  }

  /** Spawn a small white burst at a hit location — pooled, overflow is dropped. */
  spawnImpactRing(x: number, y: number): void {
    const ring = this.impactRingPool.find(r => !r.visible);
    if (!ring) return; // All 40 in flight — drop silently (visual only)
    ring.setPosition(x, y);
    ring.setRadius(4);
    ring.setAlpha(0.8);
    ring.setVisible(true);
    this.scene.tweens.add({
      targets: ring,
      radius: 14,
      alpha: 0,
      duration: 180,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.setVisible(false),
    });
  }

  /** Call each frame */
  update(delta: number, hpFraction?: number): void {
    this.refreshFixedLayout();
    const uiPause = this.time.has('UI_PAUSE');
    if (uiPause) {
      this.comboText.setVisible(false);
    } else if (this.uiPauseWasActive && this.comboCount > 0) {
      this.syncComboText();
    }
    this.uiPauseWasActive = uiPause;
    const timeScale = this.time.getEffectiveTimeScale();
    const scaledDelta = delta * timeScale;

    // Tick hit-freeze throttle (bound to timeScale so pause freezes cooldown)
    if (this.freezeCooldownMs > 0) this.freezeCooldownMs -= scaledDelta;

    // Tick slow-motion guard (bound to timeScale)
    if (this.slowMotionRemainingMs > 0) {
      this.slowMotionRemainingMs -= scaledDelta;
      if (this.slowMotionRemainingMs <= 0) {
        this.slowMotionRemainingMs = 0;
        this.slowMotionActive = false;
      }
    }

    // Combo timer
    if (this.comboCount > 0) {
      this.comboTimer -= scaledDelta;
      if (this.comboTimer <= 0) {
        // Combo dropped — show a disappointed quip if it was a decent streak
        const droppedCount = this.comboCount;
        this.comboCount = 0;
        this.syncComboText();
        if (droppedCount >= 30) {
          this.showToast(t('ui.game.combo_dropped_big', { count: droppedCount }), '#8a7a6a');
        } else if (droppedCount >= 15) {
          this.showToast(t('ui.game.combo_dropped', { count: droppedCount }), '#6a5a4a');
        }
      }
    }

    // Danger vignette — pulse when HP < 30%. Use scaledDelta so the pulse
    // freezes during hit-freeze and eases during slow-motion, matching the
    // other time-authority effects in this update loop.
    if (hpFraction !== undefined && hpFraction < 0.3 && hpFraction > 0) {
      this.vignetteAlpha += this.vignetteDirection * scaledDelta * 0.002;
      if (this.vignetteAlpha >= 0.5) { this.vignetteAlpha = 0.5; this.vignetteDirection = -1; }
      if (this.vignetteAlpha <= 0.1) { this.vignetteAlpha = 0.1; this.vignetteDirection = 1; }
      this.vignette.setAlpha(this.vignetteAlpha);
    } else {
      this.vignette.setAlpha(0);
      // Reset so vignette fades in smoothly if HP drops below 30% again
      this.vignetteAlpha = 0;
      this.vignetteDirection = 1;
    }
  }

  /** Show a floating damage number at world position */
  showDamageNumber(x: number, y: number, damage: number, isCrit = false): void {
    if (!this.settings.load().damageNumbers) return;
    const text = this.dmgTextPool.find(t => !t.visible);
    if (!text) return;

    text.setText(damage.toString());
    text.setPosition(x + Phaser.Math.Between(-10, 10), y - 10);
    text.setVisible(true);
    text.setAlpha(1);

    // Scale with damage — big hits look big. Compound with uiScale so text
    // scale is legible for low-vision players without fighting the font size.
    const style = damageNumberStyle(damage, isCrit);
    const uiScale = this.settings.load().uiScale;
    text.setScale(style.scale * uiScale);
    // Damage number colors: whisky gold palette, not cold white
    text.setColor(style.color);
    text.setRotation(Phaser.Math.FloatBetween(-0.25, 0.25));

    this.scene.tweens.add({
      targets: text,
      y: text.y - 25 - damage * 0.3,
      alpha: 0,
      rotation: text.rotation * 0.5,
      duration: 600,
      ease: 'Power2',
      onComplete: () => { text.setVisible(false); text.setRotation(0); },
    });
  }

  /** Spawn a fading trail particle at a position (call from update for projectiles) */
  spawnTrail(x: number, y: number, color: number = 0x9966cc): void {
    const dot = this.trailPool[this.trailPoolIdx];
    this.trailPoolIdx = (this.trailPoolIdx + 1) % this.trailPool.length;
    this.scene.tweens.killTweensOf(dot);
    dot.setPosition(x, y);
    dot.setFillStyle(color, 0.5);
    dot.setRadius(2);
    dot.setScale(1);
    dot.setAlpha(0.5);
    dot.setVisible(true);
    this.scene.tweens.add({
      targets: dot,
      alpha: 0,
      scale: 0.3,
      duration: 200,
      onComplete: () => dot.setVisible(false),
    });
  }

  /** Visual burst when an enemy dies — colored particles + combo tracking */
  showKillBurst(x: number, y: number, color: number = 0xcc4444): void {
    const lowFx = this.settings.load().reduceParticles;
    const dots = lowFx ? 3 : 6;
    // Particle burst — pooled dots scatter outward
    for (let i = 0; i < dots; i++) {
      const angle = (i / dots) * Math.PI * 2;
      const dot = this.burstDotPool[this.burstDotIdx];
      this.burstDotIdx = (this.burstDotIdx + 1) % this.burstDotPool.length;
      this.scene.tweens.killTweensOf(dot);
      dot.setPosition(x, y);
      dot.setRadius(Phaser.Math.Between(2, 4));
      dot.setFillStyle(color, 0.8);
      dot.setAlpha(0.8);
      dot.setScale(1);
      dot.setVisible(true);
      this.scene.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * Phaser.Math.Between(15, 30),
        y: y + Math.sin(angle) * Phaser.Math.Between(15, 30),
        alpha: 0,
        scale: 0,
        duration: 250 + Math.random() * 150,
        onComplete: () => dot.setVisible(false),
      });
    }
    // Expanding ring — pooled
    const ring = this.burstRingPool[this.burstRingIdx];
    this.burstRingIdx = (this.burstRingIdx + 1) % this.burstRingPool.length;
    this.scene.tweens.killTweensOf(ring);
    ring.setPosition(x, y);
    ring.setRadius(5);
    ring.setFillStyle(0xffffff, 0.6);
    ring.setAlpha(0.6);
    ring.setScale(1);
    ring.setVisible(true);
    this.scene.tweens.add({
      targets: ring,
      radius: 20,
      alpha: 0,
      duration: 200,
      onComplete: () => ring.setVisible(false),
    });

    // Track combo
    this.comboCount++;
    this.comboTimer = this.COMBO_TIMEOUT_MS;
    if (this.comboCount > this.bestCombo) this.bestCombo = this.comboCount;

    // Storm Chaser milestone — emit exactly when the streak first reaches
    // 100 kills. AchievementManager tryUnlock is idempotent so a player
    // who drops combo and rebuilds past 100 still unlocks (and the
    // duplicate emit is harmless).
    if (this.comboCount === 100) {
      globalEventBus.emit('GLOBAL_COMBO_MILESTONE', { count: 100 });
    }

    if (this.comboCount >= 5) {
      this.syncComboText();

      // Pulse effect
      this.scene.tweens.add({
        targets: this.comboText,
        scale: 1.2,
        duration: 100,
        yoyo: true,
      });

      // Combo milestone cultural Easter eggs — Glesga patter at key numbers.
      // Captions piggyback on the toast copy — if a player is reading toasts,
      // the caption strip echoes them consistently.
      // Ceilidh Chain — every 8th kill in the streak, the moor picks
      // up the beat and the magnet pulses wider for 2s. A cheap joy
      // moment between the rare Glesga-patter milestones below. Uses
      // the same scene duck-call as captions (see combo_11 branch).
      if (isCeilidhPulseMoment(this.comboCount)) {
        const pl = this.scene.getPlayer();
        pl.grantCeilidhChainMagnet(CEILIDH_MAGNET_FLAT_PX, CEILIDH_MAGNET_DURATION_MS);
        const msg = t('ui.game.ceilidh_pulse');
        this.showToast(msg, '#a0d8a0');
        this.scene.caption?.(`ceilidh_${this.comboCount}`, msg, '#a0d8a0');
        audio.playCeilidhPulse();
        this.scene.getTutorialSystem().notifyCeilidhChainIfFirst();
        bumpCeilidhPulsesLifetime();
        // Expanding green ring sells the magnet pulse — the stat boost was
        // otherwise invisible, just a silent 2s widening of pickup range.
        // Gated on reduceParticles so the low-FX path stays clean.
        if (!this.settings.load().reduceParticles) {
          const ring = this.scene.add
            .circle(pl.x, pl.y, 12, 0xa0d8a0, 0.45)
            .setDepth(55);
          this.scene.tweens.add({
            targets: ring,
            scale: 7,
            alpha: 0,
            duration: 500,
            ease: 'Quad.easeOut',
            onComplete: () => ring.destroy(),
          });
        }
      }

      if (this.comboCount === 11) {
        const msg = t('ui.game.combo_11');
        this.showToast(msg, '#ffdd44');
        this.scene.caption?.(`combo_11`, msg, '#ffdd44');
      } else if (this.comboCount === 50) {
        const msg = t('ui.game.combo_50');
        this.showToast(msg, '#ffdd44');
        this.scene.caption?.(`combo_50`, msg, '#ffdd44');
        this.flashWhite(100);
      } else if (this.comboCount === 100) {
        const msg = t('ui.game.combo_100');
        this.showToast(msg, '#ff8844');
        this.scene.caption?.(`combo_100`, msg, '#ff8844');
        this.flashWhite(100);
      } else if (this.comboCount === 200) {
        const msg = t('ui.game.combo_200');
        this.showToast(msg, '#ff8844');
        this.scene.caption?.(`combo_200`, msg, '#ff8844');
        this.flashWhite(100);
      }
    }
  }

  /**
   * Soft amber world burst on the player — moor moment hearth beat (no combo).
   * Optional `tint` (0xRRGGBB) biases particles toward the current biome.
   */
  showMoorMomentBurst(x: number, y: number, tint?: number): void {
    const s = this.settings.load();
    const lowFx = s.reduceParticles;
    const dots = lowFx ? 5 : 11;
    const color = tint ?? 0xe8c896;
    const wobble = Phaser.Math.FloatBetween(0, Math.PI * 2);
    for (let i = 0; i < dots; i++) {
      const angle = (i / dots) * Math.PI * 2 + wobble;
      const dot = this.burstDotPool[this.burstDotIdx];
      this.burstDotIdx = (this.burstDotIdx + 1) % this.burstDotPool.length;
      this.scene.tweens.killTweensOf(dot);
      dot.setPosition(x, y);
      dot.setRadius(Phaser.Math.Between(2, 5));
      dot.setFillStyle(color, 0.88);
      dot.setAlpha(0.88);
      dot.setScale(1);
      dot.setVisible(true);
      const dist = Phaser.Math.Between(22, 46);
      this.scene.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0,
        duration: 340 + Math.random() * 140,
        ease: 'Sine.easeOut',
        onComplete: () => dot.setVisible(false),
      });
    }
    const ring = this.burstRingPool[this.burstRingIdx];
    this.burstRingIdx = (this.burstRingIdx + 1) % this.burstRingPool.length;
    this.scene.tweens.killTweensOf(ring);
    ring.setPosition(x, y);
    ring.setRadius(5);
    ring.setFillStyle(color, 0.5);
    ring.setAlpha(0.58);
    ring.setScale(1);
    ring.setVisible(true);
    this.scene.tweens.add({
      targets: ring,
      radius: 52,
      alpha: 0,
      duration: 400,
      ease: 'Sine.easeOut',
      onComplete: () => ring.setVisible(false),
    });
    // Echo ring — layered “hearth” read without boss-scale spectacle.
    this.tickers.addOnce('raw', 105, () => {
      const ring2 = this.burstRingPool[this.burstRingIdx];
      this.burstRingIdx = (this.burstRingIdx + 1) % this.burstRingPool.length;
      this.scene.tweens.killTweensOf(ring2);
      ring2.setPosition(x, y);
      ring2.setRadius(8);
      const r = (color >> 16) & 0xff;
      const g = (color >> 8) & 0xff;
      const b = color & 0xff;
      const soft = Phaser.Display.Color.GetColor(
        Math.min(255, r + 18),
        Math.min(255, g + 14),
        Math.min(255, b + 8),
      );
      ring2.setFillStyle(soft, 0.28);
      ring2.setAlpha(0.42);
      ring2.setScale(1);
      ring2.setVisible(true);
      this.scene.tweens.add({
        targets: ring2,
        radius: 68,
        alpha: 0,
        duration: 480,
        ease: 'Cubic.easeOut',
        onComplete: () => ring2.setVisible(false),
      });
    });
    if (s.screenShake) {
      const amp = 0.0038 * s.motionScale;
      if (amp > 0) this.scene.cameras.main.shake(260, amp);
    }
  }

  /** Toast notification — slides in from the right and fades out, stacks vertically */
  showToast(message: string, color: string = COLORS_CSS.WHITE): void {
    if (this.time.has('UI_PAUSE')) return;
    const { x, y, width } = this.getUiViewport();
    const yOffset = toastStackY(y, this.activeToasts);
    this.activeToasts++;

    const wrapW = toastWrapWidth(width);
    const toast = this.scene.add.text(x + width + 10, yOffset, message, {
      fontFamily: 'monospace', fontSize: scaledFontSize(16), color,
      fontStyle: 'bold', stroke: COLORS_CSS.INK, strokeThickness: scaledStrokeThickness(3),
      backgroundColor: '#1a1a2ecc', padding: { x: 10, y: 5 },
      wordWrap: { width: wrapW },
      align: 'right',
    }).setScrollFactor(0).setDepth(85).setOrigin(1, 0);

    // Slide in
    this.scene.tweens.add({
      targets: toast,
      x: x + width - 10,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        // Hold then fade out
        this.scene.tweens.add({
          targets: toast,
          alpha: 0,
          delay: 1500,
          duration: 400,
          onComplete: () => {
            toast.destroy();
            this.activeToasts = Math.max(0, this.activeToasts - 1);
          },
        });
      },
    });
  }

  /** White screen flash (level-up, big event). Alpha scales with motionScale. */
  flashWhite(duration = 200): void {
    const alpha = scaledFlashAlpha(0.4);
    if (alpha <= 0) return;
    this.scene.tweens.killTweensOf(this.flashRect);
    this.flashRect.setFillStyle(0xffffff);
    this.flashRect.setAlpha(alpha);
    this.scene.tweens.add({
      targets: this.flashRect,
      alpha: 0,
      duration,
    });
  }

  /** Red screen flash (damage taken). Alpha scales with motionScale. */
  flashRed(duration = 150): void {
    const alpha = scaledFlashAlpha(0.25);
    if (alpha <= 0) return;
    this.scene.tweens.killTweensOf(this.flashRect);
    this.flashRect.setFillStyle(0xff0000);
    this.flashRect.setAlpha(alpha);
    this.scene.tweens.add({
      targets: this.flashRect,
      alpha: 0,
      duration,
    });
  }

  /** Draw the vignette — warm ember danger glow, not cold alarm red.
   *  Two layers: deep crimson base + amber outer edge for a hearthfire-dying feel. */
  private drawVignette(): void {
    const w = this.layoutWidth;
    const h = this.layoutHeight;
    const gfx = this.vignette;
    gfx.clear();

    // Deep crimson base layer — the danger signal
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const inset = (1 - t) * 80;
      const alpha = t * t * 0.5;
      gfx.fillStyle(0x881111, alpha);
      gfx.fillRect(0, 0, w, inset);
      gfx.fillRect(0, h - inset, w, inset);
      gfx.fillRect(0, 0, inset, h);
      gfx.fillRect(w - inset, 0, inset, h);
    }
    // Warm amber outer fringe — like embers at the edge of the hearth
    for (let i = 0; i < 4; i++) {
      const t = i / 4;
      const inset = (1 - t) * 30;
      const alpha = t * t * 0.25;
      gfx.fillStyle(0xcc6622, alpha);
      gfx.fillRect(0, 0, w, inset);
      gfx.fillRect(0, h - inset, w, inset);
      gfx.fillRect(0, 0, inset, h);
      gfx.fillRect(w - inset, 0, inset, h);
    }
  }

  /** Hide combo text (called when level-up screen opens) */
  hideCombo(): void {
    this.comboText.setVisible(false);
  }

  /** Current kill combo count (for music Conductor) */
  getComboCount(): number { return this.comboCount; }

  /** Best combo this run */
  private bestCombo: number = 0;
  getBestCombo(): number { return this.bestCombo; }
  setResumeBestCombo(bestCombo: number | undefined): void {
    if (bestCombo === undefined || !Number.isFinite(bestCombo)) return;
    this.bestCombo = Math.max(0, Math.floor(bestCombo));
  }
  getComboTimerRemainingMs(): number { return Math.max(0, Math.floor(this.comboTimer)); }
  setResumeComboState(comboCount: number | undefined, comboTimerMs: number | undefined): void {
    if (comboCount === undefined || comboTimerMs === undefined) return;
    this.comboCount = Math.max(0, Math.floor(comboCount));
    this.comboTimer = Math.max(0, Math.floor(comboTimerMs));
    this.syncComboText();
  }

  /** Combo damage multiplier — +5% per 10 combo, max +50% */
  getComboDamageMultiplier(): number {
    return comboDamageMultiplier(this.comboCount);
  }

  private syncComboText(): void {
    const state = resolveComboDisplay(this.comboCount, this.comboTimer);
    if (!state.visible) {
      this.comboText.setVisible(false);
      this.comboText.setColor(state.color);
      return;
    }
    this.comboText.setText(state.text);
    this.comboText.setVisible(true);
    this.comboText.setScale(1);
    this.comboText.setColor(state.color);
  }

  /** Heavy screen shake for boss events. Amplitude scales with motionScale. */
  bossShake(): void {
    const s = this.settings.load();
    const shake = resolveScreenShakeParams(
      BOSS_SHAKE_BASE_AMP,
      BOSS_SHAKE_DURATION_MS,
      s.screenShake,
      s.motionScale,
    );
    if (!shake) return;
    this.scene.cameras.main.shake(shake.durationMs, shake.amplitude);
  }

  /** Boss kill celebration — gold particle shower + expanded kill burst.
   *  Count + shake both scale with motionScale. */
  bossDeathSpectacle(x: number, y: number): void {
    const lowFx = this.settings.load().reduceParticles;
    const shakeOn = this.settings.load().screenShake;
    // Big white flash
    this.flashWhite(400);

    const bossDeathShake = resolveScreenShakeParams(
      BOSS_DEATH_SHAKE_BASE_AMP,
      BOSS_DEATH_SHAKE_DURATION_MS,
      shakeOn,
      this.settings.load().motionScale,
    );
    if (bossDeathShake) {
      this.scene.cameras.main.shake(bossDeathShake.durationMs, bossDeathShake.amplitude);
    }

    const baseCount = lowFx ? 12 : 30;
    const particleCount = scaledParticleCount(baseCount, 6);
    // Gold particle shower — pooled
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 80 + Math.random() * 200;
      const size = Phaser.Math.Between(3, 8);
      const color = Phaser.Utils.Array.GetRandom(JUICE_BOSS_DEATH_GOLDS as number[]) as number;
      const particle = this.bossParticlePool[this.bossParticleIdx];
      this.bossParticleIdx = (this.bossParticleIdx + 1) % this.bossParticlePool.length;
      this.scene.tweens.killTweensOf(particle);
      particle.setPosition(x, y);
      particle.setRadius(size);
      particle.setFillStyle(color, 0.9);
      particle.setAlpha(0.9);
      particle.setScale(1);
      particle.setVisible(true);
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 800 + Math.random() * 600,
        ease: 'Power2',
        onComplete: () => particle.setVisible(false),
      });
    }

    // Expanding ring — pooled
    const ring = this.bossRingPool[this.bossRingIdx];
    this.bossRingIdx = (this.bossRingIdx + 1) % this.bossRingPool.length;
    this.scene.tweens.killTweensOf(ring);
    ring.setPosition(x, y);
    ring.setRadius(10);
    ring.setFillStyle(JUICE_BOSS_DEATH_RING_PRIMARY, 0.5);
    ring.setAlpha(0.5);
    ring.setScale(1);
    ring.setVisible(true);
    this.scene.tweens.add({
      targets: ring,
      radius: 80,
      alpha: 0,
      duration: 500,
      onComplete: () => ring.setVisible(false),
    });

    // Second delayed ring — pooled. Use 'raw' so the 150ms delay is wall-clock:
    // scaled mode freezes during HIT_FREEZE physics-pause and stretches to
    // ~500ms during slow-motion, breaking the intended layered animation.
    this.tickers.addOnce('raw', 150, () => {
      const ring2 = this.bossRingPool[this.bossRingIdx];
      this.bossRingIdx = (this.bossRingIdx + 1) % this.bossRingPool.length;
      this.scene.tweens.killTweensOf(ring2);
      ring2.setPosition(x, y);
      ring2.setRadius(10);
      ring2.setFillStyle(JUICE_BOSS_DEATH_RING_SECONDARY, 0.3);
      ring2.setAlpha(0.3);
      ring2.setScale(1);
      ring2.setVisible(true);
      this.scene.tweens.add({
        targets: ring2,
        radius: 120,
        alpha: 0,
        duration: 600,
        onComplete: () => ring2.setVisible(false),
      });
    });
  }

  /** Weapon evolution spectacle — THE peak reward moment of the game.
   *  Legendary golden manifestation: radial beams, rings, particles, banner. */
  evolutionSpectacle(x: number, y: number, legendaryName: string): void {
    const lowFx = this.settings.load().reduceParticles;
    const shakeOn = this.settings.load().screenShake;

    // 1. Heavy white-to-gold flash (bigger than normal flashWhite)
    this.flashWhite(500);

    // 2. Hit-freeze for dramatic pause (50ms — longer than combat freeze)
    if (!lowFx) {
      this.time.requestForDuration('EVOLUTION_FREEZE', { pausePhysics: true }, 50);
    }

    // 3. Screen shake — proportional to the moment (bigger than boss death)
    if (shakeOn) {
      const amp = 0.02 * this.settings.load().motionScale;
      if (amp > 0) this.scene.cameras.main.shake(700, amp);
    }

    // 4. Camera zoom punch — brief zoom in then settle.
    // Two sequential tweens (not yoyo) so the return target is re-read at the
    // end of the punch. Without this, if GrowthSystem bumps zoom during the
    // 200ms punch (e.g. a second near-simultaneous level-up), the yoyo settles
    // on stale baseZoom and the camera is permanently wrong for the run.
    const cam = this.scene.cameras.main;
    const baseZoom = cam.zoom;
    this.scene.tweens.add({
      targets: cam,
      zoom: baseZoom * 1.08,
      duration: 200,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: cam,
          zoom: cam.zoom / 1.08,
          duration: 200,
          ease: 'Quad.easeIn',
        });
      },
    });

    // 5. Radial golden beams (8 rays shooting outward from player)
    const beamCount = lowFx ? 6 : 12;
    const scene = this.scene;
    for (let i = 0; i < beamCount; i++) {
      const angle = (i / beamCount) * Math.PI * 2;
      const beamLen = 220;
      // Draw beam as a long thin rectangle, rotated
      const beam = scene.add.rectangle(x, y, beamLen, 4, JUICE_EVOLUTION_BEAM_COLOR, 0.8)
        .setOrigin(0, 0.5).setDepth(100);
      beam.setRotation(angle);
      beam.setScale(0, 1);
      scene.tweens.add({
        targets: beam,
        scaleX: 1,
        alpha: 0,
        duration: 500 + i * 15,
        ease: 'Quad.easeOut',
        onComplete: () => beam.destroy(),
      });
    }

    // 6. Three expanding gold rings (layered spectacle)
    for (let r = 0; r < 3; r++) {
      const ring = scene.add.circle(x, y, 15, JUICE_EVOLUTION_RING_GOLDS[r], 0.7 - r * 0.15)
        .setDepth(99);
      scene.tweens.add({
        targets: ring,
        scale: 10 + r * 3,
        alpha: 0,
        duration: 700 + r * 150,
        delay: r * 80,
        ease: 'Quad.easeOut',
        onComplete: () => ring.destroy(),
      });
    }

    // 7. Golden particle explosion (24 particles, bigger than boss death)
    const particleCount = lowFx ? 12 : 24;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 100 + Math.random() * 200;
      const color = JUICE_EVOLUTION_GOLDS[i % JUICE_EVOLUTION_GOLDS.length];
      const size = Phaser.Math.Between(3, 7);
      const particle = scene.add.circle(x, y, size, color, 0.95).setDepth(101);
      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.2,
        duration: 800 + Math.random() * 500,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }

    // 8. Legendary banner slams in from above (screen-centred)
    const cx = cam.scrollX + cam.width / (2 * cam.zoom);
    const cy = cam.scrollY + cam.height / (2 * cam.zoom) - 40;
    const bannerBg = scene.add.rectangle(cx, cy, cam.width / cam.zoom, 52, JUICE_EVOLUTION_BANNER_BG_COLOR, 0.85)
      .setScrollFactor(0).setDepth(200).setAlpha(0);
    // For screen-space banner, we need scroll factor 0 so use actual screen coords
    bannerBg.setPosition(cam.width / 2, cam.height / 2 - 40);
    bannerBg.setScrollFactor(0);
    const bannerTop = scene.add.rectangle(cam.width / 2, cam.height / 2 - 65, cam.width, 2, JUICE_EVOLUTION_BANNER_LINE_COLOR, 0)
      .setScrollFactor(0).setDepth(200);
    const bannerBot = scene.add.rectangle(cam.width / 2, cam.height / 2 - 15, cam.width, 2, JUICE_EVOLUTION_BANNER_LINE_COLOR, 0)
      .setScrollFactor(0).setDepth(200);
    const text = scene.add.text(cam.width / 2, cam.height / 2 - 40,
      `✦ LEGENDARY: ${legendaryName.toUpperCase()} ✦`,
      {
        fontFamily: 'monospace', fontSize: '22px',
        color: '#ffee88', fontStyle: 'bold',
        stroke: '#2a1a00', strokeThickness: 4,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(201).setAlpha(0).setScale(1.4);

    scene.tweens.add({
      targets: bannerBg, alpha: 0.9, duration: 200,
    });
    scene.tweens.add({
      targets: [bannerTop, bannerBot], alpha: 0.9, duration: 300,
    });
    scene.tweens.add({
      targets: text, alpha: 1, scale: 1, duration: 350, ease: 'Back.easeOut',
    });
    // Hold then fade
    scene.tweens.add({
      targets: [bannerBg, bannerTop, bannerBot, text],
      alpha: 0,
      delay: 1400,
      duration: 500,
      onComplete: () => {
        bannerBg.destroy();
        bannerTop.destroy();
        bannerBot.destroy();
        text.destroy();
      },
    });
  }

  /** Hit freeze — 20ms time pause on kill for combat impact.
   *  Throttled to max once per 100ms to prevent stutter during AoE. */
  hitFreeze(): void {
    if (this.settings.load().reduceParticles) return;
    if (this.slowMotionActive) return; // don't interrupt slow-mo
    if (this.freezeCooldownMs > 0) return;
    this.freezeCooldownMs = 100;
    // Freeze gameplay by pausing physics (no timeScale mutation).
    this.time.requestForDuration('HIT_FREEZE', { pausePhysics: true }, 20);
  }

  /** Brief slow-motion effect — guarded against overlapping calls.
   *  Duration scales with motionScale (floor 60ms so the beat still lands). */
  private slowMotionActive = false;
  slowMotion(durationMs = 300): void {
    if (this.slowMotionActive) return; // Prevent overlapping slow-mo
    const scaled = scaledSlowMoDurationMs(durationMs);
    this.slowMotionActive = true;
    this.slowMotionRemainingMs = scaled;
    this.time.requestForDuration('SLOW_MO', { timeScale: 0.3 }, scaled);
  }

  /** Colored particle bloom on first biome entry. */
  biomeEntryBurst(x: number, y: number, biomeId: string): void {
    if (this.settings.load().reduceParticles) return;
    const colorMap: Record<string, number> = {
      heather: 0xc699ee,
      bog: 0x7a8a40,
      loch: 0x88bbdd,
      pine: 0x4a7a4a,
    };
    const color = colorMap[biomeId] ?? 0xffffff;
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 80 + Math.random() * 100;
      const dot = this.burstDotPool[this.burstDotIdx];
      this.burstDotIdx = (this.burstDotIdx + 1) % this.burstDotPool.length;
      this.scene.tweens.killTweensOf(dot);
      dot.setPosition(x, y);
      dot.setRadius(Phaser.Math.Between(2, 4));
      dot.setFillStyle(color, 0.8);
      dot.setAlpha(0.8);
      dot.setScale(1);
      dot.setVisible(true);
      this.scene.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 600 + Math.random() * 300,
        ease: 'Sine.easeOut',
        onComplete: () => dot.setVisible(false),
      });
    }
  }

  /** Clean up all pooled objects and tweens — called by GameScene shutdown. */
  destroy(): void {
    const killAndDestroy = (pool: Phaser.GameObjects.GameObject[]) => {
      for (const obj of pool) {
        this.scene.tweens.killTweensOf(obj);
        obj.destroy();
      }
    };
    killAndDestroy(this.dmgTextPool);
    killAndDestroy(this.impactRingPool);
    killAndDestroy(this.trailPool);
    killAndDestroy(this.burstDotPool);
    killAndDestroy(this.burstRingPool);
    killAndDestroy(this.bossParticlePool);
    killAndDestroy(this.bossRingPool);
    this.dmgTextPool = [];
    this.impactRingPool = [];
    this.trailPool = [];
    this.burstDotPool = [];
    this.burstRingPool = [];
    this.bossParticlePool = [];
    this.bossRingPool = [];
    this.scene.tweens.killTweensOf(this.comboText);
    this.comboText.destroy();
    this.vignette.destroy();
    this.flashRect.destroy();
  }

  private getUiViewport(): { x: number; y: number; width: number; height: number; zoom: number } {
    return getCameraViewport(this.scene);
  }

  private refreshFixedLayout(): void {
    const { x, y, width, height, zoom } = this.getUiViewport();
    const sizeChanged = width !== this.layoutWidth || height !== this.layoutHeight;
    this.layoutWidth = width;
    this.layoutHeight = height;

    this.flashRect.setPosition(x + width / 2, y + height / 2);
    this.flashRect.width = width;
    this.flashRect.height = height;
    this.comboText.setPosition(x + width / 2, y + Math.max(height * 0.2, 128 / Math.max(0.001, zoom)));
    this.vignette.setPosition(x, y);
    if (sizeChanged) this.drawVignette();
  }
}
