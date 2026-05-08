import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';
/**
 * `ucard_stat_defense` — defense stat icon. Design pivot: old icon
 * was a rounded-rect slab with a central pillar + scalloped top
 * that read as "door" or "castle tower". New pitch — classic
 * HIGHLAND TARGE (round riveted shield) with a saltire etched on
 * the face + a vertical broadsword behind it, all the unambiguous
 * marks of Scottish defensive iconography.
 */
export function drawStatDefense(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x1f2e3a);
  const cx = 16, cy = 16;

  // ── Vertical broadsword behind — visible top + bottom only. ──
  g.fillStyle(0x2a3848, 1);
  g.fillRect(cx - 1, 3, 2, 26);
  g.fillStyle(0x5a6e82, 1);
  g.fillRect(cx - 0.5, 3, 1, 25);
  g.fillStyle(0x5a6e82, 1);
  g.fillTriangle(cx - 1, 3, cx + 1, 3, cx, 1);
  g.fillStyle(0xc8dae8, 0.85);
  g.fillRect(cx - 0.3, 3, 0.6, 8);
  // Crossguard
  g.fillStyle(0x4a3418, 1);
  g.fillRect(cx - 6, cy - 10, 12, 2);
  g.fillStyle(0x7a5428, 1);
  g.fillRect(cx - 5, cy - 10, 10, 1);
  // Pommel at bottom
  g.fillStyle(0x4a3418, 1);
  g.fillCircle(cx, 29, 2);
  g.fillStyle(0x7a5428, 1);
  g.fillCircle(cx, 29, 1.3);

  // ── Round targe shield — fills the middle. ──
  g.fillStyle(0x2a1a0a, 1);
  g.fillCircle(cx, cy, 11);
  g.fillStyle(0x5a3818, 1);
  g.fillCircle(cx, cy, 10);
  g.fillStyle(0x556677, 1);
  g.fillCircle(cx, cy, 9);
  g.fillStyle(0x7a8a9a, 1);
  g.fillCircle(cx - 1, cy - 1, 7.5);
  // Concentric ring grooves
  g.lineStyle(1, 0x3a4858, 0.9);
  g.strokeCircle(cx, cy, 7);
  g.lineStyle(0.8, 0x3a4858, 0.8);
  g.strokeCircle(cx, cy, 4.5);

  // ── Saltire etched on the shield face — pale white X. ──
  g.lineStyle(1.3, 0xe8f0f8, 0.6);
  g.lineBetween(cx - 6, cy - 6, cx + 6, cy + 6);
  g.lineBetween(cx - 6, cy + 6, cx + 6, cy - 6);

  // ── Centre boss — chunky steel dome with specular. ──
  g.fillStyle(0x2a3440, 1);
  g.fillCircle(cx, cy, 3);
  g.fillStyle(0x6a7a8a, 1);
  g.fillCircle(cx, cy, 2.3);
  g.fillStyle(0xaabacc, 1);
  g.fillCircle(cx, cy, 1.5);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(cx - 0.4, cy - 0.4, 0.6);

  // ── Brass rivets around the rim at 8 positions. ──
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rx = cx + Math.cos(a) * 9;
    const ry = cy + Math.sin(a) * 9;
    g.fillStyle(0x2a1a0a, 1);
    g.fillCircle(rx, ry, 0.9);
    g.fillStyle(0xaa8a3a, 1);
    g.fillCircle(rx, ry, 0.6);
    g.fillStyle(0xddbb55, 0.9);
    g.fillCircle(rx - 0.2, ry - 0.2, 0.3);
  }

  g.generateTexture('ucard_stat_defense', s, s);
  g.destroy();
}
