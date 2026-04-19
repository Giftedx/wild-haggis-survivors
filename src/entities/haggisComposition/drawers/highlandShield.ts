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

// Pushed to upper-left so roughly a quarter of the shield pokes out
// above the haggis's left shoulder — reads as "shield slung on the
// back" without dominating the silhouette. Previously sat too low
// and too large; pulled up + shrunk to stop it from looking like a
// second body beside the haggis.
const CX = 16;
const BASE_CY = 22;

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

  // Shield radius — pulled from 15 to 11 so the shape reads as a
  // slung accessory instead of a second body alongside the haggis.
  // ── Shadow — slight offset from the body silhouette ──
  g.fillStyle(0x000000, 0.35);
  g.fillCircle(cx + 1, cy + 2, 11);

  // ── Iron rim — outer metal band ──
  g.fillStyle(IRON_DARK, 1);
  g.fillCircle(cx, cy, 11);
  g.fillStyle(IRON_MID, 1);
  g.fillCircle(cx, cy, 10);

  // ── Wood face — layered tonal rings for depth ──
  g.fillStyle(WOOD_DARK, 1);
  g.fillCircle(cx, cy, 9);
  g.fillStyle(WOOD_MID, 1);
  g.fillCircle(cx, cy, 8);
  g.fillStyle(WOOD_LIGHT, 0.7);
  g.fillCircle(cx - 1.5, cy - 1.5, 6);

  // ── Wood grain — two arcing fillet lines suggest plank seams ──
  g.fillStyle(WOOD_DARK, 0.5);
  g.fillRect(cx - 7, cy - 1, 14, 1);
  g.fillRect(cx - 6, cy + 2, 12, 1);

  // ── Rivets — 6 around the rim, cardinal + a pair of diagonals ──
  g.fillStyle(IRON_LIGHT, 1);
  const rivetR = 8;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const rx = cx + Math.cos(angle) * rivetR;
    const ry = cy + Math.sin(angle) * rivetR;
    g.fillCircle(rx, ry, 1);
  }

  // ── Iron boss — central raised plate ──
  g.fillStyle(IRON_DARK, 1);
  g.fillCircle(cx, cy, 3.5);
  g.fillStyle(PALETTE.gold.aged, 1);
  g.fillCircle(cx, cy, 2.5);
  g.fillStyle(PALETTE.gold.bright, 1);
  g.fillCircle(cx - 0.5, cy - 0.5, 1.5);
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(cx - 1, cy - 1, 0.8);

  // ── Light-model highlight across the upper-left rim ──
  g.fillStyle(0xffffff, 0.15);
  g.fillEllipse(cx - 3, cy - 5, 6, 2.5);
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
