import * as Phaser from 'phaser';
import type { HudWidgetContext } from './hudWidget';

export interface StanceChipRefs {
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

/**
 * Stance Toggle chip (DESIGN_IDEAS §1) — small text pill below the
 * whisky bar showing the active stance. Sits left-aligned with the
 * HP bar so the three player-skill widgets (grip pips, whisky bar,
 * stance chip) form a stacked column on the same edge.
 *
 * Always visible from frame 1 — unlike grip pips / whisky bar
 * (which gate on "earn before you see it"), stance is the player's
 * *current posture* and matters every frame. A loose-default chip
 * also doubles as discoverability: a new player sees "loose" sitting
 * under the HP bar and reads it as "there's a stance system; what
 * else is there?". Q is an unprompted invitation.
 *
 * Per-stance fill colour:
 *   - loose   — neutral slate, the haggis's natural gait
 *   - braced  — cool blue-slate, "set" / "still"
 *   - reeling — warm amber, "going hot"
 */
const STANCE_CHIP_W = 56;
const STANCE_CHIP_H = 11;

export function buildStanceChip(ctx: HudWidgetContext): StanceChipRefs {
  const { scene, depth: d, hpBarH } = ctx;
  const x = 12;
  // Sit two pixels below the whisky bar (which lives at hpBar bottom + 1
  // and is 3 px tall). Stack: HP / whisky / stance.
  const y = 12 + hpBarH + 1 + 3 + 2;
  const bg = ctx.addEl(
    scene.add.rectangle(x, y, STANCE_CHIP_W, STANCE_CHIP_H, 0x2a3344, 0.85)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x4a5566, 0.6)
      .setScrollFactor(0)
      .setDepth(d),
  );
  const text = ctx.addEl(
    scene.add.text(x + STANCE_CHIP_W / 2, y + STANCE_CHIP_H / 2, '', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#d4c8a8',
      fontStyle: 'bold',
    })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(d + 1),
  );
  return { bg, text };
}
