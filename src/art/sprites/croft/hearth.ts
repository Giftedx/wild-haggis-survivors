/**
 * H1 T4 — Hearth drawer for CroftScene.
 *
 * The hearth is the croft's emotional anchor — "the kettle's on" Gran
 * greets the returning player (see `ui.croft.gran_greet`). Design
 * bones: a peat-stone mouth flanked by hobs, two smouldering logs
 * across the grate, and a layered flame column (dark-red base →
 * tangerine mid → daffodil tip) with four wobble frames so the fire
 * reads alive.
 *
 * BootScene bakes each frame as `croft_hearth_f0..f3`. CroftScene
 * ticks through them at a fire-like tempo (~8 fps).
 */

import * as Phaser from 'phaser';

export const HEARTH_CANVAS_SIZE = 72;
export const HEARTH_FRAME_COUNT = 4;
export const HEARTH_TEXTURE_KEYS = [
  'croft_hearth_f0',
  'croft_hearth_f1',
  'croft_hearth_f2',
  'croft_hearth_f3',
] as const;
export type HearthTextureKey = (typeof HEARTH_TEXTURE_KEYS)[number];

/** Per-frame flame wobble. Pure data — testable in node env. */
export interface HearthFrame {
  /** Horizontal sway of the flame tip. */
  tipX: number;
  /** Vertical extension / retraction of the flame column. */
  tipY: number;
  /** Left sub-flame lick offset (relative). */
  leftLickY: number;
  /** Right sub-flame lick offset (relative). */
  rightLickY: number;
  /** Ember brightness (0..1). */
  emberGlow: number;
}

export const HEARTH_FRAMES: readonly HearthFrame[] = [
  { tipX: -1, tipY: 0, leftLickY: -1, rightLickY: 1, emberGlow: 0.75 },
  { tipX: 0, tipY: -2, leftLickY: 0, rightLickY: -1, emberGlow: 1.0 },
  { tipX: 1, tipY: 0, leftLickY: 1, rightLickY: -1, emberGlow: 0.85 },
  { tipX: 0, tipY: 1, leftLickY: -1, rightLickY: 0, emberGlow: 0.65 },
];

// ── Palette — Hearth register, bright against panel dark. ──
const STONE_OUTLINE = 0x0a0806;
const STONE_DARK = 0x3a3028;
const STONE_MID = 0x5a4a38;
const STONE_HI = 0x7a6250;
const MORTAR = 0x2a2218;
const BACK_BLACK = 0x08050a;
const LOG_DARK = 0x2a1505;
const LOG_MID = 0x4a2808;
const LOG_CHAR = 0x1a0a02;
const FLAME_BASE = 0x8a1818;
const FLAME_MID = 0xee5a20;
const FLAME_HI = 0xffc040;
const FLAME_TIP = 0xfff0a0;
const EMBER_CORE = 0xff8040;
const EMBER_BRIGHT = 0xffe080;
const GLOW_WARM = 0xffaa50;
// Kettle on the hob — Gran's "kettle's on" greeting made literal.
const KETTLE_OUTLINE = 0x080404;
const KETTLE_BODY = 0x1a1410;
const KETTLE_HI = 0x4a3a30;
const KETTLE_RIM_GLOW = 0x6a4828;
const STEAM = 0xf0eee0;

/**
 * Draw one hearth frame into a Graphics context.
 */
export function drawHearthFrame(g: Phaser.GameObjects.Graphics, frameIdx: number): void {
  const s = HEARTH_CANVAS_SIZE;
  const cx = s / 2;
  const frame = HEARTH_FRAMES[frameIdx % HEARTH_FRAMES.length];

  // ── Stone mantel + mouth. Mouth is an arched rectangle. ──
  // Outer stone block (hearth surround).
  g.fillStyle(STONE_OUTLINE, 1);
  g.fillRoundedRect(2, 8, s - 4, s - 14, 3);
  g.fillStyle(STONE_MID, 1);
  g.fillRoundedRect(3, 9, s - 6, s - 16, 3);

  // Individual stones — two horizontal courses for character.
  g.fillStyle(STONE_DARK, 1);
  g.fillRect(4, 10, 12, 10);
  g.fillRect(18, 10, 10, 10);
  g.fillRect(s - 28, 10, 10, 10);
  g.fillRect(s - 16, 10, 12, 10);
  g.fillRect(4, 30, 9, 10);
  g.fillRect(s - 13, 30, 9, 10);
  // Mortar highlights between stones.
  g.fillStyle(MORTAR, 1);
  g.fillRect(4, 20, s - 8, 1);
  g.fillRect(4, 30, s - 8, 1);

  // Stone highlights — top-edge kiss of light so stones read 3D.
  g.fillStyle(STONE_HI, 0.8);
  g.fillRect(4, 10, 12, 1);
  g.fillRect(s - 16, 10, 12, 1);

  // ── Fire mouth — arched dark interior where flames live. ──
  const mouthX = cx - 14;
  const mouthY = 24;
  const mouthW = 28;
  const mouthH = 28;
  g.fillStyle(STONE_OUTLINE, 1);
  g.fillRoundedRect(mouthX - 1, mouthY - 1, mouthW + 2, mouthH + 2, 6);
  g.fillStyle(BACK_BLACK, 1);
  g.fillRoundedRect(mouthX, mouthY, mouthW, mouthH, 5);

  // Warm glow wash inside the mouth — pulses with ember brightness.
  g.fillStyle(GLOW_WARM, 0.2 * frame.emberGlow);
  g.fillEllipse(cx, mouthY + mouthH * 0.72, mouthW + 4, mouthH * 0.7);

  // ── Logs — two crossed peat/log shapes at the base of the mouth. ──
  // Back log (horizontal).
  g.fillStyle(LOG_DARK, 1);
  g.fillRoundedRect(mouthX + 3, mouthY + mouthH - 10, mouthW - 6, 6, 2);
  g.fillStyle(LOG_MID, 1);
  g.fillRoundedRect(mouthX + 4, mouthY + mouthH - 9, mouthW - 8, 3, 1);
  // Charred log end.
  g.fillStyle(LOG_CHAR, 1);
  g.fillCircle(mouthX + 4, mouthY + mouthH - 7, 1.6);
  g.fillCircle(mouthX + mouthW - 4, mouthY + mouthH - 7, 1.6);

  // Front log at a slight angle (diagonal).
  g.fillStyle(LOG_DARK, 1);
  g.fillTriangle(
    mouthX + 5, mouthY + mouthH - 3,
    mouthX + mouthW - 5, mouthY + mouthH - 6,
    mouthX + mouthW - 5, mouthY + mouthH - 2,
  );
  g.fillTriangle(
    mouthX + 5, mouthY + mouthH - 3,
    mouthX + 5, mouthY + mouthH - 6,
    mouthX + mouthW - 5, mouthY + mouthH - 6,
  );

  // ── Flame column — layered, frame-offset tips. ──
  const flameBaseY = mouthY + mouthH - 9;
  const flameX = cx + frame.tipX;
  const flameTopY = flameBaseY - 14 + frame.tipY;

  // Outer flame (dark red base, wide).
  g.fillStyle(FLAME_BASE, 1);
  g.fillTriangle(
    cx - 9, flameBaseY,
    cx + 9, flameBaseY,
    flameX, flameTopY,
  );
  // Mid flame (tangerine).
  g.fillStyle(FLAME_MID, 1);
  g.fillTriangle(
    cx - 6, flameBaseY - 1,
    cx + 6, flameBaseY - 1,
    flameX, flameTopY + 3,
  );
  // Inner flame (yellow-hot).
  g.fillStyle(FLAME_HI, 1);
  g.fillTriangle(
    cx - 3, flameBaseY - 2,
    cx + 3, flameBaseY - 2,
    flameX, flameTopY + 6,
  );
  // Top tip (nearly white).
  g.fillStyle(FLAME_TIP, 1);
  g.fillTriangle(
    flameX - 1.4, flameTopY + 8,
    flameX + 1.4, flameTopY + 8,
    flameX, flameTopY + 4,
  );

  // Side licks — smaller flames either side of the main column.
  g.fillStyle(FLAME_MID, 1);
  g.fillTriangle(
    cx - 12, flameBaseY,
    cx - 7, flameBaseY,
    cx - 10, flameBaseY - 6 + frame.leftLickY,
  );
  g.fillTriangle(
    cx + 7, flameBaseY,
    cx + 12, flameBaseY,
    cx + 10, flameBaseY - 6 + frame.rightLickY,
  );
  g.fillStyle(FLAME_HI, 1);
  g.fillTriangle(
    cx - 11, flameBaseY - 1,
    cx - 8, flameBaseY - 1,
    cx - 10, flameBaseY - 4 + frame.leftLickY,
  );
  g.fillTriangle(
    cx + 8, flameBaseY - 1,
    cx + 11, flameBaseY - 1,
    cx + 10, flameBaseY - 4 + frame.rightLickY,
  );

  // ── Embers at the log line — bright specks that pulse with the frame glow. ──
  g.fillStyle(EMBER_CORE, frame.emberGlow);
  g.fillCircle(cx - 6, flameBaseY + 1, 1);
  g.fillCircle(cx + 5, flameBaseY + 2, 1.1);
  g.fillCircle(cx - 1, flameBaseY + 3, 0.9);
  g.fillStyle(EMBER_BRIGHT, frame.emberGlow);
  g.fillCircle(cx - 6, flameBaseY + 1, 0.4);
  g.fillCircle(cx + 5, flameBaseY + 2, 0.5);

  // Spark above the flame tip (only on bright frames — cheap motion hint).
  if (frame.emberGlow > 0.9) {
    g.fillStyle(EMBER_BRIGHT, 0.85);
    g.fillRect(flameX - 0.5 + 3, flameTopY - 3, 0.6, 0.6);
    g.fillRect(flameX - 0.5 - 4, flameTopY - 1, 0.5, 0.5);
  }

  // ── Hearthstone slab at the base. ──
  g.fillStyle(STONE_OUTLINE, 1);
  g.fillRect(2, s - 8, s - 4, 6);
  g.fillStyle(STONE_DARK, 1);
  g.fillRect(3, s - 7, s - 6, 4);
  g.fillStyle(STONE_HI, 0.6);
  g.fillRect(3, s - 7, s - 6, 1);

  // ── Kettle on the right hob. ──
  // Sits on the hearthstone, just right of the fire mouth so the
  // canonical "kettle's on" reading is unambiguous and Gran's greeting
  // gets a visual referent. Steam wisps only on the brighter frames so
  // the puff times with the flame's strongest tugs.
  drawKettleOnHob(g, mouthX + mouthW + 4, s - 9, frame.emberGlow);
}

function drawKettleOnHob(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  emberGlow: number,
): void {
  // Body — squat cast-iron belly. Origin (x, y) is the bottom-left of
  // the belly footprint sitting on the hearthstone.
  const bw = 11;
  const bh = 8;
  g.fillStyle(KETTLE_OUTLINE, 1);
  g.fillRoundedRect(x, y - bh, bw, bh, 2);
  g.fillStyle(KETTLE_BODY, 1);
  g.fillRoundedRect(x + 0.6, y - bh + 0.6, bw - 1.2, bh - 1.2, 1.5);
  // Highlight crescent on the upper-left (firelight).
  g.fillStyle(KETTLE_HI, 0.85);
  g.fillEllipse(x + 3.4, y - bh + 2.4, 4, 1.3);

  // Rim glow that pulses with the ember frame.
  g.fillStyle(KETTLE_RIM_GLOW, Math.max(0.35, emberGlow * 0.85));
  g.fillRect(x + 1, y - bh + 0.4, bw - 2, 0.7);

  // Lid + knob.
  const lidX = x + 2;
  const lidY = y - bh - 1.4;
  g.fillStyle(KETTLE_OUTLINE, 1);
  g.fillRect(lidX, lidY, bw - 4, 1.6);
  g.fillStyle(KETTLE_BODY, 1);
  g.fillRect(lidX + 0.4, lidY + 0.4, bw - 4.8, 0.9);
  // Knob.
  g.fillStyle(KETTLE_OUTLINE, 1);
  g.fillRect(lidX + (bw - 4) / 2 - 0.8, lidY - 1.4, 1.8, 1.6);
  g.fillStyle(KETTLE_HI, 0.7);
  g.fillRect(lidX + (bw - 4) / 2 - 0.4, lidY - 1.2, 0.6, 0.6);

  // Spout — pokes left toward the fire so steam reads as rising into
  // the warm draught.
  g.fillStyle(KETTLE_OUTLINE, 1);
  g.fillTriangle(
    x - 2, y - bh + 2,
    x + 1, y - bh + 1,
    x + 1, y - bh + 4,
  );
  g.fillStyle(KETTLE_BODY, 1);
  g.fillTriangle(
    x - 1.4, y - bh + 2.4,
    x + 0.8, y - bh + 1.8,
    x + 0.8, y - bh + 3.4,
  );

  // Handle — arch over the lid.
  g.lineStyle(1, KETTLE_OUTLINE, 1);
  g.beginPath();
  g.arc(x + bw / 2, y - bh - 0.4, 4, Math.PI * 1.05, Math.PI * 1.95, false);
  g.strokePath();

  // Steam wisp — only on the brighter frames so the puff feels timed.
  if (emberGlow > 0.85) {
    g.fillStyle(STEAM, 0.75);
    g.fillEllipse(x - 1.6, y - bh - 3, 2.6, 1.4);
    g.fillStyle(STEAM, 0.55);
    g.fillEllipse(x - 3.0, y - bh - 5, 2.2, 1.2);
    g.fillStyle(STEAM, 0.35);
    g.fillEllipse(x - 1.8, y - bh - 7, 1.6, 1);
  } else if (emberGlow > 0.7) {
    g.fillStyle(STEAM, 0.4);
    g.fillEllipse(x - 1.6, y - bh - 3, 2, 1.2);
  }
}

/**
 * Bake all four hearth frames to named textures. Call from BootScene.
 */
export function bakeHearthTextures(scene: Phaser.Scene): void {
  for (let i = 0; i < HEARTH_FRAME_COUNT; i++) {
    const g = scene.add.graphics();
    drawHearthFrame(g, i);
    g.generateTexture(HEARTH_TEXTURE_KEYS[i], HEARTH_CANVAS_SIZE, HEARTH_CANVAS_SIZE);
    g.destroy();
  }
}
