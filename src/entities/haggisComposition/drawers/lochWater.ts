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
  // Ripple halo — wider concentric ring beneath the droplet so the
  // feet look wet. Darker ring inside a lighter one sells the splash.
  g.fillStyle(LOCH_MID, 0.35);
  g.fillEllipse(cx, cy + 4, 13, 3.5);
  g.fillStyle(LOCH_LIGHT, 0.25);
  g.fillEllipse(cx, cy + 4, 9, 2);

  // Teardrop — layered ellipses (bumped 6×7 → 8×9) narrowing to a
  // point at the top. Larger so it reads clearly at gameplay scale
  // without drowning out the haggis.
  g.fillStyle(LOCH_DEEP, 1);
  g.fillEllipse(cx, cy, 8, 9);
  g.fillTriangle(cx - 2.5, cy - 3, cx, cy - 7, cx + 2.5, cy - 3);
  g.fillStyle(LOCH_MID, 1);
  g.fillEllipse(cx, cy, 6, 7);
  g.fillTriangle(cx - 2, cy - 3, cx, cy - 6, cx + 2, cy - 3);
  g.fillStyle(LOCH_LIGHT, 0.9);
  g.fillEllipse(cx - 0.5, cy - 0.5, 4, 5);

  // Highlight — white spark top-left of the droplet. Slightly larger
  // so the wet-shine reads even when the rest is small.
  g.fillStyle(LOCH_HIGHLIGHT, 0.95);
  g.fillCircle(cx - 1.2, cy - 1.5, 1.2);
  g.fillStyle(0xffffff, 0.75);
  g.fillCircle(cx - 1.5, cy - 2, 0.6);
}

function drawWater(g: Phaser.GameObjects.Graphics, frame: WaterFrame): void {
  const dx = frame.x ?? 0;
  const dy = frame.y;
  // Left/right droplets flank the haggis feet at y=62 (just beside
  // the hoof line, not floating in mid-air below). Pushed outward to
  // x=18/62 so the ripple halos frame the feet instead of tucking
  // under the belly where they got lost.
  drawDroplet(g, 18 + dx + frame.left.x, 62 + dy + frame.left.y);
  drawDroplet(g, 62 + dx + frame.right.x, 62 + dy + frame.right.y);
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

// ── Celebrating frames — droplets bounce with the hop. ──
function drawCelebrating0(g: Phaser.GameObjects.Graphics): void {
  drawWater(g, { y: +2, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } });
}
function drawCelebrating1(g: Phaser.GameObjects.Graphics): void {
  drawWater(g, { y: -5, left: { x: 0, y: -2 }, right: { x: 0, y: -2 } });
}
function drawCelebrating2(g: Phaser.GameObjects.Graphics): void {
  drawWater(g, { y: 0, x: -1, left: { x: 1, y: 0 }, right: { x: -1, y: 0 } });
}
function drawCelebrating3(g: Phaser.GameObjects.Graphics): void {
  drawWater(g, { y: 0, x: +1, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } });
}

// ── Dying frames — droplets sink into the ground. ──
function drawDying0(g: Phaser.GameObjects.Graphics): void {
  drawWater(g, { y: +1, x: -1, left: { x: 0, y: 1 }, right: { x: 0, y: 1 } });
}
function drawDying1(g: Phaser.GameObjects.Graphics): void {
  drawWater(g, { y: +3, x: -2, left: { x: -1, y: 2 }, right: { x: 1, y: 2 } });
}
function drawDying2(g: Phaser.GameObjects.Graphics): void {
  drawWater(g, { y: +5, x: -3, left: { x: -2, y: 3 }, right: { x: 2, y: 3 } });
}

const FRAMES = {
  idle: [drawIdle0, drawIdle1],
  walking: [drawWalking0, drawWalking1, drawWalking2, drawWalking3],
  attacking: [drawAttacking0, drawAttacking1, drawAttacking2, drawAttacking3],
  hurt: [drawHurt0, drawHurt1],
  celebrating: [drawCelebrating0, drawCelebrating1, drawCelebrating2, drawCelebrating3],
  dying: [drawDying0, drawDying1, drawDying2],
} as const;

type AuthoredState = keyof typeof FRAMES;

export const LOCH_WATER_DRAWER: AccessoryDrawer = {
  id: 'loch_water',
  layer: 'behind',
  authoredStates: ['idle', 'walking', 'attacking', 'hurt', 'celebrating', 'dying'] as const,
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
