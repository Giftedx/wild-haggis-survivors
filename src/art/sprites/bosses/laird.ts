/**
 * `boss_laird` — Highland landowner boss: the gentry figure who'd
 * evict you for sport and shoot your haggis for fun. Anchor props:
 * deerstalker cap with twin peaks + pheasant feather, tweed jacket
 * over plus-fours + waistcoat + tie, shooting-stick walking cane,
 * side-by-side shotgun slung over the shoulder, monocle, walrus
 * moustache, hip flask peeking from the jacket. Distinct from the
 * `laird` player-variant's cheerful silhouette — this one is the
 * stuffy absentee-landlord incarnate.
 *
 * Design rewrite (raised from 8.4-floor to taxman-tier 9+):
 *  - Legs rebuilt as proper plus-four breeks (knee-buttoned, hosed
 *    calf), then green wellies with proper tread + sole + grime.
 *  - Pheasant tail-feather tucked into the deerstalker's tweed band
 *    (Highland sporting tradition).
 *  - Hip flask peeking out the breast pocket — silver scuffed,
 *    cap chain visible (the gin canon).
 *  - Pipe stub in mouth with a thin smoke wisp (replaces blank
 *    sneer; the sneer reads better as bored amusement).
 *  - Pocket-watch dangling fully (was just a chain arc) with a
 *    glint on the silver case.
 *  - Tweed pattern denser + a windowpane overlay (proper estate-
 *    tweed, not a flat brown coat).
 *  - Tonal palette anchored to tweed-brown / oxblood / brass / wellie-
 *    green — no random greys in the gun.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const BOSS_LAIRD_CANVAS_SIZE = 80;

// ── Palette ────────────────────────────────────────────────────────
const SHADOW_DEEP = 0x000000;
const TWEED_OUTLINE = 0x1a1208;
const TWEED_DARK = 0x3a2814;
const TWEED_MID = 0x6a4828;
const TWEED_HI = 0x8a6438;
const TWEED_FLECK = 0xb89058;
const TWEED_WINDOW = 0x4a3018;
const WAISTCOAT_DARK = 0x4a3418;
const WAISTCOAT_MID = 0x6a4a28;
const WAISTCOAT_HI = 0x8a6438;
const SHIRT_CREAM = 0xf2ecd8;
const TIE_DARK = 0x6a1414;
const TIE_MID = 0x9a2024;
const TIE_HI = 0xc83a44;
const SKIN_RIM = 0x6a3818;
const SKIN_BASE = 0xc88a5c;
const SKIN_HI = 0xeac094;
const VEIN_FLUSH = 0xc86a4a;
const HAIR_DARK = 0x3a2010;
const MOUSTACHE_GREY = 0x9a9a92;
const MOUSTACHE_HI = 0xd0d0c8;
const WELLY_OUTLINE = 0x0a1f08;
const WELLY_DARK = 0x1a3a14;
const WELLY_MID = 0x2a5a22;
const WELLY_HI = 0x4a8a3a;
const WELLY_GRIME = 0x4a3818;
const BRASS = 0xa07820;
const BRASS_HI = 0xeacc70;
const SILVER_DARK = 0x686878;
const SILVER_MID = 0xa8a8b8;
const SILVER_HI = 0xeaeaf2;
const FEATHER_DARK = 0x2a1808;
const FEATHER_MID = 0x6a4828;
const FEATHER_HI = 0xc89858;
const FEATHER_BAR = 0x1a1008;
const PIPE_BROWN = 0x4a2010;
const PIPE_RIM = 0x8a5028;
const SMOKE = 0xd8d4cc;
const GUN_BLACK = 0x080a14;
const GUN_STEEL = 0x4a4a52;
const GUN_HI = 0x9a9aa4;

export function drawBossLairdBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = BOSS_LAIRD_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 4 + (frame.breathY ?? 0);
  const lly = frame.leftLegY ?? 0;
  const rly = frame.rightLegY ?? 0;

  // ── Ground shadow ────────────────────────────────────────────────
  g.fillStyle(SHADOW_DEEP, 0.42);
  g.fillEllipse(cx, cy + 34, 32, 5);
  g.fillStyle(SHADOW_DEEP, 0.22);
  g.fillEllipse(cx, cy + 35, 40, 7);

  // ── Green wellies — proper rubber boots with tread + sole ───────
  g.fillStyle(WELLY_OUTLINE, 1);
  g.fillRect(cx - 12, cy + 24 + lly, 10, 12);
  g.fillRect(cx + 2, cy + 24 + rly, 10, 12);
  g.fillStyle(WELLY_DARK, 1);
  g.fillRect(cx - 11, cy + 25 + lly, 8, 11);
  g.fillRect(cx + 3, cy + 25 + rly, 8, 11);
  g.fillStyle(WELLY_MID, 1);
  g.fillRect(cx - 10, cy + 26 + lly, 6, 9);
  g.fillRect(cx + 4, cy + 26 + rly, 6, 9);
  g.fillStyle(WELLY_HI, 0.85);
  g.fillRect(cx - 10, cy + 26 + lly, 1, 8);
  g.fillRect(cx + 4, cy + 26 + rly, 1, 8);
  // Welly top fold rim (rolled-down edge)
  g.fillStyle(WELLY_OUTLINE, 1);
  g.fillRect(cx - 12, cy + 24 + lly, 10, 1.4);
  g.fillRect(cx + 2, cy + 24 + rly, 10, 1.4);
  g.fillStyle(WELLY_HI, 0.7);
  g.fillRect(cx - 11, cy + 24.4 + lly, 8, 0.4);
  g.fillRect(cx + 3, cy + 24.4 + rly, 8, 0.4);
  // Sole + heel
  g.fillStyle(0x080808, 1);
  g.fillRect(cx - 13, cy + 34 + lly, 12, 2);
  g.fillRect(cx + 1, cy + 34 + rly, 12, 2);
  // Tread ridges (small horizontal bands)
  g.fillStyle(0x2a2a2a, 1);
  for (let i = 0; i < 3; i++) {
    g.fillRect(cx - 13 + i * 4, cy + 35 + lly, 2, 0.4);
    g.fillRect(cx + 1 + i * 4, cy + 35 + rly, 2, 0.4);
  }
  // Mud grime around the welly base
  g.fillStyle(WELLY_GRIME, 0.6);
  g.fillEllipse(cx - 7, cy + 33 + lly, 8, 1.6);
  g.fillEllipse(cx + 7, cy + 33 + rly, 8, 1.6);

  // ── Plus-four breeks (knee-length tweed trousers) ───────────────
  g.fillStyle(TWEED_OUTLINE, 1);
  g.fillRect(cx - 14, cy + 16, 28, 11);
  g.fillStyle(TWEED_DARK, 1);
  g.fillRect(cx - 13, cy + 17, 26, 9);
  g.fillStyle(TWEED_MID, 1);
  g.fillRect(cx - 12, cy + 18, 24, 7);
  // Tweed herringbone flecks
  g.fillStyle(TWEED_FLECK, 0.85);
  for (const [fx, fy] of [[-10, 19], [-6, 22], [-2, 20], [3, 23], [7, 19], [10, 22], [-8, 24], [5, 21]] as const) {
    g.fillRect(cx + fx, cy + fy, 1, 1);
  }
  // Knee buttons (3 down each outer flank)
  g.fillStyle(BRASS, 1);
  for (let i = 0; i < 3; i++) {
    g.fillCircle(cx - 12, cy + 18 + i * 2.5, 0.6);
    g.fillCircle(cx + 12, cy + 18 + i * 2.5, 0.6);
    g.fillStyle(BRASS_HI, 1);
    g.fillCircle(cx - 12, cy + 18 + i * 2.5, 0.3);
    g.fillCircle(cx + 12, cy + 18 + i * 2.5, 0.3);
    g.fillStyle(BRASS, 1);
  }
  // Centre seam
  g.fillStyle(TWEED_OUTLINE, 0.85);
  g.fillRect(cx - 0.4, cy + 17, 0.8, 9);

  // ── Wool-hose calves (visible between breeks and welly tops) ────
  g.fillStyle(0x5a4828, 1);
  g.fillRect(cx - 11, cy + 23, 8, 2);
  g.fillRect(cx + 3, cy + 23, 8, 2);
  g.fillStyle(0x7a6438, 0.85);
  g.fillRect(cx - 11, cy + 23, 8, 0.6);
  g.fillRect(cx + 3, cy + 23, 8, 0.6);

  // ── Tweed jacket body (dominant silhouette piece) ───────────────
  g.fillStyle(TWEED_OUTLINE, 1);
  g.fillRect(cx - 18, cy - 4, 36, 26);
  g.fillStyle(TWEED_DARK, 1);
  g.fillRect(cx - 17, cy - 3, 34, 24);
  g.fillStyle(TWEED_MID, 1);
  g.fillRect(cx - 16, cy - 2, 32, 22);
  // Upper-shoulder rim catching estate light
  g.fillStyle(TWEED_HI, 0.65);
  g.fillRect(cx - 14, cy - 1, 8, 16);
  // Windowpane check (faint vertical + horizontal lines — proper estate tweed)
  g.fillStyle(TWEED_WINDOW, 0.6);
  g.fillRect(cx - 8, cy - 2, 0.6, 22);
  g.fillRect(cx + 6, cy - 2, 0.6, 22);
  g.fillRect(cx - 16, cy + 6, 32, 0.6);
  g.fillRect(cx - 16, cy + 14, 32, 0.6);
  // Herringbone flecks scattered
  g.fillStyle(TWEED_FLECK, 0.85);
  for (const [fx, fy] of [[-14, 2], [-10, 4], [-5, 2], [2, 5], [8, 3], [12, 7], [-8, 10], [5, 12], [-3, 15], [9, 16], [-12, 17], [11, 11]] as const) {
    g.fillRect(cx + fx, cy + fy, 1, 1);
  }
  // Lapels
  g.fillStyle(TWEED_OUTLINE, 1);
  g.fillTriangle(cx - 8, cy - 4, cx - 4, cy + 4, cx - 8, cy + 6);
  g.fillTriangle(cx + 8, cy - 4, cx + 4, cy + 4, cx + 8, cy + 6);
  g.fillStyle(TWEED_HI, 0.7);
  g.fillRect(cx - 7, cy - 3, 0.6, 5);
  g.fillRect(cx + 6.4, cy - 3, 0.6, 5);

  // ── Tweed waistcoat down the centre ─────────────────────────────
  g.fillStyle(WAISTCOAT_DARK, 1);
  g.fillRect(cx - 6, cy - 2, 12, 18);
  g.fillStyle(WAISTCOAT_MID, 1);
  g.fillRect(cx - 5, cy - 1, 10, 16);
  g.fillStyle(WAISTCOAT_HI, 0.7);
  g.fillRect(cx - 5, cy - 1, 10, 1);
  // Five gold buttons
  g.fillStyle(BRASS, 1);
  for (let i = 0; i < 5; i++) g.fillCircle(cx, cy + i * 3.4, 0.85);
  g.fillStyle(BRASS_HI, 1);
  for (let i = 0; i < 5; i++) g.fillCircle(cx - 0.3, cy + i * 3.4 - 0.3, 0.4);
  // Pocket-watch chain — proper sweep with dangling watch
  g.lineStyle(0.9, BRASS, 1);
  g.beginPath();
  g.moveTo(cx + 5, cy);
  g.arc(cx + 1, cy + 3, 5, -Math.PI * 0.3, Math.PI * 0.4, false);
  g.lineTo(cx - 4, cy + 8);
  g.strokePath();
  // Dangling watch case (silver)
  g.fillStyle(SILVER_DARK, 1);
  g.fillCircle(cx - 4, cy + 9, 1.8);
  g.fillStyle(SILVER_MID, 1);
  g.fillCircle(cx - 4, cy + 9, 1.4);
  g.fillStyle(SILVER_HI, 0.85);
  g.fillRect(cx - 5, cy + 8, 0.8, 0.8);

  // ── Hip flask peeking from the breast pocket ────────────────────
  g.fillStyle(SHADOW_DEEP, 1);
  g.fillRect(cx - 14, cy + 1, 4, 6);
  g.fillStyle(SILVER_DARK, 1);
  g.fillRect(cx - 13.5, cy + 1, 3, 6);
  g.fillStyle(SILVER_MID, 1);
  g.fillRect(cx - 13, cy + 1.4, 2, 5);
  g.fillStyle(SILVER_HI, 0.85);
  g.fillRect(cx - 13, cy + 1.4, 0.6, 5);
  // Cap with chain
  g.fillStyle(BRASS, 1);
  g.fillRect(cx - 13.5, cy + 0.4, 3, 1);
  g.fillStyle(BRASS_HI, 1);
  g.fillRect(cx - 13.5, cy + 0.4, 3, 0.4);
  // Engraved monogram dot
  g.fillStyle(0x0a0a0a, 0.6);
  g.fillRect(cx - 12, cy + 3, 1, 1);

  // ── Red paisley necktie ──────────────────────────────────────────
  g.fillStyle(TIE_DARK, 1);
  g.fillTriangle(cx - 2.5, cy - 4, cx + 2.5, cy - 4, cx, cy + 6);
  g.fillStyle(TIE_MID, 1);
  g.fillTriangle(cx - 2, cy - 4, cx + 2, cy - 4, cx, cy + 5);
  g.fillStyle(TIE_HI, 0.85);
  g.fillTriangle(cx - 1, cy - 3, cx + 1, cy - 3, cx, cy + 2);
  // Paisley dots (subtle)
  g.fillStyle(0xeac060, 0.85);
  g.fillCircle(cx, cy - 1, 0.5);
  g.fillCircle(cx, cy + 2, 0.4);
  // Tie pin (gold horizontal bar)
  g.fillStyle(BRASS_HI, 1);
  g.fillRect(cx - 3, cy - 2, 6, 0.6);
  g.fillStyle(BRASS, 1);
  g.fillRect(cx - 3, cy - 2 + 0.6, 6, 0.4);

  // ── White shirt collar points ────────────────────────────────────
  g.fillStyle(SHIRT_CREAM, 1);
  g.fillRect(cx - 4, cy - 6, 3, 3);
  g.fillRect(cx + 1, cy - 6, 3, 3);
  g.fillStyle(0xc8c0a8, 0.7);
  g.fillRect(cx - 4, cy - 6, 3, 0.6);
  g.fillRect(cx + 1, cy - 6, 3, 0.6);

  // ── Face — ruddy aristocratic complexion ────────────────────────
  g.fillStyle(SKIN_RIM, 1);
  g.fillCircle(cx, cy - 10, 11);
  g.fillStyle(SKIN_BASE, 1);
  g.fillCircle(cx, cy - 10, 10);
  g.fillStyle(SKIN_HI, 0.85);
  g.fillEllipse(cx - 2, cy - 13, 7, 3);
  // Broken veins on nose + cheeks (gin / whisky)
  g.fillStyle(VEIN_FLUSH, 0.6);
  g.fillCircle(cx - 4, cy - 8, 2);
  g.fillCircle(cx + 4, cy - 8, 2);
  g.fillStyle(0xc83a28, 0.5);
  g.fillRect(cx - 1, cy - 10, 2, 2);
  g.lineStyle(0.4, 0xa83820, 0.7);
  g.lineBetween(cx - 5, cy - 9, cx - 3, cy - 7);
  g.lineBetween(cx + 5, cy - 9, cx + 3, cy - 7);

  // ── Monocle (gold rim, glass tint) on right eye ─────────────────
  g.lineStyle(1.6, BRASS_HI, 1);
  g.strokeCircle(cx + 4, cy - 12, 4);
  g.fillStyle(0xaaddff, 0.25);
  g.fillCircle(cx + 4, cy - 12, 3.4);
  g.fillStyle(0xffffff, 0.85);
  g.fillRect(cx + 2.4, cy - 14, 1.2, 1.2);
  g.lineStyle(0.8, BRASS, 0.85);
  g.beginPath();
  g.moveTo(cx + 8, cy - 11);
  g.lineTo(cx + 12, cy - 5);
  g.strokePath();

  // ── Bored amused eyes ────────────────────────────────────────────
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 4, cy - 12, 2.2);
  g.fillCircle(cx + 4, cy - 12, 2.2);
  g.fillStyle(0x224488, 1);
  g.fillCircle(cx - 4, cy - 12, 1.1);
  g.fillCircle(cx + 4, cy - 12, 1.1);
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx - 4, cy - 12, 0.55);
  g.fillCircle(cx + 4, cy - 12, 0.55);
  g.fillStyle(0xffffff, 0.85);
  g.fillRect(cx - 4.5, cy - 12.5, 0.5, 0.5);
  g.fillRect(cx + 3.5, cy - 12.5, 0.5, 0.5);
  // Heavy contemptuous eyelids
  g.fillStyle(SKIN_BASE, 1);
  g.fillRect(cx - 7, cy - 14, 6, 1.8);
  g.fillRect(cx + 1, cy - 14, 6, 1.8);
  g.fillStyle(SKIN_RIM, 0.7);
  g.fillRect(cx - 7, cy - 14, 6, 0.5);
  g.fillRect(cx + 1, cy - 14, 6, 0.5);
  // Thick eyebrows
  g.fillStyle(HAIR_DARK, 1);
  g.fillRect(cx - 7, cy - 15, 6, 1.2);
  g.fillRect(cx + 1, cy - 15, 6, 1.2);

  // ── Walrus moustache ─────────────────────────────────────────────
  g.fillStyle(MOUSTACHE_GREY, 1);
  g.fillRect(cx - 8, cy - 7, 16, 3.4);
  g.fillStyle(MOUSTACHE_HI, 1);
  g.fillRect(cx - 7, cy - 7, 14, 2);
  g.fillStyle(0xeaeae2, 0.6);
  g.fillRect(cx - 5, cy - 7, 10, 1);
  // Drooping ends
  g.fillStyle(MOUSTACHE_GREY, 1);
  g.fillRect(cx - 8, cy - 5, 3, 3);
  g.fillRect(cx + 6, cy - 5, 3, 3);
  g.fillStyle(MOUSTACHE_HI, 0.7);
  g.fillRect(cx - 7.6, cy - 5, 1, 2);
  g.fillRect(cx + 6.4, cy - 5, 1, 2);

  // ── Pipe stub in mouth + smoke wisp ─────────────────────────────
  g.fillStyle(PIPE_BROWN, 1);
  g.fillRect(cx + 4, cy - 3, 6, 1.6);
  g.fillStyle(PIPE_RIM, 1);
  g.fillRect(cx + 4, cy - 3, 6, 0.6);
  // Bowl
  g.fillStyle(PIPE_BROWN, 1);
  g.fillRect(cx + 9, cy - 5, 2.5, 3);
  g.fillStyle(PIPE_RIM, 1);
  g.fillRect(cx + 9, cy - 5, 2.5, 0.7);
  // Glow inside the bowl
  g.fillStyle(0xea5a18, 1);
  g.fillCircle(cx + 10.2, cy - 4, 0.6);
  g.fillStyle(0xffd86a, 0.85);
  g.fillCircle(cx + 10.2, cy - 4.2, 0.3);
  // Smoke wisp
  g.fillStyle(SMOKE, 0.5);
  g.fillCircle(cx + 11, cy - 7, 1.2);
  g.fillCircle(cx + 13, cy - 10, 1);
  g.fillStyle(SMOKE, 0.7);
  g.fillCircle(cx + 11.2, cy - 7.2, 0.5);

  // ── DEERSTALKER CAP with pheasant feather ───────────────────────
  g.fillStyle(TWEED_OUTLINE, 1);
  g.fillEllipse(cx, cy - 21, 22, 7);
  g.fillStyle(TWEED_DARK, 1);
  g.fillEllipse(cx, cy - 22, 20, 5);
  g.fillStyle(TWEED_MID, 1);
  g.fillEllipse(cx, cy - 22, 18, 4);
  g.fillStyle(TWEED_HI, 0.7);
  g.fillEllipse(cx - 2, cy - 23, 8, 1.4);
  // Tweed flecks on the cap
  g.fillStyle(TWEED_FLECK, 0.85);
  for (const [fx, fy] of [[-6, -22], [0, -23], [5, -22], [-3, -21], [3, -21], [-8, -20], [7, -20]] as const) {
    g.fillRect(cx + fx, cy + fy, 1, 1);
  }
  // Front peak (visor)
  g.fillStyle(TWEED_OUTLINE, 1);
  g.fillRect(cx - 12, cy - 19, 14, 2);
  g.fillStyle(TWEED_MID, 1);
  g.fillRect(cx - 11, cy - 19, 12, 1);
  // Back peak
  g.fillStyle(TWEED_OUTLINE, 1);
  g.fillRect(cx - 2, cy - 19, 14, 2);
  g.fillStyle(TWEED_MID, 1);
  g.fillRect(cx - 1, cy - 19, 12, 1);
  // Ear flaps tied up — ribbons
  g.fillStyle(TWEED_DARK, 1);
  g.fillRect(cx - 4, cy - 26, 2, 3);
  g.fillRect(cx + 2, cy - 26, 2, 3);
  // Pheasant tail-feather tucked into the band — barred russet
  g.fillStyle(FEATHER_DARK, 1);
  g.fillRect(cx + 7, cy - 30, 1.4, 12);
  g.fillStyle(FEATHER_MID, 1);
  g.fillRect(cx + 7.2, cy - 30, 1, 12);
  g.fillStyle(FEATHER_HI, 0.85);
  g.fillRect(cx + 7.4, cy - 30, 0.5, 12);
  // Feather barring (dark cross-bands)
  g.fillStyle(FEATHER_BAR, 1);
  for (let i = 0; i < 5; i++) {
    g.fillRect(cx + 7, cy - 28 + i * 2, 1.4, 0.5);
  }
  // Feather tip splay
  g.fillStyle(FEATHER_MID, 1);
  g.fillTriangle(cx + 7, cy - 30, cx + 9, cy - 32, cx + 8.5, cy - 28);

  // ── Signet ring on pudgy right hand ─────────────────────────────
  g.fillStyle(BRASS, 1);
  g.fillCircle(cx + 18, cy + 10, 1.8);
  g.fillStyle(BRASS_HI, 1);
  g.fillCircle(cx + 18, cy + 10, 1);
  g.fillStyle(0x1a0a10, 1);
  g.fillRect(cx + 17.6, cy + 9.6, 0.8, 0.8);

  // ── Shooting-stick walking cane on the LEFT ─────────────────────
  g.fillStyle(0x3a1a08, 1);
  g.fillRect(cx - 24, cy - 4, 2.4, 26);
  g.fillStyle(0x6a3818, 1);
  g.fillRect(cx - 23.5, cy - 4, 1.4, 26);
  g.fillStyle(0x8a5028, 0.7);
  g.fillRect(cx - 23.2, cy - 4, 0.4, 26);
  // Silver handle — curved top
  g.fillStyle(SILVER_DARK, 1);
  g.fillRect(cx - 26, cy - 5, 5, 2);
  g.fillRect(cx - 26, cy - 3, 2, 2);
  g.fillStyle(SILVER_MID, 1);
  g.fillRect(cx - 26, cy - 5, 5, 1);
  g.fillStyle(SILVER_HI, 0.85);
  g.fillRect(cx - 25, cy - 5, 3, 0.5);
  // Stick base (rubber ferrule)
  g.fillStyle(0x080808, 1);
  g.fillRect(cx - 25, cy + 21, 4, 2);

  // ── Side-by-side shotgun slung over the RIGHT shoulder ──────────
  // Stock — proper walnut grain
  g.fillStyle(0x2a1208, 1);
  g.fillRect(cx + 16, cy + 2, 6, 11);
  g.fillStyle(0x5a2c14, 1);
  g.fillRect(cx + 16.5, cy + 2.5, 5, 10);
  g.fillStyle(0x7a3c1c, 0.85);
  g.fillRect(cx + 17, cy + 3, 3, 8);
  // Brass butt-plate
  g.fillStyle(BRASS, 1);
  g.fillRect(cx + 16, cy + 12, 6, 1.4);
  g.fillStyle(BRASS_HI, 1);
  g.fillRect(cx + 16, cy + 12, 6, 0.5);
  // Chequered grip pattern (small diagonal hatch)
  g.fillStyle(0x2a1208, 0.6);
  for (let i = 0; i < 3; i++) {
    g.fillRect(cx + 17.4 + i * 1.4, cy + 6, 0.5, 5);
  }
  // Gun action / receiver — engraved (subtle scrollwork hint)
  g.fillStyle(GUN_BLACK, 1);
  g.fillRect(cx + 17, cy - 3, 7, 5);
  g.fillStyle(GUN_STEEL, 1);
  g.fillRect(cx + 17.5, cy - 2.5, 6, 4);
  g.fillStyle(GUN_HI, 0.85);
  g.fillRect(cx + 17.5, cy - 2.5, 6, 0.6);
  // Engraving line
  g.fillStyle(0xb8b8c0, 0.7);
  g.fillRect(cx + 18, cy - 1, 5, 0.4);
  g.fillRect(cx + 18, cy + 0.4, 5, 0.4);
  // Side-by-side barrels — TWO clearly-separated tubes
  g.fillStyle(GUN_BLACK, 1);
  g.fillRect(cx + 19, cy - 18, 3.4, 16);
  g.fillRect(cx + 22.6, cy - 18, 3.4, 16);
  g.fillStyle(GUN_STEEL, 1);
  g.fillRect(cx + 19.4, cy - 17.5, 2.6, 15);
  g.fillRect(cx + 23, cy - 17.5, 2.6, 15);
  g.fillStyle(GUN_HI, 0.85);
  g.fillRect(cx + 19.4, cy - 17.5, 0.6, 15);
  g.fillRect(cx + 23, cy - 17.5, 0.6, 15);
  // Barrel-tip rim (proper chequered muzzle)
  g.fillStyle(SHADOW_DEEP, 1);
  g.fillRect(cx + 19, cy - 18, 3.4, 1);
  g.fillRect(cx + 22.6, cy - 18, 3.4, 1);
  g.fillStyle(GUN_HI, 0.85);
  g.fillRect(cx + 19, cy - 18.4, 3.4, 0.4);
  g.fillRect(cx + 22.6, cy - 18.4, 3.4, 0.4);
  // Sling strap from action down to stock
  g.fillStyle(0x4a3014, 1);
  g.fillRect(cx + 14, cy - 1, 1.4, 14);
  g.fillStyle(0x6a4828, 0.85);
  g.fillRect(cx + 14, cy - 1, 0.5, 14);
}

export function bakeBossLaird(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawBossLairdBody(g);
  g.generateTexture('boss_laird', BOSS_LAIRD_CANVAS_SIZE, BOSS_LAIRD_CANVAS_SIZE);
  g.destroy();
}
