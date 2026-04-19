/**
 * `boss_laird` — landowner-as-enemy: tweed jacket, riding crop, gold-trim crown, rifle. Distinct from the `laird` player variant.
 */

import Phaser from 'phaser';

export function bakeBossLaird(scene: Phaser.Scene): void {
  const s = 80;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 4;

  // === Royal cloak (deep purple, regal, EXPENSIVE) ===
  g.fillStyle(0x0a0022, 1);
  g.fillCircle(cx, cy + 2, 30);
  g.fillStyle(0x1a0044, 1);
  g.fillCircle(cx, cy + 2, 28);
  g.fillStyle(0x2a0066, 1);
  g.fillCircle(cx, cy, 24);
  // Velvet sheen
  g.fillStyle(0x3a0088, 0.4);
  g.fillEllipse(cx - 4, cy - 4, 30, 20);
  // Gold braid trim on cloak
  g.lineStyle(1.5, 0xddaa00, 0.8);
  g.strokeCircle(cx, cy + 1, 25);

  // === Ermine fur trim (white with black spots — proper royal) ===
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 28, cy + 14, 56, 5);
  g.fillStyle(0xeeeedd, 1);
  g.fillRect(cx - 27, cy + 15, 54, 3);
  // Black ermine tail spots (more of them, evenly spaced)
  g.fillStyle(0x111111, 1);
  g.fillCircle(cx - 22, cy + 16, 1.5);
  g.fillCircle(cx - 14, cy + 16, 1.5);
  g.fillCircle(cx - 6, cy + 16, 1.5);
  g.fillCircle(cx + 2, cy + 16, 1.5);
  g.fillCircle(cx + 10, cy + 16, 1.5);
  g.fillCircle(cx + 18, cy + 16, 1.5);
  // Tail dangles
  g.fillStyle(0x111111, 1);
  g.fillRect(cx - 22, cy + 17, 1, 2);
  g.fillRect(cx - 6, cy + 17, 1, 2);
  g.fillRect(cx + 10, cy + 17, 1, 2);

  // === Face (sneering, chin UP, looking down at you) ===
  g.fillStyle(0xaa6644, 1);
  g.fillCircle(cx, cy - 6, 12);
  g.fillStyle(0xffccaa, 1);
  g.fillCircle(cx, cy - 6, 11);
  // Powdered complexion (slightly paler than normal)
  g.fillStyle(0xffddc8, 0.5);
  g.fillCircle(cx, cy - 7, 9);

  // Prominent chin (jutting forward, looking down at the peasants)
  g.fillStyle(0xffccaa, 1);
  g.fillEllipse(cx, cy + 1, 6, 4);

  // Monocle on right eye
  g.lineStyle(1.5, 0xddaa00, 1);
  g.strokeCircle(cx + 5, cy - 8, 4);
  g.fillStyle(0xaaddff, 0.2);
  g.fillCircle(cx + 5, cy - 8, 3);
  // Monocle chain
  g.lineStyle(0.8, 0xbb8800, 0.7);
  g.lineBetween(cx + 9, cy - 6, cx + 12, cy);

  // Sneering eyes (half-lidded, contemptuous)
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 5, cy - 8, 3);
  g.fillCircle(cx + 5, cy - 8, 3);
  g.fillStyle(0x224488, 1);
  g.fillCircle(cx - 5, cy - 8, 1.5);
  g.fillCircle(cx + 5, cy - 8, 1.5);
  // Heavy, contemptuous eyelids
  g.fillStyle(0xddbb99, 1);
  g.fillRect(cx - 8, cy - 10, 6, 2);
  g.fillRect(cx + 2, cy - 10, 6, 2);

  // Walrus mustache (thick, drooping over the lip — stuffy old aristocrat)
  g.fillStyle(0xaaaaaa, 1);
  g.fillRect(cx - 8, cy - 3, 16, 3);
  g.fillStyle(0xcccccc, 1);
  g.fillRect(cx - 7, cy - 3, 14, 2);
  // Drooping ends (hangs past the mouth — walrus style)
  g.fillStyle(0xbbbbbb, 1);
  g.fillRect(cx - 8, cy - 1, 3, 3);
  g.fillRect(cx + 6, cy - 1, 3, 3);
  // Mustache highlight
  g.fillStyle(0xdddddd, 0.6);
  g.fillRect(cx - 5, cy - 3, 10, 1);

  // Thin sneer (curled lip — pure contempt for the working class)
  g.fillStyle(0xcc8877, 1);
  g.fillRect(cx - 3, cy, 6, 1);
  // One corner turned up (the sneer)
  g.fillStyle(0xcc8877, 1);
  g.fillCircle(cx + 3, cy - 1, 0.8);

  // === Signet ring (golden dot on right side — old money) ===
  g.fillStyle(0xddaa00, 1);
  g.fillCircle(cx + 20, cy + 6, 2);
  g.fillStyle(0xffcc44, 1);
  g.fillCircle(cx + 20, cy + 6, 1.2);

  // === BIG golden crown (more ornate, more jewels) ===
  g.fillStyle(0x553300, 1);
  g.fillRect(cx - 16, cy - 22, 32, 8);
  g.fillStyle(0xddaa00, 1);
  g.fillRect(cx - 15, cy - 21, 30, 6);
  // Gold highlight band
  g.fillStyle(0xffcc33, 0.6);
  g.fillRect(cx - 15, cy - 20, 30, 2);
  // Crown points (taller, more ornate)
  g.fillStyle(0x553300, 1);
  g.fillTriangle(cx - 16, cy - 22, cx - 11, cy - 34, cx - 6, cy - 22);
  g.fillTriangle(cx - 4, cy - 22, cx, cy - 36, cx + 4, cy - 22);
  g.fillTriangle(cx + 6, cy - 22, cx + 11, cy - 34, cx + 16, cy - 22);
  g.fillStyle(0xddaa00, 1);
  g.fillTriangle(cx - 15, cy - 22, cx - 11, cy - 32, cx - 7, cy - 22);
  g.fillTriangle(cx - 3, cy - 22, cx, cy - 34, cx + 3, cy - 22);
  g.fillTriangle(cx + 7, cy - 22, cx + 11, cy - 32, cx + 14, cy - 22);
  // Jewels (rubies AND sapphires)
  g.fillStyle(0xff1133, 1);
  g.fillCircle(cx - 11, cy - 30, 2.2);
  g.fillCircle(cx + 11, cy - 30, 2.2);
  g.fillStyle(0x2244ff, 1);
  g.fillCircle(cx, cy - 33, 2.5);
  // Jewel highlights
  g.fillStyle(0xff6677, 1);
  g.fillCircle(cx - 11, cy - 31, 0.8);
  g.fillCircle(cx + 11, cy - 31, 0.8);
  g.fillStyle(0x6688ff, 1);
  g.fillCircle(cx, cy - 34, 1);
  // Tiny gold fleur-de-lis on crown band
  g.fillStyle(0xffcc33, 1);
  g.fillCircle(cx - 8, cy - 19, 1);
  g.fillCircle(cx + 8, cy - 19, 1);

  g.generateTexture('boss_laird', s, s);
  g.destroy();
}

