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
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const TRAFFIC_CONE_TOTEM_CANVAS_SIZE = 44;

/**
 * Draw the bound-cone totem body into `g` at the per-frame offset.
 *
 * `frame.breathY` bobs the whole stack (idle strain / dying topple);
 * `frame.bodyX` shifts it sideways (hurt flinch / topple lean). No legs —
 * a stack of cones has no gait, so leftLegY/rightLegY are unused.
 */
export function drawTrafficConeTotemBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = TRAFFIC_CONE_TOTEM_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 4 + (frame.breathY ?? 0);

  // ── Faint orange menace glow behind the whole totem. Kept as an
  // oval so it supports the silhouette instead of becoming the sprite.
  g.fillStyle(0xff4400, 0.12);
  g.fillEllipse(cx, cy + 1, 30, 34);

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
  g.fillTriangle(cx - 13, cy + 13, cx + 13, cy + 13, cx, cy + 1);
  g.fillStyle(0x8a3a08, 1);
  g.fillTriangle(cx - 12, cy + 12.5, cx + 12, cy + 12.5, cx, cy + 2);
  g.fillStyle(0xdd5a10, 1);
  g.fillTriangle(cx - 11, cy + 12, cx + 11, cy + 12, cx, cy + 3);
  // Reflective bands — bolder than before
  g.fillStyle(0xffe6cc, 1);
  g.fillRect(cx - 8, cy + 6, 16, 1.2);
  g.fillRect(cx - 7, cy + 10, 14, 1.2);
  // Scuff damage — angular dent-shadows
  g.fillStyle(0x3a1004, 0.85);
  g.fillRect(cx - 5, cy + 8, 3, 1);
  g.fillRect(cx + 2, cy + 10, 3, 1);
  g.fillRect(cx - 6, cy + 11, 2, 0.8);
  // BASE-CONE WEATHERING CRACK — a forked split running from the
  // rim upward, dark shadow + hairline highlight, sells "battered".
  g.fillStyle(0x1a0602, 1);
  g.fillRect(cx + 4, cy + 8, 0.8, 5);
  g.fillRect(cx + 4.4, cy + 6.5, 0.6, 1.7);
  g.fillRect(cx + 5.2, cy + 9.5, 0.6, 2.4);
  g.fillStyle(0xff8a40, 0.45);
  g.fillRect(cx + 4.9, cy + 8, 0.3, 5);

  // ── Binding ropes — thicker dark cord wraps across the junction
  // between lower and middle cones. "Someone tied this together". ──
  g.fillStyle(0x1a0a04, 1);
  g.fillRect(cx - 9, cy + 1.2, 18, 2);
  g.fillStyle(0x5a3818, 1);
  g.fillRect(cx - 9, cy + 1.2, 18, 0.7);
  g.fillStyle(0x8a6028, 1);
  g.fillRect(cx - 9, cy + 1.4, 18, 0.3);
  // Rope twist striations — small ticks every couple px.
  g.fillStyle(0x2a1808, 1);
  for (let rx = -8; rx < 8; rx += 2) {
    g.fillRect(cx + rx, cy + 1.6, 0.8, 1.4);
  }
  // Diagonal cross-bindings over the front make the stack feel bound
  // and animate-able instead of a clean roadside pile.
  g.lineStyle(1.3, 0x2a1808, 1);
  g.lineBetween(cx - 8, cy + 4, cx + 7, cy - 5);
  g.lineBetween(cx + 8, cy + 4, cx - 7, cy - 5);
  g.lineStyle(0.7, 0xc08030, 0.85);
  g.lineBetween(cx - 7, cy + 3.4, cx + 6, cy - 4.4);
  g.lineBetween(cx + 7, cy + 3.4, cx - 6, cy - 4.4);
  // Knot lumps at each end — bigger, three-tone.
  g.fillStyle(0x1a0a04, 1);
  g.fillCircle(cx - 9, cy + 2, 1.6);
  g.fillCircle(cx + 9, cy + 2, 1.6);
  g.fillStyle(0x5a3818, 1);
  g.fillCircle(cx - 9, cy + 1.7, 1.0);
  g.fillCircle(cx + 9, cy + 1.7, 1.0);

  // ── Middle cone. ──
  g.fillStyle(0x5a1e04, 1);
  g.fillTriangle(cx - 8, cy + 2, cx + 8, cy + 2, cx, cy - 8);
  g.fillStyle(0x8a3a08, 1);
  g.fillTriangle(cx - 7.5, cy + 1.5, cx + 7.5, cy + 1.5, cx, cy - 7.5);
  g.fillStyle(0xdd5a10, 1);
  g.fillTriangle(cx - 7, cy + 1, cx + 7, cy + 1, cx, cy - 7);
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
  g.lineStyle(1, 0x2a1808, 0.95);
  g.lineBetween(cx - 6.2, cy, cx + 4.8, cy - 6);
  g.lineBetween(cx + 6.2, cy, cx - 4.8, cy - 6);
  g.lineStyle(0.55, 0xc08030, 0.9);
  g.lineBetween(cx - 5.6, cy - 0.3, cx + 4.2, cy - 5.6);
  g.lineBetween(cx + 5.6, cy - 0.3, cx - 4.2, cy - 5.6);
  // Two small reflector charms hang from the cord like warning teeth.
  g.fillStyle(0x331000, 1);
  g.fillTriangle(cx - 4, cy - 1, cx - 2, cy - 1, cx - 3, cy + 1.5);
  g.fillTriangle(cx + 2, cy - 1, cx + 4, cy - 1, cx + 3, cy + 1.5);
  g.fillStyle(0xffe6cc, 1);
  g.fillRect(cx - 3.5, cy - 0.7, 1, 1);
  g.fillRect(cx + 2.5, cy - 0.7, 1, 1);

  // ── TOP CONE — slightly larger than before, this is the HEAD.
  // Tilted forward so the face aims at the player. Darker weathered
  // orange to differentiate from the body cones. ──
  g.fillStyle(0x4a1604, 1);
  g.fillTriangle(cx - 6, cy - 7, cx + 6, cy - 7, cx + 1, cy - 16);
  g.fillStyle(0x7a2a06, 1);
  g.fillTriangle(cx - 5.5, cy - 7, cx + 5.5, cy - 7, cx + 1, cy - 15.5);
  g.fillStyle(0xba4808, 1);
  g.fillTriangle(cx - 5, cy - 7.5, cx + 5, cy - 7.5, cx + 1, cy - 15);

  // ── GLOWING YELLOW EYE-SLITS — the menace anchor. Brighter
  // bloom + asymmetric eye-light positions ("parallax tilt") to
  // imply the head-cone leans forward toward the player. ──
  // Outer bloom (hotter, larger)
  g.fillStyle(0xffee44, 0.55);
  g.fillCircle(cx - 2, cy - 10.5, 2.6);
  g.fillCircle(cx + 3.5, cy - 10.5, 2.6);
  g.fillStyle(0xff8a10, 0.30);
  g.fillCircle(cx - 2, cy - 10.5, 3.4);
  g.fillCircle(cx + 3.5, cy - 10.5, 3.4);
  // Slits — bright yellow rects, slightly thicker.
  g.fillStyle(0xffee44, 1);
  g.fillRect(cx - 2.7, cy - 10, 2.8, 1.0);
  g.fillRect(cx + 1.9, cy - 10, 2.8, 1.0);
  // Core glow — hot inner pinprick. Offset inside each slit so the
  // gaze "tilts" toward the same point in front of the totem.
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 1.0, cy - 10, 1.4, 0.5);
  g.fillRect(cx + 2.4, cy - 10, 1.4, 0.5);
  // Pupil-glints — tiny white pricks placed asymmetrically (left
  // eye glint sits right-of-centre, right eye glint sits left-of-
  // centre) so both pupils converge forward = parallax tilt.
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 0.5, cy - 9.7, 0.4);
  g.fillCircle(cx + 2.6, cy - 9.7, 0.4);

  // ── Angry V-brow above the eyes — angled dark bars. ──
  g.fillStyle(0x1a0602, 1);
  g.fillTriangle(cx - 3, cy - 11.5, cx + 0.5, cy - 11.5, cx - 0.5, cy - 10.5);
  g.fillTriangle(cx + 1.5, cy - 11.5, cx + 5, cy - 11.5, cx + 2.5, cy - 10.5);
  // Broken crown lip on the cone head gives the top a hostile, chipped
  // silhouette instead of a perfect road cone triangle.
  g.fillStyle(0x1a0602, 1);
  g.fillTriangle(cx - 1, cy - 15.2, cx + 1, cy - 18.5, cx + 2.2, cy - 14.8);
  g.fillStyle(0xff8a30, 0.9);
  g.fillTriangle(cx - 0.4, cy - 15.2, cx + 1, cy - 17.1, cx + 1.4, cy - 15);

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
  g.fillStyle(0xffeeaa, 0.45);
  g.fillCircle(cx - 3, cy - 17.5, 0.8);
}

export function bakeTrafficConeTotem(scene: Phaser.Scene): void {
  const s = TRAFFIC_CONE_TOTEM_CANVAS_SIZE;
  const g = scene.add.graphics();
  drawTrafficConeTotemBody(g);
  g.generateTexture('traffic_cone_totem', s, s);
  g.destroy();
}

/**
 * Edinburgh Ghost Guide — DESIGN_IDEAS section 3 Urban Ghaists #3.
 * Spectral Victorian tour guide silhouette with a lantern. Ranged
 * enemy that keeps distance and lobs projectiles; visually reads as
 * a fluorescent-flicker ghost rather than a solid hench figure.
 */
