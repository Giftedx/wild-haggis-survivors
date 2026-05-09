import * as Phaser from 'phaser';
import type { HudWidgetContext } from './hudWidget';
import { PARRY_COOLDOWN_MS } from '../../entities/shintyParry';

export interface ParryChipRefs {
  bg: Phaser.GameObjects.Rectangle;
  cooldownFill: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

/**
 * Shinty Parry chip (DESIGN_IDEAS §1) — small text pill below the
 * stance chip showing parry readiness. Sits at the bottom of the
 * skill-widget column (HP / whisky / stance / parry) so the four
 * skill expression layers stack on the same edge.
 *
 * Always visible from frame 1 — same logic as stance chip: the
 * player needs to know at-a-glance "can I parry right now?", and a
 * passive chip is unprompted discoverability for the E key.
 *
 * Visual states:
 *   - **ready**     — neutral slate; text reads "PARRY".
 *   - **active**    — bright cyan flash; text reads "!"; the window
 *                     is open and the player is committing.
 *   - **cooldown**  — dimmed; text reads "···"; a thin sweep fills
 *                     left-to-right inside the chip showing the
 *                     cooldown progress (1500 ms total).
 *
 * The cooldown sweep is implemented as a foreground rectangle whose
 * width tracks `parryCooldownFraction(state)`. Hidden in ready /
 * active states; visible only during cooldown.
 */
const PARRY_CHIP_W = 56;
const PARRY_CHIP_H = 11;

export function buildParryChip(ctx: HudWidgetContext): ParryChipRefs {
  const { scene, depth: d, hpBarH } = ctx;
  const x = 12;
  // Stack below the stance chip. Layout matches stanceChip.ts:
  //   12 (top) + hpBarH + 1 (gap) + 3 (whisky H) + 2 (gap) + 11 (stance H) + 2 (gap) = below stance.
  const y = 12 + hpBarH + 1 + 3 + 2 + 11 + 2;
  const bg = ctx.addEl(
    scene.add.rectangle(x, y, PARRY_CHIP_W, PARRY_CHIP_H, 0x2a3344, 0.85)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x4a5566, 0.6)
      .setScrollFactor(0)
      .setDepth(d),
  );
  // Cooldown fill — left-aligned, scales to fraction. Hidden by default.
  const cooldownFill = ctx.addEl(
    scene.add.rectangle(x, y, 0, PARRY_CHIP_H, 0x4a5566, 0.55)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(d + 0.5)
      .setVisible(false),
  );
  const text = ctx.addEl(
    scene.add.text(x + PARRY_CHIP_W / 2, y + PARRY_CHIP_H / 2, '', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#9fcad9',
      fontStyle: 'bold',
    })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(d + 1),
  );
  return { bg, cooldownFill, text };
}

/** Used by HUD.setShintyParry to compute the cooldown sweep width. */
export const PARRY_CHIP_PIXEL_WIDTH = PARRY_CHIP_W;

/** Re-exported so HUD code can keep one import for chip dimensions. */
export const PARRY_CHIP_COOLDOWN_TOTAL_MS = PARRY_COOLDOWN_MS;
