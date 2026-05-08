import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';
/**
 * `ucard_sporran` — Highland sporran pickup icon. Design pivot: old
 * icon read as "generic fur pouch" with no Scottish specificity at
 * 32px. New pitch — proper sporran hanging FROM A KILT BELT (brown
 * strap with brass buckle at top), ORNATE BRASS CANTLE plate with
 * a thistle emblem across the top of the pouch, FUR POUCH BODY with
 * visible tufts, and THREE LONG HORSE-HAIR TASSELS with brass caps
 * hanging 60%+ of pouch height. Every anchor says "worn-as-kilt-
 * accessory" rather than "leather bag".
 */
export function drawSporran(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x3d2a20);
  const cx = 16, cy = 16;

  // ── KILT BELT — brown strap across the top, establishes that
  // this is worn at the waist. ──
  g.fillStyle(0x1a0e06, 1);
  g.fillRect(cx - 14, cy - 10, 28, 3);
  g.fillStyle(0x3a2212, 1);
  g.fillRect(cx - 14, cy - 10, 28, 1.5);
  // Brass belt buckle at centre
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 2, cy - 10, 4, 3);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 2, cy - 10, 4, 1);

  // ── BRASS CANTLE — ornate metal plate across the top of the
  // pouch. Unmistakable "sporran" architectural detail. ──
  g.fillStyle(0x5a3810, 1);
  g.fillRect(cx - 10, cy - 7, 20, 4);
  g.fillStyle(0xc8a848, 1);
  g.fillRect(cx - 9, cy - 7, 18, 3);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 9, cy - 7, 18, 0.8);
  // THISTLE emblem centred on the cantle — Scottish anchor
  g.fillStyle(0x4a1a6a, 1);
  g.fillCircle(cx, cy - 5.5, 1.3);
  g.fillStyle(0x2a5a14, 1);
  g.fillRect(cx - 0.5, cy - 4.5, 1, 1);
  g.fillStyle(0x6a2a9a, 1);
  g.fillCircle(cx - 0.2, cy - 5.8, 0.6);

  // ── FUR POUCH BODY — dark brown with visible tufts. Taller
  // and more rectangular than a generic oval. ──
  g.fillStyle(0x1a0e06, 1);
  g.fillRoundedRect(cx - 9, cy - 3, 18, 13, 3);
  g.fillStyle(0x3a2212, 1);
  g.fillRoundedRect(cx - 8, cy - 2, 16, 11, 2.5);
  // Fur tufts — short vertical strokes showing hair texture
  g.fillStyle(0x5a3212, 0.95);
  for (let i = 0; i < 14; i++) {
    g.fillRect(cx - 7 + i, cy - 1.5 + (i % 3) * 0.6, 0.6, 2.2);
  }
  // Lower shadow on the pouch (weight hangs down)
  g.fillStyle(0x0a0604, 0.55);
  g.fillRect(cx - 8, cy + 5, 16, 4);

  // ── THREE LONG HORSE-HAIR TASSELS — the signature silhouette
  // tell. Each has a brass cap at the top + dark horsehair body
  // + splayed fringe at the tip. Hang well below the pouch. ──
  const tasselXs = [cx - 5, cx, cx + 5];
  for (const tx of tasselXs) {
    // Brass cap at top
    g.fillStyle(0xc8a848, 1);
    g.fillRect(tx - 1.3, cy + 9, 2.6, 1.5);
    g.fillStyle(0xfadc6a, 1);
    g.fillRect(tx - 1.3, cy + 9, 2.6, 0.5);
    // Tassel body — dark horsehair column
    g.fillStyle(0x1a0e06, 1);
    g.fillRect(tx - 1, cy + 10.5, 2, 3.5);
    g.fillStyle(0x3a2010, 1);
    g.fillRect(tx - 0.5, cy + 10.5, 1, 3.5);
    // Splayed fringe strands at the tip
    g.fillStyle(0x1a0e06, 1);
    g.fillRect(tx - 1.6, cy + 14, 0.6, 1.8);
    g.fillRect(tx - 0.3, cy + 14, 0.6, 1.8);
    g.fillRect(tx + 1, cy + 14, 0.6, 1.8);
  }

  g.generateTexture('ucard_sporran', s, s);
  g.destroy();
}
