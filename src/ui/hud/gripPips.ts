import * as Phaser from 'phaser';
import type { HudWidgetContext } from './hudWidget';

/**
 * Drift Mastery pip strip — three 4 px-radius dots anchored to the
 * RIGHT end of the HP bar so they don't compete with the level/gold
 * column on the left. Hidden until `setGripPips()` first reports
 * a pip > 0; until then the widget never paints. Each dot is its
 * own Arc so the fill toggles instantly without a tween, and the
 * whole strip can be lifted by a brief setScale tween on burst.
 */
export function buildGripPips(ctx: HudWidgetContext): Phaser.GameObjects.Arc[] {
  const { scene, depth: d, hpBarW, hpBarH } = ctx;
  const dots: Phaser.GameObjects.Arc[] = [];
  const gripBaseX = 12 + hpBarW + 8;
  const gripY = 12 + hpBarH / 2;
  for (let i = 0; i < 3; i++) {
    const dot = ctx.addEl(
      scene.add.circle(gripBaseX + i * 12, gripY, 4, 0x2a3344, 1)
        .setStrokeStyle(1, 0x4a5566, 0.6)
        .setScrollFactor(0).setDepth(d + 2)
        .setVisible(false),
    ) as Phaser.GameObjects.Arc;
    dots.push(dot);
  }
  return dots;
}
