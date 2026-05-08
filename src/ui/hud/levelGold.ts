import * as Phaser from 'phaser';
import { COLORS_CSS } from '../../config';
import { textStyle } from '../typography';
import type { HudWidgetContext } from './hudWidget';

export interface LevelGoldRefs {
  level: Phaser.GameObjects.Text;
  gold: Phaser.GameObjects.Text;
}

/**
 * Top-left text column under the HP cluster: level readout above,
 * mid-run gold balance chip below. Gold is hidden until the first
 * setText fires from GameScene.
 */
export function buildLevelGold(ctx: HudWidgetContext): LevelGoldRefs {
  const { scene, depth: d } = ctx;
  const baseStyle = textStyle('body', { color: COLORS_CSS.WARM_TAN });
  const level = ctx.addEl(
    scene.add.text(12, 40, '', baseStyle)
      .setScrollFactor(0).setDepth(d),
  );
  const gold = ctx.addEl(
    scene.add.text(12, 62, '', textStyle('body', { color: COLORS_CSS.WHISKY_GOLD }))
      .setScrollFactor(0).setDepth(d).setVisible(false),
  ) as Phaser.GameObjects.Text;
  return { level, gold };
}
