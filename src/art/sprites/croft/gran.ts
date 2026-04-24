/**
 * H1 T3 — Gran drawer for CroftScene.
 *
 * Gran is the voice anchor of the Croft: seated by the hearth, tartan
 * shawl across her shoulders, white bun, knitting needles ticking
 * through a ball of wool on her lap. Hearth palette (Still Game
 * register) — warm maroon + forest green + whisky gold highlights.
 *
 * Three idle frames let the needles tick (left / neutral / right) and
 * the shawl rise-and-fall with a gentle breath. BootScene bakes each
 * frame to its own texture key (`croft_gran_f0`..`_f2`) so the scene
 * can swap frames at the canonical ~4 fps knitting cadence.
 */

import * as Phaser from 'phaser';

export const GRAN_CANVAS_SIZE = 64;
export const GRAN_FRAME_COUNT = 3;
export const GRAN_TEXTURE_KEYS = ['croft_gran_f0', 'croft_gran_f1', 'croft_gran_f2'] as const;
export type GranTextureKey = (typeof GRAN_TEXTURE_KEYS)[number];

/** Per-frame hand / wool offsets. Pure data — testable in node env. */
export interface GranFrame {
  /** Head bob (positive = down). */
  headY: number;
  /** Shawl breath rise-and-fall (positive = down). */
  shawlY: number;
  /** Left needle tip X offset. */
  leftNeedleX: number;
  /** Right needle tip X offset. */
  rightNeedleX: number;
  /** Ball of wool rocking offset. */
  woolX: number;
}

export const GRAN_FRAMES: readonly GranFrame[] = [
  { headY: 0, shawlY: 0, leftNeedleX: -1, rightNeedleX: 1, woolX: -1 },
  { headY: 1, shawlY: 1, leftNeedleX: 0, rightNeedleX: 0, woolX: 0 },
  { headY: 0, shawlY: 0, leftNeedleX: 1, rightNeedleX: -1, woolX: 1 },
];

// ── Palette — Hearth register, keyed to the Art Style Bible. ──
const OUTLINE = 0x1a0808;
const SKIRT_DARK = 0x4a1520;
const SKIRT_MID = 0x7a2530;
const TARTAN_STRIPE = 0x1a4a1a;
const TARTAN_GOLD = 0xd4a017;
const SHAWL_DARK = 0x3a2a1a;
const SHAWL_MID = 0x5a4028;
const HAIR_BASE = 0xd8d0c0;
const HAIR_HI = 0xf0e8d8;
const SKIN = 0xe8b890;
const SKIN_SHADE = 0xb88868;
const LIP = 0x9a3030;
const WOOL_BASE = 0xb84090;
const WOOL_HI = 0xd868b0;
const NEEDLE = 0xaaa088;

/**
 * Draw one Gran frame into a Graphics context. Caller is responsible
 * for calling `g.generateTexture(key, s, s)` and `g.clear()` between
 * frames. `bakeGranTextures` wraps this to produce the 3 cached
 * textures.
 */
export function drawGranFrame(g: Phaser.GameObjects.Graphics, frameIdx: number): void {
  const s = GRAN_CANVAS_SIZE;
  const cx = s / 2;
  const frame = GRAN_FRAMES[frameIdx % GRAN_FRAMES.length];

  // ── Chair silhouette behind her (anchors her as "seated", not floating). ──
  g.fillStyle(0x2a1510, 1);
  g.fillRoundedRect(cx - 22, 34, 44, 22, 3);
  // Chair back posts peeking either side of her shoulders.
  g.fillRect(cx - 20, 18, 3, 20);
  g.fillRect(cx + 17, 18, 3, 20);

  // ── Skirt — trapezoid at the base, two-tone. ──
  g.fillStyle(OUTLINE, 1);
  g.fillTriangle(cx - 22, 56, cx + 22, 56, cx + 14, 34);
  g.fillTriangle(cx - 22, 56, cx + 14, 34, cx - 14, 34);
  g.fillStyle(SKIRT_DARK, 1);
  g.fillTriangle(cx - 20, 55, cx + 20, 55, cx + 12, 35);
  g.fillTriangle(cx - 20, 55, cx + 12, 35, cx - 12, 35);
  g.fillStyle(SKIRT_MID, 1);
  g.fillTriangle(cx - 16, 54, cx + 16, 54, cx + 8, 38);
  g.fillTriangle(cx - 16, 54, cx + 8, 38, cx - 8, 38);

  // Lap — where knitting happens. Wool ball rests here.
  g.fillStyle(SKIRT_DARK, 1);
  g.fillRect(cx - 14, 36 + frame.shawlY, 28, 6);

  // ── Torso — shawl-wrapped, Tartan-gold accent stripes. ──
  const torsoY = 22 + frame.shawlY;
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx - 13, torsoY, 26, 16, 3);
  g.fillStyle(SHAWL_DARK, 1);
  g.fillRoundedRect(cx - 12, torsoY + 1, 24, 14, 2);
  g.fillStyle(SHAWL_MID, 1);
  g.fillRoundedRect(cx - 10, torsoY + 2, 20, 10, 2);
  // Tartan cross-stripes.
  g.fillStyle(TARTAN_STRIPE, 0.9);
  g.fillRect(cx - 10, torsoY + 5, 20, 1);
  g.fillRect(cx - 3, torsoY + 2, 1, 10);
  g.fillStyle(TARTAN_GOLD, 0.8);
  g.fillRect(cx - 10, torsoY + 9, 20, 0.5);
  g.fillRect(cx + 4, torsoY + 2, 0.5, 10);

  // ── Arms holding needles — frame-dependent. ──
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx - 16 + frame.leftNeedleX, torsoY + 8, 10, 6, 2);
  g.fillRoundedRect(cx + 6 + frame.rightNeedleX, torsoY + 8, 10, 6, 2);
  g.fillStyle(SHAWL_MID, 1);
  g.fillRoundedRect(cx - 15 + frame.leftNeedleX, torsoY + 9, 8, 4, 1);
  g.fillRoundedRect(cx + 7 + frame.rightNeedleX, torsoY + 9, 8, 4, 1);
  // Hands peeking out.
  g.fillStyle(SKIN, 1);
  g.fillCircle(cx - 14 + frame.leftNeedleX, torsoY + 12, 1.8);
  g.fillCircle(cx + 14 + frame.rightNeedleX, torsoY + 12, 1.8);
  g.fillStyle(SKIN_SHADE, 0.6);
  g.fillCircle(cx - 14 + frame.leftNeedleX, torsoY + 13, 1);
  g.fillCircle(cx + 14 + frame.rightNeedleX, torsoY + 13, 1);

  // Needles — thin highlight lines angling up from each hand.
  g.fillStyle(NEEDLE, 1);
  g.fillRect(cx - 12 + frame.leftNeedleX, torsoY + 5, 0.7, 7);
  g.fillRect(cx + 11 + frame.rightNeedleX, torsoY + 5, 0.7, 7);
  // Knot of fresh yarn between needle tips.
  g.fillStyle(WOOL_BASE, 1);
  g.fillCircle(cx + (frame.leftNeedleX + frame.rightNeedleX) * 0.5, torsoY + 6, 1.5);
  g.fillStyle(WOOL_HI, 1);
  g.fillCircle(cx + (frame.leftNeedleX + frame.rightNeedleX) * 0.5, torsoY + 5.5, 0.8);

  // Wool ball rocking on her lap.
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(cx - 2 + frame.woolX, 42, 3.4);
  g.fillStyle(WOOL_BASE, 1);
  g.fillCircle(cx - 2 + frame.woolX, 42, 3);
  g.fillStyle(WOOL_HI, 1);
  g.fillCircle(cx - 3 + frame.woolX, 41, 1.5);
  // Wool strand trailing to the needles.
  g.lineStyle(0.8, WOOL_BASE, 1);
  g.beginPath();
  g.moveTo(cx - 2 + frame.woolX, 42);
  g.lineTo(cx, torsoY + 7);
  g.strokePath();

  // ── Head — face + hair bun. ──
  const headY = 10 + frame.headY;
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(cx, headY, 7);
  g.fillStyle(SKIN, 1);
  g.fillCircle(cx, headY, 6);
  g.fillStyle(SKIN_SHADE, 0.5);
  g.fillEllipse(cx, headY + 2, 10, 3);
  // Cheek blush — Still Game warmth.
  g.fillStyle(LIP, 0.35);
  g.fillCircle(cx - 3, headY + 2, 1.4);
  g.fillCircle(cx + 3, headY + 2, 1.4);
  // Eyes — small dots, content.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 2.5, headY - 1, 1, 1);
  g.fillRect(cx + 1.5, headY - 1, 1, 1);
  // Smile.
  g.fillStyle(LIP, 1);
  g.fillRect(cx - 1.5, headY + 2.5, 3, 0.7);

  // Hair bun on top.
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(cx, headY - 5, 4.5);
  g.fillStyle(HAIR_BASE, 1);
  g.fillCircle(cx, headY - 5, 4);
  g.fillStyle(HAIR_HI, 1);
  g.fillCircle(cx - 1, headY - 6, 2);
  // Side hair wisps.
  g.fillStyle(HAIR_BASE, 1);
  g.fillEllipse(cx - 5, headY - 2, 4, 5);
  g.fillEllipse(cx + 5, headY - 2, 4, 5);
  g.fillStyle(HAIR_HI, 0.8);
  g.fillEllipse(cx - 5, headY - 3, 2, 3);
  g.fillEllipse(cx + 5, headY - 3, 2, 3);
}

/**
 * Bake all three Gran frames to named textures. Call from BootScene.
 */
export function bakeGranTextures(scene: Phaser.Scene): void {
  for (let i = 0; i < GRAN_FRAME_COUNT; i++) {
    const g = scene.add.graphics();
    drawGranFrame(g, i);
    g.generateTexture(GRAN_TEXTURE_KEYS[i], GRAN_CANVAS_SIZE, GRAN_CANVAS_SIZE);
    g.destroy();
  }
}
