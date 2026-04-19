/**
 * Whisky flask — pewter hip flask with an amber-glass window. Front
 * layer, anchored to the right hip so it hangs opposite the sporran
 * (centre) and the irn-bru can (left hip).
 *
 * Canvas: 80×80 with origin (0.5, 0.5). The flask sits at texture
 * (52, 44) — on the right side of the haggis's belly line, just
 * below the waistband. Silhouette is a curved pewter rectangle with
 * a cap at the top and a beaded strap loop.
 */

import type { AccessoryDrawer, AccessoryDrawCtx } from '../AccessoryDrawer';
import { PALETTE } from '../../../art/palettes';

const CX = 52;
const BASE_CY = 44;

const PEWTER_DARK = 0x2a2e34;
const PEWTER_MID = 0x4a4e56;
const PEWTER_LIGHT = 0x7a7e86;
const AMBER = 0x9a5a1a;
const AMBER_LIGHT = 0xd48a3a;

interface FlaskFrame {
  readonly y: number;
  readonly x?: number;
}

function drawFlask(g: Phaser.GameObjects.Graphics, frame: FlaskFrame): void {
  const cx = CX + (frame.x ?? 0);
  const cy = BASE_CY + frame.y;

  // ── Strap loop at the top ──
  g.fillStyle(PEWTER_DARK, 1);
  g.fillRect(cx - 1, cy - 7, 3, 2);

  // ── Flask body — curved pewter rectangle, wider at base ──
  g.fillStyle(PEWTER_DARK, 1);
  g.fillRoundedRect(cx - 4, cy - 5, 9, 12, 2);
  g.fillStyle(PEWTER_MID, 1);
  g.fillRoundedRect(cx - 3, cy - 4, 7, 10, 2);

  // Pewter highlight — upper-left catches the light.
  g.fillStyle(PEWTER_LIGHT, 0.85);
  g.fillRect(cx - 2, cy - 3, 2, 5);
  g.fillStyle(0xffffff, 0.4);
  g.fillRect(cx - 2, cy - 3, 1, 3);

  // ── Amber window — a small oval cut in the pewter showing the
  // whisky inside. Gives the flask a clan-badge feel. ──
  g.fillStyle(AMBER, 1);
  g.fillEllipse(cx + 0.5, cy + 1, 4, 4);
  g.fillStyle(AMBER_LIGHT, 1);
  g.fillEllipse(cx + 0.5, cy, 2.5, 2.5);
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(cx - 0.2, cy - 0.3, 0.8);

  // ── Cap — brass collar at the top ──
  g.fillStyle(PALETTE.gold.aged, 1);
  g.fillRect(cx - 3, cy - 6, 7, 2);
  g.fillStyle(PALETTE.gold.bright, 1);
  g.fillRect(cx - 2, cy - 6, 5, 1);

  // Cap knob
  g.fillStyle(PEWTER_DARK, 1);
  g.fillCircle(cx + 0.5, cy - 6, 1.3);
  g.fillStyle(PEWTER_LIGHT, 0.8);
  g.fillCircle(cx + 0.2, cy - 6.3, 0.6);
}

function drawIdle0(g: Phaser.GameObjects.Graphics): void {
  drawFlask(g, { y: 0 });
}
function drawIdle1(g: Phaser.GameObjects.Graphics): void {
  drawFlask(g, { y: 0 });
}
function drawWalking0(g: Phaser.GameObjects.Graphics): void {
  drawFlask(g, { y: 0 });
}
function drawWalking1(g: Phaser.GameObjects.Graphics): void {
  drawFlask(g, { y: 1, x: -1 });
}
function drawWalking2(g: Phaser.GameObjects.Graphics): void {
  drawFlask(g, { y: 0 });
}
function drawWalking3(g: Phaser.GameObjects.Graphics): void {
  drawFlask(g, { y: 1, x: 1 });
}
function drawAttacking0(g: Phaser.GameObjects.Graphics): void {
  drawFlask(g, { y: 0, x: 1 });
}
function drawAttacking1(g: Phaser.GameObjects.Graphics): void {
  drawFlask(g, { y: -1, x: 2 });
}
function drawAttacking2(g: Phaser.GameObjects.Graphics): void {
  drawFlask(g, { y: 0, x: 1 });
}
function drawAttacking3(g: Phaser.GameObjects.Graphics): void {
  drawFlask(g, { y: 0, x: 0 });
}
function drawHurt0(g: Phaser.GameObjects.Graphics): void {
  drawFlask(g, { y: 1, x: -2 });
}
function drawHurt1(g: Phaser.GameObjects.Graphics): void {
  drawFlask(g, { y: 0, x: -1 });
}

const FRAMES = {
  idle: [drawIdle0, drawIdle1],
  walking: [drawWalking0, drawWalking1, drawWalking2, drawWalking3],
  attacking: [drawAttacking0, drawAttacking1, drawAttacking2, drawAttacking3],
  hurt: [drawHurt0, drawHurt1],
} as const;

type AuthoredState = keyof typeof FRAMES;

export const WHISKY_FLASK_DRAWER: AccessoryDrawer = {
  id: 'whisky_flask',
  layer: 'front',
  authoredStates: ['idle', 'walking', 'attacking', 'hurt'] as const,
  draw(g: Phaser.GameObjects.Graphics, ctx: AccessoryDrawCtx): void {
    const drawers = FRAMES[ctx.state as AuthoredState];
    if (!drawers) {
      FRAMES.idle[0](g);
      return;
    }
    const drawer = drawers[ctx.frame];
    if (!drawer) {
      throw new Error(
        `whiskyFlask: frame ${ctx.frame} out of range for state ${ctx.state}`,
      );
    }
    drawer(g);
  },
};
