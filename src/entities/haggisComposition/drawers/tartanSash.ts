/**
 * Tartan sash — a diagonal clan-sash running from the haggis's left
 * shoulder down to the right hip. Body layer: renders on top of the
 * kilt and behind any front-layer items (sporran, flask), so when
 * the player has picked both kilt and sash, the sash hangs cleanly
 * across the kilt.
 *
 * Canvas: 80×80 with origin (0.5, 0.5). The sash runs from roughly
 * (25, 25) at the shoulder to (54, 50) at the hip. Painted as a thick
 * diagonal band using chained rectangles so the Graphics API can
 * render it without a custom rotation. Tartan pattern on the band
 * matches the kilt's Red Stewart scheme.
 */

import type { AccessoryDrawer, AccessoryDrawCtx } from '../AccessoryDrawer';
import { PALETTE } from '../../../art/palettes';

const SASH_RED = 0x9a1f1f;
const SASH_RED_DARK = 0x6b1010;
const SASH_GREEN = 0x244a2a;

interface SashFrame {
  readonly y: number;
  readonly x?: number;
}

function drawSash(g: Phaser.GameObjects.Graphics, frame: SashFrame): void {
  const dx = frame.x ?? 0;
  const dy = frame.y;

  // ── Diagonal band from the haggis's left-shoulder edge (clear of
  // the eye line) down to the right hip. Routed BELOW the face so the
  // sash never crosses the eyes or mouth. Previously started at
  // (24, 22) which painted straight across the left eye; now starts
  // at the outside of the shoulder (18, 34) and runs to the right
  // hip at (54, 58). ──
  const steps = 14;
  const x0 = 18 + dx;
  const y0 = 34 + dy;
  const x1 = 54 + dx;
  const y1 = 58 + dy;

  // Shadow / outline pass
  g.fillStyle(SASH_RED_DARK, 1);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    g.fillRect(x - 2, y - 2, 6, 6);
  }

  // Main red field
  g.fillStyle(SASH_RED, 1);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    g.fillRect(x - 1, y - 1, 4, 4);
  }

  // Forest-green warp stripe down the middle of the sash.
  g.fillStyle(SASH_GREEN, 0.85);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    g.fillRect(x, y, 2, 2);
  }

  // Yellow pinstripe — tiny dots along the band.
  g.fillStyle(PALETTE.gold.bright, 0.9);
  for (let i = 1; i < steps; i += 2) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    g.fillRect(x + 1, y + 1, 1, 1);
  }

  // ── Shoulder clasp — brass brooch at the top of the sash ──
  g.fillStyle(PALETTE.gold.aged, 1);
  g.fillCircle(x0 + 1, y0 - 1, 3);
  g.fillStyle(PALETTE.gold.bright, 1);
  g.fillCircle(x0 + 1, y0 - 1, 2);
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(x0, y0 - 2, 0.8);

  // ── Fringed hem at the hip end ──
  g.fillStyle(PALETTE.gold.aged, 1);
  g.fillRect(x1 - 2, y1 + 1, 5, 1);
  g.fillStyle(SASH_RED_DARK, 1);
  g.fillRect(x1 - 2, y1 + 2, 1, 3);
  g.fillRect(x1, y1 + 2, 1, 4);
  g.fillRect(x1 + 2, y1 + 2, 1, 3);
}

function drawIdle0(g: Phaser.GameObjects.Graphics): void {
  drawSash(g, { y: 0 });
}
function drawIdle1(g: Phaser.GameObjects.Graphics): void {
  drawSash(g, { y: 0 });
}
function drawWalking0(g: Phaser.GameObjects.Graphics): void {
  drawSash(g, { y: 0 });
}
function drawWalking1(g: Phaser.GameObjects.Graphics): void {
  drawSash(g, { y: -1, x: -1 });
}
function drawWalking2(g: Phaser.GameObjects.Graphics): void {
  drawSash(g, { y: 0 });
}
function drawWalking3(g: Phaser.GameObjects.Graphics): void {
  drawSash(g, { y: -1, x: 1 });
}
function drawAttacking0(g: Phaser.GameObjects.Graphics): void {
  drawSash(g, { y: 0, x: 1 });
}
function drawAttacking1(g: Phaser.GameObjects.Graphics): void {
  drawSash(g, { y: -2, x: 2 });
}
function drawAttacking2(g: Phaser.GameObjects.Graphics): void {
  drawSash(g, { y: -1, x: 1 });
}
function drawAttacking3(g: Phaser.GameObjects.Graphics): void {
  drawSash(g, { y: 0, x: 0 });
}
function drawHurt0(g: Phaser.GameObjects.Graphics): void {
  drawSash(g, { y: 1, x: -2 });
}
function drawHurt1(g: Phaser.GameObjects.Graphics): void {
  drawSash(g, { y: 0, x: -1 });
}

const FRAMES = {
  idle: [drawIdle0, drawIdle1],
  walking: [drawWalking0, drawWalking1, drawWalking2, drawWalking3],
  attacking: [drawAttacking0, drawAttacking1, drawAttacking2, drawAttacking3],
  hurt: [drawHurt0, drawHurt1],
} as const;

type AuthoredState = keyof typeof FRAMES;

export const TARTAN_SASH_DRAWER: AccessoryDrawer = {
  id: 'tartan_sash',
  layer: 'body',
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
        `tartanSash: frame ${ctx.frame} out of range for state ${ctx.state}`,
      );
    }
    drawer(g);
  },
};
