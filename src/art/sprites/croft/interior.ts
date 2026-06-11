/**
 * Gran's Croft interior architecture.
 *
 * The scene uses this full-room drawer directly so the Croft reads as a
 * house rather than isolated props on a flat backdrop. Small baked texture
 * swatches are exported too, giving the sprite sheet a record of the
 * room's material language.
 */
import * as Phaser from 'phaser';
import type { CroftLayout } from '../../../scenes/croft/CroftComposition';

const INK = 0x0a0604;
const PEAT_SHADOW = 0x2a1808;
const PEAT_DARK = 0x3a2818;
const PEAT_MID = 0x5a3e20;
const PEAT_LIGHT = 0x8a6338;
const PLASTER_DARK = 0x4a3020;
const PLASTER_MID = 0x6a4828;
const PLASTER_LIGHT = 0x9a7440;
const WOOD_DARK = 0x2a1608;
const WOOD_MID = 0x5a3218;
const WOOD_LIGHT = 0x8a5a2e;
const STONE_DARK = 0x2a2a30;
const STONE_MID = 0x4a4a50;
const STONE_LIGHT = 0x8a8a90;
const WHISKY = 0xc8a040;
const WHISKY_LIGHT = 0xffc840;
const CREAM = 0xd6b878;
const HEATHER = 0x8060a0;
const HEATHER_LIGHT = 0xb090d0;
const LOCH = 0x2a4a6a;
const MIST = 0x6a90b0;
const TARTAN_RED = 0xc42828;
const GREEN = 0x436a28;

export function drawCroftInterior(
  g: Phaser.GameObjects.Graphics,
  layout: CroftLayout,
  opts: { includePhotoWall?: boolean } = {},
): void {
  const width = layout.center.x * 2;
  const height = layout.center.y * 2;
  const compact = width < 600;
  const left = compact ? width * 0.045 : width * 0.035;
  const right = compact ? width * 0.955 : width * 0.865;
  const top = compact ? height * 0.175 : height * 0.195;
  const wallBottom = compact ? height * 0.60 : height * 0.675;
  const floorBottom = compact ? height * 0.725 : height * 0.91;

  drawRoomEnvelope(g, left, right, top, wallBottom, floorBottom, compact);
  drawRoomLightWeave(g, layout, left, right, wallBottom, floorBottom, compact);
  drawDoor(g, left, wallBottom, compact);
  drawWindowBay(g, layout.windowView, compact);
  drawHearthAlcove(g, layout, wallBottom, compact);
  if (opts.includePhotoWall !== false) drawPhotoWallBacking(g, layout.photoWall);
  drawBookshelf(g, layout.bookshelf.x, layout.bookshelf.y, compact);
  drawWirelessShelf(g, layout.wireless.x, layout.wireless.y, compact);
  drawRug(g, layout.rug.x, layout.rug.y, layout.rug.w, layout.rug.h, compact);
  drawTable(g, layout.table.x, layout.table.y, compact);
  drawHousePlantsAndNeedles(g, layout, compact);
}

export function drawCroftActionBoard(
  g: Phaser.GameObjects.Graphics,
  bounds: { x: number; y: number; w: number; h: number },
): void {
  const { x, y, w, h } = bounds;
  g.fillStyle(INK, 0.34);
  g.fillRoundedRect(x + 4, y + 5, w, h, 4);
  g.fillStyle(INK, 1);
  g.fillRoundedRect(x, y, w, h, 4);
  g.fillStyle(WOOD_DARK, 1);
  g.fillRoundedRect(x + 2, y + 2, w - 4, h - 4, 3);
  g.fillStyle(WOOD_MID, 1);
  g.fillRoundedRect(x + 5, y + 5, w - 10, h - 10, 3);
  g.fillStyle(WOOD_LIGHT, 0.35);
  g.fillRect(x + 7, y + 7, w - 14, 2);

  for (let i = 0; i < Math.max(3, Math.floor(w / 38)); i++) {
    const px = x + 12 + i * 38;
    g.fillStyle(WOOD_DARK, 0.5);
    g.fillRect(px, y + 6, 1, h - 12);
  }

  g.fillStyle(WHISKY, 1);
  g.fillCircle(x + 13, y + 13, 2);
  g.fillCircle(x + w - 13, y + 13, 2);
  g.lineStyle(1.2, WHISKY_LIGHT, 0.75);
  g.lineBetween(x + 16, y + 13, x + w - 16, y + 13);

  // Wee thistle stamp at the bottom corner.
  const tx = x + w - 16;
  const ty = y + h - 13;
  g.fillStyle(GREEN, 1);
  g.fillRect(tx - 0.8, ty - 7, 1.6, 9);
  g.fillStyle(HEATHER, 1);
  g.fillEllipse(tx, ty - 8, 7, 5);
  g.fillStyle(HEATHER_LIGHT, 0.9);
  g.fillEllipse(tx - 1, ty - 9, 3, 1.5);
}

function drawRoomEnvelope(
  g: Phaser.GameObjects.Graphics,
  left: number,
  right: number,
  top: number,
  wallBottom: number,
  floorBottom: number,
  compact: boolean,
): void {
  const w = right - left;
  g.fillStyle(INK, 0.38);
  g.fillRect(left + 5, top + 6, w, floorBottom - top);

  // Back wall.
  g.fillStyle(INK, 1);
  g.fillRect(left, top, w, wallBottom - top);
  g.fillStyle(PLASTER_DARK, 1);
  g.fillRect(left + 2, top + 2, w - 4, wallBottom - top - 3);
  g.fillStyle(PLASTER_MID, 1);
  g.fillRect(left + 4, top + 5, w - 8, wallBottom - top - 8);
  g.fillStyle(WHISKY_LIGHT, 0.055);
  g.fillEllipse(left + w * 0.54, top + (wallBottom - top) * 0.58, w * 0.78, (wallBottom - top) * 0.72);
  g.fillStyle(PLASTER_LIGHT, 0.12);
  for (let y = top + 18; y < wallBottom - 16; y += compact ? 34 : 42) {
    g.fillRect(left + 8, y, w - 16, 1);
  }
  g.fillStyle(PEAT_DARK, 0.18);
  g.fillRect(left + 5, wallBottom - (compact ? 54 : 72), w - 10, compact ? 51 : 69);
  g.fillStyle(WOOD_LIGHT, 0.16);
  g.fillRect(left + 8, wallBottom - (compact ? 51 : 69), w - 16, 2);

  // Timber ceiling and side posts.
  drawBeam(g, left - 3, top - 7, w + 6, 12, true);
  drawBeam(g, left - 3, wallBottom - 8, w + 6, 14, true);
  drawBeam(g, left - 5, top - 3, 12, wallBottom - top + 5, false);
  drawBeam(g, right - 7, top - 3, 12, wallBottom - top + 5, false);
  const beamCount = compact ? 3 : 6;
  for (let i = 1; i <= beamCount; i++) {
    const x = left + (w / (beamCount + 1)) * i;
    drawBeam(g, x - 2, top - 2, 4, wallBottom - top - 6, false, 0.2);
  }

  // Hearth glow across the wall.
  g.fillStyle(WHISKY_LIGHT, 0.11);
  g.fillEllipse(left + w * 0.48, wallBottom - (wallBottom - top) * 0.24, w * 0.34, (wallBottom - top) * 0.42);
  g.fillStyle(INK, 0.16);
  g.fillRect(left + 2, top + 2, 8, floorBottom - top - 4);
  g.fillRect(right - 10, top + 2, 8, floorBottom - top - 4);

  // Flagstone floor.
  g.fillStyle(INK, 1);
  g.fillRect(left, wallBottom, w, floorBottom - wallBottom);
  g.fillStyle(PEAT_DARK, 1);
  g.fillRect(left + 2, wallBottom + 2, w - 4, floorBottom - wallBottom - 4);
  g.fillStyle(PEAT_MID, 1);
  g.fillRect(left + 4, wallBottom + 4, w - 8, floorBottom - wallBottom - 8);
  for (let y = wallBottom + 16; y < floorBottom - 8; y += compact ? 26 : 31) {
    g.lineStyle(1, PEAT_SHADOW, 0.75);
    g.lineBetween(left + 6, y, right - 6, y + (y % 2 === 0 ? 2 : -2));
  }
  const stoneW = compact ? 42 : 56;
  for (let i = 0; i < Math.ceil(w / stoneW); i++) {
    const x = left + i * stoneW + (i % 2 === 0 ? 0 : stoneW * 0.35);
    g.lineStyle(1, PEAT_SHADOW, 0.45);
    g.lineBetween(x, wallBottom + 5, x - stoneW * 0.22, floorBottom - 6);
  }
  g.fillStyle(WHISKY_LIGHT, 0.045);
  g.fillEllipse(left + w * 0.58, wallBottom + (floorBottom - wallBottom) * 0.34, w * 0.46, floorBottom - wallBottom);
}

function drawRoomLightWeave(
  g: Phaser.GameObjects.Graphics,
  layout: CroftLayout,
  left: number,
  right: number,
  wallBottom: number,
  floorBottom: number,
  compact: boolean,
): void {
  const roomW = right - left;
  const floorH = floorBottom - wallBottom;
  const hearthX = layout.hearth.x;
  const windowX = layout.windowView.x + layout.windowView.w * 0.68;
  const windowY = layout.windowView.y + layout.windowView.h * 0.96;

  g.fillStyle(WHISKY_LIGHT, 0.045);
  g.fillTriangle(
    windowX,
    windowY,
    layout.table.x - (compact ? 58 : 112),
    floorBottom - (compact ? 18 : 34),
    layout.table.x + (compact ? 44 : 78),
    floorBottom - (compact ? 18 : 34),
  );

  g.fillStyle(WHISKY_LIGHT, 0.07);
  g.fillEllipse(hearthX + roomW * 0.025, wallBottom + floorH * 0.37, roomW * 0.33, floorH * 0.82);
  g.fillStyle(WHISKY, 0.04);
  g.fillEllipse(layout.gran.x - roomW * 0.03, layout.gran.y + floorH * 0.08, roomW * 0.25, floorH * 0.42);

  const shadowAlpha = compact ? 0.18 : 0.22;
  g.fillStyle(INK, shadowAlpha);
  g.fillEllipse(layout.hearth.x, layout.hearth.y + (compact ? 24 : 34), compact ? 82 : 118, compact ? 15 : 22);
  g.fillEllipse(layout.gran.x + (compact ? 2 : 6), layout.gran.y + (compact ? 42 : 60), compact ? 92 : 126, compact ? 18 : 26);
  g.fillEllipse(layout.table.x, layout.table.y + (compact ? 19 : 27), compact ? 82 : 118, compact ? 14 : 20);
  g.fillEllipse(layout.weans.x, layout.weans.y + (compact ? 15 : 22), compact ? 86 : 124, compact ? 12 : 18);
}

function drawBeam(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  horizontal: boolean,
  alpha = 1,
): void {
  g.fillStyle(INK, alpha);
  g.fillRect(x, y, w, h);
  g.fillStyle(WOOD_DARK, alpha);
  g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle(WOOD_MID, alpha);
  g.fillRect(x + 2, y + 2, w - 4, h - 4);
  g.fillStyle(WOOD_LIGHT, alpha * 0.55);
  if (horizontal) {
    g.fillRect(x + 3, y + 2, w - 6, 1);
  } else {
    g.fillRect(x + 2, y + 3, 1, h - 6);
  }
}

function drawDoor(g: Phaser.GameObjects.Graphics, left: number, wallBottom: number, compact: boolean): void {
  const doorW = compact ? 58 : 82;
  const doorH = compact ? 132 : 178;
  const x = left + (compact ? 8 : 22);
  const y = wallBottom - doorH + 3;
  g.fillStyle(INK, 1);
  g.fillRect(x - 3, y - 4, doorW + 6, doorH + 6);
  g.fillStyle(PEAT_DARK, 1);
  g.fillRect(x, y, doorW, doorH);
  g.fillStyle(WOOD_MID, 1);
  g.fillRect(x + 3, y + 4, doorW - 6, doorH - 8);
  g.fillStyle(WOOD_DARK, 0.85);
  g.fillRect(x + doorW * 0.5 - 1, y + 7, 2, doorH - 14);
  for (const row of [0.24, 0.56]) {
    g.fillStyle(WOOD_LIGHT, 0.5);
    g.fillRect(x + 8, y + doorH * row, doorW - 16, 2);
  }
  g.fillStyle(WHISKY, 1);
  g.fillCircle(x + doorW - 12, y + doorH * 0.52, compact ? 2 : 2.6);
  g.fillStyle(INK, 0.25);
  g.fillEllipse(x + doorW * 0.5, wallBottom + 4, doorW * 0.9, 8);
}

function drawWindowBay(
  g: Phaser.GameObjects.Graphics,
  region: { x: number; y: number; w: number; h: number },
  compact: boolean,
): void {
  const x = region.x;
  const y = region.y;
  const w = region.w;
  const h = region.h;
  g.fillStyle(INK, 1);
  g.fillRect(x - 7, y - 8, w + 14, h + 16);
  g.fillStyle(WOOD_DARK, 1);
  g.fillRect(x - 5, y - 6, w + 10, h + 12);
  g.fillStyle(LOCH, 1);
  g.fillRect(x, y, w, h);
  g.fillStyle(MIST, 0.85);
  g.fillRect(x + 2, y + 2, w - 4, h * 0.45);
  g.fillStyle(0x354c2c, 1);
  g.fillTriangle(x + 2, y + h - 4, x + w * 0.42, y + h * 0.4, x + w * 0.66, y + h - 4);
  g.fillStyle(0x253820, 1);
  g.fillTriangle(x + w * 0.34, y + h - 4, x + w * 0.72, y + h * 0.34, x + w - 2, y + h - 4);
  g.fillStyle(0xd4b055, 0.16);
  g.fillEllipse(x + w * 0.72, y + h * 0.28, compact ? 12 : 18, compact ? 7 : 10);
  g.fillStyle(0xdde8e8, 0.32);
  for (let i = 0; i < 3; i++) {
    g.fillEllipse(x + w * (0.26 + i * 0.2), y + h * (0.66 + i * 0.04), w * 0.34, 4);
  }

  // Mullions and sill.
  g.fillStyle(WOOD_DARK, 1);
  g.fillRect(x + w * 0.5 - 2, y, 4, h);
  g.fillRect(x, y + h * 0.48 - 2, w, 4);
  g.fillStyle(WOOD_LIGHT, 0.75);
  g.fillRect(x + w * 0.5 - 1, y + 3, 1, h - 6);
  g.fillRect(x + 3, y + h * 0.48 - 1, w - 6, 1);
  g.fillStyle(INK, 1);
  g.fillRect(x - 12, y + h - 3, w + 24, 8);
  g.fillStyle(WOOD_MID, 1);
  g.fillRect(x - 10, y + h - 2, w + 20, 5);
  g.fillStyle(WOOD_LIGHT, 0.8);
  g.fillRect(x - 8, y + h - 2, w + 16, 1);

  drawCurtain(g, x - 15, y - 3, compact ? 13 : 18, h + 5, true);
  drawCurtain(g, x + w - 3, y - 3, compact ? 13 : 18, h + 5, false);
}

function drawCurtain(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  leftSide: boolean,
): void {
  g.fillStyle(INK, 1);
  g.fillRect(x, y, w, h);
  g.fillStyle(HEATHER, 1);
  g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle(HEATHER_LIGHT, 0.28);
  for (let i = 0; i < 3; i++) {
    const foldX = x + 3 + i * Math.max(3, w / 3.5);
    g.fillRect(foldX, y + 3, 1, h - 6);
  }
  g.fillStyle(WHISKY, 0.85);
  const tieY = y + h * 0.58;
  if (leftSide) {
    g.fillTriangle(x + w, tieY - 5, x + w, tieY + 5, x + w * 0.42, tieY);
  } else {
    g.fillTriangle(x, tieY - 5, x, tieY + 5, x + w * 0.58, tieY);
  }
}

function drawHearthAlcove(
  g: Phaser.GameObjects.Graphics,
  layout: CroftLayout,
  wallBottom: number,
  compact: boolean,
): void {
  const cx = layout.hearth.x;
  const hearthY = layout.hearth.y;
  const w = compact ? Math.max(92, layout.center.x * 0.45) : Math.max(170, layout.center.x * 0.21);
  const top = layout.mantelpiece.y - (compact ? 12 : 16);
  const bottom = wallBottom + (compact ? 8 : 12);
  const x = cx - w / 2;

  g.fillStyle(INK, 0.35);
  g.fillRoundedRect(x + 5, top + 5, w, bottom - top, 6);
  g.fillStyle(INK, 1);
  g.fillRoundedRect(x, top, w, bottom - top, 6);
  g.fillStyle(WOOD_DARK, 1);
  g.fillRoundedRect(x + 3, top + 3, w - 6, bottom - top - 6, 5);
  g.fillStyle(PLASTER_MID, 0.98);
  g.fillRoundedRect(x + 7, top + 8, w - 14, bottom - top - 17, 4);
  g.fillStyle(PLASTER_LIGHT, 0.18);
  g.fillEllipse(cx - w * 0.08, top + (bottom - top) * 0.33, w * 0.54, (bottom - top) * 0.42);
  g.fillStyle(PEAT_SHADOW, 0.2);
  g.fillRect(x + 10, top + (bottom - top) * 0.50, w - 20, 1);
  g.fillStyle(WHISKY_LIGHT, 0.13);
  g.fillEllipse(cx, hearthY - 8, w * 0.62, (bottom - top) * 0.42);

  // Fire opening, sized to frame the existing animated hearth sprite.
  const openW = compact ? 68 : 88;
  const openH = compact ? 56 : 66;
  const ox = cx - openW / 2;
  const oy = hearthY - openH * 0.48;
  const surroundX = ox - (compact ? 10 : 14);
  const surroundY = oy - (compact ? 10 : 13);
  const surroundW = openW + (compact ? 20 : 28);
  const surroundH = openH + (compact ? 22 : 30);
  g.fillStyle(STONE_DARK, 1);
  g.fillRect(surroundX - (compact ? 9 : 12), surroundY + 5, compact ? 8 : 10, surroundH - 8);
  g.fillRect(surroundX + surroundW + (compact ? 1 : 2), surroundY + 5, compact ? 8 : 10, surroundH - 8);
  g.fillStyle(STONE_LIGHT, 0.28);
  g.fillRect(surroundX - (compact ? 7 : 10), surroundY + 7, 1, surroundH - 12);
  g.fillRect(surroundX + surroundW + (compact ? 3 : 4), surroundY + 7, 1, surroundH - 12);
  g.fillStyle(INK, 1);
  g.fillRoundedRect(surroundX, surroundY, surroundW, surroundH, 5);
  g.fillStyle(STONE_DARK, 1);
  g.fillRoundedRect(surroundX + 2, surroundY + 2, surroundW - 4, surroundH - 4, 4);
  const stone = compact ? 14 : 18;
  for (let yy = surroundY + 4; yy < surroundY + surroundH - 5; yy += stone) {
    const row = Math.floor((yy - surroundY) / stone);
    for (let xx = surroundX + 5 + (row % 2) * stone * 0.45; xx < surroundX + surroundW - 8; xx += stone) {
      g.fillStyle(STONE_MID, 1);
      g.fillRect(xx, yy, Math.min(stone - 3, surroundX + surroundW - xx - 7), stone - 4);
      g.fillStyle(STONE_LIGHT, 0.3);
      g.fillRect(xx + 1, yy + 1, Math.min(stone - 5, surroundX + surroundW - xx - 9), 1);
    }
  }
  g.fillStyle(INK, 1);
  g.fillRoundedRect(ox, oy, openW, openH, 4);
  g.fillStyle(0x1a0804, 1);
  g.fillRoundedRect(ox + 5, oy + 5, openW - 10, openH - 9, 4);
  g.fillStyle(WHISKY_LIGHT, 0.18);
  g.fillEllipse(cx, hearthY - 4, openW * 0.76, openH * 0.58);

  g.fillStyle(PEAT_DARK, 1);
  g.fillRoundedRect(cx - openW * 0.32, oy + openH * 0.70, openW * 0.64, openH * 0.16, 3);
  g.fillStyle(WHISKY, 0.86);
  g.fillEllipse(cx - openW * 0.12, oy + openH * 0.72, openW * 0.20, openH * 0.34);
  g.fillStyle(WHISKY_LIGHT, 0.74);
  g.fillEllipse(cx + openW * 0.10, oy + openH * 0.68, openW * 0.16, openH * 0.28);

  // Mantel shelf and small stone lip.
  drawBeam(g, x - 8, layout.mantelpiece.y - 4, w + 16, compact ? 10 : 12, true);
  drawMantelTidy(g, cx, layout.mantelpiece.y - (compact ? 12 : 15), compact);
  g.fillStyle(STONE_LIGHT, 0.8);
  g.fillRect(ox - 8, oy + openH - 2, openW + 16, 5);
}

function drawMantelTidy(g: Phaser.GameObjects.Graphics, cx: number, y: number, compact: boolean): void {
  const s = compact ? 0.78 : 1;
  g.fillStyle(INK, 0.55);
  g.fillRect(cx - 30 * s, y + 13 * s, 60 * s, 2 * s);
  g.fillStyle(CREAM, 0.88);
  g.fillRoundedRect(cx - 25 * s, y + 6 * s, 12 * s, 10 * s, 2 * s);
  g.fillStyle(WHISKY_LIGHT, 0.82);
  g.fillEllipse(cx - 19 * s, y + 4 * s, 4 * s, 7 * s);
  g.fillStyle(HEATHER, 0.95);
  g.fillEllipse(cx + 18 * s, y + 12 * s, 16 * s, 8 * s);
  g.fillStyle(GREEN, 0.95);
  g.fillRect(cx + 17 * s, y + 2 * s, 1.4 * s, 14 * s);
  g.fillStyle(WHISKY, 0.9);
  g.fillCircle(cx + 32 * s, y + 12 * s, 3 * s);
}

function drawPhotoWallBacking(
  g: Phaser.GameObjects.Graphics,
  region: { x: number; y: number; w: number; h: number },
): void {
  g.fillStyle(INK, 0.32);
  g.fillRect(region.x + 4, region.y + 4, region.w, region.h);
  g.fillStyle(INK, 1);
  g.fillRect(region.x - 4, region.y - 5, region.w + 8, region.h + 10);
  g.fillStyle(PEAT_DARK, 1);
  g.fillRect(region.x - 1, region.y - 2, region.w + 2, region.h + 4);
  g.fillStyle(PEAT_LIGHT, 0.24);
  g.fillRect(region.x + 3, region.y + 2, region.w - 6, 2);
  g.fillStyle(WHISKY, 0.8);
  g.fillCircle(region.x + region.w * 0.5, region.y - 2, 2);
}

function drawBookshelf(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  compact: boolean,
): void {
  const w = compact ? 54 : 74;
  const h = compact ? 92 : 122;
  const x = cx - w / 2;
  const y = cy - h * 0.58;
  g.fillStyle(INK, 0.35);
  g.fillRect(x + 4, y + 5, w, h);
  g.fillStyle(INK, 1);
  g.fillRect(x, y, w, h);
  g.fillStyle(WOOD_DARK, 1);
  g.fillRect(x + 2, y + 2, w - 4, h - 4);
  g.fillStyle(WOOD_MID, 1);
  g.fillRect(x + 5, y + 5, w - 10, h - 10);
  const shelfCount = 4;
  for (let i = 1; i < shelfCount; i++) {
    const sy = y + (h / shelfCount) * i;
    g.fillStyle(INK, 1);
    g.fillRect(x + 4, sy, w - 8, 4);
    g.fillStyle(WOOD_LIGHT, 0.8);
    g.fillRect(x + 5, sy, w - 10, 1.2);
  }
  const bookColors = [0x7a1f1f, 0x295030, 0x2a4a6a, 0x8060a0, 0xc8a040];
  for (let row = 0; row < shelfCount; row++) {
    const baseY = y + 9 + row * (h / shelfCount);
    let bx = x + 8;
    for (let i = 0; i < 5; i++) {
      const bw = compact ? 5 + (i % 2) : 7 + (i % 2);
      const bh = (compact ? 15 : 20) - (i % 3) * 2;
      g.fillStyle(INK, 1);
      g.fillRect(bx, baseY + 20 - bh, bw, bh);
      g.fillStyle(bookColors[(i + row) % bookColors.length], 1);
      g.fillRect(bx + 1, baseY + 21 - bh, bw - 2, bh - 1);
      bx += bw + 3;
      if (bx > x + w - 10) break;
    }
  }
}

function drawWirelessShelf(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  compact: boolean,
): void {
  const shelfW = compact ? 50 : 70;
  g.fillStyle(INK, 1);
  g.fillRect(cx - shelfW / 2, cy + 12, shelfW, 5);
  g.fillStyle(WOOD_MID, 1);
  g.fillRect(cx - shelfW / 2 + 2, cy + 12, shelfW - 4, 3);
  g.fillStyle(INK, 1);
  g.fillRoundedRect(cx - 18, cy - 7, 36, 20, 3);
  g.fillStyle(PEAT_LIGHT, 1);
  g.fillRoundedRect(cx - 16, cy - 5, 32, 16, 3);
  g.fillStyle(WHISKY, 1);
  g.fillCircle(cx - 9, cy + 3, 5);
  g.fillStyle(PEAT_DARK, 1);
  g.fillRect(cx + 1, cy - 2, 11, 1.4);
  g.fillRect(cx + 1, cy + 3, 13, 1.4);
  g.lineStyle(1, WHISKY, 0.9);
  g.lineBetween(cx - 10, cy - 8, cx + 8, cy - 22);
}

function drawRug(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  compact: boolean,
): void {
  g.fillStyle(INK, 0.35);
  g.fillEllipse(x + w / 2 + 2, y + h * 0.58 + 4, w * 0.96, h * 1.05);
  g.fillStyle(INK, 1);
  g.fillEllipse(x + w / 2, y + h * 0.52, w, h);
  g.fillStyle(PEAT_DARK, 1);
  g.fillEllipse(x + w / 2, y + h * 0.50, w - 4, h - 4);
  g.fillStyle(HEATHER, 1);
  g.fillEllipse(x + w / 2, y + h * 0.49, w - 10, h - 8);
  g.fillStyle(HEATHER_LIGHT, 0.2);
  g.fillEllipse(x + w / 2 - w * 0.08, y + h * 0.42, w * 0.44, h * 0.34);

  const stripeH = compact ? 3 : 5;
  const stripeW = compact ? 3 : 5;
  g.fillStyle(PEAT_DARK, 0.78);
  g.fillRect(x + w * 0.08, y + h * 0.42, w * 0.84, stripeH);
  g.fillRect(x + w * 0.08, y + h * 0.57, w * 0.84, Math.max(2, stripeH - 1));
  g.fillStyle(TARTAN_RED, 0.78);
  g.fillRect(x + w * 0.18, y + h * 0.24, stripeW, h * 0.50);
  g.fillRect(x + w * 0.70, y + h * 0.24, stripeW, h * 0.50);
  g.fillStyle(WHISKY, 0.78);
  g.fillRect(x + w * 0.10, y + h * 0.51, w * 0.8, Math.max(2, stripeH - 2));
  g.fillRect(x + w * 0.36, y + h * 0.28, Math.max(2, stripeW - 1), h * 0.44);
  g.fillStyle(CREAM, 0.48);
  for (let i = 0; i < 7; i++) {
    const fringeX = x + w * (0.16 + i * 0.11);
    g.fillRect(fringeX, y + h * 0.79, 2, compact ? 4 : 6);
  }
}

function drawTable(g: Phaser.GameObjects.Graphics, cx: number, cy: number, compact: boolean): void {
  const w = compact ? 68 : 92;
  const h = compact ? 26 : 34;
  g.fillStyle(INK, 0.34);
  g.fillEllipse(cx + 2, cy + 11, w, h * 0.36);
  g.fillStyle(INK, 1);
  g.fillEllipse(cx, cy, w, h);
  g.fillStyle(WOOD_DARK, 1);
  g.fillEllipse(cx, cy, w - 4, h - 4);
  g.fillStyle(WOOD_MID, 1);
  g.fillEllipse(cx - 1, cy - 2, w - 8, h - 8);
  g.fillStyle(WOOD_LIGHT, 0.55);
  g.fillEllipse(cx - w * 0.12, cy - h * 0.22, w * 0.36, h * 0.25);
  g.fillStyle(CREAM, 0.7);
  g.fillEllipse(cx, cy - h * 0.07, w * 0.44, h * 0.32);
  g.fillStyle(HEATHER, 0.5);
  g.fillRect(cx - w * 0.22, cy - h * 0.10, w * 0.44, Math.max(2, compact ? 3 : 4));
  g.fillStyle(WHISKY_LIGHT, 0.35);
  g.fillEllipse(cx + w * 0.20, cy - h * 0.22, w * 0.22, h * 0.16);
  for (const dx of [-0.34, 0.34]) {
    g.fillStyle(INK, 1);
    g.fillRect(cx + w * dx - 2, cy + h * 0.28, 5, compact ? 21 : 28);
    g.fillStyle(WOOD_DARK, 1);
    g.fillRect(cx + w * dx - 1, cy + h * 0.30, 3, compact ? 19 : 26);
  }
}

function drawHousePlantsAndNeedles(g: Phaser.GameObjects.Graphics, layout: CroftLayout, compact: boolean): void {
  const s = compact ? 0.78 : 1;
  const bx = layout.windowView.x - 18 * s;
  const by = layout.windowView.y + layout.windowView.h + 18 * s;
  g.fillStyle(INK, 1);
  g.fillRect(bx - 10 * s, by + 3 * s, 20 * s, 6 * s);
  g.fillStyle(PEAT_LIGHT, 1);
  g.fillRect(bx - 8 * s, by + 2 * s, 16 * s, 5 * s);
  for (const dx of [-5, 0, 5]) {
    g.fillStyle(GREEN, 1);
    g.fillRect(bx + dx * s, by - 11 * s, 1.2 * s, 13 * s);
    g.fillStyle(HEATHER, 1);
    g.fillEllipse(bx + dx * s, by - 12 * s, 5 * s, 4 * s);
  }

  const kx = layout.gran.x - 60 * s;
  const ky = layout.gran.y + 36 * s;
  g.fillStyle(INK, 0.45);
  g.fillEllipse(kx, ky + 8 * s, 24 * s, 5 * s);
  g.fillStyle(WOOD_MID, 1);
  g.fillEllipse(kx, ky + 3 * s, 20 * s, 11 * s);
  g.fillStyle(WHISKY, 1);
  g.lineStyle(Math.max(1, s), WHISKY, 1);
  g.lineBetween(kx + 4 * s, ky - 4 * s, kx + 17 * s, ky - 17 * s);
  g.lineBetween(kx + 8 * s, ky - 3 * s, kx + 21 * s, ky - 14 * s);

  const px = layout.hearth.x - 72 * s;
  const py = layout.hearth.y + 42 * s;
  g.fillStyle(INK, 0.42);
  g.fillEllipse(px, py + 7 * s, 32 * s, 7 * s);
  g.fillStyle(WOOD_DARK, 1);
  g.fillRoundedRect(px - 14 * s, py - 7 * s, 28 * s, 14 * s, 3 * s);
  g.fillStyle(WOOD_LIGHT, 0.58);
  g.fillRect(px - 11 * s, py - 4 * s, 22 * s, 2 * s);
  g.fillStyle(PEAT_SHADOW, 1);
  for (const dx of [-8, -2, 5]) {
    g.fillEllipse(px + dx * s, py - 7 * s, 9 * s, 4 * s);
  }
}
