/**
 * `unseelie_fiddler` — Dark Court fiddler: black-silver robes, pale face, bow aimed like a knife. Sinister twin to the seelie piper.
 */

import Phaser from 'phaser';

export function bakeUnseelieFiddler(scene: Phaser.Scene): void {
  const s = 40;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // Dark-court aura — cold indigo.
  g.fillStyle(0x2a1a3a, 0.32);
  g.fillCircle(cx, cy, 14);
  g.fillStyle(0x2a1a3a, 0.15);
  g.fillCircle(cx, cy, 18);

  // Body — darker.
  g.fillStyle(0x1a0f28, 1);
  g.fillEllipse(cx, cy + 2, 9, 11);
  g.fillStyle(0x3a2855, 1);
  g.fillEllipse(cx, cy + 1, 7, 9);

  // Head.
  g.fillStyle(0x4a3065, 1);
  g.fillCircle(cx, cy - 5, 3);

  // Eyes — cold blue pinpricks (contrast to Seelie's gold).
  g.fillStyle(0x8fd0f0, 1);
  g.fillCircle(cx - 1, cy - 5, 0.6);
  g.fillCircle(cx + 1, cy - 5, 0.6);

  // Fiddle in hand — dark-wood body, pale string.
  g.fillStyle(0x20101a, 1);
  g.fillRect(cx + 3, cy - 2, 5, 2);
  // Neck + string.
  g.fillStyle(0x8fd0f0, 0.85);
  g.fillRect(cx + 4, cy - 2, 4, 0.5);
  // Bow — angled across.
  g.fillStyle(0x8a6c40, 1);
  g.fillRect(cx + 2, cy - 5, 8, 0.5);

  // Wings — darker and more jagged (unseelie drape).
  g.fillStyle(0x4a2a6a, 0.6);
  g.fillTriangle(cx - 4, cy - 4, cx - 8, cy + 2, cx - 4, cy + 4);
  g.fillTriangle(cx + 4, cy - 4, cx + 8, cy + 2, cx + 4, cy + 4);
  // Wing highlights — violet edge.
  g.fillStyle(0x9f7ac8, 0.5);
  g.fillTriangle(cx - 5, cy - 2, cx - 7, cy + 1, cx - 5, cy + 2);
  g.fillTriangle(cx + 5, cy - 2, cx + 7, cy + 1, cx + 5, cy + 2);

  // Shadow trail — dark pinpricks (pair to Seelie's sparkle).
  g.fillStyle(0x3a2040, 0.8);
  g.fillCircle(cx - 10, cy + 5, 1);
  g.fillStyle(0x3a2040, 0.55);
  g.fillCircle(cx - 13, cy + 2, 0.7);
  g.fillStyle(0x3a2040, 0.3);
  g.fillCircle(cx - 15, cy + 6, 0.5);

  g.generateTexture('unseelie_fiddler', s, s);
  g.destroy();
}

/**
 * Redcap — DESIGN_IDEAS section 3 Faerie #3. Short stocky goblin
 * with a crimson cap "freshly dipped" and an iron pike. Dive
 * behaviour gives the trio a non-orbit silhouette so the two
 * courtiers + the enforcer read as three distinct Faerie beats.
 */
