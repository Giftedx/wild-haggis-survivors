import * as Phaser from 'phaser';

/**
 * Plays a coordinated "purchase confirmed" particle burst at (x, y):
 * a soft expanding flash + 6 dots arcing outward with gravity. Used
 * by both ShopScene (gold currency) and MetaShopScene (kills crystal)
 * which previously kept two near-identical 30-line copies.
 *
 * Behaviour preserved exactly: angles, durations, eases, depths and
 * cleanup all unchanged. Only the burst colour and the small flash
 * alpha vary by call site.
 */
export function playPurchaseBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  flashAlpha: number,
): void {
  const flash = scene.add.circle(x, y, 20, color, flashAlpha).setDepth(9);
  scene.tweens.add({
    targets: flash, scale: 2, alpha: 0, duration: 300,
    onComplete: () => flash.destroy(),
  });
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const speed = Phaser.Math.Between(20, 40);
    const dot = scene.add.circle(x, y,
      Phaser.Math.Between(2, 4), color, 0.9,
    ).setDepth(10);
    const endX = x + Math.cos(angle) * speed;
    const peakY = y - Phaser.Math.Between(15, 30);
    const endY = y + Phaser.Math.Between(5, 15); // falls below origin (gravity)
    scene.tweens.add({
      targets: dot, x: endX, duration: 400 + i * 30,
      onComplete: () => dot.destroy(),
    });
    scene.tweens.add({
      targets: dot,
      y: { value: peakY, duration: 180, ease: 'Quad.easeOut' },
    });
    scene.tweens.add({
      targets: dot,
      y: { value: endY, duration: 220, ease: 'Quad.easeIn', delay: 180 },
      alpha: { value: 0, duration: 200, delay: 200 },
    });
  }
}
