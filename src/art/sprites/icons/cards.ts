/**
 * Upgrade-card icons — `ucard_*` 32×32 textures shown on the level-up
 * card selection. Nine passive-accessory cards + nine stat-boost
 * cards = 18 icons total. Each has a shared dark rounded frame with
 * a category-tinted inner fill via `cardIconBg`.
 *
 * Consolidated into one file for the same reason as weapons.ts: they
 * share a style (shared bg helper, 32×32, centre-composition) and
 * read as families at the call site.
 */

import Phaser from 'phaser';

/**
 * Shared card icon background — dark border, tinted interior, subtle
 * corner roundness. Used by every card icon in this file.
 */
function cardIconBg(g: Phaser.GameObjects.Graphics, s: number, bgColor: number): void {
  g.fillStyle(0x0b111c, 1);
  g.fillRoundedRect(1, 1, s - 2, s - 2, 6);
  g.fillStyle(bgColor, 1);
  g.fillRoundedRect(3, 3, s - 6, s - 6, 4);
}

// ═══════════════════════════════════════════════════════════════════════════
//  PASSIVE CARD ICONS — culturally-loaded accessories
// ═══════════════════════════════════════════════════════════════════════════

/**
 * `ucard_sporran` — Highland sporran pickup icon. Design pivot: old
 * icon read as "generic fur pouch" with no Scottish specificity at
 * 32px. New pitch — proper sporran hanging FROM A KILT BELT (brown
 * strap with brass buckle at top), ORNATE BRASS CANTLE plate with
 * a thistle emblem across the top of the pouch, FUR POUCH BODY with
 * visible tufts, and THREE LONG HORSE-HAIR TASSELS with brass caps
 * hanging 60%+ of pouch height. Every anchor says "worn-as-kilt-
 * accessory" rather than "leather bag".
 */
function drawSporran(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x3d2a20);
  const cx = 16, cy = 16;

  // ── KILT BELT — brown strap across the top, establishes that
  // this is worn at the waist. ──
  g.fillStyle(0x1a0e06, 1);
  g.fillRect(cx - 14, cy - 10, 28, 3);
  g.fillStyle(0x3a2212, 1);
  g.fillRect(cx - 14, cy - 10, 28, 1.5);
  // Brass belt buckle at centre
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 2, cy - 10, 4, 3);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 2, cy - 10, 4, 1);

  // ── BRASS CANTLE — ornate metal plate across the top of the
  // pouch. Unmistakable "sporran" architectural detail. ──
  g.fillStyle(0x5a3810, 1);
  g.fillRect(cx - 10, cy - 7, 20, 4);
  g.fillStyle(0xc8a848, 1);
  g.fillRect(cx - 9, cy - 7, 18, 3);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 9, cy - 7, 18, 0.8);
  // THISTLE emblem centred on the cantle — Scottish anchor
  g.fillStyle(0x4a1a6a, 1);
  g.fillCircle(cx, cy - 5.5, 1.3);
  g.fillStyle(0x2a5a14, 1);
  g.fillRect(cx - 0.5, cy - 4.5, 1, 1);
  g.fillStyle(0x6a2a9a, 1);
  g.fillCircle(cx - 0.2, cy - 5.8, 0.6);

  // ── FUR POUCH BODY — dark brown with visible tufts. Taller
  // and more rectangular than a generic oval. ──
  g.fillStyle(0x1a0e06, 1);
  g.fillRoundedRect(cx - 9, cy - 3, 18, 13, 3);
  g.fillStyle(0x3a2212, 1);
  g.fillRoundedRect(cx - 8, cy - 2, 16, 11, 2.5);
  // Fur tufts — short vertical strokes showing hair texture
  g.fillStyle(0x5a3212, 0.95);
  for (let i = 0; i < 14; i++) {
    g.fillRect(cx - 7 + i, cy - 1.5 + (i % 3) * 0.6, 0.6, 2.2);
  }
  // Lower shadow on the pouch (weight hangs down)
  g.fillStyle(0x0a0604, 0.55);
  g.fillRect(cx - 8, cy + 5, 16, 4);

  // ── THREE LONG HORSE-HAIR TASSELS — the signature silhouette
  // tell. Each has a brass cap at the top + dark horsehair body
  // + splayed fringe at the tip. Hang well below the pouch. ──
  const tasselXs = [cx - 5, cx, cx + 5];
  for (const tx of tasselXs) {
    // Brass cap at top
    g.fillStyle(0xc8a848, 1);
    g.fillRect(tx - 1.3, cy + 9, 2.6, 1.5);
    g.fillStyle(0xfadc6a, 1);
    g.fillRect(tx - 1.3, cy + 9, 2.6, 0.5);
    // Tassel body — dark horsehair column
    g.fillStyle(0x1a0e06, 1);
    g.fillRect(tx - 1, cy + 10.5, 2, 3.5);
    g.fillStyle(0x3a2010, 1);
    g.fillRect(tx - 0.5, cy + 10.5, 1, 3.5);
    // Splayed fringe strands at the tip
    g.fillStyle(0x1a0e06, 1);
    g.fillRect(tx - 1.6, cy + 14, 0.6, 1.8);
    g.fillRect(tx - 0.3, cy + 14, 0.6, 1.8);
    g.fillRect(tx + 1, cy + 14, 0.6, 1.8);
  }

  g.generateTexture('ucard_sporran', s, s);
  g.destroy();
}

/**
 * `ucard_whisky_flask` — hip flask pickup icon. Design pivot (v2):
 * old icon had tartan label too thin + amber porthole too small to
 * read as "Scottish whisky" at 32px. New pitch — classic hip-flask
 * silhouette with a BIG AMBER WINDOW occupying the lower 2/3 of
 * the body (glass-panel flask showing the golden contents), tartan
 * label band across the SHOULDER (Royal Stewart red + green + gold),
 * and a bright gold whisky meniscus line. The amber glow is now
 * the dominant colour tell — "this is whisky, not a generic flask".
 */
function drawWhiskyFlask(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x332211);
  const cx = 16, cy = 16;

  // ── Screw cap on top — tapered brass flask cap. ──
  g.fillStyle(0x1a1008, 1);
  g.fillRect(cx - 3, cy - 12, 6, 3);
  g.fillStyle(0x5a3818, 1);
  g.fillRect(cx - 3, cy - 12, 6, 2);
  g.fillStyle(0x8a6028, 1);
  g.fillRect(cx - 2.5, cy - 12, 5, 0.6);
  // Cap ridges
  g.fillStyle(0x1a1008, 1);
  g.fillRect(cx - 3, cy - 11, 6, 0.4);
  g.fillRect(cx - 3, cy - 10.3, 6, 0.4);

  // ── Flask neck — narrow column between cap and body. ──
  g.fillStyle(0x2a2a32, 1);
  g.fillRect(cx - 2, cy - 9, 4, 3);
  g.fillStyle(0x6a6a72, 1);
  g.fillRect(cx - 2, cy - 9, 4, 1);

  // ── FLASK BODY — classic kidney-bean hip-flask curve. Pewter
  // outer shell acts as a frame around the amber window. ──
  g.fillStyle(0x0a0a12, 1);
  g.fillRoundedRect(cx - 9, cy - 6, 18, 18, 5);
  g.fillStyle(0x5a5a68, 1);
  g.fillRoundedRect(cx - 8, cy - 5, 16, 16, 4);

  // ── BIG AMBER WHISKY WINDOW — occupies the lower 2/3 of the
  // flask. Glass panel showing the golden contents. This is the
  // dominant silhouette tell — the icon reads "whisky" at a glance. ──
  g.fillStyle(0x3a1a04, 1);
  g.fillRoundedRect(cx - 6, cy - 2, 12, 11, 2);
  g.fillStyle(0xa06818, 1);
  g.fillRoundedRect(cx - 5.5, cy - 1.5, 11, 10, 1.8);
  g.fillStyle(0xd88a28, 1);
  g.fillRoundedRect(cx - 5.5, cy - 1.5, 11, 7, 1.8);
  g.fillStyle(0xf8b040, 1);
  g.fillRoundedRect(cx - 5.5, cy - 1.5, 11, 3.5, 1.8);
  // Bright amber highlight — sells the glow
  g.fillStyle(0xffd878, 0.92);
  g.fillRect(cx - 4, cy, 3, 6);
  g.fillStyle(0xfff0c0, 0.9);
  g.fillRect(cx - 4, cy, 1.5, 6);
  // Whisky meniscus — gold surface line
  g.fillStyle(0xfff0c0, 0.85);
  g.fillRect(cx - 5, cy - 1, 10, 0.6);

  // ── TARTAN LABEL BAND — wraps across the SHOULDER of the flask
  // above the amber window. Royal Stewart red + dark green + gold. ──
  g.fillStyle(0x0a0000, 1);
  g.fillRect(cx - 9, cy - 6, 18, 3);
  g.fillStyle(0x8a1818, 1);
  g.fillRect(cx - 9, cy - 5.5, 18, 2.5);
  // Dark green crossbar
  g.fillStyle(0x0a3018, 0.9);
  g.fillRect(cx - 9, cy - 4.6, 18, 0.8);
  // Gold vertical stripes
  g.fillStyle(0xdaaa40, 1);
  g.fillRect(cx - 6, cy - 5.5, 0.6, 2.5);
  g.fillRect(cx + 1, cy - 5.5, 0.6, 2.5);
  g.fillRect(cx + 5, cy - 5.5, 0.6, 2.5);
  // Cream highlight line
  g.fillStyle(0xf0e8c8, 0.7);
  g.fillRect(cx - 8, cy - 5.3, 16, 0.3);

  // ── Pewter sheen highlight on the left edge of the flask. ──
  g.fillStyle(0xbabac8, 0.8);
  g.fillRect(cx - 7, cy - 3, 0.8, 14);
  g.fillStyle(0xdcdce8, 0.85);
  g.fillRect(cx - 7.5, cy - 3, 0.4, 14);

  // ── Small chain linking cap to body. ──
  g.lineStyle(0.7, 0x6a6a72, 1);
  g.lineBetween(cx + 3, cy - 11, cx + 7, cy - 6);

  g.generateTexture('ucard_whisky_flask', s, s);
  g.destroy();
}

function drawKilt(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x1d2d5a);
  const cx = 16;
  g.fillStyle(0x1a3a6a, 1);
  g.fillRect(cx - 10, 8, 20, 18);
  g.fillStyle(0x2a4a8a, 1);
  g.fillRect(cx - 9, 9, 18, 16);
  g.fillStyle(0x3a6aaa, 0.7);
  g.fillRect(cx - 6, 9, 2, 16);
  g.fillRect(cx + 1, 9, 2, 16);
  g.fillRect(cx + 6, 9, 2, 16);
  g.fillStyle(0x5a88cc, 0.5);
  g.fillRect(cx - 9, 12, 18, 1);
  g.fillRect(cx - 9, 17, 18, 1);
  g.fillRect(cx - 9, 22, 18, 1);
  g.fillStyle(0xcc3344, 0.6);
  g.fillRect(cx - 9, 14, 18, 1);
  g.fillRect(cx - 9, 20, 18, 1);
  g.fillRect(cx - 2, 9, 1, 16);
  g.fillStyle(0x0a1a3a, 0.4);
  g.fillRect(cx - 4, 9, 1, 16);
  g.fillRect(cx + 4, 9, 1, 16);
  g.fillStyle(0x2a1a0a, 1);
  g.fillRect(cx - 10, 7, 20, 3);
  g.fillStyle(0x3a2a1a, 1);
  g.fillRect(cx - 9, 8, 18, 1);
  g.fillStyle(0xccaa44, 1);
  g.fillRect(cx - 2, 7, 4, 3);
  g.fillStyle(0xffdd66, 1);
  g.fillRect(cx - 1, 8, 2, 1);
  g.generateTexture('ucard_kilt', s, s);
  g.destroy();
}

/**
 * `ucard_tam_o_shanter` — Scottish Blue Bonnet (tam o' shanter).
 * Design pivot (v2): prior icon used a diced red/white chequer band
 * with 2×2 pixel squares that resolved to "noise stripe" at 1× scale,
 * leaving only the pom-pom as a read so the silhouette said "any
 * round hat". New pitch: classic Blue Bonnet — flat wide dark-blue
 * beret body + BOLD RED TOORIE (pom-pom) dominant on top + solid
 * dark headband + small silver cap-badge as the Scottish anchor.
 * Single-colour band lets the toorie pop instead of competing.
 */
function drawTamOShanter(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x2a2238);
  const cx = 16, cy = 17;
  // ── Flat wide beret body — the Blue Bonnet silhouette. ──
  g.fillStyle(0x050a1a, 1);
  g.fillEllipse(cx, cy + 1, 26, 12);
  g.fillStyle(0x152245, 1);
  g.fillEllipse(cx, cy, 24, 10);
  g.fillStyle(0x253365, 1);
  g.fillEllipse(cx - 1, cy - 1, 20, 8);
  g.fillStyle(0x3a4a8a, 0.7);
  g.fillEllipse(cx - 2, cy - 2, 12, 4);
  // ── Solid dark headband (no chequers — chequers blur at 1×). ──
  g.fillStyle(0x050812, 1);
  g.fillRect(cx - 13, cy + 6, 26, 4);
  g.fillStyle(0x152245, 1);
  g.fillRect(cx - 12, cy + 6, 24, 1);
  // ── Silver cap-badge on the band front — Scottish regimental tell. ──
  g.fillStyle(0x2a2a2a, 1);
  g.fillCircle(cx, cy + 8, 2);
  g.fillStyle(0xaaaaaa, 1);
  g.fillCircle(cx, cy + 8, 1.5);
  g.fillStyle(0xeeeeee, 1);
  g.fillCircle(cx - 0.3, cy + 7.7, 0.7);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - 0.5, cy + 7.5, 0.3);
  // ── BOLD RED TOORIE (pom-pom) — dominant anchor, 4-layer specular. ──
  g.fillStyle(0x3a0404, 1);
  g.fillCircle(cx, cy - 7, 5);
  g.fillStyle(0x881010, 1);
  g.fillCircle(cx, cy - 7, 4.3);
  g.fillStyle(0xcc2020, 1);
  g.fillCircle(cx - 0.5, cy - 7.5, 3.3);
  g.fillStyle(0xee4040, 1);
  g.fillCircle(cx - 1, cy - 8, 2);
  g.fillStyle(0xff8070, 0.9);
  g.fillCircle(cx - 1.3, cy - 8.3, 1);
  g.fillStyle(0xffddbb, 0.8);
  g.fillCircle(cx - 1.5, cy - 8.5, 0.5);
  // Pom fibres — faint texture dots around the toorie edge
  g.fillStyle(0x3a0404, 0.7);
  g.fillCircle(cx + 2.5, cy - 5.5, 0.5);
  g.fillCircle(cx - 3, cy - 5, 0.5);
  g.fillCircle(cx + 3, cy - 8, 0.4);
  g.fillCircle(cx - 2.5, cy - 9, 0.4);
  g.generateTexture('ucard_tam_o_shanter', s, s);
  g.destroy();
}

/**
 * `ucard_irn_bru` — Scottish health drink icon. Design pivot: old
 * icon had a thin blue stripe on an orange bottle — read as "any
 * generic orange soda" because the Scottish anchor was too faint
 * at 32px. New pitch — clear bottle full of ORANGE Irn-Bru with a
 * BOLD BLUE LABEL featuring a WHITE SALTIRE (Scottish flag cross)
 * and yellow trim stripes. Blue + yellow + orange = unmistakable
 * Irn-Bru brand palette; the saltire locks in "Scottish".
 */
function drawIrnBru(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x44220f);
  const cx = 16;

  // ── Bottle cap — dark blue with yellow rim (Irn-Bru brand). ──
  g.fillStyle(0x0a1a44, 1);
  g.fillRect(cx - 3, 4, 6, 4);
  g.fillStyle(0x2244aa, 1);
  g.fillRect(cx - 3, 4, 6, 3);
  g.fillStyle(0xffcc22, 1);
  g.fillRect(cx - 3, 7, 6, 1);
  // Cap ridges
  g.fillStyle(0x0a1a44, 1);
  g.fillRect(cx - 3, 5, 6, 0.4);
  g.fillRect(cx - 3, 6, 6, 0.4);

  // ── Bottle neck. ──
  g.fillStyle(0x0a0a12, 1);
  g.fillRect(cx - 2, 8, 4, 2);

  // ── BOTTLE BODY outline + ORANGE IRN-BRU liquid. The orange
  // is the dominant tell. ──
  g.fillStyle(0x1a0a00, 1);
  g.fillRoundedRect(cx - 7, 10, 14, 16, 3);
  g.fillStyle(0xdd5500, 1);
  g.fillRoundedRect(cx - 6, 11, 12, 14, 2);
  g.fillStyle(0xff7711, 1);
  g.fillRoundedRect(cx - 6, 12, 12, 12, 2);
  g.fillStyle(0xff9933, 1);
  g.fillRoundedRect(cx - 5, 12, 10, 10, 1.5);
  // Orange fizz highlight
  g.fillStyle(0xffbb55, 0.85);
  g.fillRect(cx - 3, 13, 3, 8);
  g.fillStyle(0xffdd88, 0.55);
  g.fillRect(cx - 2, 14, 2, 7);

  // ── BLUE LABEL BAND with WHITE SALTIRE — the Scottish-flag
  // anchor. Unmistakable Irn-Bru + Scotland. ──
  g.fillStyle(0x0a0a2a, 1);
  g.fillRect(cx - 7, 15.5, 14, 8);
  g.fillStyle(0x1a3a88, 1);
  g.fillRect(cx - 7, 16, 14, 7);
  // WHITE SALTIRE — two diagonals crossing
  g.lineStyle(1.6, 0xffffff, 1);
  g.lineBetween(cx - 6, 16.5, cx + 6, 22.5);
  g.lineBetween(cx + 6, 16.5, cx - 6, 22.5);
  // Yellow trim stripes top + bottom of label
  g.fillStyle(0xffcc22, 1);
  g.fillRect(cx - 7, 15.5, 14, 0.6);
  g.fillRect(cx - 7, 22.8, 14, 0.6);

  // ── Glass sheen highlight. ──
  g.fillStyle(0xffffff, 0.3);
  g.fillRect(cx - 6, 12, 1.5, 13);
  g.fillStyle(0xffffff, 0.15);
  g.fillRect(cx - 5, 12, 0.8, 13);

  g.generateTexture('ucard_irn_bru', s, s);
  g.destroy();
}

/**
 * `ucard_loch_water` — loch-water pickup icon. Design pivot (v2):
 * old icon tried to paint a whole miniature loch scene inside the
 * jar — two mountains, snow caps, ripples, inverted reflection —
 * and everything collapsed to a blue-green smudge at 32px. New
 * pitch: strip to ONE bold mountain silhouette with a single snow
 * cap, a thick teal water band filling the lower half, one clean
 * ripple line, and a prominent glass rim/sheen. The silhouette
 * anchor is "bottled mountain-and-water" not "detailed landscape".
 */
function drawLochWater(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x12334a);
  const cx = 16;

  // ── Cork stopper on top — classic "bottled" signal. ──
  g.fillStyle(0x4a3018, 1);
  g.fillRect(cx - 4, 3, 8, 4);
  g.fillStyle(0x8a6838, 1);
  g.fillRect(cx - 4, 3, 8, 3);
  g.fillStyle(0xaa8040, 1);
  g.fillRect(cx - 3.5, 3, 7, 1);

  // ── Jar neck — short narrow column. ──
  g.fillStyle(0x0a2030, 1);
  g.fillRect(cx - 3.5, 7, 7, 3);
  g.fillStyle(0x2a5a80, 0.75);
  g.fillRect(cx - 3, 7, 6, 2.5);

  // ── Glass jar body — wide rounded rect. Dark outline + lighter
  // interior. ──
  g.fillStyle(0x0a1820, 1);
  g.fillRoundedRect(cx - 10, 9, 20, 19, 4);
  g.fillStyle(0x1a3a58, 1);
  g.fillRoundedRect(cx - 9, 10, 18, 17, 3);

  // ── BIG MOUNTAIN — ONE bold silhouette filling upper-mid of the
  // jar. Dark slate purple. Apex near 13-14 for clarity. ──
  g.fillStyle(0x0a1028, 1);
  g.fillTriangle(cx - 8, 22, cx, 11, cx + 8, 22);
  g.fillStyle(0x1a1e40, 1);
  g.fillTriangle(cx - 7, 22, cx, 12, cx + 7, 22);
  // Shaded right face (darker)
  g.fillStyle(0x0a0e20, 0.85);
  g.fillTriangle(cx, 12, cx + 7, 22, cx + 1, 22);
  // Sunlit left face (lighter)
  g.fillStyle(0x2a2e58, 1);
  g.fillTriangle(cx - 6, 22, cx, 13, cx - 1, 22);

  // ── SNOW CAP — single bold white triangle at the apex. Large
  // enough to read at 32px. ──
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(cx - 2, 14, cx, 11, cx + 2, 14);
  // Snow-tail drip on the left face
  g.fillStyle(0xe0e8f0, 1);
  g.fillTriangle(cx - 2, 14, cx - 1, 14, cx - 1.5, 15.5);

  // ── TEAL WATER BAND — thick horizontal band at the lower half.
  // Bold so it reads as "water" instantly. ──
  g.fillStyle(0x1a4a68, 1);
  g.fillRect(cx - 9, 22, 18, 5);
  g.fillStyle(0x2a7aa0, 1);
  g.fillRect(cx - 9, 22, 18, 2);
  g.fillStyle(0x4a9ac0, 1);
  g.fillRect(cx - 9, 22, 18, 0.8);

  // ── ONE CLEAN RIPPLE — single curved line across the water. ──
  g.fillStyle(0xcceaf8, 1);
  g.fillRect(cx - 5, 24.5, 8, 0.6);
  g.fillRect(cx - 6, 25, 2, 0.5);
  g.fillRect(cx + 4, 25, 3, 0.5);

  // ── Glass rim highlight — crisp white band at the top of the
  // jar body. ──
  g.fillStyle(0xffffff, 0.7);
  g.fillRect(cx - 9, 10, 18, 0.6);

  // ── Glass sheen — single vertical highlight on the left edge. ──
  g.fillStyle(0xffffff, 0.45);
  g.fillRect(cx - 9, 11, 1, 15);

  g.generateTexture('ucard_loch_water', s, s);
  g.destroy();
}

function drawThistleCrown(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x3a214d);
  const cx = 16, cy = 17;
  g.fillStyle(0x8a6a10, 1);
  g.fillRect(cx - 10, cy + 2, 20, 5);
  g.fillStyle(0xcc9922, 1);
  g.fillRect(cx - 9, cy + 3, 18, 3);
  g.fillStyle(0xddaa33, 1);
  g.fillRect(cx - 9, cy + 3, 18, 1);
  const tines = [-8, -4, 0, 4, 8];
  const heights = [8, 10, 12, 10, 8];
  for (let i = 0; i < 5; i++) {
    const tx = cx + tines[i];
    const th = heights[i];
    g.fillStyle(0xcc9922, 1);
    g.fillTriangle(tx - 2, cy + 2, tx, cy + 2 - th, tx + 2, cy + 2);
    g.fillStyle(0xddbb44, 0.7);
    g.fillTriangle(tx - 1, cy + 1, tx, cy + 3 - th, tx, cy + 1);
  }
  g.fillStyle(0x663388, 1);
  g.fillCircle(cx, cy - 8, 4);
  g.fillStyle(0x8844aa, 1);
  g.fillCircle(cx, cy - 8, 3);
  g.fillStyle(0xaa66cc, 1);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.fillCircle(cx + Math.cos(a) * 4, cy - 8 + Math.sin(a) * 4, 1);
  }
  g.fillStyle(0xcc88ff, 1);
  g.fillCircle(cx, cy - 8, 1.5);
  g.fillStyle(0xff3366, 1);
  g.fillCircle(cx - 5, cy + 4, 1.5);
  g.fillCircle(cx + 5, cy + 4, 1.5);
  g.fillStyle(0x44ccff, 1);
  g.fillCircle(cx, cy + 4, 1.5);
  g.generateTexture('ucard_thistle_crown', s, s);
  g.destroy();
}

/**
 * `ucard_highland_shield` — Highland targe (round leather-bossed
 * shield). Design pivot (v2): prior icon was concentric grey circles
 * with 4 cardinal dots — read as "generic metal target", not a
 * Scottish targe. New pitch: TAN LEATHER BODY (warm russet, not
 * cold grey), BLUE SALTIRE X etched across the face (Scottish
 * anchor), FULL RING OF 12 BRASS RIVETS around the rim (the targe
 * tell), central domed brass boss with specular stack. Leather
 * warmth + saltire + rivet ring = unmistakably Highland targe.
 */
function drawHighlandShield(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x1a2a44);
  const cx = 16, cy = 16;

  // ── Dark leather outline ring. ──
  g.fillStyle(0x2a1204, 1);
  g.fillCircle(cx, cy, 13);
  // Mid leather — warm russet, not grey.
  g.fillStyle(0x6a3818, 1);
  g.fillCircle(cx, cy, 12);
  // Lighter leather face — full face tone.
  g.fillStyle(0x8a5a30, 1);
  g.fillCircle(cx - 0.5, cy - 0.5, 11);
  // Upper-left leather dome sheen.
  g.fillStyle(0xaa7040, 1);
  g.fillCircle(cx - 2, cy - 2, 6);
  g.fillStyle(0xcc9050, 0.6);
  g.fillCircle(cx - 3, cy - 3, 3);

  // ── SALTIRE X — thick blue diagonal bars. Sits inside the rivet
  // ring. Scottish flag overlay is the national identity anchor. ──
  // NW-SE bar shadow
  g.fillStyle(0x0a1a44, 1);
  g.fillTriangle(cx - 8.8, cy - 5.2, cx - 5.2, cy - 8.8, cx + 8.8, cy + 5.2);
  g.fillTriangle(cx - 5.2, cy - 8.8, cx + 8.8, cy + 5.2, cx + 5.2, cy + 8.8);
  // NE-SW bar shadow
  g.fillTriangle(cx - 8.8, cy + 5.2, cx - 5.2, cy + 8.8, cx + 8.8, cy - 5.2);
  g.fillTriangle(cx - 5.2, cy + 8.8, cx + 8.8, cy - 5.2, cx + 5.2, cy - 8.8);
  // NW-SE bar bright saltire blue
  g.fillStyle(0x3a66bb, 1);
  g.fillTriangle(cx - 8, cy - 4.5, cx - 4.5, cy - 8, cx + 8, cy + 4.5);
  g.fillTriangle(cx - 4.5, cy - 8, cx + 8, cy + 4.5, cx + 4.5, cy + 8);
  // NE-SW bar bright saltire blue
  g.fillTriangle(cx - 8, cy + 4.5, cx - 4.5, cy + 8, cx + 8, cy - 4.5);
  g.fillTriangle(cx - 4.5, cy + 8, cx + 8, cy - 4.5, cx + 4.5, cy - 8);

  // ── 12 BRASS RIVETS around the rim at r=10.5. The targe tell. ──
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const rx = cx + Math.cos(a) * 10.5;
    const ry = cy + Math.sin(a) * 10.5;
    g.fillStyle(0x3a1e08, 1);
    g.fillCircle(rx, ry, 1.3);
    g.fillStyle(0xccaa44, 1);
    g.fillCircle(rx, ry, 0.9);
    g.fillStyle(0xffdd77, 1);
    g.fillCircle(rx - 0.3, ry - 0.3, 0.5);
  }

  // ── CENTRAL BRASS BOSS — domed stack covering the saltire crossing. ──
  g.fillStyle(0x2a1404, 1);
  g.fillCircle(cx, cy, 4);
  g.fillStyle(0x8a6620, 1);
  g.fillCircle(cx, cy, 3.3);
  g.fillStyle(0xccaa44, 1);
  g.fillCircle(cx - 0.3, cy - 0.3, 2.5);
  g.fillStyle(0xeecc55, 1);
  g.fillCircle(cx - 0.7, cy - 0.7, 1.5);
  g.fillStyle(0xffee88, 1);
  g.fillCircle(cx - 1, cy - 1, 0.8);
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(cx - 1.1, cy - 1.1, 0.4);

  g.generateTexture('ucard_highland_shield', s, s);
  g.destroy();
}

/**
 * `ucard_tartan_sash` — tartan-sash accessory icon. Design pivot:
 * old icon was a raw tartan-stripe band with a corner brooch that
 * read as "fabric sample". New pitch — paint the sash ACROSS A DARK
 * TORSO SILHOUETTE so it's unmistakably WORN, not a loose scrap.
 * Brooch pins at the left shoulder, red-gold-green tartan stripes
 * run along the sash axis, gold fringe tails trail at the waist.
 */
function drawTartanSash(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x3b1f2d);
  const cx = 16;

  // ── Dark torso silhouette — the body the sash drapes over. ──
  g.fillStyle(0x0a0608, 1);
  g.fillRoundedRect(cx - 10, 6, 20, 22, 6);
  g.fillStyle(0x1a0c14, 1);
  g.fillRoundedRect(cx - 9, 7, 18, 20, 5);
  // Neckline V-cut
  g.fillStyle(0x3b1f2d, 1);
  g.fillTriangle(cx - 3, 7, cx + 3, 7, cx, 12);

  // ── Sash body — thick diagonal red parallelogram from left
  // shoulder down to right waist. ──
  g.fillStyle(0x3a0a0a, 1);
  g.fillTriangle(cx - 10, 9, cx - 6, 9, cx + 10, 27);
  g.fillTriangle(cx - 10, 9, cx + 10, 27, cx + 6, 27);
  g.fillStyle(0x8a1818, 1);
  g.fillTriangle(cx - 9.5, 9.5, cx - 6.5, 9.5, cx + 9, 26.5);
  g.fillTriangle(cx - 9.5, 9.5, cx + 9, 26.5, cx + 6.5, 26.5);
  g.fillStyle(0xaa2828, 1);
  g.fillTriangle(cx - 8.5, 10, cx - 7, 10, cx + 8, 26);
  g.fillTriangle(cx - 8.5, 10, cx + 8, 26, cx + 6.5, 26);

  // ── Gold pinstripe down the sash axis. ──
  g.fillStyle(0xdaaa40, 1);
  g.fillTriangle(cx - 8, 11, cx - 7.5, 11, cx + 7.5, 25.5);
  g.fillTriangle(cx - 8, 11, cx + 7.5, 25.5, cx + 7, 25.5);
  // Dark green secondary stripe
  g.fillStyle(0x1a4418, 0.95);
  g.fillTriangle(cx - 9, 11.5, cx - 8.5, 11.5, cx + 7, 25);
  g.fillTriangle(cx - 9, 11.5, cx + 7, 25, cx + 6.5, 25);

  // ── Tartan cross-beads suggesting perpendicular weave. ──
  const beads: [number, number][] = [
    [cx - 6, 12], [cx - 2, 17], [cx + 2, 21], [cx + 6, 25],
  ];
  for (const [px, py] of beads) {
    g.fillStyle(0x1a0404, 1);
    g.fillCircle(px, py, 0.9);
  }

  // ── Brooch at the shoulder — silver disc with amethyst stone. ──
  g.fillStyle(0x4a4a58, 1);
  g.fillCircle(cx - 8, 10, 3);
  g.fillStyle(0xaabacc, 1);
  g.fillCircle(cx - 8, 10, 2.3);
  g.fillStyle(0xdcdce8, 1);
  g.fillCircle(cx - 8, 10, 1.5);
  g.fillStyle(0x8844aa, 1);
  g.fillCircle(cx - 8, 10, 0.9);
  g.fillStyle(0xcc88ee, 1);
  g.fillCircle(cx - 8.2, 9.8, 0.4);

  // ── Gold fringe tails at the waist end. ──
  g.fillStyle(0xdaaa40, 1);
  g.fillRect(cx + 7, 26, 0.7, 3);
  g.fillRect(cx + 8, 26, 0.7, 3.5);
  g.fillRect(cx + 9, 26, 0.7, 2.8);
  g.fillStyle(0x6a5020, 1);
  g.fillRect(cx + 7, 28.5, 0.7, 0.5);
  g.fillRect(cx + 8, 29, 0.7, 0.5);

  g.generateTexture('ucard_tartan_sash', s, s);
  g.destroy();
}

// ═══════════════════════════════════════════════════════════════════════════
//  STAT BOOST CARD ICONS
// ═══════════════════════════════════════════════════════════════════════════

function drawStatHealth(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x2c1f2a);
  const cx = 16, cy = 16;
  g.fillStyle(0x881122, 1);
  g.fillCircle(cx - 4, cy - 2, 6);
  g.fillCircle(cx + 4, cy - 2, 6);
  g.fillTriangle(cx - 10, cy, cx + 10, cy, cx, cy + 11);
  g.fillStyle(0xcc2244, 1);
  g.fillCircle(cx - 4, cy - 2, 5);
  g.fillCircle(cx + 4, cy - 2, 5);
  g.fillTriangle(cx - 9, cy - 1, cx + 9, cy - 1, cx, cy + 10);
  g.fillStyle(0xee4466, 1);
  g.fillCircle(cx - 4, cy - 3, 3);
  g.fillStyle(0xff6688, 0.6);
  g.fillCircle(cx - 5, cy - 4, 1.5);
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(cx - 5, cy - 5, 1);
  g.generateTexture('ucard_stat_health', s, s);
  g.destroy();
}

function drawStatSpeed(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x213047);
  const cx = 16;
  g.fillStyle(0x4488ff, 0.2);
  g.fillCircle(cx, 16, 10);
  g.fillStyle(0x3366aa, 1);
  g.fillTriangle(cx + 4, 5, cx - 2, 15, cx + 3, 15);
  g.fillTriangle(cx - 1, 15, cx - 5, 27, cx + 4, 15);
  g.fillStyle(0x66aaff, 1);
  g.fillTriangle(cx + 3, 7, cx - 1, 15, cx + 2, 15);
  g.fillTriangle(cx, 15, cx - 3, 25, cx + 3, 15);
  g.fillStyle(0xaaddff, 1);
  g.fillTriangle(cx + 1, 9, cx, 15, cx + 1, 15);
  g.fillTriangle(cx, 15, cx - 1, 23, cx + 2, 15);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx - 3, 12, 1);
  g.fillCircle(cx + 4, 18, 1);
  g.fillCircle(cx - 1, 21, 0.8);
  g.generateTexture('ucard_stat_speed', s, s);
  g.destroy();
}

/**
 * `ucard_stat_pickup` — pickup-range stat icon. Design pivot: old
 * icon had a magnet + flying gem + trail dots competing for attention
 * so the "pickup range" concept got diluted. New pitch — BIG BOLD
 * horseshoe magnet dominates the upper 2/3 of the icon, 3 BRIGHTER
 * concentric cyan field arcs radiating from the pole opening, and a
 * SINGLE bright sparkle-star at the bottom as the "pull target". No
 * clutter — the magnet silhouette carries the meaning.
 */
function drawStatPickup(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x243a22);
  const cx = 16, cy = 15;

  // ── HORSESHOE MAGNET — bigger and bolder than before. Red body
  // + white pole tips. The dominant silhouette. ──
  // Outline shadow
  g.fillStyle(0x2a0808, 1);
  g.fillRect(cx - 10, cy - 10, 20, 5);
  g.fillRect(cx - 10, cy - 10, 5, 14);
  g.fillRect(cx + 5, cy - 10, 5, 14);

  // Red magnet body
  g.fillStyle(0xaa0a0a, 1);
  g.fillRect(cx - 9, cy - 9, 18, 4);
  g.fillRect(cx - 9, cy - 9, 4, 12);
  g.fillRect(cx + 5, cy - 9, 4, 12);
  g.fillStyle(0xdd2222, 1);
  g.fillRect(cx - 9, cy - 9, 18, 3);
  g.fillRect(cx - 9, cy - 9, 3, 11);
  g.fillRect(cx + 6, cy - 9, 3, 11);
  // Highlight
  g.fillStyle(0xff5544, 1);
  g.fillRect(cx - 8, cy - 9, 16, 1);
  g.fillRect(cx - 8, cy - 8, 1, 9);
  g.fillRect(cx + 7, cy - 8, 1, 9);

  // ── WHITE POLE TIPS at the open end — classic horseshoe detail. ──
  g.fillStyle(0xeaeae0, 1);
  g.fillRect(cx - 9, cy + 3, 4, 3);
  g.fillRect(cx + 5, cy + 3, 4, 3);
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 9, cy + 3, 4, 1);
  g.fillRect(cx + 5, cy + 3, 4, 1);

  // ── MAGNETIC FIELD ARCS — three concentric cyan arcs radiating
  // from the pole opening. Brighter + bolder than before. ──
  g.lineStyle(1.5, 0x66ddff, 0.9);
  g.beginPath();
  g.arc(cx, cy + 6, 4, Math.PI * 1.0, Math.PI * 2.0);
  g.strokePath();
  g.lineStyle(1.2, 0x88eeff, 0.75);
  g.beginPath();
  g.arc(cx, cy + 6, 7, Math.PI * 1.0, Math.PI * 2.0);
  g.strokePath();
  g.lineStyle(1.0, 0xaaf0ff, 0.55);
  g.beginPath();
  g.arc(cx, cy + 6, 10, Math.PI * 1.0, Math.PI * 2.0);
  g.strokePath();

  // ── PULL-TARGET SPARKLE — single bright 4-point star at the
  // bottom. Sells "thing being drawn toward the magnet" without
  // the clutter of a gem + trail. ──
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 0.6, cy + 11, 1.2, 4.5);
  g.fillRect(cx - 2.2, cy + 12.5, 4.5, 1.2);
  g.fillStyle(0xccf4ff, 1);
  g.fillCircle(cx, cy + 13, 1.2);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx, cy + 13, 0.6);

  g.generateTexture('ucard_stat_pickup', s, s);
  g.destroy();
}

/**
 * `ucard_stat_damage` — damage-boost stat icon. Design pivot: old
 * icon used subtle diagonal rect-pillars as sword slashes that
 * read as generic motion lines at 16×16. New pitch — TWO CROSSED
 * BROADSWORD BLADES behind a big CENTRAL DAMAGE BURST. Blades form
 * an X silhouette (combat crest); explosion at centre screams "hit".
 * Flame wisps radiate from the core for impact-energy readability.
 */
function drawStatDamage(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x3c2318);
  const cx = 16, cy = 16;

  // ── CROSSED BROADSWORD BLADES — X-shape behind the burst. ──
  // Sword 1: top-left to bottom-right
  g.fillStyle(0x0a0a0a, 1);
  g.fillTriangle(4, 4, 7, 4, 28, 28);
  g.fillTriangle(4, 4, 28, 28, 28, 25);
  g.fillStyle(0x6a7a8a, 1);
  g.fillTriangle(5, 5, 7, 5, 27, 27);
  g.fillTriangle(5, 5, 27, 27, 27, 25);
  g.fillStyle(0xa8b8c8, 1);
  g.fillTriangle(5, 5, 6, 5, 27, 27);

  // Sword 2: top-right to bottom-left (mirror)
  g.fillStyle(0x0a0a0a, 1);
  g.fillTriangle(28, 4, 25, 4, 4, 28);
  g.fillTriangle(28, 4, 4, 28, 4, 25);
  g.fillStyle(0x6a7a8a, 1);
  g.fillTriangle(27, 5, 25, 5, 5, 27);
  g.fillTriangle(27, 5, 5, 27, 5, 25);
  g.fillStyle(0xa8b8c8, 1);
  g.fillTriangle(27, 5, 26, 5, 5, 27);

  // ── Crossguards — brass horizontal bars where blade meets grip. ──
  g.fillStyle(0x0a0a0a, 1);
  g.fillRect(22, 21, 8, 2.5);
  g.fillRect(2, 21, 8, 2.5);
  g.fillStyle(0xc88a40, 1);
  g.fillRect(23, 21.5, 6, 1.5);
  g.fillRect(3, 21.5, 6, 1.5);

  // ── Grips — leather-wrapped bars. ──
  g.fillStyle(0x3a1a0a, 1);
  g.fillRect(28, 23, 3, 2.5);
  g.fillRect(1, 23, 3, 2.5);

  // ── Pommels — round brass caps at the grip ends. ──
  g.fillStyle(0xc88a40, 1);
  g.fillCircle(30.5, 25, 1.5);
  g.fillCircle(1.5, 25, 1.5);
  g.fillStyle(0xfadc6a, 1);
  g.fillCircle(30.5, 25, 0.8);
  g.fillCircle(1.5, 25, 0.8);

  // ── CENTRAL DAMAGE BURST — orange explosion with hot core. ──
  g.fillStyle(0xff6a10, 0.65);
  g.fillCircle(cx, cy, 7);
  g.fillStyle(0xff8a20, 1);
  g.fillCircle(cx, cy, 5);
  g.fillStyle(0xffaa40, 1);
  g.fillCircle(cx, cy, 3.5);
  g.fillStyle(0xffdd88, 1);
  g.fillCircle(cx, cy, 2);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx, cy, 0.9);

  // ── FLAME WISPS radiating from the core — 4 cardinal + 4 diagonal. ──
  g.fillStyle(0xff8a20, 0.85);
  g.fillTriangle(cx, cy - 8, cx - 1.2, cy - 4, cx + 1.2, cy - 4);
  g.fillTriangle(cx, cy + 8, cx - 1.2, cy + 4, cx + 1.2, cy + 4);
  g.fillTriangle(cx - 8, cy, cx - 4, cy - 1.2, cx - 4, cy + 1.2);
  g.fillTriangle(cx + 8, cy, cx + 4, cy - 1.2, cx + 4, cy + 1.2);

  g.generateTexture('ucard_stat_damage', s, s);
  g.destroy();
}

/**
 * `ucard_stat_drift` — drift-reduction stat icon. Design pivot: old
 * spiral+arrow read as generic "motion" without anchoring the "steer
 * your haggis" concept. New pitch — SHIP'S STEERING WHEEL with six
 * spokes + visible handle-nubs around the rim. The universal
 * control/steering icon. The haggis drift is a steering-correction
 * mechanic, so the wheel IS the mechanic.
 */
function drawStatDrift(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x2a2744);
  const cx = 16, cy = 16;

  // Outer dark wood rim
  g.fillStyle(0x2a1a0a, 1);
  g.fillCircle(cx, cy, 12);
  // Main wood rim
  g.fillStyle(0x6a3818, 1);
  g.fillCircle(cx, cy, 11);
  // Inner dark ring (cutout)
  g.fillStyle(0x1a0e04, 1);
  g.fillCircle(cx, cy, 8.5);
  // Inner ring wood
  g.fillStyle(0x6a3818, 1);
  g.fillCircle(cx, cy, 7.5);
  // Centre hub cutout
  g.fillStyle(0x1a0e04, 1);
  g.fillCircle(cx, cy, 4);

  // Six spokes — thick radial bars from hub to rim
  const spokeAngles = [0, Math.PI / 3, 2 * Math.PI / 3, Math.PI, 4 * Math.PI / 3, 5 * Math.PI / 3];
  for (const a of spokeAngles) {
    // Spoke body
    g.fillStyle(0x6a3818, 1);
    const sx1 = cx + Math.cos(a) * 3;
    const sy1 = cy + Math.sin(a) * 3;
    const sx2 = cx + Math.cos(a) * 8;
    const sy2 = cy + Math.sin(a) * 8;
    // Draw thick spoke as two overlapping triangles for a rectangle
    const perpX = -Math.sin(a) * 1.2;
    const perpY = Math.cos(a) * 1.2;
    g.fillTriangle(sx1 + perpX, sy1 + perpY, sx1 - perpX, sy1 - perpY, sx2 + perpX, sy2 + perpY);
    g.fillTriangle(sx1 - perpX, sy1 - perpY, sx2 + perpX, sy2 + perpY, sx2 - perpX, sy2 - perpY);
    // Spoke highlight
    g.fillStyle(0x8a5028, 1);
    const perpX2 = -Math.sin(a) * 0.5;
    const perpY2 = Math.cos(a) * 0.5;
    g.fillTriangle(sx1 + perpX2, sy1 + perpY2, sx2 + perpX2, sy2 + perpY2, sx2 - perpX2, sy2 - perpY2);
  }

  // Handle nubs — six knobs sticking out beyond the rim
  g.fillStyle(0x4a2810, 1);
  for (const a of spokeAngles) {
    const hx = cx + Math.cos(a) * 13;
    const hy = cy + Math.sin(a) * 13;
    g.fillCircle(hx, hy, 1.8);
  }
  g.fillStyle(0x8a5028, 1);
  for (const a of spokeAngles) {
    const hx = cx + Math.cos(a) * 13;
    const hy = cy + Math.sin(a) * 13;
    g.fillCircle(hx, hy, 1.2);
  }
  g.fillStyle(0xba7848, 0.9);
  for (const a of spokeAngles) {
    const hx = cx + Math.cos(a) * 13;
    const hy = cy + Math.sin(a) * 13;
    g.fillCircle(hx - 0.3, hy - 0.3, 0.5);
  }

  // Centre hub — brass knob with rivet
  g.fillStyle(0xd8a848, 1);
  g.fillCircle(cx, cy, 3);
  g.fillStyle(0xfadc6a, 1);
  g.fillCircle(cx, cy, 2);
  g.fillStyle(0x6a4818, 1);
  g.fillCircle(cx, cy, 0.8);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - 0.7, cy - 0.7, 0.5);

  // Rim wood-grain highlight on top
  g.fillStyle(0x8a5028, 0.85);
  g.fillEllipse(cx, cy - 11, 6, 1);

  g.generateTexture('ucard_stat_drift', s, s);
  g.destroy();
}

/**
 * `ucard_stat_defense` — defense stat icon. Design pivot: old icon
 * was a rounded-rect slab with a central pillar + scalloped top
 * that read as "door" or "castle tower". New pitch — classic
 * HIGHLAND TARGE (round riveted shield) with a saltire etched on
 * the face + a vertical broadsword behind it, all the unambiguous
 * marks of Scottish defensive iconography.
 */
function drawStatDefense(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x1f2e3a);
  const cx = 16, cy = 16;

  // ── Vertical broadsword behind — visible top + bottom only. ──
  g.fillStyle(0x2a3848, 1);
  g.fillRect(cx - 1, 3, 2, 26);
  g.fillStyle(0x5a6e82, 1);
  g.fillRect(cx - 0.5, 3, 1, 25);
  g.fillStyle(0x5a6e82, 1);
  g.fillTriangle(cx - 1, 3, cx + 1, 3, cx, 1);
  g.fillStyle(0xc8dae8, 0.85);
  g.fillRect(cx - 0.3, 3, 0.6, 8);
  // Crossguard
  g.fillStyle(0x4a3418, 1);
  g.fillRect(cx - 6, cy - 10, 12, 2);
  g.fillStyle(0x7a5428, 1);
  g.fillRect(cx - 5, cy - 10, 10, 1);
  // Pommel at bottom
  g.fillStyle(0x4a3418, 1);
  g.fillCircle(cx, 29, 2);
  g.fillStyle(0x7a5428, 1);
  g.fillCircle(cx, 29, 1.3);

  // ── Round targe shield — fills the middle. ──
  g.fillStyle(0x2a1a0a, 1);
  g.fillCircle(cx, cy, 11);
  g.fillStyle(0x5a3818, 1);
  g.fillCircle(cx, cy, 10);
  g.fillStyle(0x556677, 1);
  g.fillCircle(cx, cy, 9);
  g.fillStyle(0x7a8a9a, 1);
  g.fillCircle(cx - 1, cy - 1, 7.5);
  // Concentric ring grooves
  g.lineStyle(1, 0x3a4858, 0.9);
  g.strokeCircle(cx, cy, 7);
  g.lineStyle(0.8, 0x3a4858, 0.8);
  g.strokeCircle(cx, cy, 4.5);

  // ── Saltire etched on the shield face — pale white X. ──
  g.lineStyle(1.3, 0xe8f0f8, 0.6);
  g.lineBetween(cx - 6, cy - 6, cx + 6, cy + 6);
  g.lineBetween(cx - 6, cy + 6, cx + 6, cy - 6);

  // ── Centre boss — chunky steel dome with specular. ──
  g.fillStyle(0x2a3440, 1);
  g.fillCircle(cx, cy, 3);
  g.fillStyle(0x6a7a8a, 1);
  g.fillCircle(cx, cy, 2.3);
  g.fillStyle(0xaabacc, 1);
  g.fillCircle(cx, cy, 1.5);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(cx - 0.4, cy - 0.4, 0.6);

  // ── Brass rivets around the rim at 8 positions. ──
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rx = cx + Math.cos(a) * 9;
    const ry = cy + Math.sin(a) * 9;
    g.fillStyle(0x2a1a0a, 1);
    g.fillCircle(rx, ry, 0.9);
    g.fillStyle(0xaa8a3a, 1);
    g.fillCircle(rx, ry, 0.6);
    g.fillStyle(0xddbb55, 0.9);
    g.fillCircle(rx - 0.2, ry - 0.2, 0.3);
  }

  g.generateTexture('ucard_stat_defense', s, s);
  g.destroy();
}

/**
 * `ucard_stat_utility` — utility stat icon. Design pivot: old icon
 * was a generic 8-point gold radial star that could have been any
 * category's burst. New pitch — an ANTIQUE SKELETON KEY with a
 * THISTLE-SHAPED BOW: the key is universal "utility/access"
 * iconography, and the thistle-bow keeps the Scottish anchor.
 */
function drawStatUtility(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x2d2d22);
  const cx = 16, cy = 16;

  // ── Warm gold aura behind the key. ──
  g.fillStyle(0xd8a848, 0.15);
  g.fillCircle(cx, cy, 13);

  // ── Thistle bow at the top — green calyx with radiating bracts. ──
  g.fillStyle(0x1a3810, 1);
  g.fillEllipse(cx, cy - 5, 7, 4);
  g.fillStyle(0x3a6a18, 1);
  g.fillEllipse(cx, cy - 5, 6, 3);
  g.fillStyle(0x1a3810, 1);
  g.fillTriangle(cx - 4, cy - 5, cx - 6, cy - 7, cx - 3, cy - 4);
  g.fillTriangle(cx + 4, cy - 5, cx + 6, cy - 7, cx + 3, cy - 4);
  g.fillTriangle(cx - 2, cy - 7, cx, cy - 9, cx + 2, cy - 7);

  // Purple thistle bloom inside the bow
  g.fillStyle(0x4a1868, 1);
  g.fillEllipse(cx, cy - 7, 6, 4);
  g.fillStyle(0x8a3ab0, 1);
  g.fillEllipse(cx, cy - 7, 5, 3);
  // Bristly purple florets radiating upward
  g.fillStyle(0xcc78dd, 1);
  for (let i = 0; i < 7; i++) {
    const bx = cx - 3 + i;
    const h = 1.5 + (i % 3) * 0.5;
    g.fillRect(bx, cy - 9 - h, 0.5, h);
  }
  // Bright tip dots
  g.fillStyle(0xffccee, 1);
  g.fillCircle(cx, cy - 11, 0.6);
  g.fillCircle(cx - 2, cy - 10, 0.4);
  g.fillCircle(cx + 2, cy - 10, 0.4);

  // ── Key shaft — thick vertical gold bar. ──
  g.fillStyle(0x4a3008, 1);
  g.fillRect(cx - 1.5, cy - 2, 3, 13);
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 1, cy - 2, 2, 13);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 0.5, cy - 2, 1, 13);

  // ── Key bit — antique L-shape with two teeth. ──
  g.fillStyle(0x4a3008, 1);
  g.fillRect(cx - 1.5, cy + 10, 7, 2.5);
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 1, cy + 10, 6, 2);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 1, cy + 10, 6, 0.6);
  // First tooth (downward)
  g.fillStyle(0x4a3008, 1);
  g.fillRect(cx + 1, cy + 12, 1.8, 2.5);
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx + 1.3, cy + 12, 1.2, 2);
  // Second tooth
  g.fillStyle(0x4a3008, 1);
  g.fillRect(cx + 3.5, cy + 12, 1.8, 2);
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx + 3.8, cy + 12, 1.2, 1.5);

  // ── Sparkle at the thistle tip — magical key. ──
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(cx - 3, cy - 11, 0.8, 0.4);
  g.fillRect(cx - 3.3, cy - 11.3, 0.4, 0.8);

  g.generateTexture('ucard_stat_utility', s, s);
  g.destroy();
}

/**
 * `ucard_stat_cooldown` — weapon cooldown-reduction stat icon.
 * Design pivot: old hourglass-between-posts read as "gears" or
 * "pressure clamp". New pitch — proper POCKET-WATCH CLOCK FACE
 * with visible hour/minute hands + 12 tick marks + crown stem +
 * ring loop on top. Universal "time/cooldown" icon that reads at
 * 32px without needing culture context.
 */
function drawStatCooldown(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x2a2238);
  const cx = 16, cy = 16;

  // Watch-loop ring on top (where the chain would attach)
  g.lineStyle(1.5, 0xd8a848, 1);
  g.strokeCircle(cx, cy - 14, 1.8);
  // Watch crown stem (between loop and body)
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 1, cy - 12, 2, 2);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 0.5, cy - 12, 1, 2);

  // Outer gold case ring
  g.fillStyle(0x8a6018, 1);
  g.fillCircle(cx, cy, 11.5);
  g.fillStyle(0xd8a848, 1);
  g.fillCircle(cx, cy, 10.5);
  g.fillStyle(0xfadc6a, 0.9);
  g.fillCircle(cx, cy - 0.5, 9.5);

  // Watch face — cream/ivory
  g.fillStyle(0xf4e8d0, 1);
  g.fillCircle(cx, cy, 9);
  g.fillStyle(0xfaf0dc, 1);
  g.fillCircle(cx, cy - 0.5, 8);

  // 12 TICK MARKS around the dial
  g.fillStyle(0x1a1008, 1);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 3 === 0;
    const r1 = 8;
    const r2 = isMajor ? 6.5 : 7.3;
    const sx1 = cx + Math.cos(a) * r1;
    const sy1 = cy + Math.sin(a) * r1;
    const sx2 = cx + Math.cos(a) * r2;
    const sy2 = cy + Math.sin(a) * r2;
    // Use a thick rect aligned along the radial line via perpendicular offset
    const perpX = -Math.sin(a) * (isMajor ? 1 : 0.5);
    const perpY = Math.cos(a) * (isMajor ? 1 : 0.5);
    g.fillTriangle(sx1 + perpX, sy1 + perpY, sx1 - perpX, sy1 - perpY, sx2 + perpX, sy2 + perpY);
    g.fillTriangle(sx1 - perpX, sy1 - perpY, sx2 + perpX, sy2 + perpY, sx2 - perpX, sy2 - perpY);
  }

  // HOUR HAND — thick, pointing up-right (10 o'clock-ish position)
  g.fillStyle(0x0a0a10, 1);
  // Hour hand as a thick triangle
  g.fillTriangle(cx, cy, cx - 4, cy - 3, cx - 0.7, cy);
  g.fillTriangle(cx, cy, cx - 0.7, cy, cx - 3, cy - 4);

  // MINUTE HAND — longer, thinner, pointing up
  g.fillStyle(0x0a0a10, 1);
  g.fillTriangle(cx, cy, cx - 0.5, cy - 7, cx + 0.5, cy - 7);

  // Centre pin (where the hands meet)
  g.fillStyle(0xd8a848, 1);
  g.fillCircle(cx, cy, 1.5);
  g.fillStyle(0xfadc6a, 1);
  g.fillCircle(cx, cy, 0.8);

  // Glass sheen on the top-left for depth
  g.fillStyle(0xffffff, 0.3);
  g.fillEllipse(cx - 3, cy - 4, 4, 2);

  g.generateTexture('ucard_stat_cooldown', s, s);
  g.destroy();
}

function drawStatKnockback(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x3a2818);
  const cx = 16, cy = 16;
  g.fillStyle(0xffcc88, 1);
  g.fillCircle(cx, cy, 4);
  g.fillStyle(0xffeecc, 1);
  g.fillCircle(cx, cy, 2);
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(cx, cy, 1);
  g.lineStyle(2, 0xffaa55, 0.6);
  g.strokeCircle(cx, cy, 7);
  g.lineStyle(1.5, 0xffcc88, 0.3);
  g.strokeCircle(cx, cy, 10);
  const arrows = [
    { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
    { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
  ];
  for (const { dx, dy } of arrows) {
    const ax = cx + dx * 11;
    const ay = cy + dy * 11;
    g.fillStyle(0xffaa55, 0.8);
    g.fillTriangle(
      ax + dx * 3, ay + dy * 3,
      ax - dy * 2, ay + dx * 2,
      ax + dy * 2, ay - dx * 2,
    );
  }
  g.fillStyle(0xffcc88, 0.3);
  g.fillCircle(cx - 8, cy - 8, 1.5);
  g.fillCircle(cx + 8, cy - 8, 1.5);
  g.fillCircle(cx - 8, cy + 8, 1.5);
  g.fillCircle(cx + 8, cy + 8, 1.5);
  g.generateTexture('ucard_stat_knockback', s, s);
  g.destroy();
}

/**
 * Bake every upgrade-card icon. Nine accessory cards + nine stat
 * cards = 18 textures total. Order matches BootScene's original call
 * sequence.
 */
export function bakeCardIcons(scene: Phaser.Scene): void {
  // Accessory passive cards
  drawSporran(scene);
  drawWhiskyFlask(scene);
  drawKilt(scene);
  drawTamOShanter(scene);
  drawIrnBru(scene);
  drawLochWater(scene);
  drawThistleCrown(scene);
  drawHighlandShield(scene);
  drawTartanSash(scene);
  // Stat boost cards
  drawStatHealth(scene);
  drawStatSpeed(scene);
  drawStatPickup(scene);
  drawStatDamage(scene);
  drawStatDrift(scene);
  drawStatDefense(scene);
  drawStatUtility(scene);
  drawStatCooldown(scene);
  drawStatKnockback(scene);
}
