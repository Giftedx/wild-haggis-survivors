/**
 * Highland targe — round wooden shield with iron boss, strapped to
 * the haggis's back. Behind-layer accessory: renders behind the body
 * sprite so the shield peeks out over the shoulder and below the rear
 * rather than covering the haggis.
 *
 * Canvas: 80×80 with origin (0.5, 0.5). The shield sits offset up +
 * left of the haggis center (texture ~34, 36) so a fraction of the
 * circle pokes above the head + to the left of the body, reading as
 * "carried on the back" not "held in front".
 *
 * Palette: aged oak wood (dark brown), iron fittings (cool grey),
 * brass boss (PALETTE gold). Eight radial rivets around the rim +
 * the boss-plate centrepiece match the 17th-century targe look used
 * at Culloden — researched hero image in the art bible.
 */

import type { AccessoryDrawer, AccessoryDrawCtx } from '../AccessoryDrawer';
import { PALETTE } from '../../../art/palettes';

// Pushed to upper-left so ~half the shield pokes out above the haggis's
// left shoulder — reads clearly as "shield slung on the back" instead of
// disappearing entirely behind the body silhouette.
const CX = 20;
const BASE_CY = 28;

const WOOD_DARK = 0x2b1608;
const WOOD_MID = 0x4a2a12;
const WOOD_LIGHT = 0x6b421e;
const IRON_DARK = 0x1a1a20;
const IRON_MID = 0x3c3c42;
const IRON_LIGHT = 0x6a6a70;

interface ShieldFrame {
  readonly y: number;
  readonly x?: number;
}

function drawShield(g: Phaser.GameObjects.Graphics, frame: ShieldFrame): void {
  const cx = CX + (frame.x ?? 0);
  const cy = BASE_CY + frame.y;

  // ── Shadow — the shield casts slight offset from the haggis body ──
  g.fillStyle(0x000000, 0.35);
  g.fillCircle(cx + 1, cy + 2, 15);

  // ── Iron rim — outer metal band ──
  g.fillStyle(IRON_DARK, 1);
  g.fillCircle(cx, cy, 15);
  g.fillStyle(IRON_MID, 1);
  g.fillCircle(cx, cy, 14);

  // ── Wood face — layered tonal rings for depth ──
  g.fillStyle(WOOD_DARK, 1);
  g.fillCircle(cx, cy, 13);
  g.fillStyle(WOOD_MID, 1);
  g.fillCircle(cx, cy, 12);
  g.fillStyle(WOOD_LIGHT, 0.7);
  g.fillCircle(cx - 2, cy - 2, 9);

  // ── Wood grain — two arcing fillet lines suggest plank seams ──
  g.fillStyle(WOOD_DARK, 0.5);
  g.fillRect(cx - 11, cy - 1, 22, 1);
  g.fillRect(cx - 10, cy + 4, 20, 1);

  // ── Rivets — 8 around the rim, cardinal + diagonal ──
  g.fillStyle(IRON_LIGHT, 1);
  const rivetR = 11;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const rx = cx + Math.cos(angle) * rivetR;
    const ry = cy + Math.sin(angle) * rivetR;
    g.fillCircle(rx, ry, 1.4);
  }

  // ── Iron boss — central raised plate ──
  g.fillStyle(IRON_DARK, 1);
  g.fillCircle(cx, cy, 5);
  g.fillStyle(PALETTE.gold.aged, 1);
  g.fillCircle(cx, cy, 4);
  g.fillStyle(PALETTE.gold.bright, 1);
  g.fillCircle(cx - 1, cy - 1, 2.5);
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(cx - 1.5, cy - 1.5, 1.2);

  // ── Light-model highlight across the upper-left rim ──
  g.fillStyle(0xffffff, 0.15);
  g.fillEllipse(cx - 5, cy - 8, 10, 4);
}

function drawShieldIdle0(g: Phaser.GameObjects.Graphics): void {
  drawShield(g, { y: 0 });
}
function drawShieldIdle1(g: Phaser.GameObjects.Graphics): void {
  drawShield(g, { y: 0 });
}
function drawShieldWalking0(g: Phaser.GameObjects.Graphics): void {
  drawShield(g, { y: 0 });
}
function drawShieldWalking1(g: Phaser.GameObjects.Graphics): void {
  drawShield(g, { y: -1, x: -1 });
}
function drawShieldWalking2(g: Phaser.GameObjects.Graphics): void {
  drawShield(g, { y: 0 });
}
function drawShieldWalking3(g: Phaser.GameObjects.Graphics): void {
  drawShield(g, { y: -1, x: 1 });
}
function drawShieldAttacking0(g: Phaser.GameObjects.Graphics): void {
  drawShield(g, { y: 0, x: 1 });
}
function drawShieldAttacking1(g: Phaser.GameObjects.Graphics): void {
  drawShield(g, { y: -2, x: 2 });
}
function drawShieldAttacking2(g: Phaser.GameObjects.Graphics): void {
  drawShield(g, { y: -1, x: 1 });
}
function drawShieldAttacking3(g: Phaser.GameObjects.Graphics): void {
  drawShield(g, { y: 0, x: 0 });
}
function drawShieldHurt0(g: Phaser.GameObjects.Graphics): void {
  drawShield(g, { y: 1, x: -2 });
}
function drawShieldHurt1(g: Phaser.GameObjects.Graphics): void {
  drawShield(g, { y: 0, x: -1 });
}

const FRAMES = {
  idle: [drawShieldIdle0, drawShieldIdle1],
  walking: [
    drawShieldWalking0,
    drawShieldWalking1,
    drawShieldWalking2,
    drawShieldWalking3,
  ],
  attacking: [
    drawShieldAttacking0,
    drawShieldAttacking1,
    drawShieldAttacking2,
    drawShieldAttacking3,
  ],
  hurt: [drawShieldHurt0, drawShieldHurt1],
} as const;

type AuthoredState = keyof typeof FRAMES;

export const HIGHLAND_SHIELD_DRAWER: AccessoryDrawer = {
  id: 'highland_shield',
  layer: 'behind',
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
        `highlandShield: frame ${ctx.frame} out of range for state ${ctx.state}`,
      );
    }
    drawer(g);
  },
};
