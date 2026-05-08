import * as Phaser from 'phaser';
import { COLORS_CSS } from '../../config';
import { textStyle } from '../typography';
import type { HudWidgetContext } from './hudWidget';

export interface StatusChipsRefs {
  /** W2 Moor Road act chip — hidden until first picker resolves. */
  act: Phaser.GameObjects.Text;
  /** W66 Ironmoor chip — only shown when single-life mode is active. */
  ironmoor: Phaser.GameObjects.Text;
  /** P2.12 daily-challenge chip — right-anchored top band. */
  daily: Phaser.GameObjects.Text;
  /** T1 replay chip — persistent indicator during playback, anchored above XP bar. */
  replay: Phaser.GameObjects.Text;
}

/**
 * Build the four state-conditional chips:
 *   - centered top stack: act, ironmoor (hidden by default)
 *   - right top corner: daily
 *   - right above the XP bar: replay
 *
 * All start hidden — visibility is toggled by the corresponding setter
 * methods on HUD (`setAct`, `setIronmoor`, `setDaily`, `setReplayMode`).
 */
export function buildStatusChips(ctx: HudWidgetContext): StatusChipsRefs {
  const { scene, depth: d, viewport, xpBarH } = ctx;
  const { width, height } = viewport;
  const act = ctx.addEl(
    scene.add.text(width / 2, 78, '', textStyle('body', { color: COLORS_CSS.WARM_TAN }))
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(d + 1).setVisible(false),
  ) as Phaser.GameObjects.Text;
  const ironmoor = ctx.addEl(
    scene.add.text(width / 2, 94, '', textStyle('label', { color: '#c8a0a0' }))
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(d + 1).setVisible(false),
  ) as Phaser.GameObjects.Text;
  const daily = ctx.addEl(
    scene.add.text(width - 12, 64, '', textStyle('label', { color: '#e2c97a' }))
      .setOrigin(1, 0).setScrollFactor(0).setDepth(d + 1).setVisible(false),
  ) as Phaser.GameObjects.Text;
  const replay = ctx.addEl(
    scene.add.text(width - 12, height - xpBarH - 24, '', textStyle('label', { color: '#88ccff' }))
      .setOrigin(1, 1).setScrollFactor(0).setDepth(d + 1).setVisible(false),
  ) as Phaser.GameObjects.Text;
  return { act, ironmoor, daily, replay };
}
