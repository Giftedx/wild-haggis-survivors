/**
 * `hud_dash_pip_full` / `hud_dash_pip_empty` — dash charge indicators
 * shown in the HUD. Full pip is a golden orb with specular highlight;
 * empty pip is a hollow ring with an inner shadow (spent-energy feel).
 * On screen 100% of play time — every pixel counts.
 */

import * as Phaser from 'phaser';

export function bakeDashPips(scene: Phaser.Scene): void {
  const ps = 10;

  // ── Dash pip (full) — golden orb with tartan thread cross +
  // warmer pulse rim. ──
  const gf = scene.add.graphics();
  const pcx = ps / 2, pcy = ps / 2;
  // Warmer outer pulse rim
  gf.fillStyle(0xff9a30, 0.45);
  gf.fillCircle(pcx, pcy, 4.6);
  gf.fillStyle(0xffbb55, 0.65);
  gf.fillCircle(pcx, pcy, 4.2);
  // Dark gold outline
  gf.fillStyle(0x8a6608, 1);
  gf.fillCircle(pcx, pcy, 4);
  // Golden body
  gf.fillStyle(0xd4a017, 1);
  gf.fillCircle(pcx, pcy, 3.5);
  // TARTAN THREAD CROSS — tiny red + green threads tracing a
  // saltire across the orb. Fine but readable at HUD scale.
  gf.fillStyle(0x8a1818, 0.85);
  gf.fillRect(pcx - 2.5, pcy, 5, 0.5);
  gf.fillRect(pcx, pcy - 2.5, 0.5, 5);
  gf.fillStyle(0x1a4a1a, 0.7);
  gf.fillRect(pcx - 2.0, pcy - 0.5, 4, 0.3);
  gf.fillRect(pcx - 0.3, pcy - 2.0, 0.3, 4);
  // Bright highlight (upper-left — spherical light)
  gf.fillStyle(0xffcc44, 0.85);
  gf.fillCircle(pcx - 0.8, pcy - 0.8, 1.8);
  // Hot specular
  gf.fillStyle(0xffffff, 0.7);
  gf.fillCircle(pcx - 1, pcy - 1.2, 0.7);
  gf.generateTexture('hud_dash_pip_full', ps, ps);
  gf.destroy();

  // ── Dash pip (empty) — hollow ring with FAINT INNER GLYPH (a
  // pale pip silhouette ghost) so the empty state has personality. ──
  const ge = scene.add.graphics();
  const ecx = ps / 2, ecy = ps / 2;
  ge.lineStyle(1.5, 0xd4a017, 0.7);
  ge.strokeCircle(ecx, ecy, 3.2);
  // Inner shadow (spent energy feel)
  ge.fillStyle(0x000000, 0.15);
  ge.fillCircle(ecx, ecy, 2.5);
  // GHOST PIP — faint dark gold dot evoking the filled pip that
  // used to be here. Sub-1px inset so it reads as a memory.
  ge.fillStyle(0x6a4a08, 0.45);
  ge.fillCircle(ecx, ecy, 1.5);
  ge.fillStyle(0x8a6608, 0.35);
  ge.fillCircle(ecx - 0.4, ecy - 0.4, 0.8);
  // Faint tartan thread cross matching the full pip — barely there.
  ge.fillStyle(0x8a1818, 0.3);
  ge.fillRect(ecx - 1.5, ecy, 3, 0.3);
  ge.fillRect(ecx, ecy - 1.5, 0.3, 3);
  ge.generateTexture('hud_dash_pip_empty', ps, ps);
  ge.destroy();
}
