import * as Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../config';
import type { SettingsManager } from '../core/SettingsManager';
import { getSettingsManager } from '../core/SettingsManager';
import { TimeManager } from './TimeManager';
import { t } from '../core/i18n';
import { getCameraViewport } from '../ui/cameraViewport';
import {
  scaledFlashAlpha,
  scaledFlashDurationMs,
  scaledSlowMoDurationMs,
  scaledParticleCount,
} from '../core/a11yMotion';
import { scaledFontSize, scaledStrokeThickness } from '../utils/a11yText';
import type { ISceneContext } from '../core/ISceneContext';
import { BALANCE } from '../core/BalanceConfig';
import { fillCirclePool } from './fillCirclePool';
import { damageNumberStyle } from './damageNumberStyle';
import { decideEnqueue, toastStackY, toastWrapWidth } from './toastLayout';
import { resolveComboDisplay } from './comboDisplay';
import { resolveComboMilestoneVfx } from './comboMilestoneVfx';
import {
  resolveScreenShakeParams,
  BOSS_SHAKE_BASE_AMP,
  BOSS_SHAKE_DURATION_MS,
} from './screenShakeParams';
import {
  CEILIDH_MAGNET_DURATION_MS,
  CEILIDH_MAGNET_FLAT_PX,
  isCeilidhPulseMoment,
} from './ceilidhChain';
import { audio } from './AudioSystem';
import { bumpCeilidhPulsesLifetime, bumpFirstTimeEvent } from '../utils/save';
import { comboDamageMultiplier } from './comboDamage';
import { globalEventBus } from '../core/GlobalEventBus';
import { TOAST_COLORS } from '../ui/toastPalette';
import { RING_TIMING } from './effectTimingPresets';
import { MOOR_MOMENT_TOKEN_KEYS } from '../art/sprites/moorMomentTokens';
import type { BossSpectaclePools } from './juice/bossSpectacle';
import { playBossDeathSpectacle, playMidRunBossDeathSpectacle } from './juice/bossSpectacle';
import { playEvolutionSpectacle } from './juice/evolutionSpectacle';
import { drawDangerVignette } from './juice/vignette';

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

  /** Pooled boss death spectacle state — 30 particles, 2 rings (+1 delayed) per boss kill. */
  private bossSpectaclePools: BossSpectaclePools = {
    particlePool: [],
    particleIdx: 0,
    ringPool: [],
    ringIdx: 0,
  };

  // Kill combo tracking
  private comboCount: number = 0;
  private comboTimer: number = 0;
  private readonly COMBO_TIMEOUT_MS = 1500;
  private comboText: Phaser.GameObjects.Text;

  // Toast stacking + live-toast registry (so modal-open can fade them).
  // P2.6 — concurrent visible count is capped (see MAX_VISIBLE_TOASTS);
  // overflow waits in `pendingToasts` and drains as live toasts retire.
  private activeToasts: number = 0;
  private liveToasts: Phaser.GameObjects.Text[] = [];
  private pendingToasts: Array<{ message: string; color: string }> = [];

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

  // Ceilidh toast throttle — pulse gameplay fires every 8 combo. Magnet
  // grant + audio + ring still fire each pulse; only the toast/caption is
  // gated so the right-side toast stack doesn't overflow during long streaks.
  private ceilidhToastCooldownMs: number = 0;
  private readonly CEILIDH_TOAST_COOLDOWN_MS = 5000;

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
    const comboUiScale = this.settings.load().uiScale;
    this.comboText = scene.add.text(width / 2, Math.max(height * 0.15, 140 * comboUiScale), '', {
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
    fillCirclePool(scene, this.bossSpectaclePools.particlePool, BALANCE.juice.bossParticlePoolSize, 5, COLORS.WHISKY_GOLD, 0.9, 20);
    fillCirclePool(scene, this.bossSpectaclePools.ringPool, BALANCE.juice.bossRingPoolSize, 10, COLORS.WHISKY_GOLD, 0.5, 20);
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
    // Combo text hides while ANY modal is up — old gate only checked
    // UI_PAUSE so the streak banner kept rendering on top of the
    // level-up / intermission / echo overlays.
    const modalActive = this.isModalActive();
    if (modalActive) {
      this.comboText.setVisible(false);
      // Edge-trigger on modal-open: fade out any in-flight toasts AND
      // hide ambient tutorial banners (drift, elite-affix, moor-moment,
      // one-shot tips). Pre-fix: tutorial banners had no modal gate so
      // they bled through the dim underlay even after toasts cleared
      // (P1.1 / P1.2 / P1.12).
      if (!this.uiPauseWasActive) {
        if (this.liveToasts.length > 0) this.dismissActiveToasts();
        try { this.scene.getTutorialSystem().setAmbientBannersVisible(false); } catch { /* ignore */ }
      }
    } else if (this.uiPauseWasActive) {
      // Edge-trigger on modal-close: restore ambient banners + combo if any.
      try { this.scene.getTutorialSystem().setAmbientBannersVisible(true); } catch { /* ignore */ }
      if (this.comboCount > 0) this.syncComboText();
    }
    this.uiPauseWasActive = modalActive;
    const timeScale = this.time.getEffectiveTimeScale();
    const scaledDelta = delta * timeScale;

    // Tick hit-freeze throttle (bound to timeScale so pause freezes cooldown)
    if (this.freezeCooldownMs > 0) this.freezeCooldownMs -= scaledDelta;
    if (this.ceilidhToastCooldownMs > 0) this.ceilidhToastCooldownMs -= scaledDelta;

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
          this.showToast(t('ui.game.combo_dropped_big', { count: droppedCount }), TOAST_COLORS.info);
        } else if (droppedCount >= 15) {
          this.showToast(t('ui.game.combo_dropped', { count: droppedCount }), TOAST_COLORS.info);
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

    const uiScale = this.settings.load().uiScale;
    text.setText(damage.toString());
    const jitter = Math.round(10 * uiScale);
    text.setPosition(x + Phaser.Math.Between(-jitter, jitter), y - Math.round(10 * uiScale));
    text.setVisible(true);
    text.setAlpha(1);

    // Scale with damage — big hits look big. Compound with uiScale so text
    // scale is legible for low-vision players without fighting the font size.
    const style = damageNumberStyle(damage, isCrit, this.comboCount);
    text.setScale(style.scale * uiScale);
    // Damage number colors: whisky gold palette, not cold white
    text.setColor(style.color);
    text.setRotation(Phaser.Math.FloatBetween(-0.25, 0.25));

    this.scene.tweens.add({
      targets: text,
      y: text.y - Math.round(25 * uiScale) - damage * 0.3,
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
  showKillBurst(x: number, y: number, color: number = 0xcc4444, opts?: { tier?: 'small' | 'medium' }): void {
    const lowFx = this.settings.load().reduceParticles;
    const dots = scaledParticleCount(lowFx ? 3 : 6, 2);

    // Sprite-based radial burst sits above pooled dots (depth 15) but below
    // boss particles (depth 20) and damage text (depth 80). Tier defaults to
    // small — elite kills opt into 'medium' via opts.tier so the larger
    // tartan-fleck radial reads above regular fodder. Boss kills route
    // through midRunBossDeathSpectacle (large tier) instead.
    const tier = opts?.tier ?? 'small';
    const burstKey = tier === 'medium' ? 'fx_enemy_burst_medium' : 'fx_enemy_burst_small';
    const startScale = tier === 'medium' ? 0.7 : 0.6;
    const endScale = tier === 'medium' ? 1.4 : 1.2;
    if (this.scene.textures.exists(burstKey)) {
      const burst = this.scene.add.image(x, y, burstKey)
        .setDepth(18)
        .setScale(startScale)
        .setAlpha(1);
      this.scene.tweens.add({
        targets: burst,
        scale: endScale,
        alpha: 0,
        duration: 280,
        ease: 'Quad.easeOut',
        onComplete: () => burst.destroy(),
      });
    }
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
      duration: RING_TIMING.tight,
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
      // B1 Phase 3 Task 18 — first-time reserved line on the *very first*
      // 100-combo streak any save ever reaches. Replays suppressed across
      // runs via `SaveData.firstTimeEventsFired`. Routed through the
      // scene's banter shim so the priority-110 `first_time` pool beats
      // the generic `combo_100` warning toast emitted a few lines down.
      if (bumpFirstTimeEvent('combo_100')) {
        this.scene.requestBanter('first_time', 'combo_100');
      }
    }

    if (this.comboCount >= 5) {
      this.syncComboText();

      // Pulse effect — milestones override with their own scale; default is subtle
      const milestoneVfx = resolveComboMilestoneVfx(this.comboCount);
      const baseScale = resolveComboDisplay(this.comboCount, this.comboTimer).scale;
      if (milestoneVfx) {
        this.scene.tweens.add({
          targets: this.comboText,
          scale: baseScale * milestoneVfx.pulseScale,
          duration: 150,
          yoyo: true,
        });
        if (milestoneVfx.flashColor !== null) {
          this.flashColored(milestoneVfx.flashColor, milestoneVfx.flashDurationMs);
        }
        if (milestoneVfx.burstParticles > 0) {
          this.comboMilestoneBurst(milestoneVfx.burstParticles);
        }
      } else {
        this.scene.tweens.add({
          targets: this.comboText,
          scale: baseScale * 1.2,
          duration: 100,
          yoyo: true,
        });
      }

      // Combo milestone cultural Easter eggs — Glesga patter at key numbers.
      // Captions piggyback on the toast copy — if a player is reading toasts,
      // the caption strip echoes them consistently.
      // Ceilidh Chain — every 8th kill in the streak, the moor picks
      // up the beat and the magnet pulses wider for 2s. A cheap joy
      // moment between the rare Glesga-patter milestones below. Uses
      // the same scene duck-call as captions (see combo_11 branch).
      if (isCeilidhPulseMoment(this.comboCount, this.scene.getCeilidhChainPeriod())) {
        const pl = this.scene.getPlayer();
        pl.grantCeilidhChainMagnet(CEILIDH_MAGNET_FLAT_PX, CEILIDH_MAGNET_DURATION_MS);
        const msg = t('ui.game.ceilidh_pulse');
        if (this.ceilidhToastCooldownMs <= 0) {
          this.showToast(msg, TOAST_COLORS.positive);
          this.scene.caption(`ceilidh_${this.comboCount}`, msg, TOAST_COLORS.positive);
          this.ceilidhToastCooldownMs = this.CEILIDH_TOAST_COOLDOWN_MS;
        }
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
        this.showToast(msg, TOAST_COLORS.reward);
        this.scene.caption(`combo_11`, msg, TOAST_COLORS.reward);
      } else if (this.comboCount === 50) {
        const msg = t('ui.game.combo_50');
        this.showToast(msg, TOAST_COLORS.reward);
        this.scene.caption(`combo_50`, msg, TOAST_COLORS.reward);
        // Rest beat — Great Moment Recipe (DESIGN_SOUL.md). Major milestone
        // gets a brief breath so the moment lands; guard inside slowMotion
        // skips overlap with boss-kill slow-mo. Skipped at 11 (too frequent).
        this.slowMotion(220);
      } else if (this.comboCount === 100) {
        const msg = t('ui.game.combo_100');
        this.showToast(msg, TOAST_COLORS.warning);
        this.scene.caption(`combo_100`, msg, TOAST_COLORS.warning);
        this.slowMotion(220);
      } else if (this.comboCount === 200) {
        const msg = t('ui.game.combo_200');
        this.showToast(msg, TOAST_COLORS.warning);
        this.scene.caption(`combo_200`, msg, TOAST_COLORS.warning);
        this.slowMotion(220);
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
    const dots = scaledParticleCount(lowFx ? 5 : 11, 3);
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
      duration: RING_TIMING.medium,
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
    if (!lowFx) {
      const tokenKey = MOOR_MOMENT_TOKEN_KEYS[
        Math.floor((this.scene.time.now + x + y) / 137) % MOOR_MOMENT_TOKEN_KEYS.length
      ];
      if (this.scene.textures.exists(tokenKey)) {
        const token = this.scene.add.image(x, y - 10, tokenKey)
          .setDepth(56)
          .setAlpha(0.96)
          .setScale(0.85);
        this.scene.tweens.add({
          targets: token,
          y: y - 34,
          scale: 1.1,
          rotation: Phaser.Math.FloatBetween(-0.22, 0.22),
          alpha: 0,
          duration: 760,
          ease: 'Sine.easeOut',
          onComplete: () => token.destroy(),
        });
      }
    }
    if (s.screenShake) {
      const amp = 0.0038 * s.motionScale;
      if (amp > 0) this.scene.cameras.main.shake(260, amp);
    }
  }

  /**
   * Returns true while any full-screen modal is active. Toasts/banter/combo
   * text suppress themselves while a modal is up so they don't bleed through
   * the dim underlay (pre-fix: streak banner + banter rendered on top of the
   * level-up cards; see audit 06a / 05g).
   */
  private isModalActive(): boolean {
    return this.time.has('UI_PAUSE')
      || this.time.has('LEVEL_UP')
      || this.time.has('ECHO')
      || this.time.has('RUN_END')
      || this.time.has('ACT_INTERMISSION')
      || this.time.has('COUNTDOWN');
  }

  /**
   * Toast notification — slides in from the right and fades out.
   *
   * P2.6 single-lane queue: at most `MAX_VISIBLE_TOASTS` are rendered
   * at once. Excess goes through `pendingToasts` and is spawned as
   * live toasts retire. A bounded backlog drops the OLDEST pending
   * entry on overflow — late signals are usually the most relevant
   * once the player is already mid-flurry.
   */
  showToast(message: string, color: string = COLORS_CSS.WHITE): void {
    if (this.isModalActive()) return;
    const decision = decideEnqueue(this.activeToasts, this.pendingToasts.length);
    if (decision.kind === 'spawn-now') {
      this.spawnToastNow(message, color);
      return;
    }
    if (decision.kind === 'queue-with-drop') {
      this.pendingToasts.splice(decision.droppedIndex, 1);
    }
    this.pendingToasts.push({ message, color });
  }

  /** Render a toast immediately. Caller is responsible for the queue gate. */
  private spawnToastNow(message: string, color: string): void {
    const { x, y, width } = this.getUiViewport();
    const yOffset = toastStackY(y, this.activeToasts);
    this.activeToasts++;

    const wrapW = toastWrapWidth(width);
    const toast = this.scene.add.text(x + width + 10, yOffset, message, {
      fontFamily: 'monospace', fontSize: scaledFontSize(16), color,
      fontStyle: 'bold', stroke: COLORS_CSS.INK, strokeThickness: scaledStrokeThickness(3),
      backgroundColor: '#1a1a2ecc', padding: { x: 10, y: 5 },
      wordWrap: { width: wrapW },
    }).setScrollFactor(0).setDepth(85).setOrigin(1, 0);
    this.liveToasts.push(toast);

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
            const idx = this.liveToasts.indexOf(toast);
            if (idx >= 0) this.liveToasts.splice(idx, 1);
            toast.destroy();
            this.activeToasts = Math.max(0, this.activeToasts - 1);
            this.drainPendingToast();
          },
        });
      },
    });
  }

  /** Pop the oldest pending toast and spawn it, if any. */
  private drainPendingToast(): void {
    if (this.pendingToasts.length === 0) return;
    if (this.activeToasts >= 0 && this.isModalActive()) {
      // Modal opened during the lane's lifetime — flush the queue so
      // we don't crash the modal banner with a delayed-arrival toast
      // the moment the player exits the menu. Matches the
      // dismissActiveToasts contract.
      this.pendingToasts.length = 0;
      return;
    }
    const next = this.pendingToasts.shift();
    if (next) this.spawnToastNow(next.message, next.color);
  }

  /**
   * Fade out every active toast immediately. Modal-open hooks (level-up,
   * pause, intermission) call this so prior banter / kill-log toasts
   * don't render on top of the modal title (audit 06a / 05g).
   *
   * Also clears the pending-toast queue — players should not see a
   * trickle of stale signals re-emerge once the modal closes.
   */
  dismissActiveToasts(): void {
    this.pendingToasts.length = 0;
    for (const toast of this.liveToasts.slice()) {
      this.scene.tweens.killTweensOf(toast);
      this.scene.tweens.add({
        targets: toast, alpha: 0, duration: 180,
        onComplete: () => {
          const idx = this.liveToasts.indexOf(toast);
          if (idx >= 0) this.liveToasts.splice(idx, 1);
          toast.destroy();
          this.activeToasts = Math.max(0, this.activeToasts - 1);
        },
      });
    }
  }

  /**
   * White screen flash (level-up, big event). Alpha scales with
   * motionScale; under `reduceFlashing` alpha is capped at 0.4 and
   * fade duration is floored at 200ms so the flash reads as a ramp.
   */
  flashWhite(duration = 200): void {
    const alpha = scaledFlashAlpha(0.4);
    if (alpha <= 0) return;
    this.scene.tweens.killTweensOf(this.flashRect);
    this.flashRect.setFillStyle(0xffffff);
    this.flashRect.setAlpha(alpha);
    this.scene.tweens.add({
      targets: this.flashRect,
      alpha: 0,
      duration: scaledFlashDurationMs(duration),
    });
  }

  /**
   * Colored screen flash — used for combo milestone VFX. Alpha scales
   * with motionScale; respects reduceFlashing caps on both alpha and
   * fade duration.
   */
  private flashColored(color: number, duration: number): void {
    const alpha = scaledFlashAlpha(0.35);
    if (alpha <= 0) return;
    this.scene.tweens.killTweensOf(this.flashRect);
    this.flashRect.setFillStyle(color);
    this.flashRect.setAlpha(alpha);
    this.scene.tweens.add({
      targets: this.flashRect,
      alpha: 0,
      duration: scaledFlashDurationMs(duration),
    });
  }

  /** Gold particle burst radiating from combo text — camera-locked. */
  private comboMilestoneBurst(count: number): void {
    const cx = this.comboText.x;
    const cy = this.comboText.y;
    for (let i = 0; i < count; i++) {
      const dot = this.burstDotPool[this.burstDotIdx];
      this.burstDotIdx = (this.burstDotIdx + 1) % this.burstDotPool.length;
      this.scene.tweens.killTweensOf(dot);
      const angle = (i / count) * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      dot.setPosition(cx, cy);
      dot.setScrollFactor(0);
      dot.setFillStyle(0xffd700, 0.8);
      dot.setRadius(2);
      dot.setVisible(true);
      this.scene.tweens.add({
        targets: dot,
        x: cx + Math.cos(angle) * speed,
        y: cy + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 400 + Math.random() * 200,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          dot.setVisible(false);
          dot.setScrollFactor(1);
          dot.setAlpha(0.8);
          dot.setScale(1);
        },
      });
    }
  }

  /**
   * Red screen flash (damage taken). Alpha scales with motionScale;
   * under `reduceFlashing` alpha is capped at 0.4 and fade duration
   * is floored at 200ms (the red-flash default of 150ms trips PEAT
   * "red flash" thresholds, so the floor genuinely matters here).
   */
  flashRed(duration = 150): void {
    const alpha = scaledFlashAlpha(0.25);
    if (alpha <= 0) return;
    this.scene.tweens.killTweensOf(this.flashRect);
    this.flashRect.setFillStyle(0xff0000);
    this.flashRect.setAlpha(alpha);
    this.scene.tweens.add({
      targets: this.flashRect,
      alpha: 0,
      duration: scaledFlashDurationMs(duration),
    });
  }

  private drawVignette(): void {
    drawDangerVignette(this.vignette, this.layoutWidth, this.layoutHeight);
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
    this.comboText.setScale(state.scale);
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
    playBossDeathSpectacle(x, y, this.bossSpectacleDeps());
  }

  /** Mid-run boss kill — between regular killBurst and the full victory
   *  bossDeathSpectacle. 15 gold particles + 1 expanding ring + lighter shake. */
  midRunBossDeathSpectacle(x: number, y: number): void {
    playMidRunBossDeathSpectacle(x, y, this.bossSpectacleDeps());
  }

  private bossSpectacleDeps() {
    return {
      scene: this.scene,
      settings: this.settings,
      pools: this.bossSpectaclePools,
      flashWhite: (durationMs?: number) => this.flashWhite(durationMs),
      scheduleRawOnce: (delayMs: number, cb: () => void) => this.tickers.addOnce('raw', delayMs, cb),
    };
  }

  /** Weapon evolution spectacle — THE peak reward moment of the game.
   *  Legendary golden manifestation: radial beams, rings, particles, banner. */
  evolutionSpectacle(x: number, y: number, legendaryName: string): void {
    playEvolutionSpectacle(x, y, legendaryName, {
      scene: this.scene,
      settings: this.settings,
      time: this.time,
      flashWhite: (durationMs?: number) => this.flashWhite(durationMs),
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

  /**
   * Wall-clock timeouts that must not fire after this system is destroyed
   * (GameScene recycles; `scene.sys.isActive('Game')` can be true for the
   * next run — same as AudioSystem `pendingTimers` + `resetTransient`.)
   */
  private pendingWallClockHandles = new Set<ReturnType<typeof setTimeout>>();

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

  /** Ascending gold sparkle rain — victory celebration, 2 seconds of rising dots. */
  victorySparkleRain(): void {
    if (this.settings.load().reduceParticles) return;
    for (const h of this.pendingWallClockHandles) clearTimeout(h);
    this.pendingWallClockHandles.clear();
    const scene = this.scene;
    const sparkleColors = [0xffd700, 0xffffff, 0xffee88];
    const total = 30;
    const interval = 66; // ~66ms between spawns ≈ 2s total
    // Scene reference guard — if scene restarts, captured ref becomes stale.
    const sceneRef = scene;
    for (let i = 0; i < total; i++) {
      const handle = setTimeout(() => {
        this.pendingWallClockHandles.delete(handle);
        // Guard: scene may have been restarted or destroyed.
        if (!sceneRef.scene.isActive(sceneRef.scene.key)) return;
        const vp = getCameraViewport(sceneRef);
        const sx = vp.x + Math.random() * vp.width;
        const sy = vp.y + vp.height + 10;
        const color = Phaser.Utils.Array.GetRandom(sparkleColors) as number;
        const dot = sceneRef.add.circle(sx, sy, 2, color, 0.8)
          .setScrollFactor(0).setDepth(50);
        const drift = (Math.random() - 0.5) * 60;
        sceneRef.tweens.add({
          targets: dot,
          y: vp.y - 20,
          x: sx + drift,
          alpha: 0,
          duration: 1800 + Math.random() * 400,
          ease: 'Sine.easeIn',
          onComplete: () => dot.destroy(),
        });
      }, 500 + i * interval);
      this.pendingWallClockHandles.add(handle);
    }
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
    for (const h of this.pendingWallClockHandles) clearTimeout(h);
    this.pendingWallClockHandles.clear();
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
    killAndDestroy(this.bossSpectaclePools.particlePool);
    killAndDestroy(this.bossSpectaclePools.ringPool);
    this.dmgTextPool = [];
    this.impactRingPool = [];
    this.trailPool = [];
    this.burstDotPool = [];
    this.burstRingPool = [];
    this.bossSpectaclePools.particlePool = [];
    this.bossSpectaclePools.ringPool = [];
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
    // P1.8 — clamp combo text to viewport width (was clipping both edges
    // of "63x streak · +30% wallop" on 390-px iPhones). Wrap kicks in on
    // mobile, the line keeps growing on desktop.
    this.comboText.setStyle({ wordWrap: { width: Math.max(220, width - 24) } });
    this.vignette.setPosition(x, y);
    if (sizeChanged) this.drawVignette();
  }
}
