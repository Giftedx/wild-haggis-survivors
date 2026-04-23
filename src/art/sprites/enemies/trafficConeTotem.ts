/**
 * `traffic_cone_totem` — stack of three traffic cones bound into a
 * hostile cairn. Design pivot (v2): old sprite drew three clean
 * cones stacked = read as "roadside prop pile" with zero threat
 * language. New pitch: the top cone is the HEAD — glowing yellow
 * eye-slits + angry V-brow stare forward. Binding ropes crisscross
 * the middle cone like a totem bound together. Scuffs, dents, and
 * a darker weathered core read "this has been animated and wants
 * a fight". Hazard orange still dominates, but the top-cone face
 * is the kill-target anchor.
 */

import * as Phaser from 'phaser';

export function bakeTrafficConeTotem(scene: Phaser.Scene): void {
  const s = 44;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 4;

  // ── Faint orange menace glow behind the whole totem. ──
  g.fillStyle(0xff4400, 0.18);
  g.fillCircle(cx, cy, 20);

  // ── Grass tufts at the base — the moor is reclaiming it. ──
  g.fillStyle(0x2a5a28, 0.8);
  g.fillRect(cx - 10, cy + 13, 1, 2);
  g.fillRect(cx - 6, cy + 12, 1, 3);
  g.fillRect(cx + 7, cy + 13, 1, 2);
  g.fillStyle(0x3a7a3a, 0.7);
  g.fillRect(cx - 9, cy + 12, 1, 2);
  g.fillRect(cx + 8, cy + 12, 1, 2);

  // ── Lower cone — biggest base. Hazard orange with reflective
  // bands + heavy scuffs + dent-shadows to read "battered". ──
  g.fillStyle(0x5a1e04, 1);  // dark outline
  g.fillTriangle(cx - 11, cy + 12, cx + 11, cy + 12, cx, cy + 2);
  g.fillStyle(0x8a3a08, 1);
  g.fillTriangle(cx - 10, cy + 12, cx + 10, cy + 12, cx, cy + 3);
  g.fillStyle(0xdd5a10, 1);
  g.fillTriangle(cx - 9, cy + 11, cx + 9, cy + 11, cx, cy + 4);
  // Reflective bands — bolder than before
  g.fillStyle(0xffe6cc, 1);
  g.fillRect(cx - 7, cy + 6, 14, 1.2);
  g.fillRect(cx - 6, cy + 9, 12, 1.2);
  // Scuff damage — angular dent-shadows
  g.fillStyle(0x3a1004, 0.85);
  g.fillRect(cx - 5, cy + 8, 3, 1);
  g.fillRect(cx + 2, cy + 10, 3, 1);
  g.fillRect(cx - 6, cy + 11, 2, 0.8);

  // ── Binding ropes — dark cord wraps across the junction between
  // lower and middle cones. "Someone tied this together". ──
  g.fillStyle(0x2a1808, 1);
  g.fillRect(cx - 8, cy + 1.5, 16, 1.2);
  g.fillStyle(0x5a3818, 1);
  g.fillRect(cx - 8, cy + 1.5, 16, 0.4);
  // Knot lumps at each end
  g.fillStyle(0x1a0a04, 1);
  g.fillCircle(cx - 8, cy + 2, 1.2);
  g.fillCircle(cx + 8, cy + 2, 1.2);

  // ── Middle cone. ──
  g.fillStyle(0x5a1e04, 1);
  g.fillTriangle(cx - 7, cy + 1, cx + 7, cy + 1, cx, cy - 7);
  g.fillStyle(0x8a3a08, 1);
  g.fillTriangle(cx - 6.5, cy + 1, cx + 6.5, cy + 1, cx, cy - 6.5);
  g.fillStyle(0xdd5a10, 1);
  g.fillTriangle(cx - 6, cy, cx + 6, cy, cx, cy - 6);
  // Reflective band
  g.fillStyle(0xffe6cc, 1);
  g.fillRect(cx - 5, cy - 3, 10, 1.1);
  // Crack running down the side
  g.fillStyle(0x3a1004, 0.75);
  g.fillRect(cx + 2, cy - 4, 1, 4);

  // ── Tartan binding cord crisscross on middle cone — ties it
  // to the top cone. Red thread visible between cones. ──
  g.fillStyle(0x8a1a1a, 0.9);
  g.fillRect(cx - 5, cy - 6.5, 10, 0.8);
  g.fillStyle(0xdd3a3a, 0.75);
  g.fillRect(cx - 5, cy - 6.5, 10, 0.3);

  // ── TOP CONE — slightly larger than before, this is the HEAD.
  // Tilted forward so the face aims at the player. Darker weathered
  // orange to differentiate from the body cones. ──
  g.fillStyle(0x4a1604, 1);
  g.fillTriangle(cx - 5, cy - 7, cx + 5, cy - 7, cx + 1, cy - 15);
  g.fillStyle(0x7a2a06, 1);
  g.fillTriangle(cx - 4.5, cy - 7, cx + 4.5, cy - 7, cx + 1, cy - 14.5);
  g.fillStyle(0xba4808, 1);
  g.fillTriangle(cx - 4, cy - 7.5, cx + 4, cy - 7.5, cx + 1, cy - 14);

  // ── GLOWING YELLOW EYE-SLITS — the menace anchor. Horizontal
  // slits angled down-inward for angry brow. ──
  // Outer bloom
  g.fillStyle(0xffcc22, 0.45);
  g.fillCircle(cx - 1.5, cy - 10, 2);
  g.fillCircle(cx + 3.5, cy - 10, 2);
  // Slits — bright yellow rects
  g.fillStyle(0xffdd00, 1);
  g.fillRect(cx - 2.5, cy - 10, 2.5, 0.8);
  g.fillRect(cx + 2, cy - 10, 2.5, 0.8);
  // Core glow
  g.fillStyle(0xffffff, 0.85);
  g.fillRect(cx - 2, cy - 10, 1.5, 0.4);
  g.fillRect(cx + 2.5, cy - 10, 1.5, 0.4);

  // ── Angry V-brow above the eyes — angled dark bars. ──
  g.fillStyle(0x1a0602, 1);
  g.fillTriangle(cx - 3, cy - 11.5, cx + 0.5, cy - 11.5, cx - 0.5, cy - 10.5);
  g.fillTriangle(cx + 1.5, cy - 11.5, cx + 5, cy - 11.5, cx + 2.5, cy - 10.5);

  // ── Jagged teeth/maw slash at the bottom of the top cone. ──
  g.fillStyle(0x1a0602, 1);
  g.fillRect(cx - 2, cy - 8, 6, 0.8);
  g.fillStyle(0xffdd00, 0.9);
  g.fillRect(cx - 1.5, cy - 7.8, 0.7, 0.4);
  g.fillRect(cx + 0.5, cy - 7.8, 0.7, 0.4);
  g.fillRect(cx + 2.5, cy - 7.8, 0.7, 0.4);

  // ── Smoke-puff wisps rising off the top cone — "animated". ──
  g.fillStyle(0x8a8a8a, 0.55);
  g.fillCircle(cx, cy - 17, 1.3);
  g.fillStyle(0xaaaaaa, 0.4);
  g.fillCircle(cx + 3, cy - 18, 1);

  g.generateTexture('traffic_cone_totem', s, s);
  g.destroy();
}

/**
 * Edinburgh Ghost Guide — DESIGN_IDEAS section 3 Urban Ghaists #3.
 * Spectral Victorian tour guide silhouette with a lantern. Ranged
 * enemy that keeps distance and lobs projectiles; visually reads as
 * a fluorescent-flicker ghost rather than a solid hench figure.
 */
