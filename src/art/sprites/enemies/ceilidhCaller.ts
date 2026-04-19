/**
 * `ceilidh_caller` — academic apparition who counts the dances in from beyond — gown, mortarboard, baton raised mid-call.
 */

import Phaser from 'phaser';

export function bakeCeilidhCaller(scene: Phaser.Scene): void {
  const s = 42;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // Soft ghostly halo.
  g.fillStyle(0xb090d0, 0.2);
  g.fillEllipse(cx, cy, 22, 24);
  g.fillStyle(0xb090d0, 0.1);
  g.fillEllipse(cx, cy, 28, 30);

  // Long robes — flared to suggest mid-twirl.
  g.fillStyle(0x2a1a48, 0.9);
  g.fillTriangle(cx - 9, cy + 14, cx + 9, cy + 14, cx + 4, cy - 2);
  g.fillTriangle(cx - 9, cy + 14, cx - 4, cy - 2, cx + 4, cy - 2);
  g.fillStyle(0x4a3068, 1);
  g.fillTriangle(cx - 7, cy + 13, cx + 7, cy + 13, cx + 3, cy - 1);
  g.fillTriangle(cx - 7, cy + 13, cx - 3, cy - 1, cx + 3, cy - 1);
  // Robe swirl highlight — lavender stripe on one side.
  g.fillStyle(0x9070b0, 0.5);
  g.fillTriangle(cx - 6, cy + 11, cx - 2, cy, cx - 5, cy + 2);

  // Belt / sash.
  g.fillStyle(0xffd080, 0.85);
  g.fillRect(cx - 7, cy + 1, 14, 1);

  // Torso.
  g.fillStyle(0x3a2055, 1);
  g.fillEllipse(cx, cy - 3, 10, 8);

  // Head — pale, narrow.
  g.fillStyle(0xe0c8e8, 0.95);
  g.fillEllipse(cx, cy - 10, 7, 8);

  // Eyes — half-lidded (dance focus).
  g.fillStyle(0x2a1048, 1);
  g.fillRect(cx - 2, cy - 10, 1, 1);
  g.fillRect(cx + 1, cy - 10, 1, 1);

  // Hair — long, dark, tied back.
  g.fillStyle(0x1a0a28, 1);
  g.fillEllipse(cx, cy - 13, 6, 3);

  // One arm raised overhead (the "call").
  g.fillStyle(0x3a2055, 1);
  g.fillRect(cx + 4, cy - 12, 2, 8);
  // Hand pinprick.
  g.fillStyle(0xe0c8e8, 1);
  g.fillCircle(cx + 5, cy - 13, 1);

  // Other arm curved in front (dance pose).
  g.fillStyle(0x3a2055, 1);
  g.fillRect(cx - 7, cy - 3, 2, 6);
  g.fillStyle(0xe0c8e8, 1);
  g.fillCircle(cx - 8, cy + 1, 1);

  // Sparkle dots — suggests the "calling" music.
  g.fillStyle(0xffd0e0, 0.8);
  g.fillCircle(cx + 8, cy - 13, 0.6);
  g.fillStyle(0xffd0e0, 0.5);
  g.fillCircle(cx + 11, cy - 10, 0.5);
  g.fillStyle(0xffd0e0, 0.3);
  g.fillCircle(cx + 13, cy - 13, 0.4);

  g.generateTexture('ceilidh_caller', s, s);
  g.destroy();
}

/**
 * Tome Wraith — DESIGN_IDEAS section 3 Academic #2. Floating open
 * book with torn pages orbiting the volume; a faint ghostly face
 * rises between the pages. "Scroll-unfurl telegraph" lives in the
 * visual — the existing `ranged` AI carries the projectile cadence.
 */
