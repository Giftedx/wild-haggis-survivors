/**
 * `beithir` — Argyll viper-style serpent of Highland folklore. Slow
 * stalker that fires a venom-fang projectile (Race the Beithir
 * mechanic, DESIGN_IDEAS §1). SCOTTISH_RESEARCH §1.2.
 *
 * Sprite priorities (per kelpie's detail-budget rule of thumb —
 * nothing under 2px survives 48px combat):
 *   1. Coiled-low silhouette — distinct from the rest of the cryptid
 *      family (kelpie equine, barghest hound, blue man humanoid).
 *      Rendered as a flattened S-curve so the head + tail are both
 *      readable from above.
 *   2. Glowing amber-green eye — the signature tell. Same anchor-
 *      point trick as kelpie's cyan eye.
 *   3. Open jaw with ivory fangs — the threat tell. The fangs are
 *      the *what hurts you* of the silhouette; emphasise them.
 *   4. Bronze scale glints — three to five 1.5–2px copper accents
 *      along the spine for the venom-coiled-by-firelight read.
 *   5. Forked tongue — single dark crimson triangle past the jaw,
 *      sells the snake-not-eel read at glance.
 *
 * Palette:
 *   - Body shadow:    0x18261c  (almost-black moss)
 *   - Body mid:       0x33442e  (deep moss-green — Wild palette per
 *                                ART_STYLE_BIBLE; reads against
 *                                heather/pine without blending in)
 *   - Body highlight: 0x6a8a4a  (sun-bleached green-bronze)
 *   - Scale glint:    0xb88a4a  (dark copper — venom warning)
 *   - Eye glow:       0xe8c060  (amber-green — sister to kelpie's
 *                                cyan eye, but warm-coded for venom)
 *   - Fangs:          0xf4ecd8  (ivory)
 *   - Tongue:         0x8a2030  (deep crimson)
 *   - Underglow:      0x88aa44 with 0.2 alpha (subtle venom hum)
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const BEITHIR_CANVAS_SIZE = 48;

export function drawBeithirBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = BEITHIR_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 6 + (frame.breathY ?? 0);

  // ── Venom underglow — the "this is poison, not just teeth" cue. ──
  g.fillStyle(0x88aa44, 0.20);
  g.fillEllipse(cx, cy + 4, 40, 16);
  g.fillStyle(0xb8c870, 0.12);
  g.fillEllipse(cx, cy + 4, 28, 10);

  // ── Tail — coil sweeping back-left, drawn as a chain of 4 dark
  //   ovals shrinking to a point. ──
  g.fillStyle(0x18261c, 1);
  g.fillEllipse(cx - 16, cy + 1, 8, 6);
  g.fillEllipse(cx - 11, cy + 3, 9, 7);
  g.fillStyle(0x33442e, 1);
  g.fillEllipse(cx - 15, cy + 0, 6, 4);
  g.fillEllipse(cx - 10, cy + 2, 7, 5);

  // ── Body — flattened S-curve. Drawn as three overlapping ellipses
  //   (rear coil, mid coil, neck) so the snake reads as a serpent
  //   not a worm. ──
  g.fillStyle(0x18261c, 1);
  g.fillEllipse(cx - 6, cy + 2, 18, 10);
  g.fillEllipse(cx + 4, cy - 1, 18, 10);
  g.fillEllipse(cx + 11, cy - 5, 12, 8);

  g.fillStyle(0x33442e, 1);
  g.fillEllipse(cx - 6, cy + 1, 15, 8);
  g.fillEllipse(cx + 4, cy - 2, 15, 8);
  g.fillEllipse(cx + 11, cy - 6, 9, 6);

  // ── Spine highlight — narrow band along the top of the coil for
  //   edge definition against dark heather/stone terrain. ──
  g.fillStyle(0x6a8a4a, 0.6);
  g.fillEllipse(cx - 6, cy - 1, 12, 2);
  g.fillEllipse(cx + 4, cy - 4, 12, 2);

  // ── Bronze scale glints — the venom warning. Five 2px copper
  //   accents along the spine; reads as "do not touch" at speed. ──
  g.fillStyle(0xb88a4a, 0.95);
  g.fillRect(cx - 11, cy - 1, 2, 2);
  g.fillRect(cx - 5, cy - 2, 2, 2);
  g.fillRect(cx + 1, cy - 3, 2, 2);
  g.fillRect(cx + 7, cy - 4, 2, 2);
  g.fillRect(cx + 13, cy - 6, 2, 2);

  // ── Head — wedge shape rising forward from the front coil. Two
  //   layers (dark base + mid) like every other cryptid head. ──
  g.fillStyle(0x18261c, 1);
  g.fillTriangle(cx + 17, cy - 8, cx + 8, cy - 7, cx + 17, cy - 2);
  g.fillStyle(0x33442e, 1);
  g.fillTriangle(cx + 16, cy - 7, cx + 9, cy - 6, cx + 16, cy - 3);

  // ── Open jaw — small black triangle below the head, exposes the
  //   fangs. The "I am about to bite" tell. ──
  g.fillStyle(0x000000, 1);
  g.fillTriangle(cx + 17, cy - 4, cx + 13, cy - 4, cx + 16, cy);

  // ── Fangs — two ivory triangles dropping from the upper jaw. The
  //   most important silhouette anchor after the eye. ──
  g.fillStyle(0xf4ecd8, 1);
  g.fillTriangle(cx + 14, cy - 4, cx + 13, cy - 4, cx + 13.5, cy - 1.5);
  g.fillTriangle(cx + 16, cy - 4, cx + 15, cy - 4, cx + 15.5, cy - 1.5);

  // ── Forked tongue — single dark crimson triangle slipping out
  //   past the jaw. Sells "snake, not lizard". ──
  g.fillStyle(0x8a2030, 1);
  g.fillTriangle(cx + 15, cy - 1, cx + 19, cy + 0, cx + 15, cy + 1);
  g.fillRect(cx + 18, cy - 0.5, 2, 0.5);
  g.fillRect(cx + 18, cy + 0.5, 2, 0.5);

  // ── Eye — THE signature tell. Black socket + amber-green core +
  //   bright highlight. Sister to kelpie's cyan eye but warm-coded
  //   for venom. ──
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx + 13, cy - 6, 1.8);
  g.fillStyle(0xe8c060, 1);
  g.fillCircle(cx + 13, cy - 6, 1.2);
  g.fillStyle(0xf8e4a0, 1);
  g.fillCircle(cx + 12.7, cy - 6.3, 0.6);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx + 12.6, cy - 6.4, 0.3);

  // ── Ground shadow — single dark ellipse so the serpent feels
  //   coiled on the ground rather than floating. ──
  g.fillStyle(0x080a08, 0.45);
  g.fillEllipse(cx, cy + 7, 30, 4);
}

export function bakeBeithir(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawBeithirBody(g);
  g.generateTexture('beithir', BEITHIR_CANVAS_SIZE, BEITHIR_CANVAS_SIZE);
  g.destroy();
}
