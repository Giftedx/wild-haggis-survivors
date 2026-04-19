/**
 * `ghost` — Mary Queen of Scots revenant: hood, scaffold mark, translucent robe, reproachful stare.
 */

import Phaser from 'phaser';

export function bakeGhost(scene: Phaser.Scene): void {
  const s = 40;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  g.fillStyle(0x668888, 0.35);
  g.fillEllipse(cx, cy - 2, 30, 28);
  g.fillStyle(0x88aaaa, 0.5);
  g.fillEllipse(cx, cy - 2, 26, 24);
  g.fillStyle(0xaacccc, 0.45);
  g.fillEllipse(cx - 2, cy - 4, 20, 18);

  // Trailing tartan sash
  g.fillStyle(0x334466, 0.4);
  g.fillRect(cx - 4, cy - 8, 8, 20);
  g.fillStyle(0x446688, 0.3);
  g.fillRect(cx - 3, cy - 7, 6, 18);
  g.fillStyle(0x556688, 0.3);
  g.fillRect(cx - 3, cy - 3, 6, 1);
  g.fillRect(cx - 3, cy + 3, 6, 1);
  g.fillRect(cx - 1, cy - 7, 1, 18);

  // Wavy ghost-tail
  g.fillStyle(0x88aaaa, 0.5);
  for (let i = 0; i < 5; i++) {
    g.fillCircle(cx - 12 + i * 6, cy + 10, 5);
  }
  g.fillStyle(0xaacccc, 0.4);
  for (let i = 0; i < 5; i++) {
    g.fillCircle(cx - 12 + i * 6, cy + 9, 4);
  }

  // Chain links (castle dungeon ghost)
  g.lineStyle(1.5, 0x8899aa, 0.6);
  g.strokeCircle(cx + 10, cy + 4, 2);
  g.strokeCircle(cx + 12, cy + 7, 2);
  g.strokeCircle(cx + 10, cy + 10, 2);

  // French hood (Mary Queen of Scots)
  g.fillStyle(0x222233, 0.6);
  g.fillEllipse(cx, cy - 12, 18, 6);
  g.fillStyle(0x1a1a2a, 0.7);
  g.fillEllipse(cx, cy - 13, 16, 4);
  g.fillStyle(0xbbccdd, 0.5);
  g.fillRect(cx - 5, cy - 11, 10, 2);
  g.fillStyle(0xccddee, 0.4);
  g.fillRect(cx - 4, cy - 11, 8, 1);

  // Hollow eye sockets (glowing blue-green)
  g.fillStyle(0x000000, 0.9);
  g.fillCircle(cx - 5, cy - 6, 4);
  g.fillCircle(cx + 5, cy - 6, 4);
  g.fillStyle(0x44ddaa, 1);
  g.fillCircle(cx - 5, cy - 6, 2.2);
  g.fillCircle(cx + 5, cy - 6, 2.2);
  g.fillStyle(0xaaffdd, 1);
  g.fillCircle(cx - 5, cy - 7, 0.8);
  g.fillCircle(cx + 5, cy - 7, 0.8);

  // Wailing O-mouth (eternal scream)
  g.fillStyle(0x000000, 0.9);
  g.fillEllipse(cx, cy + 2, 6, 6);
  g.fillStyle(0x1a3344, 1);
  g.fillEllipse(cx, cy + 2, 4, 4);

  // ── Mary's crucifix (she wore one to the scaffold — ghostly gold) ──
  g.fillStyle(0xccaa55, 0.4);
  g.fillRect(cx - 1, cy - 3, 2, 5);
  g.fillRect(cx - 2, cy - 2, 4, 1);
  g.fillStyle(0xddbb66, 0.3);
  g.fillCircle(cx, cy - 3, 0.6);

  // ── Ectoplasmic drip (ghostly substance trailing down) ──
  g.fillStyle(0x88aaaa, 0.25);
  g.fillRect(cx - 8, cy + 12, 2, 4);
  g.fillCircle(cx - 7, cy + 16, 1);
  g.fillStyle(0xaacccc, 0.2);
  g.fillRect(cx + 6, cy + 13, 1, 3);
  g.fillCircle(cx + 6, cy + 16, 0.8);

  // ── Faint execution mark (dark line across neck — she was beheaded) ──
  g.fillStyle(0x884455, 0.2);
  g.fillRect(cx - 4, cy - 3, 8, 1);

  g.generateTexture('ghost', s, s);
  g.destroy();
}

