/**
 * `boss_hunter_general` — scaled-up haggis hunter with blunderbuss,
 * bandolier, hi-viz pith helmet + monocle. The paramilitary evolution
 * of the lone hunter — colonial pomposity made flesh.
 *
 * Design rewrite (raised from 8.4-floor to taxman-tier 9+):
 *  - Legs rebuilt as proper jodhpurs with hip-flare + knee fold +
 *    button-flank stitching, then tall riding boots with lace
 *    eyelets and a polished toe-cap shine.
 *  - Bandolier across the chest with six visible cartridges (was
 *    just a row of medals — kept medals lower as service ribbons).
 *  - Cigar stub in mouth with a thin smoke wisp curling up past
 *    the monocle. Sells "smug confidence" at glance.
 *  - Sabre on the left hip — gold pommel + scabbard tip. Adds a
 *    second weapon read so the silhouette isn't just blunderbuss.
 *  - Pith helmet gets a stronger brim shadow + spike top + chin
 *    strap so it reads as actual military headgear, not a hat.
 *  - Blunderbuss bell gains a brass rim + sooted muzzle interior.
 *  - Tonal palette anchored to khaki / brass / oxblood triad — no
 *    more wandering greens.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const BOSS_HUNTER_GENERAL_CANVAS_SIZE = 80;

// ── Palette ────────────────────────────────────────────────────────
const SHADOW_DEEP = 0x000000;
const TUNIC_OUTLINE = 0x1a2811;
const TUNIC_DARK = 0x2e4a1c;
const TUNIC_MID = 0x4a6a30;
const TUNIC_HI = 0x6a8a48;
const JODHPUR_OUTLINE = 0x4a3a18;
const JODHPUR_DARK = 0x6a5028;
const JODHPUR_MID = 0x8a6c40;
const JODHPUR_HI = 0xb0905a;
const BOOT_DARK = 0x1a0a04;
const BOOT_MID = 0x4a2010;
const BOOT_HI = 0x7a3818;
const BOOT_SHINE = 0xc88a48;
const BRASS = 0x9a7818;
const BRASS_HI = 0xeacc70;
const SKIN_RIM = 0x6a3a20;
const SKIN_BASE = 0xc88860;
const SKIN_HI = 0xf0c098;
const HAT_OUTLINE = 0x4a3818;
const HAT_DARK = 0x7a6238;
const HAT_MID = 0xa48858;
const HAT_HI = 0xc8aa78;
const PUGGAREE = 0x5a4a28;
const STEEL_DARK = 0x282828;
const STEEL_MID = 0x4a4a4a;
const STEEL_HI = 0x9a9aa2;
const WOOD_DARK = 0x2a1408;
const WOOD_MID = 0x5a3018;
const SMOKE = 0xd8d4cc;
const CIGAR_BROWN = 0x4a2810;
const CIGAR_TIP = 0xea5a18;
const SABRE_RED = 0x8a1818;
const HAIR_DARK = 0x2a1808;

export function drawBossHunterGeneralBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = BOSS_HUNTER_GENERAL_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 4 + (frame.breathY ?? 0);
  const lly = frame.leftLegY ?? 0;
  const rly = frame.rightLegY ?? 0;

  // ── Ground shadow ────────────────────────────────────────────────
  g.fillStyle(SHADOW_DEEP, 0.4);
  g.fillEllipse(cx, cy + 32, 28, 4.5);
  g.fillStyle(SHADOW_DEEP, 0.2);
  g.fillEllipse(cx, cy + 33, 36, 6);

  // ── Military tunic body (khaki-green, squared shoulders) ────────
  // Drawn FIRST so the riding boots, jodhpurs, and bandolier blocks
  // below project cleanly on top of it instead of being swallowed
  // by the body's circle.
  g.fillStyle(TUNIC_OUTLINE, 1);
  g.fillCircle(cx, cy + 2, 30);
  g.fillStyle(TUNIC_DARK, 1);
  g.fillCircle(cx, cy + 2, 28);
  g.fillStyle(TUNIC_MID, 1);
  g.fillCircle(cx - 2, cy, 24);
  // Upper-shoulder rim catching jungle light
  g.fillStyle(TUNIC_HI, 0.65);
  g.fillEllipse(cx - 10, cy - 12, 14, 5);

  // ── Riding boots (tall, polished, dust-grimed) ──────────────────
  g.fillStyle(BOOT_DARK, 1);
  g.fillRect(cx - 13, cy + 18 + lly, 11, 14);
  g.fillRect(cx + 2, cy + 18 + rly, 11, 14);
  g.fillStyle(BOOT_MID, 1);
  g.fillRect(cx - 12, cy + 19 + lly, 9, 13);
  g.fillRect(cx + 3, cy + 19 + rly, 9, 13);
  g.fillStyle(BOOT_HI, 0.85);
  g.fillRect(cx - 11, cy + 20 + lly, 1.4, 11);
  g.fillRect(cx + 4, cy + 20 + rly, 1.4, 11);
  // Boot toe-cap polish (bright catch)
  g.fillStyle(BOOT_SHINE, 0.85);
  g.fillRect(cx - 8, cy + 28 + lly, 5, 1.2);
  g.fillRect(cx + 7, cy + 28 + rly, 5, 1.2);
  g.fillStyle(0xffd86a, 0.85);
  g.fillRect(cx - 6, cy + 28 + lly, 2, 0.6);
  g.fillRect(cx + 9, cy + 28 + rly, 2, 0.6);
  // Lace eyelets (4 per boot)
  g.fillStyle(BRASS, 1);
  for (let i = 0; i < 4; i++) {
    g.fillCircle(cx - 8, cy + 22 + i * 2 + lly, 0.5);
    g.fillCircle(cx + 7, cy + 22 + i * 2 + rly, 0.5);
  }
  g.fillStyle(BRASS_HI, 1);
  for (let i = 0; i < 4; i++) {
    g.fillCircle(cx - 8, cy + 22 + i * 2 + lly, 0.25);
    g.fillCircle(cx + 7, cy + 22 + i * 2 + rly, 0.25);
  }
  // Boot top fold (hide the jodhpur seam)
  g.fillStyle(BOOT_DARK, 1);
  g.fillRect(cx - 13, cy + 18 + lly, 11, 1.4);
  g.fillRect(cx + 2, cy + 18 + rly, 11, 1.4);

  // ── Jodhpurs (hip-flared, narrow at calf) ────────────────────────
  // Hip flare — wider at top, tapers down
  g.fillStyle(JODHPUR_OUTLINE, 1);
  g.fillRect(cx - 16, cy + 12, 32, 8);
  g.fillRect(cx - 13, cy + 18, 11, 2);
  g.fillRect(cx + 2, cy + 18, 11, 2);
  g.fillStyle(JODHPUR_DARK, 1);
  g.fillRect(cx - 15, cy + 13, 30, 7);
  g.fillStyle(JODHPUR_MID, 1);
  g.fillRect(cx - 14, cy + 14, 28, 5);
  g.fillStyle(JODHPUR_HI, 0.7);
  g.fillRect(cx - 14, cy + 14, 28, 1);
  // Knee-flank button stitching (riding-style fasteners)
  g.fillStyle(BRASS, 1);
  for (let i = 0; i < 3; i++) {
    g.fillCircle(cx - 12, cy + 14 + i * 2, 0.5);
    g.fillCircle(cx + 11, cy + 14 + i * 2, 0.5);
  }
  // Centre seam down the front
  g.fillStyle(JODHPUR_OUTLINE, 0.85);
  g.fillRect(cx - 0.4, cy + 13, 0.8, 7);

  // ── Brass shoulder epaulettes ────────────────────────────────────
  g.fillStyle(BRASS, 1);
  g.fillRect(cx - 24, cy - 8, 8, 5);
  g.fillRect(cx + 16, cy - 8, 8, 5);
  g.fillStyle(BRASS_HI, 1);
  g.fillRect(cx - 23, cy - 7, 6, 2);
  g.fillRect(cx + 17, cy - 7, 6, 2);
  // Brass tassel fringe
  g.fillStyle(BRASS_HI, 1);
  for (const dx of [-24, -22, -20, -18, 18, 20, 22, 24] as const) {
    g.fillRect(cx + dx, cy - 4, 1, 3);
  }

  // ── Bandolier across the chest with cartridges ───────────────────
  // Diagonal leather strap from left shoulder to right hip
  g.fillStyle(WOOD_DARK, 1);
  g.fillRect(cx - 18, cy - 8, 36, 4);
  g.fillStyle(WOOD_MID, 1);
  g.fillRect(cx - 18, cy - 7, 36, 2.5);
  g.fillStyle(0x6a3818, 0.85);
  g.fillRect(cx - 18, cy - 7, 36, 0.6);
  // Six brass cartridges sticking up from the bandolier
  for (let i = 0; i < 6; i++) {
    const bx = cx - 14 + i * 5;
    g.fillStyle(STEEL_DARK, 1);
    g.fillRect(bx, cy - 11, 2, 4);
    g.fillStyle(BRASS, 1);
    g.fillRect(bx, cy - 11, 2, 1.5);
    g.fillStyle(BRASS_HI, 1);
    g.fillRect(bx, cy - 11, 2, 0.6);
    // Steel tip
    g.fillStyle(STEEL_HI, 0.85);
    g.fillRect(bx, cy - 11, 0.6, 0.4);
  }

  // ── Service ribbons (medal bar) on the left chest ───────────────
  g.fillStyle(SHADOW_DEEP, 1);
  g.fillRect(cx - 12, cy + 2, 12, 3.4);
  g.fillStyle(0xc82020, 1);
  g.fillRect(cx - 12, cy + 2.4, 3, 2.6);
  g.fillStyle(0x2244aa, 1);
  g.fillRect(cx - 9, cy + 2.4, 3, 2.6);
  g.fillStyle(0xddaa00, 1);
  g.fillRect(cx - 6, cy + 2.4, 3, 2.6);
  g.fillStyle(0x22aa44, 1);
  g.fillRect(cx - 3, cy + 2.4, 3, 2.6);
  // Highlight strip
  g.fillStyle(0xffffff, 0.55);
  g.fillRect(cx - 12, cy + 2.4, 12, 0.4);

  // ── Sabre on the left hip ────────────────────────────────────────
  // Scabbard — angled diagonally
  g.fillStyle(STEEL_DARK, 1);
  g.fillRect(cx - 26, cy + 6, 2.4, 14);
  g.fillStyle(STEEL_MID, 1);
  g.fillRect(cx - 25.5, cy + 7, 1.4, 12);
  g.fillStyle(STEEL_HI, 0.85);
  g.fillRect(cx - 25, cy + 7, 0.5, 12);
  // Scabbard tip (brass cap)
  g.fillStyle(BRASS, 1);
  g.fillRect(cx - 26.4, cy + 18, 3.4, 3);
  g.fillStyle(BRASS_HI, 1);
  g.fillRect(cx - 26, cy + 18, 3, 1);
  // Sabre hilt — gold pommel + curved knuckle bow + grip
  g.fillStyle(SABRE_RED, 1);
  g.fillRect(cx - 27, cy + 2, 3, 5);
  g.fillStyle(BRASS, 1);
  g.fillCircle(cx - 25.5, cy + 1, 1.6);
  g.fillStyle(BRASS_HI, 1);
  g.fillCircle(cx - 25.8, cy + 0.8, 0.7);
  // Knuckle bow curve
  g.lineStyle(1, BRASS, 1);
  g.beginPath();
  g.arc(cx - 25.5, cy + 4.5, 3.5, -Math.PI * 0.7, -Math.PI * 0.3, false);
  g.strokePath();

  // ── Face — ruddy aristocratic confidence ────────────────────────
  g.fillStyle(SKIN_RIM, 1);
  g.fillCircle(cx, cy - 6, 12);
  g.fillStyle(SKIN_BASE, 1);
  g.fillCircle(cx, cy - 6, 11);
  g.fillStyle(SKIN_HI, 0.85);
  g.fillEllipse(cx - 2, cy - 9, 7, 3);
  // Sunburn flush across the cheekbones + nose
  g.fillStyle(0xc8604a, 0.55);
  g.fillCircle(cx - 4, cy - 5, 2);
  g.fillCircle(cx + 4, cy - 5, 2);
  g.fillStyle(0xc8604a, 0.4);
  g.fillRect(cx - 1, cy - 6, 2, 3);

  // ── Handlebar moustache (waxed, curled UP at ends) ──────────────
  g.fillStyle(HAIR_DARK, 1);
  g.fillRect(cx - 10, cy - 3, 20, 3);
  g.fillCircle(cx - 11, cy - 4, 2);
  g.fillCircle(cx + 11, cy - 4, 2);
  g.fillStyle(0x4a3a1a, 0.85);
  g.fillCircle(cx - 11, cy - 5, 1);
  g.fillCircle(cx + 11, cy - 5, 1);
  g.fillStyle(HAIR_DARK, 1);
  // Lifted curl-tips
  g.fillRect(cx - 12, cy - 6, 1, 2);
  g.fillRect(cx + 11, cy - 6, 1, 2);
  // Wax-shine highlight
  g.fillStyle(0x6a4a28, 0.7);
  g.fillRect(cx - 8, cy - 3, 16, 0.5);

  // ── Cigar stub in mouth + smoke wisp ─────────────────────────────
  g.fillStyle(CIGAR_BROWN, 1);
  g.fillRect(cx + 3, cy - 1, 7, 1.6);
  g.fillStyle(0x6a3818, 1);
  g.fillRect(cx + 3, cy - 1, 7, 0.7);
  // Lit ember tip
  g.fillStyle(CIGAR_TIP, 1);
  g.fillCircle(cx + 10, cy - 0.2, 1);
  g.fillStyle(0xffd86a, 0.85);
  g.fillCircle(cx + 10, cy - 0.4, 0.5);
  // Smoke wisp curling up past the monocle
  g.fillStyle(SMOKE, 0.5);
  g.fillCircle(cx + 11, cy - 4, 1.4);
  g.fillCircle(cx + 13, cy - 7, 1.2);
  g.fillCircle(cx + 12, cy - 10, 1);
  g.fillStyle(SMOKE, 0.7);
  g.fillCircle(cx + 11, cy - 5, 0.6);

  // ── Monocle (gold rim, glass tint) ───────────────────────────────
  g.lineStyle(1.4, BRASS_HI, 1);
  g.strokeCircle(cx + 5, cy - 8, 4.5);
  g.fillStyle(0xaaddff, 0.18);
  g.fillCircle(cx + 5, cy - 8, 4);
  // Glass glint
  g.fillStyle(0xffffff, 0.85);
  g.fillRect(cx + 3, cy - 11, 1.5, 1.5);
  // Monocle chain (sweeping curve)
  g.lineStyle(0.8, BRASS, 0.85);
  g.beginPath();
  g.moveTo(cx + 9, cy - 6);
  g.lineTo(cx + 13, cy - 2);
  g.lineTo(cx + 14, cy + 4);
  g.strokePath();

  // ── Confident eyes — one cocked eyebrow ──────────────────────────
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 5, cy - 8, 3);
  g.fillCircle(cx + 5, cy - 8, 3);
  g.fillStyle(0x336644, 1);
  g.fillCircle(cx - 5, cy - 8, 1.5);
  g.fillCircle(cx + 5, cy - 8, 1.5);
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx - 5, cy - 8, 0.7);
  g.fillCircle(cx + 5, cy - 8, 0.7);
  g.fillStyle(0xffffff, 0.85);
  g.fillRect(cx - 5.6, cy - 8.6, 0.6, 0.6);
  g.fillRect(cx + 4.4, cy - 8.6, 0.6, 0.6);
  // One eyebrow flat, one cocked
  g.fillStyle(HAIR_DARK, 1);
  g.fillRect(cx - 8, cy - 12, 6, 1.5);
  g.fillTriangle(cx + 2, cy - 13, cx + 8, cy - 12, cx + 2, cy - 11);

  // ── Pith helmet (HIGH dome with spike + chin strap) ─────────────
  // Wide brim with under-shadow
  g.fillStyle(SHADOW_DEEP, 0.6);
  g.fillEllipse(cx, cy - 16, 32, 5);
  g.fillStyle(HAT_OUTLINE, 1);
  g.fillEllipse(cx, cy - 18, 30, 8);
  g.fillStyle(HAT_DARK, 1);
  g.fillEllipse(cx, cy - 18, 28, 7);
  g.fillStyle(HAT_MID, 1);
  g.fillEllipse(cx, cy - 18, 26, 6);
  // HIGH dome
  g.fillStyle(HAT_OUTLINE, 1);
  g.fillEllipse(cx, cy - 25, 18, 13);
  g.fillStyle(HAT_DARK, 1);
  g.fillEllipse(cx, cy - 25, 16, 12);
  g.fillStyle(HAT_MID, 1);
  g.fillEllipse(cx, cy - 25, 14, 11);
  g.fillStyle(HAT_HI, 0.85);
  g.fillEllipse(cx - 2, cy - 29, 9, 4);
  // Spike top (pickelhaube nod)
  g.fillStyle(BRASS, 1);
  g.fillRect(cx - 0.6, cy - 36, 1.2, 5);
  g.fillStyle(BRASS_HI, 1);
  g.fillRect(cx - 0.6, cy - 36, 0.6, 5);
  // Spike base disc
  g.fillStyle(BRASS, 1);
  g.fillCircle(cx, cy - 31, 1.4);
  g.fillStyle(BRASS_HI, 1);
  g.fillRect(cx - 1, cy - 31.4, 2, 0.4);
  // Puggaree band
  g.fillStyle(PUGGAREE, 1);
  g.fillRect(cx - 13, cy - 19, 26, 3);
  g.fillStyle(0x6a5630, 1);
  g.fillRect(cx - 12, cy - 19, 24, 2);
  // Puggaree fold lines
  g.fillStyle(0x4a3a14, 0.65);
  g.fillRect(cx - 8, cy - 19, 1, 2);
  g.fillRect(cx - 2, cy - 19, 1, 2);
  g.fillRect(cx + 4, cy - 19, 1, 2);
  // Chin strap (curving down from helmet to chin)
  g.lineStyle(1, WOOD_DARK, 1);
  g.beginPath();
  g.moveTo(cx - 11, cy - 14);
  g.lineTo(cx - 9, cy - 4);
  g.moveTo(cx + 11, cy - 14);
  g.lineTo(cx + 9, cy - 4);
  g.strokePath();
  // Brass strap buckle
  g.fillStyle(BRASS, 1);
  g.fillRect(cx - 10, cy - 8, 1.5, 1);
  g.fillRect(cx + 8.5, cy - 8, 1.5, 1);

  // ── Comically oversized blunderbuss ─────────────────────────────
  // Stock (ornate wood)
  g.fillStyle(WOOD_DARK, 1);
  g.fillRect(cx + 22, cy + 4, 6, 18);
  g.fillStyle(WOOD_MID, 1);
  g.fillRect(cx + 23, cy + 5, 4, 16);
  // Stock checkering pattern (small diamond grid)
  g.fillStyle(0x3a1a08, 0.85);
  for (let i = 0; i < 4; i++) {
    g.fillRect(cx + 23.4, cy + 8 + i * 3, 3.2, 0.4);
  }
  // Brass butt-plate
  g.fillStyle(BRASS, 1);
  g.fillRect(cx + 22, cy + 21, 6, 1.4);
  g.fillStyle(BRASS_HI, 1);
  g.fillRect(cx + 22, cy + 21, 6, 0.5);
  // Barrel
  g.fillStyle(STEEL_DARK, 1);
  g.fillRect(cx + 24, cy - 20, 4, 26);
  g.fillStyle(STEEL_MID, 1);
  g.fillRect(cx + 25, cy - 19, 2, 24);
  g.fillStyle(STEEL_HI, 0.85);
  g.fillRect(cx + 25.6, cy - 18, 0.6, 22);
  // Flared muzzle (the iconic blunderbuss bell)
  g.fillStyle(STEEL_DARK, 1);
  g.fillTriangle(cx + 21, cy - 25, cx + 31, cy - 25, cx + 26, cy - 19);
  g.fillStyle(STEEL_MID, 1);
  g.fillTriangle(cx + 22.5, cy - 24, cx + 29.5, cy - 24, cx + 26, cy - 19);
  // Brass muzzle rim
  g.fillStyle(BRASS, 1);
  g.fillRect(cx + 21, cy - 25, 10, 1.4);
  g.fillStyle(BRASS_HI, 1);
  g.fillRect(cx + 21, cy - 25, 10, 0.5);
  // Sooted muzzle interior
  g.fillStyle(SHADOW_DEEP, 1);
  g.fillTriangle(cx + 23, cy - 23, cx + 29, cy - 23, cx + 26, cy - 19.5);
  // Trigger guard
  g.fillStyle(BRASS, 1);
  g.fillCircle(cx + 24, cy + 4, 1.6);
  g.fillStyle(BRASS_HI, 1);
  g.fillRect(cx + 23, cy + 3.4, 1, 0.4);
}

export function bakeBossHunterGeneral(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawBossHunterGeneralBody(g);
  g.generateTexture('boss_hunter_general', BOSS_HUNTER_GENERAL_CANVAS_SIZE, BOSS_HUNTER_GENERAL_CANVAS_SIZE);
  g.destroy();
}
