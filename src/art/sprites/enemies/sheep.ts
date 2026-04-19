/**
 * `sheep` — Scottish Blackface with asymmetric ram's horns, thistle in the wool, creepy green-yellow goat eyes, manic grin.
 */

import Phaser from 'phaser';

export function bakeSheep(scene: Phaser.Scene): void {
  const s = 36;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // Wool body (matted, dirty hill sheep)
  g.fillStyle(0x999988, 1);
  g.fillEllipse(cx, cy, 28, 20);
  g.fillStyle(0xddddcc, 1);
  g.fillCircle(cx - 8, cy, 7);
  g.fillCircle(cx - 2, cy - 3, 8);
  g.fillCircle(cx + 4, cy - 2, 7);
  g.fillCircle(cx + 8, cy + 1, 6);
  g.fillCircle(cx - 6, cy + 3, 6);
  g.fillCircle(cx + 2, cy + 4, 6);
  g.fillStyle(0xbbbb99, 0.6);
  g.fillCircle(cx - 5, cy + 4, 3);
  g.fillCircle(cx + 6, cy + 3, 2.5);
  g.fillStyle(0xaaaa88, 0.4);
  g.fillCircle(cx - 8, cy + 2, 2);
  g.fillStyle(0xeeeedd, 1);
  g.fillCircle(cx - 4, cy - 4, 4);
  g.fillCircle(cx + 3, cy - 3, 4);

  // Thistle stuck in wool
  g.fillStyle(0x9966cc, 1);
  g.fillCircle(cx - 10, cy - 3, 1.5);
  g.fillStyle(0xbb88ee, 1);
  g.fillCircle(cx - 10, cy - 3, 0.8);
  g.fillStyle(0x336622, 1);
  g.fillRect(cx - 10, cy - 2, 1, 3);

  // Legs
  g.fillStyle(0x111111, 1);
  g.fillRect(cx - 8, cy + 8, 3, 5);
  g.fillRect(cx - 3, cy + 8, 3, 5);
  g.fillRect(cx + 2, cy + 8, 3, 5);
  g.fillRect(cx + 7, cy + 8, 3, 5);
  g.fillStyle(0x332211, 0.7);
  g.fillRect(cx - 8, cy + 12, 3, 1);
  g.fillRect(cx + 7, cy + 12, 3, 1);

  // Head (Scottish Blackface)
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx + 11, cy - 1, 6);
  g.fillStyle(0x1a1a1a, 1);
  g.fillCircle(cx + 11, cy - 1, 5);
  g.fillStyle(0xddddcc, 0.7);
  g.fillRect(cx + 10, cy - 2, 2, 4);

  // DRAMATIC CURLING RAM'S HORNS
  g.fillStyle(0x887755, 1);
  g.fillTriangle(cx + 6, cy - 4, cx + 2, cy - 9, cx + 4, cy - 2);
  g.fillStyle(0xaa9966, 1);
  g.fillTriangle(cx + 6, cy - 4, cx + 3, cy - 8, cx + 5, cy - 3);
  g.fillStyle(0x776644, 0.6);
  g.fillRect(cx + 4, cy - 6, 2, 1);
  // Right horn — visibly bent wrong, ~30° off the symmetric curl
  g.fillStyle(0x887755, 1);
  g.fillTriangle(cx + 16, cy - 3, cx + 22, cy - 5, cx + 19, cy - 1);
  g.fillStyle(0xaa9966, 1);
  g.fillTriangle(cx + 16, cy - 3, cx + 21, cy - 4, cx + 18, cy - 1);
  g.fillStyle(0x776644, 0.6);
  g.fillRect(cx + 19, cy - 3, 2, 1);

  // Ears (one up, one flopped)
  g.fillStyle(0x000000, 1);
  g.fillTriangle(cx + 8, cy - 7, cx + 10, cy - 4, cx + 6, cy - 4);
  g.fillTriangle(cx + 14, cy - 4, cx + 16, cy - 2, cx + 13, cy - 1);

  // Creepy green-yellow WRONG eyes — goat eyes should not glow like this
  g.fillStyle(0xccff00, 1);
  g.fillCircle(cx + 10, cy - 2, 2);
  g.fillCircle(cx + 13, cy - 2, 2);
  g.fillStyle(0x000000, 1);
  g.fillRect(cx + 9, cy - 2, 2, 1);
  g.fillRect(cx + 12, cy - 2, 2, 1);

  // Asymmetric manic grin (left corner raised 3px — deeply wrong)
  g.fillStyle(0x444444, 1);
  g.fillRect(cx + 11, cy - 1, 1, 2);   // left corner high up
  g.fillRect(cx + 12, cy, 1, 2);
  g.fillRect(cx + 13, cy + 1, 1, 2);
  g.fillRect(cx + 14, cy + 2, 1, 2);   // right corner stays low
  g.fillRect(cx + 15, cy + 2, 1, 2);
  g.fillStyle(0xeeeeee, 1);
  g.fillRect(cx + 11, cy - 1, 1, 1);
  g.fillRect(cx + 13, cy + 1, 1, 1);
  g.fillRect(cx + 15, cy + 2, 1, 1);

  g.generateTexture('sheep', s, s);
  g.destroy();
}

