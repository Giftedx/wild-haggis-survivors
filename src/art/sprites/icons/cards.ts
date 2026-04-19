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

function drawSporran(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x3d2a20);
  const cx = 16, cy = 16;
  g.fillStyle(0x8a7a6a, 1);
  g.fillRect(cx - 8, cy - 6, 16, 4);
  g.fillStyle(0xa09080, 1);
  for (let i = 0; i < 8; i++) g.fillRect(cx - 7 + i * 2, cy - 6, 1, 3);
  g.fillStyle(0x3a2210, 1);
  g.fillEllipse(cx, cy + 2, 18, 14);
  g.fillStyle(0x5a3a1a, 1);
  g.fillEllipse(cx, cy + 2, 16, 12);
  g.fillStyle(0x6a4a28, 1);
  g.fillEllipse(cx - 2, cy, 10, 6);
  g.fillStyle(0x888888, 1);
  g.fillCircle(cx, cy - 1, 4);
  g.fillStyle(0xcccccc, 1);
  g.fillCircle(cx, cy - 1, 3);
  g.fillStyle(0xd4a017, 1);
  g.fillCircle(cx, cy - 1, 2);
  g.fillStyle(0xffcc44, 1);
  g.fillCircle(cx - 1, cy - 2, 0.8);
  g.fillStyle(0x3a2210, 1);
  g.fillRect(cx - 5, cy + 8, 2, 6);
  g.fillRect(cx - 1, cy + 8, 2, 7);
  g.fillRect(cx + 3, cy + 8, 2, 6);
  g.fillStyle(0x5a3a1a, 1);
  g.fillCircle(cx - 4, cy + 14, 1.5);
  g.fillCircle(cx, cy + 15, 1.5);
  g.fillCircle(cx + 4, cy + 14, 1.5);
  g.generateTexture('ucard_sporran', s, s);
  g.destroy();
}

/**
 * `ucard_whisky_flask` — hip flask pickup icon. Design pivot: old
 * grey metal rectangle with orange liquid puddle read as "radio" or
 * "hip pouch". New pitch — proper CURVED HIP-FLASK silhouette
 * (classic kidney-bean shape with screw-cap neck on top), polished
 * pewter body with tartan label strip across the middle for the
 * Scottish anchor. Screw-cap with chain is unmistakable.
 */
function drawWhiskyFlask(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x332211);
  const cx = 16, cy = 16;

  // ── Screw cap on top — the unmistakable flask-top tell. ──
  g.fillStyle(0x1a1008, 1);
  g.fillRect(cx - 3, cy - 12, 6, 3);
  g.fillStyle(0x5a3818, 1);
  g.fillRect(cx - 3, cy - 12, 6, 2);
  g.fillStyle(0x8a6028, 1);
  g.fillRect(cx - 3, cy - 12, 6, 0.8);
  // Cap ridges
  g.fillStyle(0x1a1008, 1);
  g.fillRect(cx - 3, cy - 11, 6, 0.4);
  g.fillRect(cx - 3, cy - 10.3, 6, 0.4);

  // ── Flask neck — narrower column between cap and body. ──
  g.fillStyle(0x2a2a32, 1);
  g.fillRect(cx - 2, cy - 9, 4, 3);
  g.fillStyle(0x6a6a72, 1);
  g.fillRect(cx - 2, cy - 9, 4, 1);

  // ── MAIN FLASK BODY — classic kidney/hip-flask curve. Rounded
  // rect with pinched waist. ──
  // Outline
  g.fillStyle(0x0a0a12, 1);
  g.fillRoundedRect(cx - 9, cy - 6, 18, 18, 5);
  // Body — polished pewter
  g.fillStyle(0x6a6a78, 1);
  g.fillRoundedRect(cx - 8, cy - 5, 16, 16, 4);
  g.fillStyle(0x8a8a98, 1);
  g.fillRoundedRect(cx - 8, cy - 5, 16, 8, 4);
  // Bright sheen strip down the left
  g.fillStyle(0xbabac8, 1);
  g.fillRect(cx - 7, cy - 4, 2, 14);
  g.fillStyle(0xdcdce8, 0.85);
  g.fillRect(cx - 7, cy - 4, 1, 14);

  // ── TARTAN LABEL — wraps across the centre of the flask. Red +
  // dark-green + gold = Royal Stewart palette, the Scottish anchor. ──
  g.fillStyle(0x8a1818, 1);
  g.fillRect(cx - 9, cy, 18, 5);
  // Dark crossbars
  g.fillStyle(0x2a0a0a, 0.9);
  g.fillRect(cx - 9, cy + 1.5, 18, 0.6);
  g.fillRect(cx - 9, cy + 3.5, 18, 0.6);
  // Vertical gold stripes
  g.fillStyle(0xdaaa40, 1);
  g.fillRect(cx - 5, cy, 0.8, 5);
  g.fillRect(cx + 3, cy, 0.8, 5);
  // Dark green tiny stripe
  g.fillStyle(0x1a4818, 1);
  g.fillRect(cx - 1, cy, 0.8, 5);

  // ── Amber whisky visible through a small window in the body
  // above the label — tiny glass porthole so the "whisky" anchor
  // isn't hidden. ──
  g.fillStyle(0x4a2808, 1);
  g.fillEllipse(cx + 4, cy - 2, 5, 3);
  g.fillStyle(0xc8781a, 1);
  g.fillEllipse(cx + 4, cy - 2, 4, 2.2);
  g.fillStyle(0xffb060, 0.9);
  g.fillCircle(cx + 3.3, cy - 2.5, 0.8);

  // ── Small chain linking the cap to the body. ──
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

function drawTamOShanter(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x2a2238);
  const cx = 16, cy = 15;
  g.fillStyle(0x1a2244, 1);
  g.fillEllipse(cx, cy - 1, 22, 14);
  g.fillStyle(0x2a3366, 1);
  g.fillEllipse(cx, cy - 2, 20, 12);
  g.fillStyle(0x3a4488, 1);
  g.fillEllipse(cx - 3, cy - 4, 10, 6);
  g.fillStyle(0x4a5599, 0.5);
  g.fillEllipse(cx - 4, cy - 5, 6, 3);
  g.fillStyle(0x111122, 1);
  g.fillRect(cx - 11, cy + 4, 22, 4);
  for (let i = 0; i < 11; i++) {
    const col = i % 2 === 0 ? 0xcc2233 : 0xeeeeee;
    g.fillStyle(col, 1);
    g.fillRect(cx - 10 + i * 2, cy + 5, 2, 2);
  }
  g.fillStyle(0x881122, 1);
  g.fillCircle(cx, cy - 8, 4);
  g.fillStyle(0xcc2244, 1);
  g.fillCircle(cx, cy - 8, 3);
  g.fillStyle(0xee4466, 1);
  g.fillCircle(cx - 1, cy - 9, 1.5);
  g.fillStyle(0xff6688, 0.7);
  g.fillCircle(cx - 1, cy - 10, 0.8);
  g.generateTexture('ucard_tam_o_shanter', s, s);
  g.destroy();
}

function drawIrnBru(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x44220f);
  const cx = 16;
  g.fillStyle(0x336633, 0.8);
  g.fillRect(cx - 2, 5, 4, 5);
  g.fillStyle(0x448844, 0.6);
  g.fillRect(cx - 1, 6, 2, 3);
  g.fillStyle(0xddaa00, 1);
  g.fillRect(cx - 3, 4, 6, 3);
  g.fillStyle(0xffcc33, 1);
  g.fillRect(cx - 2, 5, 4, 1);
  g.fillStyle(0x224422, 1);
  g.fillRoundedRect(cx - 7, 10, 14, 16, 3);
  g.fillStyle(0xdd6600, 1);
  g.fillRoundedRect(cx - 6, 11, 12, 14, 2);
  g.fillStyle(0xff8811, 1);
  g.fillRoundedRect(cx - 5, 12, 10, 12, 2);
  g.fillStyle(0xffaa33, 0.7);
  g.fillRect(cx - 3, 14, 4, 8);
  g.fillStyle(0xffcc66, 0.4);
  g.fillRect(cx - 2, 15, 2, 6);
  g.fillStyle(0x1144aa, 1);
  g.fillRect(cx - 6, 17, 12, 4);
  g.fillStyle(0x2266cc, 1);
  g.fillRect(cx - 5, 18, 10, 2);
  g.fillStyle(0xffffff, 0.2);
  g.fillRect(cx - 5, 12, 2, 12);
  g.generateTexture('ucard_irn_bru', s, s);
  g.destroy();
}

function drawLochWater(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x12334a);
  const cx = 16;
  g.fillStyle(0x8a6a3a, 1);
  g.fillRect(cx - 3, 5, 6, 4);
  g.fillStyle(0xaa8a5a, 1);
  g.fillRect(cx - 2, 6, 4, 2);
  g.fillStyle(0x446688, 0.8);
  g.fillRect(cx - 2, 9, 4, 3);
  g.fillStyle(0x224466, 1);
  g.fillRoundedRect(cx - 8, 12, 16, 14, 4);
  g.fillStyle(0x114433, 1);
  g.fillRoundedRect(cx - 7, 13, 14, 12, 3);
  g.fillStyle(0x226655, 1);
  g.fillRoundedRect(cx - 6, 14, 12, 10, 2);
  g.fillStyle(0x44ccaa, 0.4);
  g.fillCircle(cx, 20, 4);
  g.fillStyle(0x66eedd, 0.3);
  g.fillCircle(cx, 19, 2);
  g.fillStyle(0x88ddcc, 0.7);
  g.fillCircle(cx - 3, 17, 1);
  g.fillCircle(cx + 2, 15, 0.8);
  g.fillCircle(cx + 4, 19, 1);
  g.fillStyle(0xffffff, 0.15);
  g.fillRect(cx - 6, 14, 2, 10);
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

function drawHighlandShield(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x1f2b44);
  const cx = 16, cy = 16;
  g.fillStyle(0x3a2a1a, 1);
  g.fillCircle(cx, cy, 13);
  g.fillStyle(0x4a5a6a, 1);
  g.fillCircle(cx, cy, 11);
  g.fillStyle(0x5a6a7a, 1);
  g.fillCircle(cx, cy, 10);
  g.lineStyle(1, 0x7a8a9a, 0.8);
  g.strokeCircle(cx, cy, 8);
  g.lineStyle(1, 0x6a7a8a, 0.6);
  g.strokeCircle(cx, cy, 5);
  g.fillStyle(0x888888, 1);
  g.fillCircle(cx, cy, 4);
  g.fillStyle(0xbbbbbb, 1);
  g.fillCircle(cx, cy, 3);
  g.fillStyle(0xdddddd, 1);
  g.fillCircle(cx, cy, 1.5);
  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(cx - 1, cy - 1, 1);
  g.fillStyle(0xccaa44, 1);
  g.fillCircle(cx, cy - 10, 1.5);
  g.fillCircle(cx, cy + 10, 1.5);
  g.fillCircle(cx - 10, cy, 1.5);
  g.fillCircle(cx + 10, cy, 1.5);
  g.fillStyle(0xffffff, 0.1);
  g.fillCircle(cx - 4, cy - 6, 5);
  g.generateTexture('ucard_highland_shield', s, s);
  g.destroy();
}

function drawTartanSash(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x3b1f2d);
  g.fillStyle(0x661133, 1);
  for (let i = 0; i < 20; i++) {
    g.fillRect(4 + i, 4 + i, 8, 2);
  }
  g.fillStyle(0x992244, 1);
  for (let i = 0; i < 20; i++) {
    g.fillRect(5 + i, 5 + i, 6, 1);
  }
  g.fillStyle(0xcc5566, 0.6);
  for (let i = 0; i < 18; i += 4) {
    g.fillRect(5 + i, 5 + i, 6, 1);
  }
  g.fillStyle(0xffcc44, 0.4);
  for (let i = 2; i < 18; i += 6) {
    g.fillRect(5 + i, 5 + i, 6, 1);
  }
  g.fillStyle(0x888888, 1);
  g.fillCircle(11, 11, 4);
  g.fillStyle(0xcccccc, 1);
  g.fillCircle(11, 11, 3);
  g.fillStyle(0x8844aa, 1);
  g.fillCircle(11, 11, 1.5);
  g.fillStyle(0xdddddd, 1);
  g.fillCircle(10, 10, 0.7);
  g.fillStyle(0x661133, 1);
  g.fillRect(22, 24, 2, 4);
  g.fillRect(24, 25, 2, 3);
  g.fillRect(26, 26, 2, 2);
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

function drawStatPickup(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x243a22);
  const cx = 16, cy = 16;

  // ── Horseshoe magnet — the universal "pickup range" icon.
  // Classic red body + white pole tips. Drawn facing down-right
  // so an incoming XP gem can fly toward the opening. ──
  // Magnet body shadow
  g.fillStyle(0x441010, 1);
  g.fillRect(cx - 9, cy - 10, 16, 4);
  g.fillRect(cx - 9, cy - 10, 4, 12);
  g.fillRect(cx + 3, cy - 10, 4, 12);
  // Magnet red body
  g.fillStyle(0xcc2222, 1);
  g.fillRect(cx - 8, cy - 9, 14, 3);
  g.fillRect(cx - 8, cy - 9, 3, 10);
  g.fillRect(cx + 4, cy - 9, 3, 10);
  // Magnet red highlight
  g.fillStyle(0xee5544, 1);
  g.fillRect(cx - 7, cy - 9, 12, 1);
  g.fillRect(cx - 7, cy - 8, 1, 8);
  g.fillRect(cx + 5, cy - 8, 1, 8);

  // ── White pole tips at the open end (classic horseshoe-magnet
  // detail — shows which ends attract). ──
  g.fillStyle(0xf0f0e0, 1);
  g.fillRect(cx - 8, cy + 1, 3, 2);
  g.fillRect(cx + 4, cy + 1, 3, 2);
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 8, cy + 1, 3, 1);
  g.fillRect(cx + 4, cy + 1, 3, 1);

  // ── Magnetic field arcs — three glowing cyan arcs radiating
  // from the pole tips, selling the "pulling items in" fantasy. ──
  g.lineStyle(1, 0x66ddff, 0.7);
  g.beginPath();
  g.arc(cx - 6.5, cy + 4, 3, -Math.PI * 0.1, Math.PI * 0.6);
  g.strokePath();
  g.beginPath();
  g.arc(cx + 5.5, cy + 4, 3, Math.PI * 0.4, Math.PI * 1.1);
  g.strokePath();
  g.lineStyle(0.8, 0x88eeff, 0.5);
  g.beginPath();
  g.arc(cx - 6.5, cy + 4, 5, -Math.PI * 0.1, Math.PI * 0.6);
  g.strokePath();
  g.beginPath();
  g.arc(cx + 5.5, cy + 4, 5, Math.PI * 0.4, Math.PI * 1.1);
  g.strokePath();

  // ── Incoming XP gem — green diamond being pulled toward the
  // magnet. Classic "item flying in" beat. ──
  g.fillStyle(0x3a7a2a, 1);
  g.fillTriangle(cx, cy + 9, cx - 3, cy + 11, cx, cy + 13);
  g.fillTriangle(cx, cy + 9, cx + 3, cy + 11, cx, cy + 13);
  g.fillStyle(0x6adc4a, 1);
  g.fillTriangle(cx, cy + 9.5, cx - 2, cy + 11, cx, cy + 12.5);
  g.fillTriangle(cx, cy + 9.5, cx + 2, cy + 11, cx, cy + 12.5);
  g.fillStyle(0xaaffaa, 0.9);
  g.fillCircle(cx - 0.5, cy + 10.5, 0.8);

  // ── Motion streak behind the gem — short trail dots showing
  // it's being yanked toward the magnet. ──
  g.fillStyle(0xaaffaa, 0.55);
  g.fillCircle(cx, cy + 14, 0.6);
  g.fillCircle(cx, cy + 15, 0.4);

  g.generateTexture('ucard_stat_pickup', s, s);
  g.destroy();
}

function drawStatDamage(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x3c2318);
  const cx = 16, cy = 16;
  g.fillStyle(0x667788, 1);
  for (let i = 0; i < 18; i++) g.fillRect(5 + i, 5 + i, 3, 2);
  g.fillStyle(0x99aabb, 1);
  for (let i = 0; i < 16; i++) g.fillRect(6 + i, 6 + i, 2, 1);
  g.fillStyle(0x667788, 1);
  for (let i = 0; i < 18; i++) g.fillRect(24 - i, 5 + i, 3, 2);
  g.fillStyle(0x99aabb, 1);
  for (let i = 0; i < 16; i++) g.fillRect(24 - i, 6 + i, 2, 1);
  g.fillStyle(0xcc8833, 1);
  g.fillRect(cx - 1, cy - 3, 6, 2);
  g.fillStyle(0xcc8833, 1);
  g.fillRect(cx - 5, cy - 1, 6, 2);
  g.fillStyle(0xffaa44, 1);
  g.fillCircle(cx, cy, 3);
  g.fillStyle(0xffdd88, 1);
  g.fillCircle(cx, cy, 1.5);
  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(cx, cy, 0.8);
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

function drawStatDefense(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x1f2e3a);
  const cx = 16, cy = 16;
  g.fillStyle(0x556677, 1);
  g.fillRoundedRect(cx - 9, cy - 8, 18, 20, 4);
  g.fillStyle(0x778899, 1);
  g.fillRoundedRect(cx - 8, cy - 7, 16, 18, 3);
  g.fillStyle(0x1f2e3a, 1);
  g.fillEllipse(cx, cy - 7, 8, 4);
  g.fillStyle(0x99aabb, 1);
  g.fillRect(cx - 1, cy - 5, 2, 14);
  g.fillStyle(0xaabbcc, 0.6);
  g.fillRect(cx - 6, cy - 4, 3, 10);
  g.fillStyle(0xccddee, 0.3);
  g.fillRect(cx - 5, cy - 3, 1, 8);
  g.fillStyle(0xbbccdd, 1);
  g.fillCircle(cx - 5, cy - 3, 1);
  g.fillCircle(cx + 5, cy - 3, 1);
  g.fillCircle(cx - 5, cy + 6, 1);
  g.fillCircle(cx + 5, cy + 6, 1);
  g.fillStyle(0x334455, 1);
  g.fillRect(cx - 8, cy + 10, 16, 2);
  g.generateTexture('ucard_stat_defense', s, s);
  g.destroy();
}

function drawStatUtility(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x2d2d22);
  const cx = 16, cy = 16;
  g.fillStyle(0xd8d86e, 0.15);
  g.fillCircle(cx, cy, 12);
  g.fillStyle(0x99993a, 1);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = 10;
    g.fillTriangle(
      cx, cy,
      cx + Math.cos(a - 0.15) * r, cy + Math.sin(a - 0.15) * r,
      cx + Math.cos(a + 0.15) * r, cy + Math.sin(a + 0.15) * r,
    );
  }
  g.fillStyle(0xcccc55, 1);
  g.fillCircle(cx, cy, 5);
  g.fillStyle(0xdddd77, 1);
  g.fillCircle(cx, cy, 3.5);
  g.fillStyle(0xffffaa, 1);
  g.fillCircle(cx, cy, 2);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx - 1, cy - 1, 1);
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(cx, cy - 10, 1);
  g.fillCircle(cx, cy + 10, 1);
  g.fillCircle(cx - 10, cy, 1);
  g.fillCircle(cx + 10, cy, 1);
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
