/**
 * Loch water — a pair of enchanted water droplets orbiting at the
 * haggis's feet as a faint Highland-loch aura. Behind layer, anchored
 * below the body so the droplets read as "standing in a shimmer" and
 * don't compete with worn accessories. Stacks cleanly under the
 * Highland shield — they live at different x positions so there's
 * no overlap.
 *
 * Canvas: 80×80 with origin (0.5, 0.5). Two droplets sit at
 * (30, 62) and (50, 62) — flanking the haggis's feet line. Each
 * droplet has a teardrop silhouette, loch-blue fill, white highlight,
 * and a subtle ripple halo so the sprite feels active even without
 * a per-tick scaled animation.
 */

import type { AccessoryDrawer, AccessoryDrawCtx } from '../AccessoryDrawer';

const LOCH_DEEP = 0x0a2a4a;
const LOCH_MID = 0x1e4a7a;
const LOCH_LIGHT = 0x4a8abe;
const LOCH_HIGHLIGHT = 0xcaefff;

interface DropletOffset {
  readonly x: number;
  readonly y: number;
}

interface WaterFrame {
  readonly y: number;
  readonly x?: number;
  /** Left + right droplet offsets for a little parallax sway. */
  readonly left: DropletOffset;
  readonly right: DropletOffset;
}

function drawDroplet(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Ripple halo — faint concentric ring beneath the droplet.
  g.fillStyle(LOCH_MID, 0.25);
  g.fillEllipse(cx, cy + 3, 10, 3);

  // Teardrop — layered ellipses narrowing to a point at the top.
  g.fillStyle(LOCH_DEEP, 1);
  g.fillEllipse(cx, cy, 6, 7);
  g.fillTriangle(cx - 2, cy - 2, cx, cy - 5, cx + 2, cy - 2);
  g.fillStyle(LOCH_MID, 1);
  g.fillEllipse(cx, cy, 4, 5);
  g.fillTriangle(cx - 1.5, cy - 2, cx, cy - 4, cx + 1.5, cy - 2);
  g.fillStyle(LOCH_LIGHT, 0.85);
  g.fillEllipse(cx - 0.5, cy - 0.5, 2.5, 3);

  // Highlight — small white spark top-left of the droplet.
  g.fillStyle(LOCH_HIGHLIGHT, 0.9);
  g.fillCircle(cx - 1, cy - 1, 0.8);
  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(cx - 1.3, cy - 1.3, 0.4);
}

function drawWater(g: Phaser.GameObjects.Graphics, frame: WaterFrame): void {
  const dx = frame.x ?? 0;
  const dy = frame.y;
  // Left/right droplets flank the haggis feet. Pulled outward from
  // (30, 62) / (50, 62) to (20, 64) / (60, 64) so the droplets sit
  // beside the legs instead of under the belly where they got lost.
  drawDroplet(g, 20 + dx + frame.left.x, 64 + dy + frame.left.y);
  drawDroplet(g, 60 + dx + frame.right.x, 64 + dy + frame.right.y);
}

function drawIdle0(g: Phaser.GameObjects.Graphics): void {
  // Droplets barely breathe — a half-pixel sway.
  drawWater(g, { y: 0, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } });
}
function drawIdle1(g: Phaser.GameObjects.Graphics): void {
  drawWater(g, { y: 0, left: { x: 0, y: -1 }, right: { x: 0, y: -1 } });
}
// Walking — droplets trail behind opposite legs.
function drawWalking0(g: Phaser.GameObjects.Graphics): void {
  drawWater(g, { y: 0, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } });
}
function drawWalking1(g: Phaser.GameObjects.Graphics): void {
  drawWater(g, { y: -1, left: { x: 0, y: -1 }, right: { x: 0, y: 0 } });
}
function drawWalking2(g: Phaser.GameObjects.Graphics): void {
  drawWater(g, { y: 0, left: { x: 1, y: 0 }, right: { x: -1, y: 0 } });
}
function drawWalking3(g: Phaser.GameObjects.Graphics): void {
  drawWater(g, { y: -1, left: { x: 0, y: 0 }, right: { x: 0, y: -1 } });
}
function drawAttacking0(g: Phaser.GameObjects.Graphics): void {
  drawWater(g, { y: 0, x: 1, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } });
}
function drawAttacking1(g: Phaser.GameObjects.Graphics): void {
  drawWater(g, { y: -2, x: 2, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } });
}
function drawAttacking2(g: Phaser.GameObjects.Graphics): void {
  drawWater(g, { y: -1, x: 1, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } });
}
function drawAttacking3(g: Phaser.GameObjects.Graphics): void {
  drawWater(g, { y: 0, x: 0, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } });
}
function drawHurt0(g: Phaser.GameObjects.Graphics): void {
  drawWater(g, { y: 1, x: -2, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } });
}
function drawHurt1(g: Phaser.GameObjects.Graphics): void {
  drawWater(g, { y: 0, x: -1, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } });
}

const FRAMES = {
  idle: [drawIdle0, drawIdle1],
  walking: [drawWalking0, drawWalking1, drawWalking2, drawWalking3],
  attacking: [drawAttacking0, drawAttacking1, drawAttacking2, drawAttacking3],
  hurt: [drawHurt0, drawHurt1],
} as const;

type AuthoredState = keyof typeof FRAMES;

export const LOCH_WATER_DRAWER: AccessoryDrawer = {
  id: 'loch_water',
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
        `lochWater: frame ${ctx.frame} out of range for state ${ctx.state}`,
      );
    }
    drawer(g);
  },
};
