import * as Phaser from 'phaser';
import { COLORS } from '../../config';
import type { HudWidgetContext } from './hudWidget';

export interface XpBarRefs {
  bg: Phaser.GameObjects.Rectangle;
  topLine: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Rectangle;
  highlight: Phaser.GameObjects.Rectangle;
}

/**
 * XP bar — full-width track at the bottom edge, layered for depth:
 *   bg (dark slate) → top shadow line → fill (xp purple) → top highlight (gold).
 */
export function buildXpBar(ctx: HudWidgetContext): XpBarRefs {
  const { scene, depth: d, viewport, xpBarH } = ctx;
  const { width, height } = viewport;
  const xpY = height - xpBarH - 4;
  // Dark slate — not near-black — so an empty XP track reads as UI chrome, not a dead band.
  const bg = ctx.addEl(
    scene.add.rectangle(0, xpY, width, xpBarH, 0x161a22)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d),
  );
  const topLine = ctx.addEl(
    scene.add.rectangle(0, xpY, width, 1, 0x000000, 0.38)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d),
  ) as Phaser.GameObjects.Rectangle;
  const fill = ctx.addEl(
    scene.add.rectangle(0, xpY, 0, xpBarH, COLORS.XP_BAR)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d + 1),
  );
  const highlight = ctx.addEl(
    scene.add.rectangle(0, xpY, 0, 2, 0xffe066, 0.7)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d + 2),
  );
  return { bg, topLine, fill, highlight };
}
