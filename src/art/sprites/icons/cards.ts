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

function drawWhiskyFlask(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x332211);
  const cx = 16, cy = 16;
  g.fillStyle(0x555555, 1);
  g.fillRoundedRect(cx - 7, cy - 4, 14, 16, 3);
  g.fillStyle(0x888888, 1);
  g.fillRoundedRect(cx - 6, cy - 3, 12, 14, 2);
  g.fillStyle(0xaaaaaa, 1);
  g.fillRect(cx - 5, cy - 2, 3, 12);
  g.fillStyle(0xcccccc, 0.5);
  g.fillRect(cx - 4, cy - 1, 1, 10);
  g.fillStyle(0x666666, 1);
  g.fillRect(cx - 3, cy - 8, 6, 5);
  g.fillStyle(0x999999, 1);
  g.fillRect(cx - 2, cy - 7, 4, 3);
  g.fillStyle(0x777777, 1);
  g.fillRect(cx - 3, cy - 7, 6, 1);
  g.fillRect(cx - 3, cy - 5, 6, 1);
  g.fillStyle(0x442200, 1);
  g.fillEllipse(cx + 1, cy + 3, 6, 8);
  g.fillStyle(0xcc7711, 1);
  g.fillEllipse(cx + 1, cy + 4, 4, 5);
  g.fillStyle(0xee9922, 0.6);
  g.fillEllipse(cx + 1, cy + 3, 2, 3);
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
  const cx = 16, cy = 14;
  g.fillStyle(0x882222, 1);
  g.fillRect(cx - 10, cy - 6, 5, 14);
  g.fillStyle(0xcc3333, 1);
  g.fillRect(cx - 9, cy - 5, 3, 12);
  g.fillStyle(0x222288, 1);
  g.fillRect(cx + 5, cy - 6, 5, 14);
  g.fillStyle(0x3344cc, 1);
  g.fillRect(cx + 6, cy - 5, 3, 12);
  g.fillStyle(0x666666, 1);
  g.fillRect(cx - 10, cy + 6, 20, 5);
  g.fillRoundedRect(cx - 10, cy + 4, 20, 8, 4);
  g.fillStyle(0x999999, 1);
  g.fillRect(cx - 6, cy + 7, 12, 3);
  g.fillStyle(0xff4444, 1);
  g.fillRect(cx - 10, cy - 7, 5, 3);
  g.fillStyle(0x4466ff, 1);
  g.fillRect(cx + 5, cy - 7, 5, 3);
  g.fillStyle(0x99dd88, 0.5);
  g.fillCircle(cx, cy - 8, 1);
  g.fillCircle(cx - 2, cy - 10, 0.8);
  g.fillCircle(cx + 2, cy - 10, 0.8);
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

function drawStatDrift(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x2a2744);
  const cx = 16, cy = 16;
  g.lineStyle(3, 0x7755aa, 1);
  g.beginPath();
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 1.5 - Math.PI / 2;
    const r = 5 + i * 0.4;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.strokePath();
  g.lineStyle(2, 0xaa88dd, 1);
  g.beginPath();
  for (let i = 0; i < 15; i++) {
    const a = (i / 15) * Math.PI * 1.3 - Math.PI / 2;
    const r = 3 + i * 0.35;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.strokePath();
  g.fillStyle(0xc1a4ff, 1);
  g.fillCircle(cx, cy, 2.5);
  g.fillStyle(0xe8d4ff, 1);
  g.fillCircle(cx, cy, 1.2);
  g.fillStyle(0xc1a4ff, 1);
  const endA = (20 / 20) * Math.PI * 1.5 - Math.PI / 2;
  const endR = 5 + 20 * 0.4;
  const ex = cx + Math.cos(endA) * endR;
  const ey = cy + Math.sin(endA) * endR;
  g.fillTriangle(ex, ey, ex - 3, ey - 3, ex + 2, ey - 2);
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

function drawStatCooldown(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x2a2238);
  const cx = 16, cy = 16;
  g.fillStyle(0x886622, 1);
  g.fillRect(cx - 8, 5, 16, 3);
  g.fillStyle(0xbb9933, 1);
  g.fillRect(cx - 7, 6, 14, 1);
  g.fillStyle(0x886622, 1);
  g.fillRect(cx - 8, 24, 16, 3);
  g.fillStyle(0xbb9933, 1);
  g.fillRect(cx - 7, 25, 14, 1);
  g.fillStyle(0x445566, 0.6);
  g.fillTriangle(cx - 6, 8, cx + 6, 8, cx, cy);
  g.fillStyle(0x5a7a8a, 0.4);
  g.fillTriangle(cx - 5, 9, cx + 5, 9, cx, cy - 1);
  g.fillStyle(0x445566, 0.6);
  g.fillTriangle(cx, cy, cx - 6, 24, cx + 6, 24);
  g.fillStyle(0x5a7a8a, 0.4);
  g.fillTriangle(cx, cy + 1, cx - 5, 23, cx + 5, 23);
  g.fillStyle(0xddaa44, 1);
  g.fillTriangle(cx - 4, 24, cx + 4, 24, cx, 19);
  g.fillStyle(0xffcc66, 1);
  g.fillTriangle(cx - 3, 23, cx + 3, 23, cx, 20);
  g.fillStyle(0xddaa44, 0.7);
  g.fillRect(cx - 3, 9, 6, 3);
  g.fillStyle(0xffcc66, 0.5);
  g.fillRect(cx - 2, 10, 4, 1);
  g.fillStyle(0xddaa44, 1);
  g.fillRect(cx - 0.5, cy - 2, 1, 5);
  g.fillStyle(0x886622, 1);
  g.fillRect(cx - 7, 8, 2, 16);
  g.fillRect(cx + 5, 8, 2, 16);
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
