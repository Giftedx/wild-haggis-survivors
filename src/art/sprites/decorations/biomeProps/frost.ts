import * as Phaser from 'phaser';
import { bake, shadow, drawPtarmiganPrint } from './_shared';

export function bakeFrost(scene: Phaser.Scene): void {
  // ── deco_bare_birch — leafless silver birch trunk + a few fine
  // twig branches. Stark white-on-grey silhouette; the Cairngorm
  // tree-line tell. ──
  bake(scene, 'deco_bare_birch', (g) => {
    shadow(g, 16, 27, 12, 3);
    // Trunk — pale silver-white birch, thin, slight S-curve
    g.fillStyle(0xeef2f8, 1);
    g.fillRect(15, 6, 2, 20);
    // Trunk shadow side
    g.fillStyle(0xa8b0bc, 1);
    g.fillRect(16.5, 7, 1, 18);
    // Characteristic birch black bands (peeling bark)
    g.fillStyle(0x282828, 1);
    g.fillRect(15, 11, 2, 0.7);
    g.fillRect(15, 16, 2, 0.6);
    g.fillRect(15, 21, 2, 0.5);
    g.fillStyle(0x5a4a3a, 0.85);
    g.fillRect(15, 13.5, 2, 0.4);
    g.fillRect(15, 18, 2, 0.4);
    // Fine twig branches at top — bare frame
    g.fillStyle(0x4a3828, 1);
    // Left twig
    g.fillRect(11, 7, 4, 0.7);
    g.fillRect(9, 5, 2, 0.6);
    g.fillRect(13, 9, 2, 0.5);
    // Right twig
    g.fillRect(17, 8, 4, 0.7);
    g.fillRect(20, 6, 2, 0.6);
    g.fillRect(18, 10, 2, 0.5);
    // Top fork
    g.fillStyle(0x3a2818, 1);
    g.fillRect(15, 4, 2, 3);
    g.fillRect(14, 5, 1, 1);
    g.fillRect(17, 5, 1, 1);
    // Frost dust on the upper trunk (thin rime line on the wind-side)
    g.fillStyle(0xeef2f8, 0.7);
    g.fillRect(15, 7, 0.5, 5);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(15.2, 8, 0.3);
    g.fillCircle(15.2, 10.5, 0.3);
    // Tiny snow cap on a twig fork
    g.fillStyle(0xffffff, 1);
    g.fillCircle(11, 5, 0.8);
    g.fillCircle(20, 6, 0.7);
  });

  // ── deco_rime_bracken — bracken frond locked in rime, bowed
  // with frost weight. The bracken's the signal; the rime is the
  // tax. ──
  bake(scene, 'deco_rime_bracken', (g) => {
    shadow(g, 16, 26, 16, 3);
    // Stem — cold grey-brown
    g.fillStyle(0x4a3a28, 1);
    g.fillRect(15, 17, 2, 8);
    // Bracken fronds — leaning over (frost weight bows them)
    g.fillStyle(0x6a5a3a, 1);
    g.fillTriangle(16, 16, 8, 14, 11, 18);
    g.fillTriangle(16, 16, 24, 14, 21, 18);
    g.fillStyle(0x8a7448, 0.95);
    g.fillTriangle(16, 15, 10, 13.5, 12, 17);
    g.fillTriangle(16, 15, 22, 13.5, 20, 17);
    // Rime coating — thin white outline along the frond edges
    g.fillStyle(0xeef2f8, 0.9);
    g.fillRect(8, 14, 4, 0.6);
    g.fillRect(20, 14, 4, 0.6);
    g.fillRect(11, 18, 3, 0.5);
    g.fillRect(18, 18, 3, 0.5);
    // Crystalline sparkles on the rime
    g.fillStyle(0xffffff, 1);
    g.fillCircle(9, 14, 0.5);
    g.fillCircle(23, 14, 0.5);
    g.fillCircle(13, 18, 0.4);
    g.fillCircle(19, 18, 0.4);
    g.fillStyle(0xeef2f8, 0.7);
    g.fillCircle(11, 14.3, 0.3);
    g.fillCircle(21, 14.3, 0.3);
    // Rime cap on the apex
    g.fillStyle(0xffffff, 1);
    g.fillCircle(16, 14.5, 1.1);
    g.fillStyle(0xeef2f8, 0.85);
    g.fillCircle(16, 14, 0.6);
    // A drooping frond tip with an icicle bead
    g.fillStyle(0xc0d0e0, 0.85);
    g.fillRect(8, 15, 0.6, 1.2);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(8.3, 16.2, 0.4);
  });

  // ── deco_ptarmigan_print — paired triple-toe footprints in
  // snow. The ptarmigan's white-on-white camouflage is famous;
  // the prints are the only tell of its passing. ──
  bake(scene, 'deco_ptarmigan_print', (g) => {
    // Snow under-tone (faint patch)
    g.fillStyle(0xeef2f8, 0.6);
    g.fillEllipse(16, 21, 22, 7);
    g.fillStyle(0xffffff, 0.5);
    g.fillEllipse(16, 20, 18, 5);
    // Two paired prints (gait — left then right step)
    // Each print: 3 forward toes + 1 small heel pad
    // Print A (lower-left)
    drawPtarmiganPrint(g, 11, 20, false);
    // Print B (upper-right, smaller — implies depth recession)
    drawPtarmiganPrint(g, 20, 17, true);
    // A faint third partial print fading out top-right (gait continues
    // off-screen — sells motion)
    g.fillStyle(0x8a92a2, 0.45);
    g.fillCircle(25, 14, 0.7);
    g.fillCircle(26, 13.5, 0.5);
  });

  // ── deco_dripping_heather — heather sprig with condensed water
  // beads pulling each tip downward. The haar shows up everywhere
  // it touches; the heather wears it. ──
  bake(scene, 'deco_dripping_heather', (g) => {
    shadow(g, 16, 26, 14, 3);
    // Stem cluster — central bunch
    g.fillStyle(0x3a2818, 1);
    g.fillRect(15, 18, 2, 7);
    g.fillRect(13, 19, 1, 5);
    g.fillRect(18, 19, 1, 5);
    // Heather sprig clusters — small dense pellet bundles, drooping
    // (water pulls them down)
    // Centre cluster — drooping right
    g.fillStyle(0x4a2858, 1);
    g.fillEllipse(17, 14, 5, 3);
    g.fillStyle(0x6a3878, 1);
    g.fillEllipse(17, 13.5, 3.5, 2);
    g.fillStyle(0x8a5898, 0.85);
    g.fillEllipse(17, 13, 2, 1);
    // Left cluster — drooping more (heavier with water)
    g.fillStyle(0x4a2858, 1);
    g.fillEllipse(11, 18, 4, 2.5);
    g.fillStyle(0x6a3878, 1);
    g.fillEllipse(11, 17.5, 2.5, 1.5);
    // Right cluster — smaller
    g.fillStyle(0x4a2858, 1);
    g.fillEllipse(20, 17, 3, 2);
    g.fillStyle(0x6a3878, 1);
    g.fillEllipse(20, 16.5, 2, 1.2);
    // Water beads — the haar tell
    // Big bead on stem
    g.fillStyle(0xd8e0ee, 0.85);
    g.fillCircle(17, 16, 1.2);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(16.7, 15.5, 0.5);
    // Bead about to drop from heather tip
    g.fillStyle(0xd8e0ee, 0.85);
    g.fillCircle(11, 20, 0.9);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(10.8, 19.7, 0.4);
    // Smaller scattered beads
    g.fillStyle(0xd8e0ee, 0.75);
    g.fillCircle(20, 18.5, 0.7);
    g.fillCircle(15, 13, 0.5);
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(20, 18.2, 0.3);
    // A drip caught mid-fall (vertical streak)
    g.fillStyle(0xc0c8d8, 0.65);
    g.fillRect(11, 21, 0.5, 1.5);
    // Faint mist wisp around the sprig
    g.fillStyle(0xc0c8d4, 0.3);
    g.fillEllipse(16, 12, 12, 2);
  });
}
