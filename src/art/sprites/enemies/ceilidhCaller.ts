/**
 * `ceilidh_caller` — academic apparition who calls the dance from
 * beyond. Design pivot (v2): prior icon was academic robes + gold
 * sash + raised baton — read "generic conductor", no Scottish or
 * ceilidh-specific anchor. Academic robes alone don't separate from
 * orchestra conductor. New pitch: keep the robes + raised-arm calling
 * pose, but add MORTARBOARD (academic anchor), TARTAN SASH diagonal
 * across the chest (Highland dress anchor), FIDDLE BOW in the raised
 * hand (ceilidh music anchor — not a conductor's baton), and OPEN
 * SHOUTING MOUTH (mid-call). The stack of specific tells — Scottish
 * + academic + music-call — now lands in the silhouette.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';
import { HIGHLAND_TARTAN } from '../../kiltPalette';

export const CEILIDH_CALLER_CANVAS_SIZE = 42;

export function drawCeilidhCallerBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = CEILIDH_CALLER_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);

  // Soft violet halo — academic apparition glow
  g.fillStyle(0xb090d0, 0.22);
  g.fillEllipse(cx, cy, 24, 26);
  g.fillStyle(0xb090d0, 0.12);
  g.fillEllipse(cx, cy, 30, 32);

  // Long academic robes — flared and LAYERED. Three stacked colour
  // bands replace the blocky single triangle (audit dislike: "robe
  // shape is blocky"). Outer dark, mid dusk-purple, inner amethyst.
  g.fillStyle(0x12041e, 1);
  g.fillTriangle(cx - 13, cy + 14, cx + 13, cy + 14, cx, cy - 3);
  g.fillStyle(0x1a0828, 1);
  g.fillTriangle(cx - 12, cy + 14, cx + 12, cy + 14, cx, cy - 2);
  g.fillStyle(0x2a1a48, 1);
  g.fillTriangle(cx - 11, cy + 13, cx + 11, cy + 13, cx, cy - 1);
  g.fillStyle(0x4a3068, 1);
  g.fillTriangle(cx - 9, cy + 12, cx + 9, cy + 12, cx, cy);
  // Robe fold streaks — two diagonal slate stripes radiating from
  // the waist outward. Breaks the flat triangle into folded fabric.
  g.fillStyle(0x12041e, 0.85);
  g.fillTriangle(cx - 4, cy + 4, cx - 3, cy + 4, cx - 8, cy + 13);
  g.fillTriangle(cx + 3, cy + 4, cx + 4, cy + 4, cx + 8, cy + 13);
  // Highlight rim either side — top-light catches the cowl edge.
  g.fillStyle(0x6a4080, 0.55);
  g.fillRect(cx - 9, cy, 0.6, 12);
  g.fillRect(cx + 8, cy, 0.6, 12);
  // Footwork ticks — three small lifted-foot strokes at the hem so
  // the caller reads as MID-DANCE not standing still (audit dislike:
  // "could use more dance energy").
  g.fillStyle(0xeebf68, 0.95);
  g.fillRect(cx - 7, cy + 14, 2, 0.6);
  g.fillRect(cx + 5, cy + 14, 2, 0.6);
  g.fillStyle(0xffeeaa, 0.7);
  g.fillTriangle(cx - 9, cy + 15, cx - 7, cy + 14.5, cx - 8, cy + 16.5);
  g.fillTriangle(cx + 7, cy + 15, cx + 9, cy + 14.5, cx + 8, cy + 16.5);
  // Step-dust puff under the trailing foot — implies motion.
  g.fillStyle(0xccbbdd, 0.5);
  g.fillCircle(cx - 9, cy + 16, 1.2);
  g.fillCircle(cx + 9, cy + 16, 1);

  // TARTAN SASH — Highland tartan diagonal across chest (Scottish anchor).
  // From left shoulder down to right hip. Bold — this is the Scottish
  // tell that separates from generic conductor.
  g.fillStyle(HIGHLAND_TARTAN.fieldDark, 1);
  g.fillTriangle(cx - 7, cy - 3, cx - 5, cy - 3, cx + 6, cy + 8);
  g.fillTriangle(cx - 5, cy - 3, cx + 6, cy + 8, cx + 8, cy + 8);
  g.fillStyle(HIGHLAND_TARTAN.field, 1);
  g.fillTriangle(cx - 6.5, cy - 3, cx - 5.5, cy - 3, cx + 6.5, cy + 7.5);
  g.fillTriangle(cx - 5.5, cy - 3, cx + 6.5, cy + 7.5, cx + 7.5, cy + 7.5);
  // Green pinstripes on the sash (tartan cross-weave)
  g.fillStyle(HIGHLAND_TARTAN.stripe, 1);
  g.fillRect(cx - 5, cy - 2, 1, 1);
  g.fillRect(cx - 2, cy + 1, 1, 1);
  g.fillRect(cx + 1, cy + 4, 1, 1);
  g.fillRect(cx + 4, cy + 7, 1, 1);
  // Gold pinstripes
  g.fillStyle(HIGHLAND_TARTAN.accent, 0.9);
  g.fillRect(cx - 3, cy - 1, 0.5, 0.5);
  g.fillRect(cx, cy + 2, 0.5, 0.5);
  g.fillRect(cx + 3, cy + 5, 0.5, 0.5);

  // Gold belt at waist
  g.fillStyle(0xaa7a10, 1);
  g.fillRect(cx - 8, cy + 4, 16, 1.5);
  g.fillStyle(0xffdd55, 1);
  g.fillRect(cx - 8, cy + 4, 16, 0.6);

  // Torso — under the sash
  g.fillStyle(0x2a1a44, 1);
  g.fillEllipse(cx, cy - 1, 11, 8);

  // Head — pale ghost-blue, slightly larger
  g.fillStyle(0x1a0a28, 1);
  g.fillEllipse(cx, cy - 9, 8, 9);
  g.fillStyle(0xccaadd, 1);
  g.fillEllipse(cx, cy - 9, 7, 8);

  // MORTARBOARD — flat academic cap (black diamond slab on top of head)
  // This is the academic anchor.
  g.fillStyle(0x050510, 1);
  g.fillRect(cx - 8, cy - 13, 16, 2);
  g.fillStyle(0x1a1028, 1);
  g.fillRect(cx - 8, cy - 12.5, 16, 1);
  // Cap crown (small rounded top)
  g.fillStyle(0x050510, 1);
  g.fillRect(cx - 4, cy - 15, 8, 3);
  g.fillStyle(0x1a1028, 1);
  g.fillRect(cx - 4, cy - 14.5, 8, 1);
  // Mortarboard TASSEL — gold hanging off right corner
  g.fillStyle(0xaa7a10, 1);
  g.fillRect(cx + 7, cy - 13, 0.8, 4);
  g.fillStyle(0xffdd55, 1);
  g.fillRect(cx + 7, cy - 13, 0.4, 4);
  // Tassel puff
  g.fillStyle(0xffdd55, 1);
  g.fillCircle(cx + 7.4, cy - 8.5, 1);
  g.fillStyle(0xffeeaa, 0.9);
  g.fillCircle(cx + 7.4, cy - 8.5, 0.5);

  // Eyes — commanding violet glow
  g.fillStyle(0x1a0a28, 1);
  g.fillRect(cx - 2.5, cy - 10, 1.5, 1);
  g.fillRect(cx + 1, cy - 10, 1.5, 1);
  g.fillStyle(0xccaadd, 1);
  g.fillRect(cx - 2, cy - 10, 0.5, 0.5);
  g.fillRect(cx + 1.5, cy - 10, 0.5, 0.5);

  // OPEN SHOUTING MOUTH — vertical black oval, mid-call. The caller
  // is mid-bellow ("CROSS HANDS WITH YOUR PARTNER!"). Larger than v2
  // so the voice cue resolves at scale.
  g.fillStyle(0x0a0410, 1);
  g.fillEllipse(cx, cy - 6, 2.2, 3);
  g.fillStyle(0x1a0a28, 1);
  g.fillEllipse(cx, cy - 6, 1.5, 2.2);
  // Teeth glint
  g.fillStyle(0xddccee, 0.9);
  g.fillRect(cx - 0.9, cy - 6.5, 1.8, 0.4);
  // Voice burst — three radial gold dashes leaving the mouth on the
  // left side, escalating in length. Reads as a shouted call (audit
  // dislike: "instrument/voice cue is small").
  g.fillStyle(0xffeeaa, 0.95);
  g.fillRect(cx - 4, cy - 6.4, 1.4, 0.5);
  g.fillRect(cx - 6, cy - 7.6, 1.6, 0.5);
  g.fillRect(cx - 6, cy - 5.2, 1.6, 0.5);
  g.fillStyle(0xffd070, 0.7);
  g.fillRect(cx - 8, cy - 6.4, 1.4, 0.4);

  // Academic moustache — thin grey
  g.fillStyle(0xaaa0c0, 1);
  g.fillRect(cx - 2, cy - 7.5, 4, 0.8);

  // RAISED ARM — bold forearm going up-right, ending in a fist
  // gripping a FIDDLE BOW held high (not a conductor's baton).
  // Shoulder
  g.fillStyle(0x2a1a44, 1);
  g.fillRect(cx + 3, cy - 4, 3, 2);
  // Upper arm
  g.fillRect(cx + 4, cy - 8, 3, 4);
  g.fillStyle(0x4e3070, 1);
  g.fillRect(cx + 4, cy - 8, 2, 3);
  // Forearm
  g.fillStyle(0x2a1a44, 1);
  g.fillRect(cx + 6, cy - 13, 3, 5);
  g.fillStyle(0x4e3070, 1);
  g.fillRect(cx + 6, cy - 13, 2, 4);
  // Hand / fist
  g.fillStyle(0xccaadd, 1);
  g.fillCircle(cx + 8, cy - 13, 1.5);

  // FIDDLE BOW — long wooden stick with bright horsehair strip. The
  // ceilidh-music anchor (not a conductor's baton).
  // Stick
  g.fillStyle(0x3a1a06, 1);
  g.fillRect(cx + 8, cy - 19, 0.8, 6);
  g.fillStyle(0x5a2a10, 1);
  g.fillRect(cx + 8, cy - 19, 0.4, 6);
  // Horsehair — thick cream strip below the stick
  g.fillStyle(0xf0e4c0, 1);
  g.fillRect(cx + 8.8, cy - 19, 0.8, 6);
  g.fillStyle(0xfff6d4, 0.85);
  g.fillRect(cx + 8.8, cy - 19, 0.4, 6);
  // Bow frog (tip at bottom)
  g.fillStyle(0x2a0a04, 1);
  g.fillRect(cx + 7.5, cy - 13.5, 1.8, 1);
  // Bow tip silver
  g.fillStyle(0xaaaaaa, 1);
  g.fillRect(cx + 8, cy - 19.5, 1, 0.8);

  // Opposite arm — curved down and across (dance-instructing pose).
  // Slightly thicker so the hand reads better at scale.
  g.fillStyle(0x2a1a44, 1);
  g.fillRect(cx - 7, cy - 2, 2.4, 6);
  g.fillRect(cx - 8, cy + 3, 3.2, 3);
  g.fillStyle(0x4e3070, 1);
  g.fillRect(cx - 7, cy - 2, 1, 6);
  g.fillStyle(0xccaadd, 1);
  g.fillCircle(cx - 8, cy + 5, 1.5);
  // Pointing finger detail — small dark line poking forward, sells
  // the "instructing the dance" gesture.
  g.fillStyle(0x8a6aaa, 1);
  g.fillRect(cx - 9.5, cy + 4.6, 1.2, 0.6);
  // Motion arc behind the dance arm — a thin curved band of three
  // dots showing the swing of the gesture (audit dislike: "could use
  // more dance energy").
  g.fillStyle(0xccaadd, 0.75);
  g.fillCircle(cx - 11, cy + 1, 0.7);
  g.fillStyle(0xccaadd, 0.5);
  g.fillCircle(cx - 12, cy + 4, 0.6);
  g.fillStyle(0xccaadd, 0.32);
  g.fillCircle(cx - 12, cy + 8, 0.5);

  // Music-note sparkles — burst radiating from the bow tip, in an arc
  g.fillStyle(0xffeeaa, 1);
  g.fillCircle(cx + 11, cy - 18, 1);
  g.fillStyle(0xffd0e0, 0.9);
  g.fillCircle(cx + 13, cy - 15, 0.8);
  g.fillStyle(0xffeeaa, 0.7);
  g.fillCircle(cx + 14, cy - 12, 0.6);
  g.fillStyle(0xffd0e0, 0.55);
  g.fillCircle(cx + 15, cy - 9, 0.5);
  // Four-point star at bow tip
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx + 11, cy - 20, 0.6, 1.5);
  g.fillRect(cx + 10.4, cy - 19.3, 1.5, 0.6);

}

export function bakeCeilidhCaller(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawCeilidhCallerBody(g);
  g.generateTexture('ceilidh_caller', CEILIDH_CALLER_CANVAS_SIZE, CEILIDH_CALLER_CANVAS_SIZE);
  g.destroy();
}

/**
 * Tome Wraith — DESIGN_IDEAS section 3 Academic #2. Floating open
 * book with torn pages orbiting the volume; a faint ghostly face
 * rises between the pages. "Scroll-unfurl telegraph" lives in the
 * visual — the existing `ranged` AI carries the projectile cadence.
 */
