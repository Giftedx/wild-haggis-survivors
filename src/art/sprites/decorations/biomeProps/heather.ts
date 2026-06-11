import * as Phaser from 'phaser';
import { bake, groundedShadow } from './_shared';

export function bakeHeather(scene: Phaser.Scene): void {
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
}
