/**
 * Weapon HUD icons — `wicon_*` 32×32 textures shown in the HUD weapon
 * slots. 15 icons total: 8 base weapons + 7 evolutions + the
 * stand-alone claymore + bagpipes-utility. Grouped in a single file
 * because they share a style (32×32, transparent BG, centred
 * silhouette — the HUD provides the slot chrome around them).
 *
 * If an individual icon grows to need bespoke helpers, split into
 * `icons/weapons/<name>.ts` — current scope fits one file cleanly.
 */

import Phaser from 'phaser';

function drawThistleShotIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 15;
  g.fillStyle(0x224411, 1);
  g.fillTriangle(cx, cy + 5, cx - 6, cy + 10, cx + 6, cy + 10);
  g.fillStyle(0x336622, 1);
  g.fillTriangle(cx, cy + 6, cx - 4, cy + 9, cx + 4, cy + 9);
  g.fillStyle(0x2a4a1a, 1);
  g.fillRect(cx - 1, cy + 9, 2, 5);
  g.fillStyle(0x331155, 1);
  g.fillCircle(cx, cy, 10);
  g.fillStyle(0x663399, 1);
  g.fillCircle(cx, cy, 9);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.fillStyle(0x552288, 1);
    g.fillTriangle(
      cx + Math.cos(a) * 13, cy + Math.sin(a) * 13,
      cx + Math.cos(a - 0.25) * 7, cy + Math.sin(a - 0.25) * 7,
      cx + Math.cos(a + 0.25) * 7, cy + Math.sin(a + 0.25) * 7,
    );
    g.fillStyle(0xaa77dd, 0.7);
    g.fillTriangle(
      cx + Math.cos(a) * 11, cy + Math.sin(a) * 11,
      cx + Math.cos(a - 0.15) * 7, cy + Math.sin(a - 0.15) * 7,
      cx + Math.cos(a + 0.15) * 7, cy + Math.sin(a + 0.15) * 7,
    );
  }
  g.fillStyle(0x8855bb, 1);
  g.fillCircle(cx, cy, 6);
  g.fillStyle(0xaa77dd, 0.7);
  g.fillCircle(cx - 1, cy - 1, 4);
  g.fillStyle(0xddaaff, 1);
  g.fillCircle(cx, cy, 2);
  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(cx - 1, cy - 1, 1);
  g.generateTexture('wicon_thistle_shot', s, s);
  g.destroy();
}

function drawCaberTossIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cy = 16;
  g.fillStyle(0x1a0e02, 1);
  g.fillRect(3, cy - 5, 22, 11);
  g.fillCircle(24, cy, 5);
  g.fillStyle(0x6a4a10, 1);
  g.fillRect(4, cy - 4, 20, 9);
  g.fillStyle(0x3a2808, 1);
  g.fillRect(4, cy - 4, 20, 2);
  g.fillRect(4, cy + 3, 20, 2);
  g.fillStyle(0x5a3a08, 0.7);
  g.fillRect(4, cy - 1, 20, 1);
  g.fillRect(4, cy + 1, 20, 1);
  g.fillStyle(0x8a6a20, 0.5);
  g.fillRect(4, cy, 20, 1);
  g.fillStyle(0x9a7a28, 0.5);
  g.fillRect(5, cy - 3, 18, 1);
  g.fillStyle(0x3a2206, 1);
  g.fillCircle(12, cy, 1.5);
  g.fillStyle(0x5a3e08, 1);
  g.fillCircle(24, cy, 4.5);
  g.fillStyle(0x7a5a14, 1);
  g.fillCircle(24, cy, 3.5);
  g.lineStyle(0.8, 0x5a4010, 0.6);
  g.strokeCircle(24, cy, 2.5);
  g.fillStyle(0x4a3008, 1);
  g.fillCircle(24, cy, 0.8);
  g.fillStyle(0x9a7a28, 0.3);
  g.fillCircle(23, cy - 1, 1.5);
  g.generateTexture('wicon_caber_toss', s, s);
  g.destroy();
}

function drawHaggisHurlerIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 16;
  g.fillStyle(0xccbb88, 0.2);
  g.fillCircle(cx - 2, cy - 12, 2.5);
  g.fillCircle(cx + 3, cy - 11, 2);
  g.fillCircle(cx, cy - 14, 1.5);
  g.fillStyle(0x1a0e04, 1);
  g.fillCircle(cx, cy, 11);
  g.fillCircle(cx + 1, cy - 1, 10);
  g.fillCircle(cx - 2, cy + 1, 9);
  g.fillStyle(0x4a3008, 1);
  g.fillCircle(cx, cy, 10);
  g.fillCircle(cx + 1, cy - 1, 9);
  g.fillStyle(0x6a4a10, 1);
  g.fillCircle(cx - 1, cy - 1, 8);
  g.fillStyle(0x7a5a18, 0.7);
  g.fillCircle(cx - 2, cy - 2, 5);
  g.fillStyle(0x9a8030, 0.8);
  g.fillCircle(cx - 4, cy - 1, 1.2);
  g.fillCircle(cx + 3, cy + 3, 1.5);
  g.fillCircle(cx + 1, cy - 4, 1);
  g.fillCircle(cx - 1, cy + 4, 1.2);
  g.fillCircle(cx + 5, cy, 0.8);
  g.fillStyle(0x2a1806, 0.6);
  g.fillCircle(cx + 4, cy - 2, 0.8);
  g.fillCircle(cx - 3, cy + 5, 0.7);
  g.fillStyle(0xbb9933, 0.5);
  g.fillCircle(cx - 3, cy - 4, 2.5);
  g.fillStyle(0xddbb55, 0.3);
  g.fillCircle(cx - 4, cy - 5, 1.5);
  g.fillStyle(0xffffff, 0.3);
  g.fillCircle(cx - 4, cy - 5, 0.8);
  g.generateTexture('wicon_haggis_hurler', s, s);
  g.destroy();
}

function drawBagpipeBlastIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;
  g.fillStyle(0x1a0d00, 1);
  g.fillEllipse(cx + 1, cy + 6, 22, 17);
  g.fillStyle(0x4a2200, 1);
  g.fillEllipse(cx + 1, cy + 6, 20, 15);
  g.fillStyle(0x7a3d10, 1);
  g.fillEllipse(cx + 1, cy + 5, 16, 12);
  g.fillStyle(0xaa6030, 1);
  g.fillEllipse(cx - 2, cy + 3, 10, 7);
  g.fillStyle(0xcc8855, 0.6);
  g.fillEllipse(cx - 3, cy + 2, 6, 4);
  g.fillStyle(0x221100, 1);
  g.fillRect(cx - 10, cy - 2, 2, 9);
  g.fillStyle(0x553322, 1);
  g.fillRect(cx - 9, cy - 2, 1, 8);
  g.fillStyle(0xddaa00, 1);
  g.fillRect(cx - 11, cy - 3, 4, 2);
  g.fillStyle(0xffdd44, 1);
  g.fillRect(cx - 10, cy - 3, 2, 1);
  g.fillStyle(0x221100, 1);
  g.fillRect(cx - 4, cy - 12, 3, 14);
  g.fillRect(cx + 1, cy - 14, 3, 16);
  g.fillRect(cx + 6, cy - 12, 3, 14);
  g.fillStyle(0x553322, 1);
  g.fillRect(cx - 3, cy - 12, 1, 13);
  g.fillRect(cx + 2, cy - 14, 1, 15);
  g.fillRect(cx + 7, cy - 12, 1, 13);
  g.fillStyle(0xddaa00, 1);
  g.fillRect(cx - 5, cy - 13, 5, 2);
  g.fillRect(cx, cy - 15, 5, 2);
  g.fillRect(cx + 5, cy - 13, 5, 2);
  g.fillStyle(0xffee66, 1);
  g.fillRect(cx - 4, cy - 13, 2, 1);
  g.fillRect(cx + 1, cy - 15, 2, 1);
  g.fillRect(cx + 6, cy - 13, 2, 1);
  g.fillStyle(0x221100, 1);
  g.fillRect(cx - 14, cy + 4, 14, 3);
  g.fillStyle(0x553322, 1);
  g.fillRect(cx - 14, cy + 4, 14, 1);
  g.fillStyle(0x221100, 1);
  g.fillRect(cx - 16, cy + 3, 3, 5);
  g.fillStyle(0x553322, 1);
  g.fillRect(cx - 15, cy + 4, 1, 3);
  g.lineStyle(1, 0xffaa33, 0.9);
  g.strokeCircle(cx - 17, cy + 5, 3);
  g.lineStyle(1, 0xffaa33, 0.6);
  g.strokeCircle(cx - 17, cy + 5, 5);
  g.lineStyle(1, 0xffaa33, 0.35);
  g.strokeCircle(cx - 17, cy + 5, 7);
  g.generateTexture('wicon_bagpipe_blast', s, s);
  g.destroy();
}

function drawBagpipesUtilityIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;
  g.fillStyle(0x336622, 0.25);
  g.fillCircle(cx, cy, 14);
  g.fillStyle(0x44aa33, 0.15);
  g.fillCircle(cx, cy, 10);
  g.fillStyle(0x1a0d00, 1);
  g.fillEllipse(cx + 5, cy + 2, 18, 15);
  g.fillStyle(0x4a2200, 1);
  g.fillEllipse(cx + 5, cy + 2, 16, 13);
  g.fillStyle(0x7a3d10, 1);
  g.fillEllipse(cx + 5, cy + 1, 13, 10);
  g.fillStyle(0xaa6030, 1);
  g.fillEllipse(cx + 3, cy - 1, 8, 6);
  g.fillStyle(0xcc8855, 0.5);
  g.fillEllipse(cx + 2, cy - 2, 5, 3);
  g.fillStyle(0x221100, 1);
  g.fillRect(cx - 13, cy + 2, 15, 3);
  g.fillStyle(0x553322, 1);
  g.fillRect(cx - 13, cy + 2, 15, 1);
  g.fillStyle(0x221100, 1);
  g.fillRect(cx - 15, cy + 1, 3, 5);
  g.fillStyle(0x221100, 1);
  g.fillRect(cx + 2, cy - 12, 3, 13);
  g.fillRect(cx + 7, cy - 10, 3, 11);
  g.fillStyle(0x553322, 1);
  g.fillRect(cx + 3, cy - 12, 1, 12);
  g.fillRect(cx + 8, cy - 10, 1, 10);
  g.fillStyle(0xddaa00, 1);
  g.fillRect(cx + 1, cy - 13, 5, 2);
  g.fillRect(cx + 6, cy - 11, 5, 2);
  g.fillStyle(0xffee66, 1);
  g.fillRect(cx + 2, cy - 13, 2, 1);
  g.fillRect(cx + 7, cy - 11, 2, 1);
  g.fillStyle(0xffee44, 1);
  g.fillCircle(cx - 10, cy - 8, 2.5);
  g.fillRect(cx - 8, cy - 14, 2, 7);
  g.fillRect(cx - 8, cy - 14, 5, 2);
  g.fillStyle(0xffdd22, 0.8);
  g.fillCircle(cx - 4, cy - 12, 1.5);
  g.fillRect(cx - 2, cy - 16, 1.5, 5);
  g.generateTexture('wicon_bagpipes', s, s);
  g.destroy();
}

function drawScotchMistIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;
  g.fillStyle(0x3a4d55, 0.35);
  g.fillCircle(cx - 8, cy + 4, 7);
  g.fillCircle(cx + 8, cy + 4, 7);
  g.fillCircle(cx, cy - 4, 8);
  g.fillCircle(cx - 5, cy + 6, 5);
  g.fillCircle(cx + 5, cy + 6, 5);
  g.fillStyle(0x556677, 0.55);
  g.fillCircle(cx - 6, cy + 3, 6);
  g.fillCircle(cx + 6, cy + 3, 6);
  g.fillCircle(cx, cy - 3, 7);
  g.fillCircle(cx - 3, cy + 4, 5);
  g.fillCircle(cx + 3, cy + 4, 5);
  g.fillStyle(0x6a7d8e, 0.75);
  g.fillCircle(cx - 4, cy + 1, 5);
  g.fillCircle(cx + 4, cy + 1, 5);
  g.fillCircle(cx, cy - 2, 6);
  g.fillCircle(cx - 1, cy + 2, 5);
  g.fillCircle(cx + 1, cy + 2, 5);
  g.fillStyle(0x8899aa, 0.9);
  g.fillCircle(cx - 2, cy, 4);
  g.fillCircle(cx + 2, cy, 4);
  g.fillCircle(cx, cy - 2, 4.5);
  g.fillStyle(0x99aabb, 0.5);
  g.fillCircle(cx - 12, cy + 2, 2.5);
  g.fillCircle(cx + 12, cy + 2, 2.5);
  g.fillCircle(cx, cy + 10, 2.5);
  g.fillStyle(0xaabbcc, 0.35);
  g.fillCircle(cx - 13, cy, 1.5);
  g.fillCircle(cx + 13, cy, 1.5);
  g.fillStyle(0x223344, 0.7);
  g.fillCircle(cx, cy + 1, 3);
  g.fillStyle(0x334455, 0.5);
  g.fillRect(cx - 1, cy + 3, 2, 2);
  g.fillStyle(0x1a2a33, 0.8);
  g.fillCircle(cx - 1, cy + 1, 0.8);
  g.fillCircle(cx + 1, cy + 1, 0.8);
  g.fillStyle(0xccddee, 1);
  g.fillCircle(cx - 2, cy - 3, 1);
  g.fillCircle(cx + 4, cy - 1, 0.8);
  g.fillStyle(0xddeeff, 0.8);
  g.fillCircle(cx - 6, cy + 1, 0.8);
  g.fillCircle(cx + 7, cy, 0.7);
  g.fillCircle(cx, cy + 6, 0.7);
  g.generateTexture('wicon_scotch_mist', s, s);
  g.destroy();
}

function drawNessieTentacleIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;
  g.fillStyle(0x0d2e1a, 1);
  g.fillCircle(cx - 7, cy + 8, 6);
  g.fillCircle(cx - 3, cy + 5, 5.5);
  g.fillStyle(0x1e5c36, 1);
  g.fillCircle(cx - 7, cy + 8, 5);
  g.fillCircle(cx - 3, cy + 5, 4.5);
  g.fillStyle(0x3a8c56, 1);
  g.fillCircle(cx - 8, cy + 7, 2.5);
  g.fillCircle(cx - 4, cy + 4, 2.2);
  g.fillStyle(0x55bb77, 0.6);
  g.fillCircle(cx - 8, cy + 6, 1.2);
  g.fillStyle(0xbbaa88, 1);
  g.fillCircle(cx - 4, cy + 9, 1.2);
  g.fillCircle(cx - 1, cy + 7, 1.0);
  g.fillStyle(0x0d2e1a, 1);
  g.fillCircle(cx + 1, cy + 1, 4.5);
  g.fillCircle(cx + 4, cy - 2, 4);
  g.fillStyle(0x226644, 1);
  g.fillCircle(cx + 1, cy + 1, 3.5);
  g.fillCircle(cx + 4, cy - 2, 3.2);
  g.fillStyle(0x44996a, 1);
  g.fillCircle(cx, cy, 1.8);
  g.fillCircle(cx + 3, cy - 3, 1.5);
  g.fillStyle(0xbbaa88, 1);
  g.fillCircle(cx + 4, cy + 2, 1.0);
  g.fillCircle(cx + 6, cy - 1, 0.9);
  g.fillStyle(0x0d2e1a, 1);
  g.fillCircle(cx + 8, cy - 6, 3);
  g.fillCircle(cx + 10, cy - 9, 2.2);
  g.fillStyle(0x2a7752, 1);
  g.fillCircle(cx + 8, cy - 6, 2.2);
  g.fillCircle(cx + 10, cy - 9, 1.5);
  g.fillStyle(0x55cc88, 1);
  g.fillCircle(cx + 7, cy - 7, 1.0);
  g.fillStyle(0x88ccee, 0.9);
  g.fillCircle(cx + 13, cy - 8, 1.2);
  g.fillCircle(cx + 11, cy - 12, 1.0);
  g.fillCircle(cx - 10, cy + 10, 1.0);
  g.fillStyle(0x66bbdd, 0.7);
  g.fillCircle(cx + 14, cy - 5, 0.8);
  g.fillCircle(cx - 12, cy + 7, 0.8);
  g.generateTexture('wicon_nessie_tentacle', s, s);
  g.destroy();
}

function drawThistleStormIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;
  g.fillStyle(0x440066, 0.3);
  g.fillCircle(cx, cy, 15);
  g.fillStyle(0x6622aa, 0.2);
  g.fillCircle(cx, cy, 11);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const tx = cx + Math.cos(a) * 11;
    const ty = cy + Math.sin(a) * 11;
    g.lineStyle(1, 0x9944cc, 0.4);
    g.lineBetween(cx, cy, tx, ty);
  }
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const r = 9 + (i % 2) * 1.5;
    const tx = cx + Math.cos(a) * r;
    const ty = cy + Math.sin(a) * r;
    g.fillStyle(0x2a0044, 1);
    g.fillCircle(tx, ty, 3);
    g.fillStyle(0x7722aa, 1);
    g.fillCircle(tx, ty, 2.2);
    g.fillStyle(0xaa55dd, 1);
    g.fillCircle(tx, ty, 1.2);
    g.fillStyle(0xcc88ff, 1);
    g.fillCircle(tx + Math.cos(a) * 2.5, ty + Math.sin(a) * 2.5, 0.9);
    g.fillStyle(0xbb66ee, 0.8);
    g.fillCircle(tx + Math.cos(a + 1.2) * 2, ty + Math.sin(a + 1.2) * 2, 0.7);
    g.fillCircle(tx + Math.cos(a - 1.2) * 2, ty + Math.sin(a - 1.2) * 2, 0.7);
  }
  g.fillStyle(0x9944dd, 1);
  g.fillCircle(cx, cy, 4);
  g.fillStyle(0xdd88ff, 1);
  g.fillCircle(cx, cy, 2.5);
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(cx, cy, 1.2);
  g.generateTexture('wicon_thistle_storm', s, s);
  g.destroy();
}

function drawHighlandGamesIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  // Evolution-tier halo — fire/amber to match the flaming-hammer
  // motif. Pairs with the glow rings on every other evolution icon
  // (thistle_storm purple, highland_fling blue, william_blade gold,
  // nessie_unleashed teal) so the HUD reads "legendary" at a glance.
  const cx = 16, cy = 16;
  g.fillStyle(0xaa4400, 0.2);
  g.fillCircle(cx, cy, 15);
  g.fillStyle(0xcc6600, 0.22);
  g.fillCircle(cx, cy, 12);
  g.fillStyle(0xff8822, 0.22);
  g.fillCircle(cx, cy, 9);
  g.fillStyle(0x1a0e00, 1);
  g.fillRect(3, 14, 22, 8);
  g.fillStyle(0x3a2208, 1);
  g.fillRect(4, 15, 20, 6);
  g.fillStyle(0x6b4010, 1);
  g.fillRect(4, 16, 20, 4);
  g.fillStyle(0x8b5a18, 1);
  g.fillRect(4, 16, 20, 1);
  g.fillStyle(0x7a4e14, 0.6);
  g.fillRect(6, 18, 14, 1);
  g.fillStyle(0x2e1c06, 0.7);
  g.fillRect(8, 15, 1, 6);
  g.fillRect(14, 15, 1, 6);
  g.fillRect(20, 15, 1, 6);
  g.fillStyle(0x1a0e00, 0.8);
  g.fillRect(5, 21, 8, 1);
  g.fillRect(3, 22, 5, 1);
  g.fillRect(7, 22, 6, 1);
  g.fillStyle(0x0a0600, 0.7);
  g.fillCircle(24, 18, 3);
  g.fillCircle(21, 20, 2);
  g.fillStyle(0xcc2200, 0.85);
  g.fillCircle(27, 12, 6);
  g.fillCircle(26, 17, 5);
  g.fillTriangle(25, 9, 32, 14, 28, 7);
  g.fillTriangle(29, 16, 32, 10, 32, 19);
  g.fillStyle(0xff6600, 1);
  g.fillCircle(27, 13, 4.5);
  g.fillCircle(26, 16, 3.5);
  g.fillTriangle(26, 10, 31, 14, 28, 8);
  g.fillStyle(0xffcc00, 1);
  g.fillCircle(27, 14, 3);
  g.fillCircle(26, 16, 2);
  g.fillStyle(0xffeeaa, 1);
  g.fillCircle(27, 15, 1.5);
  g.fillStyle(0xff8800, 0.9);
  g.fillCircle(30, 8, 1);
  g.fillCircle(32, 12, 0.8);
  g.fillStyle(0xffcc22, 0.8);
  g.fillCircle(31, 6, 0.7);
  g.fillCircle(29, 5, 0.8);
  g.generateTexture('wicon_highland_games', s, s);
  g.destroy();
}

function drawHaggisCannonIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;
  g.lineStyle(1.5, 0x7a5010, 0.5);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.lineBetween(cx, cy, cx + Math.cos(a) * 13, cy + Math.sin(a) * 13);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const r = 10;
    const jx = cx + Math.cos(a) * r;
    const jy = cy + Math.sin(a) * r;
    g.fillStyle(0x5a3808, 0.5);
    g.fillCircle(jx - Math.cos(a) * 3, jy - Math.sin(a) * 3, 1.2);
    g.fillStyle(0x6b4a0a, 0.35);
    g.fillCircle(jx - Math.cos(a) * 5, jy - Math.sin(a) * 5, 0.8);
    g.fillStyle(0x1e1004, 1);
    g.fillCircle(jx, jy, 2.8);
    g.fillStyle(0x5a3808, 1);
    g.fillCircle(jx, jy, 2.2);
    g.fillStyle(0x8a5a14, 1);
    g.fillCircle(jx - 0.5, jy - 0.5, 1.2);
    g.fillStyle(0xaa7020, 0.8);
    g.fillCircle(jx - 0.8, jy - 0.8, 0.6);
  }
  g.fillStyle(0x6b4a0a, 0.7);
  g.fillCircle(cx - 12, cy - 12, 1.5);
  g.fillCircle(cx + 12, cy - 10, 1.2);
  g.fillCircle(cx - 10, cy + 12, 1.2);
  g.fillStyle(0x8a5a14, 0.5);
  g.fillCircle(cx + 13, cy + 8, 1.0);
  g.fillCircle(cx - 8, cy - 13, 0.8);
  g.fillStyle(0x1e1004, 1);
  g.fillCircle(cx, cy, 6.5);
  g.fillStyle(0x4a2c06, 1);
  g.fillCircle(cx, cy, 5.5);
  g.fillStyle(0x7a4e10, 1);
  g.fillCircle(cx - 1, cy - 1, 4);
  g.fillStyle(0xaa7020, 1);
  g.fillCircle(cx - 1.5, cy - 1.5, 2.2);
  g.fillStyle(0xcc9030, 0.7);
  g.fillCircle(cx - 2, cy - 2, 1.2);
  g.fillStyle(0xddccbb, 0.4);
  g.fillCircle(cx - 1, cy - 7, 1.5);
  g.fillCircle(cx + 1, cy - 9, 1.2);
  g.fillStyle(0xccbbaa, 0.25);
  g.fillCircle(cx, cy - 11, 1.0);
  g.generateTexture('wicon_haggis_cannon', s, s);
  g.destroy();
}

function drawHighlandFlingIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;
  g.lineStyle(3, 0x2255cc, 0.6);
  g.strokeCircle(cx, cy, 14);
  g.fillStyle(0x3366dd, 0.35);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.fillCircle(cx + Math.cos(a) * 14.5, cy + Math.sin(a) * 14.5, 1.2);
  }
  g.lineStyle(2, 0x3366ee, 1);
  g.strokeCircle(cx, cy, 13);
  g.lineStyle(2, 0x4499ff, 0.85);
  g.strokeCircle(cx, cy, 9);
  g.lineStyle(2, 0x88ccff, 0.7);
  g.strokeCircle(cx, cy, 5);
  g.fillStyle(0xaaddff, 0.85);
  g.fillCircle(cx + 10, cy - 6, 1.5);
  g.fillRect(cx + 11, cy - 10, 1.5, 4.5);
  g.fillRect(cx + 11, cy - 10, 4, 1.5);
  g.fillCircle(cx - 8, cy + 9, 1.2);
  g.fillRect(cx - 7, cy + 5, 1.2, 4);
  g.fillStyle(0x66aaff, 0.7);
  g.fillCircle(cx + 7, cy + 7, 1.0);
  g.fillCircle(cx - 7, cy - 7, 1.0);
  g.fillCircle(cx - 10, cy + 4, 0.9);
  g.fillCircle(cx + 4, cy - 10, 0.9);
  g.fillStyle(0x99ccff, 0.5);
  g.fillCircle(cx + 11, cy + 2, 0.8);
  g.fillCircle(cx - 2, cy + 11, 0.8);
  g.fillStyle(0x2244bb, 1);
  g.fillCircle(cx, cy, 4);
  g.fillStyle(0x66aaff, 1);
  g.fillCircle(cx, cy, 3);
  g.fillStyle(0xccddff, 1);
  g.fillCircle(cx, cy, 1.8);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx, cy, 1);
  g.generateTexture('wicon_highland_fling', s, s);
  g.destroy();
}

function drawTheHaarIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;
  // Evolution-tier halo — muted green-grey to match the mist palette
  // and pair with the other evolutions (highland_games orange,
  // thistle_storm purple, highland_fling blue, william_blade gold).
  // Kept low-alpha so the mist-skull composition stays the subject.
  g.fillStyle(0x3a5548, 0.2);
  g.fillCircle(cx, cy, 15);
  g.fillStyle(0x556e5c, 0.2);
  g.fillCircle(cx, cy, 11);
  g.fillStyle(0x2a3a33, 0.3);
  g.fillCircle(cx - 10, cy + 4, 7);
  g.fillCircle(cx + 10, cy + 4, 7);
  g.fillCircle(cx, cy - 6, 8);
  g.fillCircle(cx - 7, cy + 7, 5);
  g.fillCircle(cx + 7, cy + 7, 5);
  g.fillCircle(cx - 12, cy + 1, 4);
  g.fillCircle(cx + 12, cy + 1, 4);
  g.fillStyle(0x334433, 0.5);
  g.fillCircle(cx - 8, cy + 3, 6);
  g.fillCircle(cx + 8, cy + 3, 6);
  g.fillCircle(cx, cy - 4, 7);
  g.fillCircle(cx - 5, cy + 5, 5);
  g.fillCircle(cx + 5, cy + 5, 5);
  g.fillStyle(0x445544, 0.7);
  g.fillCircle(cx - 6, cy + 2, 5.5);
  g.fillCircle(cx + 6, cy + 2, 5.5);
  g.fillCircle(cx, cy - 2, 6.5);
  g.fillCircle(cx - 3, cy + 3, 5);
  g.fillCircle(cx + 3, cy + 3, 5);
  g.fillStyle(0x556655, 0.82);
  g.fillCircle(cx - 4, cy + 1, 4.5);
  g.fillCircle(cx + 4, cy + 1, 4.5);
  g.fillCircle(cx, cy - 1, 5.5);
  g.fillStyle(0x1e2d1e, 0.88);
  g.fillCircle(cx, cy + 1, 5);
  g.fillCircle(cx - 1, cy, 4);
  g.fillCircle(cx + 1, cy, 4);
  g.fillStyle(0x334433, 0.5);
  g.fillCircle(cx, cy - 1, 3);
  g.fillRect(cx - 2, cy + 2, 4, 4);
  g.fillStyle(0x99cc88, 0.45);
  g.fillCircle(cx - 1, cy - 1, 0.9);
  g.fillCircle(cx + 1, cy - 1, 0.9);
  g.fillStyle(0x88cc77, 0.5);
  g.fillCircle(cx - 2, cy - 3, 1.5);
  g.fillCircle(cx + 4, cy - 1, 1.2);
  g.fillStyle(0xaaddaa, 0.4);
  g.fillCircle(cx - 6, cy + 1, 1.0);
  g.fillCircle(cx + 6, cy + 1, 1.0);
  g.fillCircle(cx, cy + 8, 1.0);
  g.generateTexture('wicon_the_haar', s, s);
  g.destroy();
}

function drawNessieUnleashedIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;
  g.fillStyle(0x336688, 0.3);
  g.fillCircle(cx, cy, 15);
  g.fillStyle(0x224466, 0.2);
  g.fillCircle(cx, cy, 12);
  g.fillStyle(0x66aacc, 0.7);
  g.fillCircle(cx + 13, cy - 4, 1.5);
  g.fillCircle(cx - 13, cy + 3, 1.2);
  g.fillCircle(cx + 4, cy - 14, 1.3);
  g.fillCircle(cx - 5, cy + 13, 1.2);
  g.fillStyle(0x88ccee, 0.5);
  g.fillCircle(cx + 14, cy + 2, 1.0);
  g.fillCircle(cx - 2, cy - 14, 0.9);
  const tentacleAngles = [0.4, 1.9, 3.4, 4.9];
  for (let t = 0; t < 4; t++) {
    const baseAngle = tentacleAngles[t];
    for (let seg = 0; seg < 3; seg++) {
      const a = baseAngle + seg * 0.6;
      const r = 4 + seg * 3.5;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      const size = 3.8 - seg * 0.8;
      g.fillStyle(0x0d2e1a, 1);
      g.fillCircle(px, py, size + 0.7);
      g.fillStyle(0x1a5c36, 1);
      g.fillCircle(px, py, size);
      g.fillStyle(0x2a8052, 1);
      g.fillCircle(px - 0.5, py - 0.5, size * 0.65);
      g.fillStyle(0x44aa6a, 1);
      g.fillCircle(px - 0.8, py - 0.8, size * 0.35);
      if (seg > 0) {
        const suckerA = a + 1.5;
        const sx = px + Math.cos(suckerA) * (size - 0.5);
        const sy = py + Math.sin(suckerA) * (size - 0.5);
        g.fillStyle(0xbbaa88, 1);
        g.fillCircle(sx, sy, 0.9);
      }
      g.fillStyle(0x33ffaa, 0.4);
      g.fillCircle(px + Math.cos(a + 0.8) * size * 0.8, py + Math.sin(a + 0.8) * size * 0.8, 0.6);
    }
  }
  g.fillStyle(0x3a2a00, 1);
  g.fillCircle(cx, cy, 5);
  g.fillStyle(0xcc9900, 1);
  g.fillCircle(cx, cy, 4);
  g.fillStyle(0xffcc22, 1);
  g.fillCircle(cx, cy, 3);
  g.fillStyle(0xffee88, 1);
  g.fillCircle(cx - 0.5, cy - 0.5, 1.5);
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 0.7, cy - 3, 1.4, 6);
  g.lineStyle(1, 0x33ffaa, 0.5);
  g.strokeCircle(cx, cy, 5.5);
  g.generateTexture('wicon_nessie_unleashed', s, s);
  g.destroy();
}

function drawClaymoreIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  g.fillStyle(0x2a3038, 1);
  g.fillTriangle(24, 3, 10, 19, 14, 22);
  g.fillStyle(0x4e6070, 1);
  g.fillTriangle(24, 3, 11, 18, 15, 21);
  g.fillStyle(0xa8c0d0, 1);
  g.fillTriangle(23, 4, 13, 19, 16, 20);
  g.fillStyle(0xddeeff, 0.9);
  g.fillTriangle(22, 6, 14, 17, 15, 18);
  g.fillStyle(0xeef8ff, 0.8);
  g.fillTriangle(23, 5, 20, 8, 21, 7);
  g.fillStyle(0x3a5060, 0.7);
  g.fillRect(16, 8, 1, 9);
  g.fillStyle(0x2a1e14, 1);
  g.fillRect(5, 18, 22, 5);
  g.fillStyle(0x4a3828, 1);
  g.fillRect(6, 19, 20, 3);
  g.fillStyle(0x6a5440, 1);
  g.fillRect(6, 19, 20, 1);
  g.fillStyle(0x3a2a1c, 1);
  g.fillCircle(5, 20, 3);
  g.fillCircle(27, 20, 3);
  g.fillStyle(0x6a5440, 1);
  g.fillCircle(5, 19.5, 1.8);
  g.fillCircle(27, 19.5, 1.8);
  g.fillStyle(0x2a1a10, 1);
  g.fillRect(11, 22, 10, 6);
  g.fillStyle(0x4a3020, 1);
  g.fillRect(11, 23, 10, 1);
  g.fillRect(11, 25, 10, 1);
  g.fillRect(11, 27, 10, 1);
  g.fillStyle(0x5a3828, 0.6);
  g.fillRect(12, 22, 2, 6);
  g.fillStyle(0x1a1006, 1);
  g.fillCircle(16, 28, 4.5);
  g.fillStyle(0x886a1c, 1);
  g.fillCircle(16, 28, 3.8);
  g.fillStyle(0xb89030, 1);
  g.fillCircle(16, 27.5, 2.8);
  g.fillStyle(0xd8b848, 0.9);
  g.fillCircle(15.2, 27, 1.5);
  g.generateTexture('wicon_claymore', s, s);
  g.destroy();
}

function drawWilliamBladeIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;
  g.fillStyle(0xffaa00, 0.18);
  g.fillCircle(cx, cy, 15);
  g.fillStyle(0xffcc22, 0.22);
  g.fillCircle(cx, cy, 12);
  g.fillStyle(0xffdd44, 0.28);
  g.fillCircle(cx, cy, 9);
  g.lineStyle(1.5, 0xffcc44, 0.6);
  g.strokeCircle(cx, cy, 14);
  g.lineStyle(1, 0xffdd66, 0.4);
  g.strokeCircle(cx, cy, 11);
  g.fillStyle(0x5a3a00, 1);
  g.fillTriangle(cx + 1, cy - 12, cx - 4, cy + 4, cx + 6, cy + 4);
  g.fillStyle(0xaa7a10, 1);
  g.fillTriangle(cx + 1, cy - 11, cx - 3, cy + 3, cx + 5, cy + 3);
  g.fillStyle(0xd4a830, 1);
  g.fillTriangle(cx + 1, cy - 10, cx - 1, cy + 2, cx + 4, cy + 2);
  g.fillStyle(0xffe050, 1);
  g.fillTriangle(cx + 1, cy - 9, cx, cy + 1, cx + 2.5, cy);
  g.fillStyle(0xfff5aa, 0.9);
  g.fillTriangle(cx + 1, cy - 9, cx + 3, cy - 4, cx + 2, cy - 3);
  g.lineStyle(1, 0xffee66, 0.5);
  g.lineBetween(cx + 1, cy - 11, cx - 3, cy + 3);
  g.fillStyle(0x3a2800, 1);
  g.fillRect(cx - 9, cy + 3, 19, 5);
  g.fillStyle(0x7a5410, 1);
  g.fillRect(cx - 8, cy + 4, 17, 3);
  g.fillStyle(0xddaa33, 1);
  g.fillRect(cx - 7, cy + 4, 15, 2);
  g.fillStyle(0xffdd66, 1);
  g.fillRect(cx - 7, cy + 4, 15, 1);
  g.fillStyle(0x3a2800, 1);
  g.fillCircle(cx - 8, cy + 5, 3.5);
  g.fillStyle(0xcc8822, 1);
  g.fillCircle(cx - 8, cy + 5, 2.8);
  g.fillStyle(0xff4444, 1);
  g.fillCircle(cx - 8, cy + 5, 1.6);
  g.fillStyle(0xff9999, 0.8);
  g.fillCircle(cx - 8.4, cy + 4.6, 0.7);
  g.fillStyle(0x3a2800, 1);
  g.fillCircle(cx + 9, cy + 5, 3.5);
  g.fillStyle(0xcc8822, 1);
  g.fillCircle(cx + 9, cy + 5, 2.8);
  g.fillStyle(0x4488ff, 1);
  g.fillCircle(cx + 9, cy + 5, 1.6);
  g.fillStyle(0xaaccff, 0.8);
  g.fillCircle(cx + 8.6, cy + 4.6, 0.7);
  g.fillStyle(0x2a1800, 1);
  g.fillRect(cx - 2, cy + 7, 5, 7);
  g.fillStyle(0xcc9922, 1);
  g.fillRect(cx - 2, cy + 8, 5, 1);
  g.fillRect(cx - 2, cy + 10, 5, 1);
  g.fillRect(cx - 2, cy + 12, 5, 1);
  g.fillStyle(0x3a2808, 0.7);
  g.fillRect(cx - 1, cy + 7, 1.5, 7);
  g.fillStyle(0x2a1800, 1);
  g.fillCircle(cx + 1, cy + 14, 5);
  g.fillStyle(0xaa7820, 1);
  g.fillCircle(cx + 1, cy + 14, 4.2);
  g.fillStyle(0xddaa33, 1);
  g.fillCircle(cx + 1, cy + 13.5, 3.2);
  g.fillStyle(0xffee66, 1);
  g.fillCircle(cx + 0.2, cy + 13, 1.8);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx - 0.3, cy + 12.5, 0.8);
  g.generateTexture('wicon_william_blade', s, s);
  g.destroy();
}

/**
 * Bake every weapon-HUD icon. Called once from BootScene
 * generateAllTextures. Order matches BootScene's original call list.
 */
export function bakeWeaponIcons(scene: Phaser.Scene): void {
  // Base weapons
  drawThistleShotIcon(scene);
  drawCaberTossIcon(scene);
  drawHaggisHurlerIcon(scene);
  drawBagpipeBlastIcon(scene);
  drawScotchMistIcon(scene);
  drawNessieTentacleIcon(scene);
  // Evolutions
  drawThistleStormIcon(scene);
  drawHighlandGamesIcon(scene);
  drawHaggisCannonIcon(scene);
  drawHighlandFlingIcon(scene);
  drawTheHaarIcon(scene);
  drawNessieUnleashedIcon(scene);
  // Standalone + utility
  drawClaymoreIcon(scene);
  drawBagpipesUtilityIcon(scene);
  drawWilliamBladeIcon(scene);
}
