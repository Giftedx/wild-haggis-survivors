/**
 * Weapon flourish sprites: small authored texture accents for projectile,
 * aura, sweep, and evolved-weapon moments. Gameplay systems can opt into
 * these as overlays without changing weapon balance.
 */
import * as Phaser from 'phaser';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

export const WEAPON_FLOURISH_KEYS = [
  'fx_weapon_thistle_bloom',
  'fx_weapon_thistle_storm_bloom',
  'fx_weapon_caber_splinter',
  'fx_weapon_highland_games_burst',
  'fx_weapon_bagpipe_note',
  'fx_weapon_bagpipe_blast_ring',
  'fx_weapon_bagpipes_drone_knot',
  'fx_weapon_highland_fling_ring',
  'fx_weapon_scotch_mist_wisp',
  'fx_weapon_the_haar_bank',
  'fx_weapon_haggis_oat_puff',
  'fx_weapon_haggis_cannon_pop',
  'fx_weapon_nessie_splash',
  'fx_weapon_nessie_unleashed_crest',
  'fx_weapon_claymore_spark',
  'fx_weapon_william_blade_wave',
] as const;

function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

function thistleBloom(g: Phaser.GameObjects.Graphics, cx: number, cy: number, scale = 1): void {
  g.fillStyle(0x274818, 1);
  g.fillRect(cx - 0.6 * scale, cy + 4 * scale, 1.2 * scale, 8 * scale);
  g.fillStyle(0x4f7430, 1);
  g.fillTriangle(cx, cy + 7 * scale, cx - 5 * scale, cy + 11 * scale, cx - 1 * scale, cy + 9 * scale);
  g.fillTriangle(cx, cy + 7 * scale, cx + 5 * scale, cy + 11 * scale, cx + 1 * scale, cy + 9 * scale);
  g.fillStyle(0x5f2f88, 1);
  g.fillCircle(cx, cy, 4.2 * scale);
  g.fillCircle(cx - 3 * scale, cy + 2 * scale, 3.2 * scale);
  g.fillCircle(cx + 3 * scale, cy + 2 * scale, 3.2 * scale);
  g.fillStyle(0xb090d0, 0.95);
  g.fillCircle(cx - 1.5 * scale, cy - 1.5 * scale, 1.5 * scale);
  g.fillCircle(cx + 2 * scale, cy + 0.6 * scale, 1.2 * scale);
}

function drawSparkCross(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.fillRect(x - 0.5, y - 2, 1, 4);
  g.fillRect(x - 2, y - 0.5, 4, 1);
}

function drawMusicNote(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number): void {
  g.fillStyle(0x0a0604, 1);
  g.fillEllipse(x, y, 8, 5);
  g.fillRect(x + 3, y - 15, 3, 15);
  g.fillTriangle(x + 5, y - 15, x + 14, y - 10, x + 5, y - 7);
  g.fillStyle(color, 1);
  g.fillEllipse(x, y, 5.5, 3.2);
  g.fillRect(x + 3.5, y - 14, 1.3, 14);
  g.fillTriangle(x + 4.8, y - 13, x + 11, y - 10, x + 4.8, y - 8);
}

export function bakeWeaponFlourishes(scene: Phaser.Scene): void {
  bake(scene, 'fx_weapon_thistle_bloom', 32, 32, (g) => {
    g.fillStyle(0x8060a0, 0.14);
    g.fillCircle(16, 16, 14);
    thistleBloom(g, 16, 13, 1);
    drawSparkCross(g, 8, 9, 0xe8d8ff, 0.9);
    drawSparkCross(g, 24, 20, 0xffe080, 0.85);
  });

  bake(scene, 'fx_weapon_thistle_storm_bloom', 48, 48, (g) => {
    g.fillStyle(0x553388, 0.15);
    g.fillCircle(24, 24, 23);
    g.lineStyle(2, 0xb090d0, 0.75);
    g.strokeCircle(24, 24, 18);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      thistleBloom(g, 24 + Math.cos(a) * 12, 24 + Math.sin(a) * 12, 0.55);
    }
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(24, 24, 2.4);
  });

  bake(scene, 'fx_weapon_caber_splinter', 36, 24, (g) => {
    g.fillStyle(0x3a2818, 0.2);
    g.fillEllipse(19, 14, 30, 9);
    g.fillStyle(0x4a2e18, 1);
    g.fillTriangle(5, 14, 24, 7, 28, 11);
    g.fillTriangle(7, 15, 26, 16, 31, 21);
    g.fillStyle(0xa87844, 1);
    g.fillTriangle(7, 13, 23, 9, 25, 11);
    g.fillTriangle(9, 15, 25, 16, 28, 19);
    g.fillStyle(0xffd080, 0.85);
    g.fillRect(13, 11, 9, 1);
    g.fillRect(15, 17, 7, 1);
    drawSparkCross(g, 29, 8, 0xffe0a0, 0.8);
  });

  bake(scene, 'fx_weapon_highland_games_burst', 56, 56, (g) => {
    g.fillStyle(0xff7040, 0.16);
    g.fillCircle(28, 28, 27);
    g.lineStyle(3, 0xffc840, 0.75);
    g.strokeCircle(28, 28, 20);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fillStyle(i % 2 === 0 ? 0xc42828 : 0x3a6638, 1);
      g.fillRect(28 + Math.cos(a) * 16 - 1, 28 + Math.sin(a) * 16 - 1, 2, 2);
    }
    g.fillStyle(0xfff4d8, 1);
    g.fillCircle(28, 28, 5);
    drawSparkCross(g, 28, 28, 0xffffff, 1);
  });

  bake(scene, 'fx_weapon_bagpipe_note', 28, 32, (g) => {
    g.fillStyle(0xffc840, 0.18);
    g.fillCircle(14, 18, 13);
    drawMusicNote(g, 11, 22, 0xffe080);
    drawSparkCross(g, 21, 8, 0xffffff, 0.85);
  });

  bake(scene, 'fx_weapon_bagpipe_blast_ring', 48, 48, (g) => {
    g.fillStyle(0xffc840, 0.1);
    g.fillCircle(24, 24, 23);
    g.lineStyle(3, 0xffc840, 0.75);
    g.strokeCircle(24, 24, 17);
    g.lineStyle(1.5, 0xfff0b0, 0.65);
    g.strokeCircle(24, 24, 10);
    drawMusicNote(g, 21, 27, 0xffffff);
  });

  bake(scene, 'fx_weapon_bagpipes_drone_knot', 40, 40, (g) => {
    g.fillStyle(0x8060a0, 0.12);
    g.fillCircle(20, 20, 19);
    g.lineStyle(2, 0xc8a040, 0.9);
    g.strokeCircle(15, 20, 8);
    g.strokeCircle(25, 20, 8);
    g.lineStyle(1.5, 0xffe080, 0.8);
    g.strokeCircle(20, 15, 6);
    g.strokeCircle(20, 25, 6);
    g.fillStyle(0xfff0b0, 1);
    g.fillCircle(20, 20, 2);
  });

  bake(scene, 'fx_weapon_highland_fling_ring', 52, 52, (g) => {
    g.fillStyle(0x4a7090, 0.12);
    g.fillCircle(26, 26, 25);
    g.lineStyle(3, 0x6a90b0, 0.85);
    g.strokeCircle(26, 26, 19);
    g.lineStyle(1.4, 0xe8f6ff, 0.8);
    g.beginPath();
    g.arc(26, 26, 13, -0.4, Math.PI + 0.4, false);
    g.strokePath();
    g.fillStyle(0xffc840, 0.9);
    g.fillRect(26, 7, 2, 5);
    g.fillRect(25, 40, 2, 5);
  });

  bake(scene, 'fx_weapon_scotch_mist_wisp', 36, 28, (g) => {
    g.fillStyle(0xd8e8ee, 0.16);
    g.fillEllipse(18, 15, 31, 16);
    g.fillStyle(0xb8d0d8, 0.24);
    g.fillEllipse(15, 14, 20, 10);
    g.fillStyle(0xffffff, 0.4);
    g.fillEllipse(12, 12, 9, 4);
    g.fillStyle(0xc8a040, 0.55);
    g.fillCircle(25, 18, 1.4);
    g.fillCircle(8, 17, 1.0);
  });

  bake(scene, 'fx_weapon_the_haar_bank', 64, 32, (g) => {
    g.fillStyle(0x6a90b0, 0.12);
    g.fillEllipse(32, 18, 58, 20);
    g.fillStyle(0xd8e8ee, 0.18);
    g.fillEllipse(22, 16, 32, 13);
    g.fillEllipse(42, 18, 34, 14);
    g.fillStyle(0xffffff, 0.36);
    g.fillEllipse(27, 13, 17, 6);
    g.fillEllipse(48, 16, 13, 5);
    g.lineStyle(1, 0xb8d8e8, 0.5);
    g.strokeEllipse(32, 18, 50, 15);
  });

  bake(scene, 'fx_weapon_haggis_oat_puff', 34, 34, (g) => {
    g.fillStyle(0xf2dfb8, 0.18);
    g.fillCircle(17, 17, 15);
    g.fillStyle(0xe8c88c, 0.42);
    g.fillCircle(15, 16, 8);
    g.fillStyle(0xb88a48, 1);
    for (const [x, y] of [[11, 12], [19, 11], [23, 18], [15, 23], [10, 20]]) {
      g.fillCircle(x, y, 1.3);
      g.fillStyle(0xffe0a0, 0.8);
      g.fillCircle(x - 0.3, y - 0.3, 0.45);
      g.fillStyle(0xb88a48, 1);
    }
  });

  bake(scene, 'fx_weapon_haggis_cannon_pop', 46, 46, (g) => {
    g.fillStyle(0xff9030, 0.14);
    g.fillCircle(23, 23, 22);
    g.fillStyle(0x5a3e20, 1);
    g.fillEllipse(23, 23, 19, 14);
    g.fillStyle(0x9a6840, 1);
    g.fillEllipse(21, 21, 13, 8);
    g.fillStyle(0xffc840, 0.9);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      g.fillCircle(23 + Math.cos(a) * 16, 23 + Math.sin(a) * 16, i % 2 === 0 ? 1.6 : 1.1);
    }
  });

  bake(scene, 'fx_weapon_nessie_splash', 44, 32, (g) => {
    g.fillStyle(0x2a4a6a, 0.22);
    g.fillEllipse(22, 22, 34, 11);
    g.lineStyle(2, 0x88c8d8, 0.8);
    g.strokeEllipse(22, 22, 30, 8);
    g.fillStyle(0xb8f0ff, 0.85);
    g.fillTriangle(16, 19, 20, 8, 23, 19);
    g.fillTriangle(24, 20, 31, 10, 29, 21);
    g.fillCircle(18, 12, 1.5);
    g.fillCircle(30, 12, 1.2);
  });

  bake(scene, 'fx_weapon_nessie_unleashed_crest', 58, 40, (g) => {
    g.fillStyle(0x2a4a6a, 0.18);
    g.fillEllipse(29, 27, 50, 15);
    g.fillStyle(0x1f5a4a, 1);
    g.fillTriangle(10, 26, 20, 10, 30, 26);
    g.fillTriangle(25, 26, 38, 7, 48, 26);
    g.fillStyle(0x56a078, 1);
    g.fillTriangle(13, 25, 21, 12, 28, 25);
    g.fillTriangle(28, 25, 38, 10, 45, 25);
    g.fillStyle(0xb8f0ff, 0.9);
    g.fillRect(15, 25, 32, 2);
    drawSparkCross(g, 47, 13, 0xe8f8ff, 0.85);
  });

  bake(scene, 'fx_weapon_claymore_spark', 44, 32, (g) => {
    g.fillStyle(0x8a8a90, 0.12);
    g.fillEllipse(22, 18, 38, 12);
    g.fillStyle(0x2a2a30, 1);
    g.fillRect(6, 16, 28, 3);
    g.fillStyle(0xd8dde8, 1);
    g.fillRect(8, 16, 24, 1.4);
    g.fillStyle(0xc8a040, 1);
    g.fillRect(31, 13, 3, 9);
    g.fillStyle(0xffe080, 1);
    g.fillCircle(35, 17, 2);
    drawSparkCross(g, 37, 10, 0xffffff, 0.95);
  });

  bake(scene, 'fx_weapon_william_blade_wave', 64, 28, (g) => {
    g.fillStyle(0x6a90b0, 0.12);
    g.fillEllipse(32, 17, 58, 15);
    g.lineStyle(3, 0xc8e8ff, 0.75);
    g.beginPath();
    g.arc(32, 26, 26, Math.PI + 0.18, Math.PI * 2 - 0.18, false);
    g.strokePath();
    g.lineStyle(1.4, 0xffe080, 0.8);
    g.beginPath();
    g.arc(32, 25, 18, Math.PI + 0.25, Math.PI * 2 - 0.25, false);
    g.strokePath();
    drawSparkCross(g, 18, 13, 0xffffff, 0.8);
    drawSparkCross(g, 47, 11, 0xffe080, 0.8);
  });
}
