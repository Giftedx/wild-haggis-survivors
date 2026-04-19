import Phaser from 'phaser';

export function bakeDeanApparition(scene: Phaser.Scene): void {
  const s = 44;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // Ghostly halo — cold blue-grey.
  g.fillStyle(0x6a7890, 0.18);
  g.fillEllipse(cx, cy, 28, 30);

  // Gown — long formal robe, dark with gold trim at the sleeves.
  g.fillStyle(0x18181c, 1);
  g.fillTriangle(cx - 12, cy + 18, cx + 12, cy + 18, cx + 4, cy - 3);
  g.fillTriangle(cx - 12, cy + 18, cx - 4, cy - 3, cx + 4, cy - 3);
  g.fillStyle(0x2a2a30, 1);
  g.fillTriangle(cx - 10, cy + 17, cx + 10, cy + 17, cx + 3, cy - 2);
  g.fillTriangle(cx - 10, cy + 17, cx - 3, cy - 2, cx + 3, cy - 2);
  // Front panel — formal vertical slit with gold piping.
  g.fillStyle(0x4a3820, 1);
  g.fillRect(cx - 1, cy, 2, 16);
  g.fillStyle(0xc8a040, 0.7);
  g.fillRect(cx - 2, cy, 1, 16);
  g.fillRect(cx + 1, cy, 1, 16);

  // Folded arms across the chest — sleeves end with a gold cuff.
  g.fillStyle(0x1a1a20, 1);
  g.fillRect(cx - 9, cy, 18, 4);
  g.fillStyle(0xc8a040, 0.75);
  g.fillRect(cx - 9, cy, 1, 4);
  g.fillRect(cx + 8, cy, 1, 4);

  // Head — pale, angular.
  g.fillStyle(0xd8c8b8, 0.95);
  g.fillEllipse(cx, cy - 8, 8, 10);

  // Mortarboard — flat cap with tassle trailing.
  g.fillStyle(0x0a0a0e, 1);
  g.fillRect(cx - 8, cy - 13, 16, 2);
  g.fillRect(cx - 5, cy - 15, 10, 2);
  // Tassle — string + bob.
  g.fillStyle(0xc8a040, 1);
  g.fillRect(cx + 6, cy - 13, 1, 4);
  g.fillCircle(cx + 6, cy - 9, 1.3);

  // Face: stern eyebrows + downturned mouth + thick moustache.
  g.fillStyle(0x1a1010, 1);
  g.fillRect(cx - 3, cy - 9, 2, 1);
  g.fillRect(cx + 1, cy - 9, 2, 1);
  // Eyes — beady points.
  g.fillRect(cx - 2, cy - 8, 1, 1);
  g.fillRect(cx + 1, cy - 8, 1, 1);
  // Moustache — drooping bar.
  g.fillStyle(0x2a1010, 1);
  g.fillRect(cx - 3, cy - 5, 6, 1);
  g.fillRect(cx - 4, cy - 4, 1, 1);
  g.fillRect(cx + 3, cy - 4, 1, 1);
  // Mouth — firm line.
  g.fillStyle(0x1a1010, 1);
  g.fillRect(cx - 2, cy - 3, 4, 1);

  g.generateTexture('dean_apparition', s, s);
  g.destroy();
}

/**
 * Ledger Wraith — DESIGN_IDEAS section 3 Taxman's Retinue opener.
 * Translucent auditor silhouette, hollow eyes, trailing ledger pages
 * with red-ink drips. The "immune until Taxman takes damage" bullet
 * is deferred pending an event-bus gate — the wraith reads as a
 * Retinue advance scout on pure sprite language, not a new AI state.
 */
