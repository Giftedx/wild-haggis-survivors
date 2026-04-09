import Phaser from 'phaser';

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
  private dmgTextPool: Phaser.GameObjects.Text[] = [];

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

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Danger vignette — red border glow, hidden by default
    this.vignette = scene.add.graphics().setScrollFactor(0).setDepth(45).setAlpha(0);
    this.drawVignette();

    // Screen flash overlay — used for level-up/damage flashes
    this.flashRect = scene.add.rectangle(
      scene.scale.width / 2, scene.scale.height / 2,
      scene.scale.width, scene.scale.height,
      0xffffff, 0
    ).setScrollFactor(0).setDepth(95);

    // Pre-allocate damage text pool
    for (let i = 0; i < 30; i++) {
      const t = scene.add.text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2,
      }).setDepth(80).setVisible(false);
      this.dmgTextPool.push(t);
    }

    // Combo text — fixed to screen, shows during streaks
    this.comboText = scene.add.text(scene.scale.width / 2, scene.scale.height * 0.15, '', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ff8800',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(90).setVisible(false);
  }

  /** Call each frame */
  update(delta: number, hpFraction?: number): void {
    // Combo timer
    if (this.comboCount > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboText.setVisible(false);
        this.comboText.setColor('#ff8800'); // Reset to base color for next combo
      }
    }

    // Danger vignette — pulse when HP < 30%
    if (hpFraction !== undefined && hpFraction < 0.3 && hpFraction > 0) {
      this.vignetteAlpha += this.vignetteDirection * delta * 0.002;
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
    const text = this.dmgTextPool.find(t => !t.visible);
    if (!text) return;

    text.setText(damage.toString());
    text.setPosition(x + Phaser.Math.Between(-10, 10), y - 10);
    text.setVisible(true);
    text.setAlpha(1);
    text.setScale(isCrit ? 1.3 : 1);
    text.setColor(isCrit ? '#ffff00' : '#ffffff');

    this.scene.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => text.setVisible(false),
    });
  }

  /** Spawn a fading trail particle at a position (call from update for projectiles) */
  spawnTrail(x: number, y: number, color: number = 0x9966cc): void {
    const dot = this.scene.add.circle(x, y, 2, color, 0.5);
    this.scene.tweens.add({
      targets: dot,
      alpha: 0,
      scale: 0.3,
      duration: 200,
      onComplete: () => dot.destroy(),
    });
  }

  /** Visual burst when an enemy dies — colored particles + combo tracking */
  showKillBurst(x: number, y: number, color: number = 0xcc4444): void {
    // Particle burst — 6 small dots scatter outward
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const dot = this.scene.add.circle(x, y, Phaser.Math.Between(2, 4), color, 0.8);
      this.scene.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * Phaser.Math.Between(15, 30),
        y: y + Math.sin(angle) * Phaser.Math.Between(15, 30),
        alpha: 0,
        scale: 0,
        duration: 250 + Math.random() * 150,
        onComplete: () => dot.destroy(),
      });
    }
    // Expanding ring
    const ring = this.scene.add.circle(x, y, 5, 0xffffff, 0.6);
    this.scene.tweens.add({
      targets: ring,
      radius: 20,
      alpha: 0,
      duration: 200,
      onComplete: () => ring.destroy(),
    });

    // Track combo
    this.comboCount++;
    this.comboTimer = this.COMBO_TIMEOUT_MS;

    if (this.comboCount >= 5) {
      this.comboText.setText(`${this.comboCount}x COMBO!`);
      this.comboText.setVisible(true);
      this.comboText.setScale(1);
      this.comboText.setColor('#ff8800'); // Reset to base before escalation check

      // Pulse effect
      this.scene.tweens.add({
        targets: this.comboText,
        scale: 1.2,
        duration: 100,
        yoyo: true,
      });

      // Color escalation
      if (this.comboCount >= 50) {
        this.comboText.setColor('#ff0000');
      } else if (this.comboCount >= 20) {
        this.comboText.setColor('#ff4400');
      } else if (this.comboCount >= 10) {
        this.comboText.setColor('#ff8800');
      }
    }
  }

  /** Toast notification — slides in from the right and fades out, stacks vertically */
  showToast(message: string, color: string = '#ffffff'): void {
    const { width } = this.scene.scale;
    const yOffset = 70 + this.activeToasts * 28;
    this.activeToasts++;

    const toast = this.scene.add.text(width + 10, yOffset, message, {
      fontFamily: 'monospace', fontSize: '13px', color,
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
      backgroundColor: '#00000088', padding: { x: 8, y: 4 },
    }).setScrollFactor(0).setDepth(85).setOrigin(1, 0);

    // Slide in
    this.scene.tweens.add({
      targets: toast,
      x: width - 10,
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
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
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

  /** Heavy screen shake for boss events */
  bossShake(): void {
    this.scene.cameras.main.shake(400, 0.015);
  }

  /** Boss kill celebration — gold particle shower + expanded kill burst */
  bossDeathSpectacle(x: number, y: number): void {
    // Big white flash
    this.flashWhite(400);

    // Heavy shake
    this.scene.cameras.main.shake(600, 0.025);

    // Gold particle shower — 30 particles in all directions
    const goldColors = [0xd4a017, 0xffcc44, 0xffdd66, 0xeebb00];
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 80 + Math.random() * 200;
      const size = Phaser.Math.Between(3, 8);
      const color = Phaser.Utils.Array.GetRandom(goldColors) as number;
      const particle = this.scene.add.circle(x, y, size, color, 0.9);
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 800 + Math.random() * 600,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }

    // Expanding ring
    const ring = this.scene.add.circle(x, y, 10, 0xd4a017, 0.5);
    this.scene.tweens.add({
      targets: ring,
      radius: 80,
      alpha: 0,
      duration: 500,
      onComplete: () => ring.destroy(),
    });

    // Second delayed ring
    this.scene.time.delayedCall(150, () => {
      const ring2 = this.scene.add.circle(x, y, 10, 0xffcc44, 0.3);
      this.scene.tweens.add({
        targets: ring2,
        radius: 120,
        alpha: 0,
        duration: 600,
        onComplete: () => ring2.destroy(),
      });
    });
  }

  /** Hit freeze — 20ms time pause on kill for combat impact.
   *  Throttled to max once per 100ms to prevent stutter during AoE. */
  private lastFreezeTime = 0;
  hitFreeze(): void {
    const now = performance.now();
    if (now - this.lastFreezeTime < 100) return;
    this.lastFreezeTime = now;
    this.scene.time.timeScale = 0;
    this.scene.time.delayedCall(1, () => { // 1 tick at timeScale 0 ≈ ~20ms
      if (!this.slowMotionActive) {
        this.scene.time.timeScale = 1;
      }
    });
  }

  /** Brief slow-motion effect — guarded against overlapping calls */
  private slowMotionActive = false;
  slowMotion(durationMs = 300): void {
    if (this.slowMotionActive) return; // Prevent overlapping slow-mo
    this.slowMotionActive = true;

    this.scene.time.timeScale = 0.3;
    this.scene.time.delayedCall(durationMs * 0.3, () => {
      this.scene.time.timeScale = 1;
      this.slowMotionActive = false;
    });
  }
}
