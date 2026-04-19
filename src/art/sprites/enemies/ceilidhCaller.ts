/**
 * `ceilidh_caller` — academic apparition who calls the dance from
 * beyond. Design pivot: the CALLING POSE must dominate — one arm
 * raised HIGH overhead with a visible baton, body leaning in mid-spin,
 * robes flared wide to show motion. A burst of music-note sparkles
 * radiates from the baton tip. Dropped the subtle hand pinprick (it
 * vanished at gameplay scale) for a bold forearm + baton silhouette.
 */

import Phaser from 'phaser';

export function bakeCeilidhCaller(scene: Phaser.Scene): void {
  const s = 42;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // ── Soft violet halo. ──
  g.fillStyle(0xb090d0, 0.2);
  g.fillEllipse(cx, cy, 24, 26);
  g.fillStyle(0xb090d0, 0.1);
  g.fillEllipse(cx, cy, 30, 32);

  // ── Long robes — flared WIDE to show mid-spin motion. Asymmetric
  // so one side sweeps further than the other. ──
  g.fillStyle(0x2a1a48, 0.9);
  g.fillTriangle(cx - 12, cy + 14, cx + 10, cy + 14, cx + 4, cy - 1);
  g.fillTriangle(cx - 12, cy + 14, cx - 4, cy - 1, cx + 4, cy - 1);
  g.fillStyle(0x4a3068, 1);
  g.fillTriangle(cx - 10, cy + 13, cx + 9, cy + 13, cx + 3, cy);
  g.fillTriangle(cx - 10, cy + 13, cx - 3, cy, cx + 3, cy);
  // Swirl highlight — bright lavender streak on the leading edge
  g.fillStyle(0x9878c8, 0.7);
  g.fillTriangle(cx - 11, cy + 12, cx - 4, cy + 3, cx - 7, cy + 8);
  g.fillStyle(0xb890d8, 0.5);
  g.fillTriangle(cx - 8, cy + 10, cx - 3, cy + 4, cx - 5, cy + 7);

  // ── Gold sash at the waist — brighter to pop at small scale. ──
  g.fillStyle(0xffd080, 1);
  g.fillRect(cx - 8, cy + 1, 16, 1.5);
  g.fillStyle(0xffeca0, 0.85);
  g.fillRect(cx - 8, cy + 1, 16, 0.5);

  // ── Torso — leaning slightly to suggest spin. ──
  g.fillStyle(0x3a2055, 1);
  g.fillEllipse(cx, cy - 3, 11, 8);
  g.fillStyle(0x4e3070, 0.8);
  g.fillEllipse(cx - 1, cy - 4, 8, 6);

  // ── Head — pale, slightly larger than before. ──
  g.fillStyle(0xe0c8e8, 0.95);
  g.fillEllipse(cx, cy - 10, 7, 8);
  // Hair — dark, pulled back into a bun
  g.fillStyle(0x1a0a28, 1);
  g.fillEllipse(cx, cy - 14, 6, 3);
  g.fillCircle(cx + 4, cy - 13, 1.5);
  // Hair fringe detail
  g.fillStyle(0x2a1a3a, 1);
  g.fillRect(cx - 3, cy - 12, 6, 1);

  // ── Eyes — alert, commanding. ──
  g.fillStyle(0x1a0a28, 1);
  g.fillRect(cx - 2, cy - 10, 1.5, 1);
  g.fillRect(cx + 0.5, cy - 10, 1.5, 1);
  // Eye glint — violet pinprick
  g.fillStyle(0xccaadd, 1);
  g.fillRect(cx - 1.5, cy - 10, 0.5, 0.5);
  g.fillRect(cx + 1, cy - 10, 0.5, 0.5);
  // Open-mouth (mid-call)
  g.fillStyle(0x2a1048, 1);
  g.fillRect(cx - 1, cy - 6, 3, 1.5);

  // ── RAISED ARM — bold forearm going up-right, ending in a fist
  // gripping a BATON held high overhead. This is the signature
  // pose and must dominate. ──
  // Shoulder
  g.fillStyle(0x3a2055, 1);
  g.fillRect(cx + 3, cy - 5, 3, 2);
  // Upper arm — angled up-right
  g.fillStyle(0x3a2055, 1);
  g.fillRect(cx + 4, cy - 9, 3, 4);
  g.fillStyle(0x4e3070, 1);
  g.fillRect(cx + 4, cy - 9, 2, 3);
  // Forearm — angled further up-right
  g.fillRect(cx + 6, cy - 13, 3, 4);
  g.fillStyle(0x3a2055, 1);
  g.fillRect(cx + 6, cy - 13, 3, 4);
  g.fillStyle(0x4e3070, 1);
  g.fillRect(cx + 6, cy - 13, 2, 3);
  // Hand / fist
  g.fillStyle(0xe0c8e8, 1);
  g.fillCircle(cx + 8, cy - 13, 1.5);

  // ── BATON — white polished conductor's baton angled up and to
  // the right from the fist. Prominent silhouette anchor. ──
  g.fillStyle(0x4a3820, 1);
  g.fillRect(cx + 8, cy - 18, 2, 5);
  g.fillStyle(0xf8eed0, 1);
  g.fillRect(cx + 8.5, cy - 19, 1.2, 6);
  // Baton tip bulb
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx + 9, cy - 19, 1);
  g.fillStyle(0xffee88, 0.8);
  g.fillCircle(cx + 9, cy - 19, 0.6);

  // ── Opposite arm — curved down and across the body (dance pose). ──
  g.fillStyle(0x3a2055, 1);
  g.fillRect(cx - 7, cy - 3, 2, 6);
  g.fillRect(cx - 8, cy + 2, 3, 3);
  g.fillStyle(0xe0c8e8, 1);
  g.fillCircle(cx - 8, cy + 4, 1.3);

  // ── Music-note sparkles — burst radiating from the baton tip
  // in an arc. Bigger and bolder than before. ──
  g.fillStyle(0xffeeaa, 1);
  g.fillCircle(cx + 11, cy - 17, 1);
  g.fillStyle(0xffd0e0, 0.9);
  g.fillCircle(cx + 13, cy - 14, 0.8);
  g.fillStyle(0xffeeaa, 0.7);
  g.fillCircle(cx + 14, cy - 11, 0.6);
  g.fillStyle(0xffd0e0, 0.5);
  g.fillCircle(cx + 15, cy - 8, 0.5);
  // Four-point star at the baton tip
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx + 11, cy - 19, 0.6, 1.5);
  g.fillRect(cx + 10.4, cy - 18.3, 1.5, 0.6);

  g.generateTexture('ceilidh_caller', s, s);
  g.destroy();
}

/**
 * Tome Wraith — DESIGN_IDEAS section 3 Academic #2. Floating open
 * book with torn pages orbiting the volume; a faint ghostly face
 * rises between the pages. "Scroll-unfurl telegraph" lives in the
 * visual — the existing `ranged` AI carries the projectile cadence.
 */
