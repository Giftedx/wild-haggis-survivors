import type Phaser from 'phaser';

export function drawBossWickerHaggis(gfx: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  // fire glow base
  gfx.fillStyle(0xf05a00, 0.22);
  gfx.fillEllipse(cx, cy + 8, 44, 22);
  gfx.fillStyle(0xffb830, 0.14);
  gfx.fillEllipse(cx, cy + 7, 34, 14);
  // haggis body inside cage
  gfx.fillStyle(0x7a6147, 0.60);
  gfx.fillEllipse(cx, cy + 2, 22, 18);
  gfx.fillStyle(0xffb830, 0.85);
  gfx.fillCircle(cx - 4, cy - 1, 2);
  gfx.fillCircle(cx + 4, cy - 1, 2);
  // cage outer ring
  gfx.lineStyle(2, 0x8b5c1e, 1.0);
  gfx.strokeEllipse(cx, cy, 38, 44);
  // vertical strands
  gfx.lineStyle(2, 0xb8842e, 0.90);
  for (let i = -12; i <= 12; i += 8) {
    gfx.lineBetween(cx + i, cy - 22 + Math.abs(i) * 0.3, cx + i, cy + 22 - Math.abs(i) * 0.3);
  }
  // horizontal crossing bands
  gfx.lineStyle(1.5, 0x8b5c1e, 0.80);
  gfx.lineBetween(cx - 18, cy - 8, cx + 18, cy - 8);
  gfx.lineBetween(cx - 19, cy + 2, cx + 19, cy + 2);
  gfx.lineBetween(cx - 17, cy + 12, cx + 17, cy + 12);
  // base embers
  gfx.fillStyle(0xf05a00, 0.90);
  gfx.fillCircle(cx - 16, cy + 20, 3);
  gfx.fillCircle(cx + 16, cy + 20, 3);
  gfx.fillStyle(0xffb830, 0.80);
  gfx.fillCircle(cx, cy + 22, 2.5);
  // top finial
  gfx.fillStyle(0x8b5c1e, 1.0);
  gfx.fillTriangle(cx - 4, cy - 22, cx + 4, cy - 22, cx, cy - 28);
}

export function bakeBossWickerHaggis(scene: Phaser.Scene): void {
  if (scene.textures.exists('boss_wicker_haggis')) return;
  const size = 56;
  const gfx = scene.add.graphics();
  drawBossWickerHaggis(gfx, size / 2, size / 2);
  gfx.generateTexture('boss_wicker_haggis', size, size);
  gfx.destroy();
}
