import Phaser from 'phaser';

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
    this.scene.tweens.killTweensOf(this); // Kill stale tweens from prior pool cycle
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.xpValue = value;
    this.magnetized = false;
    this.setVelocity(0, 0);

    // Scale and tint by value — high-value gems are bigger and brighter
    this.setScale(Math.min(2, 0.8 + value * 0.15));
    this.clearTint();
    if (value >= 5) this.setTint(0xffffff);       // boss gems: bright white
    else if (value >= 3) this.setTint(0xffee66);   // elite gems: pale gold

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;

    // Slight random scatter on spawn
    this.setVelocity(
      Phaser.Math.FloatBetween(-30, 30),
      Phaser.Math.FloatBetween(-30, 30)
    );

    // Slow down scatter
    this.scene.time.delayedCall(200, () => {
      if (this.active) this.setVelocity(0, 0);
    });

    // Show value label for high-value gems (3+)
    if (value >= 3) {
      if (!this.valueLabel) {
        this.valueLabel = this.scene.add.text(0, 0, '', {
          fontFamily: 'monospace', fontSize: '11px', color: '#ffffff',
          fontStyle: 'bold', stroke: '#000', strokeThickness: 2,
        }).setDepth(15).setOrigin(0.5);
      }
      this.valueLabel.setText(`${value}`).setPosition(x, y - 12).setVisible(true).setAlpha(1);
    } else {
      this.valueLabel?.setVisible(false);
    }

    // Glow aura for high-value gems — a soft circle behind the gem visible
    // from farther away, so rare drops are easy to spot.
    if (value >= 3) {
      const auraColor = value >= 5 ? 0xffffff : 0xffee66;
      const auraRadius = value >= 5 ? 14 : 10;
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
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
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
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // Slow continuous rotation — feels alive
    this.scene.tweens.add({
      targets: this,
      rotation: Math.PI * 2,
      duration: 2500 + Math.random() * 500,
      repeat: -1,
      ease: 'Linear',
    });
  }

  /** Check if within pickup radius and magnetize toward player */
  updateMagnet(playerX: number, playerY: number, pickupRadius: number): void {
    if (!this.active) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);

    if (dist < pickupRadius) {
      this.magnetized = true;
    }

    if (this.magnetized) {
      // Accelerate toward player — gets faster as it gets closer
      const speed = Math.max(400, 800 - dist * 2);
      const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
      this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
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
}
