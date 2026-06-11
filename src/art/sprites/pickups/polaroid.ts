/**
 * `pickup_polaroid` — a tourist Polaroid dropped on a tourist enemy
 * kill. Wild-haggis-myth tribute (DESIGN_IDEAS.md §11): the haggis
 * "accepts being photographed" for a small bonus, turning the most
 * comic enemy in the roster into a soulful collectible moment.
 *
 * Visually a 20×22 Polaroid card: cream-white border with a thicker
 * bottom strip (the iconic Polaroid signature footer), a slate-grey
 * exposed image rectangle inside the border with a tiny haggis
 * silhouette (motif-anchored), a glint of camera-flash white in the
 * top-right corner, and a subtle drop shadow underneath.
 *
 * Tonal palette: Hearth (cream + warm-tan + slate) per
 * ART_STYLE_BIBLE.md — the photograph is a memory, not a hazard.
 *
 * Registered in `bakePickups()` so the texture is cached before any
 * `scene.add.image('pickup_polaroid', …)` call from PickupSpawner.
 */
import * as Phaser from 'phaser';

export function bakePolaroid(scene: Phaser.Scene): void {
  const w = 20;
  const h = 22;
  const g = scene.add.graphics();

  // Drop shadow underneath — sells the "lying on the moor" pose.
  g.fillStyle(0x000000, 0.25);
  g.fillEllipse(w / 2, h - 1, w - 4, 2);

  // Cream-white card body. Slight off-white so it doesn't glare on
  // the bright moor backgrounds.
  g.fillStyle(0xf5efde, 1);
  g.fillRoundedRect(0, 0, w, h - 1, 1);

  // Faint warm-tan card stroke for definition against the heather.
  g.lineStyle(1, 0xc8b89a, 0.85);
  g.strokeRoundedRect(0.5, 0.5, w - 1, h - 2, 1);

  // Exposed image rectangle — slate-grey overlay with a hint of moor
  // fog in the top half (lighter) and dark-heather shadow at the
  // bottom (heavier). Border is 2 px on top/sides, 5 px at the bottom
  // (Polaroid's load-bearing footer).
  const imgX = 2;
  const imgY = 2;
  const imgW = w - 4;
  const imgH = h - 8;
  // Light upper third — washed sky.
  g.fillStyle(0xa8b4c0, 1);
  g.fillRect(imgX, imgY, imgW, Math.floor(imgH * 0.4));
  // Mid-band — heather slate.
  g.fillStyle(0x6a7080, 1);
  g.fillRect(imgX, imgY + Math.floor(imgH * 0.4), imgW, Math.floor(imgH * 0.35));
  // Dark base — moor shadow.
  g.fillStyle(0x3a3848, 1);
  g.fillRect(imgX, imgY + Math.floor(imgH * 0.75), imgW, imgH - Math.floor(imgH * 0.75));

  // Tiny haggis silhouette in the centre of the image — pure-black
  // squat oval with two pip legs. Reads as "wee creature" at gameplay
  // scale; specific enough to feel like the photo subject is the
  // player, generic enough to not require a per-variant repaint.
  const sx = w / 2;
  const sy = imgY + Math.floor(imgH * 0.6);
  g.fillStyle(0x14101a, 1);
  g.fillEllipse(sx, sy, 6, 4);
  g.fillRect(sx - 2, sy + 1, 1, 2);
  g.fillRect(sx + 1, sy + 1, 1, 2);

  // Camera-flash glint — single white pinprick in the photo's top-
  // right corner. The flash that startled the haggis a moment ago.
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(imgX + imgW - 3, imgY + 1, 1, 1);
  g.fillStyle(0xffffff, 0.55);
  g.fillRect(imgX + imgW - 4, imgY + 2, 1, 1);

  g.generateTexture('pickup_polaroid', w, h);
  g.destroy();
}
