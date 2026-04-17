import Phaser from 'phaser';
import { COLORS_CSS } from '../config';
import { getSettingsManager } from '../core/SettingsManager';
import type { ISceneContext } from '../core/ISceneContext';
import { resolveXpGemTier } from './xpGemTier';
import { xpGemMagnetSpeed } from './xpGemMagnet';
import { TWEEN_INFINITE_BREATHE } from '../utils/tweenPresets';

/**
 * XP Gem ("Whisky Drop") — poolable pickup that grants XP.
 * When within the player's pickup radius, magnetically accelerates toward them.
 */
export class XPGem extends Phaser.Physics.Arcade.Sprite {
  private xpValue: number = 1;
  private magnetized: boolean = false;
  private valueLabel: Phaser.GameObjects.Text | null = null;
  /** Soft aura circle that sits behind high-value gems for visibility at range */
  private aura: Phaser.GameObjects.Arc | null = null;
  private settleHandle: import('../utils/UpdateTickers').TickerHandle | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'xp_gem');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
  }

  /** Drop this gem at a position with a given XP value */
  drop(x: number, y: number, value: number): void {
    this.settleHandle?.cancel();
    this.settleHandle = null;
    this.scene.tweens.killTweensOf(this); // Kill stale tweens from prior pool cycle
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.xpValue = value;
    this.magnetized = false;
    this.setVelocity(0, 0);

    // Scale and tint by value — high-value gems are bigger and brighter
    const tier = resolveXpGemTier(value);
    this.setScale(tier.scale);
    this.clearTint();
    if (tier.tint !== null) this.setTint(tier.tint);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;

    // Slight random scatter on spawn
    this.setVelocity(
      Phaser.Math.FloatBetween(-30, 30),
      Phaser.Math.FloatBetween(-30, 30)
    );

    // Slow down scatter
    const tickers = (this.scene as Phaser.Scene & ISceneContext).getUpdateTickers?.();
    this.settleHandle = tickers?.addOnce('scaled', 200, () => {
      if (this.active) this.setVelocity(0, 0);
    }) ?? null;

    // Show value label for high-value gems (3+). Font size scales with
    // uiScale so players on a 1.4x comfort setting can actually read the
    // number instead of seeing a smudge next to the gem.
    if (tier.showLabel) {
      if (!this.valueLabel) {
        const uiScale = getSettingsManager().load().uiScale;
        const px = Math.max(8, Math.round(11 * uiScale));
        this.valueLabel = this.scene.add.text(0, 0, '', {
          fontFamily: 'monospace', fontSize: `${px}px`, color: COLORS_CSS.WHITE,
          fontStyle: 'bold', stroke: '#000', strokeThickness: 2,
        }).setDepth(15).setOrigin(0.5);
      }
      this.valueLabel.setText(`${value}`).setPosition(x, y - 12).setVisible(true).setAlpha(1);
    } else {
      this.valueLabel?.setVisible(false);
    }

    // Glow aura for high-value gems — a soft circle behind the gem visible
    // from farther away, so rare drops are easy to spot.
    if (tier.aura) {
      const { color: auraColor, radius: auraRadius } = tier.aura;
      if (!this.aura) {
        this.aura = this.scene.add.circle(x, y, auraRadius, auraColor, 0.25).setDepth(4);
      } else {
        this.aura.setPosition(x, y).setRadius(auraRadius).setFillStyle(auraColor, 0.25);
      }
      this.aura.setVisible(true).setActive(true);
      this.scene.tweens.killTweensOf(this.aura);
      this.scene.tweens.add({
        targets: this.aura,
        scale: { from: 0.8, to: 1.3 },
        alpha: { from: 0.2, to: 0.5 },
        duration: 600,
        ...TWEEN_INFINITE_BREATHE,
      });
    } else if (this.aura) {
      // Kill the infinite tween before hiding — otherwise a previous high-value
      // drop's pulse keeps running on the hidden aura and leaks across drops.
      this.scene.tweens.killTweensOf(this.aura);
      this.aura.setVisible(false);
    }

    // Gentle glow pulse + lazy rotation — use relative scale so high-value
    // gems stay big.
    const baseScale = this.scaleX;
    this.setAlpha(0.9);
    this.setRotation(0);
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.7, to: 1 },
      scale: { from: baseScale * 0.9, to: baseScale * 1.15 },
      duration: 400 + Math.random() * 300,
      ...TWEEN_INFINITE_BREATHE,
    });
    // Slow continuous rotation — feels alive
    this.scene.tweens.add({
      targets: this,
      rotation: Math.PI * 2,
      duration: 2500 + Math.random() * 500,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** Check if within pickup radius and magnetize toward player.
   *  Squared-distance compare gates the magnet toggle without ever calling
   *  sqrt — ~200 gems per frame, most of them outside the radius, no
   *  longer pay for a sqrt that's only needed when the gem actually moves.
   *  When magnetized we still need the real distance for the speed ramp,
   *  but the geometric form (dx/dist, dy/dist) replaces the atan2→cos→sin
   *  round-trip with a single division. */
  updateMagnet(playerX: number, playerY: number, pickupRadius: number): void {
    if (!this.active) return;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < pickupRadius * pickupRadius) {
      this.magnetized = true;
    }

    if (this.magnetized) {
      const dist = Math.sqrt(distSq);
      if (dist > 1e-6) {
        // Accelerate toward player — gets faster as it gets closer.
        const speed = xpGemMagnetSpeed(dist);
        const inv = speed / dist;
        this.setVelocity(dx * inv, dy * inv);
      }
    }

    // Update value label + aura position
    if (this.valueLabel?.visible) {
      this.valueLabel.setPosition(this.x, this.y - 12);
    }
    if (this.aura?.visible) {
      this.aura.setPosition(this.x, this.y);
    }
  }

  /** Force this gem to magnetize (used by XP vacuum on level-up) */
  forceCollect(): void {
    this.magnetized = true;
  }

  collect(): number {
    const value = this.xpValue;
    this.settleHandle?.cancel();
    this.settleHandle = null;
    this.scene.tweens.killTweensOf(this); // Stop infinite pulse tween
    if (this.aura) this.scene.tweens.killTweensOf(this.aura);
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    this.setRotation(0);
    this.valueLabel?.setVisible(false);
    this.aura?.setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    return value;
  }

  getXpValue(): number { return this.xpValue; }

  /**
   * XPGem lazily creates two independent display-list objects (`valueLabel`
   * Text, `aura` Arc). Without this override they orphan in the scene's
   * display list when the gem is destroyed, holding refs and blocking GC
   * until the scene fully stops.
   */
  destroy(fromScene?: boolean): void {
    this.settleHandle?.cancel();
    this.settleHandle = null;
    if (this.valueLabel) {
      this.scene?.tweens.killTweensOf(this.valueLabel);
      this.valueLabel.destroy();
      this.valueLabel = null;
    }
    if (this.aura) {
      this.scene?.tweens.killTweensOf(this.aura);
      this.aura.destroy();
      this.aura = null;
    }
    super.destroy(fromScene);
  }
}
