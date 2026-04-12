import Phaser from 'phaser';
import type { SettingsManager } from '../core/SettingsManager';
import { getSettingsManager } from '../core/SettingsManager';
import { TimeManager } from './TimeManager';
import { t } from '../core/i18n';
import { getCameraViewport } from '../ui/cameraViewport';

/**
 * JuiceSystem — visual feedback effects.
 * - Floating damage numbers
 * - Kill burst effects
 * - Kill combo counter
 * - Screen shake
 * - Slow-motion
 */
export class JuiceSystem {
  private scene: Phaser.Scene;
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
  private layoutX = 0;
  private layoutY = 0;
  private layoutWidth = 0;
  private layoutHeight = 0;
  private layoutZoom = 1;

  // Hit-freeze throttling (engine mutations handled by TimeManager)
  private freezeCooldownMs: number = 0;

  private slowMotionRemainingMs: number = 0;

  constructor(
    scene: Phaser.Scene,
    time: TimeManager,
    tickers: import('../utils/UpdateTickers').UpdateTickers,
    settings?: SettingsManager
  ) {
    this.scene = scene;
    this.time = time;
    this.tickers = tickers;
    this.settings = settings ?? getSettingsManager();

    const { x, y, width, height, zoom } = this.getUiViewport();
    this.layoutX = x;
    this.layoutY = y;
    this.layoutWidth = width;
    this.layoutHeight = height;
    this.layoutZoom = zoom;

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
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
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
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(90).setVisible(false);

    // Pre-allocate impact ring pool — 80 slots covers AoE weapons hitting
    // 30+ enemies per pulse without dropping hit feedback.
    for (let i = 0; i < 80; i++) {
      const r = scene.add.circle(0, 0, 4, 0xffffff, 0.8)
        .setDepth(12)
        .setVisible(false);
      this.impactRingPool.push(r);
    }

    // Pre-allocate trail dot pool (spawnTrail — ~200/sec at peak, 200ms lifetime)
    for (let i = 0; i < 60; i++) {
      const dot = scene.add.circle(0, 0, 2, 0x9966cc, 0.5)
        .setDepth(5).setVisible(false);
      this.trailPool.push(dot);
    }

    // Pre-allocate kill burst pools
    for (let i = 0; i < 50; i++) {
      const dot = scene.add.circle(0, 0, 3, 0xcc4444, 0.8)
        .setDepth(15).setVisible(false);
      this.burstDotPool.push(dot);
    }
    for (let i = 0; i < 15; i++) {
      const ring = scene.add.circle(0, 0, 5, 0xffffff, 0.6)
        .setDepth(15).setVisible(false);
      this.burstRingPool.push(ring);
    }

    // Pre-allocate boss death spectacle pools
    for (let i = 0; i < 35; i++) {
      const p = scene.add.circle(0, 0, 5, 0xd4a017, 0.9)
        .setDepth(20).setVisible(false);
      this.bossParticlePool.push(p);
    }
    for (let i = 0; i < 5; i++) {
      const ring = scene.add.circle(0, 0, 10, 0xd4a017, 0.5)
        .setDepth(20).setVisible(false);
      this.bossRingPool.push(ring);
    }
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
        this.comboCount = 0;
        this.syncComboText();
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

    // Scale with damage — big hits look big
    const sizeScale = Math.min(2.0, 0.8 + damage * 0.04);
    text.setScale(isCrit ? sizeScale * 1.4 : sizeScale);
    text.setColor(isCrit ? '#ffff00' : damage >= 20 ? '#ffcc44' : '#ffffff');
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

    if (this.comboCount >= 5) {
      this.syncComboText();

      // Pulse effect
      this.scene.tweens.add({
        targets: this.comboText,
        scale: 1.2,
        duration: 100,
        yoyo: true,
      });

      // Screen flash at major combo milestones
      if (this.comboCount === 50 || this.comboCount === 100 || this.comboCount === 200) {
        this.flashWhite(100);
      }
    }
  }

  /** Toast notification — slides in from the right and fades out, stacks vertically */
  showToast(message: string, color: string = '#ffffff'): void {
    const { x, y, width } = this.getUiViewport();
    const stackIndex = Math.min(this.activeToasts, 2);
    const yOffset = y + 130 + stackIndex * 36;
    this.activeToasts++;

    const wrapW = Math.max(160, Math.min(420, width - 24));
    const toast = this.scene.add.text(x + width + 10, yOffset, message, {
      fontFamily: 'monospace', fontSize: '16px', color,
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
      backgroundColor: '#00000088', padding: { x: 10, y: 5 },
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

  /** White screen flash (level-up, big event) */
  flashWhite(duration = 200): void {
    this.scene.tweens.killTweensOf(this.flashRect);
    this.flashRect.setFillStyle(0xffffff);
    this.flashRect.setAlpha(0.4);
    this.scene.tweens.add({
      targets: this.flashRect,
      alpha: 0,
      duration,
    });
  }

  /** Red screen flash (damage taken) */
  flashRed(duration = 150): void {
    this.scene.tweens.killTweensOf(this.flashRect);
    this.flashRect.setFillStyle(0xff0000);
    this.flashRect.setAlpha(0.25);
    this.scene.tweens.add({
      targets: this.flashRect,
      alpha: 0,
      duration,
    });
  }

  /** Draw the vignette shape — radial gradient from transparent center to red edges */
  private drawVignette(): void {
    const w = this.layoutWidth;
    const h = this.layoutHeight;
    const gfx = this.vignette;
    gfx.clear();

    // Draw concentric rectangles getting more opaque at edges
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const inset = (1 - t) * 80;
      const alpha = t * t * 0.6; // Quadratic falloff — heavy at edges
      gfx.fillStyle(0xcc0000, alpha);
      gfx.fillRect(0, 0, w, inset);           // top
      gfx.fillRect(0, h - inset, w, inset);   // bottom
      gfx.fillRect(0, 0, inset, h);           // left
      gfx.fillRect(w - inset, 0, inset, h);   // right
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
    const bonus = Math.min(0.5, Math.floor(this.comboCount / 10) * 0.05);
    return 1 + bonus;
  }

  private syncComboText(): void {
    if (this.comboCount < 5 || this.comboTimer <= 0) {
      this.comboText.setVisible(false);
      this.comboText.setColor('#ff8800');
      return;
    }
    const dmgBonus = Math.min(50, Math.floor(this.comboCount / 10) * 5);
    const bonusText = dmgBonus > 0 ? t('ui.hud.combo_bonus', { pct: dmgBonus }) : '';
    this.comboText.setText(t('ui.hud.combo', { count: this.comboCount, bonus: bonusText }));
    this.comboText.setVisible(true);
    this.comboText.setScale(1);
    if (this.comboCount >= 50) {
      this.comboText.setColor('#ff0000');
    } else if (this.comboCount >= 20) {
      this.comboText.setColor('#ff4400');
    } else {
      this.comboText.setColor('#ff8800');
    }
  }

  /** Heavy screen shake for boss events */
  bossShake(): void {
    if (!this.settings.load().screenShake) return;
    this.scene.cameras.main.shake(400, 0.015);
  }

  /** Boss kill celebration — gold particle shower + expanded kill burst */
  bossDeathSpectacle(x: number, y: number): void {
    const lowFx = this.settings.load().reduceParticles;
    const shakeOn = this.settings.load().screenShake;
    // Big white flash
    this.flashWhite(400);

    if (shakeOn) {
      this.scene.cameras.main.shake(600, 0.025);
    }

    const particleCount = lowFx ? 12 : 30;
    // Gold particle shower — pooled
    const goldColors = [0xd4a017, 0xffcc44, 0xffdd66, 0xeebb00];
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 80 + Math.random() * 200;
      const size = Phaser.Math.Between(3, 8);
      const color = Phaser.Utils.Array.GetRandom(goldColors) as number;
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
    ring.setFillStyle(0xd4a017, 0.5);
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

    // Second delayed ring — pooled
    this.tickers.addOnce('scaled', 150, () => {
      const ring2 = this.bossRingPool[this.bossRingIdx];
      this.bossRingIdx = (this.bossRingIdx + 1) % this.bossRingPool.length;
      this.scene.tweens.killTweensOf(ring2);
      ring2.setPosition(x, y);
      ring2.setRadius(10);
      ring2.setFillStyle(0xffcc44, 0.3);
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

  /** Brief slow-motion effect — guarded against overlapping calls */
  private slowMotionActive = false;
  slowMotion(durationMs = 300): void {
    if (this.slowMotionActive) return; // Prevent overlapping slow-mo
    this.slowMotionActive = true;
    this.slowMotionRemainingMs = durationMs;
    this.time.requestForDuration('SLOW_MO', { timeScale: 0.3 }, durationMs);
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
    this.layoutX = x;
    this.layoutY = y;
    this.layoutWidth = width;
    this.layoutHeight = height;
    this.layoutZoom = zoom;

    this.flashRect.setPosition(x + width / 2, y + height / 2);
    this.flashRect.width = width;
    this.flashRect.height = height;
    this.comboText.setPosition(x + width / 2, y + Math.max(height * 0.2, 128 / Math.max(0.001, zoom)));
    this.vignette.setPosition(x, y);
    if (sizeChanged) this.drawVignette();
  }
}
