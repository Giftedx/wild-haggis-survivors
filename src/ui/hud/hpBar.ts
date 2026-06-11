import * as Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../../config';
import { textStyle } from '../typography';
import type { HudWidgetContext } from './hudWidget';

export interface HpBarRefs {
  bg: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

export function buildHpBar(ctx: HudWidgetContext): HpBarRefs {
  const { scene, depth: d, hpBarW, hpBarH } = ctx;
  const bg = ctx.addEl(
    scene.add.rectangle(12, 12, hpBarW, hpBarH, 0x1a1420)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d),
  );
  const fill = ctx.addEl(
    scene.add.rectangle(12, 12, hpBarW, hpBarH, COLORS.HP_RED)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d + 1),
  );
  const text = ctx.addEl(
    scene.add.text(
      12 + hpBarW / 2, 12 + hpBarH / 2, '',
      textStyle('body', { color: COLORS_CSS.WARM_TAN }),
    ).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2),
  );
  return { bg, fill, text };
}
