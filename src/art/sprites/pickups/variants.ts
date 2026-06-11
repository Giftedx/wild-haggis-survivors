/**
 * Pickup variant sprites — clearer reward tiers with handcrafted
 * silhouettes per tier. The original keys stay intact so PickupSpawner
 * can swap them in without code changes.
 *
 * Rewrite pass (lift from 6 → target 8-9):
 *  - drawGem now does a 5-facet diamond with a soft alpha shadow on
 *    the lower-right facets and a bright wash on the upper-left,
 *    plus tip-spark pinpricks. Reads as a faceted jewel, not 4 hard
 *    triangles meeting at a point.
 *  - drawChest tier-shifts the METALS and INTERIOR accents per tier,
 *    not just the wood tone. Hearth = brass, fey = silver-amethyst,
 *    legendary = polished gold + ruby studs.
 *  - pickup_health_thistle: real botanical thistle (stem + leaves +
 *    calyx + floret crown) replacing the previous purple blob.
 *  - pickup_oatcake_glow: two-size oat speck distribution + crumb
 *    scatter so the bake reads textured.
 *  - pickup_gold_coin: thistle motif EMBOSSED on the coin face.
 */

import * as Phaser from 'phaser';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;
type ChestTint = 'hearth' | 'fey' | 'legendary';

export const PICKUP_VARIANT_KEYS = [
  'pickup_gold_coin',
  'pickup_chest_hearth',
  'pickup_chest_fey',
  'pickup_chest_legendary',
  'pickup_health_thistle',
  'pickup_xp_heather',
  'pickup_xp_loch',
  'pickup_oatcake_glow',
] as const;

function bake(scene: Phaser.Scene, key: string, size: number, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, size, size);
  g.destroy();
}

interface ChestPalette {
  halo: number;
  haloAlpha: number;
  woodOutline: number;
  wood: number;
  woodHi: number;
  metal: number;
  metalHi: number;
  metalDeep: number;
  accent: number;
  accentHi: number;
}

const CHEST_PALETTES: Record<ChestTint, ChestPalette> = {
  hearth: {
    halo: 0xffc840,
    haloAlpha: 0.16,
    woodOutline: 0x1c0c04,
    wood: 0x7a4810,
    woodHi: 0xa86c1a,
    metal: 0xc89030,
    metalHi: 0xfae484,
    metalDeep: 0x4a3008,
    accent: 0xc02828,
    accentHi: 0xff5050,
  },
  fey: {
    halo: 0xc090e8,
    haloAlpha: 0.22,
    woodOutline: 0x1c0a2a,
    wood: 0x4a2470,
    woodHi: 0x7a48a0,
    metal: 0xb0b8d8,
    metalHi: 0xeaf0ff,
    metalDeep: 0x32365a,
    accent: 0xa850ff,
    accentHi: 0xeaa8ff,
  },
  legendary: {
    halo: 0xffec88,
    haloAlpha: 0.28,
    woodOutline: 0x2a1808,
    wood: 0x88521a,
    woodHi: 0xc89230,
    metal: 0xffd040,
    metalHi: 0xfff0a8,
    metalDeep: 0x6a4810,
    accent: 0xc01818,
    accentHi: 0xff5050,
  },
};

function drawChest(g: Phaser.GameObjects.Graphics, tint: ChestTint): void {
  const cx = 16;
  const cy = 17;
  const p = CHEST_PALETTES[tint];

  // Outer halo — wider for legendary, gentler for hearth.
  g.fillStyle(p.halo, p.haloAlpha);
  g.fillCircle(cx, cy, 16);
  g.fillStyle(p.halo, p.haloAlpha + 0.08);
  g.fillCircle(cx, cy, 11);

  // Contact shadow.
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(cx, cy + 12, 22, 2.6);

  // Body silhouette.
  g.fillStyle(p.woodOutline, 1);
  g.fillRect(cx - 14, cy - 2, 28, 14);
  g.fillEllipse(cx, cy - 3, 29, 11);
  g.fillStyle(p.wood, 1);
  g.fillRect(cx - 13, cy - 1, 26, 12);
  // Lid arch — wood mid + brighter sliver.
  g.fillStyle(p.woodHi, 1);
  g.fillEllipse(cx, cy - 3, 25, 8);
  g.fillStyle(p.wood, 0.85);
  g.fillEllipse(cx, cy - 4, 19, 4);
  g.fillStyle(0xffffff, 0.45);
  g.fillEllipse(cx - 3, cy - 5, 8, 1.4);

  // Horizontal strap + tartan accent.
  g.fillStyle(p.metalDeep, 1);
  g.fillRect(cx - 14, cy + 2, 28, 3);
  g.fillStyle(p.metal, 1);
  g.fillRect(cx - 14, cy + 2.5, 28, 2);
  g.fillStyle(p.metalHi, 0.95);
  g.fillRect(cx - 14, cy + 2.5, 28, 0.6);
  // Vertical strap.
  g.fillStyle(p.metalDeep, 1);
  g.fillRect(cx - 1.5, cy - 8, 3, 19);
  g.fillStyle(p.metal, 1);
  g.fillRect(cx - 1, cy - 8, 2, 19);
  g.fillStyle(p.metalHi, 0.85);
  g.fillRect(cx - 0.8, cy - 8, 0.8, 19);

  // Lock plate.
  g.fillStyle(p.metalDeep, 1);
  g.fillRect(cx - 4, cy + 4, 8, 6);
  g.fillStyle(p.metal, 1);
  g.fillRect(cx - 3, cy + 5, 6, 4);
  g.fillStyle(p.metalHi, 0.85);
  g.fillRect(cx - 3, cy + 5, 6, 1);
  // Keyhole.
  g.fillStyle(p.woodOutline, 1);
  g.fillCircle(cx, cy + 6.4, 0.7);
  g.fillRect(cx - 0.25, cy + 6.4, 0.5, 1.4);

  // Per-tier accent decoration on the lid.
  if (tint === 'fey') {
    // Floating fae sparks on the lid.
    g.fillStyle(p.accent, 1);
    g.fillCircle(cx - 8, cy - 7, 1.2);
    g.fillCircle(cx + 8, cy - 6, 1);
    g.fillCircle(cx + 4, cy - 8, 0.8);
    g.fillStyle(p.accentHi, 0.95);
    g.fillCircle(cx - 8, cy - 7, 0.5);
    g.fillCircle(cx + 8, cy - 6, 0.4);
    g.fillCircle(cx + 4, cy - 8, 0.3);
    // Trailing wisps under the sparks.
    g.fillStyle(p.accent, 0.5);
    g.fillRect(cx - 8, cy - 5, 0.6, 1.6);
    g.fillRect(cx + 8, cy - 4, 0.6, 1.4);
  } else if (tint === 'legendary') {
    // Cross-of-light diadem on the lid.
    g.fillStyle(p.metalHi, 1);
    g.fillRect(cx - 1, cy - 13, 2, 5);
    g.fillRect(cx - 3, cy - 11, 6, 1);
    g.fillStyle(0xffffff, 0.85);
    g.fillRect(cx - 0.5, cy - 12.5, 1, 4);
    // Ruby corner studs.
    g.fillStyle(p.accent, 1);
    g.fillCircle(cx - 12, cy + 4, 1.2);
    g.fillCircle(cx + 12, cy + 4, 1.2);
    g.fillStyle(p.accentHi, 1);
    g.fillCircle(cx - 12.3, cy + 3.7, 0.5);
    g.fillCircle(cx + 11.7, cy + 3.7, 0.5);
    // Side glints.
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(cx - 13, cy - 2, 0.6, 3);
    g.fillRect(cx + 12.4, cy - 2, 0.6, 3);
  } else {
    // Hearth — brass corner studs only.
    g.fillStyle(p.metalDeep, 1);
    g.fillCircle(cx - 12, cy + 3.4, 1);
    g.fillCircle(cx + 12, cy + 3.4, 1);
    g.fillStyle(p.metal, 1);
    g.fillCircle(cx - 12, cy + 3.4, 0.7);
    g.fillCircle(cx + 12, cy + 3.4, 0.7);
    g.fillStyle(p.metalHi, 0.9);
    g.fillCircle(cx - 12.2, cy + 3.2, 0.3);
    g.fillCircle(cx + 11.8, cy + 3.2, 0.3);
  }
}

function drawGem(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  c1: number,
  c2: number,
  c3: number,
): void {
  // Outer glow.
  g.fillStyle(c1, 0.18);
  g.fillCircle(cx, cy, 11);
  g.fillStyle(c1, 0.28);
  g.fillCircle(cx, cy, 7.5);

  // Outline diamond (5-point — tip up, two sides, bottom point).
  g.fillStyle(0x101008, 1);
  g.fillTriangle(cx, cy - 9, cx - 8, cy, cx + 8, cy);
  g.fillTriangle(cx, cy + 9, cx - 8, cy, cx + 8, cy);

  // Upper-left bright facet (catching light).
  g.fillStyle(c2, 1);
  g.fillTriangle(cx, cy - 8, cx - 7, cy, cx, cy);
  // Upper-right mid facet.
  g.fillStyle(c1, 1);
  g.fillTriangle(cx, cy - 8, cx + 7, cy, cx, cy);
  // Lower-left mid facet.
  g.fillStyle(c1, 1);
  g.fillTriangle(cx, cy + 8, cx - 7, cy, cx, cy);
  // Lower-right shadow facet (darkest).
  g.fillStyle(c3, 1);
  g.fillTriangle(cx, cy + 8, cx + 7, cy, cx, cy);

  // Soft shadow overlays on lower facets — sells the rounded gem
  // surface instead of hard meeting points.
  g.fillStyle(c3, 0.45);
  g.fillTriangle(cx, cy + 8, cx, cy, cx + 7, cy);
  // Soft highlight overlay on upper-left facet.
  g.fillStyle(0xffffff, 0.32);
  g.fillTriangle(cx, cy - 8, cx - 4, cy - 2, cx - 1, cy - 4);

  // Centre fire — a diagonal cross to suggest internal refraction.
  g.fillStyle(c2, 0.8);
  g.fillRect(cx - 0.6, cy - 4, 1.2, 8);
  g.fillRect(cx - 4, cy - 0.6, 8, 1.2);

  // Specular pinprick + tip sparkles.
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 2, cy - 3, 1.3);
  g.fillRect(cx - 0.3, cy - 9.5, 0.7, 0.8);
  g.fillRect(cx - 8.6, cy - 0.3, 0.8, 0.7);
  g.fillRect(cx + 7.8, cy - 0.3, 0.8, 0.7);
  g.fillRect(cx - 0.3, cy + 8.6, 0.7, 0.8);
}

function drawHealthThistle(g: Phaser.GameObjects.Graphics): void {
  const cx = 12;
  const cy = 12;
  // Soft glow.
  g.fillStyle(0xff8438, 0.18);
  g.fillCircle(cx, cy, 11);
  // Health orb base — Irn-Bru orange (signature).
  g.fillStyle(0x5a2a04, 1);
  g.fillCircle(cx, cy, 9);
  g.fillStyle(0xee7818, 1);
  g.fillCircle(cx, cy, 8);
  g.fillStyle(0xffaa44, 0.95);
  g.fillCircle(cx - 2, cy - 2, 4);
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(cx - 3, cy - 3, 1.4);

  // Healing cross — bright cream, sits ON TOP of the orb.
  g.fillStyle(0xfff0dc, 1);
  g.fillRect(cx - 4, cy - 1, 9, 2.4);
  g.fillRect(cx - 0.2, cy - 4.5, 2.4, 9);
  // Cross drop-shadow.
  g.fillStyle(0x6a2a04, 0.6);
  g.fillRect(cx - 4, cy + 1.2, 9, 0.6);
  g.fillRect(cx + 0.6, cy - 4.5, 0.6, 9);

  // Mini THISTLE motif on the upper-right corner of the orb — a
  // small but unmistakable Scottish health-mark instead of the
  // previous blob.
  // Stem.
  g.fillStyle(0x1a3810, 1);
  g.fillRect(cx + 5.2, cy - 4, 0.6, 5);
  // Calyx globe.
  g.fillStyle(0x0a2810, 1);
  g.fillCircle(cx + 5.5, cy - 5, 1.4);
  g.fillStyle(0x2a5818, 1);
  g.fillCircle(cx + 5.5, cy - 5, 1.0);
  // Floret (purple bristles).
  g.fillStyle(0x6a28a8, 1);
  g.fillEllipse(cx + 5.5, cy - 6.4, 2.4, 1.0);
  g.fillStyle(0xa848e0, 1);
  g.fillRect(cx + 4.6, cy - 7.6, 0.4, 1);
  g.fillRect(cx + 5.4, cy - 8, 0.4, 1.2);
  g.fillRect(cx + 6.2, cy - 7.6, 0.4, 1);
  g.fillStyle(0xe890ff, 1);
  g.fillRect(cx + 5.4, cy - 8.4, 0.4, 0.5);
}

function drawGoldCoin(g: Phaser.GameObjects.Graphics): void {
  const cx = 9;
  const cy = 9;
  // Halo.
  g.fillStyle(0xffc840, 0.22);
  g.fillCircle(cx, cy, 8.5);
  // Outer rim.
  g.fillStyle(0x5a3a08, 1);
  g.fillCircle(cx, cy, 7);
  g.fillStyle(0x9a6818, 1);
  g.fillCircle(cx, cy, 6.4);
  g.fillStyle(0xffc840, 1);
  g.fillCircle(cx, cy, 5.6);
  // Coin face — slight gradient.
  g.fillStyle(0xffe080, 1);
  g.fillEllipse(cx - 1, cy - 1.5, 6, 4);
  g.fillStyle(0xfff0a8, 0.85);
  g.fillEllipse(cx - 1.5, cy - 2, 3.6, 2);
  // Embossed thistle motif — three purple dots in a triangle (bloom)
  // + green leaves below — barely there at 18px but reads as
  // "Scottish coin" under inspection.
  g.fillStyle(0x6a28a8, 0.85);
  g.fillCircle(cx - 0.8, cy - 0.8, 0.5);
  g.fillCircle(cx + 0.4, cy - 1.2, 0.5);
  g.fillCircle(cx - 1.4, cy + 0.2, 0.4);
  g.fillStyle(0x2a5818, 0.9);
  g.fillRect(cx - 1.4, cy + 0.6, 1.8, 0.5);
  // Edge specular.
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx - 2.6, cy - 2.6, 0.6);
  // Lower-edge shadow.
  g.fillStyle(0x6a4818, 0.7);
  g.fillRect(cx - 4, cy + 2.8, 8, 0.8);
  // Edge nick — tiny chip on the right edge.
  g.fillStyle(0x5a3a08, 1);
  g.fillRect(cx + 5.2, cy - 0.4, 0.6, 1.2);
}

function drawOatcake(g: Phaser.GameObjects.Graphics): void {
  const cx = 12;
  const cy = 12;
  // Halo.
  g.fillStyle(0xffd080, 0.2);
  g.fillCircle(cx, cy, 11);
  // Body — three-layer bake.
  g.fillStyle(0x5a3a18, 1);
  g.fillCircle(cx, cy, 8.4);
  g.fillStyle(0xc88a3c, 1);
  g.fillCircle(cx, cy, 7.6);
  g.fillStyle(0xe4ac60, 1);
  g.fillCircle(cx, cy, 6.6);
  // Brighter centre.
  g.fillStyle(0xf6cc7a, 0.95);
  g.fillCircle(cx - 1.5, cy - 1.5, 4);
  g.fillStyle(0xfae0a0, 0.85);
  g.fillEllipse(cx - 2, cy - 2, 3.4, 1.6);

  // Two-size oat speck distribution. Larger oats anchored, small
  // crumbs scattered between for texture.
  g.fillStyle(0x5a3a18, 0.85);
  // Bigger oats — about 1.2px across.
  const bigOats: Array<[number, number]> = [
    [4, 2],
    [-3, 4],
    [2, -3],
    [-4, -2],
    [4, -3],
  ];
  for (const [dx, dy] of bigOats) {
    g.fillEllipse(cx + dx, cy + dy, 1.4, 1.0);
  }
  // Small crumbs.
  g.fillStyle(0x6a4820, 0.75);
  const smallCrumbs: Array<[number, number]> = [
    [0, 1],
    [3, -1],
    [-2, -3],
    [1, 4],
    [-4, 1],
    [-1, -1],
    [4, 0],
    [-3, 3],
  ];
  for (const [dx, dy] of smallCrumbs) {
    g.fillCircle(cx + dx, cy + dy, 0.4);
  }
  // Bright crumb tops (where the bake was thicker).
  g.fillStyle(0xfae0a0, 0.85);
  g.fillCircle(cx + 4, cy + 2, 0.45);
  g.fillCircle(cx - 3, cy + 4, 0.4);
  g.fillCircle(cx + 2, cy - 3, 0.4);
  // Crack across the centre — the bake has split slightly.
  g.fillStyle(0x6a4818, 0.85);
  g.fillRect(cx - 4, cy + 0.4, 7, 0.4);
  g.fillRect(cx - 2, cy - 0.6, 4, 0.3);
}

export function bakePickupVariants(scene: Phaser.Scene): void {
  bake(scene, 'pickup_gold_coin', 18, drawGoldCoin);

  bake(scene, 'pickup_chest_hearth', 32, (g) => drawChest(g, 'hearth'));
  bake(scene, 'pickup_chest_fey', 32, (g) => drawChest(g, 'fey'));
  bake(scene, 'pickup_chest_legendary', 32, (g) => drawChest(g, 'legendary'));

  bake(scene, 'pickup_health_thistle', 24, drawHealthThistle);

  bake(scene, 'pickup_xp_heather', 22, (g) =>
    drawGem(g, 11, 11, 0xb070d8, 0xe6c0f4, 0x5a3070),
  );
  bake(scene, 'pickup_xp_loch', 22, (g) =>
    drawGem(g, 11, 11, 0x4a90c0, 0xc8e8f6, 0x1a3050),
  );

  bake(scene, 'pickup_oatcake_glow', 24, drawOatcake);
}
