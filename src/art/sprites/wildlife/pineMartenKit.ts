/**
 * Pine marten KIT — cousin to the adult `pineMarten.ts`. Smaller,
 * rounder, ears bigger relative to the head. Idle + move pair so
 * `WildlifeSystem` can reuse its existing two-frame rhythm. Pairs
 * the existing adult pine marten — when both spawn near each other
 * it reads as a family unit (Soul-charter "warmth in the wild").
 */
import * as Phaser from 'phaser';

const CANVAS = 32;
const GROUND_Y = CANVAS - 7;

const KIT_OUTLINE = 0x2a1408;
const KIT_DARK = 0x5a3018;
const KIT_BASE = 0xa8643a;
const KIT_HI = 0xc8865a;
const BIB = 0xfaecc4;
const BIB_HI = 0xffffff;
const EAR_INNER = 0xeac0a0;
const EYE = 0x080604;
const NOSE = 0x4a1810;
const PAW_PAD = 0x4a2010;
const WHISKER = 0xfff0d0;

function ground(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(CANVAS / 2, GROUND_Y, 14, 3.4);
  g.fillStyle(0x000000, 0.32);
  g.fillEllipse(CANVAS / 2, GROUND_Y, 9.4, 1.8);
}

function drawKit(g: Phaser.GameObjects.Graphics, move: boolean): void {
  ground(g);
  const bob = move ? -1 : 0;
  const legShift = move ? 1 : 0;

  // Body — chunky, shorter than the adult marten.
  g.fillStyle(KIT_OUTLINE, 1);
  g.fillEllipse(16, 19 + bob, 14, 8);
  g.fillStyle(KIT_DARK, 1);
  g.fillEllipse(16, 18 + bob, 12, 6.5);
  g.fillStyle(KIT_BASE, 1);
  g.fillEllipse(16, 17.4 + bob, 10, 5.4);
  g.fillStyle(KIT_HI, 0.95);
  g.fillEllipse(15, 17 + bob, 7, 3);

  // Cream bib — proportionally larger than the adult.
  g.fillStyle(KIT_OUTLINE, 1);
  g.fillEllipse(13, 20 + bob, 6, 4);
  g.fillStyle(BIB, 1);
  g.fillEllipse(13, 19.6 + bob, 5, 3.2);
  g.fillStyle(BIB_HI, 0.85);
  g.fillEllipse(12.4, 19.2 + bob, 3.4, 1.4);

  // Tail — fluffy, half-curl over the back.
  g.fillStyle(KIT_OUTLINE, 1);
  g.fillEllipse(24, 17 + bob, 7, 3.4);
  g.fillStyle(KIT_DARK, 1);
  g.fillEllipse(24, 17 + bob, 6, 2.8);
  g.fillStyle(KIT_BASE, 1);
  g.fillEllipse(24, 16.6 + bob, 5, 1.8);
  g.fillStyle(KIT_HI, 0.85);
  g.fillRect(22, 16.4 + bob, 4, 0.5);
  // Tail tip — slightly darker tuft.
  g.fillStyle(KIT_OUTLINE, 1);
  g.fillCircle(28, 17.6 + bob, 1.4);
  g.fillStyle(KIT_DARK, 1);
  g.fillCircle(28, 17.6 + bob, 1);

  // Head — slightly oversized for "young animal" cuteness signal.
  g.fillStyle(KIT_OUTLINE, 1);
  g.fillCircle(8.6, 16 + bob, 4.2);
  g.fillStyle(KIT_DARK, 1);
  g.fillCircle(8.6, 16 + bob, 3.6);
  g.fillStyle(KIT_BASE, 1);
  g.fillCircle(8.6, 16 + bob, 3);
  g.fillStyle(KIT_HI, 0.95);
  g.fillEllipse(8, 15 + bob, 3.6, 1.4);

  // Pointed muzzle.
  g.fillStyle(KIT_OUTLINE, 1);
  g.fillTriangle(5, 16 + bob, 8, 14.6 + bob, 8, 17.4 + bob);
  g.fillStyle(KIT_DARK, 1);
  g.fillTriangle(5.6, 16 + bob, 8, 15.2 + bob, 8, 16.8 + bob);
  // Nose.
  g.fillStyle(NOSE, 1);
  g.fillCircle(5.4, 16 + bob, 0.6);

  // Big ears — rounded triangles with pink interior.
  g.fillStyle(KIT_OUTLINE, 1);
  g.fillTriangle(7, 12 + bob, 8.4, 9 + bob, 9.6, 12.6 + bob);
  g.fillTriangle(10, 12 + bob, 11.6, 9.4 + bob, 12.6, 12.6 + bob);
  g.fillStyle(KIT_DARK, 1);
  g.fillTriangle(7.4, 12 + bob, 8.4, 9.6 + bob, 9.4, 12.4 + bob);
  g.fillTriangle(10.2, 12 + bob, 11.4, 10 + bob, 12.4, 12.4 + bob);
  g.fillStyle(EAR_INNER, 0.95);
  g.fillTriangle(8, 11.8 + bob, 8.6, 10.4 + bob, 9, 12 + bob);
  g.fillTriangle(10.6, 11.8 + bob, 11.4, 10.6 + bob, 11.8, 12 + bob);

  // Eye — large, dark, alert.
  g.fillStyle(EYE, 1);
  g.fillCircle(9.4, 15.2 + bob, 1);
  g.fillStyle(BIB_HI, 1);
  g.fillRect(9.0, 14.8 + bob, 0.5, 0.5);

  // Whiskers — three per side.
  g.lineStyle(0.6, WHISKER, 0.85);
  g.lineBetween(5.8, 16 + bob, 2.4, 15.4 + bob);
  g.lineBetween(5.8, 16.4 + bob, 2.2, 16.4 + bob);
  g.lineBetween(5.8, 16.8 + bob, 2.4, 17.4 + bob);

  // Legs — four short legs with paw pads.
  for (const dx of [-3, -1, 1, 3] as const) {
    const baseX = 16 + dx;
    const phase = (dx === -3 || dx === 1) ? legShift : -legShift;
    g.fillStyle(KIT_OUTLINE, 1);
    g.fillRect(baseX - 0.8, 21 + bob + phase, 1.6, 3.2);
    g.fillStyle(KIT_DARK, 1);
    g.fillRect(baseX - 0.6, 21.2 + bob + phase, 1.2, 3);
    g.fillStyle(PAW_PAD, 1);
    g.fillRect(baseX - 0.7, 24 + bob + phase, 1.4, 0.6);
  }
}

export function bakePineMartenKit(scene: Phaser.Scene): void {
  for (const [suffix, move] of [['idle', false], ['move', true]] as const) {
    const g = scene.add.graphics();
    drawKit(g, move);
    g.generateTexture(`wildlife_pine_marten_kit_${suffix}`, CANVAS, CANVAS);
    g.destroy();
  }
}
