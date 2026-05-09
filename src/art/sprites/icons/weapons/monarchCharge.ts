import * as Phaser from 'phaser';

/**
 * `wicon_monarch_charge` — evolved Monarch's Charge. The same antler
 * shape as the base icon, but doubled into a FULL CROWN (left + right
 * antler joined at the base by a stylised brow-band of bright bone),
 * with a faint gold halo behind the crown for the legendary glow. The
 * tines are tipped with tiny bright sparks reading as "the king-stag
 * turning his crown through the herd". Distinct from the base icon's
 * lone-tine silhouette — this is the WHOLE rack, the moment after the
 * rut, the throne taken.
 */
export function drawMonarchChargeIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 16;

  // ── Drop shadow under the crown.
  g.fillStyle(0x000000, 0.45);
  g.fillEllipse(cx, cy + 11, 22, 3);

  // ── Legendary halo — soft warm gold behind the crown. Subtle so it
  // doesn't drown the silhouette; just enough to mark "evolved".
  g.fillStyle(0xf8d050, 0.18);
  g.fillCircle(cx, cy - 2, 13);
  g.fillStyle(0xfff0a0, 0.12);
  g.fillCircle(cx, cy - 2, 9);

  // Helper: draw one antler beam + tines, mirrored about cx via sign.
  const drawAntler = (sign: 1 | -1) => {
    // Outline (dark bone)
    g.fillStyle(0x3a2a1a, 1);
    g.fillTriangle(cx + sign * 3, cy + 8, cx + sign * 11, cy - 9, cx + sign * 12, cy - 7);
    g.fillTriangle(cx + sign * 3, cy + 8, cx + sign * 12, cy - 7, cx + sign * 4, cy + 9);
    // Cream body
    g.fillStyle(0xd8c8a0, 1);
    g.fillTriangle(cx + sign * 3.3, cy + 7.8, cx + sign * 11, cy - 8.5, cx + sign * 11, cy - 7.5);
    g.fillTriangle(cx + sign * 3.3, cy + 7.8, cx + sign * 11, cy - 7.5, cx + sign * 3.6, cy + 8.6);
    // Top-edge highlight
    g.fillStyle(0xf0e0b8, 1);
    g.fillTriangle(cx + sign * 3.2, cy + 7.4, cx + sign * 10.8, cy - 8.6, cx + sign * 10.5, cy - 8);

    // Brow tine
    g.fillStyle(0x3a2a1a, 1);
    g.fillTriangle(cx + sign * 5, cy + 5, cx + sign * 7, cy + 11, cx + sign * 9, cy + 9);
    g.fillStyle(0xd8c8a0, 1);
    g.fillTriangle(cx + sign * 5.2, cy + 5.4, cx + sign * 7, cy + 10.4, cx + sign * 8.6, cy + 8.8);

    // Bez tine — mid-beam, swept up.
    g.fillStyle(0x3a2a1a, 1);
    g.fillTriangle(cx + sign * 7, cy + 0, cx + sign * 6, cy - 11, cx + sign * 8, cy - 9);
    g.fillStyle(0xd8c8a0, 1);
    g.fillTriangle(cx + sign * 6.8, cy + 0, cx + sign * 6.2, cy - 10, cx + sign * 7.6, cy - 8.5);
    g.fillStyle(0xf0e0b8, 0.8);
    g.fillRect(cx + sign * 6.5, cy - 9, 1, 5);

    // Trez tine — upper, near the crown point.
    g.fillStyle(0x3a2a1a, 1);
    g.fillTriangle(cx + sign * 9, cy - 4, cx + sign * 11, cy - 13, cx + sign * 12, cy - 11);
    g.fillStyle(0xd8c8a0, 1);
    g.fillTriangle(cx + sign * 9.2, cy - 4.2, cx + sign * 11, cy - 12, cx + sign * 11.6, cy - 10.6);

    // Tip sparks (the "monarch" tells)
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx + sign * 11, cy - 13, 0.8, 0.8);
    g.fillRect(cx + sign * 7, cy - 11, 0.6, 0.6);
    g.fillStyle(0xfff8e0, 1);
    g.fillRect(cx + sign * 9, cy + 9, 0.5, 0.5);

    // Pearled burr near the base
    g.fillStyle(0x6a5a40, 1);
    g.fillCircle(cx + sign * 4.5, cy + 6.5, 0.8);
    g.fillCircle(cx + sign * 5.5, cy + 7.5, 0.7);
  };
  drawAntler(-1);
  drawAntler(1);

  // ── BROW BAND — bright bone arc joining the two antlers across the
  // brow. Reads as "the rack is one piece" rather than "two trophies".
  g.fillStyle(0x3a2a1a, 1);
  g.fillRect(cx - 4, cy + 6, 8, 4);
  g.fillStyle(0xe8d8b0, 1);
  g.fillRect(cx - 3.4, cy + 6.6, 6.8, 2.8);
  g.fillStyle(0xfff0d0, 0.85);
  g.fillRect(cx - 3, cy + 7, 6, 0.6);
  // Centre jewel — small gold inset where the antlers meet.
  g.fillStyle(0xc8a830, 1);
  g.fillCircle(cx, cy + 8, 1);
  g.fillStyle(0xffe898, 1);
  g.fillCircle(cx - 0.3, cy + 7.7, 0.4);

  g.generateTexture('wicon_monarch_charge', s, s);
  g.destroy();
}
