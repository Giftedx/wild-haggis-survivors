import * as Phaser from 'phaser';
import type { HudWidgetContext } from './hudWidget';

export interface WhiskyBarRefs {
  bg: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Rectangle;
}

const WHISKY_BAR_W = 36;
const WHISKY_BAR_H = 3;

/**
 * Whisky Breath stack bar — a small horizontal amber fill bar tucked
 * just below the HP bar, left-anchored to the same x as the HP fill
 * so the two readouts share a column. Hidden until first stack banked.
 * Background is the same dark slate as grip-empty for visual continuity;
 * fill is whisky-amber matching the breath VFX (`0xd4a040`). The bar
 * lives below the HP bar at y = 12 + HP_BAR_H + 1.
 */
export function buildWhiskyBar(ctx: HudWidgetContext): WhiskyBarRefs {
  const { scene, depth: d, hpBarH } = ctx;
  const x = 12;
  const y = 12 + hpBarH + 1;
  const bg = ctx.addEl(
    scene.add.rectangle(x, y, WHISKY_BAR_W, WHISKY_BAR_H, 0x2a2218, 1)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d).setVisible(false),
  );
  const fill = ctx.addEl(
    scene.add.rectangle(x, y, 0, WHISKY_BAR_H, 0xd4a040, 1)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d + 1).setVisible(false),
  );
  return { bg, fill };
}
