import Phaser from 'phaser';

export function bakeDeepFryer(scene: Phaser.Scene): void {
  const s = 48;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // ── Stainless steel body (industrial, battered from years of service) ──
  g.fillStyle(0x1a1a1a, 1);
  g.fillRect(cx - 18, cy - 6, 36, 22);
  g.fillStyle(0x555555, 1);
  g.fillRect(cx - 17, cy - 5, 34, 20);
  // Top rim (polished steel — catches light)
  g.fillStyle(0x777777, 1);
  g.fillRect(cx - 16, cy - 4, 32, 4);
  // Control panel strip (above the vat)
  g.fillStyle(0x444444, 1);
  g.fillRect(cx - 18, cy - 8, 36, 3);
  g.fillStyle(0x999999, 1);
  g.fillRect(cx - 18, cy - 7, 36, 1);
  // Temperature dial (red dot — it's on MAX)
  g.fillStyle(0xcc2222, 1);
  g.fillCircle(cx - 14, cy - 7, 1);
  g.fillStyle(0x666666, 1);
  g.fillCircle(cx - 10, cy - 7, 1);
  // Handles (heavy, welded)
  g.fillStyle(0x222222, 1);
  g.fillRect(cx - 22, cy - 5, 5, 3);
  g.fillRect(cx + 17, cy - 5, 5, 3);
  // Wire chip basket handle (visible above the oil — the tool of the trade)
  g.lineStyle(1.5, 0x888888, 0.8);
  g.lineBetween(cx + 14, cy - 8, cx + 14, cy - 12);
  g.lineBetween(cx + 12, cy - 12, cx + 16, cy - 12);
  // Basket hook
  g.fillStyle(0x999999, 1);
  g.fillCircle(cx + 14, cy - 12, 1);

  // Bubbling oil (VOLCANIC)
  g.fillStyle(0x774400, 1);
  g.fillRect(cx - 15, cy - 3, 30, 16);
  g.fillStyle(0xbb7700, 1);
  g.fillRect(cx - 14, cy - 2, 28, 14);
  g.fillStyle(0xdd9922, 1);
  g.fillRect(cx - 13, cy - 1, 26, 2);
  g.fillStyle(0xffdd44, 1);
  g.fillCircle(cx - 9, cy + 1, 2.5);
  g.fillCircle(cx + 5, cy + 3, 2.5);
  g.fillCircle(cx + 11, cy, 2);
  g.fillCircle(cx - 3, cy + 7, 2.5);
  g.fillCircle(cx - 11, cy + 5, 1.8);
  g.fillCircle(cx + 8, cy + 8, 1.5);
  g.fillCircle(cx + 1, cy + 1, 1.8);
  g.fillStyle(0xffffcc, 0.9);
  g.fillCircle(cx - 9, cy, 1.2);
  g.fillCircle(cx + 5, cy + 2, 1.2);
  g.fillCircle(cx - 3, cy + 6, 1.2);
  g.fillCircle(cx + 1, cy, 1);

  // Battered Mars bar
  g.fillStyle(0xaa7711, 1);
  g.fillRect(cx - 6, cy + 2, 12, 5);
  g.fillStyle(0xcc9922, 1);
  g.fillRect(cx - 5, cy + 3, 10, 3);
  g.fillStyle(0xddaa33, 0.7);
  g.fillCircle(cx - 3, cy + 3, 0.8);
  g.fillCircle(cx + 2, cy + 4, 0.8);

  // Pizza crunch (battered pizza slice — peak Glasgow)
  g.fillStyle(0xaa7711, 1);
  g.fillTriangle(cx + 8, cy + 3, cx + 14, cy + 8, cx + 4, cy + 8);
  g.fillStyle(0xcc9922, 1);
  g.fillTriangle(cx + 8, cy + 4, cx + 13, cy + 7, cx + 5, cy + 7);
  g.fillStyle(0xcc3322, 0.6);
  g.fillCircle(cx + 9, cy + 6, 0.8);

  // (Salt shaker and vinegar bottle removed — declutter for readability)

  // Steam wisps (THICK)
  g.fillStyle(0xdddddd, 0.7);
  g.fillCircle(cx - 8, cy - 11, 3.5);
  g.fillCircle(cx, cy - 14, 4);
  g.fillCircle(cx + 8, cy - 11, 3.5);
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(cx - 8, cy - 12, 2.5);
  g.fillCircle(cx, cy - 15, 3);
  g.fillCircle(cx + 8, cy - 12, 2.5);
  g.fillStyle(0xeeeeee, 0.3);
  g.fillCircle(cx + 3, cy - 18, 2);

  // Grease-spatter warning glow
  g.fillStyle(0xff6600, 0.25);
  g.fillCircle(cx, cy + 3, 22);

  g.generateTexture('deep_fryer', s, s);
  g.destroy();
}
