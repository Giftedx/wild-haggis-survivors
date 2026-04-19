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
  scale = 1,
): void {
  // Sepal base — green cup.
  g.fillStyle(THISTLE_GREEN, 1);
  g.fillEllipse(cx, cy + 2 * scale, 5 * scale, 3 * scale);
  g.fillStyle(0x184020, 1);
  g.fillEllipse(cx, cy + 2.5 * scale, 4 * scale, 2 * scale);

  // Bloom — layered purple with highlight.
  g.fillStyle(THISTLE_PURPLE, 1);
  g.fillEllipse(cx, cy - 1 * scale, 5 * scale, 5 * scale);
  g.fillStyle(THISTLE_BLOOM, 1);
  g.fillEllipse(cx - 0.5 * scale, cy - 2 * scale, 3 * scale, 3 * scale);
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(cx - 1 * scale, cy - 2.5 * scale, 1 * scale);

  // Spiky petals — three radial spikes.
  g.fillStyle(THISTLE_BLOOM, 0.9);
  g.fillTriangle(cx - 3, cy - 3, cx - 2, cy - 5, cx - 1, cy - 3);
  g.fillTriangle(cx, cy - 4, cx + 1, cy - 6, cx + 2, cy - 4);
  g.fillTriangle(cx + 2, cy - 2, cx + 3, cy - 4, cx + 4, cy - 2);
}

function drawThistleCrown(
  g: Phaser.GameObjects.Graphics,
  frame: ThistleFrame,
): void {
  const cx = CX + (frame.x ?? 0);
  const cy = BASE_CY + frame.y;

  // ── Gold band — thin arc binding the buds ──
  g.fillStyle(GOLD_BAND, 1);
  g.fillEllipse(cx, cy + 4, 22, 3);
  g.fillStyle(PALETTE.gold.bright, 0.8);
  g.fillEllipse(cx, cy + 3.5, 20, 2);

  // ── Five thistle buds across the top ──
  drawThistleBud(g, cx - 8, cy + 3);
  drawThistleBud(g, cx - 4, cy + 1);
  drawThistleBud(g, cx, cy);
  drawThistleBud(g, cx + 4, cy + 1);
  drawThistleBud(g, cx + 8, cy + 3);
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
