/**
 * Kilt — traditional Scottish tartan wrap covering the haggis's
 * lower body and legs. Body-layer accessory: sits between the
 * legs/belly silhouette and any front-layer items (sporran, flask),
 * so a sporran worn over the kilt reads cleanly.
 *
 * Canvas: 80×80 with origin (0.5, 0.5). The haggis body center sits
 * at texture (40, 40); the lower belly line at y ≈ 42 and the leg
 * tips at y ≈ 56. The kilt texture paints y=38..58 — from just below
 * the navel (so the tartan starts on the belly) down past the leg
 * tops with a pleated fringe grazing the ground.
 *
 * Colour scheme is the Red Royal Stewart-inspired set: bright crimson
 * field, forest-green warp, yellow + white pinstripes. Chosen over a
 * more muted hunting tartan because the haggis is a small sprite —
 * saturated colours read at gameplay scale.
 */

import type { AccessoryDrawer, AccessoryDrawCtx } from '../AccessoryDrawer';
import { PALETTE } from '../../../art/palettes';

const SPRITE_SIZE = 80;
const CX = SPRITE_SIZE / 2;
// Pushed lower (46 → 53) so the kilt's waistband sits BELOW the haggis's
// mouth line (y≈45) instead of cutting across the snout. Internal layout
// is also compressed below so the pleat tips still reach the leg tops
// without trailing off past the feet.
const BASE_CY = 53;

const KILT_RED = 0x9a1f1f;
const KILT_RED_DARK = 0x6b1010;
const KILT_GREEN = 0x244a2a;
const KILT_YELLOW = PALETTE.gold.bright;

interface KiltFrame {
  readonly y: number;
  readonly x?: number;
}

function drawKilt(g: Phaser.GameObjects.Graphics, frame: KiltFrame): void {
  const cx = CX + (frame.x ?? 0);
  const cy = BASE_CY + frame.y;

  // ── Main field — rectangular wrap covering hip-to-knees. Shorter
  // than the previous 14 px tall version (10 px main + 4 px pleats)
  // so the top edge lands on the waist without bleeding into the
  // snout above. ──
  g.fillStyle(KILT_RED_DARK, 1);
  g.fillRect(cx - 15, cy - 5, 30, 10);
  g.fillStyle(KILT_RED, 1);
  g.fillRect(cx - 14, cy - 5, 28, 9);

  // ── Warp stripes — forest green vertical bars ──
  g.fillStyle(KILT_GREEN, 0.85);
  g.fillRect(cx - 11, cy - 5, 2, 9);
  g.fillRect(cx - 3, cy - 5, 2, 9);
  g.fillRect(cx + 5, cy - 5, 2, 9);
  g.fillRect(cx + 11, cy - 5, 1, 9);

  // ── Weft stripes — horizontal bars ──
  g.fillStyle(KILT_GREEN, 0.7);
  g.fillRect(cx - 14, cy - 3, 28, 1);
  g.fillRect(cx - 14, cy + 1, 28, 1);

  // ── Pinstripes — the tartan's accent thread ──
  g.fillStyle(KILT_YELLOW, 0.9);
  g.fillRect(cx - 9, cy - 5, 1, 9);
  g.fillRect(cx - 1, cy - 5, 1, 9);
  g.fillRect(cx + 7, cy - 5, 1, 9);
  g.fillStyle(0xffffff, 0.6);
  g.fillRect(cx - 14, cy, 28, 1);

  // ── Pleats — vertical ripple at the fringe bottom ──
  g.fillStyle(KILT_RED_DARK, 1);
  const pleatY = cy + 4;
  for (let i = -14; i <= 14; i += 4) {
    g.fillTriangle(cx + i, pleatY, cx + i + 2, pleatY + 4, cx + i + 4, pleatY);
  }

  // ── Waistband — a narrow darker band at the top ──
  g.fillStyle(0x1a0505, 1);
  g.fillRect(cx - 15, cy - 6, 30, 2);
  g.fillStyle(PALETTE.gold.aged, 0.85);
  g.fillRect(cx - 14, cy - 5, 28, 1);

  // ── Belt buckle — small gold rectangle centred on waist ──
  g.fillStyle(PALETTE.gold.bright, 1);
  g.fillRect(cx - 2, cy - 6, 4, 3);
  g.fillStyle(0x000000, 0.4);
  g.fillRect(cx - 1, cy - 5, 2, 1);
}

function drawKiltIdle0(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: 0 });
}
function drawKiltIdle1(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: 0 });
}
// Walking frames mirror the body's breathY + leg shuffle tempo. The
// kilt sways subtly as the haggis moves — not enough to distract,
// just enough to suggest fabric motion.
function drawKiltWalking0(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: 0 });
}
function drawKiltWalking1(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: -1, x: -1 });
}
function drawKiltWalking2(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: 0 });
}
function drawKiltWalking3(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: -1, x: 1 });
}
function drawKiltAttacking0(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: 0, x: 1 });
}
function drawKiltAttacking1(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: -2, x: 2 });
}
function drawKiltAttacking2(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: -1, x: 1 });
}
function drawKiltAttacking3(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: 0, x: 0 });
}
function drawKiltHurt0(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: 1, x: -2 });
}
function drawKiltHurt1(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: 0, x: -1 });
}

// ── Celebrating frames — kilt bounces forward with the hop. ──
function drawKiltCelebrating0(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: +2 });
}
function drawKiltCelebrating1(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: -5 });
}
function drawKiltCelebrating2(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: 0, x: -1 });
}
function drawKiltCelebrating3(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: 0, x: +1 });
}

// ── Dying frames — kilt drops forward as body crumples. ──
function drawKiltDying0(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: +1, x: -1 });
}
function drawKiltDying1(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: +3, x: -2 });
}
function drawKiltDying2(g: Phaser.GameObjects.Graphics): void {
  drawKilt(g, { y: +5, x: -3 });
}

const FRAMES = {
  idle: [drawKiltIdle0, drawKiltIdle1],
  walking: [
    drawKiltWalking0,
    drawKiltWalking1,
    drawKiltWalking2,
    drawKiltWalking3,
  ],
  attacking: [
    drawKiltAttacking0,
    drawKiltAttacking1,
    drawKiltAttacking2,
    drawKiltAttacking3,
  ],
  hurt: [drawKiltHurt0, drawKiltHurt1],
  celebrating: [
    drawKiltCelebrating0,
    drawKiltCelebrating1,
    drawKiltCelebrating2,
    drawKiltCelebrating3,
  ],
  dying: [drawKiltDying0, drawKiltDying1, drawKiltDying2],
} as const;

type AuthoredState = keyof typeof FRAMES;

export const KILT_DRAWER: AccessoryDrawer = {
  id: 'kilt',
  layer: 'body',
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
        `kilt: frame ${ctx.frame} out of range for state ${ctx.state}`,
      );
    }
    drawer(g);
  },
};
