import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';
export function drawStatHealth(scene: Phaser.Scene): void {
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
