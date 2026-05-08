import * as Phaser from 'phaser';
import { bake, groundedShadow } from './_shared';

export function bakeHaar(scene: Phaser.Scene): void {
  // ── deco_fog_pier — partially-obscured wooden pier piling, top
  // half fading into the haar. Reads as a coastal structure even
  // when the player can't see the pier itself. ──
  bake(scene, 'deco_fog_pier', (g) => {
    groundedShadow(g, 16, 25, 14, 3);
    // Pier post — dark wet wood
    g.fillStyle(0x1a1208, 1);
    g.fillRect(13, 8, 6, 17);
    g.fillStyle(0x2a1c10, 1);
    g.fillRect(14, 8, 4, 17);
    // Wood grain stripes
    g.fillStyle(0x3a2a18, 0.9);
    g.fillRect(15, 9, 1, 16);
    g.fillRect(17, 10, 0.6, 14);
    // Iron banding (rusted) — coastal preservation tell
    g.fillStyle(0x6a3818, 1);
    g.fillRect(13, 14, 6, 1);
    g.fillRect(13, 21, 6, 1);
    g.fillStyle(0x8a4828, 0.85);
    g.fillRect(13, 14, 6, 0.4);
    // Top capping — diagonal-cut cross-grain
    g.fillStyle(0x4a3018, 1);
    g.fillRect(12, 7, 8, 1);
    g.fillStyle(0x6a4828, 0.85);
    g.fillRect(12.5, 7, 7, 0.4);
    // Haar fade — top of post drops alpha into mist
    // Layered fog wisps obscuring the upper post
    g.fillStyle(0xc0c8d4, 0.45);
    g.fillEllipse(16, 8, 14, 3);
    g.fillStyle(0xd8dee8, 0.55);
    g.fillEllipse(16, 7, 10, 2);
    g.fillStyle(0xeef0f5, 0.4);
    g.fillEllipse(16, 6, 7, 1.5);
    // Damp fleck on lower post
    g.fillStyle(0xc0c8d4, 0.5);
    g.fillCircle(15, 22, 0.6);
    g.fillCircle(17, 24, 0.5);
    // Faint barnacle stipple at waterline (sells the coastal pier)
    g.fillStyle(0xeeeef0, 0.7);
    g.fillRect(13, 23, 0.6, 0.6);
    g.fillRect(18, 23, 0.5, 0.5);
  });

  // ── deco_snow_patch — irregular snow patch with crystalline
  // sparkle. The signature ground tile of the frost biome. ──
  bake(scene, 'deco_snow_patch', (g) => {
    // Grounded contact shadow, cold-blue tinted
    g.fillStyle(0x4a5060, 0.18);
    g.fillEllipse(16, 26, 22, 3);
    // Snow patch — irregular blob, layered tones
    g.fillStyle(0xc0c8d4, 1);
    g.fillEllipse(16, 22, 22, 8);
    g.fillStyle(0xdde2eb, 1);
    g.fillEllipse(15, 21, 18, 6);
    g.fillStyle(0xeef2f8, 1);
    g.fillEllipse(14, 20, 14, 4);
    // Top-side highlight — fresh snow lit
    g.fillStyle(0xffffff, 0.95);
    g.fillEllipse(13, 19, 9, 2);
    // Sparkle dots — crystalline catch-lights
    g.fillStyle(0xffffff, 1);
    g.fillCircle(11, 19, 0.5);
    g.fillCircle(18, 18, 0.4);
    g.fillCircle(22, 21, 0.5);
    g.fillCircle(8, 21, 0.4);
    // A few exposed twigs poking through (snow always has them)
    g.fillStyle(0x3a2818, 1);
    g.fillRect(20, 21, 2, 1);
    g.fillRect(9, 22, 1.5, 0.6);
    // Bluish underbelly shadow
    g.fillStyle(0x6a7888, 0.5);
    g.fillEllipse(16, 24.5, 20, 1.5);
    // A tiny rabbit-track or two in the snow (suggests wildlife)
    g.fillStyle(0x8a92a2, 0.55);
    g.fillCircle(20, 22, 0.4);
    g.fillCircle(20.5, 22.4, 0.3);
  });
}
