/**
 * `tome_wraith` — open book floating in a sheet-ghost body, pages ruffled by unseen wind.
 */

import Phaser from 'phaser';

export function bakeTomeWraith(scene: Phaser.Scene): void {
  const s = 40;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // Ghostly halo — cool parchment-blue.
  g.fillStyle(0xb0c8d8, 0.18);
  g.fillEllipse(cx, cy, 26, 22);

  // Book spine — shadow beneath the open volume.
  g.fillStyle(0x201a14, 1);
  g.fillRect(cx - 1, cy + 2, 2, 8);

  // Open book body — two page sheets angled apart, leather cover
  // wrapping under the pages.
  g.fillStyle(0x4a2818, 1);
  g.fillTriangle(cx - 12, cy + 4, cx + 12, cy + 4, cx, cy + 10);
  // Left page — parchment.
  g.fillStyle(0xeadfb8, 1);
  g.fillTriangle(cx - 11, cy + 3, cx - 1, cy + 3, cx - 6, cy + 8);
  g.fillTriangle(cx - 11, cy + 3, cx - 11, cy - 4, cx - 1, cy - 2);
  g.fillTriangle(cx - 11, cy + 3, cx - 1, cy - 2, cx - 1, cy + 3);
  // Right page.
  g.fillStyle(0xf0e4c0, 1);
  g.fillTriangle(cx + 1, cy + 3, cx + 11, cy + 3, cx + 6, cy + 8);
  g.fillTriangle(cx + 11, cy + 3, cx + 11, cy - 4, cx + 1, cy - 2);
  g.fillTriangle(cx + 11, cy + 3, cx + 1, cy - 2, cx + 1, cy + 3);
  // Ink lines — horizontal writing strokes on both pages.
  g.fillStyle(0x1a1a2a, 0.85);
  g.fillRect(cx - 9, cy, 7, 1);
  g.fillRect(cx - 9, cy + 2, 7, 1);
  g.fillRect(cx + 2, cy, 7, 1);
  g.fillRect(cx + 2, cy + 2, 7, 1);
  g.fillStyle(0x1a1a2a, 0.5);
  g.fillRect(cx - 9, cy + 4, 6, 1);
  g.fillRect(cx + 2, cy + 4, 6, 1);

  // Ghostly face rising between the pages — eyes + mouth as black
  // pits on a pale translucent smear.
  g.fillStyle(0xe4d8e0, 0.8);
  g.fillEllipse(cx, cy - 6, 9, 12);
  g.fillStyle(0x120814, 1);
  g.fillRect(cx - 2, cy - 8, 1, 2);
  g.fillRect(cx + 1, cy - 8, 1, 2);
  g.fillRect(cx - 2, cy - 3, 4, 1);

  // Torn page scraps orbiting — three small pale rectangles at varied
  // angles to suggest the volume is shedding paper as it moves.
  g.fillStyle(0xeadfb8, 0.9);
  g.fillRect(cx + 11, cy - 8, 3, 2);
  g.fillStyle(0xeadfb8, 0.7);
  g.fillRect(cx - 13, cy - 10, 3, 2);
  g.fillStyle(0xeadfb8, 0.5);
  g.fillRect(cx + 13, cy + 3, 2, 2);

  g.generateTexture('tome_wraith', s, s);
  g.destroy();
}

/**
 * Dean Apparition — DESIGN_IDEAS section 3 Academic #3. Formal
 * ghostly dean in academic gown + mortarboard, stern moustached
 * face, arms folded in a disciplinary pose. Mass-override chase
 * so contact shoves the player — "the academy does not wait".
 */
