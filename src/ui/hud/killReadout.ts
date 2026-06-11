import * as Phaser from 'phaser';
import { COLORS_CSS } from '../../config';
import { textStyle } from '../typography';
import type { HudWidgetContext } from './hudWidget';

/**
 * Right-anchored kill / enemy-cap readout.
 * 0.30 width ratio divided by uiScale keeps the readout clear of the
 * 30px-title timer at 1.4x comfort scale (previously 0.38 × 1.4 overlapped
 * the timer bounding box).
 */
export function buildKillReadout(ctx: HudWidgetContext): Phaser.GameObjects.Text {
  const { scene, depth: d, viewport, uiScale } = ctx;
  const { width } = viewport;
  const uiScaleClamp = Math.max(1, uiScale);
  const killStyle = textStyle('body', {
    color: COLORS_CSS.WARM_TAN,
    wordWrap: { width: Math.max(100, Math.floor((width * 0.30) / uiScaleClamp)) },
  });
  return ctx.addEl(
    scene.add.text(width - 12, 12, '', killStyle)
      .setOrigin(1, 0).setScrollFactor(0).setDepth(d),
  );
}
