import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';
/**
 * `ucard_stat_damage` — damage-boost stat icon. Design pivot: old
 * icon used subtle diagonal rect-pillars as sword slashes that
 * read as generic motion lines at 16×16. New pitch — TWO CROSSED
 * BROADSWORD BLADES behind a big CENTRAL DAMAGE BURST. Blades form
 * an X silhouette (combat crest); explosion at centre screams "hit".
 * Flame wisps radiate from the core for impact-energy readability.
 */
export function drawStatDamage(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x3c2318);
  const cx = 16, cy = 16;

  // ── CROSSED BROADSWORD BLADES — X-shape behind the burst. ──
  // Sword 1: top-left to bottom-right
  g.fillStyle(0x0a0a0a, 1);
  g.fillTriangle(4, 4, 7, 4, 28, 28);
  g.fillTriangle(4, 4, 28, 28, 28, 25);
  g.fillStyle(0x6a7a8a, 1);
  g.fillTriangle(5, 5, 7, 5, 27, 27);
  g.fillTriangle(5, 5, 27, 27, 27, 25);
  g.fillStyle(0xa8b8c8, 1);
  g.fillTriangle(5, 5, 6, 5, 27, 27);

  // Sword 2: top-right to bottom-left (mirror)
  g.fillStyle(0x0a0a0a, 1);
  g.fillTriangle(28, 4, 25, 4, 4, 28);
  g.fillTriangle(28, 4, 4, 28, 4, 25);
  g.fillStyle(0x6a7a8a, 1);
  g.fillTriangle(27, 5, 25, 5, 5, 27);
  g.fillTriangle(27, 5, 5, 27, 5, 25);
  g.fillStyle(0xa8b8c8, 1);
  g.fillTriangle(27, 5, 26, 5, 5, 27);

  // ── Crossguards — brass horizontal bars where blade meets grip. ──
  g.fillStyle(0x0a0a0a, 1);
  g.fillRect(22, 21, 8, 2.5);
  g.fillRect(2, 21, 8, 2.5);
  g.fillStyle(0xc88a40, 1);
  g.fillRect(23, 21.5, 6, 1.5);
  g.fillRect(3, 21.5, 6, 1.5);

  // ── Grips — leather-wrapped bars. ──
  g.fillStyle(0x3a1a0a, 1);
  g.fillRect(28, 23, 3, 2.5);
  g.fillRect(1, 23, 3, 2.5);

  // ── Pommels — round brass caps at the grip ends. ──
  g.fillStyle(0xc88a40, 1);
  g.fillCircle(30.5, 25, 1.5);
  g.fillCircle(1.5, 25, 1.5);
  g.fillStyle(0xfadc6a, 1);
  g.fillCircle(30.5, 25, 0.8);
  g.fillCircle(1.5, 25, 0.8);

  // ── CENTRAL DAMAGE BURST — orange explosion with hot core. ──
  g.fillStyle(0xff6a10, 0.65);
  g.fillCircle(cx, cy, 7);
  g.fillStyle(0xff8a20, 1);
  g.fillCircle(cx, cy, 5);
  g.fillStyle(0xffaa40, 1);
  g.fillCircle(cx, cy, 3.5);
  g.fillStyle(0xffdd88, 1);
  g.fillCircle(cx, cy, 2);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx, cy, 0.9);

  // ── FLAME WISPS radiating from the core — 4 cardinal + 4 diagonal. ──
  g.fillStyle(0xff8a20, 0.85);
  g.fillTriangle(cx, cy - 8, cx - 1.2, cy - 4, cx + 1.2, cy - 4);
  g.fillTriangle(cx, cy + 8, cx - 1.2, cy + 4, cx + 1.2, cy + 4);
  g.fillTriangle(cx - 8, cy, cx - 4, cy - 1.2, cx - 4, cy + 1.2);
  g.fillTriangle(cx + 8, cy, cx + 4, cy - 1.2, cx + 4, cy + 1.2);

  g.generateTexture('ucard_stat_damage', s, s);
  g.destroy();
}
