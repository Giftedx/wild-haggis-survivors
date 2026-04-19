/**
 * `hud_dash_pip_full` / `hud_dash_pip_empty` — dash charge indicators
 * shown in the HUD. Full pip is a golden orb with specular highlight;
 * empty pip is a hollow ring with an inner shadow (spent-energy feel).
 * On screen 100% of play time — every pixel counts.
 */

import Phaser from 'phaser';

export function bakeDashPips(scene: Phaser.Scene): void {
  const ps = 10;

  // ── Dash pip (full) — golden orb with depth, not a flat circle ──
  const gf = scene.add.graphics();
  const pcx = ps / 2, pcy = ps / 2;
  // Dark gold outline
  gf.fillStyle(0x8a6608, 1);
  gf.fillCircle(pcx, pcy, 4);
  // Golden body
  gf.fillStyle(0xd4a017, 1);
  gf.fillCircle(pcx, pcy, 3.5);
  // Bright highlight (upper-left — spherical light)
  gf.fillStyle(0xffcc44, 0.8);
  gf.fillCircle(pcx - 0.8, pcy - 0.8, 1.8);
  // Hot specular
  gf.fillStyle(0xffffff, 0.5);
  gf.fillCircle(pcx - 1, pcy - 1.2, 0.7);
  gf.generateTexture('hud_dash_pip_full', ps, ps);
  gf.destroy();

  // ── Dash pip (empty) — hollow ring with subtle inner shadow ──
  const ge = scene.add.graphics();
  ge.lineStyle(1.5, 0xd4a017, 0.7);
  ge.strokeCircle(ps / 2, ps / 2, 3.2);
  // Inner shadow (spent energy feel)
  ge.fillStyle(0x000000, 0.15);
  ge.fillCircle(ps / 2, ps / 2, 2.5);
  ge.generateTexture('hud_dash_pip_empty', ps, ps);
  ge.destroy();
}
