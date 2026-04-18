/**
 * Tam-o-shanter — iconic Scottish flat wool bonnet. Phase 0 reference
 * accessory. Sits on the above layer so it renders on top of the
 * haggis body. Sprite size 56×56 matches the haggis texture so the
 * accessory-layer sprite can share the anchor transform 1:1.
 *
 * Anatomy (from top):
 *   - Red toorie (pom-pom)
 *   - Navy wool crown — rounded cap with a lighter upper-left highlight
 *   - Gold-threaded tartan band with a green cross-stripe
 *   - Darker undershadow that nestles into the head fur
 *
 * Position budget: the haggis body sprite centres at y≈26 with the
 * skull-top around y≈9–12. This drawer's `cy` baseline is 8 so the
 * brim lands at y≈12, the crown top at y≈5, and the toorie peaks at
 * y≈1. The whole tam sits cleanly above the brow tufts.
 *
 * Inspiration: Still Game Jack's bonnet, Trainspotting cast stills,
 * Scottish regimental feather bonnets reduced to the everyday tam.
 */

import type { AccessoryDrawer, AccessoryDrawCtx } from '../AccessoryDrawer';
import { PALETTE } from '../../../art/palettes';

const SPRITE_SIZE = 56;

/** Navy wool — darker than the palette stone, not quite pure black. */
const WOOL_SHADOW = 0x0e1020;
const WOOL_MID = 0x1c2040;
const WOOL_HIGHLIGHT = 0x3a4268;
/** Tartan cross-stripe (forest green against navy + gold). */
const TARTAN_GREEN = 0x2a5a3a;

interface TamFrame {
  /** Body y offset applied on top of the baseline cy. */
  readonly y: number;
  /** Horizontal sway — tiny tilt during walking frames. */
  readonly x?: number;
}

function drawTam(g: Phaser.GameObjects.Graphics, frame: TamFrame): void {
  const cx = SPRITE_SIZE / 2 + (frame.x ?? 0);
  // Baseline cy = 8 puts the tam above the haggis's brow tufts (y≈16).
  const cy = 8 + frame.y;

  // Undershadow — darker ellipse tucked behind the brim so the tam
  // looks seated on the fur, not floating.
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(cx, cy + 6, 22, 4);

  // Brim — the flat lip that circles the head. Darker wool than the
  // crown so the ring reads even with small bonnets.
  g.fillStyle(WOOL_SHADOW, 1);
  g.fillEllipse(cx, cy + 4, 22, 7);
  g.fillStyle(WOOL_MID, 1);
  g.fillEllipse(cx, cy + 4, 20, 5);

  // Crown — rounded wool dome. Slightly wider at the base.
  g.fillStyle(WOOL_SHADOW, 1);
  g.fillEllipse(cx, cy, 18, 11);
  g.fillStyle(WOOL_MID, 1);
  g.fillEllipse(cx, cy - 1, 16, 10);

  // Upper-left highlight (per style bible light model).
  g.fillStyle(WOOL_HIGHLIGHT, 0.75);
  g.fillEllipse(cx - 4, cy - 3, 7, 4);
  g.fillStyle(0xffffff, 0.18);
  g.fillEllipse(cx - 5, cy - 4, 4, 2);

  // Wool texture — small speckle tufts suggest knit.
  g.fillStyle(WOOL_HIGHLIGHT, 0.5);
  g.fillCircle(cx + 3, cy - 2, 0.9);
  g.fillCircle(cx - 2, cy + 1, 0.8);
  g.fillCircle(cx + 5, cy + 1, 0.7);

  // Tartan band — gold weft + forest-green warp stripe just above the
  // brim seam. The gold reads first, green is the accent.
  g.fillStyle(PALETTE.gold.aged, 1);
  g.fillRect(cx - 10, cy + 2, 20, 2);
  g.fillStyle(TARTAN_GREEN, 0.85);
  g.fillRect(cx - 10, cy + 3, 20, 1);
  // Vertical cross-weave ticks — every 3 px.
  g.fillStyle(PALETTE.gold.bright, 0.9);
  for (let dx = -9; dx <= 9; dx += 3) {
    g.fillRect(cx + dx, cy + 2, 1, 2);
  }

  // Seam line where brim meets crown.
  g.fillStyle(0x000000, 0.35);
  g.fillRect(cx - 9, cy + 1, 18, 1);

  // Toorie (pom-pom) — proud red wool button on top. Two-stage for a
  // rounded read: darker base + brighter highlight.
  g.fillStyle(PALETTE.red.dried, 1);
  g.fillCircle(cx, cy - 6, 3);
  g.fillStyle(PALETTE.red.deep, 1);
  g.fillCircle(cx, cy - 7, 2.3);
  g.fillStyle(PALETTE.red.arterial, 1);
  g.fillCircle(cx - 0.5, cy - 7.5, 1.3);
  // Toorie glint.
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(cx - 1, cy - 8, 0.7);
}

function drawTamIdle0(g: Phaser.GameObjects.Graphics): void {
  // Breathing in — bonnet settles 1 px with the body.
  drawTam(g, { y: 1 });
}

function drawTamIdle1(g: Phaser.GameObjects.Graphics): void {
  // Breathing out — bonnet rises with the body.
  drawTam(g, { y: -1 });
}

function drawTamWalking0(g: Phaser.GameObjects.Graphics): void {
  drawTam(g, { y: 0, x: 0 });
}
function drawTamWalking1(g: Phaser.GameObjects.Graphics): void {
  drawTam(g, { y: -1, x: -1 });
}
function drawTamWalking2(g: Phaser.GameObjects.Graphics): void {
  drawTam(g, { y: 0, x: 0 });
}
function drawTamWalking3(g: Phaser.GameObjects.Graphics): void {
  drawTam(g, { y: -1, x: 1 });
}

const FRAMES = {
  idle: [drawTamIdle0, drawTamIdle1],
  walking: [drawTamWalking0, drawTamWalking1, drawTamWalking2, drawTamWalking3],
} as const;

export const TAM_O_SHANTER_DRAWER: AccessoryDrawer = {
  id: 'tam_o_shanter',
  layer: 'above',
  authoredStates: ['idle', 'walking'] as const,
  draw(g: Phaser.GameObjects.Graphics, ctx: AccessoryDrawCtx): void {
    const drawers = FRAMES[ctx.state as 'idle' | 'walking'];
    if (!drawers) {
      FRAMES.idle[0](g);
      return;
    }
    const drawer = drawers[ctx.frame];
    if (!drawer) {
      throw new Error(
        `tamOShanter: frame ${ctx.frame} out of range for state ${ctx.state}`,
      );
    }
    drawer(g);
  },
};

export function getTamSpriteSize(): number {
  return SPRITE_SIZE;
}
