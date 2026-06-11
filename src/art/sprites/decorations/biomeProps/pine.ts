import * as Phaser from 'phaser';
import { bake, shadow, groundedShadow, drawTuft } from './_shared';

export function bakePine(scene: Phaser.Scene): void {
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
}
