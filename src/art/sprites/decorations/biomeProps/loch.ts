import * as Phaser from 'phaser';
import { bake, shadow, groundedShadow, drawTuft } from './_shared';

export function bakeLoch(scene: Phaser.Scene): void {
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
}
