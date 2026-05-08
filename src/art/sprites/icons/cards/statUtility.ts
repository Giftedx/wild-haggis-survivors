import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';
/**
 * `ucard_stat_utility` — utility stat icon. Design pivot: old icon
 * was a generic 8-point gold radial star that could have been any
 * category's burst. New pitch — an ANTIQUE SKELETON KEY with a
 * THISTLE-SHAPED BOW: the key is universal "utility/access"
 * iconography, and the thistle-bow keeps the Scottish anchor.
 */
export function drawStatUtility(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x2d2d22);
  const cx = 16, cy = 16;

  // ── Warm gold aura behind the key. ──
  g.fillStyle(0xd8a848, 0.15);
  g.fillCircle(cx, cy, 13);

  // ── Thistle bow at the top — green calyx with radiating bracts. ──
  g.fillStyle(0x1a3810, 1);
  g.fillEllipse(cx, cy - 5, 7, 4);
  g.fillStyle(0x3a6a18, 1);
  g.fillEllipse(cx, cy - 5, 6, 3);
  g.fillStyle(0x1a3810, 1);
  g.fillTriangle(cx - 4, cy - 5, cx - 6, cy - 7, cx - 3, cy - 4);
  g.fillTriangle(cx + 4, cy - 5, cx + 6, cy - 7, cx + 3, cy - 4);
  g.fillTriangle(cx - 2, cy - 7, cx, cy - 9, cx + 2, cy - 7);

  // Purple thistle bloom inside the bow
  g.fillStyle(0x4a1868, 1);
  g.fillEllipse(cx, cy - 7, 6, 4);
  g.fillStyle(0x8a3ab0, 1);
  g.fillEllipse(cx, cy - 7, 5, 3);
  // Bristly purple florets radiating upward
  g.fillStyle(0xcc78dd, 1);
  for (let i = 0; i < 7; i++) {
    const bx = cx - 3 + i;
    const h = 1.5 + (i % 3) * 0.5;
    g.fillRect(bx, cy - 9 - h, 0.5, h);
  }
  // Bright tip dots
  g.fillStyle(0xffccee, 1);
  g.fillCircle(cx, cy - 11, 0.6);
  g.fillCircle(cx - 2, cy - 10, 0.4);
  g.fillCircle(cx + 2, cy - 10, 0.4);

  // ── Key shaft — thick vertical gold bar. ──
  g.fillStyle(0x4a3008, 1);
  g.fillRect(cx - 1.5, cy - 2, 3, 13);
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 1, cy - 2, 2, 13);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 0.5, cy - 2, 1, 13);

  // ── Key bit — antique L-shape with two teeth. ──
  g.fillStyle(0x4a3008, 1);
  g.fillRect(cx - 1.5, cy + 10, 7, 2.5);
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 1, cy + 10, 6, 2);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 1, cy + 10, 6, 0.6);
  // First tooth (downward)
  g.fillStyle(0x4a3008, 1);
  g.fillRect(cx + 1, cy + 12, 1.8, 2.5);
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx + 1.3, cy + 12, 1.2, 2);
  // Second tooth
  g.fillStyle(0x4a3008, 1);
  g.fillRect(cx + 3.5, cy + 12, 1.8, 2);
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx + 3.8, cy + 12, 1.2, 1.5);

  // ── Sparkle at the thistle tip — magical key. ──
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(cx - 3, cy - 11, 0.8, 0.4);
  g.fillRect(cx - 3.3, cy - 11.3, 0.4, 0.8);

  g.generateTexture('ucard_stat_utility', s, s);
  g.destroy();
}
