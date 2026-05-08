import * as Phaser from 'phaser';
import { textStyle } from '../typography';
import {
  BOSS_BAR_BG,
  BOSS_BAR_BASELINE_FILL,
  BOSS_BAR_BASELINE_HIGHLIGHT,
  BOSS_BAR_WARN_GLOW_COLOR,
} from '../hudBossBar';
import type { HudWidgetContext } from './hudWidget';

export interface BossBarRefs {
  bg: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Rectangle;
  highlight: Phaser.GameObjects.Rectangle;
  shadow: Phaser.GameObjects.Rectangle;
  glow: Phaser.GameObjects.Rectangle;
  name: Phaser.GameObjects.Text;
}

/**
 * Boss HP bar — layered: dark bg → fill shadow → red fill → bright top highlight.
 *
 * Lives ABOVE the banter / tutorial-tip layer (depths 85-92) so a boss
 * fight can never have its HP bar hidden behind ambient toast text
 * (P1.11 fix). Stays well below modal underlays (599+) so pause/level-up
 * still occlude it.
 *
 * All start hidden — `updateBossBar` toggles visibility.
 */
export function buildBossBar(ctx: HudWidgetContext): BossBarRefs {
  const { scene, viewport, uiScale } = ctx;
  const { width } = viewport;
  const uiScaleClamp = Math.max(1, uiScale);
  const bossBarW = width * 0.55;
  const bossBarY = 98;
  const bd = 95;
  const glow = ctx.addEl(
    scene.add.rectangle(width / 2, bossBarY, bossBarW + 12, 30, BOSS_BAR_WARN_GLOW_COLOR, 0)
      .setScrollFactor(0).setDepth(bd - 1).setVisible(false),
  ) as Phaser.GameObjects.Rectangle;
  const bg = ctx.addEl(
    scene.add.rectangle(width / 2, bossBarY, bossBarW, 22, BOSS_BAR_BG)
      .setScrollFactor(0).setDepth(bd).setVisible(false),
  ) as Phaser.GameObjects.Rectangle;
  const shadow = ctx.addEl(
    scene.add.rectangle(width / 2, bossBarY - 9, bossBarW, 2, 0x000000, 0.6)
      .setScrollFactor(0).setDepth(bd).setVisible(false),
  ) as Phaser.GameObjects.Rectangle;
  const fill = ctx.addEl(
    scene.add.rectangle(width / 2 - bossBarW / 2, bossBarY, bossBarW, 22, BOSS_BAR_BASELINE_FILL)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(bd + 1).setVisible(false),
  ) as Phaser.GameObjects.Rectangle;
  const highlight = ctx.addEl(
    scene.add.rectangle(width / 2 - bossBarW / 2, bossBarY - 8, bossBarW, 3, BOSS_BAR_BASELINE_HIGHLIGHT, 0.6)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(bd + 2).setVisible(false),
  ) as Phaser.GameObjects.Rectangle;
  const name = ctx.addEl(
    scene.add.text(
      width / 2, bossBarY - 14, '',
      textStyle('body', { fontSize: '17px', color: '#ff9999', wordWrap: { width: Math.max(200, bossBarW / uiScaleClamp) } }),
    ).setOrigin(0.5, 1).setScrollFactor(0).setDepth(bd + 2).setVisible(false),
  ) as Phaser.GameObjects.Text;
  return { bg, fill, highlight, shadow, glow, name };
}
