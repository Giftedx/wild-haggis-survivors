import * as Phaser from 'phaser';
import { COLORS_CSS } from '../../config';
import { textStyle } from '../typography';
import type { HudWidgetContext } from './hudWidget';

export interface ShieldDashRefs {
  shield: Phaser.GameObjects.Image;
  dashPrefix: Phaser.GameObjects.Text;
  dashSuffix: Phaser.GameObjects.Text;
  dashPips: Phaser.GameObjects.Image[];
}

/**
 * Shield icon + dash row — right of the HP bar.
 *
 * Dash row was bumped 12px → 14px for readability under combat stress,
 * and the pip pool is rebuilt slightly larger so they scale along with
 * the text. All start hidden; visibility toggles in `updateShield` and
 * the dash-row update path.
 */
export function buildShieldDash(
  ctx: HudWidgetContext,
  opts: { dashPipPool: number },
): ShieldDashRefs {
  const { scene, depth: d, hpBarW, hpBarH } = ctx;
  const shield = ctx.addEl(
    scene.add.image(12 + hpBarW + 10, 12 + hpBarH / 2, 'hud_shield')
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(d + 2).setVisible(false),
  ) as Phaser.GameObjects.Image;
  const dashStyle = textStyle('body', { fontSize: '14px', color: COLORS_CSS.WHISKY_GOLD });
  const dashPrefix = ctx.addEl(
    scene.add.text(12 + hpBarW + 10, 12 + hpBarH / 2 + 20, '', dashStyle)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(d + 2).setVisible(false),
  ) as Phaser.GameObjects.Text;
  const dashPips: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < opts.dashPipPool; i++) {
    const pip = ctx.addEl(
      scene.add.image(0, 0, 'hud_dash_pip_full')
        .setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(d + 2).setVisible(false),
    ) as Phaser.GameObjects.Image;
    dashPips.push(pip);
  }
  const dashSuffix = ctx.addEl(
    scene.add.text(0, 0, '', dashStyle)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(d + 2).setVisible(false),
  ) as Phaser.GameObjects.Text;
  return { shield, dashPrefix, dashSuffix, dashPips };
}
