import Phaser from 'phaser';

export function bakeKelpieFoal(scene: Phaser.Scene): void {
  const s = 36;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // Soft under-glow — water-spirit aura.
  g.fillStyle(0x4a8ab0, 0.2);
  g.fillEllipse(cx, cy + 2, 26, 20);

  // Body — compact, slightly rounder than adult.
  g.fillStyle(0x1a3348, 1);
  g.fillEllipse(cx, cy + 3, 18, 10);
  g.fillStyle(0x2e5070, 1);
  g.fillEllipse(cx, cy + 2, 15, 8);
  // Dappled lighter highlights — wet-coat feel.
  g.fillStyle(0x6fa0c0, 0.6);
  g.fillEllipse(cx - 3, cy, 5, 3);
  g.fillEllipse(cx + 4, cy + 1, 4, 2);

  // Legs — 4 thin ones, pale at hooves.
  g.fillStyle(0x1a3348, 1);
  g.fillRect(cx - 7, cy + 7, 2, 6);
  g.fillRect(cx - 2, cy + 8, 2, 5);
  g.fillRect(cx + 2, cy + 8, 2, 5);
  g.fillRect(cx + 6, cy + 7, 2, 6);
  g.fillStyle(0xa0c8e0, 0.8);
  g.fillRect(cx - 7, cy + 12, 2, 1);
  g.fillRect(cx + 6, cy + 12, 2, 1);

  // Head.
  g.fillStyle(0x1a3348, 1);
  g.fillEllipse(cx + 8, cy - 2, 7, 6);
  g.fillStyle(0x2e5070, 1);
  g.fillEllipse(cx + 8, cy - 3, 6, 4);

  // Eye — luminous cyan.
  g.fillStyle(0x8fe0ff, 1);
  g.fillCircle(cx + 10, cy - 3, 1);

  // Ears — tiny, water-pointed.
  g.fillStyle(0x1a3348, 1);
  g.fillTriangle(cx + 6, cy - 6, cx + 8, cy - 8, cx + 8, cy - 5);
  g.fillTriangle(cx + 10, cy - 6, cx + 12, cy - 8, cx + 10, cy - 5);

  // Mane — dripping water strands on neck.
  g.fillStyle(0x6fa0c0, 0.8);
  g.fillRect(cx + 3, cy - 4, 1, 5);
  g.fillRect(cx + 5, cy - 5, 1, 6);
  g.fillStyle(0xa0c8e0, 0.7);
  g.fillRect(cx + 4, cy - 4, 1, 4);
  // Drips below.
  g.fillStyle(0x8fd0f0, 0.6);
  g.fillCircle(cx + 3, cy + 2, 0.8);
  g.fillCircle(cx + 6, cy + 3, 0.6);

  // Tail — wispy water tail.
  g.fillStyle(0x4a8ab0, 0.7);
  g.fillTriangle(cx - 8, cy + 2, cx - 13, cy + 1, cx - 9, cy + 6);

  g.generateTexture('kelpie_foal', s, s);
  g.destroy();
}

/**
 * Blue Man of the Minch — DESIGN_IDEAS section 3 Cryptids #3.
 * Hebridean ocean spirit; slow ranged enemy that lobs a kenning
 * projectile. Visual pitch: waist-up humanoid torso rising out of
 * dripping water, deep indigo skin, pale-green eyes.
 */
