import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';

/**
 * `ucard_velvet_antler` — passive item icon. A young antler still IN
 * VELVET (the soft pre-rut covering): cream bone underneath, rich
 * russet-brown velvet skin wrapping the beam, the velvet wrinkling
 * at the crown points, fine pale hair fuzzing the surface. Distinct
 * from the Stag Antler weapon icon's bare-bone tine — this is the
 * antler in summer, full of stored energy. Pairs with Stag Antler at
 * lv5 to unlock Monarch's Charge.
 */
export function drawVelvetAntler(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  cardIconBg(g, s, 0x1a1a22);
  const cx = 16, cy = 16;

  // ── Drop shadow under the antler.
  g.fillStyle(0x000000, 0.45);
  g.fillEllipse(cx, cy + 9, 18, 2.5);

  // ── BEAM — diagonal, same shape as the weapon icon but enlarged
  // and wrapped in velvet (the brown skin layer).
  // Outline (very dark)
  g.fillStyle(0x1a0a04, 1);
  g.fillTriangle(cx - 11, cy + 7, cx + 5, cy - 8, cx + 6, cy - 6);
  g.fillTriangle(cx - 11, cy + 7, cx + 6, cy - 6, cx - 9, cy + 9);
  // Velvet skin — rich russet brown.
  g.fillStyle(0x5a3a20, 1);
  g.fillTriangle(cx - 10, cy + 7, cx + 5, cy - 7, cx + 5, cy - 6);
  g.fillTriangle(cx - 10, cy + 7, cx + 5, cy - 6, cx - 8, cy + 8);
  // Velvet highlight — warmer brown along the lit top edge.
  g.fillStyle(0x8a5a30, 1);
  g.fillTriangle(cx - 10, cy + 6.5, cx + 5, cy - 7.5, cx + 4.5, cy - 7);
  // Velvet specular — single bright stripe.
  g.fillStyle(0xb88a50, 0.7);
  g.fillRect(cx - 6, cy + 1, 8, 0.6);

  // ── BROW TINE — also velvet-wrapped.
  g.fillStyle(0x1a0a04, 1);
  g.fillTriangle(cx - 7, cy + 4, cx - 4, cy + 10, cx - 1, cy + 8);
  g.fillStyle(0x5a3a20, 1);
  g.fillTriangle(cx - 6.5, cy + 4.5, cx - 4.2, cy + 9.4, cx - 1.6, cy + 8);
  g.fillStyle(0x8a5a30, 0.8);
  g.fillRect(cx - 5, cy + 5, 4, 0.5);

  // ── BEZ TINE — sweeping up.
  g.fillStyle(0x1a0a04, 1);
  g.fillTriangle(cx - 4, cy + 1, cx + 1, cy - 11, cx + 3, cy - 9);
  g.fillStyle(0x5a3a20, 1);
  g.fillTriangle(cx - 3.5, cy + 1, cx + 0.6, cy - 10, cx + 2.4, cy - 8.4);
  g.fillStyle(0x8a5a30, 0.85);
  g.fillRect(cx - 1, cy - 7, 1.2, 7);

  // ── CROWN POINT — terminal tine, with a small CREAM bone-tip
  // peeking through the velvet (the only place the bone shows; the
  // velvet has worn at the highest stress point). This is the "future
  // antler" tell — the velvet is summer, the bone is autumn.
  g.fillStyle(0x1a0a04, 1);
  g.fillTriangle(cx + 4, cy - 6, cx + 8, cy - 12, cx + 7, cy - 5);
  g.fillStyle(0x5a3a20, 1);
  g.fillTriangle(cx + 4.4, cy - 5.7, cx + 7.6, cy - 11, cx + 6.6, cy - 5.4);
  // Bone tip showing through worn velvet
  g.fillStyle(0xe8d8b0, 1);
  g.fillTriangle(cx + 6.5, cy - 8.5, cx + 7.6, cy - 11, cx + 7.4, cy - 8.5);

  // ── PALE FUZZ — fine hair across the velvet surface. A dozen tiny
  // off-white pixels suggest the soft pre-rut nap.
  g.fillStyle(0xc8a888, 0.7);
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const bx = cx - 8 + t * 12 + ((i % 2) - 0.5) * 0.8;
    const by = cy + 6 - t * 10 + ((i % 3) - 1) * 0.6;
    g.fillRect(bx, by, 0.4, 0.4);
  }
  // A few brighter highlight hairs along the lit edge.
  g.fillStyle(0xe8d0a8, 0.9);
  g.fillRect(cx - 3, cy + 0.5, 0.5, 0.5);
  g.fillRect(cx + 0.5, cy - 4, 0.5, 0.5);
  g.fillRect(cx + 3.5, cy - 7.5, 0.5, 0.5);

  // ── PEARLED BURR + CORONET — pearling at the base, ridged ring,
  // same as the bare antler but partly hidden under the velvet collar.
  g.fillStyle(0x1a0a04, 1);
  g.fillRect(cx - 12, cy + 7, 4, 3);
  g.fillStyle(0x4a3a20, 1);
  g.fillRect(cx - 11.6, cy + 7.4, 3.2, 2.2);
  g.fillStyle(0x8a6a40, 1);
  g.fillRect(cx - 11.4, cy + 7.6, 0.6, 1.6);
  g.fillRect(cx - 10.4, cy + 7.6, 0.6, 1.6);

  g.generateTexture('ucard_velvet_antler', s, s);
  g.destroy();
}
