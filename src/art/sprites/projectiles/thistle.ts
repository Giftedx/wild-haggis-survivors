/**
 * `thistle` projectile — spiky purple thistle head with green calyx.
 * Needs to read clearly while spinning at speed across the moor.
 */

import * as Phaser from 'phaser';

export function bakeThistleProjectile(scene: Phaser.Scene): void {
  // 20×20 — purple thistle projectile. Spiky flower head with green calyx,
  // needs to read clearly while spinning across the moor at speed.
  const s = 20;
  const g = scene.add.graphics();
  const cx = 10, cy = 9;

  // Green calyx / stem stub at bottom (spiky leaf base of the flower)
  g.fillStyle(0x224411, 1);
  g.fillRect(cx - 1, cy + 5, 2, 4);
  g.fillStyle(0x336622, 1);
  g.fillRect(cx - 1, cy + 5, 1, 3);
  // Calyx leaves flaring out
  g.fillStyle(0x2a5518, 1);
  g.fillTriangle(cx, cy + 3, cx - 4, cy + 6, cx, cy + 6);
  g.fillTriangle(cx, cy + 3, cx + 4, cy + 6, cx, cy + 6);
  g.fillStyle(0x3a7722, 1);
  g.fillTriangle(cx, cy + 4, cx - 3, cy + 6, cx, cy + 5);
  g.fillTriangle(cx, cy + 4, cx + 3, cy + 6, cx, cy + 5);

  // Dark outline of flower head
  g.fillStyle(0x331155, 1);
  g.fillCircle(cx, cy, 7);

  // Flower body — dark purple base
  g.fillStyle(0x663399, 1);
  g.fillCircle(cx, cy, 6);

  // 10 sharp spikes radiating outward (the thistle's weapon)
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const tipX = cx + Math.cos(a) * 9;
    const tipY = cy + Math.sin(a) * 9;
    const baseL = cx + Math.cos(a - 0.25) * 5;
    const baseR = cx + Math.cos(a + 0.25) * 5;
    const baseLY = cy + Math.sin(a - 0.25) * 5;
    const baseRY = cy + Math.sin(a + 0.25) * 5;
    // Dark spike outline
    g.fillStyle(0x552288, 1);
    g.fillTriangle(tipX, tipY, baseL, baseLY, baseR, baseRY);
    // Brighter inner spike
    g.fillStyle(0xaa77dd, 0.8);
    const innerTip = 0.85;
    g.fillTriangle(
      cx + Math.cos(a) * 9 * innerTip, cy + Math.sin(a) * 9 * innerTip,
      cx + Math.cos(a - 0.15) * 5, cy + Math.sin(a - 0.15) * 5,
      cx + Math.cos(a + 0.15) * 5, cy + Math.sin(a + 0.15) * 5
    );
  }

  // Inner flower highlight (lighter purple bloom)
  g.fillStyle(0x8855bb, 1);
  g.fillCircle(cx, cy, 4);
  g.fillStyle(0xaa77dd, 0.7);
  g.fillCircle(cx - 1, cy - 1, 2.5);

  // Bright centre — the hot core
  g.fillStyle(0xddaaff, 1);
  g.fillCircle(cx, cy, 1.5);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx - 1, cy - 1, 0.8);

  g.generateTexture('thistle', s, s);
  g.destroy();
}
