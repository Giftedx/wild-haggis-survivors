import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';

/**
 * `ucard_whetstone` — passive item icon. Rectangular grey-grit
 * sharpening stone laid diagonal on the card with a small steel
 * blade resting on it edge-up + a faint spark where blade meets
 * stone. Sells "the haggis sharpens between fights". Pairs with
 * the Sgian Dubh weapon for the legendary Sgian Geal evolution.
 */
export function drawWhetstone(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  cardIconBg(g, s, 0x1a1a22);
  const cx = 16, cy = 16;

  // ── Drop shadow under the stone.
  g.fillStyle(0x000000, 0.45);
  g.fillEllipse(cx, cy + 9, 22, 3);
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, cy + 9, 26, 1.8);

  // ── WHETSTONE — diagonal slab, dark grey grit with a slightly
  // lighter top face + a chiselled bevel along the long edge.
  // Dark outline.
  g.fillStyle(0x0a0a0e, 1);
  g.fillRect(cx - 11, cy - 1, 22, 8);
  // Grit body — speckled grey.
  g.fillStyle(0x4a4a52, 1);
  g.fillRect(cx - 10, cy, 20, 6);
  // Top face (lit) — paler, with a slight gloss where the blade has
  // run along it many times.
  g.fillStyle(0x6a6a72, 1);
  g.fillRect(cx - 10, cy, 20, 1.4);
  g.fillStyle(0x8a8a92, 0.6);
  g.fillRect(cx - 9, cy + 0.2, 18, 0.6);
  // Speckles (carborundum grit)
  g.fillStyle(0x2a2a32, 1);
  for (let i = 0; i < 14; i++) {
    g.fillRect(cx - 9 + (i * 1.4), cy + 1 + ((i % 3) * 0.8), 0.5, 0.5);
  }
  g.fillStyle(0x8a8a92, 0.7);
  for (let i = 0; i < 8; i++) {
    g.fillRect(cx - 8 + (i * 2.4), cy + 2.6 + ((i % 2) * 1.2), 0.4, 0.4);
  }
  // Chamfered edge highlight — single bright stripe along the lit edge.
  g.fillStyle(0xb8b8c2, 0.85);
  g.fillRect(cx - 9.5, cy - 0.2, 19, 0.4);

  // ── BLADE resting on the stone, edge-down, angled so the tip
  // meets the stone's surface mid-length. Smaller than the Sgian
  // Dubh weapon icon — this is just a generic "blade being honed"
  // not the dagger itself.
  // Dark outline
  g.fillStyle(0x0a0a0e, 1);
  g.fillTriangle(cx - 7, cy - 2, cx + 6, cy - 9, cx + 7, cy - 7);
  g.fillTriangle(cx - 7, cy - 2, cx + 7, cy - 7, cx - 6, cy - 1);
  // Cold-steel body
  g.fillStyle(0x88909a, 1);
  g.fillTriangle(cx - 6, cy - 2, cx + 6, cy - 8, cx + 6, cy - 7);
  // Leading edge (the side meeting the stone — bright white because
  // it's just been sharpened).
  g.fillStyle(0xd8dde4, 1);
  g.fillTriangle(cx - 6, cy - 2, cx + 6, cy - 8, cx - 5.5, cy - 1.5);
  // Specular flash mid-blade
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx, cy - 5, 1.2, 0.5);

  // ── SPARK where blade meets stone — tiny burst of three white
  // dots + a hot orange centre. The single warm note on an otherwise
  // cold-grey card; sells "active honing, not just stored".
  g.fillStyle(0xffd060, 1);
  g.fillCircle(cx + 2, cy - 1, 1);
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx + 1.5, cy - 1.5, 0.6, 0.6);
  g.fillRect(cx + 3, cy - 2, 0.5, 0.5);
  g.fillRect(cx + 0, cy - 2.4, 0.5, 0.5);
  // Faint warm glow around the spark
  g.fillStyle(0xffa040, 0.25);
  g.fillCircle(cx + 2, cy - 1, 3);

  g.generateTexture('ucard_whetstone', s, s);
  g.destroy();
}
