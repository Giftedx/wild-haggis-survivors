/**
 * Tam-o-shanter — iconic Scottish flat wool bonnet. Phase 0 reference
 * accessory. Sits on the `above` layer so it renders on top of the
 * haggis body.
 *
 * Canvas: 80×80. The haggis body is 56×56 with its silhouette
 * occupying texture y=11 through y=46. To give the tam air above the
 * body silhouette, the accessory texture is larger than the haggis
 * texture. Both sprites use origin (0.5, 0.5) and are positioned at
 * the same anchor (Player), so the accessory's larger canvas means
 * its extra pixels spread above/below/around the haggis equally —
 * the tam gets drawn in the TOP portion, above where the haggis
 * silhouette would appear if it were composited into this same 80×80
 * frame.
 *
 * Anchor math:
 *   Player's haggis body center = texture (28, 26) in its 56×56 frame,
 *   which maps to screen (player.x, player.y − 2). The top of the
 *   haggis silhouette (body ellipse) lies at texture y=11 → screen
 *   y = player.y − 17. The top of the brow tufts sits at y=13 in the
 *   haggis frame (≈ screen player.y − 15).
 *
 *   In this 80×80 accessory texture, origin (0.5, 0.5) puts texture
 *   (40, 40) at the same screen position. To draw the tam CLEARLY
 *   above the silhouette, we target screen y < player.y − 20 for the
 *   bottom of the brim. That maps to accessory texture y < 20.
 *
 *   Crown at texture (40, 16); toorie at (40, 8); brim at (40, 22);
 *   undershadow at (40, 26). Whole tam occupies accessory y=4 to y=28,
 *   which maps to screen player.y − 36 to player.y − 12 — comfortably
 *   above the haggis head, with a small shadow overlap into the very
 *   top of the body fur for seating realism.
 */

import type { AccessoryDrawer, AccessoryDrawCtx } from '../AccessoryDrawer';
import { PALETTE } from '../../../art/palettes';

const SPRITE_SIZE = 80;
/** Horizontal centre of the 80×80 accessory canvas. */
const CX = SPRITE_SIZE / 2;
/** Vertical anchor of the tam in the accessory texture. Matched to
 *  "bonnet-sits-on-head" per the anchor math in the module doc. */
const BASE_CY = 16;

/** Navy wool — darker than the palette stone, not quite pure black. */
const WOOL_SHADOW = 0x0e1020;
const WOOL_MID = 0x1c2040;
const WOOL_HIGHLIGHT = 0x3a4268;
/** Tartan cross-stripe (forest green against navy + gold). */
const TARTAN_GREEN = 0x2a5a3a;

interface TamFrame {
  /** Body y offset applied on top of BASE_CY. */
  readonly y: number;
  /** Horizontal sway — tiny tilt during walking frames. */
  readonly x?: number;
}

function drawTam(g: Phaser.GameObjects.Graphics, frame: TamFrame): void {
  const cx = CX + (frame.x ?? 0);
  const cy = BASE_CY + frame.y;

  // ── Undershadow — seats the bonnet into the fur below. Sits just
  // inside the haggis silhouette top so the tam reads as worn, not
  // floating. ──
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(cx, cy + 10, 26, 5);

  // ── Brim — the flat wool lip that encircles the head. Two tonal
  // passes so the ring stays visible at small sprite scales. ──
  g.fillStyle(WOOL_SHADOW, 1);
  g.fillEllipse(cx, cy + 7, 26, 8);
  g.fillStyle(WOOL_MID, 1);
  g.fillEllipse(cx, cy + 7, 24, 6);

  // ── Crown — the rounded wool dome. Wider at the base than the top
  // for a classic bonnet silhouette. ──
  g.fillStyle(WOOL_SHADOW, 1);
  g.fillEllipse(cx, cy, 22, 14);
  g.fillStyle(WOOL_MID, 1);
  g.fillEllipse(cx, cy - 1, 20, 12);

  // Upper-left highlight (style-bible light model).
  g.fillStyle(WOOL_HIGHLIGHT, 0.85);
  g.fillEllipse(cx - 5, cy - 4, 9, 5);
  g.fillStyle(0xffffff, 0.22);
  g.fillEllipse(cx - 6, cy - 5, 5, 2);

  // Wool knit-texture speckles.
  g.fillStyle(WOOL_HIGHLIGHT, 0.55);
  g.fillCircle(cx + 3, cy - 2, 1);
  g.fillCircle(cx - 2, cy + 1, 1);
  g.fillCircle(cx + 6, cy, 0.9);
  g.fillCircle(cx - 7, cy + 2, 0.8);
  g.fillStyle(WOOL_HIGHLIGHT, 0.3);
  g.fillCircle(cx + 7, cy + 2, 0.7);
  g.fillCircle(cx, cy + 3, 0.7);

  // ── Tartan band — gold weft + forest-green warp seam where crown
  // meets brim. The gold reads first, the green is the accent. Cross-
  // weave ticks give the band texture. ──
  g.fillStyle(PALETTE.gold.aged, 1);
  g.fillRect(cx - 12, cy + 5, 24, 3);
  g.fillStyle(TARTAN_GREEN, 0.9);
  g.fillRect(cx - 12, cy + 6, 24, 1);
  g.fillStyle(PALETTE.gold.bright, 1);
  for (let dx = -11; dx <= 11; dx += 3) {
    g.fillRect(cx + dx, cy + 5, 1, 3);
  }

  // Seam line where brim meets crown — just a pencil-dark tick.
  g.fillStyle(0x000000, 0.35);
  g.fillRect(cx - 11, cy + 4, 22, 1);

  // ── Toorie (pom-pom) — proud red wool button on top. Three-stage
  // red + white glint sells the roundness. ──
  g.fillStyle(PALETTE.red.dried, 1);
  g.fillCircle(cx, cy - 8, 3.6);
  g.fillStyle(PALETTE.red.deep, 1);
  g.fillCircle(cx - 0.3, cy - 9, 2.8);
  g.fillStyle(PALETTE.red.arterial, 1);
  g.fillCircle(cx - 0.8, cy - 9.5, 1.6);
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(cx - 1.5, cy - 10, 0.8);
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
