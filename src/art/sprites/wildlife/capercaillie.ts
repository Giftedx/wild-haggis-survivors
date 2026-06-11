/**
 * Capercaillie — 34x28 procedural sprite. A woodland grouse silhouette with
 * fan tail, dark breast, red eye wattle, green sheen, and pale beak.
 * Frame idle = display stance, Frame move = grounded strut.
 */
import * as Phaser from 'phaser';

export const CAPERCAILLIE_CANVAS_W = 34;
export const CAPERCAILLIE_CANVAS_H = 28;

const CAPER_OUTLINE = 0x15120e;
const CAPER_DARK = 0x2a2a30;
const CAPER_BLACK = 0x17171a;
const CAPER_GREEN_DEEP = 0x1f4030;
const CAPER_GREEN = 0x2d5a42;
const CAPER_GREEN_BRIGHT = 0x4a8a68;
const CAPER_WING = 0x4a3a30;
const CAPER_WING_LIGHT = 0x6a4f3a;
const CAPER_BEAK = 0xe8c668;
const CAPER_WATTLE = 0xff3838;
const CAPER_WATTLE_DEEP = 0x8a1010;

function drawCapercaillieBody(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  strutting: boolean,
): void {
  const step = strutting ? 1 : 0;
  const chestLift = strutting ? -1 : 0;
  const y = cy + chestLift;

  // Soft contact shadow.
  g.fillStyle(0x000000, 0.32);
  g.fillEllipse(cx, cy + 17, 16, 2.5);

  // Fanned tail behind the body — feather rays radiating, not blocky wedges.
  // Outer dark ray fan first.
  g.fillStyle(CAPER_OUTLINE, 1);
  for (const dx of [-18, -16, -13, -10, -7, -4]) {
    const tipX = cx + dx;
    const tipY = y - 9 + Math.abs(dx + 11) * 0.15;
    g.fillTriangle(cx - 10, y + 1, tipX, tipY, tipX + 1, tipY + 2);
  }
  g.fillStyle(CAPER_BLACK, 1);
  for (const dx of [-17, -15, -12, -9, -6, -3]) {
    const tipX = cx + dx;
    const tipY = y - 8 + Math.abs(dx + 10) * 0.14;
    g.fillTriangle(cx - 10, y + 1, tipX, tipY, tipX + 0.6, tipY + 1.6);
  }
  // Pale spotting along the fan rays — display "rosettes" caper has.
  g.fillStyle(0xc8c0a8, 0.8);
  g.fillRect(cx - 14, y - 4, 1, 1);
  g.fillRect(cx - 11, y - 6, 1, 1);
  g.fillRect(cx - 8, y - 5, 1, 1);
  g.fillRect(cx - 5, y - 4, 1, 1);
  // Highlight gleam on the upper edge.
  g.fillStyle(0x4a4a50, 0.85);
  g.fillRect(cx - 14, y - 3, 1, 7);
  g.fillRect(cx - 10, y - 5, 1, 8);

  // Body mass and green chest sheen — two-tone gradient deep -> bright.
  g.fillStyle(CAPER_OUTLINE, 1);
  g.fillEllipse(cx, y + 5, 21, 13);
  g.fillStyle(CAPER_DARK, 1);
  g.fillEllipse(cx, y + 5, 19, 11);
  g.fillStyle(CAPER_GREEN_DEEP, 1);
  g.fillEllipse(cx + 5, y + 4, 10, 8);
  g.fillStyle(CAPER_GREEN, 1);
  g.fillEllipse(cx + 5, y + 3, 9, 7);
  g.fillStyle(CAPER_GREEN_BRIGHT, 0.9);
  g.fillEllipse(cx + 7, y + 2, 5, 4);
  g.fillStyle(0x9adac0, 0.55);
  g.fillRect(cx + 6, y + 1, 4, 1);

  // Brown wing panel.
  g.fillStyle(CAPER_WING, 1);
  g.fillEllipse(cx - 2, y + 6, 9, 6);
  g.fillStyle(CAPER_WING_LIGHT, 0.9);
  g.fillRect(cx - 5, y + 4, 5, 1);
  g.fillStyle(0x8a8a90, 0.5);
  g.fillRect(cx - 5, y + 6, 5, 1);

  // Neck, head, beak, and red brow.
  g.fillStyle(CAPER_OUTLINE, 1);
  g.fillEllipse(cx + 8, y - 3, 7, 11);
  g.fillCircle(cx + 11, y - 8, 4);
  g.fillTriangle(cx + 14, y - 8, cx + 19, y - 7, cx + 14, y - 5);
  g.fillStyle(CAPER_BLACK, 1);
  g.fillEllipse(cx + 8, y - 3, 5, 9);
  g.fillCircle(cx + 11, y - 8, 3);
  g.fillStyle(CAPER_BEAK, 1);
  g.fillTriangle(cx + 14, y - 8, cx + 18, y - 7, cx + 14, y - 6);
  // Beak hook line.
  g.fillStyle(CAPER_OUTLINE, 1);
  g.fillRect(cx + 17, y - 6, 1, 1);

  // Red eye-comb wattle — bigger, brighter scarlet swoosh above the eye.
  g.fillStyle(CAPER_WATTLE_DEEP, 1);
  g.fillRect(cx + 9, y - 12, 6, 2);
  g.fillStyle(CAPER_WATTLE, 1);
  g.fillRect(cx + 9, y - 12, 6, 1);
  g.fillRect(cx + 10, y - 13, 4, 1);
  g.fillStyle(0xff8a8a, 0.9);
  g.fillRect(cx + 11, y - 13, 2, 1);

  // Eye + glint.
  g.fillStyle(CAPER_BEAK, 1);
  g.fillRect(cx + 12, y - 9, 1, 1);
  g.fillStyle(0xffffff, 0.85);
  g.fillRect(cx + 12.3, y - 9.3, 0.5, 0.5);

  // Grounded strut legs and feet.
  g.fillStyle(CAPER_OUTLINE, 1);
  g.fillRect(cx - 1 - step, y + 11, 2, 6 + step);
  g.fillRect(cx + 5 + step, y + 10, 2, 6 - step);
  g.fillRect(cx - 4 - step, y + 16 + step, 5, 1);
  g.fillRect(cx + 4 + step, y + 15 - step, 5, 1);
  // Clawed toe tips.
  g.fillStyle(CAPER_BEAK, 0.9);
  g.fillRect(cx - 4 - step, y + 16 + step, 1, 1);
  g.fillRect(cx + 8 + step, y + 15 - step, 1, 1);
}

export function bakeCapercaillie(scene: Phaser.Scene): void {
  const w = CAPERCAILLIE_CANVAS_W;
  const h = CAPERCAILLIE_CANVAS_H;
  const cx = w / 2;
  const cy = 13;

  const gIdle = scene.add.graphics();
  drawCapercaillieBody(gIdle, cx, cy, false);
  gIdle.generateTexture('wildlife_capercaillie_idle', w, h);
  gIdle.destroy();

  const gMove = scene.add.graphics();
  drawCapercaillieBody(gMove, cx, cy, true);
  gMove.generateTexture('wildlife_capercaillie_move', w, h);
  gMove.destroy();
}
