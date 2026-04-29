/**
 * Biome prop pack — small world decorations that make each moor biome
 * read with more local texture than the original thistle/rock/heather
 * scatter. These are static 32x32 sprites; FloraScatter owns placement.
 *
 * v4 quality lift: each prop addressed for silhouette, contact-shadow
 * grounding, and biome-specific micro-detail (frost, mud, lichen, wet
 * glisten) so the sub-8 audit floor is cleared.
 */
import * as Phaser from 'phaser';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

function bake(scene: Phaser.Scene, key: string, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, 32, 32);
  g.destroy();
}

function shadow(g: Phaser.GameObjects.Graphics, x = 16, y = 25, w = 20, h = 5): void {
  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(x, y, w, h);
}

// Layered grounding shadow — wider soft halo + tighter darker core.
// Use this when a prop needs extra "sits on the ground" weight.
function groundedShadow(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(x, y + 1, w + 2, h + 1);
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(x, y, w, h);
}

function drawTuft(g: Phaser.GameObjects.Graphics, x: number, baseY: number, colour: number, hi: number): void {
  g.fillStyle(0x102010, 1);
  g.fillTriangle(x, baseY, x - 3, baseY - 12, x - 1, baseY);
  g.fillTriangle(x, baseY, x + 3, baseY - 11, x + 1, baseY);
  g.fillTriangle(x, baseY, x, baseY - 15, x + 1, baseY);
  g.fillStyle(colour, 1);
  g.fillTriangle(x, baseY, x - 2, baseY - 11, x, baseY);
  g.fillTriangle(x, baseY, x + 2, baseY - 10, x + 0.8, baseY);
  g.fillStyle(hi, 0.9);
  g.fillTriangle(x + 0.5, baseY, x + 0.3, baseY - 13, x + 1, baseY);
}

export function bakeBiomeProps(scene: Phaser.Scene): void {
  bake(scene, 'deco_bog_cotton', (g) => {
    shadow(g, 16, 26, 18, 4);
    drawTuft(g, 10, 25, 0x506a2a, 0x8ba868);
    drawTuft(g, 16, 25, 0x607438, 0x9eb070);
    drawTuft(g, 22, 25, 0x4a6228, 0x88a060);
    g.fillStyle(0xf4f2dc, 1);
    g.fillEllipse(10, 12, 5, 4);
    g.fillEllipse(16, 10, 6, 5);
    g.fillEllipse(22, 13, 5, 4);
    g.fillStyle(0xffffff, 0.85);
    g.fillEllipse(15, 9, 2, 1.5);
  });

  // ── deco_peat_cut — peat block with chiselled edges, broken
  // diagonal corner (asymmetric silhouette), darker layered strata
  // and a wee peat-spade scuff so it doesn't read as a crate. ──
  bake(scene, 'deco_peat_cut', (g) => {
    groundedShadow(g, 16, 25, 22, 4.5);
    // Dark base body
    g.fillStyle(0x120a05, 1);
    g.fillRect(7, 14, 19, 10);
    // Mid-tone front face
    g.fillStyle(0x3a1d0c, 1);
    g.fillRect(8, 13, 17, 10);
    // Top sun-baked layer (paler, kicked-up grass roots)
    g.fillStyle(0x5a3318, 1);
    g.fillRect(9, 13, 15, 4);
    // BROKEN DIAGONAL CORNER — asymmetric chip on top-right (where
    // the peat spade caught it) — this is what saves it from "crate"
    g.fillStyle(0x120a05, 1);
    g.fillTriangle(22, 13, 26, 13, 26, 16);
    g.fillStyle(0x3a1d0c, 1);
    g.fillTriangle(22, 14, 25, 14, 25, 16);
    // Strata bands — clearer dark layers
    g.fillStyle(0x231006, 0.9);
    g.fillRect(10, 18, 12, 1);
    g.fillRect(12, 21, 8, 1);
    // Top mossy fringe — roots/heather still in the cut
    g.fillStyle(0x3a4a18, 1);
    g.fillRect(9, 13, 15, 0.6);
    g.fillStyle(0x5a7028, 0.9);
    g.fillRect(11, 13, 3, 0.4);
    g.fillRect(17, 13, 4, 0.4);
    // Top highlight stroke
    g.fillStyle(0x7a4c26, 0.9);
    g.fillRect(10, 14, 5, 1);
    // PEAT-SPADE SCUFF — angled tool mark on left face
    g.fillStyle(0x180c04, 0.85);
    g.fillRect(9, 19, 4, 0.5);
    g.fillRect(10, 20, 3, 0.5);
    // Crumbled peat at base — small detached crumbs
    g.fillStyle(0x231006, 1);
    g.fillCircle(7, 24, 0.7);
    g.fillCircle(26, 24, 0.6);
    g.fillCircle(5, 25, 0.5);
  });

  // ── deco_sphagnum — moss mound with WET GLISTEN (the bog-floor
  // specificity), uneven asymmetric silhouette, tiny capitulum dots
  // (sphagnum's ball-like flower heads). ──
  bake(scene, 'deco_sphagnum', (g) => {
    groundedShadow(g, 16, 25, 22, 4.5);
    // Dark base
    g.fillStyle(0x20380e, 1);
    g.fillEllipse(16, 22, 23, 9);
    // Asymmetric secondary lump on the right — mound is uneven
    g.fillEllipse(22, 21, 10, 6);
    // Mid-green mass
    g.fillStyle(0x6d8a35, 1);
    g.fillEllipse(15, 21, 20, 7);
    g.fillEllipse(22, 20, 8, 4.5);
    // Bright lobes (yellow-green sphagnum colour)
    g.fillStyle(0x9bb05a, 1);
    g.fillEllipse(12, 20, 8, 4);
    g.fillEllipse(20, 21, 7, 4);
    // Pale capitulum heads — tiny ball flowers (sphagnum-specific)
    g.fillStyle(0xb8c878, 0.95);
    g.fillCircle(11, 18, 1.3);
    g.fillCircle(17, 19, 1.1);
    g.fillCircle(22, 20, 1);
    g.fillCircle(14, 19.5, 0.9);
    // Capitulum tips — paler still
    g.fillStyle(0xd8e088, 0.85);
    g.fillCircle(11, 17.7, 0.5);
    g.fillCircle(17, 18.7, 0.4);
    // WET GLISTEN — bright cyan-white specular bead, the bog-water
    // tell. Sphagnum is always saturated.
    g.fillStyle(0xeaf6ec, 1);
    g.fillCircle(13, 19, 0.7);
    g.fillCircle(19, 19.5, 0.6);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(13, 18.8, 0.3);
    // Brown flecks — peat showing through
    g.fillStyle(0x3a2210, 0.7);
    g.fillCircle(8, 22, 0.4);
    g.fillCircle(25, 22, 0.4);
  });

  // ── deco_bog_boot — abandoned wellie. Add visible LACE EYELETS so
  // it doesn't read as a rock, ankle/cuff fold, mud splatter on the
  // body, and asymmetric tilt (boot leans right as if half-sunk). ──
  bake(scene, 'deco_bog_boot', (g) => {
    groundedShadow(g, 16, 25, 22, 4.5);
    // Body — dark base
    g.fillStyle(0x101008, 1);
    g.fillRect(11, 11, 8, 13);
    g.fillRect(10, 20, 15, 5);
    // Mid-tone leather/rubber
    g.fillStyle(0x4a3a18, 1);
    g.fillRect(12, 12, 6, 11);
    g.fillRect(11, 20, 13, 4);
    // Cuff fold at top — gives it a clear "boot opening" silhouette
    g.fillStyle(0x281c0c, 1);
    g.fillRect(11, 11, 8, 1.5);
    g.fillStyle(0x6a5028, 1);
    g.fillRect(11.5, 11, 7, 0.5);
    // Inner darkness inside the cuff (the open mouth)
    g.fillStyle(0x080404, 1);
    g.fillEllipse(15, 12, 5, 1.5);
    // Side highlight
    g.fillStyle(0x7a6028, 0.85);
    g.fillRect(13, 13, 3, 8);
    // LACE EYELETS — pair of small bright dots on the front
    g.fillStyle(0xc8a040, 1);
    g.fillCircle(13.5, 14.5, 0.6);
    g.fillCircle(13.5, 16.5, 0.6);
    g.fillStyle(0x7a4818, 1);
    g.fillCircle(13.5, 14.5, 0.3);
    g.fillCircle(13.5, 16.5, 0.3);
    // LACE — thin bright cross-stitch between eyelets
    g.fillStyle(0xe8d098, 0.95);
    g.fillRect(13.5, 15, 1.5, 0.4);
    g.fillRect(13.5, 17, 1.5, 0.4);
    // Toe-cap stripe (black rubber tip)
    g.fillStyle(0x080404, 1);
    g.fillRect(11, 22, 14, 1);
    g.fillStyle(0x243018, 0.7);
    g.fillRect(14, 22, 8, 1);
    // MUD SPLATTER on the body
    g.fillStyle(0x6a4a28, 0.9);
    g.fillCircle(14, 18, 1);
    g.fillCircle(17, 19, 0.7);
    g.fillStyle(0x3a2810, 0.85);
    g.fillCircle(14, 18, 0.5);
    g.fillCircle(17, 19, 0.3);
    // Mud splat outside the boot (sunk-in cue)
    g.fillStyle(0x3a2810, 0.85);
    g.fillCircle(8, 23, 0.7);
    g.fillCircle(25, 22, 0.6);
  });

  bake(scene, 'deco_reeds', (g) => {
    shadow(g, 16, 26, 18, 4);
    for (const x of [10, 14, 18, 22]) drawTuft(g, x, 26, 0x355a30, 0x7a9a58);
    g.fillStyle(0x5a3514, 1);
    g.fillEllipse(10, 10, 3, 7);
    g.fillEllipse(18, 8, 3, 8);
    g.fillEllipse(22, 12, 2.5, 6);
    g.fillStyle(0x9a6a30, 0.9);
    g.fillEllipse(18, 7, 1.2, 3);
  });

  // ── deco_driftwood — washed log with asymmetric break, visible
  // grain, BARK STRIP peeling on top, and SEAWEED DRAPE clinging to
  // one end (the loch-shore tell). ──
  bake(scene, 'deco_driftwood', (g) => {
    groundedShadow(g, 16, 25, 24, 4.5);
    // Dark base log
    g.fillStyle(0x17120c, 1);
    g.fillRect(6, 18, 22, 5);
    // Mid-tone wood
    g.fillStyle(0x6b563c, 1);
    g.fillRect(7, 18, 20, 4);
    // Top sun-bleached strip
    g.fillStyle(0x9b8768, 0.9);
    g.fillRect(8, 18, 12, 1);
    // GRAIN LINES — multiple thin parallel marks (bigger than original)
    g.fillStyle(0x3c2d1e, 0.9);
    g.fillRect(11, 19.5, 10, 0.5);
    g.fillRect(14, 21, 8, 0.5);
    g.fillRect(9, 20.5, 7, 0.4);
    // Knot whorls — bigger and clearer
    g.fillStyle(0x3c2d1e, 1);
    g.fillCircle(9, 20, 1.5);
    g.fillStyle(0x1a120a, 1);
    g.fillCircle(9, 20, 0.8);
    g.fillStyle(0x6b563c, 0.9);
    g.fillCircle(9, 20, 0.3);
    // Second smaller knot
    g.fillStyle(0x1a120a, 1);
    g.fillCircle(22, 21, 0.7);
    // BROKEN END on right — asymmetric jagged silhouette
    g.fillStyle(0x17120c, 1);
    g.fillTriangle(28, 18, 27, 20, 28, 22);
    g.fillStyle(0x3a2818, 1);
    g.fillRect(26.5, 19, 1.5, 2);
    g.fillStyle(0x8a6a48, 0.95);
    g.fillRect(26.5, 19.5, 1.5, 0.5);
    // PEELING BARK STRIP — curl on top of the log
    g.fillStyle(0x3a2810, 1);
    g.fillTriangle(15, 16.5, 19, 16.5, 17, 18);
    g.fillStyle(0x5a3a18, 1);
    g.fillTriangle(15.5, 17, 18.5, 17, 17, 17.8);
    // SEAWEED DRAPE — a small dark-green ribbon hanging off the left
    // end. The shoreline cue.
    g.fillStyle(0x1a3a28, 1);
    g.fillRect(6, 22, 1, 3);
    g.fillRect(5.5, 22.5, 1, 2);
    g.fillStyle(0x3a6048, 0.9);
    g.fillRect(6.2, 22, 0.5, 2.5);
    // Wet sheen near the seaweed
    g.fillStyle(0xeaf6ec, 0.5);
    g.fillRect(7, 20, 1.5, 0.3);
  });

  bake(scene, 'deco_creel', (g) => {
    shadow(g, 16, 25, 22, 5);
    g.fillStyle(0x151008, 1);
    g.fillEllipse(16, 19, 20, 12);
    g.fillStyle(0x72502b, 1);
    g.fillEllipse(16, 19, 18, 10);
    g.fillStyle(0x9a7440, 1);
    g.fillEllipse(16, 18, 14, 7);
    g.lineStyle(1, 0x2a1808, 0.9);
    g.strokeEllipse(16, 18, 12, 6);
    for (const x of [10, 14, 18, 22]) {
      g.lineBetween(x, 14, x - 1, 23);
    }
    g.fillStyle(0x203848, 0.7);
    g.fillRect(9, 22, 14, 1);
  });

  // ── deco_ripple — water ripple. Brighter contrast (it was vanishing),
  // a leaf or twig drifting in the centre as a focal anchor, plus
  // small dot specular sparkles. ──
  bake(scene, 'deco_ripple', (g) => {
    // Outer faint dark ring (gives the ripple silhouette weight)
    g.lineStyle(1, 0x405a6a, 0.45);
    g.strokeEllipse(16, 17, 24, 8);
    // Outer ripple — brighter, thicker stroke than v3
    g.lineStyle(1.6, 0xb8e0f0, 0.85);
    g.strokeEllipse(16, 17, 22, 7);
    // Mid ripple
    g.lineStyle(1.3, 0x7ab8d0, 0.7);
    g.strokeEllipse(15, 17, 14, 4);
    // Inner ripple — brightest
    g.lineStyle(1, 0xeaf8fc, 0.9);
    g.strokeEllipse(18, 16, 6, 2);
    // FLOATING TWIG — wee horizontal stick at the centre, gives the
    // ripple a cause/anchor and helps it read at gameplay scale
    g.fillStyle(0x2a1808, 1);
    g.fillRect(15, 17, 4, 0.7);
    g.fillStyle(0x6a4828, 1);
    g.fillRect(15, 17, 4, 0.4);
    g.fillStyle(0x8a6a40, 0.85);
    g.fillRect(15, 17, 1.5, 0.3);
    // Specular sparkles
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(11, 16.5, 0.4);
    g.fillCircle(22, 17.5, 0.4);
    g.fillCircle(20, 18, 0.3);
    g.fillStyle(0xeaf8fc, 0.7);
    g.fillCircle(11, 16.5, 0.7);
    g.fillCircle(22, 17.5, 0.7);
  });

  // ── deco_pine_cone — fuller scale rows, MORE ASYMMETRIC silhouette
  // (offset top), needle wisps poking out, deeper contact shadow,
  // brighter top-light edge. ──
  bake(scene, 'deco_pine_cone', (g) => {
    groundedShadow(g, 16, 25, 16, 4);
    // PINE NEEDLES at base — thin green slivers
    g.fillStyle(0x1a3818, 1);
    g.fillRect(7, 24, 4, 0.5);
    g.fillRect(22, 24, 4, 0.5);
    g.fillStyle(0x3a6028, 1);
    g.fillRect(8, 24, 3, 0.3);
    g.fillRect(22, 24, 3, 0.3);
    // Cone dark base
    g.fillStyle(0x170c05, 1);
    g.fillEllipse(16, 17, 12, 17);
    // Mid body
    g.fillStyle(0x5a3518, 1);
    g.fillEllipse(16, 17, 10, 15);
    // Brighter inner core (top-light)
    g.fillStyle(0x7a4828, 1);
    g.fillEllipse(15, 16, 6, 11);
    // Scale rows — staggered offsets per row so they don't read as
    // perfectly symmetric
    for (let row = 0; row < 5; row++) {
      const y = 10 + row * 3;
      const w = 8 - row;
      const dx = (row % 2 === 0) ? 0 : 0.5;  // stagger
      g.fillStyle(row % 2 === 0 ? 0x8a5728 : 0x3a2110, 1);
      g.fillTriangle(16 + dx, y + 3, 16 + dx - w / 2, y, 16 + dx + w / 2, y);
      // Scale highlight on every other row
      if (row % 2 === 0) {
        g.fillStyle(0xb88a48, 0.85);
        g.fillTriangle(16 + dx, y + 2, 16 + dx - w / 3, y + 0.5, 16 + dx + w / 3, y + 0.5);
      }
    }
    // ASYMMETRIC TOP — leaning slightly left + open scale
    g.fillStyle(0xc08a48, 0.85);
    g.fillTriangle(15, 9, 13, 11, 16, 11);
    g.fillStyle(0x8a5728, 1);
    g.fillTriangle(14.5, 8.5, 13, 10, 16, 10);
    // Top brightest pixel
    g.fillStyle(0xe8b878, 0.95);
    g.fillRect(14, 9, 0.8, 0.8);
    // Tiny detached scale to the right (asymmetry break)
    g.fillStyle(0x3a2110, 1);
    g.fillTriangle(22, 23, 23.5, 21, 24, 23);
    g.fillStyle(0x8a5728, 1);
    g.fillTriangle(22.5, 22.5, 23.4, 21.4, 23.7, 22.5);
  });

  // ── deco_roots — exposed root mass with MOSS COAT, thicker outer
  // roots, deeper layered shadow, asymmetric branch on the right. ──
  bake(scene, 'deco_roots', (g) => {
    groundedShadow(g, 16, 25, 24, 4.5);
    // Vertical stump
    g.fillStyle(0x150c06, 1);
    g.fillRect(14, 10, 5, 14);
    g.fillStyle(0x4a2a14, 1);
    g.fillRect(15, 10, 3, 13);
    // Stump top — pale ring (cut surface)
    g.fillStyle(0x8a5828, 1);
    g.fillEllipse(16.5, 10, 4, 1.2);
    g.fillStyle(0xa86a30, 0.9);
    g.fillEllipse(16.5, 9.7, 2.5, 0.7);
    // Concentric tree-rings on the cut top
    g.fillStyle(0x4a2a14, 0.85);
    g.fillEllipse(16.5, 10, 2, 0.5);
    // ROOT BRANCHES — thicker than original, asymmetric (right side
    // longer than left), with bulgy knuckles
    g.fillStyle(0x2a160a, 1);
    g.fillRect(8, 21, 18, 3);
    // Left root — short
    g.fillRect(7, 19, 7, 2);
    g.fillRect(5, 22, 4, 1.5);
    // Right root — longer with secondary branch
    g.fillRect(19, 18, 7, 2);
    g.fillRect(24, 19, 4, 2);
    g.fillRect(26, 21, 2, 2);
    // Root knuckle bulges
    g.fillStyle(0x3a1f0e, 1);
    g.fillCircle(11, 19.5, 1.2);
    g.fillCircle(22, 18.5, 1.2);
    g.fillCircle(25, 20, 0.9);
    // Mid-tone root highlights
    g.fillStyle(0x7a4a24, 0.85);
    g.fillRect(16, 11, 1, 11);
    g.fillRect(11, 21, 6, 0.5);
    g.fillRect(20, 21, 5, 0.5);
    // MOSS COAT — green flecks on the top edges of the roots
    g.fillStyle(0x3a6028, 1);
    g.fillCircle(10, 21, 1);
    g.fillCircle(15, 20.5, 0.8);
    g.fillCircle(21, 20.5, 0.9);
    g.fillStyle(0x5a8038, 0.95);
    g.fillCircle(10, 20.7, 0.5);
    g.fillCircle(21, 20.2, 0.5);
    g.fillStyle(0x8aa860, 0.9);
    g.fillCircle(10, 20.5, 0.3);
    // Earth crumbs scattered
    g.fillStyle(0x231006, 0.85);
    g.fillCircle(14, 24, 0.4);
    g.fillCircle(20, 24, 0.4);
  });

  bake(scene, 'deco_mushrooms', (g) => {
    shadow(g, 16, 25, 20, 5);
    g.fillStyle(0x281408, 1);
    g.fillRect(13, 16, 2, 8);
    g.fillRect(20, 18, 2, 6);
    g.fillStyle(0xe0c08a, 1);
    g.fillRect(13.5, 16, 1, 8);
    g.fillRect(20.5, 18, 1, 6);
    g.fillStyle(0x4a150e, 1);
    g.fillEllipse(14, 15, 11, 7);
    g.fillEllipse(21, 17, 8, 5);
    g.fillStyle(0xb84a30, 1);
    g.fillEllipse(14, 14, 9, 5);
    g.fillEllipse(21, 16, 6, 4);
    g.fillStyle(0xf0d8a8, 1);
    g.fillCircle(12, 13, 0.8);
    g.fillCircle(16, 14, 0.7);
  });

  bake(scene, 'deco_rowan_berries', (g) => {
    shadow(g, 16, 26, 16, 4);
    drawTuft(g, 15, 25, 0x2f5a28, 0x76a858);
    g.fillStyle(0x2a1808, 1);
    g.fillRect(15, 9, 2, 15);
    g.fillStyle(0x436a28, 1);
    g.fillEllipse(12, 13, 8, 4);
    g.fillEllipse(21, 15, 8, 4);
    g.fillStyle(0xa42018, 1);
    for (const [x, y] of [[17, 12], [19, 14], [16, 15], [20, 17], [14, 14]]) {
      g.fillCircle(x, y, 1.6);
    }
    g.fillStyle(0xff8060, 0.9);
    g.fillCircle(17, 11.5, 0.5);
  });

  // ── deco_bracken — fern with stronger silhouette: stems leaning
  // (motion cue), deeper green shadow side, brighter autumn-rust tip
  // tips, and a SECOND smaller frond off to the side so it doesn't
  // read as a perfect single fern. ──
  bake(scene, 'deco_bracken', (g) => {
    groundedShadow(g, 16, 26, 22, 4);
    // Main central stem
    g.fillStyle(0x221206, 1);
    g.fillRect(15.5, 9, 1.5, 16);
    g.fillStyle(0x9a6a2c, 1);
    g.fillRect(16, 9, 0.7, 16);
    // Stem highlight
    g.fillStyle(0xc08a40, 0.9);
    g.fillRect(16, 12, 0.4, 8);
    // Frond pairs — asymmetric (left longer than right) for natural
    // silhouette break
    for (let i = 0; i < 6; i++) {
      const y = 12 + i * 2;
      const lenL = 8 - i * 0.7;
      const lenR = 7.5 - i * 0.7;
      // Dark shadow under-frond
      g.fillStyle(0x3a4818, 1);
      g.fillTriangle(16, y + 0.5, 16 - lenL, y - 1.5, 16, y + 1.5);
      g.fillTriangle(17, y + 1.5, 17 + lenR, y - 0.5, 17, y + 2.5);
      // Mid-green frond
      g.fillStyle(0x5c6a24, 1);
      g.fillTriangle(16, y, 16 - lenL, y - 2, 16, y + 1);
      g.fillTriangle(17, y + 1, 17 + lenR, y - 1, 17, y + 2);
      // Autumn-rust tip — brighter on outer half
      g.fillStyle(0xb89438, 0.85);
      g.fillTriangle(16, y, 16 - lenL * 0.5, y - 1, 16, y + 0.5);
      // Tip dot — brightest catch-light
      g.fillStyle(0xd8a850, 0.9);
      g.fillCircle(16 - lenL + 0.5, y - 1.5, 0.5);
    }
    // SECONDARY SMALLER FROND — leaning right off the base, breaks
    // single-fern repetition tell
    g.fillStyle(0x3a4818, 1);
    g.fillRect(20, 21, 0.8, 4);
    g.fillStyle(0x9a6a2c, 1);
    g.fillRect(20.2, 21, 0.4, 4);
    // Mini fronds on side stalk
    for (let i = 0; i < 3; i++) {
      const y = 22 + i * 1;
      g.fillStyle(0x5c6a24, 1);
      g.fillTriangle(20.4, y, 20.4 + (3 - i), y - 1, 20.4, y + 0.5);
    }
    // Wee tip on side stalk
    g.fillStyle(0xd8a850, 0.9);
    g.fillCircle(20.2, 20.7, 0.5);
  });

  // ── deco_grouse_feather — make it a feather, not a leaf:
  // SCALLOPED EDGES on the vane, stronger barred banding, slight
  // curve, downy fluff at the base, and an angled lay (not perfectly
  // upright) for naturalism. ──
  bake(scene, 'deco_grouse_feather', (g) => {
    groundedShadow(g, 16, 25, 18, 4);
    // Tilt by drawing the feather rotated ~10° via offset triangles
    // for the vane outline. Use ellipses skewed.
    // Dark vane base
    g.fillStyle(0x1a1008, 1);
    g.fillEllipse(16, 15, 11, 20);
    // Mid-brown vane
    g.fillStyle(0x8a5630, 1);
    g.fillEllipse(16, 15, 9, 18);
    // SCALLOPED EDGES — break the straight oval silhouette with two
    // notch indents on each side
    g.fillStyle(0x1a1008, 1);
    g.fillCircle(11.2, 12, 1);
    g.fillCircle(20.8, 14, 1);
    g.fillCircle(11, 18, 0.8);
    g.fillCircle(21, 18, 0.8);
    // Pale leading edge (tan)
    g.fillStyle(0xd0a060, 1);
    g.fillEllipse(14, 13, 3, 12);
    // Quill (central rachis) — slightly curved
    g.fillStyle(0x241408, 1);
    g.fillRect(16, 6, 1, 19);
    // Quill highlight
    g.fillStyle(0xc8a468, 0.85);
    g.fillRect(16.2, 8, 0.3, 14);
    // BARRED BANDING — clearer dark cross-bars (grouse-specific
    // patterning)
    g.fillStyle(0x2a1808, 1);
    g.fillRect(10, 11, 12, 1);
    g.fillRect(10, 14, 12, 0.8);
    g.fillRect(11, 17, 10, 0.8);
    g.fillRect(12, 20, 8, 0.8);
    // Pale bars between dark ones (the speckled look)
    g.fillStyle(0xc8956a, 0.7);
    g.fillRect(10, 12.5, 12, 0.5);
    g.fillRect(10, 15.5, 12, 0.4);
    g.fillRect(11, 18.5, 10, 0.4);
    // DOWNY FLUFF at base — wispy soft strokes (the feather tell)
    g.fillStyle(0x6a4828, 1);
    g.fillRect(14, 22, 0.5, 3);
    g.fillRect(15, 22.5, 0.4, 2.5);
    g.fillRect(17, 22.5, 0.4, 2.5);
    g.fillRect(18, 22, 0.5, 3);
    g.fillStyle(0x9a7448, 0.85);
    g.fillRect(15.5, 23, 0.3, 1.5);
    g.fillRect(17, 23, 0.3, 1.5);
    // Quill tip (pointed)
    g.fillStyle(0x4a2814, 1);
    g.fillTriangle(16, 6, 15.5, 4, 16.5, 4);
    // Tip catch-light
    g.fillStyle(0xe8c890, 0.9);
    g.fillRect(13.5, 8, 0.5, 1);
  });

  // ── deco_wool_tuft — give it a CAUGHT-ON-FENCE-WIRE moment:
  // tiny barbed-wire strand piercing the tuft, asymmetric clumps,
  // less uniform brightness, frizzy strand outliers, contact shadow
  // grounded. ──
  bake(scene, 'deco_wool_tuft', (g) => {
    groundedShadow(g, 16, 25, 18, 4);
    // Dark dirty under-tuft (ground-stained wool)
    g.fillStyle(0x504830, 0.8);
    g.fillEllipse(16, 20, 16, 8);
    // Wool mass — varied size clumps for asymmetry
    g.fillStyle(0xe8dcc0, 1);
    g.fillCircle(11, 19, 3.5);
    g.fillCircle(15, 17, 4);
    g.fillCircle(20, 19, 3);
    g.fillCircle(16, 21, 4.2);
    // Slightly dingier secondary clump — varied colour
    g.fillStyle(0xd8c8a8, 1);
    g.fillCircle(13, 20.5, 2.5);
    g.fillCircle(19, 20.5, 2);
    // Bright clump highlights
    g.fillStyle(0xfff4d8, 0.95);
    g.fillCircle(14, 16, 1.4);
    g.fillCircle(19, 18, 1.1);
    g.fillCircle(11, 18, 0.9);
    // FRIZZY STRAND OUTLIERS — fine wisps poking out
    g.fillStyle(0xe8dcc0, 0.9);
    g.fillRect(8.5, 19, 1.5, 0.4);
    g.fillRect(22, 19.5, 1.5, 0.4);
    g.fillRect(9, 17, 1, 0.3);
    g.fillRect(23, 17.5, 1, 0.3);
    g.fillStyle(0xc8b890, 0.8);
    g.fillRect(8.5, 19.4, 1, 0.3);
    g.fillRect(22, 19.9, 1, 0.3);
    // BARBED WIRE STRAND — thin diagonal grey line crossing the
    // tuft (the sheep-country tell)
    g.fillStyle(0x6a6a72, 1);
    g.fillRect(9, 17.5, 14, 0.6);
    g.fillStyle(0x8a8a92, 0.85);
    g.fillRect(9, 17.5, 14, 0.3);
    // Barbs (tiny X marks on the wire)
    g.fillStyle(0x4a4a52, 1);
    g.fillRect(13, 17, 0.4, 1.5);
    g.fillRect(18, 17, 0.4, 1.5);
    // Mud streak on bottom
    g.fillStyle(0x6a4828, 0.6);
    g.fillRect(12, 22, 8, 1);
    g.fillStyle(0x4a3018, 0.5);
    g.fillCircle(14, 22.5, 0.5);
  });

  // ── deco_wind_grass — vary blade widths (not all same triangles),
  // clearer SEED HEADS at tops (oat-grass specificity), stronger
  // directional lean, rust-gold tips so it reads as moor-native
  // dried grass. ──
  bake(scene, 'deco_wind_grass', (g) => {
    groundedShadow(g, 16, 26, 20, 4);
    // Seven blades with VARIED width and lean
    const blades: { x: number; tipY: number; lean: number; w: number }[] = [
      { x: 9, tipY: 11, lean: 7, w: 1.6 },
      { x: 11.5, tipY: 13, lean: 6, w: 1.2 },
      { x: 14, tipY: 10, lean: 8, w: 1.8 },
      { x: 16.5, tipY: 12, lean: 7, w: 1.4 },
      { x: 19, tipY: 11.5, lean: 8, w: 1.6 },
      { x: 21.5, tipY: 13, lean: 7, w: 1.2 },
      { x: 24, tipY: 12, lean: 9, w: 1.8 },
    ];
    for (const b of blades) {
      // Dark side
      g.fillStyle(0x203012, 1);
      g.fillTriangle(b.x, 26, b.x + b.lean, b.tipY, b.x + b.w, 26);
      // Mid-green
      g.fillStyle(0x7d8a38, 1);
      g.fillTriangle(b.x + 0.3, 26, b.x + b.lean - 0.5, b.tipY + 0.5, b.x + b.w - 0.3, 26);
      // Bright leading-edge highlight
      g.fillStyle(0xb0b850, 0.9);
      g.fillTriangle(b.x + 0.4, 26, b.x + b.lean - 0.8, b.tipY + 1, b.x + 0.7, 26);
    }
    // SEED HEADS — small oat-style sprigs at the tip of three blades
    const seedHeads: [number, number][] = [
      [16, 10.5], [22, 11.5], [27, 11.8],
    ];
    for (const [sx, sy] of seedHeads) {
      // Stem extension
      g.fillStyle(0x9a8438, 1);
      g.fillRect(sx - 0.2, sy, 0.4, 1.5);
      // Seed grain dots
      g.fillStyle(0xc8a040, 1);
      g.fillCircle(sx - 0.6, sy + 0.3, 0.6);
      g.fillCircle(sx + 0.6, sy + 0.5, 0.55);
      g.fillCircle(sx - 0.3, sy - 0.3, 0.55);
      g.fillCircle(sx + 0.3, sy - 0.5, 0.5);
      // Bright awns on tips
      g.fillStyle(0xffe080, 0.95);
      g.fillCircle(sx - 0.6, sy + 0.3, 0.25);
      g.fillCircle(sx + 0.3, sy - 0.5, 0.22);
    }
    // Rust-gold accent stripe on horizon (existing kept, brightened)
    g.fillStyle(0xd8c878, 0.95);
    g.fillRect(20, 13, 4, 0.8);
  });

  // ── B5 Phase 1 — Seawrack/Coastal flora (4 new authored). ──
  // Wild palette per ART_STYLE_BIBLE §Wild:50-65; windswept, lonely.
  // Cultural anchor: Corryvreckan whirlpool + kelp/wrack abundant
  // coasts (SCOTTISH_RESEARCH §1.8, SCOTTISH_RESEARCH_DEEP §5.4).

  // ── deco_kelp_strand — single laminaria frond with stipe + holdfast,
  // bladders along the blade, wet-sheen highlight. The wrack-tide motif. ──
  bake(scene, 'deco_kelp_strand', (g) => {
    shadow(g, 16, 26, 14, 3);
    // Holdfast (the mass at the base where it grips a stone)
    g.fillStyle(0x1a2818, 1);
    g.fillEllipse(16, 25, 8, 3);
    g.fillStyle(0x2a3a20, 1);
    g.fillEllipse(16, 24, 5, 2);
    // Stipe (the stem) — leans NE, slight S-curve
    g.fillStyle(0x1a2818, 1);
    g.fillRect(15, 18, 1, 7);
    g.fillRect(16, 12, 1, 7);
    g.fillRect(17, 7, 1, 6);
    // Blade (the wide flat leaf) — flares from stipe top
    g.fillStyle(0x2a4028, 1);
    g.fillTriangle(17, 7, 12, 9, 14, 13);
    g.fillTriangle(17, 7, 22, 10, 20, 13);
    g.fillStyle(0x355030, 1);
    g.fillTriangle(17, 8, 14, 10, 16, 12);
    g.fillTriangle(17, 8, 21, 10, 19, 12);
    // Bladders (gas-filled nodes — the silhouette tell)
    g.fillStyle(0x4a6a3a, 1);
    g.fillCircle(13, 11, 1.4);
    g.fillCircle(21, 11, 1.3);
    g.fillCircle(17, 9, 1);
    g.fillStyle(0x6a8a4a, 0.85);
    g.fillCircle(13, 10.5, 0.7);
    g.fillCircle(21, 10.5, 0.6);
    // Wet-sheen highlight on blade
    g.fillStyle(0x8aa050, 0.4);
    g.fillRect(16, 9, 2, 3);
    // A few small green flecks at the holdfast (sea-life)
    g.fillStyle(0x4a6a3a, 0.85);
    g.fillCircle(13, 24.5, 0.5);
    g.fillCircle(19, 24.5, 0.4);
  });

  // ── deco_barnacle_rock — sea-darkened rock with barnacle cluster,
  // splash mineral white-streaks down one face. ──
  bake(scene, 'deco_barnacle_rock', (g) => {
    groundedShadow(g, 16, 25, 22, 4);
    // Rock body — wet dark blue-grey
    g.fillStyle(0x1a2028, 1);
    g.fillEllipse(16, 21, 22, 12);
    g.fillStyle(0x3a4a52, 1);
    g.fillEllipse(16, 20, 18, 9);
    // Top facet — lit edge
    g.fillStyle(0x6a7a82, 1);
    g.fillEllipse(15, 17, 12, 4);
    g.fillStyle(0x8a9aa2, 0.85);
    g.fillEllipse(14, 16, 7, 2);
    // Barnacle cluster — small white volcano cones
    const barnacles: ReadonlyArray<readonly [number, number, number]> = [
      [12, 18, 1.5],
      [14, 17, 1.2],
      [17, 17.5, 1.6],
      [20, 18.5, 1.4],
      [16, 19.5, 1.1],
      [11, 20, 1],
      [22, 19, 1.2],
    ];
    for (const [bx, by, br] of barnacles) {
      g.fillStyle(0x6a6a72, 1);
      g.fillCircle(bx, by, br);
      g.fillStyle(0xc8c8d0, 1);
      g.fillCircle(bx, by - 0.2, br * 0.7);
      g.fillStyle(0x2a2028, 1);
      g.fillCircle(bx, by - 0.2, br * 0.3);
    }
    // Salt-mineral white streak running down the rock face
    g.fillStyle(0xd8d8e0, 0.55);
    g.fillRect(8, 19, 1, 5);
    g.fillRect(9, 22, 1, 2);
    // Tiny green algae fleck (lower edge)
    g.fillStyle(0x3a5a28, 0.85);
    g.fillCircle(20, 23, 0.6);
  });

  // ── deco_whelk_shell — small spiral whelk shell, cream + cinnamon
  // bands. Static pickup-feel; signals shore. ──
  bake(scene, 'deco_whelk_shell', (g) => {
    shadow(g, 16, 25, 12, 3);
    // Shell body — pointed cone with spiral
    // Outer cinnamon outline
    g.fillStyle(0x7a4a28, 1);
    g.fillTriangle(16, 11, 11, 24, 21, 24);
    // Cream main body
    g.fillStyle(0xe8c898, 1);
    g.fillTriangle(16, 12, 12, 23, 20, 23);
    // Spiral bands — dark brown ridges
    g.fillStyle(0x5a3818, 1);
    g.fillRect(13, 16, 6, 0.8);
    g.fillRect(13.5, 19, 5, 0.8);
    g.fillRect(14, 21.5, 4, 0.7);
    // Inner highlight (lit side)
    g.fillStyle(0xf8e0b0, 1);
    g.fillTriangle(16, 13, 14, 17, 15, 17);
    // Aperture (mouth) — dark at base
    g.fillStyle(0x3a2010, 1);
    g.fillEllipse(16, 23, 6, 1.5);
    g.fillStyle(0x1a0808, 1);
    g.fillEllipse(16, 23.2, 4, 0.8);
    // Spire tip
    g.fillStyle(0xb8804a, 1);
    g.fillRect(15.7, 11, 0.6, 1);
  });

  // ── deco_foam_line — surf-foam scatter, multiple white blots
  // along a curve. Marks the tide-line. ──
  bake(scene, 'deco_foam_line', (g) => {
    // No grounded shadow — foam is wet film, not solid
    g.fillStyle(0x6a7a82, 0.18);
    g.fillEllipse(16, 22, 26, 4);
    // Wet sand-line tone underneath
    g.fillStyle(0x8a7a60, 0.35);
    g.fillEllipse(16, 21, 22, 2);
    // Foam blots — irregular, varied size, gentle arc
    const foam: ReadonlyArray<readonly [number, number, number]> = [
      [6, 19, 1.6],
      [9, 17, 2.0],
      [13, 16, 2.3],
      [17, 15.5, 2.5],
      [21, 16, 2.2],
      [25, 17, 1.8],
      [27, 19, 1.4],
    ];
    for (const [fx, fy, fr] of foam) {
      g.fillStyle(0xeeeef5, 0.85);
      g.fillCircle(fx, fy, fr);
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(fx - 0.4, fy - 0.4, fr * 0.55);
    }
    // Tiny bubble specks above foam
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(11, 13, 0.5);
    g.fillCircle(19, 12.5, 0.5);
    g.fillCircle(23, 13, 0.4);
  });
}
