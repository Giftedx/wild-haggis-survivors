/**
 * `boss_taxman` — final boss: HMRC reaper. Pinstripe cloak, hooded
 * skull, wire spectacles trapping a tight red glow, scythe in the right
 * hand, P45 scroll clutched in the left, calculator dangling on a
 * cord. Inevitable end-state of any Scottish boss ladder.
 *
 * Design rewrite (raised from 6 → target 9):
 *  - Eye glow constrained INSIDE the lens — no halo bleeding past the
 *    skull silhouette.
 *  - Hood interior pulled UP and narrower so the skull dome reads as
 *    THE silhouette anchor (not a slab of black).
 *  - Scythe cutting edge gets a dark hairline so the blade has weight.
 *  - Teeth standardised to 1×2 with two 1×3 fangs — even rhythm grin.
 *  - Calc screen dropped to a sickly bureaucratic green (less neon
 *    "power", more office-strip-light).
 *  - Added: P45 scroll with red stamp in left hand, ledger ribbons
 *    on shoulders (civil-service rank), ink-bleed drips on cloak hem,
 *    subtle ribcage shadow through pinstripes (skeleton inside the
 *    suit), briefcase contact shadow at the feet.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const BOSS_TAXMAN_CANVAS_SIZE = 80;

// ── Palette ────────────────────────────────────────────────────────
const CLOAK_OUTLINE = 0x000000;
const CLOAK_DARK = 0x070708;
const CLOAK_MID = 0x101014;
const CLOAK_HI = 0x1a1a22;
const PINSTRIPE = 0x2a2a36;
const TIE_DARK = 0x6a0a16;
const TIE_MID = 0xa01a26;
const TIE_HI = 0xc83040;
const SKULL_RIM = 0x5a5a4a;
const SKULL_BASE = 0xc8c8b6;
const SKULL_HI = 0xeae8d6;
const SKULL_HOLLOW = 0x3a3628;
const EYE_DEEP = 0x180000;
const EYE_GLOW = 0xff2a08;
const EYE_HOT = 0xffa080;
const SPEC_RIM = 0xa8a8b8;
const TEETH = 0xefe7c8;
const TEETH_SHADOW = 0x9a8c70;
const SCYTHE_HANDLE_DARK = 0x1a0c04;
const SCYTHE_HANDLE_MID = 0x3a2010;
const SCYTHE_HANDLE_HI = 0x5a3818;
const BLADE_OUTLINE = 0x101218;
const BLADE_DARK = 0x4a4e58;
const BLADE_MID = 0x9a9eaa;
const BLADE_HI = 0xeaecf2;
const PAPER_OUTLINE = 0x6a5a3a;
const PAPER_BASE = 0xeae0c0;
const PAPER_HI = 0xf8f0d8;
const STAMP_RED = 0xb02022;
const INK_DARK = 0x2a1810;
const CALC_BODY = 0x080808;
const CALC_PANEL = 0x1c1c20;
const CALC_SCREEN = 0x3a6a3a;
const CALC_SCREEN_HI = 0x70a070;
const CALC_KEY = 0x60606a;
const RIBBON_GOLD = 0xa88828;
const RIBBON_GOLD_HI = 0xeacc70;

export function drawBossTaxmanBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = BOSS_TAXMAN_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 4 + (frame.breathY ?? 0);

  // ── Briefcase contact shadow at feet ─────────────────────────────
  // A flat rectangular shadow (not a soft ellipse) sells "carrying
  // something heavy on the floor" without drawing the case itself.
  g.fillStyle(0x000000, 0.4);
  g.fillRect(cx - 22, cy + 30, 44, 4);
  g.fillStyle(0x000000, 0.22);
  g.fillRect(cx - 26, cy + 32, 52, 3);

  // ── Cloak silhouette ─────────────────────────────────────────────
  // Dark outer rim, inner cloak body, tertiary highlight on the upper
  // left-shoulder catching weak office strip-light.
  g.fillStyle(CLOAK_OUTLINE, 1);
  g.fillCircle(cx, cy + 2, 33);
  g.fillStyle(CLOAK_DARK, 1);
  g.fillCircle(cx, cy + 2, 31);
  g.fillStyle(CLOAK_MID, 1);
  g.fillCircle(cx - 2, cy, 28);
  // Shoulder catch-light — a faint upper-left arc.
  g.fillStyle(CLOAK_HI, 0.55);
  g.fillEllipse(cx - 8, cy - 14, 18, 8);

  // ── Pinstripes ───────────────────────────────────────────────────
  // Bespoke reaper: vertical pin-fine stripes. Density tuned so they
  // read as "suit fabric" not "prison bars".
  g.fillStyle(PINSTRIPE, 0.7);
  for (let i = -3; i <= 3; i++) {
    const x = cx + i * 6;
    g.fillRect(x, cy - 4, 1, 32);
  }
  // Two deeper fold-shadows to break the stripe rhythm.
  g.fillStyle(CLOAK_OUTLINE, 1);
  g.fillRect(cx - 13, cy + 3, 2, 26);
  g.fillRect(cx + 11, cy + 3, 2, 26);

  // ── Subtle ribcage shadow through the cloak ──────────────────────
  // Two faint dark arcs hint at a skeleton inside the suit. Just
  // enough to register subliminally; not a literal x-ray.
  g.fillStyle(0x050505, 0.55);
  g.fillEllipse(cx - 6, cy + 8, 4, 1.4);
  g.fillEllipse(cx + 6, cy + 8, 4, 1.4);
  g.fillEllipse(cx - 6, cy + 12, 4, 1.4);
  g.fillEllipse(cx + 6, cy + 12, 4, 1.4);
  g.fillEllipse(cx - 5, cy + 16, 3.4, 1.2);
  g.fillEllipse(cx + 5, cy + 16, 3.4, 1.2);

  // ── Ink-bleed at the hem ─────────────────────────────────────────
  // Three drops bleed off the cloak edge — paperwork that wouldn't
  // dry. Blood-red, not black, to tie back to the necktie.
  g.fillStyle(STAMP_RED, 0.85);
  g.fillCircle(cx - 16, cy + 26, 1.2);
  g.fillCircle(cx + 12, cy + 28, 1.4);
  g.fillCircle(cx - 4, cy + 30, 1);
  g.fillStyle(STAMP_RED, 0.5);
  g.fillRect(cx - 16.4, cy + 26, 0.8, 4);
  g.fillRect(cx + 11.6, cy + 28, 0.8, 4);

  // ── Ledger ribbons (civil-service rank tabs on the shoulders) ───
  // Two diagonal gold ribbons across each shoulder. Gives him the
  // air of a permanent-secretary at his own funeral.
  for (const sx of [-1, 1] as const) {
    g.fillStyle(RIBBON_GOLD, 1);
    g.fillRect(cx + sx * 14 - 2, cy - 14, 4, 8);
    g.fillStyle(RIBBON_GOLD_HI, 1);
    g.fillRect(cx + sx * 14 - 1, cy - 14, 1.2, 8);
    g.fillStyle(CLOAK_OUTLINE, 1);
    g.fillRect(cx + sx * 14 - 2, cy - 14, 4, 1);
  }

  // ── Necktie ──────────────────────────────────────────────────────
  // Small red knot under the collar. The only pop of warm colour on
  // the body — leads the eye up to the face.
  g.fillStyle(TIE_DARK, 1);
  g.fillTriangle(cx - 3, cy - 6, cx + 3, cy - 6, cx, cy + 6);
  g.fillStyle(TIE_MID, 1);
  g.fillTriangle(cx - 2, cy - 5, cx + 2, cy - 5, cx, cy + 4);
  g.fillStyle(TIE_HI, 0.85);
  g.fillTriangle(cx - 1, cy - 4, cx + 1, cy - 4, cx, cy + 1);
  // Knot.
  g.fillStyle(TIE_DARK, 1);
  g.fillRect(cx - 2.5, cy - 7, 5, 2);
  g.fillStyle(TIE_HI, 0.7);
  g.fillRect(cx - 2, cy - 6.8, 4, 0.6);

  // ── Hood (deep, narrow — points up into a peak so the skull
  //    dominates instead of being lost in a slab of black) ──────
  g.fillStyle(CLOAK_OUTLINE, 1);
  g.fillTriangle(cx - 17, cy - 7, cx, cy - 36, cx + 17, cy - 7);
  g.fillStyle(CLOAK_DARK, 1);
  g.fillTriangle(cx - 15, cy - 7, cx, cy - 32, cx + 15, cy - 7);
  // Inner cavity — narrower and HIGHER than before so the skull
  // peeks through cleanly. (Old: ellipse 20×16 at cy-10 muddied
  // the face. New: 16×14 at cy-12.)
  g.fillStyle(CLOAK_OUTLINE, 1);
  g.fillEllipse(cx, cy - 12, 16, 14);

  // ── Skull face ───────────────────────────────────────────────────
  // Rim shadow + base bone + warm highlight on the dome.
  g.fillStyle(SKULL_RIM, 1);
  g.fillCircle(cx, cy - 7, 13);
  g.fillStyle(SKULL_BASE, 1);
  g.fillCircle(cx, cy - 7, 12);
  g.fillStyle(SKULL_HI, 0.85);
  g.fillEllipse(cx - 2, cy - 11, 9, 4);
  // Cheekbone hollows — sunken pits beneath the eyes.
  g.fillStyle(SKULL_HOLLOW, 0.55);
  g.fillEllipse(cx - 6, cy - 4, 4, 2.2);
  g.fillEllipse(cx + 6, cy - 4, 4, 2.2);
  // Jaw underline — separates jaw plate from the skull dome.
  g.fillStyle(SKULL_HOLLOW, 0.7);
  g.fillRect(cx - 7, cy + 1, 14, 0.6);
  // Temple sutures — two faint zig-zag lines.
  g.fillStyle(SKULL_HOLLOW, 0.4);
  g.fillRect(cx - 8, cy - 12, 2, 0.5);
  g.fillRect(cx - 6.5, cy - 11.4, 1.5, 0.5);
  g.fillRect(cx + 6, cy - 12, 2, 0.5);
  g.fillRect(cx + 4.5, cy - 11.4, 1.5, 0.5);

  // ── Wire spectacles ──────────────────────────────────────────────
  // Frame strokes. Slightly thicker than before (1.0 vs 0.8) so the
  // metal reads against the bone.
  g.lineStyle(1.0, SPEC_RIM, 1);
  g.strokeCircle(cx - 5, cy - 8, 3.6);
  g.strokeCircle(cx + 5, cy - 8, 3.6);
  g.lineStyle(0.9, SPEC_RIM, 1);
  g.lineBetween(cx - 1.4, cy - 8, cx + 1.4, cy - 8);
  // Temple arms hooking back into the hood.
  g.lineBetween(cx - 8.4, cy - 8, cx - 13, cy - 6);
  g.lineBetween(cx + 8.4, cy - 8, cx + 13, cy - 6);
  // Wire glints.
  g.fillStyle(0xffffff, 0.55);
  g.fillRect(cx - 7.2, cy - 9.6, 0.6, 0.6);
  g.fillRect(cx + 6.6, cy - 9.6, 0.6, 0.6);

  // ── Eyes (CONSTRAINED inside the lens — no halo bleed) ──────────
  // Lens fill stays dark; only the central red dot lights up. Outer
  // glow capped at radius 3.0 @ 0.18 alpha so it can't spill past
  // the skull silhouette.
  for (const sx of [-1, 1] as const) {
    const ex = cx + sx * 5;
    const ey = cy - 8;
    g.fillStyle(EYE_DEEP, 1);
    g.fillCircle(ex, ey, 2.8);
    // Inner red pupil.
    g.fillStyle(EYE_GLOW, 1);
    g.fillCircle(ex, ey, 1.6);
    // Hot core pinprick.
    g.fillStyle(EYE_HOT, 1);
    g.fillCircle(ex, ey, 0.7);
    // Tight glow — only just bigger than the lens, alpha kept low so
    // it reads as "lens light" not "eye-beam".
    g.fillStyle(EYE_GLOW, 0.18);
    g.fillCircle(ex, ey, 3.0);
  }

  // ── Nose cavity ─────────────────────────────────────────────────
  g.fillStyle(SKULL_HOLLOW, 0.95);
  g.fillTriangle(cx - 1.2, cy - 3, cx + 1.2, cy - 3, cx, cy + 1);
  g.fillStyle(EYE_DEEP, 0.9);
  g.fillTriangle(cx - 0.6, cy - 2, cx + 0.6, cy - 2, cx, cy + 0.4);

  // ── Skull grin ──────────────────────────────────────────────────
  // Black mouth cavity, then teeth standardised: most are 1×2,
  // two 1×3 fangs flank the centre.
  g.fillStyle(EYE_DEEP, 1);
  g.fillRect(cx - 7, cy + 2, 14, 6);
  // Lip shadows top and bottom of the cavity.
  g.fillStyle(TEETH_SHADOW, 1);
  g.fillRect(cx - 7, cy + 2, 14, 0.6);
  g.fillRect(cx - 7, cy + 7.4, 14, 0.6);
  // Upper teeth (left to right).
  g.fillStyle(TEETH, 1);
  const upperX = [-6, -4, -2, 0, 2, 4, 6] as const;
  upperX.forEach((dx, idx) => {
    const isFang = idx === 1 || idx === 5;
    g.fillRect(cx + dx, cy + 2.6, 1, isFang ? 3 : 2);
  });
  // Lower teeth — staggered, slightly smaller.
  g.fillStyle(TEETH, 1);
  const lowerX = [-5, -3, -1, 1, 3, 5] as const;
  lowerX.forEach((dx) => {
    g.fillRect(cx + dx, cy + 5, 1, 2);
  });
  // Tooth-shadow lines so the teeth read as separate, not a wall.
  g.fillStyle(TEETH_SHADOW, 0.85);
  upperX.forEach((dx) => g.fillRect(cx + dx + 1, cy + 2.6, 0.4, 2));
  lowerX.forEach((dx) => g.fillRect(cx + dx + 1, cy + 5, 0.4, 2));

  // ── Scythe (right side) ──────────────────────────────────────────
  // Handle: dark outline, mid wood, faint highlight strip.
  g.fillStyle(SCYTHE_HANDLE_DARK, 1);
  g.fillRect(cx + 23, cy - 30, 4, 60);
  g.fillStyle(SCYTHE_HANDLE_MID, 1);
  g.fillRect(cx + 24, cy - 29, 2, 58);
  g.fillStyle(SCYTHE_HANDLE_HI, 0.7);
  g.fillRect(cx + 24.6, cy - 28, 0.6, 56);
  // Brass binding ferrules — three small bands.
  for (const fy of [-22, 0, 22] as const) {
    g.fillStyle(RIBBON_GOLD, 1);
    g.fillRect(cx + 22.6, cy + fy, 4.8, 1.6);
    g.fillStyle(RIBBON_GOLD_HI, 1);
    g.fillRect(cx + 22.6, cy + fy, 4.8, 0.6);
  }
  // Blade — outline triangle, darker fill, light pass, sharp edge.
  g.fillStyle(BLADE_OUTLINE, 1);
  g.fillTriangle(cx + 8, cy - 34, cx + 27, cy - 30, cx + 27, cy - 16);
  g.fillStyle(BLADE_DARK, 1);
  g.fillTriangle(cx + 11, cy - 32.5, cx + 26, cy - 29, cx + 26, cy - 18);
  g.fillStyle(BLADE_MID, 1);
  g.fillTriangle(cx + 13, cy - 31, cx + 25, cy - 28, cx + 25, cy - 20);
  g.fillStyle(BLADE_HI, 0.85);
  g.fillTriangle(cx + 14, cy - 30, cx + 24, cy - 28, cx + 17, cy - 27);
  // CUTTING-EDGE HAIRLINE — the missing detail. Dark hairline along
  // the inner concave so the blade reads as a sharpened tool, not
  // a plate.
  g.fillStyle(BLADE_OUTLINE, 1);
  g.fillRect(cx + 11, cy - 32.4, 14, 0.6);
  // Tip glint.
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(cx + 8, cy - 34, 1.2, 1);

  // ── Calculator dangling on a cord ────────────────────────────────
  // Cord first (so the calc sits on top).
  g.lineStyle(0.8, 0x4a4a52, 0.85);
  g.lineBetween(cx + 25, cy + 8, cx + 22, cy + 12);
  // Body.
  g.fillStyle(CALC_BODY, 1);
  g.fillRect(cx + 18, cy + 12, 8, 10);
  g.fillStyle(CALC_PANEL, 1);
  g.fillRect(cx + 19, cy + 13, 6, 8);
  // Sickly office-strip-light screen (NOT cyber-neon; tax-office
  // strip-light green).
  g.fillStyle(CALC_SCREEN, 0.95);
  g.fillRect(cx + 19.4, cy + 13.4, 5.2, 2);
  g.fillStyle(CALC_SCREEN_HI, 0.6);
  g.fillRect(cx + 19.4, cy + 13.4, 5.2, 0.6);
  // Tally digits — three thin dark blocks on the screen.
  g.fillStyle(0x0a1a0a, 0.95);
  g.fillRect(cx + 20, cy + 14, 0.6, 1);
  g.fillRect(cx + 21.6, cy + 14, 0.6, 1);
  g.fillRect(cx + 23.2, cy + 14, 0.6, 1);
  // Keys — 2×3 grid.
  g.fillStyle(CALC_KEY, 1);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      g.fillRect(cx + 19.6 + col * 2.6, cy + 16.2 + row * 1.6, 1.6, 1);
    }
  }

  // ── P45 scroll in the LEFT hand ─────────────────────────────────
  // The Tax Man's signature prop. Cream parchment, frayed edges,
  // a red rubber stamp at the top, ruled lines, a peeking pen.
  // Skeletal hand grip first.
  g.fillStyle(SKULL_BASE, 1);
  g.fillCircle(cx - 22, cy + 6, 2.4);
  g.fillStyle(SKULL_RIM, 1);
  g.fillCircle(cx - 22, cy + 6, 2.4);
  g.fillStyle(SKULL_BASE, 1);
  g.fillCircle(cx - 22, cy + 6, 1.8);
  // Knuckle dots.
  g.fillStyle(SKULL_HOLLOW, 0.85);
  g.fillCircle(cx - 23, cy + 5, 0.5);
  g.fillCircle(cx - 21.4, cy + 5, 0.5);
  // Scroll body — angled slightly so it tilts.
  g.fillStyle(PAPER_OUTLINE, 1);
  g.fillRect(cx - 32, cy - 4, 16, 18);
  g.fillStyle(PAPER_BASE, 1);
  g.fillRect(cx - 31, cy - 3, 14, 16);
  g.fillStyle(PAPER_HI, 0.85);
  g.fillRect(cx - 30.6, cy - 3, 1.2, 16);
  // Ruled lines (5 typed lines).
  g.fillStyle(INK_DARK, 0.95);
  for (let i = 0; i < 5; i++) {
    const ly = cy + 1 + i * 2;
    g.fillRect(cx - 30, ly, 11 - (i % 2 === 0 ? 0 : 2), 0.5);
  }
  // Big red rubber stamp top-right — the bit of the scroll the
  // player should clock first.
  g.fillStyle(STAMP_RED, 0.95);
  g.fillRect(cx - 25, cy - 2, 8, 4);
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 24, cy - 1, 1, 2);
  g.fillRect(cx - 22.4, cy - 1, 1, 2);
  g.fillRect(cx - 20.8, cy - 1, 1, 2);
  g.fillRect(cx - 19.2, cy - 1, 1, 2);
  // Stamp double-rule border — sells "official seal".
  g.fillStyle(STAMP_RED, 1);
  g.fillRect(cx - 25, cy - 2.4, 8, 0.5);
  g.fillRect(cx - 25, cy + 1.8, 8, 0.5);
  // Frayed bottom edge.
  g.fillStyle(PAPER_OUTLINE, 1);
  g.fillRect(cx - 30, cy + 12, 1, 1);
  g.fillRect(cx - 27, cy + 12, 1, 1);
  g.fillRect(cx - 24, cy + 12, 1, 1);
  g.fillRect(cx - 21, cy + 12, 1, 1);
  // Pen lying across the scroll — black barrel, gold nib.
  g.fillStyle(0x101012, 1);
  g.fillRect(cx - 30, cy + 9, 12, 1.2);
  g.fillStyle(RIBBON_GOLD_HI, 1);
  g.fillRect(cx - 19, cy + 9, 1.6, 1.2);
  g.fillStyle(STAMP_RED, 1);
  g.fillRect(cx - 18.6, cy + 9.4, 0.6, 0.6);
}

export function bakeBossTaxman(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawBossTaxmanBody(g);
  g.generateTexture('boss_taxman', BOSS_TAXMAN_CANVAS_SIZE, BOSS_TAXMAN_CANVAS_SIZE);
  g.destroy();
}
