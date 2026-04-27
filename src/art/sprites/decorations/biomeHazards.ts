/**
 * Biome hazard props — environmental dangers spawned by the future hazard system, distinct from enemy-class hazards.
 * Quartet covers Highland danger naturalism (peat blackness, slate blue-grey, burn white-water, scree mountain greys).
 * Each carries a clear warning cue in the silhouette: bog-cotton tufts on the pit, motion lines on the falling slate,
 * foam crests on the burn, slipping ticks on the scree. Palette pulled from Wild + Grave tonal blends in ART_STYLE_BIBLE.
 */

import * as Phaser from 'phaser';

export function bakeHazardPeatPit(scene: Phaser.Scene): void {
  const w = 36, h = 28;
  const g = scene.add.graphics();
  const cx = w / 2, cy = h / 2;

  // Outer shadow halo on the moss/turf around the hole — a faint ground darkening
  g.fillStyle(0x3a2818, 0.35);
  g.fillEllipse(cx, cy + 1, 32, 22);

  // Asymmetric peat oval — wider east, pinched west (irregular bog edge)
  g.fillStyle(0x3a2818, 1);
  g.fillEllipse(cx + 1, cy, 30, 18);
  g.fillStyle(0x4a2e18, 1);
  g.fillEllipse(cx + 2, cy - 1, 26, 14);

  // Inner pit blackness (the drop) — offset to imply depth bias
  g.fillStyle(0x1a0f08, 1);
  g.fillEllipse(cx + 2, cy, 20, 9);
  g.fillStyle(0x000000, 1);
  g.fillEllipse(cx + 3, cy + 1, 14, 5);

  // Wet peat sheen on the inner east lip (light catches here)
  g.fillStyle(0x5a3e20, 0.7);
  g.fillEllipse(cx + 7, cy - 2, 6, 1.5);

  // Bog-cotton tufts at the edge — the warning camouflage (innocuous-looking white fluff)
  // Tuft 1 (NW edge)
  g.fillStyle(0x5a3e20, 1);
  g.fillRect(cx - 11, cy - 4, 1, 4);
  g.fillStyle(0xeeeeee, 1);
  g.fillCircle(cx - 10.5, cy - 5, 1.6);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - 11, cy - 5.5, 1);
  // Tuft 2 (N edge)
  g.fillStyle(0x5a3e20, 1);
  g.fillRect(cx - 1, cy - 8, 1, 4);
  g.fillStyle(0xeeeeee, 1);
  g.fillCircle(cx - 0.5, cy - 9, 1.4);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - 1, cy - 9.5, 0.9);
  // Tuft 3 (SE edge)
  g.fillStyle(0x5a3e20, 1);
  g.fillRect(cx + 9, cy + 4, 1, 3);
  g.fillStyle(0xeeeeee, 1);
  g.fillCircle(cx + 9.5, cy + 3, 1.3);

  // Air-bubble pops on the pit surface (the only motion — methane belches)
  g.fillStyle(0x2a1a10, 1);
  g.fillCircle(cx - 2, cy + 1, 1.2);
  g.fillStyle(0x6a4a30, 0.8);
  g.fillCircle(cx - 2, cy + 0.5, 0.5);
  g.fillStyle(0x2a1a10, 1);
  g.fillCircle(cx + 5, cy - 1, 0.9);

  // Faint mist wisp rising from the centre — peat-gas vapour
  g.fillStyle(0xaaaab0, 0.35);
  g.fillCircle(cx + 1, cy - 7, 2.5);
  g.fillStyle(0xccccd0, 0.25);
  g.fillCircle(cx + 3, cy - 10, 2);

  g.generateTexture('hazard_peat_pit', w, h);
  g.destroy();
}

export function bakeHazardFallingSlate(scene: Phaser.Scene): void {
  const w = 20, h = 26;
  const g = scene.add.graphics();
  const cx = w / 2;

  // Dust puff at top edge — slate just dislodged from the ridge
  g.fillStyle(0xaaaab0, 0.4);
  g.fillCircle(cx - 2, 2, 2.5);
  g.fillCircle(cx + 2, 1, 2);
  g.fillStyle(0xccccd0, 0.3);
  g.fillCircle(cx, 1, 1.5);

  // Motion-tilt streaks beside the slab (3 angled, fading) — implying fall direction
  g.fillStyle(0x6a90b0, 0.45);
  g.fillRect(cx - 7, 6, 1, 4);
  g.fillStyle(0x6a90b0, 0.35);
  g.fillRect(cx + 6, 5, 1, 5);
  g.fillStyle(0x6a90b0, 0.25);
  g.fillRect(cx - 8, 11, 1, 3);

  // Subtle impact-zone shadow underneath (where it's about to land)
  g.fillStyle(0x000000, 0.45);
  g.fillEllipse(cx, h - 2, 14, 3);

  // Slate slab — diagonal tilt (NW high, SE low). Built as a quad of two triangles.
  // Backing dark layer (under-edge shadow)
  g.fillStyle(0x1a1a20, 1);
  g.fillTriangle(cx - 6, 7, cx + 7, 11, cx + 5, 19);
  g.fillTriangle(cx - 6, 7, cx + 5, 19, cx - 8, 15);

  // Main slate body — Wild palette stone blue-grey
  g.fillStyle(0x4a4a50, 1);
  g.fillTriangle(cx - 5, 7, cx + 6, 11, cx + 4, 18);
  g.fillTriangle(cx - 5, 7, cx + 4, 18, cx - 7, 14);

  // Mid-slab tonal layering (avoid lineStyle — fill a thin parallelogram instead)
  g.fillStyle(0x5a5a62, 1);
  g.fillTriangle(cx - 4, 9, cx + 4, 12, cx + 3, 16);
  g.fillTriangle(cx - 4, 9, cx + 3, 16, cx - 5, 13);

  // White edge highlight on the top-left lit edge — where light catches the fresh break
  g.fillStyle(0xeeeef0, 1);
  g.fillTriangle(cx - 5, 7, cx - 4, 7, cx + 6, 11);
  g.fillStyle(0xffffff, 0.85);
  g.fillTriangle(cx - 5, 7, cx - 2, 8, cx + 2, 9);

  // Tiny chip detail — irregular fracture pip on the lower edge
  g.fillStyle(0x2a2a30, 1);
  g.fillRect(cx + 2, 16, 1, 1);

  g.generateTexture('hazard_falling_slate', w, h);
  g.destroy();
}

export function bakeHazardBurnWater(scene: Phaser.Scene): void {
  const w = 32, h = 20;
  const g = scene.add.graphics();
  const cy = h / 2;

  // Deep loch base — the channel bed colour bleeding through
  g.fillStyle(0x2a4a6a, 1);
  g.fillRect(0, 2, w, h - 4);

  // Mid-flow streaming bands (horizontal, 3 stacked tones for layered current)
  g.fillStyle(0x4a7090, 1);
  g.fillRect(0, 4, w, 12);
  g.fillStyle(0x6a90b0, 1);
  g.fillRect(0, 6, w, 8);
  g.fillStyle(0x8ab0c8, 0.85);
  g.fillRect(0, 8, w, 4);

  // Dark rocks breaking the flow (2 — one left, one right)
  // Left rock
  g.fillStyle(0x2a2a30, 1);
  g.fillEllipse(8, cy + 1, 6, 5);
  g.fillStyle(0x4a4a50, 1);
  g.fillEllipse(8, cy, 4, 3);
  g.fillStyle(0x6a6a72, 0.7);
  g.fillEllipse(7, cy - 1, 2, 1);
  // Right rock
  g.fillStyle(0x2a2a30, 1);
  g.fillEllipse(22, cy - 1, 5, 4);
  g.fillStyle(0x4a4a50, 1);
  g.fillEllipse(22, cy - 2, 3, 2);

  // White-water foam crests (4 — clustered downstream of the rocks)
  g.fillStyle(0xffffff, 1);
  g.fillCircle(11, cy - 1, 1.6);
  g.fillCircle(13, cy + 1, 1.3);
  g.fillCircle(25, cy - 2, 1.5);
  g.fillCircle(27, cy, 1.2);
  g.fillStyle(0xeeeef5, 0.85);
  g.fillCircle(11, cy - 1.5, 0.9);
  g.fillCircle(25, cy - 2.5, 0.8);

  // Splash dots above the rocks — the upward lift of broken flow
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(8, cy - 4, 1);
  g.fillCircle(7, cy - 5, 0.6);
  g.fillCircle(22, cy - 5, 1);
  g.fillCircle(23, cy - 6, 0.5);

  // Surface shimmer dots (high-frequency texture scattered along flow)
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(3, cy - 1, 0.5);
  g.fillCircle(17, cy + 2, 0.5);
  g.fillCircle(19, cy - 2, 0.5);
  g.fillCircle(30, cy + 1, 0.5);
  g.fillCircle(15, cy - 3, 0.5);

  // Bank shadow strips top + bottom (just frames the channel — implies depth)
  g.fillStyle(0x3a2818, 0.6);
  g.fillRect(0, 0, w, 2);
  g.fillRect(0, h - 2, w, 2);

  g.generateTexture('hazard_burn_water', w, h);
  g.destroy();
}

export function bakeHazardLooseScree(scene: Phaser.Scene): void {
  const w = 28, h = 22;
  const g = scene.add.graphics();
  const cx = w / 2;

  // Slope ground tone — desaturated mountain grey-brown wash
  g.fillStyle(0x4a4038, 0.55);
  g.fillEllipse(cx, h / 2 + 1, 26, 18);

  // Larger anchor rock mid-slope (the focal pip) — secondary focal hierarchy
  g.fillStyle(0x2a2a30, 1);
  g.fillEllipse(cx - 1, 9, 5, 4);
  g.fillStyle(0x4a4a50, 1);
  g.fillEllipse(cx - 1, 8.5, 3.5, 2.5);
  g.fillStyle(0x6a6a72, 0.8);
  g.fillCircle(cx - 2, 7.5, 0.8);

  // Static scree chips — varied sizes, scattered upper field
  // (8 chips to seed the field, then 4 cascade chips below)
  // Upper-left cluster
  g.fillStyle(0x5a4a3a, 1);
  g.fillRect(3, 4, 2, 2);
  g.fillStyle(0x4a4a50, 1);
  g.fillRect(7, 5, 2, 1);
  g.fillStyle(0x6a5a48, 1);
  g.fillRect(5, 8, 1, 1);
  // Upper-right cluster
  g.fillStyle(0x5a4a3a, 1);
  g.fillRect(20, 3, 2, 2);
  g.fillStyle(0x4a4a50, 1);
  g.fillRect(23, 6, 1, 2);
  g.fillStyle(0x6a5a48, 1);
  g.fillRect(19, 7, 1, 1);
  // Mid-row scatter
  g.fillStyle(0x5a4a3a, 1);
  g.fillRect(11, 11, 1, 1);
  g.fillStyle(0x4a4a50, 1);
  g.fillRect(17, 10, 2, 1);

  // Cascade chips with motion ticks — the slipping warning
  // Chip A (cascading from anchor)
  g.fillStyle(0x6a5a48, 1);
  g.fillRect(8, 14, 2, 2);
  g.fillStyle(0x4a4038, 0.6);
  g.fillRect(8, 16, 2, 1); // motion tick (tiny dust trail beneath)
  g.fillRect(8, 17, 1, 1);
  // Chip B
  g.fillStyle(0x5a4a3a, 1);
  g.fillRect(13, 15, 1, 1);
  g.fillStyle(0x4a4038, 0.6);
  g.fillRect(13, 16, 1, 1);
  g.fillRect(13, 17, 1, 1);
  // Chip C
  g.fillStyle(0x4a4a50, 1);
  g.fillRect(17, 14, 2, 1);
  g.fillStyle(0x4a4038, 0.6);
  g.fillRect(17, 15, 2, 1);
  g.fillRect(18, 16, 1, 1);
  // Chip D (smallest, furthest down)
  g.fillStyle(0x6a5a48, 1);
  g.fillRect(11, 17, 1, 1);

  // Dust haze below the cascade band — the puff of air kicked up by the slip
  g.fillStyle(0x8a7a68, 0.35);
  g.fillEllipse(cx, h - 3, 14, 3);
  g.fillStyle(0xa89888, 0.25);
  g.fillEllipse(cx + 1, h - 4, 10, 2);

  g.generateTexture('hazard_loose_scree', w, h);
  g.destroy();
}
