/**
 * `fx_combo_chevron` — combo-meter milestone burst. A double-stack
 * chevron pointing up-right with a sparkle tail. Gold + cream layered
 * so it reads as "rank-up / streak hit" without competing with damage
 * numbers. JuiceSystem can spawn it on combo thresholds (10×, 25×,
 * 50× etc.).
 */

import * as Phaser from 'phaser';

const HALO = 0xffe080;
const CHEVRON_OUTLINE = 0x4a3208;
const CHEVRON_BASE = 0xc89020;
const CHEVRON_MID = 0xefc040;
const CHEVRON_HI = 0xfaecaa;
const SPARK = 0xffffff;

export function bakeComboChevron(scene: Phaser.Scene): void {
  const sw = 24;
  const sh = 16;
  const g = scene.add.graphics();
  const cx = sw / 2;
  const cy = sh / 2;

  // Soft halo behind the chevron.
  g.fillStyle(HALO, 0.22);
  g.fillEllipse(cx, cy, sw - 2, sh - 2);
  g.fillStyle(HALO, 0.3);
  g.fillEllipse(cx, cy, sw - 8, sh - 6);

  // Lower (further) chevron — outline and fill.
  // Built from two thick fillRects rotated visually (left arm + right
  // arm meeting at the apex).
  // Outline.
  g.fillStyle(CHEVRON_OUTLINE, 1);
  // Apex peak.
  g.fillTriangle(cx - 1, cy + 4.4, cx + 5, cy - 1.4, cx + 5, cy + 4.4);
  // Left arm.
  g.fillRect(cx - 8, cy + 0.4, 9, 3);
  // Right arm.
  g.fillRect(cx - 1, cy + 0.4, 7, 3);
  // Inner base layer.
  g.fillStyle(CHEVRON_BASE, 1);
  g.fillTriangle(cx - 0.6, cy + 4, cx + 4.6, cy - 1, cx + 4.6, cy + 4);
  g.fillRect(cx - 7.4, cy + 0.8, 8.4, 2.2);
  g.fillRect(cx - 1, cy + 0.8, 6, 2.2);
  // Mid-tone stripe along the top edge.
  g.fillStyle(CHEVRON_MID, 1);
  g.fillRect(cx - 7.4, cy + 0.8, 8.4, 0.9);
  g.fillRect(cx - 1, cy + 0.8, 6, 0.9);
  // Highlight strip on the upper-front.
  g.fillStyle(CHEVRON_HI, 0.95);
  g.fillRect(cx - 7, cy + 0.8, 7.6, 0.4);
  g.fillRect(cx - 1, cy + 0.8, 5.4, 0.4);

  // Upper (closer) chevron — slightly forward-and-up. Outline + fills.
  g.fillStyle(CHEVRON_OUTLINE, 1);
  g.fillTriangle(cx - 1, cy + 0.8, cx + 5, cy - 5, cx + 5, cy + 0.8);
  g.fillRect(cx - 8, cy - 3, 9, 3);
  g.fillRect(cx - 1, cy - 3, 7, 3);
  g.fillStyle(CHEVRON_BASE, 1);
  g.fillTriangle(cx - 0.6, cy + 0.4, cx + 4.6, cy - 4.6, cx + 4.6, cy + 0.4);
  g.fillRect(cx - 7.4, cy - 2.6, 8.4, 2.2);
  g.fillRect(cx - 1, cy - 2.6, 6, 2.2);
  g.fillStyle(CHEVRON_MID, 1);
  g.fillRect(cx - 7.4, cy - 2.6, 8.4, 0.9);
  g.fillRect(cx - 1, cy - 2.6, 6, 0.9);
  g.fillStyle(CHEVRON_HI, 0.95);
  g.fillRect(cx - 7, cy - 2.6, 7.6, 0.4);
  g.fillRect(cx - 1, cy - 2.6, 5.4, 0.4);

  // Sparkle trail — three pinpricks behind the chevron stack.
  g.fillStyle(SPARK, 1);
  g.fillRect(cx - 10, cy - 1.2, 0.7, 0.7);
  g.fillStyle(SPARK, 0.85);
  g.fillRect(cx - 11.4, cy + 1, 0.5, 0.5);
  g.fillStyle(SPARK, 0.7);
  g.fillRect(cx - 11, cy - 3, 0.4, 0.4);

  // Forward-tip flash — bright pinprick at the peak.
  g.fillStyle(SPARK, 1);
  g.fillRect(cx + 4.6, cy - 5.2, 0.6, 0.6);
  g.fillStyle(HALO, 1);
  g.fillCircle(cx + 5, cy - 4.6, 0.6);

  g.generateTexture('fx_combo_chevron', sw, sh);
  g.destroy();
}
