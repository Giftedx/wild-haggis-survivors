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

export function bakeHazardTidalWrack(scene: Phaser.Scene): void {
  const w = 36, h = 24;
  const g = scene.add.graphics();
  const cx = w / 2, cy = h / 2;

  // Wet-sand base wash — the tide-line where wrack settles
  g.fillStyle(0x6a5a48, 0.55);
  g.fillEllipse(cx, cy + 1, 32, 18);
  g.fillStyle(0x8a7a60, 0.4);
  g.fillEllipse(cx + 1, cy, 26, 12);

  // Dark kelp tangle — main mass, draped asymmetric (deeper to the east)
  g.fillStyle(0x1a2818, 1);
  g.fillEllipse(cx + 2, cy + 1, 22, 8);
  g.fillStyle(0x2a4028, 1);
  g.fillEllipse(cx + 1, cy, 18, 6);

  // Frond strands — the warning silhouette (this is what you trip on)
  // West frond (long, twisted)
  g.fillStyle(0x2a4028, 1);
  g.fillRect(cx - 10, cy - 2, 6, 1);
  g.fillRect(cx - 12, cy - 1, 4, 1);
  g.fillRect(cx - 13, cy, 3, 1);
  // North frond (curl up)
  g.fillStyle(0x355030, 1);
  g.fillRect(cx - 2, cy - 6, 1, 4);
  g.fillRect(cx - 3, cy - 7, 2, 1);
  g.fillRect(cx - 1, cy - 8, 2, 1);
  // East frond (longest — reaches into hitbox edge)
  g.fillStyle(0x2a4028, 1);
  g.fillRect(cx + 6, cy - 1, 8, 1);
  g.fillRect(cx + 12, cy, 4, 1);
  g.fillStyle(0x355030, 1);
  g.fillRect(cx + 14, cy + 1, 2, 1);

  // Kelp bladders — the green glossy node-bumps along the strands
  g.fillStyle(0x4a6a3a, 1);
  g.fillCircle(cx - 6, cy - 1, 1.2);
  g.fillCircle(cx + 4, cy + 2, 1.4);
  g.fillCircle(cx + 8, cy - 0.5, 1.1);
  g.fillStyle(0x6a8a4a, 0.85);
  g.fillCircle(cx - 6, cy - 1.5, 0.6);
  g.fillCircle(cx + 4, cy + 1.5, 0.7);

  // Foam-line specks along the upper edge — the tide left these
  g.fillStyle(0xeeeef0, 0.85);
  g.fillCircle(cx - 8, cy - 5, 0.7);
  g.fillCircle(cx - 3, cy - 5, 0.5);
  g.fillCircle(cx + 5, cy - 5, 0.6);
  g.fillCircle(cx + 11, cy - 4, 0.5);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx - 8, cy - 5.5, 0.4);

  // Tiny shell scatter (warning detail — tiny tells in the silhouette)
  g.fillStyle(0xc8b89a, 1);
  g.fillRect(cx - 4, cy + 4, 1, 1);
  g.fillRect(cx + 6, cy + 4, 1, 1);
  g.fillStyle(0xa89880, 1);
  g.fillRect(cx + 2, cy + 5, 1, 1);

  // Wet sheen — gloss on the central kelp (light catches here)
  g.fillStyle(0x6a8a5a, 0.5);
  g.fillEllipse(cx + 2, cy - 1, 8, 1.5);

  g.generateTexture('hazard_tidal_wrack', w, h);
  g.destroy();
}

export function bakeHazardSlickCobble(scene: Phaser.Scene): void {
  const w = 26, h = 22;
  const g = scene.add.graphics();
  const cx = w / 2, cy = h / 2;

  // Wet ground halo (fog-condensed moisture pooled around the stones)
  g.fillStyle(0x4a5260, 0.4);
  g.fillEllipse(cx, cy + 1, 24, 16);
  g.fillStyle(0x5a6270, 0.3);
  g.fillEllipse(cx, cy, 18, 10);

  // Three cobbles — irregular, polished smooth
  // Largest centre cobble
  g.fillStyle(0x282c34, 1);
  g.fillEllipse(cx, cy + 1, 12, 8);
  g.fillStyle(0x4a5060, 1);
  g.fillEllipse(cx - 0.5, cy, 9, 6);
  g.fillStyle(0x6a7282, 0.9);
  g.fillEllipse(cx - 1, cy - 1, 5, 3);
  // Wet sheen on top — high specular
  g.fillStyle(0xc8d4e0, 0.6);
  g.fillEllipse(cx - 1.5, cy - 1.5, 3, 1);
  g.fillStyle(0xeef0f5, 0.85);
  g.fillEllipse(cx - 2, cy - 2, 1.5, 0.5);

  // Left smaller cobble
  g.fillStyle(0x282c34, 1);
  g.fillEllipse(cx - 8, cy + 2, 6, 4);
  g.fillStyle(0x4a5060, 1);
  g.fillEllipse(cx - 8, cy + 1.5, 4.5, 3);
  g.fillStyle(0x8a92a2, 0.55);
  g.fillEllipse(cx - 8.5, cy + 0.5, 2, 1);

  // Right smaller cobble
  g.fillStyle(0x282c34, 1);
  g.fillEllipse(cx + 8, cy + 2, 5, 3.5);
  g.fillStyle(0x4a5060, 1);
  g.fillEllipse(cx + 8, cy + 1.5, 3.5, 2.5);
  g.fillStyle(0x8a92a2, 0.55);
  g.fillEllipse(cx + 7.5, cy + 0.5, 1.5, 0.7);

  // Water droplets on stones — the slip warning
  g.fillStyle(0xd8e0ee, 0.85);
  g.fillCircle(cx + 1, cy - 0.5, 0.7);
  g.fillCircle(cx - 7, cy + 0.5, 0.5);
  g.fillCircle(cx + 9, cy + 0.5, 0.5);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx + 1, cy - 1, 0.3);

  // Faint mist tendrils rising from the wet ground (sells the haar)
  g.fillStyle(0xaab0c0, 0.3);
  g.fillCircle(cx - 4, cy - 6, 1.5);
  g.fillCircle(cx + 5, cy - 7, 1.3);
  g.fillStyle(0xc0c8d8, 0.22);
  g.fillCircle(cx - 4, cy - 7.5, 1);
  g.fillCircle(cx + 5, cy - 8.5, 0.8);

  // Tiny green-black moss fleck between cobbles (damp-loving)
  g.fillStyle(0x2a3a28, 0.85);
  g.fillCircle(cx - 4, cy + 3, 0.6);
  g.fillCircle(cx + 4, cy + 3, 0.5);

  g.generateTexture('hazard_slick_cobble', w, h);
  g.destroy();
}

export function bakeHazardRimePatch(scene: Phaser.Scene): void {
  const w = 30, h = 24;
  const g = scene.add.graphics();
  const cx = w / 2, cy = h / 2;

  // Frost halo on the surrounding ground — pale wash showing the rime
  // bloom radius beyond the stone edge
  g.fillStyle(0xc8d0e0, 0.35);
  g.fillEllipse(cx, cy + 1, 28, 18);
  g.fillStyle(0xeef2f8, 0.25);
  g.fillEllipse(cx, cy, 22, 12);

  // Dark stone base — Cairngorm granite undertone
  g.fillStyle(0x2a2c34, 1);
  g.fillEllipse(cx, cy + 1, 20, 11);
  g.fillStyle(0x4a4c56, 1);
  g.fillEllipse(cx, cy, 16, 8);
  g.fillStyle(0x6a6c78, 0.85);
  g.fillEllipse(cx - 1, cy - 1, 11, 4);

  // Rime crystals — radial spike pattern around the centre
  // Long needles sprouting outward (the frost-bloom motif)
  const needles: ReadonlyArray<readonly [number, number, number, number]> = [
    // [angle-deg, length, baseR, tipR]
    [0, 6, 1.0, 0.3],
    [45, 5, 0.8, 0.3],
    [90, 5.5, 0.9, 0.3],
    [135, 5, 0.8, 0.3],
    [180, 6, 1.0, 0.3],
    [225, 4.5, 0.7, 0.3],
    [270, 4, 0.7, 0.3],
    [315, 5, 0.8, 0.3],
  ];
  g.fillStyle(0xeef2f8, 1);
  for (const [angDeg, len, baseR] of needles) {
    const ang = (angDeg * Math.PI) / 180;
    // Rough spike — single elongated triangle approximated by stacked
    // ellipses from base to tip.
    const segments = 4;
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const r = baseR * (1 - t);
      const x = cx + Math.cos(ang) * (3 + len * t);
      const y = cy + Math.sin(ang) * (2 + len * t);
      g.fillCircle(x, y, r);
    }
  }
  // Brighter highlight on the top-half spikes (light from above)
  g.fillStyle(0xffffff, 0.85);
  for (const [angDeg, len, baseR] of needles) {
    if (angDeg > 180) continue; // skip lower-half
    const ang = (angDeg * Math.PI) / 180;
    const x = cx + Math.cos(ang) * (3 + len * 0.4);
    const y = cy + Math.sin(ang) * (2 + len * 0.4);
    g.fillCircle(x, y, baseR * 0.5);
  }

  // Centre frost cluster — densest crystal mass
  g.fillStyle(0xeef2f8, 1);
  g.fillCircle(cx, cy, 2.2);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 0.5, cy - 0.5, 1.3);
  g.fillStyle(0xc0d0e0, 0.5);
  g.fillCircle(cx + 0.5, cy + 0.5, 1);

  // Tiny tooth-edge crystals along stone rim
  g.fillStyle(0xeef2f8, 0.9);
  g.fillRect(cx - 9, cy + 4, 1, 1);
  g.fillRect(cx + 8, cy + 3, 1, 1);
  g.fillRect(cx - 6, cy - 5, 1, 1);
  g.fillRect(cx + 5, cy - 5, 1, 1);

  // Cold-blue undershadow (sells the freeze-reads-as-bite)
  g.fillStyle(0x4a6080, 0.4);
  g.fillEllipse(cx, cy + 5, 14, 2);

  g.generateTexture('hazard_rime_patch', w, h);
  g.destroy();
}

// Highland Horrors — Cairngorm Plateau hazard.
// Wind shear: a rotor turbulence icon. Tight, directional, dangerous-
// looking. Slate-grey spiralling lines that imply sudden gust.
export function bakeHazardWindShear(scene: Phaser.Scene): void {
  const w = 22, h = 22;
  const g = scene.add.graphics();
  const cx = w / 2, cy = h / 2;

  // Outer gust ring — pale slate
  g.fillStyle(0x9aacb8, 0.30);
  g.fillCircle(cx, cy, 10);

  // Mid ring — colder grey
  g.fillStyle(0xb8c8d4, 0.45);
  g.fillCircle(cx, cy, 7);

  // Core — bright white-blue
  g.fillStyle(0xe0eef6, 0.75);
  g.fillCircle(cx, cy, 4);
  g.fillStyle(0xffffff, 0.90);
  g.fillCircle(cx, cy, 2);

  // Directional streaks — 3 gust lines radiating at angles
  g.fillStyle(0xb8c8d4, 0.70);
  // Streak NW→SE
  g.fillRect(cx - 9, cy - 2, 18, 1.5);
  // Streak NE
  g.fillRect(cx - 2, cy - 9, 1.5, 18);
  // Diagonal hint
  g.fillStyle(0xd0dce6, 0.50);
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2 + 0.4;
    const r1 = 5, r2 = 9;
    g.fillRect(
      cx + Math.cos(ang) * r1 - 0.5,
      cy + Math.sin(ang) * r1 - 0.5,
      Math.cos(ang) * (r2 - r1),
      1,
    );
  }

  g.generateTexture('hazard_wind_shear', w, h);
  g.destroy();
}

// Highland Horrors — Glen Coe hazard.
// Highland mist: a soft, wide mist pool. Pale off-white with warm grey
// edges — the valley mist that settles on the river floor.
export function bakeHazardHighlandMist(scene: Phaser.Scene): void {
  const w = 44, h = 30;
  const g = scene.add.graphics();
  const cx = w / 2, cy = h / 2;

  // Outer mist halo — very faint
  g.fillStyle(0xd8d0c8, 0.22);
  g.fillEllipse(cx, cy, 42, 28);

  // Mid mist body
  g.fillStyle(0xe0d8d0, 0.38);
  g.fillEllipse(cx, cy, 34, 22);

  // Inner mist — slightly brighter
  g.fillStyle(0xece8e0, 0.55);
  g.fillEllipse(cx, cy, 24, 14);

  // Core — pale bone white
  g.fillStyle(0xf4f0ea, 0.70);
  g.fillEllipse(cx, cy, 14, 8);

  // Wisps trailing on the edges — 3 asymmetric tendrils
  g.fillStyle(0xe0d8d0, 0.30);
  g.fillEllipse(cx - 14, cy + 2, 10, 4);
  g.fillEllipse(cx + 13, cy - 2, 9, 3);
  g.fillEllipse(cx + 3, cy + 8, 8, 3);

  g.generateTexture('hazard_highland_mist', w, h);
  g.destroy();
}

// Clyde Shipyard — molten slag pool from the dry-dock floor.
// Glowing orange-red puddle of liquid metal runoff. Bright core (0xff6820),
// darker rust-crust ring (0x8a2800), black slag collar, spark scatter.
// Silhouette: unmistakably hot — the glow gradient reads at a glance.
export function bakeHazardMoltenSlag(scene: Phaser.Scene): void {
  const w = 30, h = 24;
  const g = scene.add.graphics();
  const cx = w / 2, cy = h / 2;

  // Black slag crust — outermost ring, the cooling edge
  g.fillStyle(0x1a0a02, 1);
  g.fillEllipse(cx, cy + 1, 28, 18);

  // Dark rust outer — first cooling layer
  g.fillStyle(0x5a1800, 1);
  g.fillEllipse(cx, cy, 24, 14);

  // Mid rust ring — still cooling
  g.fillStyle(0x8a2800, 1);
  g.fillEllipse(cx - 0.5, cy - 0.5, 20, 11);

  // Warm orange pool — the main liquid mass
  g.fillStyle(0xc84000, 1);
  g.fillEllipse(cx, cy - 1, 16, 8.5);

  // Hot orange centre — peak temperature
  g.fillStyle(0xff6820, 1);
  g.fillEllipse(cx + 0.5, cy - 1.5, 11, 6);

  // Bright core — near-white-orange at the hottest point
  g.fillStyle(0xff9848, 0.90);
  g.fillEllipse(cx - 0.5, cy - 2, 6, 3);
  g.fillStyle(0xffe0a0, 0.70);
  g.fillEllipse(cx, cy - 2.5, 3, 1.5);

  // Spark scatter — 7 sparks at varying distances
  g.fillStyle(0xffcc60, 1);
  g.fillCircle(cx - 10, cy - 6, 0.9);
  g.fillCircle(cx + 11, cy - 5, 0.8);
  g.fillCircle(cx - 7, cy + 6, 0.7);
  g.fillCircle(cx + 9, cy + 5, 0.9);
  g.fillCircle(cx - 13, cy - 1, 0.6);
  g.fillStyle(0xffeecc, 0.85);
  g.fillCircle(cx + 13, cy + 1, 0.5);
  g.fillCircle(cx + 3, cy - 8, 0.6);

  // Tiny ember dots on the slag crust
  g.fillStyle(0xcc4800, 0.70);
  g.fillCircle(cx - 11, cy + 2, 0.5);
  g.fillCircle(cx + 10, cy + 3, 0.5);

  g.generateTexture('hazard_molten_slag', w, h);
  g.destroy();
}

// Black Bog — ink pool from compressed peat water.
// Near-black wide oval, iridescent blue-purple sheen on the surface.
// Silhouette: a dark mirror that holds no reflection — the absence of
// light is the warning. Faint oil-slick shimmer distinguishes it from
// shadow on the ground.
export function bakeHazardInkPool(scene: Phaser.Scene): void {
  const w = 44, h = 30;
  const g = scene.add.graphics();
  const cx = w / 2, cy = h / 2;

  // Ground shadow — ink bleeds into the peat around it
  g.fillStyle(0x0a0508, 0.55);
  g.fillEllipse(cx, cy + 1, 42, 26);

  // Outer ink body — near-black
  g.fillStyle(0x100808, 1);
  g.fillEllipse(cx, cy, 38, 22);

  // Mid depth — slightly bluer black (the peat is deeper here)
  g.fillStyle(0x0c0810, 1);
  g.fillEllipse(cx - 1, cy - 1, 32, 17);

  // Inner pool — the bottomless dark
  g.fillStyle(0x080612, 1);
  g.fillEllipse(cx, cy - 0.5, 24, 12);

  // Iridescent sheen: blue-purple oil slick on the surface
  // The sheen sits off-centre (east-north) — where light catches a pool
  g.fillStyle(0x4a2878, 0.30);
  g.fillEllipse(cx + 5, cy - 3, 16, 7);
  g.fillStyle(0x3a1860, 0.20);
  g.fillEllipse(cx + 7, cy - 4, 10, 4);

  // Blue shimmer highlights — iridescent peak
  g.fillStyle(0x8050c0, 0.22);
  g.fillEllipse(cx + 6, cy - 4, 7, 2.5);
  g.fillStyle(0xb080e8, 0.16);
  g.fillEllipse(cx + 7, cy - 4.5, 4, 1.2);

  // Tiny specular fleck — the only bright point on the whole hazard
  g.fillStyle(0xd8c0f0, 0.50);
  g.fillCircle(cx + 8, cy - 5, 0.8);
  g.fillStyle(0xffffff, 0.35);
  g.fillCircle(cx + 8.5, cy - 5.5, 0.4);

  // Edge detail: a slight lighter seam on the west bank (where peat
  // meets water — wet exposed edge, barely distinguishable)
  g.fillStyle(0x1c1018, 0.70);
  g.fillEllipse(cx - 14, cy + 1, 6, 3);

  g.generateTexture('hazard_ink_pool', w, h);
  g.destroy();
}

// Ben Nevis Summit — sudden gust pocket on the exposed plateau.
// A compact spinning air column: pale grey-blue concentric rings, a bright
// white core, and three short directional streaks showing the rotor rotation.
// Smaller than wind_shear (22 px) — tighter rotor, higher damage per hit.
export function bakeHazardSummitGust(scene: Phaser.Scene): void {
  const w = 22, h = 22;
  const g = scene.add.graphics();
  const cx = w / 2, cy = h / 2;

  // Outer rotor ring — pale sky blue
  g.fillStyle(0xa8c0d8, 0.25);
  g.fillCircle(cx, cy, 10);

  // Mid ring — colder blue-white
  g.fillStyle(0xc8dcea, 0.42);
  g.fillCircle(cx, cy, 7);

  // Inner column — bright grey-white
  g.fillStyle(0xe8f2fa, 0.72);
  g.fillCircle(cx, cy, 4);

  // Core flash — pure white, the rotor eye
  g.fillStyle(0xffffff, 0.92);
  g.fillCircle(cx, cy, 2);

  // Three rotation streaks (angled east-southeast — prevailing wind direction)
  g.lineStyle(1.5, 0xb0ccde, 0.70);
  const angles = [0.5, 2.6, 4.7]; // roughly E, SW, N offset
  for (const a of angles) {
    const r1 = 4, r2 = 9;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    g.lineTo(cx + Math.cos(a + 0.3) * r2, cy + Math.sin(a + 0.3) * r2);
    g.strokePath();
  }

  g.generateTexture('hazard_summit_gust', w, h);
  g.destroy();
}

// Glasgow Close — Buckfast bottle-pool on the flagstone close-floor.
// A puddled amber-tonic spill around a stubby dark-green bottle: the bottle
// lies on its side (dark glass cylinder), the liquid spreads in an amber
// teardrop to the east. Broken glass glints catch the sodium-light.
// Silhouette: asymmetric — bottle bulk west, liquid spill east.
export function bakeHazardBuckfastPool(scene: Phaser.Scene): void {
  const w = 30, h = 24;
  const g = scene.add.graphics();
  const cx = w / 2, cy = h / 2;

  // Ground shadow — sticky liquid clings to the flagstone
  g.fillStyle(0x3a1800, 0.50);
  g.fillEllipse(cx + 3, cy + 1, 26, 16);

  // Main liquid pool — amber tonic, spreading east
  g.fillStyle(0xc86000, 0.82);
  g.fillEllipse(cx + 4, cy, 22, 13);

  // Lighter amber highlight — sodium-light catch on the surface
  g.fillStyle(0xe88020, 0.60);
  g.fillEllipse(cx + 5, cy - 1, 15, 7);
  g.fillStyle(0xf0a040, 0.40);
  g.fillEllipse(cx + 6, cy - 1.5, 9, 4);

  // Bottle body — dark green glass, lying on its side (pointing west)
  g.fillStyle(0x1a4010, 1);
  g.fillRoundedRect(cx - 12, cy - 3, 14, 6, 3);

  // Bottle neck
  g.fillStyle(0x143008, 1);
  g.fillRoundedRect(cx - 14, cy - 1.5, 4, 3, 1);

  // Glass shards — two tiny glints near the bottle mouth
  g.fillStyle(0xd0e8b0, 0.75);
  g.fillRect(cx - 15, cy + 2, 2, 1);
  g.fillRect(cx - 10, cy + 3, 1.5, 1);

  // Specular highlight on bottle glass
  g.fillStyle(0x60b840, 0.35);
  g.fillEllipse(cx - 7, cy - 2, 5, 2);

  g.generateTexture('hazard_buckfast_pool', w, h);
  g.destroy();
}

// Fingal's Cave — fractured basalt column crack.
// Dark hexagonal column face split by a stress fracture, wet with spray.
// Silhouette: angular crack across a dark geometric shape — unmistakably
// structural failure, not organic ground. Blue-grey basalt, white seafoam
// seeping into the crack.
export function bakeHazardBasaltCrack(scene: Phaser.Scene): void {
  const w = 22, h = 22;
  const g = scene.add.graphics();
  const cx = w / 2, cy = h / 2;

  // Outer shadow halo on the column face
  g.fillStyle(0x0a1218, 0.50);
  g.fillCircle(cx, cy, 10);

  // Basalt column face — dark blue-grey, hexagonal approximated as a circle
  g.fillStyle(0x1e2a36, 1);
  g.fillCircle(cx, cy, 9);
  g.fillStyle(0x2a3a48, 1);
  g.fillCircle(cx, cy, 7);

  // Column tonal layers — the basalt is not uniform
  g.fillStyle(0x344858, 0.70);
  g.fillEllipse(cx - 1, cy - 1, 9, 6);

  // Main fracture crack — diagonal NW→SE, irregular width
  g.fillStyle(0x080e14, 1);
  g.fillRect(cx - 6, cy - 4, 2, 2);
  g.fillRect(cx - 5, cy - 2, 2, 2);
  g.fillRect(cx - 4, cy, 2, 2);
  g.fillRect(cx - 3, cy + 2, 2, 2);
  g.fillRect(cx - 1, cy + 3, 2, 2);
  g.fillRect(cx + 1, cy + 4, 1, 1);

  // Secondary hairline crack branching off NE
  g.fillStyle(0x0c1620, 0.85);
  g.fillRect(cx - 3, cy - 1, 1, 1);
  g.fillRect(cx - 2, cy - 2, 1, 1);
  g.fillRect(cx, cy - 3, 1, 1);

  // Seafoam seeping into the crack — the cave is wet
  g.fillStyle(0xe0ecf4, 0.65);
  g.fillCircle(cx - 5, cy - 3, 0.9);
  g.fillCircle(cx - 2, cy + 1, 0.7);
  g.fillStyle(0xffffff, 0.45);
  g.fillCircle(cx - 5, cy - 3.5, 0.4);

  // Basalt highlight — light catches the top-left column face
  g.fillStyle(0x4a6070, 0.45);
  g.fillEllipse(cx - 2, cy - 3, 7, 3);
  g.fillStyle(0x6a8090, 0.25);
  g.fillEllipse(cx - 3, cy - 4, 4, 1.5);

  // Water sheen on the column surface
  g.fillStyle(0x4a8ab0, 0.18);
  g.fillEllipse(cx + 2, cy - 1, 6, 4);

  g.generateTexture('hazard_basalt_crack', w, h);
  g.destroy();
}

// Callanish Standing Stones — alignment energy ring.
// A faint ley-line pulse radiating from a standing stone's base: concentric
// pale-violet rings, a bright violet-white centre. Distinct from wind_shear /
// summit_gust (those are grey-blue mechanical). Neolithic purple register.
export function bakeHazardStoneRing(scene: Phaser.Scene): void {
  const w = 26, h = 26;
  const g = scene.add.graphics();
  const cx = w / 2, cy = h / 2;

  // Outer ley ring — very faint violet wash
  g.fillStyle(0x6050a0, 0.18);
  g.fillCircle(cx, cy, 12);

  // Mid ring — stronger violet
  g.fillStyle(0x8070c0, 0.30);
  g.fillCircle(cx, cy, 9);

  // Inner ring — bright violet-purple
  g.fillStyle(0xa890e0, 0.50);
  g.fillCircle(cx, cy, 6);

  // Core pulse — near-white violet, the discharge point
  g.fillStyle(0xd0c0f8, 0.75);
  g.fillCircle(cx, cy, 3.5);
  g.fillStyle(0xf0eaff, 0.90);
  g.fillCircle(cx, cy, 2);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(cx, cy, 1);

  // Stone silhouette at the base of the ring — a small upright rect
  // The ring radiates from where the stone meets the earth
  g.fillStyle(0x2a2038, 1);
  g.fillRect(cx - 2, cy + 3, 4, 5);
  g.fillStyle(0x3a3050, 1);
  g.fillRect(cx - 1.5, cy + 3, 3, 4);

  // Ley tendrils — 4 faint radial wisps at cardinal angles
  g.fillStyle(0x9080d0, 0.22);
  g.fillRect(cx - 0.5, cy - 12, 1, 5);
  g.fillRect(cx - 0.5, cy + 7, 1, 5);
  g.fillRect(cx - 12, cy - 0.5, 5, 1);
  g.fillRect(cx + 7, cy - 0.5, 5, 1);

  g.generateTexture('hazard_stone_ring', w, h);
  g.destroy();
}

// Trossachs Forest — exposed root trip across the deer trail.
// A gnarled oak root arching above the path: brown-earth base, darker root
// body, pale worn wood at the arch crest. Silhouette: curved horizontal
// obstacle. The root is obvious once you look; the haggis was distracted.
export function bakeHazardRootTrip(scene: Phaser.Scene): void {
  const w = 28, h = 18;
  const g = scene.add.graphics();
  const cy = h / 2;

  // Muddy trail shadow beneath the root
  g.fillStyle(0x2a1e10, 0.45);
  g.fillEllipse(14, cy + 3, 24, 7);

  // Earth around the root — wet woodland soil
  g.fillStyle(0x3a2a18, 0.65);
  g.fillEllipse(14, cy + 2, 26, 10);

  // Root body — arching upward. Built as a thick curved band using
  // stacked filled circles along the arc.
  g.fillStyle(0x4a2e14, 1);
  // Left anchor into soil
  g.fillEllipse(3, cy + 2, 5, 4);
  // Arch rising left
  g.fillEllipse(7, cy, 5, 5);
  g.fillEllipse(11, cy - 2, 5, 4);
  // Crown of the arch
  g.fillEllipse(14, cy - 3, 5, 4);
  // Arch descending right
  g.fillEllipse(17, cy - 2, 5, 4);
  g.fillEllipse(21, cy, 5, 5);
  // Right anchor into soil
  g.fillEllipse(25, cy + 2, 5, 4);

  // Root surface highlight — worn pale wood at the arch crest
  g.fillStyle(0x8a6040, 1);
  g.fillEllipse(7, cy - 0.5, 3, 3);
  g.fillEllipse(11, cy - 2.5, 3, 2.5);
  g.fillEllipse(14, cy - 3.5, 3, 2.5);
  g.fillEllipse(17, cy - 2.5, 3, 2.5);
  g.fillEllipse(21, cy - 0.5, 3, 3);

  // Pale crest — where countless hooves have worn the bark smooth
  g.fillStyle(0xc09870, 0.70);
  g.fillEllipse(11, cy - 3, 2, 1.5);
  g.fillEllipse(14, cy - 4, 2, 1.5);
  g.fillEllipse(17, cy - 3, 2, 1.5);

  // Moss patches on the root sides — damp woodland
  g.fillStyle(0x3a5030, 0.65);
  g.fillCircle(5, cy + 1, 1.2);
  g.fillCircle(23, cy + 1, 1.1);
  g.fillCircle(9, cy - 1, 0.8);

  // Loose dead leaf at the root base — forest floor detail
  g.fillStyle(0x6a4820, 0.80);
  g.fillEllipse(2, cy + 4, 3, 1.5);
  g.fillStyle(0x8a6030, 0.65);
  g.fillEllipse(25, cy + 4, 3, 1.5);

  g.generateTexture('hazard_root_trip', w, h);
  g.destroy();
}

// ── B8 hazards ────────────────────────────────────────────────────────────────

/** Edinburgh Old Town — cobble_gap: missing Royal Mile cobblestone.
 *  A roughly-rectangular dark void in grey cobble, with loose mortar crumble. */
export function bakeHazardCobbleGap(scene: Phaser.Scene): void {
  const w = 22, h = 18;
  const g = scene.add.graphics();

  // Cobble surround — Edinburgh sandstone grey
  g.fillStyle(0x8a8890, 1);
  g.fillRect(0, 0, w, h);

  // Mortar lines
  g.fillStyle(0x6a6870, 1);
  g.fillRect(0, 6, w, 1);
  g.fillRect(0, 12, w, 1);
  g.fillRect(7, 0, 1, h);
  g.fillRect(15, 0, 1, h);

  // The gap — dark absence where a stone is missing
  g.fillStyle(0x181820, 1);
  g.fillRect(4, 3, 14, 12);

  // Loose grit at gap edge
  g.fillStyle(0x5a5860, 0.75);
  g.fillRect(4, 3, 14, 1);
  g.fillRect(4, 14, 14, 1);

  // Damp shimmer at gap base
  g.fillStyle(0x303040, 0.55);
  g.fillRect(7, 10, 8, 3);

  g.generateTexture('hazard_cobble_gap', w, h);
  g.destroy();
}

/** Cairngorm Woods — fallen_pine: downed Caledonian pine across the trail. */
export function bakeHazardFallenPine(scene: Phaser.Scene): void {
  const w = 36, h = 16;
  const g = scene.add.graphics();
  const cy = h / 2;

  // Shadow beneath trunk
  g.fillStyle(0x1a2a18, 0.35);
  g.fillEllipse(18, cy + 2, 34, 10);

  // Main trunk — old Caledonian pine, red-brown bark
  g.fillStyle(0x5a3820, 1);
  g.fillEllipse(18, cy, 34, 9);
  // Heartwood lighter stripe
  g.fillStyle(0x7a5030, 1);
  g.fillEllipse(18, cy - 0.5, 30, 5);

  // Bark texture — dark furrow lines
  g.fillStyle(0x3a2010, 0.70);
  g.fillRect(6, cy - 1, 2, 2);
  g.fillRect(14, cy - 2, 2, 4);
  g.fillRect(22, cy - 1, 2, 3);
  g.fillRect(30, cy - 1, 2, 2);

  // Broken-end splintering on left
  g.fillStyle(0x9a6840, 1);
  g.fillRect(0, cy - 2, 4, 1);
  g.fillRect(0, cy + 1, 3, 1);
  g.fillStyle(0xba8860, 0.80);
  g.fillRect(0, cy - 1, 2, 2);

  // Small pine cone beside trunk
  g.fillStyle(0x4a3018, 1);
  g.fillEllipse(32, cy + 5, 4, 6);
  g.fillStyle(0x3a2010, 0.65);
  g.fillEllipse(32, cy + 4, 3, 2);

  g.generateTexture('hazard_fallen_pine', w, h);
  g.destroy();
}

/** Orkney Neolithic — standing_slab: toppled prehistoric standing stone. */
export function bakeHazardStandingSlab(scene: Phaser.Scene): void {
  const w = 28, h = 20;
  const g = scene.add.graphics();

  // Ground shadow
  g.fillStyle(0x445548, 0.35);
  g.fillEllipse(14, 17, 26, 7);

  // The slab — grey Orcadian sandstone lying flat, slightly angled
  g.fillStyle(0x8a8870, 1);
  g.fillRect(2, 6, 24, 10);
  // Stone face — lighter surface where sunlight hits
  g.fillStyle(0xaaaa90, 1);
  g.fillRect(3, 7, 22, 4);

  // Lichen patches — orange and grey-green
  g.fillStyle(0xcc8844, 0.60);
  g.fillCircle(8, 10, 2);
  g.fillCircle(20, 9, 1.5);
  g.fillStyle(0x7a9060, 0.55);
  g.fillCircle(15, 12, 2.5);
  g.fillCircle(6, 13, 1.5);

  // Carved cup-mark petroglyphs (faint)
  g.fillStyle(0x6a6858, 0.65);
  g.fillCircle(11, 9, 1.2);
  g.fillCircle(18, 11, 1.0);

  // Edge shadow giving slab depth
  g.fillStyle(0x5a5848, 0.80);
  g.fillRect(2, 15, 24, 1);

  g.generateTexture('hazard_standing_slab', w, h);
  g.destroy();
}
