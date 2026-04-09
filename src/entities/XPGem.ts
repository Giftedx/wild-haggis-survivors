import Phaser from 'phaser';

/**
 * XP Gem ("Whisky Drop") — poolable pickup that grants XP.
 * When within the player's pickup radius, magnetically accelerates toward them.
 */
export class XPGem extends Phaser.Physics.Arcade.Sprite {
  private xpValue: number = 1;
  private magnetized: boolean = false;

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

    // Gentle glow pulse
    this.setAlpha(0.9);
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.7, to: 1 },
      scale: { from: 0.9, to: 1.15 },
      duration: 400 + Math.random() * 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
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
  }

  /** Force this gem to magnetize (used by XP vacuum on level-up) */
  forceCollect(): void {
    this.magnetized = true;
  }

  collect(): number {
    const value = this.xpValue;
    this.scene.tweens.killTweensOf(this); // Stop infinite pulse tween
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    return value;
  }

  getXpValue(): number { return this.xpValue; }
}
