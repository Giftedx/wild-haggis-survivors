import * as Phaser from 'phaser';
import { COLORS_CSS } from '../../config';
import { textStyle } from '../typography';
import type { HudWidgetContext } from './hudWidget';

export interface TimerStackRefs {
  timer: Phaser.GameObjects.Text;
  objective: Phaser.GameObjects.Text;
  curseChip: Phaser.GameObjects.Text;
}

/**
 * Centered top stack: large timer, objective subline, curse chip.
 *
 * Wraps are divided by uiScale so scaled text still fits inside the
 * responsive horizontal budget — `setScale(uiScale)` multiplies the
 * pre-wrap measurement, so leaving the wrap un-divided means a 1.4x
 * UI scale pushes a centered 720px wrap to ~1008px rendered width
 * and clips off the canvas edges.
 */
export function buildTimerStack(ctx: HudWidgetContext): TimerStackRefs {
  const { scene, depth: d, viewport, uiScale } = ctx;
  const { width } = viewport;
  const timer = ctx.addEl(
    scene.add.text(width / 2, 12, '', textStyle('title', { color: COLORS_CSS.WARM_TAN }))
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(d),
  );
  const uiScaleClamp = Math.max(1, uiScale);
  const objective = ctx.addEl(
    scene.add.text(
      width / 2, 42, '',
      textStyle('label', { color: COLORS_CSS.DUSTY_TAN, wordWrap: { width: Math.max(160, (width - 80) / uiScaleClamp) } }),
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(d),
  ) as Phaser.GameObjects.Text;
  const curseChip = ctx.addEl(
    scene.add.text(
      width / 2, 62, '',
      textStyle('label', { color: '#c49bbf', wordWrap: { width: Math.max(160, (width - 80) / uiScaleClamp) } }),
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(d).setVisible(false),
  ) as Phaser.GameObjects.Text;
  return { timer, objective, curseChip };
}
