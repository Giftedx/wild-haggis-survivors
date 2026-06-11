import type Phaser from 'phaser';

/**
 * Fills `pool` with `count` invisible circles at the origin, ready to
 * be claimed by a `pool.find(c => !c.visible)` style acquire. Pulled
 * out of JuiceSystem's pool init where the same 4-line shape repeated
 * for 6 distinct VFX pools — only radius / colour / alpha / depth
 * varied per pool, so they live as args.
 */
export function fillCirclePool(
  scene: Phaser.Scene,
  pool: Phaser.GameObjects.Arc[],
  count: number,
  radius: number,
  color: number,
  alpha: number,
  depth: number,
): void {
  for (let i = 0; i < count; i++) {
    pool.push(
      scene.add.circle(0, 0, radius, color, alpha)
        .setDepth(depth)
        .setVisible(false),
    );
  }
}
