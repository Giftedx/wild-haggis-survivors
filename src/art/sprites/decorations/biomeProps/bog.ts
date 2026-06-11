import * as Phaser from 'phaser';
import { bake, shadow, groundedShadow, drawTuft } from './_shared';

export function bakeBog(scene: Phaser.Scene): void {
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
}
