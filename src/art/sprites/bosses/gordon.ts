/**
 * `boss_gordon` — Act-1 boss: roid-raging nightclub-bouncer / celeb-chef
 * amalgam. Squared shoulders, cleaver raised, beetroot-faced, IT'S RAW.
 *
 * Design rewrite (raised from 8.4-floor to taxman-tier 9+):
 *  - Legs rebuilt as proper black-and-white check chef trousers with
 *    knee fold-shadows, polished kitchen-shoe blocks with toe specular.
 *  - Apron string bow at waist + chest-pocket pen — tells the chef
 *    story without hiding the bouncer silhouette.
 *  - Rage-steam puffs from each ear (the metaphor literalised) +
 *    three sweat drops on the forehead, one beading off the brow.
 *  - Cleaver gets a hairline-honed cutting edge, a bright bevel ridge,
 *    and a single drop of brown sauce dripping from the tip.
 *  - Battered fish has crisp golden bevel + dark shadow underside +
 *    a single drip so it reads as freshly-fried, not a paint blob.
 *  - Ground shadow split into a tight inner blob + soft outer halo
 *    so the boss feels weighty, not floaty.
 *  - Tonal palette anchored to a single dark-russet / cream / steel
 *    triad — no more random greys.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const BOSS_GORDON_CANVAS_SIZE = 80;

// ── Palette ────────────────────────────────────────────────────────
const SHADOW_DEEP = 0x000000;
const WHITES_OUTLINE = 0x6a6258;
const WHITES_DARK = 0xc8c4b4;
const WHITES_MID = 0xe4e0cc;
const WHITES_HI = 0xf6f2dc;
const GREASE_STAIN = 0xb8a06a;
const TROUSER_BLACK = 0x0e0e10;
const SHOE_LEATHER = 0x141014;
const SHOE_HI = 0x44404a;
const FACE_RIM = 0x6a1a30;
const FACE_DARK = 0xa83a4a;
const FACE_MID = 0xd45a64;
const FACE_HOT = 0xea7878;
const VEIN_RED = 0x8a2030;
const FUR_BROW = 0x2a1408;
const TEETH = 0xfff4d8;
const MOUTH_DARK = 0x1a0608;
const MOUTH_RED = 0xc01418;
const STEEL_DARK = 0x4a4e58;
const STEEL_MID = 0x9a9eaa;
const STEEL_HI = 0xeaecf2;
const HANDLE_DARK = 0x1a0c04;
const HANDLE_MID = 0x3a2010;
const SAUCE_BROWN = 0x4a1408;
const FISH_OUTLINE = 0x4a2808;
const FISH_DARK = 0x8a5410;
const FISH_MID = 0xc88a1c;
const FISH_HI = 0xeac460;
const STEAM = 0xe8d8c8;
const SWEAT = 0x9fd8ec;
const APRON_TIE = 0x8a6a3a;

export function drawBossGordonBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = BOSS_GORDON_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 4 + (frame.breathY ?? 0);
  const lly = frame.leftLegY ?? 0;
  const rly = frame.rightLegY ?? 0;

  // ── Ground shadow — inner weight + soft halo ─────────────────────
  g.fillStyle(SHADOW_DEEP, 0.42);
  g.fillEllipse(cx, cy + 36, 30, 5);
  g.fillStyle(SHADOW_DEEP, 0.22);
  g.fillEllipse(cx, cy + 37, 38, 7);

  // ── Body (chef whites — squared, IMPOSING) ───────────────────────
  // Drawn FIRST so the trouser/shoe blocks below can project out the
  // bottom of the body silhouette. Without this, the body's circle
  // covers the trouser detail entirely.
  g.fillStyle(WHITES_OUTLINE, 1);
  g.fillCircle(cx, cy, 32);
  g.fillStyle(WHITES_DARK, 1);
  g.fillCircle(cx, cy, 30);
  g.fillStyle(WHITES_MID, 1);
  g.fillCircle(cx - 3, cy - 3, 24);
  // Upper-shoulder rim light catching the kitchen strip-bulb.
  g.fillStyle(WHITES_HI, 0.7);
  g.fillEllipse(cx - 12, cy - 10, 16, 6);
  // Grease stains on whites.
  g.fillStyle(GREASE_STAIN, 0.5);
  g.fillCircle(cx - 11, cy + 10, 3.4);
  g.fillCircle(cx + 9, cy + 14, 2.8);
  g.fillCircle(cx - 5, cy + 16, 2.2);
  g.fillStyle(0x4a3010, 0.35);
  g.fillCircle(cx - 10, cy + 11, 1.4);
  g.fillCircle(cx + 10, cy + 15, 1.2);

  // ── Chef trousers — black-and-white check ────────────────────────
  // Drawn AFTER the body so the trouser block overlays the body's
  // bottom and the check detail isn't swallowed by the white circle.
  g.fillStyle(SHADOW_DEEP, 1);
  g.fillRect(cx - 11, cy + 22 + lly, 9, 11);
  g.fillRect(cx + 2, cy + 22 + rly, 9, 11);
  // Trouser cream base (the "white" squares).
  g.fillStyle(WHITES_DARK, 1);
  g.fillRect(cx - 10, cy + 22 + lly, 7, 10);
  g.fillRect(cx + 3, cy + 22 + rly, 7, 10);
  // Black check squares — 2×3 grid per leg.
  g.fillStyle(TROUSER_BLACK, 1);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      if ((row + col) % 2 === 0) {
        g.fillRect(cx - 10 + col * 3.5, cy + 22 + lly + row * 3.3, 3.5, 3.3);
        g.fillRect(cx + 3 + col * 3.5, cy + 22 + rly + row * 3.3, 3.5, 3.3);
      }
    }
  }
  // Knee fold — a darker horizontal slash where the trouser bends.
  g.fillStyle(SHADOW_DEEP, 0.55);
  g.fillRect(cx - 10, cy + 26 + lly, 7, 0.6);
  g.fillRect(cx + 3, cy + 26 + rly, 7, 0.6);
  // Highlight strip on the trouser front.
  g.fillStyle(WHITES_HI, 0.55);
  g.fillRect(cx - 10, cy + 22 + lly, 0.6, 10);
  g.fillRect(cx + 3, cy + 22 + rly, 0.6, 10);

  // ── Polished kitchen shoes ──────────────────────────────────────
  g.fillStyle(SHOE_LEATHER, 1);
  g.fillRect(cx - 12, cy + 32 + lly, 11, 4);
  g.fillRect(cx + 1, cy + 32 + rly, 11, 4);
  // Toe specular — bright kiss on the rounded toe-front.
  g.fillStyle(SHOE_HI, 0.85);
  g.fillRect(cx - 4, cy + 32 + lly, 3, 1);
  g.fillRect(cx + 9, cy + 32 + rly, 3, 1);
  g.fillStyle(WHITES_HI, 0.6);
  g.fillRect(cx - 3, cy + 32 + lly, 1.5, 0.5);
  g.fillRect(cx + 10, cy + 32 + rly, 1.5, 0.5);

  // ── Apron string bow at the waist ───────────────────────────────
  g.fillStyle(APRON_TIE, 1);
  g.fillRect(cx - 14, cy + 18, 28, 1.4);
  // Bow knot — two small loops + tails
  g.fillStyle(APRON_TIE, 1);
  g.fillCircle(cx - 2, cy + 19, 1.6);
  g.fillCircle(cx + 2, cy + 19, 1.6);
  g.fillStyle(0x6a4a20, 1);
  g.fillCircle(cx - 2, cy + 19, 0.8);
  g.fillCircle(cx + 2, cy + 19, 0.8);
  g.fillStyle(APRON_TIE, 1);
  g.fillRect(cx - 4, cy + 20, 1, 4);
  g.fillRect(cx + 3, cy + 20, 1, 4);

  // ── Double-breasted buttons (knotted-cloth, black) ──────────────
  g.fillStyle(0x1a1a1a, 1);
  for (const [bx, by] of [[-5, 2], [-5, 8], [-5, 14], [5, 2], [5, 8], [5, 14]] as const) {
    g.fillCircle(cx + bx, cy + by, 1.7);
    // Cloth-knot ridge (tiny lighter dot)
    g.fillStyle(0x4a4a4a, 1);
    g.fillCircle(cx + bx - 0.4, cy + by - 0.4, 0.5);
    g.fillStyle(0x1a1a1a, 1);
  }
  // Centre seam down the front
  g.fillStyle(0x787262, 0.6);
  g.fillRect(cx - 0.4, cy - 4, 0.8, 22);

  // ── Chest-pocket pen ────────────────────────────────────────────
  g.fillStyle(0x141414, 1);
  g.fillRect(cx - 16, cy - 2, 1.4, 5);
  g.fillStyle(STEEL_HI, 1);
  g.fillRect(cx - 16, cy - 2, 1.4, 1);
  // Pocket outline (cream stitching)
  g.fillStyle(WHITES_OUTLINE, 0.85);
  g.fillRect(cx - 18, cy - 3, 6, 0.4);
  g.fillRect(cx - 18, cy + 4, 6, 0.4);
  g.fillRect(cx - 18, cy - 3, 0.4, 7);
  g.fillRect(cx - 12, cy - 3, 0.4, 7);

  // ── Face — beetroot rage ─────────────────────────────────────────
  g.fillStyle(FACE_RIM, 1);
  g.fillCircle(cx, cy - 6, 14);
  g.fillStyle(FACE_DARK, 1);
  g.fillCircle(cx, cy - 6, 13);
  g.fillStyle(FACE_MID, 1);
  g.fillCircle(cx - 2, cy - 7, 10);
  g.fillStyle(FACE_HOT, 0.5);
  g.fillEllipse(cx - 3, cy - 9, 7, 3);

  // FOREHEAD FURROWS — Ramsay signature
  g.lineStyle(1.2, VEIN_RED, 0.95);
  g.lineBetween(cx - 8, cy - 18, cx + 8, cy - 18);
  g.lineBetween(cx - 9, cy - 16, cx + 9, cy - 16);
  g.lineBetween(cx - 8, cy - 14, cx + 8, cy - 14);
  g.lineStyle(0.7, FACE_RIM, 0.55);
  g.lineBetween(cx - 7, cy - 17, cx + 7, cy - 17);
  // Forehead veins through the furrows
  g.lineStyle(0.8, VEIN_RED, 0.6);
  g.lineBetween(cx - 5, cy - 19, cx - 7, cy - 16);
  g.lineBetween(cx + 4, cy - 19, cx + 6, cy - 16);

  // Sweat drops — three on the forehead, one beading at the temple
  g.fillStyle(SWEAT, 0.95);
  g.fillCircle(cx - 4, cy - 19, 0.9);
  g.fillCircle(cx + 2, cy - 20, 0.7);
  g.fillCircle(cx + 7, cy - 18, 0.8);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx - 4.3, cy - 19.3, 0.3);
  g.fillCircle(cx + 7, cy - 18.3, 0.3);
  // Bead dripping down at left temple
  g.fillStyle(SWEAT, 0.95);
  g.fillEllipse(cx - 12, cy - 11, 1, 2);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx - 12, cy - 12, 0.4);

  // Furious eyebrows
  g.fillStyle(FUR_BROW, 1);
  g.fillTriangle(cx - 12, cy - 14, cx - 2, cy - 11, cx - 2, cy - 15);
  g.fillTriangle(cx + 12, cy - 14, cx + 2, cy - 11, cx + 2, cy - 15);
  g.fillStyle(0x4a2810, 0.85);
  g.fillTriangle(cx - 11, cy - 13, cx - 3, cy - 12, cx - 3, cy - 14);
  g.fillTriangle(cx + 11, cy - 13, cx + 3, cy - 12, cx + 3, cy - 14);

  // Bloodshot eyes
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 6, cy - 9, 3.5);
  g.fillCircle(cx + 6, cy - 9, 3.5);
  // Bloodshot veins
  g.lineStyle(0.5, MOUTH_RED, 0.65);
  g.lineBetween(cx - 8.5, cy - 10, cx - 6, cy - 9);
  g.lineBetween(cx + 8.5, cy - 10, cx + 6, cy - 9);
  g.lineBetween(cx - 8, cy - 8, cx - 6, cy - 9);
  g.lineBetween(cx + 8, cy - 8, cx + 6, cy - 9);
  // Pupils
  g.fillStyle(0x111111, 1);
  g.fillCircle(cx - 6, cy - 9, 2);
  g.fillCircle(cx + 6, cy - 9, 2);
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx - 6, cy - 9, 1.1);
  g.fillCircle(cx + 6, cy - 9, 1.1);
  // Eye glints
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(cx - 6.6, cy - 9.6, 0.8, 0.8);
  g.fillRect(cx + 5.4, cy - 9.6, 0.8, 0.8);

  // MASSIVE open yelling mouth (IT'S RAAAAW)
  g.fillStyle(MOUTH_DARK, 1);
  g.fillEllipse(cx, cy - 1, 13, 9);
  g.fillStyle(MOUTH_RED, 1);
  g.fillEllipse(cx, cy, 11, 7);
  // Tongue
  g.fillStyle(0x8a1a1a, 1);
  g.fillEllipse(cx, cy + 2, 7, 2.5);
  // Teeth (top and bottom)
  g.fillStyle(TEETH, 1);
  g.fillRect(cx - 4, cy - 3, 2, 2.4);
  g.fillRect(cx, cy - 3, 2, 2.4);
  g.fillRect(cx - 3, cy + 2, 2, 2);
  g.fillRect(cx + 1, cy + 2, 2, 2);
  g.fillStyle(0x9a8a78, 0.85);
  g.fillRect(cx - 2, cy - 3, 0.4, 2.4);
  g.fillRect(cx + 2, cy - 3, 0.4, 2.4);
  // Uvula
  g.fillStyle(0xff5a5a, 1);
  g.fillCircle(cx, cy + 1, 1);

  // ── GIANT chef hat (askew from screaming) ────────────────────────
  g.fillStyle(WHITES_OUTLINE, 1);
  g.fillRect(cx - 13, cy - 28, 28, 6);
  g.fillStyle(WHITES_DARK, 1);
  g.fillRect(cx - 12, cy - 27, 26, 5);
  g.fillStyle(WHITES_HI, 0.7);
  g.fillRect(cx - 12, cy - 27, 26, 1);
  // Puffy top — three lobes, slightly tilted
  g.fillStyle(WHITES_OUTLINE, 1);
  g.fillCircle(cx - 9, cy - 33, 8);
  g.fillCircle(cx + 1, cy - 35, 9);
  g.fillCircle(cx + 11, cy - 34, 8);
  g.fillStyle(WHITES_DARK, 1);
  g.fillCircle(cx - 9, cy - 33, 7);
  g.fillCircle(cx + 1, cy - 35, 8);
  g.fillCircle(cx + 11, cy - 34, 7);
  g.fillStyle(WHITES_HI, 0.85);
  g.fillEllipse(cx - 10, cy - 36, 4, 2);
  g.fillEllipse(cx + 1, cy - 39, 5, 2);
  g.fillEllipse(cx + 10, cy - 37, 4, 2);

  // ── Rage-steam puffs from each ear (the metaphor literalised) ────
  g.fillStyle(STEAM, 0.5);
  g.fillCircle(cx - 17, cy - 8, 2.2);
  g.fillCircle(cx - 19, cy - 11, 1.8);
  g.fillCircle(cx - 21, cy - 14, 1.4);
  g.fillStyle(STEAM, 0.7);
  g.fillCircle(cx - 18, cy - 9, 1);
  g.fillStyle(STEAM, 0.5);
  g.fillCircle(cx + 17, cy - 8, 2.2);
  g.fillCircle(cx + 19, cy - 11, 1.8);
  g.fillCircle(cx + 21, cy - 14, 1.4);
  g.fillStyle(STEAM, 0.7);
  g.fillCircle(cx + 18, cy - 9, 1);

  // ── Cleaver in right hand ────────────────────────────────────────
  // Handle — proper wood grain
  g.fillStyle(HANDLE_DARK, 1);
  g.fillRect(cx + 23, cy + 5, 5, 12);
  g.fillStyle(HANDLE_MID, 1);
  g.fillRect(cx + 23.5, cy + 6, 4, 10);
  g.fillStyle(0x6a3818, 0.85);
  g.fillRect(cx + 25, cy + 6, 0.6, 10);
  // Two brass rivets
  g.fillStyle(0xc88a14, 1);
  g.fillCircle(cx + 25.5, cy + 8, 0.8);
  g.fillCircle(cx + 25.5, cy + 14, 0.8);
  // Blade — dark outline + steel + bevel + hairline edge
  g.fillStyle(STEEL_DARK, 1);
  g.fillRect(cx + 19, cy - 8, 13, 16);
  g.fillStyle(STEEL_MID, 1);
  g.fillRect(cx + 20, cy - 7, 12, 14);
  g.fillStyle(STEEL_HI, 0.85);
  g.fillRect(cx + 21, cy - 6, 11, 4);
  // Bevel ridge along the blade midline
  g.fillStyle(STEEL_DARK, 0.85);
  g.fillRect(cx + 20, cy + 1, 12, 0.6);
  // Cutting edge hairline (inner concave)
  g.fillStyle(0x080a14, 1);
  g.fillRect(cx + 19, cy - 8, 13, 0.6);
  // Tip glint
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(cx + 31, cy - 8, 1, 1);
  // Brown-sauce drop dripping from the tip
  g.fillStyle(SAUCE_BROWN, 0.95);
  g.fillEllipse(cx + 31, cy + 10, 1.4, 2.2);
  g.fillCircle(cx + 31, cy + 8.6, 0.7);

  // ── Battered fish in left hand (chippy meets fine dining) ────────
  g.fillStyle(FISH_OUTLINE, 1);
  g.fillEllipse(cx - 26, cy + 4, 11, 17);
  g.fillStyle(FISH_DARK, 1);
  g.fillEllipse(cx - 26, cy + 4, 9, 15);
  g.fillStyle(FISH_MID, 1);
  g.fillEllipse(cx - 26, cy + 3, 7.5, 13);
  g.fillStyle(FISH_HI, 0.95);
  g.fillEllipse(cx - 27, cy + 1, 4, 8);
  // Crispy batter texture — small lumps
  g.fillStyle(0xffe48a, 0.85);
  g.fillCircle(cx - 27, cy - 1, 1);
  g.fillCircle(cx - 25, cy + 2, 0.9);
  g.fillCircle(cx - 26, cy + 5, 0.8);
  g.fillCircle(cx - 28, cy + 4, 0.7);
  g.fillStyle(0xfff4c0, 0.85);
  g.fillCircle(cx - 28, cy + 0, 0.5);
  g.fillCircle(cx - 26, cy + 7, 0.4);
  // Underside drip — fresh-fried oil bead
  g.fillStyle(FISH_DARK, 1);
  g.fillEllipse(cx - 26, cy + 12, 1.6, 2.4);
  g.fillCircle(cx - 26, cy + 10.6, 0.7);
  // Single shadow underneath the fish (sells weight)
  g.fillStyle(SHADOW_DEEP, 0.4);
  g.fillEllipse(cx - 26, cy + 13, 6, 1);
}

export function bakeBossGordon(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawBossGordonBody(g);
  g.generateTexture('boss_gordon', BOSS_GORDON_CANVAS_SIZE, BOSS_GORDON_CANVAS_SIZE);
  g.destroy();
}
