import * as Phaser from 'phaser';
import type { HudWidgetContext } from './hudWidget';

/**
 * Whistle-Call companion chip — first slice of the Living World
 * Initiative HUD surface. Pinned just under the shinty-parry chip on
 * the left edge so the skill-widget column reads HP / whisky /
 * stance / parry / companion.
 *
 * Hidden by default; the HUD calls `setCompanion` whenever the
 * companion roster changes. Label is the localised companion name —
 * caller supplies it from `t('ui.hud.companion.<key>')`.
 */
const COMPANION_CHIP_W = 56;
const COMPANION_CHIP_H = 11;
export const COMPANION_CHIP_HEIGHT_PX = COMPANION_CHIP_H;

export interface CompanionChipRefs {
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

export function buildCompanionChip(ctx: HudWidgetContext): CompanionChipRefs {
  const { scene, depth: d, hpBarH } = ctx;
  const x = 12;
  // Sit two pixels below the parry chip (the chip column already
  // stacks at `hpBarH + 1 + 3 + 2 + chip + 2 + chip` — pulling the
  // measurement from existing chips kept readable). Hardcoded gap
  // matches the rest of the column.
  const y = 12 + hpBarH + 1 + 3 + 2 + COMPANION_CHIP_H + 2 + COMPANION_CHIP_H + 2;
  const bg = ctx.addEl(
    scene.add.rectangle(x, y, COMPANION_CHIP_W, COMPANION_CHIP_H, 0x2a3a44, 0.85)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x6aa898, 0.6)
      .setScrollFactor(0)
      .setDepth(d)
      .setVisible(false),
  );
  const text = ctx.addEl(
    scene.add.text(x + COMPANION_CHIP_W / 2, y + COMPANION_CHIP_H / 2, '', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#c8e8d8',
      fontStyle: 'bold',
    })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(d + 1)
      .setVisible(false),
  );
  return { bg, text };
}
