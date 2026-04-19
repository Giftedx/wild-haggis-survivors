/**
 * `blue_man_of_minch` — Hebridean sea spirit: deep-blue skin, wave-curl hair, salt-crust on the shoulders.
 */

import Phaser from 'phaser';

export function bakeBlueManOfMinch(scene: Phaser.Scene): void {
  const s = 48;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 4;

  // Water pool at the base — he's "rising" from it.
  g.fillStyle(0x0a2238, 0.7);
  g.fillEllipse(cx, cy + 16, 28, 6);
  g.fillStyle(0x1a3d58, 0.5);
  g.fillEllipse(cx, cy + 15, 24, 4);
  // Water ripple suggestion.
  g.fillStyle(0x8fc0e0, 0.4);
  g.fillRect(cx - 10, cy + 14, 20, 1);

  // Waist / torso.
  g.fillStyle(0x0a1a3d, 1);
  g.fillEllipse(cx, cy + 6, 18, 14);
  g.fillStyle(0x1a2f5a, 1);
  g.fillEllipse(cx, cy + 4, 15, 11);
  // Chest sheen.
  g.fillStyle(0x4060a0, 0.5);
  g.fillEllipse(cx - 2, cy + 2, 10, 5);

  // Arms — one raised holding kenning-stone (throwing stance).
  g.fillStyle(0x0a1a3d, 1);
  g.fillRect(cx + 7, cy - 3, 3, 8);
  g.fillRect(cx - 10, cy, 3, 8);
  // Kenning projectile in raised hand — glowing cyan rune-stone.
  g.fillStyle(0x5fc0e0, 0.85);
  g.fillCircle(cx + 12, cy - 5, 2.5);
  g.fillStyle(0x9fe0ff, 1);
  g.fillCircle(cx + 12, cy - 5, 1.3);
  // Projectile glow ring.
  g.fillStyle(0x5fc0e0, 0.3);
  g.fillCircle(cx + 12, cy - 5, 5);

  // Shoulders + neck.
  g.fillStyle(0x0a1a3d, 1);
  g.fillRect(cx - 8, cy - 6, 16, 3);
  g.fillRect(cx - 2, cy - 9, 4, 4);

  // Head — gaunt, angled.
  g.fillStyle(0x0a1a3d, 1);
  g.fillEllipse(cx, cy - 12, 10, 10);
  g.fillStyle(0x1a2f5a, 1);
  g.fillEllipse(cx, cy - 13, 8, 8);

  // Eyes — pale sea-green pinpricks.
  g.fillStyle(0xc8f0a0, 1);
  g.fillCircle(cx - 2, cy - 13, 1);
  g.fillCircle(cx + 2, cy - 13, 1);

  // Beard — wet hair strands hanging off chin.
  g.fillStyle(0x050a18, 0.9);
  g.fillRect(cx - 3, cy - 8, 1, 4);
  g.fillRect(cx, cy - 8, 1, 5);
  g.fillRect(cx + 3, cy - 8, 1, 4);

  // Drips from shoulders.
  g.fillStyle(0x5fc0e0, 0.6);
  g.fillCircle(cx - 9, cy + 4, 0.8);
  g.fillCircle(cx + 8, cy + 4, 0.8);

  g.generateTexture('blue_man_of_minch', s, s);
  g.destroy();
}

/**
 * Haar Wraith — DESIGN_IDEAS section 3 Weather family opener.
 * Pale-grey mist-silhouette; a faint humanoid torso dissolving into
 * drifting fog. Dies fast, but leaves a fog patch that halves the
 * player's pickup radius for a few seconds — magnet-farm pressure,
 * not damage. Visual reads "weather spirit" rather than "enemy".
 */
