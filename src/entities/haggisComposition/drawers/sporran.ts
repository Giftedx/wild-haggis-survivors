/**
 * Sporran — traditional Scottish belt pouch worn at the waist line.
 * Front-layer accessory: renders on top of the kilt (body layer) so
 * the pouch reads as hanging over the tartan.
 *
 * Canvas: 80×80 with origin (0.5, 0.5). The sporran sits at
 * texture (40, 44) — centred at the haggis's belly line, slightly
 * below where the kilt waistband paints. The full shape spans
 * y=38..54 including the fur top, leather body, and three tassels.
 *
 * Palette: dark leather (ink brown), natural badger-fur top (black
 * + silver highlights), brass cantle + tassel tips. Chosen to read
 * against the red kilt tartan without competing — earthy browns let
 * the pouch recede a half-step.
 */

import type { AccessoryDrawer, AccessoryDrawCtx } from '../AccessoryDrawer';
import { PALETTE } from '../../../art/palettes';

const SPRITE_SIZE = 80;
const CX = SPRITE_SIZE / 2;
const BASE_CY = 44;

const LEATHER_DARK = 0x1a0e06;
const LEATHER_MID = 0x3a2010;
const LEATHER_LIGHT = 0x5a3418;
const FUR_BLACK = 0x0a0a0a;
const FUR_SILVER = 0x7a7a7a;

interface SporranFrame {
  readonly y: number;
  readonly x?: number;
}

function drawSporran(g: Phaser.GameObjects.Graphics, frame: SporranFrame): void {
  const cx = CX + (frame.x ?? 0);
  const cy = BASE_CY + frame.y;

  // ── Hanging strap — two thin chains from belt line down to cantle ──
  g.fillStyle(PALETTE.gold.aged, 0.9);
  g.fillRect(cx - 4, cy - 6, 1, 4);
  g.fillRect(cx + 3, cy - 6, 1, 4);

  // ── Cantle — brass band across the top of the pouch ──
  g.fillStyle(0x000000, 0.4);
  g.fillRect(cx - 7, cy - 2, 14, 2);
  g.fillStyle(PALETTE.gold.aged, 1);
  g.fillRect(cx - 7, cy - 3, 14, 2);
  g.fillStyle(PALETTE.gold.bright, 1);
  g.fillRect(cx - 6, cy - 3, 12, 1);

  // ── Pouch body — leather rounded rectangle ──
  g.fillStyle(LEATHER_DARK, 1);
  g.fillRoundedRect(cx - 7, cy, 14, 8, 2);
  g.fillStyle(LEATHER_MID, 1);
  g.fillRoundedRect(cx - 6, cy + 1, 12, 6, 2);
  g.fillStyle(LEATHER_LIGHT, 0.7);
  g.fillEllipse(cx - 2, cy + 2, 6, 2);

  // ── Badger-fur top cap — soft fuzzy dome above the cantle ──
  g.fillStyle(FUR_BLACK, 1);
  g.fillEllipse(cx, cy - 4, 16, 5);
  g.fillStyle(FUR_BLACK, 0.9);
  g.fillCircle(cx - 5, cy - 4, 2.5);
  g.fillCircle(cx + 5, cy - 4, 2.5);
  // Silver highlight tips — badger-fur dappling
  g.fillStyle(FUR_SILVER, 0.6);
  g.fillCircle(cx - 3, cy - 5, 1);
  g.fillCircle(cx + 2, cy - 5, 1);
  g.fillCircle(cx + 5, cy - 5, 0.8);

  // ── Tassels — three short leather dangles with brass tips ──
  g.fillStyle(LEATHER_DARK, 1);
  g.fillRect(cx - 5, cy + 8, 1, 4);
  g.fillRect(cx - 1, cy + 8, 1, 5);
  g.fillRect(cx + 4, cy + 8, 1, 4);
  g.fillStyle(PALETTE.gold.bright, 1);
  g.fillCircle(cx - 4.5, cy + 12, 1);
  g.fillCircle(cx - 0.5, cy + 13, 1);
  g.fillCircle(cx + 4.5, cy + 12, 1);
}

function drawSporranIdle0(g: Phaser.GameObjects.Graphics): void {
  drawSporran(g, { y: 0 });
}
function drawSporranIdle1(g: Phaser.GameObjects.Graphics): void {
  drawSporran(g, { y: 0 });
}
function drawSporranWalking0(g: Phaser.GameObjects.Graphics): void {
  drawSporran(g, { y: 0 });
}
function drawSporranWalking1(g: Phaser.GameObjects.Graphics): void {
  drawSporran(g, { y: 1, x: -1 });
}
function drawSporranWalking2(g: Phaser.GameObjects.Graphics): void {
  drawSporran(g, { y: 0 });
}
function drawSporranWalking3(g: Phaser.GameObjects.Graphics): void {
  drawSporran(g, { y: 1, x: 1 });
}
function drawSporranAttacking0(g: Phaser.GameObjects.Graphics): void {
  drawSporran(g, { y: 0, x: 1 });
}
function drawSporranAttacking1(g: Phaser.GameObjects.Graphics): void {
  drawSporran(g, { y: -1, x: 2 });
}
function drawSporranAttacking2(g: Phaser.GameObjects.Graphics): void {
  drawSporran(g, { y: 0, x: 1 });
}
function drawSporranAttacking3(g: Phaser.GameObjects.Graphics): void {
  drawSporran(g, { y: 0, x: 0 });
}
function drawSporranHurt0(g: Phaser.GameObjects.Graphics): void {
  drawSporran(g, { y: 1, x: -2 });
}
function drawSporranHurt1(g: Phaser.GameObjects.Graphics): void {
  drawSporran(g, { y: 0, x: -1 });
}

const FRAMES = {
  idle: [drawSporranIdle0, drawSporranIdle1],
  walking: [
    drawSporranWalking0,
    drawSporranWalking1,
    drawSporranWalking2,
    drawSporranWalking3,
  ],
  attacking: [
    drawSporranAttacking0,
    drawSporranAttacking1,
    drawSporranAttacking2,
    drawSporranAttacking3,
  ],
  hurt: [drawSporranHurt0, drawSporranHurt1],
} as const;

type AuthoredState = keyof typeof FRAMES;

export const SPORRAN_DRAWER: AccessoryDrawer = {
  id: 'sporran',
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
        `sporran: frame ${ctx.frame} out of range for state ${ctx.state}`,
      );
    }
    drawer(g);
  },
};
