import Phaser from 'phaser';

export function bakeLedgerWraith(scene: Phaser.Scene): void {
  const s = 40;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // Ghostly halo — cold paper-blue.
  g.fillStyle(0x8899aa, 0.18);
  g.fillEllipse(cx, cy, 22, 26);
  g.fillStyle(0x8899aa, 0.1);
  g.fillEllipse(cx, cy, 28, 32);

  // Floor-length robes — ink-stained.
  g.fillStyle(0x1a1a28, 0.9);
  g.fillTriangle(cx - 9, cy + 15, cx + 9, cy + 15, cx + 3, cy - 4);
  g.fillTriangle(cx - 9, cy + 15, cx - 3, cy - 4, cx + 3, cy - 4);
  g.fillStyle(0x2a2a3a, 1);
  g.fillTriangle(cx - 7, cy + 14, cx + 7, cy + 14, cx + 2, cy - 3);
  g.fillTriangle(cx - 7, cy + 14, cx - 2, cy - 3, cx + 2, cy - 3);

  // Torso — boxy, clerkly.
  g.fillStyle(0x20202e, 1);
  g.fillRect(cx - 5, cy - 5, 10, 8);

  // Stamped seal at chest — parchment white.
  g.fillStyle(0xe8ddb0, 0.9);
  g.fillRect(cx - 2, cy - 2, 4, 3);
  g.fillStyle(0xaa2020, 1);
  g.fillRect(cx - 1, cy - 1, 2, 1);

  // Head — pale, gaunt.
  g.fillStyle(0xddd4b0, 0.95);
  g.fillEllipse(cx, cy - 10, 7, 8);

  // Hollow eye sockets — two black pits.
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 2, cy - 11, 1, 2);
  g.fillRect(cx + 1, cy - 11, 1, 2);

  // Thin moustache / dour frown.
  g.fillStyle(0x1a1010, 1);
  g.fillRect(cx - 2, cy - 8, 4, 1);

  // Floating ledger page — parchment with ink ruled lines.
  g.fillStyle(0xe8ddb0, 0.92);
  g.fillRect(cx + 7, cy - 4, 7, 8);
  g.fillStyle(0x1a1a28, 0.8);
  g.fillRect(cx + 8, cy - 3, 5, 1);
  g.fillRect(cx + 8, cy - 1, 5, 1);
  g.fillRect(cx + 8, cy + 1, 5, 1);

  // Quill held in opposite hand — white feather with dark nib.
  g.fillStyle(0xf0e8d0, 1);
  g.fillRect(cx - 10, cy - 7, 1, 6);
  g.fillStyle(0x1a1010, 1);
  g.fillRect(cx - 10, cy - 2, 1, 2);

  // Red-ink drips beneath the page — signature threat beat.
  g.fillStyle(0xaa2020, 1);
  g.fillCircle(cx + 10, cy + 6, 1);
  g.fillStyle(0xaa2020, 0.7);
  g.fillCircle(cx + 13, cy + 8, 0.7);
  g.fillStyle(0xaa2020, 0.45);
  g.fillCircle(cx + 8, cy + 10, 0.5);

  g.generateTexture('ledger_wraith', s, s);
  g.destroy();
}

/**
 * Auditor Priest — DESIGN_IDEAS section 3 Taxman's Retinue #2.
 * Monastic, censer-tipped staff, book in the other hand. The "beam
 * ranged" bullet is deferred pending a beam-weapon class; the priest
 * ships on the existing `ranged` behaviour, its writ-of-audit
 * projectile reads through the sprite — the glowing censer bead at
 * the staff tip carries the threat telegraph.
 */
