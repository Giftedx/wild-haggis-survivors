/**
 * `boss_nicnevin` — N1 Mythos Tier-2 boss #2: Fey register (Unseelie
 * dark edge), Queen of the Scottish witches and the Wild Hunt
 * (`SCOTTISH_RESEARCH.md:126`, `SCOTTISH_RESEARCH_DEEP.md` Part 22).
 *
 * Design notes per `2026-04-28-boss-tier-2-mythos-design.md` §4:
 *  - Tall, slow, deliberate. The danger is orchestration (her
 *    `unseelie_fiddler` minion ring + Wild Hunt gem-pull proc), not
 *    direct contact — so the silhouette reads as a *presiding court
 *    queen*, not a charging brute.
 *  - Shadow-form body with violet rim-light. No visible face under the
 *    crown — a void where features should be. The Unseelie are not
 *    people, even when they wear the shape of one.
 *  - Iron-thistle crown — court regalia rendered cold and barbed.
 *  - Long heather-purple gown that bleeds into smoke at the hem; she
 *    does not stand, she *settles*.
 *  - Outstretched fingers gathering an XP gem (the Wild Hunt mechanic
 *    written into the silhouette — it's what she's *for*).
 *  - Faint white horse-shadow at her shoulder — the cosmetic dismount
 *    sprite is deferred, but the suggestion stays so the folkloric tag
 *    reads at first glance.
 *
 * Palette anchored to ART_STYLE_BIBLE.md:65-73 Fey hex set with the
 * dark-edge variant called out in spec §4 ("dominant iridescent
 * purple-black"). BaseTint is applied externally as `0x9030c0` per
 * spec — the sprite itself uses ungraded violets so the tinting reads.
 */

import * as Phaser from 'phaser';

export const BOSS_NICNEVIN_CANVAS_SIZE = 80;

// ── Palette (Fey, Unseelie dark edge) ─────────────────────────────────
const SHADOW_DEEP = 0x000000;
const VOID_BLACK = 0x05030a;
const ROBE_OUTLINE = 0x08040e;
const ROBE_DARK = 0x180a28;
const ROBE_MID = 0x2a1448;
const ROBE_HI = 0x4a2870;
const ROBE_GLOW = 0x9030c0;
const SHADOW_FORM = 0x14081e;
const VIOLET_RIM = 0xb060e8;
const VIOLET_HI = 0xe4a8ff;
const HEATHER_BLEED = 0x7028a0;
const SMOKE_HEM = 0x2a103a;
const CROWN_IRON = 0x1a1018;
const CROWN_RIM = 0x4a3848;
const CROWN_HI = 0x8a708a;
const THISTLE_PURPLE = 0x803090;
const THISTLE_HI = 0xc488d4;
const HORSE_GHOST = 0xe8e0f4;
const HORSE_GHOST_HI = 0xfffaff;
const GEM_GREEN = 0x4afac8;
const GEM_GLOW = 0xa0ffe4;
const HAND_PALE = 0x705a78;

export function drawBossNicnevin(g: Phaser.GameObjects.Graphics): void {
  const s = BOSS_NICNEVIN_CANVAS_SIZE;
  const cx = s / 2;
  const cy = s / 2 + 6;

  // ── Shadow halo (rendered first; she casts a wider footprint than
  // her body, suggesting the host of unquiet spirits she leads) ─────
  g.fillStyle(ROBE_GLOW, 0.18);
  g.fillEllipse(cx, cy + 2, 64, 38);
  g.fillStyle(HEATHER_BLEED, 0.22);
  g.fillEllipse(cx, cy + 4, 50, 30);

  // ── Ground shadow (deeper than usual — the moor recoils) ──────────
  g.fillStyle(SHADOW_DEEP, 0.55);
  g.fillEllipse(cx, cy + 33, 30, 5);
  g.fillStyle(SHADOW_DEEP, 0.28);
  g.fillEllipse(cx, cy + 35, 38, 7);

  // ── Faint white horse-shadow at her right shoulder (the cosmetic
  // dismount sprite is deferred, but the silhouette suggestion stays
  // so the folkloric tag reads — Nicnevin always rides a white horse) ─
  g.fillStyle(HORSE_GHOST, 0.18);
  g.fillEllipse(cx - 22, cy - 6, 14, 9);
  g.fillEllipse(cx - 28, cy - 10, 6, 10);  // neck
  g.fillEllipse(cx - 30, cy - 16, 4, 5);   // head
  g.fillStyle(HORSE_GHOST_HI, 0.35);
  g.fillCircle(cx - 30, cy - 16, 1.6);     // horse eye-spot
  // Mane wisps trailing into smoke
  g.lineStyle(0.6, HORSE_GHOST, 0.30);
  g.lineBetween(cx - 26, cy - 14, cx - 32, cy - 18);
  g.lineBetween(cx - 25, cy - 11, cx - 32, cy - 14);

  // ── Smoke hem (gown bleeds into ground) ───────────────────────────
  g.fillStyle(SMOKE_HEM, 0.65);
  g.fillEllipse(cx, cy + 28, 32, 8);
  g.fillStyle(ROBE_DARK, 0.85);
  g.fillEllipse(cx, cy + 26, 28, 6);

  // ── Gown body (long triangular silhouette — court formality) ──────
  g.fillStyle(ROBE_OUTLINE, 1);
  g.fillTriangle(cx - 18, cy + 26, cx + 18, cy + 26, cx, cy - 4);
  g.fillStyle(ROBE_DARK, 1);
  g.fillTriangle(cx - 16, cy + 25, cx + 16, cy + 25, cx, cy - 3);
  g.fillStyle(ROBE_MID, 1);
  g.fillTriangle(cx - 13, cy + 22, cx + 13, cy + 22, cx, cy - 1);
  // Centre-front lighter panel (overlaid bodice / brocade ghost)
  g.fillStyle(ROBE_HI, 0.45);
  g.fillTriangle(cx - 5, cy + 18, cx + 5, cy + 18, cx, cy + 2);
  // Heather-bleed accent — a vertical shimmer on the gown
  g.fillStyle(HEATHER_BLEED, 0.3);
  g.fillRect(cx - 1, cy, 2, 22);

  // ── Iridescent rim-light along gown edge (the Fey-dark register
  // signature — it does not warm anything, but it *glows*) ───────────
  g.fillStyle(VIOLET_RIM, 0.5);
  g.fillTriangle(cx - 18, cy + 26, cx - 16, cy + 26, cx - 1, cy - 3);
  g.fillStyle(VIOLET_RIM, 0.5);
  g.fillTriangle(cx + 18, cy + 26, cx + 16, cy + 26, cx + 1, cy - 3);
  // Brighter rim glints (sparser, top of robe)
  g.fillStyle(VIOLET_HI, 0.4);
  g.fillTriangle(cx - 6, cy - 3, cx - 4, cy - 3, cx - 1, cy + 6);
  g.fillTriangle(cx + 6, cy - 3, cx + 4, cy - 3, cx + 1, cy + 6);

  // ── Hem trim — heavier dark band where smoke meets gown ───────────
  g.fillStyle(VOID_BLACK, 1);
  g.fillRect(cx - 15, cy + 22, 30, 1.4);
  g.fillStyle(VIOLET_RIM, 0.55);
  g.fillRect(cx - 13, cy + 22, 26, 0.4);

  // ── Shoulders / clasped sleeves (gathered, no warmth) ─────────────
  g.fillStyle(ROBE_OUTLINE, 1);
  g.fillEllipse(cx - 9, cy - 3, 6, 7);
  g.fillEllipse(cx + 9, cy - 3, 6, 7);
  g.fillStyle(ROBE_DARK, 1);
  g.fillEllipse(cx - 9, cy - 3, 5, 6);
  g.fillEllipse(cx + 9, cy - 3, 5, 6);
  g.fillStyle(VIOLET_RIM, 0.4);
  g.fillEllipse(cx - 10, cy - 4, 2, 1.6);
  g.fillEllipse(cx + 10, cy - 4, 2, 1.6);

  // ── Outstretched right hand (palm up, gathering — encodes the
  // Wild Hunt gem-pull proc into the silhouette) ─────────────────────
  g.fillStyle(ROBE_OUTLINE, 1);
  g.fillRect(cx + 12, cy - 3, 4, 14);
  g.fillStyle(ROBE_DARK, 1);
  g.fillRect(cx + 12.4, cy - 3, 3.2, 13);
  // Hand at the cuff — pale, drained, not human
  g.fillStyle(HAND_PALE, 1);
  g.fillCircle(cx + 14, cy + 11, 2.4);
  g.fillStyle(VIOLET_RIM, 0.45);
  g.fillCircle(cx + 14, cy + 11, 1.4);
  // Five fingers splayed (small)
  g.fillStyle(HAND_PALE, 1);
  g.fillRect(cx + 12, cy + 12, 1, 2);
  g.fillRect(cx + 14, cy + 13, 1, 2);
  g.fillRect(cx + 16, cy + 12, 1, 2);
  g.fillRect(cx + 13, cy + 13, 1, 2);
  g.fillRect(cx + 15, cy + 13, 1, 2);

  // ── Floating XP-gem captured in the gathering hand ────────────────
  g.fillStyle(GEM_GLOW, 0.6);
  g.fillCircle(cx + 14, cy + 7, 3.4);
  g.fillStyle(GEM_GREEN, 1);
  g.fillTriangle(cx + 14, cy + 4, cx + 16, cy + 8, cx + 12, cy + 8);
  g.fillTriangle(cx + 14, cy + 10, cx + 16, cy + 8, cx + 12, cy + 8);
  g.fillStyle(GEM_GLOW, 0.85);
  g.fillRect(cx + 13.5, cy + 6, 1, 2);

  // ── Left hand tucked into gown (sleeve cuff) ──────────────────────
  g.fillStyle(ROBE_OUTLINE, 1);
  g.fillRect(cx - 13, cy + 2, 4, 8);
  g.fillStyle(ROBE_DARK, 1);
  g.fillRect(cx - 12.6, cy + 2, 3.2, 7.5);
  g.fillStyle(VIOLET_RIM, 0.35);
  g.fillRect(cx - 13, cy + 2, 0.6, 8);

  // ── Head (void shadow under the crown — no face) ──────────────────
  g.fillStyle(VOID_BLACK, 1);
  g.fillCircle(cx, cy - 12, 8);
  g.fillStyle(SHADOW_FORM, 1);
  g.fillCircle(cx, cy - 12, 7);
  // Two faint eye-glows in the void — barely there, the watching
  g.fillStyle(VIOLET_RIM, 0.85);
  g.fillCircle(cx - 2.6, cy - 13, 0.7);
  g.fillCircle(cx + 2.6, cy - 13, 0.7);
  g.fillStyle(VIOLET_HI, 0.95);
  g.fillCircle(cx - 2.6, cy - 13, 0.35);
  g.fillCircle(cx + 2.6, cy - 13, 0.35);
  // Hair-shadow framing the void — long, falling past shoulders
  g.fillStyle(VOID_BLACK, 1);
  g.fillTriangle(cx - 8, cy - 11, cx - 11, cy + 4, cx - 4, cy + 0);
  g.fillTriangle(cx + 8, cy - 11, cx + 11, cy + 4, cx + 4, cy + 0);
  g.fillStyle(SHADOW_FORM, 1);
  g.fillTriangle(cx - 7, cy - 10, cx - 10, cy + 3, cx - 4, cy - 1);
  g.fillTriangle(cx + 7, cy - 10, cx + 10, cy + 3, cx + 4, cy - 1);
  // Hair shimmer — heather-purple strand catches the rim-light
  g.lineStyle(0.7, HEATHER_BLEED, 0.55);
  g.lineBetween(cx - 8, cy - 8, cx - 10, cy + 0);
  g.lineBetween(cx + 8, cy - 8, cx + 10, cy + 0);

  // ── Iron-thistle crown ────────────────────────────────────────────
  // Base band — cold metal, dark
  g.fillStyle(CROWN_IRON, 1);
  g.fillRect(cx - 8, cy - 20, 16, 4);
  g.fillStyle(CROWN_RIM, 1);
  g.fillRect(cx - 7, cy - 19, 14, 2.5);
  g.fillStyle(CROWN_HI, 0.65);
  g.fillRect(cx - 7, cy - 19, 14, 0.6);

  // Five thistle-prong spires (jagged, asymmetric — no fairy-tale
  // tidiness; this crown is *thorned*).
  g.fillStyle(CROWN_IRON, 1);
  g.fillTriangle(cx - 8, cy - 20, cx - 6, cy - 26, cx - 4, cy - 20);
  g.fillTriangle(cx - 4, cy - 20, cx - 1, cy - 28, cx + 1, cy - 20);
  g.fillTriangle(cx + 1, cy - 20, cx + 4, cy - 30, cx + 6, cy - 20);
  g.fillTriangle(cx + 4, cy - 20, cx + 7, cy - 27, cx + 9, cy - 20);
  g.fillTriangle(cx - 9, cy - 20, cx - 11, cy - 25, cx - 7, cy - 20);
  // Spire shadows
  g.fillStyle(CROWN_RIM, 0.85);
  g.fillTriangle(cx - 7, cy - 20, cx - 6, cy - 25, cx - 5, cy - 20);
  g.fillTriangle(cx - 2, cy - 20, cx - 1, cy - 27, cx, cy - 20);
  g.fillTriangle(cx + 3, cy - 20, cx + 4, cy - 28, cx + 5, cy - 20);

  // Thistle-bloom finials — three of the spires bear a tiny
  // glowing thistle head, the only saturated colour on the boss.
  g.fillStyle(THISTLE_PURPLE, 1);
  g.fillCircle(cx - 1, cy - 28, 1.4);
  g.fillCircle(cx + 4, cy - 30, 1.6);
  g.fillCircle(cx - 6, cy - 26, 1.2);
  g.fillStyle(THISTLE_HI, 0.85);
  g.fillCircle(cx - 1, cy - 28.4, 0.55);
  g.fillCircle(cx + 4, cy - 30.4, 0.7);
  g.fillCircle(cx - 6, cy - 26.4, 0.5);
  // Tiny thistle bristles (a couple of pixels each)
  g.lineStyle(0.5, THISTLE_HI, 0.7);
  g.lineBetween(cx - 1, cy - 29.2, cx - 0.5, cy - 30);
  g.lineBetween(cx - 1, cy - 29.2, cx - 1.5, cy - 30);
  g.lineBetween(cx + 4, cy - 31.2, cx + 4.5, cy - 32);
  g.lineBetween(cx + 4, cy - 31.2, cx + 3.5, cy - 32);
  g.lineBetween(cx - 6, cy - 27.2, cx - 5.5, cy - 28);

  // ── Final dorsal violet glint along the crown band ────────────────
  g.fillStyle(VIOLET_HI, 0.45);
  g.fillEllipse(cx, cy - 19, 8, 0.8);

  // ── A single Unseelie spark trailing from the gem (Wild Hunt
  // pre-tell) ───────────────────────────────────────────────────────
  g.fillStyle(GEM_GLOW, 0.8);
  g.fillCircle(cx + 18, cy + 4, 0.8);
  g.fillStyle(GEM_GLOW, 0.5);
  g.fillCircle(cx + 21, cy + 1, 0.5);
}

export function bakeBossNicnevin(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawBossNicnevin(g);
  g.generateTexture('boss_nicnevin', BOSS_NICNEVIN_CANVAS_SIZE, BOSS_NICNEVIN_CANVAS_SIZE);
  g.destroy();
}
