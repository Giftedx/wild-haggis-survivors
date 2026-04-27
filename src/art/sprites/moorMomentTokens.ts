/**
 * Small tokens that briefly ride inside moor-moment bursts. Each is a
 * "found object from the landscape" — a peat lump that flashed gold,
 * a breath of loch-spray, a cluster of heather, a pull from a pine,
 * a crow's gold-eyed glance, a piper's distant tune, a sun-warmed
 * stone, a wind-shift, an amber hearth-glow, a nip of whisky.
 *
 * v2 lift (this file): token canvas bumped 28→32px to give each
 * silhouette room for a second focal element + clearer halo. Halo
 * colour individuated per token (was uniform alpha-blue grey) so
 * tokens read distinct at any background. Each token now adds a
 * second tell so the visual story is "two-element place memory" not
 * "icon on a disc". Companion to JuiceSystem.showMoorMomentBurst.
 */
import * as Phaser from 'phaser';

export const MOOR_MOMENT_TOKEN_KEYS = [
  'moor_token_peat_glint',
  'moor_token_loch_breath',
  'moor_token_heather_rest',
  'moor_token_pine_pull',
  'moor_token_crow_bargain',
  'moor_token_distant_tune',
  'moor_token_warm_stone',
  'moor_token_wind_shift',
  'moor_token_amber_glow',
  'moor_token_whisky_nip',
] as const;

const TOKEN_SIZE = 32;
const C = TOKEN_SIZE / 2; // centre

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

function bake(scene: Phaser.Scene, key: string, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, TOKEN_SIZE, TOKEN_SIZE);
  g.destroy();
}

/**
 * Two-tone halo: outer disc + inner ring. Each token passes its own
 * `outerColour` (for the soft disc) and `ringColour` (for the rim
 * line) so the halo participates in the silhouette, not just frames it.
 */
function halo(
  g: Phaser.GameObjects.Graphics,
  outerColour: number,
  ringColour: number = outerColour,
): void {
  g.fillStyle(outerColour, 0.16);
  g.fillCircle(C, C, 15);
  g.fillStyle(outerColour, 0.22);
  g.fillCircle(C, C, 12);
  g.lineStyle(1, ringColour, 0.5);
  g.strokeCircle(C, C, 13);
}

/**
 * Tiny shadow gusset under the token silhouette so it sits ON the
 * halo not in front of it.
 */
function shadow(g: Phaser.GameObjects.Graphics, y = C + 8, w = 14): void {
  g.fillStyle(0x000000, 0.28);
  g.fillEllipse(C, y, w, 3);
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(C, y + 1, w + 4, 4);
}

export function bakeMoorMomentTokens(scene: Phaser.Scene): void {
  // ── PEAT GLINT — peat brick with a gold flash. Halo: warm bronze
  // outside, inner orange rim so the token reads "warm earth". Second
  // tell: a single bright fleck above the brick (the glint). ──
  bake(scene, 'moor_token_peat_glint', (g) => {
    halo(g, 0xb27840, 0xff9a40);
    shadow(g, C + 10, 16);
    // Peat brick — layered (dark base / mid earth / wet sheen)
    g.fillStyle(0x1a0c04, 1);
    g.fillRect(7, 14, 18, 9);
    g.fillStyle(0x4a2810, 1);
    g.fillRect(8, 13, 16, 9);
    g.fillStyle(0x6a3818, 1);
    g.fillRect(9, 12, 14, 7);
    // Brick stamp ridges (peat-cutter mark)
    g.fillStyle(0x1a0c04, 0.8);
    g.fillRect(13, 13, 0.6, 6);
    g.fillRect(18, 13, 0.6, 6);
    // Gold flash — diagonal glint streak across the brick
    g.fillStyle(0xffd070, 1);
    g.fillTriangle(15, 11, 12, 18, 19, 18);
    g.fillStyle(0xfff0c0, 0.95);
    g.fillTriangle(15, 12, 13, 17, 17, 17);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(15, 14, 0.7);
    // Second glint above the brick (the "moment" tell)
    g.fillStyle(0xffe080, 0.95);
    g.fillCircle(20, 8, 1.2);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(20, 8, 0.5);
  });

  // ── LOCH BREATH — water surface with a single rising drop column.
  // Halo: cool teal outside, pale-cyan rim. Second tell: a tiny
  // pebble splash radial from the centre. ──
  bake(scene, 'moor_token_loch_breath', (g) => {
    halo(g, 0x4aa0d0, 0xc4eaff);
    // Loch surface — dark blue base + paler mid + bright skin band
    g.fillStyle(0x0c2438, 1);
    g.fillEllipse(C, C + 5, 22, 8);
    g.fillStyle(0x1a4068, 1);
    g.fillEllipse(C, C + 4, 20, 6);
    g.fillStyle(0x4a78a0, 1);
    g.fillEllipse(C, C + 3, 18, 4);
    // Skin highlight (the "calm" band)
    g.fillStyle(0x9fd0e8, 1);
    g.fillRect(C - 8, C + 2, 16, 0.8);
    g.fillStyle(0xeaf6ff, 0.85);
    g.fillRect(C - 6, C + 2, 12, 0.5);
    // Splash column rising from centre
    g.fillStyle(0xc4eaff, 0.85);
    g.fillRect(C - 1, 8, 2, 9);
    g.fillStyle(0xeaf6ff, 1);
    g.fillRect(C - 0.4, 8, 0.8, 9);
    // Drops radiating away — varied size for natural spray
    g.fillStyle(0xeaf6ff, 0.9);
    g.fillCircle(C - 6, 9, 1.4);
    g.fillCircle(C + 6, 11, 1.2);
    g.fillCircle(C - 9, 13, 1.0);
    g.fillCircle(C + 9, 14, 0.9);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(C - 6, 9, 0.5);
    g.fillCircle(C + 6, 11, 0.4);
    // Concentric ripple where the drop fell
    g.lineStyle(0.6, 0xc4eaff, 0.7);
    g.strokeEllipse(C, C + 3, 12, 2);
    g.strokeEllipse(C, C + 3, 8, 1.4);
  });

  // ── HEATHER REST — three-bloom heather sprig. Halo: lavender outside,
  // magenta rim. Second tell: a wee budding sprig off to one side. ──
  bake(scene, 'moor_token_heather_rest', (g) => {
    halo(g, 0xb878e0, 0xff88ee);
    shadow(g, C + 10, 16);
    // Stem (dark green vertical strip)
    g.fillStyle(0x1a3010, 1);
    g.fillRect(C - 0.7, C - 3, 1.4, 14);
    g.fillStyle(0x3a5818, 1);
    g.fillRect(C - 0.4, C - 3, 0.8, 13);
    // Three bloom heads — varied size + open/closed states
    g.fillStyle(0x3a1448, 1);
    g.fillCircle(C - 5, C - 4, 4);
    g.fillCircle(C + 1, C - 8, 4.5);
    g.fillCircle(C + 5, C - 4, 4);
    g.fillStyle(0x6a2884, 1);
    g.fillCircle(C - 5, C - 4, 3.2);
    g.fillCircle(C + 1, C - 8, 3.6);
    g.fillStyle(0x7a2a90, 1);
    g.fillCircle(C + 5, C - 4, 3.2); // brighter (more open)
    // Lavender highlight on tops
    g.fillStyle(0xb04edd, 1);
    g.fillCircle(C - 5, C - 5, 2);
    g.fillCircle(C + 1, C - 9, 2.4);
    g.fillStyle(0xcc78dd, 1);
    g.fillCircle(C - 5, C - 6, 1);
    g.fillCircle(C + 1, C - 10, 1.2);
    // Magenta apex (the eye-catcher)
    g.fillStyle(0xff88dd, 1);
    g.fillCircle(C + 1, C - 11, 0.8);
    g.fillStyle(0xffccee, 1);
    g.fillCircle(C + 1, C - 11, 0.4);
    // Second tell — tiny budding sprig branching off lower-right
    g.fillStyle(0x3a5818, 1);
    g.fillRect(C + 4, C - 1, 0.6, 4);
    g.fillStyle(0x6a2884, 1);
    g.fillCircle(C + 4.3, C - 1.5, 1);
    g.fillStyle(0xb04edd, 0.9);
    g.fillCircle(C + 4.3, C - 1.7, 0.4);
    // Needle leaves on the main stem
    g.fillStyle(0x2a4818, 1);
    g.fillRect(C - 2, C + 4, 0.5, 2.5);
    g.fillRect(C + 1.5, C + 4, 0.5, 2.5);
  });

  // ── PINE PULL — Caledonian pine silhouette. Halo: forest green outside,
  // bright lime rim. Second tell: a wee pine cone at the trunk base. ──
  bake(scene, 'moor_token_pine_pull', (g) => {
    halo(g, 0x4a8030, 0xa0e070);
    shadow(g, C + 11, 14);
    // Trunk (bottom)
    g.fillStyle(0x1e1008, 1);
    g.fillRect(C - 1.4, C + 4, 2.8, 8);
    g.fillStyle(0x4a2818, 1);
    g.fillRect(C - 1, C + 4, 2, 8);
    g.fillStyle(0x6a3818, 1);
    g.fillRect(C - 0.4, C + 4, 0.8, 7);
    // Three-tier conical canopy (Caledonian pine triangular shape)
    g.fillStyle(0x0a1e08, 1);
    g.fillTriangle(C, C - 12, C - 7, C - 4, C + 7, C - 4);
    g.fillTriangle(C, C - 8, C - 8, C, C + 8, C);
    g.fillTriangle(C, C - 4, C - 9, C + 4, C + 9, C + 4);
    g.fillStyle(0x2a4818, 1);
    g.fillTriangle(C, C - 11, C - 6, C - 4, C + 6, C - 4);
    g.fillTriangle(C, C - 7, C - 7, C, C + 7, C);
    g.fillTriangle(C, C - 3, C - 8, C + 4, C + 8, C + 4);
    g.fillStyle(0x4a8030, 1);
    g.fillTriangle(C, C - 10, C - 5, C - 5, C + 5, C - 5);
    g.fillTriangle(C, C - 6, C - 6, C - 1, C + 6, C - 1);
    g.fillTriangle(C, C - 2, C - 7, C + 3, C + 7, C + 3);
    // Light highlight needles — three pale specks per tier
    g.fillStyle(0x8ad048, 0.9);
    g.fillCircle(C - 2, C - 7, 0.5);
    g.fillCircle(C + 2, C - 5, 0.5);
    g.fillCircle(C - 3, C, 0.5);
    g.fillCircle(C + 3, C + 1, 0.5);
    // Second tell — pine cone at trunk base
    g.fillStyle(0x3a1808, 1);
    g.fillEllipse(C + 4, C + 11, 3, 4);
    g.fillStyle(0x6a3018, 1);
    g.fillEllipse(C + 4, C + 11, 2.4, 3.2);
    // Cone scales (small dark dots)
    g.fillStyle(0x2a1408, 1);
    g.fillCircle(C + 3.4, C + 10, 0.4);
    g.fillCircle(C + 4.6, C + 10, 0.4);
    g.fillCircle(C + 3.4, C + 12, 0.4);
    g.fillCircle(C + 4.6, C + 12, 0.4);
  });

  // ── CROW BARGAIN — black crow with gold eye. Halo: dusky purple,
  // gold rim. Second tell: a single dropped feather at the base. ──
  bake(scene, 'moor_token_crow_bargain', (g) => {
    halo(g, 0x6a4858, 0xffcc30);
    shadow(g, C + 9, 14);
    // Body — dark pear shape
    g.fillStyle(0x05050a, 1);
    g.fillEllipse(C + 1, C + 4, 16, 9);
    g.fillStyle(0x1a1a26, 1);
    g.fillEllipse(C + 1, C + 4, 14, 7);
    // Head
    g.fillStyle(0x05050a, 1);
    g.fillCircle(C + 6, C - 1, 5);
    g.fillStyle(0x1a1a26, 1);
    g.fillCircle(C + 6, C - 1, 4);
    // Tail feathers (jagged trailing edge)
    g.fillStyle(0x05050a, 1);
    g.fillTriangle(C - 7, C + 1, C - 12, C - 1, C - 7, C + 6);
    g.fillTriangle(C - 7, C + 4, C - 13, C + 4, C - 7, C + 7);
    // Wing fold line (slightly lighter band on body)
    g.fillStyle(0x2a2a36, 0.85);
    g.fillRect(C - 3, C + 3, 8, 1);
    // Beak (gold-yellow, sharp triangle)
    g.fillStyle(0xc89028, 1);
    g.fillTriangle(C + 9, C - 2, C + 14, C - 1, C + 9, C);
    g.fillStyle(0xffcc30, 1);
    g.fillTriangle(C + 9, C - 1.5, C + 13, C - 1, C + 9, C - 0.4);
    // Beak tip highlight
    g.fillStyle(0xffe080, 1);
    g.fillCircle(C + 13, C - 1, 0.4);
    // GOLD EYE — the bargain anchor
    g.fillStyle(0xffcc30, 1);
    g.fillCircle(C + 7, C - 2, 1.3);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(C + 7.3, C - 2.3, 0.5);
    g.fillStyle(0x000000, 1);
    g.fillCircle(C + 7, C - 2, 0.45);
    // Second tell — a single dropped feather below
    g.fillStyle(0x1a1a26, 1);
    g.fillEllipse(C - 4, C + 13, 5, 1.5);
    g.fillStyle(0x3a3a4a, 1);
    g.fillEllipse(C - 4, C + 12.8, 4, 1);
    g.fillStyle(0xfff8e8, 0.7);
    g.fillRect(C - 6, C + 12.7, 4, 0.3);
  });

  // ── DISTANT TUNE — bagpipe drone pipes with a music note. Halo:
  // warm rose-gold, brass rim. Second tell: musical note hovering above. ──
  bake(scene, 'moor_token_distant_tune', (g) => {
    halo(g, 0xd49050, 0xffcc66);
    shadow(g, C + 10, 12);
    // Two drone pipes — dark wood with brass collars
    g.fillStyle(0x1a0a04, 1);
    g.fillRect(C - 5, C - 2, 3, 14);
    g.fillRect(C + 1.5, C, 3, 12);
    g.fillStyle(0x4a2410, 1);
    g.fillRect(C - 4.5, C - 2, 2, 14);
    g.fillRect(C + 2, C, 2, 12);
    g.fillStyle(0x8a4a18, 1);
    g.fillRect(C - 4, C - 1, 1, 12);
    g.fillRect(C + 2.4, C + 1, 1, 10);
    // Brass collar rings (where pipe sections join)
    g.fillStyle(0xc89028, 1);
    g.fillRect(C - 5.4, C + 4, 4, 1);
    g.fillRect(C + 1.2, C + 5, 4, 1);
    g.fillRect(C - 5.4, C + 9, 4, 1);
    g.fillRect(C + 1.2, C + 9, 4, 1);
    g.fillStyle(0xffcc66, 1);
    g.fillRect(C - 5.4, C + 4, 4, 0.4);
    g.fillRect(C + 1.2, C + 5, 4, 0.4);
    // Bag underneath (tartan-band hint)
    g.fillStyle(0x3a1810, 1);
    g.fillEllipse(C, C + 13, 12, 4);
    g.fillStyle(0x7a3018, 1);
    g.fillEllipse(C, C + 13, 10, 3);
    // Second tell — a single eighth note floating above
    g.fillStyle(0xfff8e0, 0.95);
    g.fillEllipse(C + 8, C - 6, 2.4, 1.6);
    g.fillStyle(0x4a3010, 1);
    g.fillRect(C + 9, C - 11, 0.6, 5);
    // Note flag
    g.fillStyle(0x4a3010, 1);
    g.fillTriangle(C + 9.6, C - 11, C + 12, C - 9, C + 9.6, C - 8);
    g.fillStyle(0xffcc66, 0.9);
    g.fillCircle(C + 8, C - 6, 0.7);
  });

  // ── WARM STONE — sun-warmed boulder. Halo: amber outside, soft gold
  // rim. Second tell: a wee lichen splash + warm light pinprick. ──
  bake(scene, 'moor_token_warm_stone', (g) => {
    halo(g, 0xd0b070, 0xffd890);
    shadow(g, C + 10, 18);
    // Boulder mass — asymmetric ellipse with three-tone shading
    g.fillStyle(0x1a1208, 1);
    g.fillEllipse(C + 1, C + 4, 20, 14);
    g.fillStyle(0x4a3818, 1);
    g.fillEllipse(C, C + 3, 18, 12);
    g.fillStyle(0x806440, 1);
    g.fillEllipse(C - 1, C + 2, 14, 9);
    // Sun-warmed top-light highlight (warmer than usual stone)
    g.fillStyle(0xc8a868, 1);
    g.fillEllipse(C - 2, C - 1, 9, 5);
    g.fillStyle(0xeacc88, 1);
    g.fillEllipse(C - 3, C - 2, 6, 3);
    // Bright catch-light specular
    g.fillStyle(0xfff0c0, 0.95);
    g.fillEllipse(C - 4, C - 3, 3, 1.4);
    // Cracks (single fine line for character)
    g.lineStyle(0.6, 0x1a1208, 0.85);
    g.lineBetween(C - 4, C + 1, C + 3, C + 5);
    // Second tell — lichen splash on the windward shoulder
    g.fillStyle(0x8aa040, 0.9);
    g.fillEllipse(C + 5, C - 1, 4, 1.8);
    g.fillStyle(0xc0d878, 0.85);
    g.fillEllipse(C + 5, C - 1.3, 2.5, 1);
    g.fillStyle(0xeaf088, 0.95);
    g.fillCircle(C + 5, C - 1.5, 0.5);
    // Bright top-light pinprick
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(C - 5, C - 4, 0.6);
  });

  // ── WIND SHIFT — wind streak lines + leading leaf. Halo: cool teal
  // outside, pale-cyan rim. Second tell: a small leaf being carried. ──
  bake(scene, 'moor_token_wind_shift', (g) => {
    halo(g, 0xa8c8d8, 0xeaf6f8);
    // Three wind streaks at varied length + tilt
    g.lineStyle(2.4, 0xeaf6f8, 0.85);
    g.beginPath();
    g.moveTo(4, C - 4);
    g.lineTo(20, C - 4);
    g.lineTo(26, C - 7);
    g.strokePath();
    g.lineStyle(2, 0xc4dee8, 0.78);
    g.beginPath();
    g.moveTo(6, C);
    g.lineTo(22, C);
    g.lineTo(28, C - 2);
    g.strokePath();
    g.lineStyle(1.6, 0xa0bccc, 0.7);
    g.beginPath();
    g.moveTo(5, C + 4);
    g.lineTo(21, C + 4);
    g.lineTo(27, C + 7);
    g.strokePath();
    // Bright streak tips (the "wind direction" tell)
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(26, C - 7, 1);
    g.fillCircle(28, C - 2, 0.8);
    g.fillCircle(27, C + 7, 0.8);
    // Second tell — a small russet leaf being carried by the wind
    g.fillStyle(0x4a1808, 1);
    g.fillEllipse(10, C - 8, 4, 2.4);
    g.fillStyle(0xa64a18, 1);
    g.fillEllipse(10, C - 8.2, 3.4, 2);
    g.fillStyle(0xd47030, 0.95);
    g.fillEllipse(10, C - 8.4, 2.2, 1.2);
    // Leaf vein
    g.fillStyle(0x3a1408, 0.9);
    g.fillRect(8, C - 8, 4, 0.4);
    // Tiny dust mote streaks (motion lines from leaf)
    g.fillStyle(0xeaf6f8, 0.85);
    g.fillRect(11, C - 9, 4, 0.3);
    g.fillRect(12, C - 7, 3, 0.3);
  });

  // ── AMBER GLOW — hearth flame. Halo: orange outside, bright gold
  // rim. Second tell: an ember rising above the flame. ──
  bake(scene, 'moor_token_amber_glow', (g) => {
    halo(g, 0xffba40, 0xffe070);
    shadow(g, C + 10, 14);
    // Burning peat-bed at the base (dark with orange glow)
    g.fillStyle(0x1a0a04, 1);
    g.fillEllipse(C, C + 9, 14, 4);
    g.fillStyle(0x4a1a00, 1);
    g.fillEllipse(C, C + 8.5, 12, 3);
    // Flame body — three-layer teardrop
    g.fillStyle(0x4a1a00, 1);
    g.fillTriangle(C, C - 11, C - 8, C + 7, C + 8, C + 7);
    g.fillStyle(0xff5a08, 1);
    g.fillTriangle(C, C - 9, C - 6, C + 6, C + 6, C + 6);
    g.fillStyle(0xff9a20, 1);
    g.fillTriangle(C, C - 7, C - 4, C + 5, C + 4, C + 5);
    g.fillStyle(0xffd060, 1);
    g.fillTriangle(C, C - 5, C - 2.5, C + 3, C + 2.5, C + 3);
    // White-hot core
    g.fillStyle(0xfff0c0, 1);
    g.fillTriangle(C, C - 3, C - 1.5, C + 1, C + 1.5, C + 1);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(C, C - 1, 0.7);
    // Side flicker tongues
    g.fillStyle(0xff9a20, 0.85);
    g.fillTriangle(C - 5, C + 2, C - 3, C - 2, C - 2, C + 4);
    g.fillTriangle(C + 5, C + 2, C + 3, C - 2, C + 2, C + 4);
    // Second tell — a rising ember above the flame
    g.fillStyle(0xff8a20, 0.95);
    g.fillCircle(C + 3, C - 12, 1.2);
    g.fillStyle(0xffe070, 1);
    g.fillCircle(C + 3, C - 12, 0.6);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(C + 3, C - 12, 0.25);
    // Heat shimmer wavy lines
    g.lineStyle(0.6, 0xffe070, 0.6);
    g.lineBetween(C + 3, C - 9, C + 4, C - 11);
    g.lineBetween(C - 4, C - 7, C - 5, C - 10);
  });

  // ── WHISKY NIP — dram glass with whisky. Halo: warm honey outside,
  // amber rim. Second tell: a curl of whisky-vapour rising. ──
  bake(scene, 'moor_token_whisky_nip', (g) => {
    halo(g, 0xd49038, 0xffba40);
    shadow(g, C + 10, 12);
    // Glass tumbler — dark base outline + pale glass body
    g.fillStyle(0x100804, 1);
    g.fillRoundedRect(C - 5, C - 3, 10, 14, 1.6);
    g.fillStyle(0x6a4824, 0.45);
    g.fillRoundedRect(C - 4.5, C - 2.5, 9, 13, 1.4);
    // Glass body (very pale tint — clear glass with content showing)
    g.fillStyle(0xeae2c8, 0.85);
    g.fillRoundedRect(C - 4, C - 2, 8, 12, 1.2);
    // Whisky liquid — amber, takes lower 60% of the glass
    g.fillStyle(0xa8501c, 1);
    g.fillRect(C - 4, C + 2, 8, 8);
    g.fillStyle(0xd48028, 1);
    g.fillRect(C - 4, C + 2, 8, 6);
    g.fillStyle(0xeac848, 1);
    g.fillRect(C - 3.5, C + 2.5, 7, 4);
    // Liquid meniscus highlight
    g.fillStyle(0xffe080, 0.95);
    g.fillRect(C - 3.5, C + 2, 7, 0.6);
    // Glass top rim band
    g.fillStyle(0xfff4d8, 0.9);
    g.fillRect(C - 4, C - 2, 8, 0.6);
    // Glass side highlight (vertical white sheen)
    g.fillStyle(0xfff8e0, 0.7);
    g.fillRect(C - 3.5, C - 1.5, 0.8, 11);
    // Crystal facet glints — three small white pinpricks
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(C + 2, C, 0.4);
    g.fillCircle(C - 2, C + 5, 0.35);
    g.fillCircle(C + 3, C + 7, 0.3);
    // Second tell — vapour curl rising from the glass
    g.fillStyle(0xeac848, 0.4);
    g.fillCircle(C + 1, C - 6, 1.2);
    g.fillCircle(C - 1, C - 9, 1);
    g.fillCircle(C + 2, C - 11, 0.8);
    g.fillStyle(0xfff4c0, 0.5);
    g.fillCircle(C + 1, C - 6, 0.5);
    g.fillCircle(C - 1, C - 9, 0.4);
  });
}
