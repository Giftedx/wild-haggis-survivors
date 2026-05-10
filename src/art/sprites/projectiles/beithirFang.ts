/**
 * `beithir_fang` projectile — venom fang fired by the Beithir
 * (Race the Beithir mechanic, DESIGN_IDEAS §1).
 *
 * Colorblind-distinct silhouette: a sharp asymmetric fang shape
 * (bulbous root, narrow tip) instead of the round net circle. Even
 * at deuteranopia/protanopia where rust-bronze and forest-green
 * desaturate close together, the *shape* keeps fang and net
 * unmistakably different — fang reads as a directional threat,
 * net reads as a held area-denial.
 *
 * 14×8 sprite, fang points along +X axis at unrotated origin so the
 * caller can `setRotation(velocityAngle)` to align the visual with
 * travel direction. Hitbox stays a radius-4 circle anchored at
 * sprite centre — same physics as the prior `add.circle(r=4)` so
 * collision and the parry hook are unchanged.
 *
 * Layered fill: cream-ivory outline (high luminance contrast on any
 * biome palette), rust-bronze inner body (matches the Beithir's
 * scale-glint accent so fang reads as *its* venom), warm-ivory spine
 * glint, and a single bilious-green venom bead at the apex. The
 * bead is small enough to read as a wet drop and the only
 * non-warm-palette element on the sprite — semantically signposts
 * "this is venom" without depending on red/green colour pairing.
 */

import * as Phaser from 'phaser';

export function bakeBeithirFang(scene: Phaser.Scene): void {
  const W = 14;
  const H = 8;
  const g = scene.add.graphics();
  const cy = H / 2;
  const tipX = W - 1;

  // Cream outer outline — full fang silhouette one pixel wider than
  // the inner fill on every edge. Establishes the high-luminance
  // border that lifts the fang off any biome tint.
  g.fillStyle(0xede1c5, 1);
  g.fillTriangle(0, 0, 0, H, tipX, cy);
  g.fillRect(0, 0, 3, H);

  // Rust-bronze inner body (matches Beithir scale-glint accent).
  g.fillStyle(0xb88a4a, 1);
  g.fillTriangle(1, 1, 1, H - 1, tipX - 1, cy);
  g.fillRect(1, 1, 2, H - 2);

  // Darker bronze underside — gives the fang a "lit from above"
  // read so it doesn't flatten into a single colour mass.
  g.fillStyle(0x8a6230, 1);
  g.fillTriangle(2, cy + 0.5, 2, H - 1, tipX - 2, cy + 0.5);

  // Warm-ivory spine glint along the upper midline — single bright
  // streak that sells the fang as polished bone, not a soft blob.
  g.fillStyle(0xffd28e, 1);
  g.fillTriangle(2, cy - 1, 2, cy, tipX - 2, cy);

  // Bilious venom bead at the apex — bright pale-green drop, the
  // only cool-palette element on the sprite. Reads as wet poison
  // without needing red/green colour discrimination.
  g.fillStyle(0x9bff5e, 1);
  g.fillRect(tipX - 1, cy - 1, 1, 2);
  g.fillStyle(0xeaffce, 1);
  g.fillRect(tipX, cy, 1, 1);

  g.generateTexture('beithir_fang', W, H);
  g.destroy();
}
