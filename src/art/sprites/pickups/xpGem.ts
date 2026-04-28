/**
 * `xp_gem` — the Whisky Drop. A round dollop of amber single-malt with
 * proper liquid refraction, a meniscus cap, a thin gold rim, and a
 * suspended barley corn floating inside. Players see hundreds of these
 * per run; the static texture rotates and breathes via runtime tweens
 * in `XPGem.drop()`, so the sprite only needs to look gorgeous frozen.
 *
 * Whisky-drop language ties XP collection to Scottish hearth canon —
 * it's the warmth-tier reward (per `docs/ART_STYLE_BIBLE.md`'s Hearth
 * palette), not a generic fantasy gem. Magnet tint at 0xffdd44 sits in
 * the same amber band so the tinted state still reads as whisky.
 */

import * as Phaser from 'phaser';

export function bakeXpGem(scene: Phaser.Scene): void {
  // 20×20 — round amber dollop. Center 10,10.
  const s = 20;
  const g = scene.add.graphics();
  const cx = 10, cy = 10;

  // ── Soft outer halo (helps gem pop against green moor / dark biomes)
  g.fillStyle(0xffce4a, 0.10);
  g.fillCircle(cx, cy, 9.5);
  g.fillStyle(0xffce4a, 0.18);
  g.fillCircle(cx, cy, 8.5);

  // ── Ground contact shadow (sells "sitting on the moor")
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, cy + 7, 11, 2);

  // ── Drop silhouette — slight teardrop bias (rounder bottom, narrower
  // top) so it reads as a *liquid* drop, not a marble.
  g.fillStyle(0x3a2208, 1);
  g.fillEllipse(cx, cy + 1, 14, 13);

  // ── Deep amber base (the back of the liquid)
  g.fillStyle(0x6e3d0e, 1);
  g.fillEllipse(cx, cy + 1, 12, 11);

  // ── Mid amber body — the main whisky colour
  g.fillStyle(0xb8741a, 1);
  g.fillEllipse(cx, cy + 1, 10, 9);

  // ── Bright amber upper hemisphere (light from above-left)
  g.fillStyle(0xe8a838, 1);
  g.fillEllipse(cx - 1, cy - 1, 8, 6);

  // ── Hot interior glow (the "fire" inside whisky — makes the drop
  // feel warm rather than just a yellow ball)
  g.fillStyle(0xffd060, 0.85);
  g.fillEllipse(cx - 1, cy - 1, 5, 3);
  g.fillStyle(0xfff0a0, 0.55);
  g.fillEllipse(cx - 1, cy - 2, 3, 2);

  // ── Suspended barley corn — tiny golden seed floating inside the
  // drop. Sells "this is a whisky drop, not a generic gem" without
  // shouting. Two pixels of detail, palette-anchored to the warm band.
  g.fillStyle(0xc9892a, 1);
  g.fillEllipse(cx + 2, cy + 2, 2, 3);
  g.fillStyle(0xf2c46a, 0.9);
  g.fillRect(cx + 2, cy + 1, 0.5, 2);
  // Tiny dark notch on the corn (the seed crease)
  g.fillStyle(0x6e3d0e, 0.75);
  g.fillRect(cx + 1.6, cy + 2, 0.4, 1.5);

  // ── Meniscus rim — bright thin highlight along the upper edge,
  // catching light. This is what sells "liquid surface tension".
  g.lineStyle(1, 0xffe890, 0.95);
  g.beginPath();
  g.arc(cx, cy + 1, 6, Math.PI * 1.15, Math.PI * 1.85);
  g.strokePath();

  // ── Thin gold rim around the whole drop (refraction edge)
  g.lineStyle(0.8, 0xffc448, 0.7);
  g.strokeEllipse(cx, cy + 1, 12, 11);

  // ── Hot specular kiss — upper-left, sells the wet glassy surface
  g.fillStyle(0xffffff, 0.95);
  g.fillEllipse(cx - 2.5, cy - 3, 2.4, 1.6);
  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(cx - 3, cy - 2, 0.7);
  // Secondary tiny glint
  g.fillStyle(0xffffff, 0.45);
  g.fillCircle(cx - 1, cy - 4, 0.5);

  // ── Lower-right back-light bounce (subtle, sells volume)
  g.fillStyle(0xffd478, 0.4);
  g.fillCircle(cx + 3, cy + 3, 1.4);

  // ── Underside dark crescent (reinforces the drop curvature)
  g.fillStyle(0x4a2a0c, 0.55);
  g.fillEllipse(cx, cy + 4, 7, 2);

  // ── Four-point sparkle compass (small, off-rim, so they read as
  // "magic glints" not "diamond facets")
  g.fillStyle(0xfff4c8, 0.85);
  g.fillRect(cx - 0.5, cy - 9, 1, 1.5);     // top sparkle
  g.fillRect(cx + 8.5, cy - 0.5, 1.5, 1);   // right sparkle
  g.fillRect(cx - 0.5, cy + 8, 1, 1);       // bottom (subtle)
  g.fillRect(cx - 9.5, cy - 0.5, 1, 1);     // left (subtle)

  g.generateTexture('xp_gem', s, s);
  g.destroy();
}
