import * as Phaser from 'phaser';

/**
 * `wicon_stag_antler` — a single shed red-deer antler tine, the kind
 * the haggis carries lowered between his ears. The Highland palette:
 * bone-cream main body, a darker rim along the lit edge, two small
 * pearled burrs at the brow, and a stubby coronet at the base where
 * the velvet shed. Distinct from the blade icons (sgian/claymore) —
 * this is bone, not steel; weight, not flick. Reads as "the monarch
 * of the glen at chest height" rather than "trophy on a wall".
 */
export function drawStagAntlerIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 16;

  // ── Drop shadow under the antler.
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(cx, cy + 10, 18, 2.5);

  // ── BEAM — main shaft of the antler running diagonal lower-left to
  // upper-right. Dark outline + cream body + bright top edge highlight.
  // Outline (dark bone)
  g.fillStyle(0x3a2a1a, 1);
  g.fillTriangle(cx - 11, cy + 8, cx + 4, cy - 6, cx + 5, cy - 4);
  g.fillTriangle(cx - 11, cy + 8, cx + 5, cy - 4, cx - 9, cy + 10);
  // Cream body
  g.fillStyle(0xc8b890, 1);
  g.fillTriangle(cx - 10, cy + 8, cx + 4, cy - 5, cx + 4, cy - 4);
  g.fillTriangle(cx - 10, cy + 8, cx + 4, cy - 4, cx - 8, cy + 9);
  // Top-edge highlight
  g.fillStyle(0xe8d8b0, 1);
  g.fillTriangle(cx - 10, cy + 7.5, cx + 4, cy - 5.5, cx + 3.5, cy - 5);

  // ── BROW TINE — short, forward-pointing prong springing off the
  // beam near the base. The first tine on a red-deer antler.
  g.fillStyle(0x3a2a1a, 1);
  g.fillTriangle(cx - 7, cy + 5, cx - 4, cy + 11, cx - 2, cy + 9);
  g.fillStyle(0xc8b890, 1);
  g.fillTriangle(cx - 6.5, cy + 5.5, cx - 4.2, cy + 10, cx - 2.6, cy + 8.6);

  // ── BEZ TINE — second prong, mid-beam, swept upward.
  g.fillStyle(0x3a2a1a, 1);
  g.fillTriangle(cx - 4, cy + 2, cx + 0, cy - 9, cx + 1.5, cy - 7);
  g.fillStyle(0xc8b890, 1);
  g.fillTriangle(cx - 3.5, cy + 2, cx - 0.2, cy - 8, cx + 1, cy - 6.5);
  // Bez highlight
  g.fillStyle(0xe8d8b0, 0.85);
  g.fillRect(cx - 1.6, cy - 6, 1.2, 6);

  // ── CROWN POINT — small terminal tine at the very top of the beam,
  // reading as "antler", not just "stick".
  g.fillStyle(0x3a2a1a, 1);
  g.fillTriangle(cx + 3, cy - 5, cx + 7, cy - 11, cx + 6, cy - 4);
  g.fillStyle(0xc8b890, 1);
  g.fillTriangle(cx + 3.4, cy - 4.7, cx + 6.6, cy - 10, cx + 5.6, cy - 4.4);

  // ── PEARLED BURR — small lumpy bumps near the base where the brow
  // tine meets the beam. The texture-tell of a real antler.
  g.fillStyle(0x6a5a40, 1);
  g.fillCircle(cx - 8, cy + 6, 0.9);
  g.fillCircle(cx - 6.5, cy + 7, 0.7);
  g.fillCircle(cx - 7.5, cy + 8.2, 0.8);
  g.fillStyle(0xa89870, 0.9);
  g.fillRect(cx - 8.2, cy + 5.6, 0.4, 0.4);
  g.fillRect(cx - 6.7, cy + 6.7, 0.3, 0.3);

  // ── CORONET — stubby ridged ring at the very base of the beam,
  // marking where the antler shed its velvet.
  g.fillStyle(0x3a2a1a, 1);
  g.fillRect(cx - 12, cy + 8, 4, 3);
  g.fillStyle(0x6a5a40, 1);
  g.fillRect(cx - 11.6, cy + 8.4, 3.2, 2.2);
  g.fillStyle(0xa89870, 1);
  g.fillRect(cx - 11.4, cy + 8.6, 0.6, 1.6);
  g.fillRect(cx - 10.4, cy + 8.6, 0.6, 1.6);
  g.fillRect(cx - 9.4, cy + 8.6, 0.6, 1.6);

  g.generateTexture('wicon_stag_antler', s, s);
  g.destroy();
}
