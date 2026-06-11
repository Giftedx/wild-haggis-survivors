/**
 * `chest` — fallback treasure chest (the variants.ts hearth/fey/
 * legendary chests are the primary; this is the last-ditch baked
 * texture if a variant key is unavailable).
 *
 * Rewrite pass (lift from 6 → target 9):
 *  - Canvas bumped 32 → 36 so the lid arch and halo have room to
 *    breathe without compressing detail.
 *  - Lid layered: dark rim arc + warm wood arc + two highlight
 *    ellipses + a chip-of-paint at the rear corner so it reads as
 *    a 3D object, not a stamped flat ellipse.
 *  - Cross-hatch tartan band (red weft + green warp + gold accent)
 *    replaces the thin horizontal stripes.
 *  - Soft warm halo behind the silhouette so it pops against any
 *    biome ground.
 *  - Lock decorated with a tiny embossed thistle motif — sells the
 *    Scottish identity even on the base chest.
 *  - Leather strap accent + studded rivet rhythm so the metalwork
 *    feels deliberate, not decorative noise.
 */

import * as Phaser from 'phaser';

const HALO = 0xffc840;
const WOOD_OUTLINE = 0x1c0c04;
const WOOD_DARK = 0x4a2c08;
const WOOD_BASE = 0x7a4810;
const WOOD_MID = 0x9a6418;
const WOOD_HI = 0xb88420;
const WOOD_GRAIN = 0x36200a;
const STRAP_DARK = 0x2a1404;
const STRAP_MID = 0x5a2c08;
const STRAP_HI = 0x804018;
const METAL_DARK = 0x4a3a00;
const METAL_MID = 0xa88820;
const METAL_HI = 0xeacc70;
const TARTAN_RED = 0xc02828;
const TARTAN_RED_HI = 0xff4848;
const TARTAN_GREEN = 0x186830;
const TARTAN_GREEN_HI = 0x4a9a52;
const TARTAN_GOLD = 0xefc060;
const LOCK_DEEP = 0x2a1c00;
const LOCK_GOLD = 0xefc842;
const LOCK_HOT = 0xfff0a8;
const THISTLE_PURPLE = 0x6a28a8;

export function bakeChest(scene: Phaser.Scene): void {
  const s = 36;
  const g = scene.add.graphics();
  const cx = s / 2;
  const cy = s / 2 + 1;

  // ── Soft warm halo so the chest pops against any biome floor ──
  g.fillStyle(HALO, 0.16);
  g.fillCircle(cx, cy + 1, 18);
  g.fillStyle(HALO, 0.22);
  g.fillCircle(cx, cy + 1, 13);

  // ── Contact shadow ──
  g.fillStyle(0x000000, 0.42);
  g.fillEllipse(cx, cy + 14, 24, 3);

  // ── Body silhouette outline ──
  g.fillStyle(WOOD_OUTLINE, 1);
  g.fillRect(cx - 15, cy - 4, 30, 17);
  // Base body fill.
  g.fillStyle(WOOD_BASE, 1);
  g.fillRect(cx - 14, cy - 3, 28, 15);
  // Body highlight strip — top-of-front-face catch-light.
  g.fillStyle(WOOD_MID, 1);
  g.fillRect(cx - 14, cy - 3, 28, 3);
  // Wood grain — three faint horizontal lines.
  g.fillStyle(WOOD_GRAIN, 0.7);
  g.fillRect(cx - 13, cy + 3, 26, 0.6);
  g.fillRect(cx - 13, cy + 6, 26, 0.6);
  g.fillRect(cx - 13, cy + 9, 26, 0.6);
  // Vertical grain whorl on the front face.
  g.fillStyle(WOOD_DARK, 0.7);
  g.fillRect(cx - 9, cy + 1, 0.5, 10);
  g.fillRect(cx + 6, cy + 2, 0.5, 9);

  // ── Arched lid — five-stack so it has volume ──
  // Outer dark rim arc.
  g.fillStyle(WOOD_OUTLINE, 1);
  g.fillEllipse(cx, cy - 4, 30, 11);
  // Mid-tone wood layer.
  g.fillStyle(WOOD_DARK, 1);
  g.fillEllipse(cx, cy - 4, 28, 9);
  // Body wood layer.
  g.fillStyle(WOOD_BASE, 1);
  g.fillEllipse(cx, cy - 4, 26, 7.5);
  // Top of the arch — bright catch-light.
  g.fillStyle(WOOD_MID, 1);
  g.fillEllipse(cx - 1, cy - 5, 22, 5);
  // Brightest sliver across the arch peak.
  g.fillStyle(WOOD_HI, 0.95);
  g.fillEllipse(cx - 2, cy - 6, 16, 2.4);
  // Specular pinprick.
  g.fillStyle(0xffffff, 0.7);
  g.fillRect(cx - 4, cy - 7, 3, 0.8);
  // Rear corner chip — a small dark notch where age has worn away
  // the wood. Adds character without compromising the silhouette.
  g.fillStyle(WOOD_OUTLINE, 1);
  g.fillRect(cx + 12, cy - 6, 1.6, 1.4);
  g.fillStyle(WOOD_DARK, 1);
  g.fillRect(cx + 12.4, cy - 5.6, 0.8, 0.8);

  // ── Leather strap (vertical centre + horizontal mid-band) ──
  // Vertical strap — wraps over the lid.
  g.fillStyle(STRAP_DARK, 1);
  g.fillRect(cx - 2, cy - 9, 4, 22);
  g.fillStyle(STRAP_MID, 1);
  g.fillRect(cx - 1.5, cy - 8.5, 3, 21);
  g.fillStyle(STRAP_HI, 0.85);
  g.fillRect(cx - 1.4, cy - 8.5, 0.6, 21);
  // Horizontal strap — thicker than before for visual weight.
  g.fillStyle(STRAP_DARK, 1);
  g.fillRect(cx - 15, cy - 1, 30, 4);
  g.fillStyle(STRAP_MID, 1);
  g.fillRect(cx - 15, cy - 0.5, 30, 3);
  g.fillStyle(STRAP_HI, 0.85);
  g.fillRect(cx - 15, cy - 0.4, 30, 0.6);

  // ── Tartan band woven INTO the strap (red-green-gold sett) ──
  // Red weft (horizontal).
  g.fillStyle(TARTAN_RED, 0.95);
  g.fillRect(cx - 15, cy + 0.4, 30, 1);
  g.fillStyle(TARTAN_RED_HI, 0.85);
  g.fillRect(cx - 15, cy + 0.4, 30, 0.4);
  // Green band underneath.
  g.fillStyle(TARTAN_GREEN, 0.95);
  g.fillRect(cx - 15, cy + 1.7, 30, 0.7);
  g.fillStyle(TARTAN_GREEN_HI, 0.85);
  g.fillRect(cx - 15, cy + 1.7, 30, 0.3);
  // Gold pinstripes (vertical warp) — three accents.
  g.fillStyle(TARTAN_GOLD, 0.9);
  g.fillRect(cx - 10, cy - 0.8, 0.8, 4);
  g.fillRect(cx, cy - 0.8, 0.8, 4);
  g.fillRect(cx + 9, cy - 0.8, 0.8, 4);

  // ── Brass corner brackets (top-left + top-right) ──
  for (const sx of [-1, 1] as const) {
    g.fillStyle(METAL_DARK, 1);
    g.fillRect(cx + sx * 13.4 - 1.4, cy - 4, 2.8, 2.8);
    g.fillStyle(METAL_MID, 1);
    g.fillRect(cx + sx * 13.4 - 1, cy - 3.6, 2, 2);
    g.fillStyle(METAL_HI, 0.95);
    g.fillRect(cx + sx * 13.4 - 1, cy - 3.6, 1, 0.6);
  }

  // ── Rivet rhythm — five along the horizontal strap ──
  for (const dx of [-12, -7, 0, 7, 12] as const) {
    g.fillStyle(METAL_DARK, 1);
    g.fillCircle(cx + dx, cy + 1, 1.1);
    g.fillStyle(METAL_MID, 1);
    g.fillCircle(cx + dx, cy + 1, 0.8);
    g.fillStyle(METAL_HI, 0.95);
    g.fillCircle(cx + dx - 0.3, cy + 0.7, 0.35);
  }
  // Rivets on the lid corners.
  for (const sx of [-1, 1] as const) {
    g.fillStyle(METAL_DARK, 1);
    g.fillCircle(cx + sx * 11, cy - 5, 0.8);
    g.fillStyle(METAL_HI, 1);
    g.fillCircle(cx + sx * 11 - 0.2, cy - 5.2, 0.35);
  }

  // ── Lock plate ──
  // Plate (square brass shield).
  g.fillStyle(LOCK_DEEP, 1);
  g.fillRect(cx - 4, cy + 3, 8, 8);
  g.fillStyle(METAL_DARK, 1);
  g.fillRect(cx - 3.6, cy + 3.4, 7.2, 7.2);
  g.fillStyle(LOCK_GOLD, 1);
  g.fillRect(cx - 3, cy + 4, 6, 6);
  g.fillStyle(LOCK_HOT, 0.95);
  g.fillRect(cx - 3, cy + 4, 6, 1.4);
  // Embossed thistle stamp on the plate — three dots in a triangle
  // for the bloom, two flanking arcs for the leaves. Tiny but
  // unmistakable at 36px.
  g.fillStyle(THISTLE_PURPLE, 0.95);
  g.fillCircle(cx - 1.4, cy + 6.4, 0.6);
  g.fillCircle(cx, cy + 5.8, 0.7);
  g.fillCircle(cx + 1.4, cy + 6.4, 0.6);
  g.fillStyle(0x4a8a30, 0.9);
  g.fillRect(cx - 0.3, cy + 7.2, 0.6, 1.2);
  g.fillStyle(LOCK_DEEP, 1);
  g.fillRect(cx - 0.5, cy + 8.4, 1, 1.6);
  // Keyhole.
  g.fillStyle(LOCK_DEEP, 1);
  g.fillCircle(cx, cy + 9.4, 0.7);
  g.fillRect(cx - 0.25, cy + 9.4, 0.5, 1.4);
  // Specular pop on the upper-left corner of the plate.
  g.fillStyle(0xffffff, 0.7);
  g.fillRect(cx - 2.6, cy + 4.2, 0.8, 0.5);

  g.generateTexture('chest', s, s);
  g.destroy();
}
