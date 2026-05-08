import * as Phaser from 'phaser';

/**
 * `wicon_scotch_mist` — poisonous cloud icon. Design pivot (v2):
 * old icon had the skull face buried inside a bulbous cloud that
 * dominated over the death-tell. New pitch — SKULL IS THE THING.
 * Bigger bone-white skull dominates the centre (radius 7 up from
 * 5), with mist wisps framing the corners and horizontal drift
 * tendrils selling "hanging poisonous mist" behind the skull. The
 * green toxic tint stays but now supports the skull, not buries it.
 */
export function drawScotchMistIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── Outer toxic halo — sickly green glow. ──
  g.fillStyle(0x4a7a4a, 0.22);
  g.fillCircle(cx, cy, 14);
  g.fillStyle(0x5a8a5a, 0.15);
  g.fillCircle(cx, cy, 16);

  // ── MIST WISPS FRAMING THE SKULL — smaller clumps at the four
  // corners so the skull centre dominates. ──
  g.fillStyle(0x3a5a50, 0.85);
  g.fillCircle(cx - 10, cy - 6, 4);
  g.fillCircle(cx + 10, cy - 6, 4);
  g.fillCircle(cx - 9, cy + 8, 4);
  g.fillCircle(cx + 9, cy + 8, 4);
  g.fillStyle(0x4a7a6a, 0.85);
  g.fillCircle(cx - 9, cy - 5, 3.5);
  g.fillCircle(cx + 9, cy - 5, 3.5);
  g.fillCircle(cx - 8, cy + 7, 3.5);
  g.fillCircle(cx + 8, cy + 7, 3.5);
  g.fillStyle(0x6a9a8a, 0.8);
  g.fillCircle(cx - 8, cy - 5, 2.5);
  g.fillCircle(cx + 8, cy - 5, 2.5);
  g.fillCircle(cx - 7, cy + 7, 2.5);
  g.fillCircle(cx + 7, cy + 7, 2.5);

  // ── HORIZONTAL DRIFT TENDRILS behind the skull — sells the
  // "hanging mist" mood without competing with the skull. ──
  g.fillStyle(0x5a8a7a, 0.65);
  g.fillRect(cx - 12, cy - 4, 24, 1);
  g.fillStyle(0x6a9a8a, 0.55);
  g.fillRect(cx - 13, cy + 5, 26, 1);
  g.fillStyle(0x8abaaa, 0.5);
  g.fillRect(cx - 14, cy, 28, 0.8);

  // ── BIG SKULL FACE — the lethal anchor. Bone-pale, now large
  // enough to dominate the icon. ──
  g.fillStyle(0x0a1a14, 1);
  g.fillCircle(cx, cy - 1, 8);
  g.fillStyle(0xd0dcc8, 1);
  g.fillCircle(cx, cy - 1, 7);
  g.fillStyle(0xe8f0dc, 1);
  g.fillCircle(cx - 1, cy - 2, 6);
  // Jaw taper
  g.fillStyle(0xc0ccb8, 1);
  g.fillRect(cx - 3, cy + 5, 6, 2.5);
  g.fillStyle(0xd0dcc8, 1);
  g.fillRect(cx - 2.5, cy + 5, 5, 2);
  // Cranium ridge shading
  g.fillStyle(0xb0bca8, 0.7);
  g.fillRect(cx - 5, cy - 7, 10, 1.5);

  // ── HOLLOW EYE SOCKETS — bigger dark ovals with sharper rim,
  // brighter toxic green core, and a hot pinprick. The kill-tell
  // had to read at 32px so dimensions bumped 3.5×3 → 4.4×3.6. ──
  // Outer rim of the socket (deep pit).
  g.fillStyle(0x000000, 1);
  g.fillEllipse(cx - 2.8, cy - 1.5, 4.4, 3.6);
  g.fillEllipse(cx + 2.8, cy - 1.5, 4.4, 3.6);
  g.fillStyle(0x0a1a10, 1);
  g.fillEllipse(cx - 2.8, cy - 1.5, 3.6, 2.9);
  g.fillEllipse(cx + 2.8, cy - 1.5, 3.6, 2.9);
  // Toxic green glow — punchier alpha + larger radius.
  g.fillStyle(0x50dd70, 0.55);
  g.fillCircle(cx - 2.8, cy - 1.5, 2.0);
  g.fillCircle(cx + 2.8, cy - 1.5, 2.0);
  g.fillStyle(0x70ee90, 1);
  g.fillCircle(cx - 2.8, cy - 1.5, 1.4);
  g.fillCircle(cx + 2.8, cy - 1.5, 1.4);
  g.fillStyle(0xc0ffe0, 1);
  g.fillCircle(cx - 2.8, cy - 1.7, 0.7);
  g.fillCircle(cx + 2.8, cy - 1.7, 0.7);
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(cx - 3.0, cy - 1.9, 0.4, 0.4);
  g.fillRect(cx + 2.6, cy - 1.9, 0.4, 0.4);

  // ── Nose gap — dark triangle hole. ──
  g.fillStyle(0x0a1a10, 1);
  g.fillTriangle(cx, cy + 1.5, cx - 1.2, cy + 3.5, cx + 1.2, cy + 3.5);

  // ── Grinning teeth — 5 white rectangles along the jaw. ──
  g.fillStyle(0xf4f8e8, 1);
  g.fillRect(cx - 3, cy + 5, 0.9, 1.5);
  g.fillRect(cx - 1.7, cy + 5, 0.9, 1.5);
  g.fillRect(cx - 0.4, cy + 5, 0.9, 1.5);
  g.fillRect(cx + 0.9, cy + 5, 0.9, 1.5);
  g.fillRect(cx + 2.2, cy + 5, 0.9, 1.5);
  // Tooth gap shadows
  g.fillStyle(0x1a2a1a, 0.6);
  g.fillRect(cx - 2.1, cy + 5, 0.4, 1.5);
  g.fillRect(cx - 0.8, cy + 5, 0.4, 1.5);
  g.fillRect(cx + 0.5, cy + 5, 0.4, 1.5);
  g.fillRect(cx + 1.8, cy + 5, 0.4, 1.5);

  // ── Toxic fume wisps rising from the top of the skull. ──
  g.fillStyle(0x88c8a0, 0.7);
  g.fillCircle(cx - 3, cy - 12, 1.2);
  g.fillCircle(cx + 3, cy - 13, 1);
  g.fillStyle(0xa0d8b8, 0.5);
  g.fillCircle(cx, cy - 15, 0.8);

  g.generateTexture('wicon_scotch_mist', s, s);
  g.destroy();
}
