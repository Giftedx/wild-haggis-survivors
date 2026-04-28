/**
 * Heather Mantle — tier-gated overlay drawn on the haggis's back as
 * kills accumulate (W71 Phase 2, DESIGN_IDEAS §M7 visual half).
 *
 * Universal shape, per-variant palette tint. Tier 1 draws a stitched
 * collar over the neck; tier 2 extends the collar into a short cape
 * with cloth folds, hem stitching, heather studs and corner tassels.
 * Canvas matches HAGGIS_SPRITE_SIZE so the overlay sprite aligns
 * pixel-perfect with the body texture at scale 1.
 */

import type { VariantDef } from '../../data/variants';
import type { MantleTier } from '../../animation/mantleTier';
import { HAGGIS_SPRITE_SIZE } from '../../animation/frameDrawers/haggisBodyDraw';

// Multiply two RGB-packed colours by a scalar (0..1) — used for
// shadow tones derived from the variant's palette so each variant's
// mantle still feels like its own cloth, not a generic grey.
function shade(rgb: number, k: number): number {
  const r = Math.max(0, Math.min(255, Math.round(((rgb >> 16) & 0xff) * k)));
  const gC = Math.max(0, Math.min(255, Math.round(((rgb >> 8) & 0xff) * k)));
  const b = Math.max(0, Math.min(255, Math.round((rgb & 0xff) * k)));
  return (r << 16) | (gC << 8) | b;
}

export function drawMantleTier(
  g: Phaser.GameObjects.Graphics,
  variant: VariantDef,
  tier: MantleTier,
): void {
  if (tier === 0) return;

  const s = HAGGIS_SPRITE_SIZE;
  const cx = s / 2;
  const cy = s / 2 - 2;
  const { palette, accentStyle } = variant.appearance;

  // Map the real HaggisAccentStyle taxonomy onto cape-craft cues.
  // Spectral: wee_ghostie + cailleach (gauzy/translucent cloth).
  // Metal: laird (gentry rivets) + iron_belly (forged trim).
  // Flame: pipe_breath (ember from the bag).
  // Storm: surefoot (windswept hillrunner).
  // Other accents fall through to the universal cape — still
  // crafted, just no extra motif on top.
  const isSpectral = accentStyle === 'wee_ghostie' || accentStyle === 'cailleach';
  const isMetal = accentStyle === 'laird' || accentStyle === 'iron_belly';
  const isFlame = accentStyle === 'pipe_breath';
  const isStorm = accentStyle === 'surefoot';
  // These five variants share `accentStyle: 'none'` (the union doesn't
  // carry per-variant tags for them) so we discriminate on variant.key
  // for their tier-2 motifs instead.
  const isGlaswegian = variant.key === 'glaswegian';
  const isAnticlockwise = variant.key === 'anticlockwise';
  const isDoricQuinie = variant.key === 'doric_quinie';
  const isPeerieShetlander = variant.key === 'peerie_shetlander';
  const isBurnsWeeBeastie = variant.key === 'burns_wee_beastie';

  // Spectral mantles read as gauzy cloth — soften the hard outline so
  // the wee_ghostie variant doesn't get a solid black collar that
  // breaks its translucent silhouette.
  const outlineAlpha = isSpectral ? 0.6 : 1;
  const shadow = shade(palette.bodyDark, 0.78);
  const lit = palette.fur;
  const stitch = palette.outline;

  // ── Collar (tier 1 + tier 2) — gradient stack ─────────────────
  // Three stacked ellipses give cloth volume rather than the old flat
  // slab; the lit edge stroke on top + dark stroke on bottom reads as
  // a curved drape over the neck.
  g.fillStyle(palette.outline, outlineAlpha);
  g.fillEllipse(cx - 6, cy - 9, 22, 8);
  g.fillStyle(shadow, 0.95);
  g.fillEllipse(cx - 6, cy - 8.5, 20, 7);
  g.fillStyle(palette.bodyDark, 0.9);
  g.fillEllipse(cx - 6, cy - 9.2, 18, 5.5);
  g.fillStyle(lit, 0.7);
  g.fillEllipse(cx - 6, cy - 10, 14, 3);

  // Lit top-front edge + dark bottom-back edge — two-tone rim that
  // tells the eye which way the cloth is curving.
  g.lineStyle(1, lit, isSpectral ? 0.55 : 0.85);
  g.beginPath();
  g.arc(cx - 6, cy - 9, 11, Math.PI + 0.25, Math.PI * 2 - 0.25, false);
  g.strokePath();
  g.lineStyle(1, shade(palette.outline, 0.6), 0.7);
  g.beginPath();
  g.arc(cx - 6, cy - 9, 11, 0.25, Math.PI - 0.25, false);
  g.strokePath();

  // Three woven tartan pinthreads over the collar. They are tiny, but
  // repeated across every mantle they make the upgrade feel handmade
  // rather than a generic coloured cap.
  g.fillStyle(0xb82020, isSpectral ? 0.45 : 0.75);
  g.fillRect(cx - 15, cy - 8.2, 18, 0.55);
  g.fillStyle(0x2e6b35, isSpectral ? 0.38 : 0.65);
  g.fillRect(cx - 13, cy - 7.2, 15, 0.45);
  g.fillStyle(0xe3b74e, isSpectral ? 0.42 : 0.72);
  g.fillRect(cx - 10, cy - 10.6, 0.55, 4);
  g.fillRect(cx - 2, cy - 10.2, 0.55, 3.5);

  // Crossed-X stitches along the collar hem (~5px spacing). Two short
  // diagonals per stitch reads as cloth thread rather than dot noise.
  g.lineStyle(1, stitch, 0.85);
  for (const dx of [-14, -9, -4, 1]) {
    const sx = cx + dx;
    const sy = cy - 6;
    g.lineBetween(sx - 1, sy - 1, sx + 1, sy + 1);
    g.lineBetween(sx + 1, sy - 1, sx - 1, sy + 1);
  }

  // Heather studs across the collar — a mix of bloom (bigger) + bud
  // (smaller) plus tiny green leaflets between them. Reads as
  // hand-pinned wildflowers, not three identical dots.
  const collarStuds: Array<{ dx: number; dy: number; bloom: boolean }> = [
    { dx: -15, dy: -10.4, bloom: true },
    { dx: -11, dy: -11.8, bloom: false },
    { dx: -7, dy: -12.4, bloom: true },
    { dx: -3, dy: -11.8, bloom: false },
    { dx: 1, dy: -10.6, bloom: true },
  ];
  for (const stud of collarStuds) {
    const r = stud.bloom ? 1.2 : 0.8;
    g.fillStyle(0x4a1f6a, 0.95);
    g.fillCircle(cx + stud.dx, cy + stud.dy, r);
    g.fillStyle(0xc38bdd, 0.9);
    g.fillCircle(cx + stud.dx - 0.2, cy + stud.dy - 0.3, r * 0.55);
    g.fillStyle(0xe9c5f7, 0.85);
    g.fillCircle(cx + stud.dx - 0.4, cy + stud.dy - 0.5, r * 0.25);
  }
  // Two small green leaflets between studs.
  g.fillStyle(0x3a6a2a, 0.85);
  g.fillTriangle(cx - 13, cy - 9, cx - 12.2, cy - 8, cx - 14, cy - 8);
  g.fillTriangle(cx - 5, cy - 9.2, cx - 4.2, cy - 8.2, cx - 6, cy - 8.2);

  // Variant accent — collar-level cues that fall through cleanly for
  // unrecognised accents.
  if (isMetal) {
    // Two rivet dots clamping the collar at the front + back.
    g.fillStyle(0xd9c98a, 1);
    g.fillCircle(cx - 16, cy - 8.4, 0.9);
    g.fillCircle(cx + 3, cy - 9.2, 0.9);
    g.fillStyle(0xfff4c0, 0.9);
    g.fillCircle(cx - 16.2, cy - 8.7, 0.4);
    g.fillCircle(cx + 2.8, cy - 9.5, 0.4);
  }
  if (isFlame) {
    // A single ember pip on the front collar — warm coal glow.
    g.fillStyle(0xff7530, 0.95);
    g.fillCircle(cx - 17, cy - 8.5, 1.1);
    g.fillStyle(0xffd07a, 0.95);
    g.fillCircle(cx - 17.2, cy - 8.8, 0.55);
    g.fillStyle(0xffffe0, 0.85);
    g.fillCircle(cx - 17.3, cy - 9, 0.25);
  }
  if (isStorm) {
    // A tiny wind-tick — three short slashes trailing from the collar.
    g.lineStyle(1, 0xc8e2ff, 0.85);
    g.lineBetween(cx - 18, cy - 9, cx - 16, cy - 9.3);
    g.lineBetween(cx - 18.5, cy - 7.6, cx - 16.5, cy - 8);
    g.lineBetween(cx - 17.5, cy - 6.4, cx - 15.8, cy - 6.7);
  }
  if (isSpectral) {
    // A ghostly rim halo above the collar — soft white wash.
    g.lineStyle(1, 0xeaf3ff, 0.45);
    g.beginPath();
    g.arc(cx - 6, cy - 9, 12, Math.PI + 0.4, Math.PI * 2 - 0.4, false);
    g.strokePath();
  }

  if (tier === 1) return;

  // ── Tier 2: cape — gradient body + cloth folds + hem ──────────
  // Slightly larger footprint, three layers, plus three angled fold
  // panels that imply the cape catching air on the back hem.
  g.fillStyle(palette.outline, outlineAlpha);
  g.fillEllipse(cx - 8, cy - 4, 28, 16);
  g.fillStyle(shadow, 0.92);
  g.fillEllipse(cx - 8, cy - 3.5, 25, 13.5);
  g.fillStyle(palette.bodyDark, 0.85);
  g.fillEllipse(cx - 8, cy - 4, 22, 11);
  g.fillStyle(lit, 0.55);
  g.fillEllipse(cx - 8, cy - 5, 17, 6.5);

  // Cloth folds — three angled triangles falling off the back hem.
  // Two darker (shade), one lit, so the eye reads pleats not dirt.
  g.fillStyle(shade(palette.bodyDark, 0.7), 0.8);
  g.fillTriangle(cx - 19, cy - 1, cx - 16, cy + 4, cx - 14, cy);
  g.fillTriangle(cx - 6, cy + 1, cx - 3, cy + 5, cx - 1, cy + 1);
  g.fillStyle(lit, 0.45);
  g.fillTriangle(cx - 13, cy, cx - 11, cy + 4, cx - 9, cy);

  // Hem highlight + crossed-X stitching every ~5px along the bottom.
  g.lineStyle(1, lit, isSpectral ? 0.4 : 0.6);
  g.beginPath();
  g.arc(cx - 8, cy - 4, 13, 0.15, Math.PI - 0.15, false);
  g.strokePath();

  // Lower woven edge: a red-green-gold sett compressed to pixel scale.
  g.fillStyle(0xb82020, isSpectral ? 0.35 : 0.62);
  g.fillRect(cx - 19, cy + 1.4, 24, 0.55);
  g.fillStyle(0x2e6b35, isSpectral ? 0.28 : 0.52);
  g.fillRect(cx - 18, cy + 2.2, 21, 0.45);
  g.fillStyle(0xe3b74e, isSpectral ? 0.36 : 0.68);
  for (const dx of [-17, -11, -5, 1]) {
    g.fillRect(cx + dx, cy - 5.5, 0.5, 8);
  }

  g.lineStyle(1, stitch, 0.8);
  for (const dx of [-18, -13, -8, -3, 2]) {
    const sx = cx + dx;
    const sy = cy + 2.6;
    g.lineBetween(sx - 1, sy - 1, sx + 1, sy + 1);
    g.lineBetween(sx + 1, sy - 1, sx - 1, sy + 1);
  }

  // Extra heather burst on the cape shoulder — bloom + bud cluster
  // sells the tier-2 upgrade as "more flowers, more crafted".
  const capeStuds: Array<{ dx: number; dy: number; bloom: boolean }> = [
    { dx: -16, dy: -6, bloom: true },
    { dx: -13, dy: -7.2, bloom: false },
    { dx: -2, dy: -6.5, bloom: true },
    { dx: 1, dy: -7.6, bloom: false },
  ];
  for (const stud of capeStuds) {
    const r = stud.bloom ? 1.2 : 0.75;
    g.fillStyle(0x4a1f6a, 0.95);
    g.fillCircle(cx + stud.dx, cy + stud.dy, r);
    g.fillStyle(0xc38bdd, 0.9);
    g.fillCircle(cx + stud.dx - 0.2, cy + stud.dy - 0.3, r * 0.55);
  }
  // Tiny leaflets between the bursts.
  g.fillStyle(0x3a6a2a, 0.8);
  g.fillTriangle(cx - 14.5, cy - 5.5, cx - 13.5, cy - 4.6, cx - 15.5, cy - 4.6);
  g.fillTriangle(cx - 0.5, cy - 5.6, cx + 0.5, cy - 4.7, cx - 1.5, cy - 4.7);

  // Corner tassels — 4-5px each, palette.fur darkened, with a 1-pixel
  // string up to the hem. Sells the cape as a finished garment.
  const tasselColor = shade(palette.fur, 0.55);
  const tasselTip = shade(palette.fur, 0.4);
  // Left tassel
  g.lineStyle(1, stitch, 0.85);
  g.lineBetween(cx - 20, cy + 2, cx - 20.4, cy + 5);
  g.fillStyle(tasselColor, 1);
  g.fillRect(cx - 21.2, cy + 5, 1.6, 4);
  g.fillStyle(tasselTip, 1);
  g.fillRect(cx - 21.2, cy + 8.5, 1.6, 1);
  g.fillStyle(stitch, 0.9);
  g.fillCircle(cx - 20.4, cy + 5, 0.9);
  // Right tassel
  g.lineStyle(1, stitch, 0.85);
  g.lineBetween(cx + 4, cy + 2, cx + 4.4, cy + 5);
  g.fillStyle(tasselColor, 1);
  g.fillRect(cx + 3.6, cy + 5, 1.6, 4);
  g.fillStyle(tasselTip, 1);
  g.fillRect(cx + 3.6, cy + 8.5, 1.6, 1);
  g.fillStyle(stitch, 0.9);
  g.fillCircle(cx + 4.4, cy + 5, 0.9);

  // Variant accent — tier-2 only flourishes that don't overlap the
  // collar cues, so a flame haggis still gets one ember pip on the
  // collar and a second cape-level cue for the upgrade.
  if (isSpectral) {
    // Translucent rim along the cape's bottom — sells the ghost cape.
    g.lineStyle(1, 0xeaf3ff, 0.4);
    g.beginPath();
    g.arc(cx - 8, cy - 4, 14, 0.1, Math.PI - 0.1, false);
    g.strokePath();
    // Faint spectral wisp off the back hem.
    g.fillStyle(0xeaf3ff, 0.18);
    g.fillTriangle(cx - 21, cy + 2, cx - 24, cy + 4, cx - 19, cy + 5);
  }
  if (isMetal) {
    // A row of three rivets along the cape shoulder seam.
    for (const dx of [-15, -10, -5]) {
      g.fillStyle(0xd9c98a, 1);
      g.fillCircle(cx + dx, cy - 9, 0.8);
      g.fillStyle(0xfff4c0, 0.9);
      g.fillCircle(cx + dx - 0.2, cy - 9.3, 0.35);
    }
  }
  if (isFlame) {
    // Ember glow trailing from the back tassel — warm pip cluster.
    g.fillStyle(0xff7530, 0.85);
    g.fillCircle(cx - 22, cy + 8, 0.9);
    g.fillStyle(0xffd07a, 0.85);
    g.fillCircle(cx - 22.2, cy + 8.3, 0.4);
    g.fillStyle(0xff7530, 0.7);
    g.fillCircle(cx - 23.5, cy + 9.5, 0.6);
  }
  if (isStorm) {
    // Wind-streaks trailing off the cape's back hem.
    g.lineStyle(1, 0xc8e2ff, 0.7);
    g.lineBetween(cx - 21, cy + 1, cx - 24, cy + 0.4);
    g.lineBetween(cx - 20.5, cy + 3, cx - 23.5, cy + 2.6);
  }
  if (isGlaswegian) {
    // Tiny traffic-cone wedge on the cape shoulder — the Duke of
    // Wellington tribute. Orange body + cream stripe + dark base.
    g.fillStyle(0x2a1810, 0.95);
    g.fillRect(cx - 7, cy - 5, 3, 1);
    g.fillStyle(0xff7a1f, 1);
    g.fillTriangle(cx - 5.5, cy - 9, cx - 7, cy - 5, cx - 4, cy - 5);
    g.fillStyle(0xfff1d6, 0.95);
    g.fillRect(cx - 6.4, cy - 7, 1.8, 0.8);
  }
  if (isAnticlockwise) {
    // A counter-clockwise spiral — 4 fur-tone dots arcing across the
    // cape mid-back with a single white pip at the spiral's tip
    // implying rotation direction.
    g.fillStyle(palette.fur, 0.9);
    g.fillCircle(cx - 9, cy + 1, 0.9);
    g.fillCircle(cx - 11, cy - 0.4, 0.85);
    g.fillCircle(cx - 13.2, cy + 0.2, 0.8);
    g.fillCircle(cx - 14.4, cy + 2.2, 0.75);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(cx - 9, cy + 1, 0.4);
  }
  if (isDoricQuinie) {
    // A barley-ear sprig pinned at the cape shoulder — 3 gold grains
    // stacked vertically with a 1-pixel green stem. Aberdonian
    // farmland in miniature.
    g.lineStyle(1, 0x3a6a2a, 0.95);
    g.lineBetween(cx - 14, cy - 1, cx - 14, cy - 4);
    g.fillStyle(0xd4a017, 1);
    g.fillCircle(cx - 14, cy - 4, 0.95);
    g.fillCircle(cx - 14, cy - 2.6, 0.85);
    g.fillCircle(cx - 14, cy - 1.4, 0.75);
    g.fillStyle(0xf2cf5a, 0.85);
    g.fillCircle(cx - 14.2, cy - 4.2, 0.4);
  }
  if (isPeerieShetlander) {
    // Two white-cap wave glints along the cape hem — sea-foam pairs
    // (pale-blue + white) at the bottom-back of the cape.
    g.fillStyle(0x9ec5e8, 0.9);
    g.fillCircle(cx - 18, cy + 5, 0.9);
    g.fillCircle(cx - 8, cy + 5, 0.9);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(cx - 18.3, cy + 4.7, 0.45);
    g.fillCircle(cx - 8.3, cy + 4.7, 0.45);
  }
  if (isBurnsWeeBeastie) {
    // A tiny rolled scroll tucked into the cape fold — Burns's
    // poetry. Cream paper body, brown end-caps, single ink dot.
    g.fillStyle(0x6b4a2a, 1);
    g.fillRect(cx + 1, cy + 2, 0.8, 1.6);
    g.fillRect(cx + 4.2, cy + 2, 0.8, 1.6);
    g.fillStyle(0xf4ead0, 1);
    g.fillRect(cx + 1.8, cy + 2.2, 2.4, 1.2);
    g.fillStyle(0x2a1f12, 0.9);
    g.fillCircle(cx + 2.6, cy + 2.8, 0.3);
  }
}
