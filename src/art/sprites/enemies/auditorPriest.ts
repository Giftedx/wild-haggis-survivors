import Phaser from 'phaser';

export function bakeAuditorPriest(scene: Phaser.Scene): void {
  const s = 42;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // Ghostly aura — muted gold (censer glow bleeding out).
  g.fillStyle(0xffc840, 0.15);
  g.fillEllipse(cx, cy, 24, 28);

  // Floor-length cassock — charcoal wool.
  g.fillStyle(0x1a1820, 0.95);
  g.fillTriangle(cx - 10, cy + 16, cx + 10, cy + 16, cx + 3, cy - 4);
  g.fillTriangle(cx - 10, cy + 16, cx - 3, cy - 4, cx + 3, cy - 4);
  g.fillStyle(0x3a3540, 1);
  g.fillTriangle(cx - 8, cy + 15, cx + 8, cy + 15, cx + 2, cy - 3);
  g.fillTriangle(cx - 8, cy + 15, cx - 2, cy - 3, cx + 2, cy - 3);

  // Gold trim hem — thin line across the robe bottom.
  g.fillStyle(0xffc840, 0.8);
  g.fillRect(cx - 8, cy + 14, 16, 1);

  // Cowl shoulders — slight hunch forward.
  g.fillStyle(0x2a252f, 1);
  g.fillEllipse(cx, cy - 5, 12, 7);

  // Head — pale, hood-framed.
  g.fillStyle(0xddd4ba, 0.95);
  g.fillEllipse(cx, cy - 10, 7, 9);

  // Hood shadow over eyes.
  g.fillStyle(0x1a1820, 0.85);
  g.fillEllipse(cx, cy - 12, 8, 4);

  // Slit eyes glowing beneath the hood.
  g.fillStyle(0xffc840, 1);
  g.fillRect(cx - 2, cy - 11, 1, 1);
  g.fillRect(cx + 1, cy - 11, 1, 1);

  // Thin gaunt mouth line.
  g.fillStyle(0x1a1010, 1);
  g.fillRect(cx - 2, cy - 8, 4, 1);

  // Left hand clutching a small black book with gold clasp.
  g.fillStyle(0x1a1010, 1);
  g.fillRect(cx - 11, cy - 2, 5, 6);
  g.fillStyle(0xffc840, 1);
  g.fillRect(cx - 11, cy, 5, 1);
  g.fillRect(cx - 9, cy - 2, 1, 6);

  // Right hand raised holding the staff.
  g.fillStyle(0xddd4ba, 1);
  g.fillCircle(cx + 7, cy - 4, 1);

  // The staff — long dark shaft rising past the head.
  g.fillStyle(0x2a1a10, 1);
  g.fillRect(cx + 7, cy - 16, 1, 14);

  // Censer at the staff tip — glowing gold bead with bright core.
  g.fillStyle(0xffc840, 0.9);
  g.fillCircle(cx + 8, cy - 17, 3);
  g.fillStyle(0xfff0a0, 1);
  g.fillCircle(cx + 8, cy - 17, 1.5);
  g.fillStyle(0xfff8c8, 0.7);
  g.fillCircle(cx + 8, cy - 17, 0.7);
  // Wisps of smoke above the censer.
  g.fillStyle(0xddd0a0, 0.3);
  g.fillCircle(cx + 8, cy - 20, 1);
  g.fillStyle(0xddd0a0, 0.18);
  g.fillCircle(cx + 7, cy - 22, 0.8);

  g.generateTexture('auditor_priest', s, s);
  g.destroy();
}


