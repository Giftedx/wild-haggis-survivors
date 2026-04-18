/**
 * Tam-o-shanter — iconic Scottish flat wool bonnet. Phase 0 reference
 * accessory. Sits on the above layer, so it renders on top of the
 * haggis body. Sprite size 56×56 matches haggis for easy alignment.
 *
 * Inspiration: Still Game Jack's bonnet, Trainspotting cast stills.
 * Palette: heather dark for base wool, bright for the pom-pom, gold
 * accent for the tartan band.
 */

import type { AccessoryDrawer, AccessoryDrawCtx } from '../AccessoryDrawer';
import { PALETTE } from '../../../art/palettes';

const SPRITE_SIZE = 56;

function drawTamIdle0(g: Phaser.GameObjects.Graphics): void {
  // Breathing in — bonnet sits slightly lower on the head.
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2 - 10; // above the haggis body

  // Bonnet brim — dark wool
  g.fillStyle(PALETTE.heather.dark, 1);
  g.fillEllipse(cx, cy + 4, 20, 6);
  // Bonnet crown — mid wool
  g.fillStyle(PALETTE.heather.mid, 1);
  g.fillEllipse(cx, cy, 16, 10);
  // Highlight — upper-left per bible
  g.fillStyle(PALETTE.heather.bright, 0.6);
  g.fillEllipse(cx - 3, cy - 2, 6, 4);
  // Gold tartan band around the brim
  g.fillStyle(PALETTE.gold.aged, 1);
  g.fillRect(cx - 10, cy + 3, 20, 1);
  // Pom-pom on top
  g.fillStyle(PALETTE.red.deep, 1);
  g.fillCircle(cx, cy - 5, 2.5);
  g.fillStyle(PALETTE.red.arterial, 1);
  g.fillCircle(cx, cy - 6, 1.5);
}

function drawTamIdle1(g: Phaser.GameObjects.Graphics): void {
  // Breathing out — bonnet rises by 1 px with the body.
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2 - 11;

  g.fillStyle(PALETTE.heather.dark, 1);
  g.fillEllipse(cx, cy + 4, 20, 6);
  g.fillStyle(PALETTE.heather.mid, 1);
  g.fillEllipse(cx, cy, 16, 10);
  g.fillStyle(PALETTE.heather.bright, 0.6);
  g.fillEllipse(cx - 3, cy - 2, 6, 4);
  g.fillStyle(PALETTE.gold.aged, 1);
  g.fillRect(cx - 10, cy + 3, 20, 1);
  g.fillStyle(PALETTE.red.deep, 1);
  g.fillCircle(cx, cy - 5, 2.5);
  g.fillStyle(PALETTE.red.arterial, 1);
  g.fillCircle(cx, cy - 6, 1.5);
}

function drawTamWalkingFrame(
  g: Phaser.GameObjects.Graphics,
  tilt: number,
  yOffset: number,
): void {
  // Shared walking drawer parameterized on tilt + yOffset so the 4-frame
  // cycle feels like a gentle side-to-side wag on the haggis head.
  const cx = SPRITE_SIZE / 2 + tilt;
  const cy = SPRITE_SIZE / 2 - 10 + yOffset;

  g.fillStyle(PALETTE.heather.dark, 1);
  g.fillEllipse(cx, cy + 4, 20, 6);
  g.fillStyle(PALETTE.heather.mid, 1);
  g.fillEllipse(cx, cy, 16, 10);
  g.fillStyle(PALETTE.heather.bright, 0.6);
  g.fillEllipse(cx - 3, cy - 2, 6, 4);
  g.fillStyle(PALETTE.gold.aged, 1);
  g.fillRect(cx - 10, cy + 3, 20, 1);
  g.fillStyle(PALETTE.red.deep, 1);
  g.fillCircle(cx, cy - 5, 2.5);
  g.fillStyle(PALETTE.red.arterial, 1);
  g.fillCircle(cx, cy - 6, 1.5);
}

function drawTamWalking0(g: Phaser.GameObjects.Graphics): void {
  drawTamWalkingFrame(g, 0, 0);
}
function drawTamWalking1(g: Phaser.GameObjects.Graphics): void {
  drawTamWalkingFrame(g, -1, -1);
}
function drawTamWalking2(g: Phaser.GameObjects.Graphics): void {
  drawTamWalkingFrame(g, 0, 0);
}
function drawTamWalking3(g: Phaser.GameObjects.Graphics): void {
  drawTamWalkingFrame(g, 1, -1);
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
      // State not authored — fall back to idle frame 0 silently.
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
