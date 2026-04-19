/**
 * Irn-Bru can — iconic orange-and-blue Scottish soft-drink can. Front
 * layer, anchored to the left hip so it hangs opposite the whisky
 * flask (right) and the sporran (centre). Reads as the haggis's
 * pre-workout power-up.
 *
 * Canvas: 80×80 with origin (0.5, 0.5). The can sits at texture
 * (28, 44) — left hip line, just below the waistband. Silhouette
 * is a vertical cylinder with the signature orange body, blue
 * horizontal label ring, and a silver-grey pull-tab top.
 */

import type { AccessoryDrawer, AccessoryDrawCtx } from '../AccessoryDrawer';

// Pulled in from the canvas edge (13 → 20) so the can hangs at the
// haggis's left hip instead of floating detached at the edge of the
// sprite. 20 puts the outer edge right at the body silhouette
// (~x=18) so it reads as a belt-hung item.
const CX = 20;
const BASE_CY = 44;

const ORANGE_DARK = 0xc04a00;
const ORANGE_MID = 0xe86a10;
const ORANGE_LIGHT = 0xff9a30;
const BLUE_BAND = 0x0a2a6a;
const BLUE_BAND_LIGHT = 0x2a4a8a;
const CAN_GREY = 0x8a8e96;

interface CanFrame {
  readonly y: number;
  readonly x?: number;
}

function drawCan(g: Phaser.GameObjects.Graphics, frame: CanFrame): void {
  const cx = CX + (frame.x ?? 0);
  const cy = BASE_CY + frame.y;

  // ── Shadow behind the can ──
  g.fillStyle(0x000000, 0.35);
  g.fillRoundedRect(cx - 3, cy - 5, 7, 13, 1);

  // ── Can body — main orange field ──
  g.fillStyle(ORANGE_DARK, 1);
  g.fillRoundedRect(cx - 3, cy - 6, 7, 13, 1);
  g.fillStyle(ORANGE_MID, 1);
  g.fillRoundedRect(cx - 2, cy - 5, 5, 11, 1);

  // Orange highlight — lit edge on the upper-left.
  g.fillStyle(ORANGE_LIGHT, 0.85);
  g.fillRect(cx - 2, cy - 5, 1, 8);
  g.fillStyle(0xffffff, 0.3);
  g.fillRect(cx - 2, cy - 5, 0.5, 3);

  // ── Blue band — horizontal wordmark strip (Irn Bru's blue rail) ──
  g.fillStyle(BLUE_BAND, 1);
  g.fillRect(cx - 3, cy - 1, 7, 3);
  g.fillStyle(BLUE_BAND_LIGHT, 1);
  g.fillRect(cx - 3, cy - 1, 7, 1);
  // Tiny white dots suggest text on the label.
  g.fillStyle(0xffffff, 0.85);
  g.fillRect(cx - 2, cy, 1, 1);
  g.fillRect(cx, cy, 1, 1);
  g.fillRect(cx + 2, cy, 1, 1);

  // ── Top rim + pull tab — the silvery crown ──
  g.fillStyle(CAN_GREY, 1);
  g.fillRect(cx - 3, cy - 7, 7, 1);
  g.fillStyle(0xd8d8de, 1);
  g.fillRect(cx - 3, cy - 7, 7, 0.5);
  // Pull tab
  g.fillStyle(CAN_GREY, 1);
  g.fillCircle(cx + 0.5, cy - 6.5, 1.2);
  g.fillStyle(0x000000, 0.5);
  g.fillCircle(cx + 0.5, cy - 6.5, 0.4);

  // ── Bottom rim — darker shadow ──
  g.fillStyle(0x000000, 0.4);
  g.fillRect(cx - 3, cy + 6, 7, 1);
}

function drawIdle0(g: Phaser.GameObjects.Graphics): void {
  drawCan(g, { y: 0 });
}
function drawIdle1(g: Phaser.GameObjects.Graphics): void {
  drawCan(g, { y: 0 });
}
function drawWalking0(g: Phaser.GameObjects.Graphics): void {
  drawCan(g, { y: 0 });
}
function drawWalking1(g: Phaser.GameObjects.Graphics): void {
  drawCan(g, { y: 1, x: -1 });
}
function drawWalking2(g: Phaser.GameObjects.Graphics): void {
  drawCan(g, { y: 0 });
}
function drawWalking3(g: Phaser.GameObjects.Graphics): void {
  drawCan(g, { y: 1, x: 1 });
}
function drawAttacking0(g: Phaser.GameObjects.Graphics): void {
  drawCan(g, { y: 0, x: 1 });
}
function drawAttacking1(g: Phaser.GameObjects.Graphics): void {
  drawCan(g, { y: -1, x: 2 });
}
function drawAttacking2(g: Phaser.GameObjects.Graphics): void {
  drawCan(g, { y: 0, x: 1 });
}
function drawAttacking3(g: Phaser.GameObjects.Graphics): void {
  drawCan(g, { y: 0, x: 0 });
}
function drawHurt0(g: Phaser.GameObjects.Graphics): void {
  drawCan(g, { y: 1, x: -2 });
}
function drawHurt1(g: Phaser.GameObjects.Graphics): void {
  drawCan(g, { y: 0, x: -1 });
}

const FRAMES = {
  idle: [drawIdle0, drawIdle1],
  walking: [drawWalking0, drawWalking1, drawWalking2, drawWalking3],
  attacking: [drawAttacking0, drawAttacking1, drawAttacking2, drawAttacking3],
  hurt: [drawHurt0, drawHurt1],
} as const;

type AuthoredState = keyof typeof FRAMES;

export const IRN_BRU_DRAWER: AccessoryDrawer = {
  id: 'irn_bru',
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
        `irnBru: frame ${ctx.frame} out of range for state ${ctx.state}`,
      );
    }
    drawer(g);
  },
};
