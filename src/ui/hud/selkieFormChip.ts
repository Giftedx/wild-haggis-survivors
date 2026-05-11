import * as Phaser from 'phaser';
import type { HudWidgetContext } from './hudWidget';

/**
 * Selkie Dual-Form chip — surfaces the active form (`haggis` or
 * `seal`) under the companion chip on the left skill column.
 *
 * Hidden by default; the HUD calls `setSelkieForm` when the run is
 * being played as the Selkie variant. Compact 56 px chip to match
 * the existing column rhythm. The chip tint shifts between forms
 * so the posture is readable at a glance.
 */
const SELKIE_CHIP_W = 56;
const SELKIE_CHIP_H = 11;

export interface SelkieFormChipRefs {
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

export function buildSelkieFormChip(ctx: HudWidgetContext): SelkieFormChipRefs {
  const { scene, depth: d, hpBarH } = ctx;
  const x = 12;
  // Stack: HP / whisky / stance / parry / companion / selkie.
  // Each chip is 11 px tall with 2 px spacing. The leading offsets
  // (12 + hpBarH + 1 + 3 + 2) match the rest of the column.
  const y = 12 + hpBarH + 1 + 3 + 2
    + SELKIE_CHIP_H + 2  // stance
    + SELKIE_CHIP_H + 2  // parry
    + SELKIE_CHIP_H + 2; // companion
  const bg = ctx.addEl(
    scene.add.rectangle(x, y, SELKIE_CHIP_W, SELKIE_CHIP_H, 0x1f3340, 0.85)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x4a8a7c, 0.6)
      .setScrollFactor(0)
      .setDepth(d)
      .setVisible(false),
  );
  const text = ctx.addEl(
    scene.add.text(x + SELKIE_CHIP_W / 2, y + SELKIE_CHIP_H / 2, '', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#c8e0e8',
      fontStyle: 'bold',
    })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(d + 1)
      .setVisible(false),
  );
  return { bg, text };
}
