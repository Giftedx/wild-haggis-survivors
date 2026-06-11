import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';
/**
 * `ucard_loch_water` — loch-water pickup icon. Design pivot (v2):
 * old icon tried to paint a whole miniature loch scene inside the
 * jar — two mountains, snow caps, ripples, inverted reflection —
 * and everything collapsed to a blue-green smudge at 32px. New
 * pitch: strip to ONE bold mountain silhouette with a single snow
 * cap, a thick teal water band filling the lower half, one clean
 * ripple line, and a prominent glass rim/sheen. The silhouette
 * anchor is "bottled mountain-and-water" not "detailed landscape".
 */
export function drawLochWater(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x12334a);
  const cx = 16;

  // ── Cork stopper on top — classic "bottled" signal. ──
  g.fillStyle(0x4a3018, 1);
  g.fillRect(cx - 4, 3, 8, 4);
  g.fillStyle(0x8a6838, 1);
  g.fillRect(cx - 4, 3, 8, 3);
  g.fillStyle(0xaa8040, 1);
  g.fillRect(cx - 3.5, 3, 7, 1);

  // ── Jar neck — short narrow column. ──
  g.fillStyle(0x0a2030, 1);
  g.fillRect(cx - 3.5, 7, 7, 3);
  g.fillStyle(0x2a5a80, 0.75);
  g.fillRect(cx - 3, 7, 6, 2.5);

  // ── Glass jar body — wide rounded rect. Dark outline + lighter
  // interior. ──
  g.fillStyle(0x0a1820, 1);
  g.fillRoundedRect(cx - 10, 9, 20, 19, 4);
  g.fillStyle(0x1a3a58, 1);
  g.fillRoundedRect(cx - 9, 10, 18, 17, 3);

  // ── BIG MOUNTAIN — ONE bold silhouette filling upper-mid of the
  // jar. Dark slate purple. Apex near 13-14 for clarity. ──
  g.fillStyle(0x0a1028, 1);
  g.fillTriangle(cx - 8, 22, cx, 11, cx + 8, 22);
  g.fillStyle(0x1a1e40, 1);
  g.fillTriangle(cx - 7, 22, cx, 12, cx + 7, 22);
  // Shaded right face (darker)
  g.fillStyle(0x0a0e20, 0.85);
  g.fillTriangle(cx, 12, cx + 7, 22, cx + 1, 22);
  // Sunlit left face (lighter)
  g.fillStyle(0x2a2e58, 1);
  g.fillTriangle(cx - 6, 22, cx, 13, cx - 1, 22);

  // ── SNOW CAP — single bold white triangle at the apex. Large
  // enough to read at 32px. ──
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(cx - 2, 14, cx, 11, cx + 2, 14);
  // Snow-tail drip on the left face
  g.fillStyle(0xe0e8f0, 1);
  g.fillTriangle(cx - 2, 14, cx - 1, 14, cx - 1.5, 15.5);

  // ── TEAL WATER BAND — thick horizontal band at the lower half.
  // Bold so it reads as "water" instantly. ──
  g.fillStyle(0x1a4a68, 1);
  g.fillRect(cx - 9, 22, 18, 5);
  g.fillStyle(0x2a7aa0, 1);
  g.fillRect(cx - 9, 22, 18, 2);
  g.fillStyle(0x4a9ac0, 1);
  g.fillRect(cx - 9, 22, 18, 0.8);

  // ── ONE CLEAN RIPPLE — single curved line across the water. ──
  g.fillStyle(0xcceaf8, 1);
  g.fillRect(cx - 5, 24.5, 8, 0.6);
  g.fillRect(cx - 6, 25, 2, 0.5);
  g.fillRect(cx + 4, 25, 3, 0.5);

  // ── Glass rim highlight — crisp white band at the top of the
  // jar body. ──
  g.fillStyle(0xffffff, 0.7);
  g.fillRect(cx - 9, 10, 18, 0.6);

  // ── Glass sheen — single vertical highlight on the left edge. ──
  g.fillStyle(0xffffff, 0.45);
  g.fillRect(cx - 9, 11, 1, 15);

  g.generateTexture('ucard_loch_water', s, s);
  g.destroy();
}
