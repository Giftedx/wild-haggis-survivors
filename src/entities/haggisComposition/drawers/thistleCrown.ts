/**
 * Thistle crown — a ring of spiky purple thistles worn on top of the
 * haggis's head (or on top of the tam when both are equipped). Above
 * layer: sits at the highest depth alongside the tam so both stack
 * cleanly.
 *
 * Canvas: 80×80 with origin (0.5, 0.5). The crown ring sits at
 * texture y=4..12 — directly above the haggis silhouette top (which
 * maps to screen y = player.y − 17) so the thistles poke UP from
 * whatever's on the head.
 *
 * Design: 5 thistle buds in a partial-ring across the top. Each bud
 * has a green sepal base and a purple flowering crown. A woven gold
 * band binds the base into a crown silhouette.
 */

import type { AccessoryDrawer, AccessoryDrawCtx } from '../AccessoryDrawer';
import { PALETTE } from '../../../art/palettes';

const CX = 40;
const BASE_CY = 10;

const THISTLE_PURPLE = 0x6a2a8c;
const THISTLE_BLOOM = 0x9a4ac0;
const THISTLE_GREEN = 0x2a5a3a;
const GOLD_BAND = PALETTE.gold.aged;

interface ThistleFrame {
  readonly y: number;
  readonly x?: number;
}

function drawThistleBud(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Sepal base — green cup (bumped from 4×2.5 → 5×3 for readability).
  g.fillStyle(THISTLE_GREEN, 1);
  g.fillEllipse(cx, cy + 2, 5, 3);
  g.fillStyle(0x184020, 1);
  g.fillEllipse(cx, cy + 2.5, 4, 2);

  // Bloom — layered purple with highlight (5×5 instead of 4×4).
  g.fillStyle(THISTLE_PURPLE, 1);
  g.fillEllipse(cx, cy - 1, 5, 5);
  g.fillStyle(THISTLE_BLOOM, 1);
  g.fillEllipse(cx - 0.5, cy - 1.5, 3, 3);
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(cx - 0.8, cy - 2, 0.9);

  // Three spiky petals — ring of three for a crown silhouette that
  // reads even at gameplay scale. Heights bumped so the purple spikes
  // stick out past the crown's gold band.
  g.fillStyle(THISTLE_BLOOM, 0.95);
  g.fillTriangle(cx - 2.5, cy - 3, cx - 1.5, cy - 6, cx - 0.5, cy - 3);
  g.fillTriangle(cx - 0.5, cy - 3.5, cx + 0.5, cy - 7, cx + 1.5, cy - 3.5);
  g.fillTriangle(cx + 1.5, cy - 3, cx + 2.5, cy - 6, cx + 3.5, cy - 3);
}

function drawThistleCrown(
  g: Phaser.GameObjects.Graphics,
  frame: ThistleFrame,
): void {
  const cx = CX + (frame.x ?? 0);
  const cy = BASE_CY + frame.y;

  // ── Gold band — chunkier circlet so the crown reads as a single
  // hero shape around the buds (thin 16×2.5 → beefier 18×4). ──
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(cx, cy + 5, 20, 4);
  g.fillStyle(GOLD_BAND, 1);
  g.fillEllipse(cx, cy + 4, 18, 4);
  g.fillStyle(PALETTE.gold.bright, 0.9);
  g.fillEllipse(cx, cy + 3.5, 16, 2.5);
  g.fillStyle(0xffffff, 0.4);
  g.fillEllipse(cx - 2, cy + 3, 6, 1);

  // ── Three thistle buds — centre + two flanking, wider spacing so
  // each bud reads clearly instead of blurring into the next. ──
  drawThistleBud(g, cx - 7, cy + 1);
  drawThistleBud(g, cx, cy - 2);
  drawThistleBud(g, cx + 7, cy + 1);
}

function drawIdle0(g: Phaser.GameObjects.Graphics): void {
  drawThistleCrown(g, { y: 0 });
}
function drawIdle1(g: Phaser.GameObjects.Graphics): void {
  drawThistleCrown(g, { y: 0 });
}
function drawWalking0(g: Phaser.GameObjects.Graphics): void {
  drawThistleCrown(g, { y: 0 });
}
function drawWalking1(g: Phaser.GameObjects.Graphics): void {
  drawThistleCrown(g, { y: -1, x: -1 });
}
function drawWalking2(g: Phaser.GameObjects.Graphics): void {
  drawThistleCrown(g, { y: 0 });
}
function drawWalking3(g: Phaser.GameObjects.Graphics): void {
  drawThistleCrown(g, { y: -1, x: 1 });
}
function drawAttacking0(g: Phaser.GameObjects.Graphics): void {
  drawThistleCrown(g, { y: 0, x: 1 });
}
function drawAttacking1(g: Phaser.GameObjects.Graphics): void {
  drawThistleCrown(g, { y: -2, x: 2 });
}
function drawAttacking2(g: Phaser.GameObjects.Graphics): void {
  drawThistleCrown(g, { y: -1, x: 1 });
}
function drawAttacking3(g: Phaser.GameObjects.Graphics): void {
  drawThistleCrown(g, { y: 0, x: 0 });
}
function drawHurt0(g: Phaser.GameObjects.Graphics): void {
  drawThistleCrown(g, { y: 1, x: -2 });
}
function drawHurt1(g: Phaser.GameObjects.Graphics): void {
  drawThistleCrown(g, { y: 0, x: -1 });
}

const FRAMES = {
  idle: [drawIdle0, drawIdle1],
  walking: [drawWalking0, drawWalking1, drawWalking2, drawWalking3],
  attacking: [drawAttacking0, drawAttacking1, drawAttacking2, drawAttacking3],
  hurt: [drawHurt0, drawHurt1],
} as const;

type AuthoredState = keyof typeof FRAMES;

export const THISTLE_CROWN_DRAWER: AccessoryDrawer = {
  id: 'thistle_crown',
  layer: 'above',
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
        `thistleCrown: frame ${ctx.frame} out of range for state ${ctx.state}`,
      );
    }
    drawer(g);
  },
};
