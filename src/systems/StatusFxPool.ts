import Phaser from 'phaser';

/**
 * StatusFxPool — reusable particle pool for Enemy status-effect visuals.
 *
 * Owns two circular pools:
 *  - Arc circles (burn sparks, poison bubbles, knockback trail, phase puffs, enrage dots)
 *  - Images (freeze snowflakes)
 *
 * Lifecycle: created by GameScene, accessed via ISceneContext, destroyed on scene shutdown.
 */
export class StatusFxPool {
  private scene: Phaser.Scene;

  private arcPool: Phaser.GameObjects.Arc[] = [];
  private arcIdx = 0;

  private imgPool: Phaser.GameObjects.Image[] = [];
  private imgIdx = 0;

  constructor(scene: Phaser.Scene, arcCount = 100, imgCount = 24) {
    this.scene = scene;

    for (let i = 0; i < arcCount; i++) {
      const dot = scene.add.circle(0, 0, 3, 0xffffff, 0)
        .setDepth(5).setVisible(false);
      this.arcPool.push(dot);
    }

    for (let i = 0; i < imgCount; i++) {
      const img = scene.add.image(0, 0, 'fx_snowflake')
        .setDepth(15).setOrigin(0.5).setVisible(false).setAlpha(0);
      this.imgPool.push(img);
    }
  }

  /** Acquire an Arc circle, resetting it for reuse. */
  acquireArc(x: number, y: number, radius: number, color: number, alpha: number): Phaser.GameObjects.Arc {
    const dot = this.arcPool[this.arcIdx++ % this.arcPool.length];
    this.scene.tweens.killTweensOf(dot);
    dot.setPosition(x, y);
    dot.setRadius(radius);
    dot.setFillStyle(color, alpha);
    dot.setScale(1);
    dot.setAlpha(alpha);
    dot.setVisible(true);
    dot.setDepth(5);
    return dot;
  }

  /** Acquire an Image (snowflake), resetting it for reuse. */
  acquireImage(x: number, y: number): Phaser.GameObjects.Image {
    const img = this.imgPool[this.imgIdx++ % this.imgPool.length];
    this.scene.tweens.killTweensOf(img);
    img.setPosition(x, y);
    img.setTexture('fx_snowflake');
    img.setScale(1.2);
    img.setAlpha(0.9);
    img.setVisible(true);
    img.setDepth(15);
    return img;
  }

  destroy(): void {
    for (const dot of this.arcPool) dot.destroy();
    for (const img of this.imgPool) img.destroy();
    this.arcPool = [];
    this.imgPool = [];
  }
}
