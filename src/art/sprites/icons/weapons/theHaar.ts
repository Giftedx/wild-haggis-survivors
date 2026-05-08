import * as Phaser from 'phaser';

/**
 * `wicon_the_haar` — haar-fog evolution icon. Design pivot: old
 * icon used a muted green-grey palette that read too close to
 * `wicon_scotch_mist` (the sibling fog weapon) — the two were
 * confusable at a glance. New pitch — pure COLD NORTH-SEA
 * palette (teal-grey + pale-cyan, NO green), horizontal fog bands
 * dominating the lower half (matching the `haar_wraith` enemy
 * silhouette), and a pale SKELETAL FACE pushing forward through
 * the top with cyan pinprick eyes. Cold palette is the key
 * differentiator from the toxic green mist.
 */
export function drawTheHaarIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── Cold north-sea halo — teal-grey, no green. ──
  g.fillStyle(0x4a6278, 0.22);
  g.fillCircle(cx, cy, 15);
  g.fillStyle(0x7a94a8, 0.18);
  g.fillCircle(cx, cy, 12);

  // ── Horizontal fog bands at the bottom half — signature haar. ──
  g.fillStyle(0x8aa4b4, 0.4);
  g.fillEllipse(cx, cy + 13, 26, 2.5);
  g.fillStyle(0x9ab4c4, 0.5);
  g.fillEllipse(cx - 2, cy + 10, 24, 2.5);
  g.fillStyle(0x7a94a8, 0.65);
  g.fillEllipse(cx + 2, cy + 7, 22, 2.5);
  g.fillStyle(0x6a84a0, 0.75);
  g.fillEllipse(cx - 1, cy + 4, 20, 2.5);
  g.fillStyle(0x5a7890, 0.85);
  g.fillEllipse(cx, cy + 1, 18, 2.5);

  // ── Cold skeletal face emerging forward through the fog.
  // Darker rim, bumped main-plane contrast, sharper jaw line so
  // the skull reads at 32px instead of dissolving into the bands. ──
  g.fillStyle(0x0a1820, 1);
  g.fillEllipse(cx, cy - 3, 11, 12);
  g.fillStyle(0x2a4258, 1);
  g.fillEllipse(cx, cy - 3, 8.8, 9.6);
  g.fillStyle(0xc8d4dc, 1);
  g.fillEllipse(cx, cy - 4, 7.2, 8.4);
  // Brighter forehead highlight.
  g.fillStyle(0xeaf0f4, 0.75);
  g.fillEllipse(cx - 1, cy - 6, 4, 2.2);
  // Gaunt cheek hollows — deeper, larger.
  g.fillStyle(0x1a2a3a, 0.85);
  g.fillEllipse(cx - 2.6, cy - 0.5, 2.2, 3.0);
  g.fillEllipse(cx + 2.6, cy - 0.5, 2.2, 3.0);
  // Sharp jaw underline.
  g.fillStyle(0x1a2a3a, 0.85);
  g.fillRect(cx - 3, cy + 1.6, 6, 0.5);

  // Hollow eye sockets — bigger, deeper. Cyan glow strengthened so
  // the kill-tell pops through the fog.
  g.fillStyle(0x000000, 1);
  g.fillEllipse(cx - 2, cy - 4, 2.8, 3.4);
  g.fillEllipse(cx + 2, cy - 4, 2.8, 3.4);
  g.fillStyle(0x0a1a28, 1);
  g.fillEllipse(cx - 2, cy - 4, 2.2, 2.8);
  g.fillEllipse(cx + 2, cy - 4, 2.2, 2.8);
  g.fillStyle(0x8ad8f0, 0.7);
  g.fillCircle(cx - 2, cy - 4, 1.6);
  g.fillCircle(cx + 2, cy - 4, 1.6);
  g.fillStyle(0xccf0ff, 1);
  g.fillCircle(cx - 2, cy - 4, 1.0);
  g.fillCircle(cx + 2, cy - 4, 1.0);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 2, cy - 4.3, 0.45);
  g.fillCircle(cx + 2, cy - 4.3, 0.45);

  // Nose hollow
  g.fillStyle(0x0a1a28, 1);
  g.fillTriangle(cx, cy, cx - 0.8, cy + 1.5, cx + 0.8, cy + 1.5);

  // Skeletal grin — gapped teeth
  g.fillStyle(0x1a2838, 1);
  g.fillRect(cx - 2.5, cy + 2.5, 5, 1.5);
  g.fillStyle(0xc8d4dc, 1);
  g.fillRect(cx - 2.2, cy + 2.8, 0.7, 1);
  g.fillRect(cx - 1, cy + 3, 0.7, 0.8);
  g.fillRect(cx + 0.3, cy + 2.8, 0.7, 1);
  g.fillRect(cx + 1.5, cy + 3, 0.7, 0.8);

  // ── Drifting upper wisps above the head. ──
  g.fillStyle(0xc4d4de, 0.5);
  g.fillCircle(cx - 4, cy - 11, 1.3);
  g.fillCircle(cx + 4, cy - 12, 1.2);
  g.fillStyle(0xe0eaf0, 0.35);
  g.fillCircle(cx, cy - 14, 1);

  // ── Side-drift tendrils — the "creeping in from the sea" tell. ──
  g.fillStyle(0xaac4d4, 0.5);
  g.fillRect(cx - 14, cy + 5, 6, 1);
  g.fillRect(cx + 8, cy + 6, 6, 1);
  g.fillStyle(0xc4d4dc, 0.35);
  g.fillRect(cx - 16, cy + 9, 5, 1);
  g.fillRect(cx + 11, cy + 10, 5, 1);

  g.generateTexture('wicon_the_haar', s, s);
  g.destroy();
}
